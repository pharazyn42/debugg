// Debuggit Ltd: switching the studio on, desk jobs, the Director's languages,
// the studio engine, the contract board, pausing, closing, importing old saves and the
// /studio/ redirect.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openAt, fresh, withStorage, puzzleFor, guess, readJson } = require('./helpers');

const at = (h, m = 0) => new Date(2026, 9, 7, h, m, 0);  // Day 3, a Wednesday
const ltd = page => readJson(page, 'debuggit-ltd-save');

// Opens the Ltd tab and starts a company there.
async function found(page){
  await page.click('#ltdTab');
  await page.click('#ltdLink');
  await expect(page.locator('#statMoney')).toBeVisible();
}
// Desk jobs: the questions a job would ask, and answering one (right or wrong) in the desk player.
const deskQuestions = page => page.evaluate(() => [...DebuggDesk.all(Debugg.today()).values()]);
async function answerDesk(page, q, right){
  if(q.kind === 'choice'){
    const o = q.options.find(x => !!x.correct === right);
    await page.evaluate(t => [...document.querySelectorAll('.desk-option')].find(b => b.dataset.text === t).click(), o.text);
  }else if(q.kind === 'line'){
    await page.click('.desk-line[data-line="' + (right ? q.line : (q.line === 1 ? 2 : 1)) + '"]');
  }else{
    await page.fill('.desk-input', right ? q.answers[0] : 'definitely not it');
    await page.click('.desk-check');
  }
  await expect(page.locator('.desk-feedback')).toHaveClass(right ? /right/ : /wrong/);
  await page.click('.desk-go');
}
// The desk is a window, opened from the Studio box's button (or by clicking yourself in the office).
async function openDesk(page){
  if(!(await page.locator('#deskModal').isVisible())) await page.click('[data-action=open-desk]');
  await expect(page.locator('#deskModal')).toBeVisible();
}
// Replaces the desk's jobs with one asking these questions (and no more arriving for a while).
async function setDeskJob(page, questions){
  await page.evaluate(ids => {
    if(window.DebuggLtd) window.DebuggLtd.stop();
    const s = JSON.parse(localStorage.getItem('debuggit-ltd-save'));
    s.desk.jobs = [{ id: 'dj1', size: ids.length, questions: ids, answered: [], expiresAt: Date.now() + 3600000 }];
    s.desk.nextAt = Date.now() + 3600000;
    localStorage.setItem('debuggit-ltd-save', JSON.stringify(s));
  }, questions.map(q => q.id));
  await page.reload();
  await openDesk(page);
  await expect(page.locator('[data-action=desk-start][data-job=dj1]')).toBeVisible();
}

// Graduates apply rather than being hired at will: brings one in (asking `cost`) and hires them.
async function hireGrad(page, cost = 180){
  await editCompany(page, (s, c) => {
    s.applicants = [{ id: 'ga1', role: 'Graduate', cost: c, expiresAt: Date.now() + 3600000,
                      person: { id: 'ga1', name: 'Gus A.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } } }];
  }, cost);
  await openCandidate(page, 'ga1');
  await page.click('#candidateModalBody [data-action=hire-applicant][data-id=ga1]');
  await expect(page.locator('#candidateModal')).toBeHidden();
  await expect(page.locator('.applicant-link[data-id=ga1]')).toHaveCount(0);
}

// Edits the saved company, then reloads.
async function editCompany(page, fn, arg){
  await page.evaluate(([src, arg]) => {
    if(window.DebuggLtd) window.DebuggLtd.stop();  // so the running page can't save over the edit
    const s = JSON.parse(localStorage.getItem('debuggit-ltd-save'));
    new Function('s', 'arg', src)(s, arg);
    localStorage.setItem('debuggit-ltd-save', JSON.stringify(s));
  }, ['(' + fn.toString() + ')(s, arg)', arg === undefined ? null : arg]);
  await page.reload();
  await expect(page.locator('#statMoney')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', d => d.accept());
  await openAt(page, 'index.html#python');
  await fresh(page);
});

test('off by default: the studio code is not even loaded', async ({ page }) => {
  expect(await page.evaluate(() => typeof window.DebuggLtd)).toBe('undefined');
  await expect(page.locator('body')).not.toHaveClass(/ltd-on/);
  await expect(page.locator('#foundCard')).toBeHidden();
  await page.click('#revealBtn');
  await expect(page.locator('#foundCard')).toBeVisible();
  await page.click('#foundBtn');
  await expect(page.locator('body')).toHaveClass(/ltd-on/);
  // Starting it here moves to the Ltd tab.
  await expect(page).toHaveURL(/index\.html\?ltd#python$/);
  await expect(page.locator('#ltdTab')).toHaveAttribute('aria-current', 'page');
  // The header's title is the studio's, the same as its button at the top.
  await expect(page.locator('#wordmark')).toHaveText('debuggit.ltd()');
  await expect(page.locator('#wordmark')).toHaveAttribute('href', 'index.html?ltd');
  await expect(page.locator('#ltdTab')).toHaveText('debuggit.ltd() (demo)');
});

test("a new company starts with ¤250 and no XP, whatever the daily puzzle has paid out", async ({ page }) => {
  await withStorage(page, { 'debuggit-daily-xp': { python: 5000, javascript: 120 } });
  await found(page);
  await expect(page.locator('#statMoney')).toHaveText('¤250');
  await expect(page.locator('#welcomeToast')).not.toContainText('founder');
  expect((await ltd(page)).xp).toEqual({});
});

test('the daily puzzle is its own game: it pays the company nothing, and the Ltd tab shows the desk instead', async ({ page }) => {
  await found(page);
  await expect(page.locator('main.desk')).toBeHidden();
  // The desk is a window now, opened from the Studio box or by clicking yourself in the office.
  await expect(page.locator('#deskModal')).toBeHidden();
  await openDesk(page);
  await expect(page.locator('#ltdDesk h2')).toContainText('Your desk');
  await page.keyboard.press('Escape');
  await expect(page.locator('#deskModal')).toBeHidden();
  // A new company's first desk job is waiting straight away.
  await expect(page.locator('.desk-job')).toHaveCount(1);
  // On the Daily tab the company isn't loaded, and a solve pays it nothing.
  await page.click('#dailyTab');
  expect(await page.evaluate(() => typeof window.DebuggLtd)).toBe('undefined');
  await expect(page.locator('#ltdNote')).toHaveText('Your company is running, with 1 desk job waiting. Open Ltd →');
  await guess(page, (await puzzleFor(page, 3)).display);
  expect((await ltd(page)).money).toBe(250);
  expect((await ltd(page)).paid).toBeUndefined();
});

test('desk jobs pay for each right answer, with a bonus for getting them all', async ({ page }) => {
  await found(page);
  const qs = await deskQuestions(page);
  const daily = qs.find(q => q.source === 'daily' && q.difficulty === 3);
  const learn = qs.find(q => q.source === 'learn' && q.kind === 'choice');
  expect(daily && learn).toBeTruthy();
  // A day-3 difficulty puzzle pays ¤70 and a Learn question ¤40; both right, ×1.25.
  await setDeskJob(page, [daily, learn]);
  await expect(page.locator('.desk-job')).toContainText('2 questions · up to ¤138');
  await openDesk(page);
  await page.click('[data-action=desk-start][data-job=dj1]');
  await expect(page.locator('.desk-q-num')).toHaveText('Question 1 of 2');
  await answerDesk(page, daily, true);
  // Answers are saved as they're given: a reload carries on from the next question.
  await page.reload();
  await expect(page.locator('.desk-job')).toContainText('1 answered');
  await openDesk(page);
  await page.click('[data-action=desk-start][data-job=dj1]');
  await expect(page.locator('.desk-q-num')).toHaveText('Question 2 of 2');
  await answerDesk(page, learn, true);
  await expect(page.locator('#deskDone')).toContainText('Desk job: 2 of 2 right, ¤138 (with the ×1.25 bonus for getting them all) and +2 reputation, +24 XP.');
  expect((await ltd(page)).money).toBe(250 + 138);
  // 6 XP × difficulty (3 and 1), kept per language.
  const gained = {};
  [daily, learn].forEach(q => { gained[q.lang] = (gained[q.lang] || 0) + 6 * q.difficulty; });
  expect((await ltd(page)).xp).toEqual(gained);
  expect((await ltd(page)).desk).toMatchObject({ jobs: [], done: 1 });
  expect((await ltd(page)).desk.seen).toEqual([daily.id, learn.id]);
  const xpBefore = JSON.stringify((await ltd(page)).xp);

  // One wrong: only the right one pays, with no bonus.
  await setDeskJob(page, [daily, learn]);
  await openDesk(page);
  await page.click('[data-action=desk-start][data-job=dj1]');
  await answerDesk(page, daily, false);
  await answerDesk(page, learn, true);
  await expect(page.locator('#deskDone')).toContainText('Desk job: 1 of 2 right, ¤40 and +1 reputation, +6 XP.');
  // A wrong answer earns no XP: only the right Learn question added its 6.
  const after = (await ltd(page)).xp;
  expect(after[learn.lang] - JSON.parse(xpBefore)[learn.lang]).toBe(6);
  expect(after[daily.lang] - JSON.parse(xpBefore)[daily.lang]).toBe(daily.lang === learn.lang ? 6 : 0);
  // Every kind of question plays: typed, choice and tap the line.
  for(const kind of ['typed', 'line']){
    const q = qs.find(x => x.kind === kind);
    await setDeskJob(page, [q]);
    await openDesk(page);
  await page.click('[data-action=desk-start][data-job=dj1]');
    await answerDesk(page, q, true);
    await expect(page.locator('#deskDone')).toContainText('1 of 1 right');
  }
});

test('desk jobs turn up about every hour, while you’re away too, up to 3, and expire', async ({ page }) => {
  await found(page);
  await expect(page.locator('.desk-job')).toHaveCount(1);
  // Five hours away: jobs kept turning up, but only 3 wait at once, and an old one has expired.
  await editCompany(page, s => {
    const h = 3600000;
    s.desk.jobs = [{ id: 'old', size: 1, questions: s.desk.jobs[0].questions, answered: [], expiresAt: Date.now() - 6 * h }];
    s.desk.nextAt = Date.now() - 5 * h;
  });
  // Every 45–90 minutes, each lasting 4 hours, so 2 or 3 are waiting.
  await openDesk(page);
  await expect(page.locator('.desk-job').nth(1)).toBeVisible();
  const desk = (await ltd(page)).desk;
  expect(desk.jobs.length).toBeGreaterThanOrEqual(2);
  expect(desk.jobs.length).toBeLessThanOrEqual(3);
  expect(desk.jobs.map(j => j.id)).not.toContain('old');
  const now = await page.evaluate(() => Date.now());   // the page's fixed clock, not this process's
  expect(desk.jobs.every(j => j.expiresAt > now && j.size >= 1 && j.size <= 3)).toBe(true);
  expect(desk.nextAt).toBeGreaterThan(now);
  // No question is asked twice across waiting jobs.
  const ids = desk.jobs.flatMap(j => j.questions);
  expect(new Set(ids).size).toBe(ids.length);
  await expect(page.locator('#deskCount')).toHaveText(desk.jobs.length + ' waiting');
});

test("the Director's puzzle levels boost contract success in that language", async ({ page }) => {
  await found(page);
  await editCompany(page, s => { s.xp = { python: 450 }; });  // Python level 3: +2%
  await openPerson(page, 'director');
  await expect(page.locator('#personModalBody')).toContainText('Python Lv 3 (+2% success)');
  await page.keyboard.press('Escape');
  await editCompany(page, s => {
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.contractsOpen = true; s.firstClient = true;
    s.board.push({ id: 'o1', tier: 1, lang: 'Python', sloc: 600, expiresAt: Date.now() + 3600000 });
  });
  await page.click('[data-action=staff][data-offer=o1]');
  await page.click('[data-pick=g1]');
  // A graduate's 70% reliability, +1% for 1 bar of Python, plus the Director's 2%.
  await expect(page.locator('.forecast')).toContainText('Success chance 73% (incl. +2% from your Python level)');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job')).toHaveCount(1);
});

test('hiring, and contracts finishing while you are away', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  // ¤250, less a graduate's ¤180.
  await expect(page.locator('#statMoney')).toHaveText('¤250');
  await hireGrad(page);
  await expect(page.locator('#statMoney')).toHaveText('¤70');
  await expect(page.locator('#statHeads')).toHaveText('2');
  await editCompany(page, s => {
    const g = s.roster.find(p => p.role === 'Graduate');
    g.lang = { Python: 10 };
    s.roster.forEach(p => { p.pace = 1; });
    s.jobs.push({ id: 'j1', tier: 0, lang: 'Python', sloc: 5, teamSloc: 5, team: [g.id],
                  startedAt: Date.now(), endsAt: Date.now() + 60000, chance: 1, payout: 20, repeat: false,
                  status: 'running', attempt: 1 });
  });
  await page.clock.setFixedTime(at(12, 30));
  await page.reload();
  // 30 minutes of a ¤2/min salary, plus the ¤20 contract, plus the intern's everyday work
  // (0.2 SLOC/min × ¤0.54 × 30 minutes = ¤3.24).
  await expect(page.locator('#statMoney')).toHaveText('¤33');
  await expect(page.locator('#welcomeToast')).toContainText('1 contract wrapped up while you were away');
  await expect(page.locator('#log')).toContainText('delivered');
});

test('hiring costs only go up, with inflation and competition', async ({ page }) => {
  await found(page);
  await page.click('[data-action=open-jobs]');
  const post = page.locator('[data-action=post-job][data-role=Manager]');
  await expect(post).toContainText('¤90');     // a tenth of the ¤900 hire cost
  await page.keyboard.press('Escape');
  const nextAt = (await ltd(page)).market.nextAt - await page.evaluate(() => Date.now());
  expect(nextAt).toBeGreaterThanOrEqual(12 * 3600000 - 60000);
  expect(nextAt).toBeLessThanOrEqual(36 * 3600000);
  // A rival hiring managers has pushed their price up by half.
  await editCompany(page, s => { s.market.prices.Manager = 1.5; s.money = 2000; s.office = { premises: 'unit-s', owned: true }; });
  await page.click('[data-action=open-jobs]');
  await expect(post).toContainText('¤135');    // a tenth of ¤1,350
  await post.click();
  await expect(page.locator('#statMoney')).toHaveText('¤1,865');
  await page.keyboard.press('Escape');
  // A move that's due happens on load, and is logged; prices never fall.
  await editCompany(page, s => { s.market.nextAt = Date.now() - 1000; });
  await expect(page.locator('#log')).toContainText(/Inflation: every hire costs|Competition: a rival studio is hiring/);
  const prices = (await ltd(page)).market.prices;
  expect(Object.values(prices).some(m => m > 1)).toBe(true);
  expect(Object.values(prices).every(m => m >= 1)).toBe(true);
  expect(prices.Manager).toBeGreaterThanOrEqual(1.5);
});

test('developers apply now and then, graduates too, once the studio has some reputation; there are no hire buttons in the Studio box', async ({ page }) => {
  await found(page);
  await expect(page.locator('[data-action=hire]')).toHaveCount(0);
  await expect(page.locator('[data-action=open-jobs]')).toHaveCount(1);
  await expect(page.locator('#applicants')).toContainText('Nobody’s applied yet');
  await expect(page.locator('#applicants')).toContainText('Graduates and juniors apply once the studio has 5 reputation; ' +
    'seniors apply once the studio has 500 reputation; principals apply once the studio has 5,000 reputation (you have 0)');
  // With no reputation, nobody's on the way.
  expect((await ltd(page)).nextApplicantAt).toBe(0);
  await editCompany(page, s => { s.nextApplicantAt = Date.now() - 1000; });
  expect((await ltd(page)).applicants).toHaveLength(0);

  // At 5 reputation the first comes within the hour.
  await editCompany(page, s => { s.reputation = 5; s.nextApplicantAt = 0; });
  const now = await page.evaluate(() => Date.now());
  expect((await ltd(page)).nextApplicantAt - now).toBe(3600000);
  await expect(page.locator('#applicants')).not.toContainText('Graduates and juniors apply');

  // Someone applies, asking the market price ± a little: the very first is always a graduate.
  await editCompany(page, s => { s.money = 5000; s.nextApplicantAt = Date.now() - 1000; });
  const saved = await ltd(page);
  expect(saved.applicants).toHaveLength(1);
  const a = saved.applicants[0];
  expect(a.role).toBe('Graduate');
  expect(saved.hadApplicant).toBe(true);
  const base = 180;
  expect(a.cost).toBeGreaterThanOrEqual(base * 0.9 - 5);
  expect(a.cost).toBeLessThanOrEqual(base * 1.2 + 5);
  expect(saved.nextApplicantAt - now).toBeGreaterThanOrEqual(8 * 3600000 - 1000);
  await expect(page.locator('#log')).toContainText('applied to join as a ' + a.role.toLowerCase());
  await openCandidate(page, a.id);
  await expect(page.locator('#candidateModalBody')).toContainText('Offer open 12h');
  await page.locator('#candidateModalBody [data-action=hire-applicant]').click();
  await expect(page.locator('.applicant-link')).toHaveCount(0);
  const after = await ltd(page);
  expect(after.money).toBeCloseTo(5000 - a.cost, 0);
  expect(after.roster.find(p => p.id === a.id).role).toBe(a.role);

  // An offer that runs out is gone.
  await editCompany(page, s => {
    s.applicants = [{ id: 'x1', role: 'Senior', cost: 3000, expiresAt: Date.now() - 1000,
                      person: { id: 'x1', name: 'Sam Q.', role: 'Senior', since: Date.now(), lang: { Rust: 150 } } }];
  });
  expect((await ltd(page)).applicants).toHaveLength(0);
  await expect(page.locator('#log')).toContainText('Sam Q. (senior) took a job elsewhere.');
});

test('the Ltd tab is Debuggit Ltd, and a guide walks through the first steps', async ({ page }) => {
  await found(page);
  await expect(page.locator('h1')).toHaveText('Debuggit Ltd');
  await expect(page).toHaveTitle('Debuggit Ltd');
  // 1. Put the intern to work on the Python hotfix, with you alongside.
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'intern');
  const intern = (await ltd(page)).roster.find(p => p.role === 'Intern');
  await expect(page.locator('.guide')).toContainText('Put your intern, ' + intern.name + ', to work');
  await expect(page.locator('.offer:has(.guide-target) .chip.lang')).toHaveText('Python');
  await page.click('[data-action=staff].guide-target');
  await page.click('[data-pick="' + intern.id + '"]');
  await page.click('[data-pick="director"]');
  await page.click('[data-action=pick-start]');
  // 2. When they get stuck, help them with a puzzle.
  await editCompany(page, s => { s.jobs[0].stuckPoints = [0]; });
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'stuck');
  await expect(page.locator('.guide')).toContainText(intern.name + ' is stuck');
  await page.click('[data-action=intern-help].guide-target');
  await answerDesk(page, await stuckQuestion(page), true);
  // 3. Take a desk job.
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'desk');
  const job = (await ltd(page)).desk.jobs[0];
  const qs = await page.evaluate(ids => { const all = DebuggDesk.all(Debugg.today()); return ids.map(id => all.get(id)); }, job.questions);
  await openDesk(page);
  await page.click('[data-action=desk-start].guide-target');
  for(const q of qs) await answerDesk(page, q, true);
  // 4. Graduates apply once there's a little reputation; hire one.
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'hire');
  await expect(page.locator('.guide')).toContainText('Graduates apply once the studio has 5 reputation');
  await editCompany(page, s => {
    s.applicants = [{ id: 'ga1', role: 'Graduate', cost: 180, expiresAt: Date.now() + 3600000,
                      person: { id: 'ga1', name: 'Gus A.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } } }];
  });
  await expect(page.locator('.guide')).toContainText('Gus A. has applied');
  await openCandidate(page, 'ga1');
  await page.click('#candidateModalBody [data-action=hire-applicant].guide-target');
  // Grads are full at one while you're alone, and the note says why.
  await expect(page.locator('#structureNote')).toContainText('Grads 1/1 are full, though you have room for 3 more devs (Devs 1/4)');
  // 5. Fill the spare room: contracts only come once it's full.
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'hire');
  await expect(page.locator('.guide')).toContainText('Clients only come once your spare room is full (2 of 4 desks');
  await editCompany(page, s => {
    s.roster.push({ id: 'j1', name: 'Jo B.', role: 'Junior', since: Date.now(), lang: { Python: 50 } });
    s.roster.push({ id: 's1', name: 'Sy C.', role: 'Senior', since: Date.now(), lang: { Python: 400 } });
  });
  // 6. Your first client: a Python feature for the whole team.
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'first');
  await expect(page.locator('.guide')).toContainText('Your first client!');
  await expect(page.locator('.offer:has(.guide-target)')).toContainText('★ Your first client · pays ×2 · needs 3 developers');
  await page.click('[data-action=staff].guide-target');
  for(const id of ['ga1', 'j1', 's1']) await page.click('[data-pick=' + id + ']');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job', { hasText: 'Feature' })).toContainText('first client');
  await expect(page.locator('.guide')).toHaveCount(0);
  expect((await ltd(page)).guideDone).toBe(true);
});

test('a new company starts with a free intern, who writes hotfixes with you and moves on after 7 days', async ({ page }) => {
  await found(page);
  const intern = (await ltd(page)).roster.find(p => p.role === 'Intern');
  expect(intern).toBeTruthy();
  // No desk, no headcount, no salary.
  await expect(page.locator('#statHeads')).toHaveText('1');
  await openPerson(page, intern.id);
  await expect(page.locator('#personModalBody')).toContainText('Internship ends in');
  await page.keyboard.press('Escape');
  // You know Python, so the pair can take the Python hotfix: Suggest a team picks them both.
  const python = (await ltd(page)).board.find(o => o.tier === 0 && !o.expert && o.lang === 'Python');
  await page.click('[data-action=staff][data-offer="' + python.id + '"]');
  await page.click('[data-action=pick-suggest]');
  await expect(page.locator('#teamModal .check.no')).toHaveCount(0);
  // They write it slowly, sometimes getting stuck; no repeats.
  await expect(page.locator('#teamModal .forecast')).toContainText('They can get stuck up to 3 times on the way');
  await expect(page.locator('#teamModal [data-picker-repeat]')).toHaveCount(0);
  await page.click('[data-action=pick-start]');
  const job = (await ltd(page)).jobs[0];
  expect(job.team.sort()).toEqual(['director', intern.id].sort());
  expect(job.repeat).toBe(false);
  expect(job.endsAt - job.startedAt).toBeGreaterThan(15 * 60000);
  await expect(page.locator('.job')).toContainText('when it’s written');
  await expect(page.locator('.job [data-repeat]')).toHaveCount(0);
  // A language neither of you knows is no good (free the pair first).
  await editCompany(page, s => { s.jobs = []; });
  const rust = (await ltd(page)).board.find(o => o.tier === 0 && !o.expert && o.lang === 'Rust');
  await page.click('[data-action=staff][data-offer="' + rust.id + '"]');
  await page.click('[data-pick="' + intern.id + '"]');
  await page.click('[data-pick="director"]');
  await expect(page.locator('#teamModal .check.no').first()).toHaveText('✕ you or ' + intern.name + ' know Rust');
  await expect(page.locator('[data-action=pick-start]')).toBeDisabled();
  await page.click('[data-action=pick-cancel]');
  // After 7 days the internship ends: they leave and apply to stay on as a graduate for half price,
  // though the studio has no reputation yet.
  await editCompany(page, s => {
    s.jobs = [];
    s.roster.find(p => p.role === 'Intern').since = Date.now() - 8 * 86400000;
  });
  const after = await ltd(page);
  expect(after.reputation).toBe(0);
  expect(after.roster.some(p => p.role === 'Intern')).toBe(false);
  const offer = after.applicants.find(a => a.id === intern.id);
  expect(offer).toMatchObject({ role: 'Graduate', cost: 90 });
  await openCandidate(page, intern.id);
  await expect(page.locator('#candidateModalBody')).toContainText('Graduate');
  await page.keyboard.press('Escape');
});

// Puts the intern and you on a 20-minute Python hotfix, halfway through and just stuck, with another
// sticking point at 60%.
async function stuckHotfix(page){
  await editCompany(page, s => {
    const intern = s.roster.find(p => p.role === 'Intern');
    s.jobs = [{ id: 'ij1', tier: 0, lang: 'Python', risk: 'standard', expert: 0, sloc: 5, teamSloc: 0.25, team: [intern.id, 'director'],
                startedAt: Date.now() - 10 * 60000, endsAt: Date.now() + 10 * 60000, stuckPoints: [0.4999, 0.6],
                chance: 0.7, payout: 5, repeat: false, status: 'running', attempt: 1 }];
  });
}
// The puzzle the open help is asking.
function stuckQuestion(page){
  return page.evaluate(() => DebuggDesk.all(Debugg.today()).get(document.querySelector('.desk-q').dataset.qid));
}
const minutesLeft = async page => ((await ltd(page)).jobs[0].endsAt - await page.evaluate(() => Date.now())) / 60000;

test('the intern sometimes gets stuck, and the hotfix stalls until you help with a puzzle', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  await stuckHotfix(page);
  const intern = (await ltd(page)).roster.find(p => p.role === 'Intern');
  await expect(page.locator('.job.stuck')).toContainText('stuck at 50% until you help: a Python puzzle');
  await openPerson(page, intern.id);
  await expect(page.locator('#personModalBody')).toContainText('Stuck on the Python hotfix — help them below');
  await page.keyboard.press('Escape');
  await expect(page.locator('#log')).toContainText(intern.name + ' is stuck on the Python hotfix');
  // Two hours away: still stuck, nothing delivered.
  await page.clock.setFixedTime(at(14));
  await page.reload();
  let s = await ltd(page);
  expect(s.jobs[0].status).toBe('stuck');
  expect(s.money).toBe(250);
  // Right: 25% (5 minutes) ahead, and desk pay and reputation for the help.
  await page.click('[data-action=intern-help]');
  const q = await stuckQuestion(page);
  expect(q.lang).toBe('python');
  expect((await ltd(page)).jobs[0].question).toBe(q.id);
  await answerDesk(page, q, true);
  s = await ltd(page);
  const pay = { 1: 40, 2: 55, 3: 70, 4: 85, 5: 100 }[q.difficulty];
  expect(s.money).toBe(250 + pay);
  expect(s.reputation).toBe(1);
  expect(s.xp).toEqual({ python: 6 * q.difficulty });  // helping earns XP like a desk answer
  expect(s.jobs[0].status).toBe('running');
  expect(await minutesLeft(page)).toBeCloseTo(5, 1);
  expect(s.desk.seen).toContain(q.id);
  await expect(page.locator('#deskDone')).toContainText('hotfix jumps ahead');
  // The jump to 75% cleared the sticking point at 60%, and once written it's always delivered.
  await page.clock.setFixedTime(at(14, 6));
  await page.reload();
  s = await ltd(page);
  expect(s.jobs).toHaveLength(0);
  expect(s.money).toBe(250 + pay + 5);
  expect(s.internDone).toBe(1);
  await expect(page.locator('#log')).toContainText('Hotfix (Python) delivered');
});

test('a wrong answer loses the intern some progress, and they can get stuck again', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  await stuckHotfix(page);
  await page.click('[data-action=intern-help]');
  await answerDesk(page, await stuckQuestion(page), false);
  const s = await ltd(page);
  expect(s.money).toBe(250);
  expect(s.reputation).toBe(0);
  expect(s.xp).toEqual({});
  expect(s.jobs[0].status).toBe('running');
  expect(await minutesLeft(page)).toBeCloseTo(15, 1);
  await expect(page.locator('#log')).toContainText('loses some progress');
  // Back at 25%, the sticking point at 60% is 7 minutes on.
  await page.clock.setFixedTime(at(12, 8));
  await page.reload();
  const again = (await ltd(page)).jobs[0];
  expect(again.status).toBe('stuck');
  expect(again.stuckPoints).toEqual([]);
  await expect(page.locator('.job.stuck')).toContainText('stuck at 60%');
});

test('a company from before interns gets one, once', async ({ page }) => {
  await found(page);
  await editCompany(page, s => { s.roster = s.roster.filter(p => p.role !== 'Intern'); delete s.internGiven; });
  expect((await ltd(page)).roster.filter(p => p.role === 'Intern')).toHaveLength(1);
  await editCompany(page, s => { s.roster = s.roster.filter(p => p.role !== 'Intern'); });
  expect((await ltd(page)).roster.filter(p => p.role === 'Intern')).toHaveLength(0);
});

test('debt is flagged, staff do everyday work, and the welcome can be dismissed', async ({ page }) => {
  await found(page);
  await page.click('#welcomeToast [data-action=close-toast]');
  await expect(page.locator('#welcomeToast')).toBeHidden();
  await editCompany(page, s => {
    s.guideDone = true;
    s.money = -50;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 }, pace: 1 });
  });
  await expect(page.locator('.guide')).toHaveCount(0);
  await expect(page.locator('[data-alert=debt]')).toContainText('The company is ¤50 in debt');
  // 5 SLOC/min × ¤0.54.
  await openPerson(page, 'g1');
  await expect(page.locator('#personModalBody')).toContainText('Everyday work · support tickets · +¤2.7/min');
  await page.keyboard.press('Escape');
});

test('language skills are open-ended levels, each with a bar towards the next', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'p1', name: 'Grace H.', role: 'Principal', since: Date.now(), worked: 0,
                    lang: { Python: 2600, Rust: 60, JavaScript: 5 } });
  });
  await openPerson(page, 'p1');
  const row = name => page.locator('#personModalBody .skill-row', { hasText: name });
  // Level 6 is 1,800 XP and level 7 is 3,400: 2,600 is halfway.
  await expect(row('Python').locator('.skill-level')).toHaveText('Lv 6');
  await expect(row('Python').locator('.skill-level')).toHaveClass(/best/);
  await expect(row('Python').locator('.skill-xp')).toHaveText('2600/3400 xp');
  await expect(row('Python').locator('.skill-bar')).toHaveAttribute('aria-valuenow', '50');
  await expect(row('Rust').locator('.skill-level')).toHaveText('Lv 2');
  await expect(row('Rust').locator('.skill-xp')).toHaveText('60/150 xp');
  await expect(row('JavaScript').locator('.skill-level')).toHaveText('Lv 0');
  await expect(row('JavaScript').locator('.skill-bar')).toHaveAttribute('aria-valuenow', '50');
});

test('the business grows from a start-up; managers staff idle devs and the desk pays less', async ({ page }) => {
  await found(page);
  await expect(page.locator('.stage-name')).toHaveText('Start-up');
  await expect(page.locator('.stage-bar')).toContainText('desk jobs pay in full');
  await expect(page.locator('.stage-bar')).toContainText('Next: Small business, with your first manager.');
  await expect(page.locator('.stage-step.now')).toHaveCount(1);

  // A manager joins (from an old save, say): it's a small business, and they staff the idle grad
  // on a feature, on repeat.
  await editCompany(page, s => {
    s.guideDone = true; s.contractsOpen = true; s.firstClient = true;
    s.roster.push({ id: 'm1', name: 'Mo M.', role: 'Manager', since: Date.now(), lang: {} });
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.board.unshift({ id: 'f1', tier: 1, lang: 'Python', sloc: 600, risk: 'standard', expert: 0, expiresAt: Date.now() + 3600000 });
  });
  await expect(page.locator('.stage-name')).toHaveText('Small business');
  await expect(page.locator('.stage-bar')).toContainText('Next: Mid-size company, with 3 managers (you have 1) and 25 staff (you have 3)');
  await expect(page.locator('#log')).toContainText('Debuggit Ltd is now a small business.');
  await expect(page.locator('#log')).toContainText('Your managers put Ada L. to work.');
  const job = (await ltd(page)).jobs[0];
  expect(job).toMatchObject({ team: ['g1'], lang: 'Python', tier: 1, repeat: true });
  expect((await ltd(page)).stage).toBe('small');

  // The desk pays half: a Learn question's ¤40 is ¤20.
  const q = (await deskQuestions(page)).find(x => x.source === 'learn' && x.kind === 'choice');
  await setDeskJob(page, [q]);
  const money = (await ltd(page)).money;
  await openDesk(page);
  await page.click('[data-action=desk-start][data-job=dj1]');
  await answerDesk(page, q, true);
  await expect(page.locator('#deskDone')).toContainText('¤20 (a small business gets 50% of desk pay)');
});

test('anyone not on a contract does everyday work, worth about 1.35× their salary', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  await editCompany(page, s => {
    s.guideDone = true;
    s.money = 1000;
    s.roster.forEach(p => { p.pace = 1; });   // the intern
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 }, pace: 1 });
    s.roster.push({ id: 's1', name: 'Sam Q.', role: 'Senior', since: Date.now(), lang: { Rust: 150 }, pace: 1 });
  });
  // An hour away: at ¤0.54 a line, a grad earns ¤2.70/min against ¤2, a senior ¤16.20 against ¤12,
  // and the intern ¤0.108 (0.2 SLOC/min, no salary): ¤5.008/min, ¤300 over the hour.
  await page.clock.setFixedTime(at(13));
  await page.reload();
  await expect(page.locator('#statMoney')).toHaveText('¤1,300');
  // No XP and no promotion time for it.
  const saved = await ltd(page);
  expect(saved.roster.find(p => p.id === 'g1')).toMatchObject({ lang: { Python: 10 } });
  expect(saved.roster.find(p => p.id === 'g1').worked || 0).toBe(0);
  await openPerson(page, 's1');
  await expect(page.locator('#personModalBody')).toContainText('Everyday work · support tickets · +¤16.2/min');
  await page.keyboard.press('Escape');

  // Not someone on a contract (even a failed one waiting for a decision), and not someone away
  // (training, holiday, off sick).
  await editCompany(page, s => {
    s.money = 1000;
    s.jobs.push({ id: 'j1', tier: 1, lang: 'Python', sloc: 600, teamSloc: 5, team: ['g1'], startedAt: Date.now() - 120000,
                  endsAt: Date.now() - 60000, chance: 1, payout: 5, repeat: false, status: 'failed', attempt: 2 });
    s.roster.find(p => p.id === 's1').away = { kind: 'holiday', until: Date.now() + 2 * 3600000 };
  });
  await page.clock.setFixedTime(at(14));
  await page.reload();
  // Both just cost their salary for the hour, 60 × (¤2 + ¤12), less the intern's ¤6.48.
  await expect(page.locator('#statMoney')).toHaveText('¤166');
});

test('risky contracts pay more, succeed less often, and cost more reputation when they fail', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  // Some offers are rolled risky; the board has every level over time.
  const risks = await page.evaluate(() => JSON.parse(localStorage.getItem('debuggit-ltd-save')).board.map(o => o.risk));
  expect(risks.every(r => ['standard', 'risky', 'high'].includes(r))).toBe(true);
  await editCompany(page, s => {
    s.guideDone = true;
    s.reputation = 10;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.contractsOpen = true; s.firstClient = true;
    s.board.push({ id: 'o1', tier: 1, lang: 'Python', sloc: 600, risk: 'high', expiresAt: Date.now() + 3600000 });
  });
  const offer = page.locator('.offer:has([data-offer=o1])');
  await expect(offer.locator('.risk.high')).toHaveText('High stakes · pays ×2 · −30% success');
  await page.click('[data-action=staff][data-offer=o1]');
  await page.click('[data-pick=g1]');
  // A grad's 70% reliability, +1% for 1 bar of Python, −30% for the risk; double the ¤900 (600 SLOC × 1.5).
  await expect(page.locator('.forecast')).toContainText('Success chance 41% (incl. −30% for the risk) · Payout ¤1,800 (×2)');
  await expect(page.locator('.forecast')).toContainText('each failure costs 4× the usual reputation');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job')).toContainText('High stakes');
  const job = (await ltd(page)).jobs.find(j => j.id === 'o1');
  expect(job).toMatchObject({ risk: 'high', payout: 1800, chance: 0.41 });

  // Failing loses the contract (no retries before managers) and 4× the usual reputation (a
  // feature's 1 ÷ 2 × 4 = 2).
  await editCompany(page, s => {
    const j = s.jobs.find(j => j.id === 'o1');
    Object.assign(j, { chance: 0, endsAt: Date.now() - 1000, snags: [] });
    delete j.slow;
  });
  await expect(page.locator('#log')).toContainText('✕ high stakes Feature (Python) failed.');
  await expect(page.locator('#log')).toContainText('The client has taken the feature elsewhere.');
  expect((await ltd(page)).jobs.filter(j => j.id === 'o1')).toHaveLength(0);
  expect((await ltd(page)).reputation).toBeCloseTo(8);
});

test('with a manager, a repeating contract always retries a failure itself, even one from long ago', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  // It failed 6 hours ago, before the 4-hour offline cap: it retries from the cap, not waiting.
  await editCompany(page, s => {
    s.guideDone = true; s.contractsOpen = true; s.firstClient = true;
    s.office = { premises: 'unit-s', owned: true };
    s.roster.push({ id: 'm1', name: 'Mo M.', role: 'Manager', since: Date.now(), lang: {} });
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now() - 8 * 3600000, lang: { Python: 10 } });
    s.jobs = [{ id: 'f1', tier: 1, lang: 'Python', risk: 'standard', expert: 0, sloc: 600, teamSloc: 6, team: ['g1'],
                startedAt: Date.now() - 6 * 3600000 - 60000, endsAt: Date.now() - 6 * 3600000,
                chance: 0, payout: 900, repeat: true, status: 'running', attempt: 1 }];
  });
  await expect(page.locator('#log')).toContainText('↻ Retrying Feature (Python)');
  await expect(page.locator('.job.failed')).toHaveCount(0);

  // A save with a repeating job left waiting on the player retries it straight away.
  await editCompany(page, s => {
    s.jobs = s.jobs.filter(j => j.team.includes('g1')).slice(0, 1);
    Object.assign(s.jobs[0], { status: 'failed', attempt: 1, chance: 1, repeat: true, startedAt: Date.now() - 60000, endsAt: Date.now() - 1000 });
  });
  await expect(page.locator('.job.failed')).toHaveCount(0);
  const job = (await ltd(page)).jobs.find(j => j.team.includes('g1'));
  expect(job).toMatchObject({ status: 'running', attempt: 2 });
});

test('before managers, nothing repeats or retries', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.contractsOpen = true; s.firstClient = true; s.guideDone = true;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.board.push({ id: 'o1', tier: 1, lang: 'Python', sloc: 600, risk: 'standard', expiresAt: Date.now() + 3600000 });
    s.jobs = [{ id: 'old', tier: 1, lang: 'Python', risk: 'standard', expert: 0, sloc: 600, teamSloc: 6, team: [],
                startedAt: Date.now(), endsAt: Date.now() + 3600000, chance: 1, payout: 900, repeat: true, status: 'running', attempt: 1 }];
  });
  // Older saves' repeats stop until there's a manager.
  expect((await ltd(page)).jobs.find(j => j.id === 'old').repeat).toBe(false);
  await page.click('[data-action=staff][data-offer=o1]');
  await expect(page.locator('[data-picker-repeat]')).toHaveCount(0);
  await expect(page.locator('.forecast')).toContainText('If it fails, the client takes it elsewhere (retries and repeats come with your first manager)');
  await page.click('[data-pick=g1]');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('[data-repeat]')).toHaveCount(0);
  expect((await ltd(page)).jobs.find(j => j.id === 'o1').repeat).toBe(false);
});

test('a repeating contract keeps working through the last 4 hours of a long time away', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  // Every roll comes up the middle: contracts succeed (a grad's ~71%), new ones are standard, with
  // no expert level, and nobody hands in their notice.
  await page.addInitScript(() => { Math.random = () => 0.5; });
  // With a manager, a grad on a repeating feature that finished 8 hours ago, when the page was closed.
  await editCompany(page, s => {
    s.guideDone = true; s.contractsOpen = true; s.firstClient = true;
    s.money = 5000;
    s.office = { premises: 'unit-s', owned: true };
    s.lastTick = Date.now() - 8 * 3600000;
    s.nextNoticeAt = Date.now() + 24 * 3600000;
    s.roster.push({ id: 'm1', name: 'Mo M.', role: 'Manager', since: Date.now() - 9 * 3600000, lang: {} });
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now() - 9 * 3600000,
                    lang: { Python: 10, 'C/C++': 10, JavaScript: 10, Rust: 10 } });
    s.jobs = [{ id: 'j1', tier: 1, lang: 'Python', risk: 'standard', expert: 0, sloc: 600, teamSloc: 6, team: ['g1'],
                startedAt: Date.now() - 8 * 3600000 - 50000, endsAt: Date.now() - 8 * 3600000,
                chance: 1, payout: 900, repeat: true, status: 'running', attempt: 1 }];
  });
  // That one is delivered, and the repeats run through the last 4 hours (about 100 minutes each for
  // a lone grad): two more delivered, and one still going.
  const s = await ltd(page);
  const job = s.jobs.find(j => j.team.includes('g1'));
  expect(job).toMatchObject({ status: 'running', repeat: true });
  expect(job.endsAt).toBeGreaterThan(await page.evaluate(() => Date.now()));
  expect(s.reputation).toBeGreaterThanOrEqual(3);
});

test('there is a hotfix in every language, for a dev or the intern; features wait for a full spare room', async ({ page }) => {
  await found(page);
  const hotfixes = page.locator('.board-group[data-tier=hotfix] .offer');
  await expect(hotfixes).toHaveCount(4);
  await expect(hotfixes.locator('.chip.lang')).toHaveText(['Python', 'C/C++', 'JavaScript', 'Rust']);
  await expect(page.locator('.board-group[data-tier=hotfix] .board-sum')).toHaveText('one dev who knows the stack, or your intern with you');
  await expect(page.locator('.board-group .level-name')).toHaveText(['Hotfixes', 'Features', 'Patches', 'Minor releases', 'Major releases']);
  await expect(page.locator('.board-group[data-tier=feature]')).toHaveClass(/locked/);
  await expect(page.locator('.board-group[data-tier=feature] .level-count')).toHaveText('start once your spare room is full (1 of 4 desks)');
  const saved = await ltd(page);
  expect(JSON.stringify(saved)).not.toContain('"dom"');
  expect(saved.board.filter(o => o.tier !== 0)).toHaveLength(0);
  expect(saved.board.filter(o => o.expert)).toHaveLength(0);
});

// Adds staff until the company has `n` people, the Director included (the intern doesn't count).
const staffUpTo = n => new Function('s', `
  while(s.roster.filter(p => p.role !== 'Intern').length < ${n}) s.roster.push({ id: 'g' + s.roster.length, name: 'Grad ' + s.roster.length, role: 'Graduate', since: Date.now(), lang: { Python: 10, 'C/C++': 10, JavaScript: 10, Rust: 10 } });`);

test('patches only come to the board above 10 staff', async ({ page }) => {
  await found(page);
  const patches = page.locator('.board-group[data-tier=patch]');
  await expect(patches).toHaveClass(/locked/);
  await expect(patches.locator('.level-count')).toHaveText('unlocks above 10 staff');
  await editCompany(page, staffUpTo(10));
  await expect(page.locator('#statHeads')).toHaveText('10');
  await expect(patches).toHaveClass(/locked/);
  await editCompany(page, staffUpTo(11));
  await expect(page.locator('#statHeads')).toHaveText('11');
  await expect(patches.locator('.offer')).toHaveCount(2);
  // Dropping back to 10 takes them off the board again.
  await editCompany(page, s => { s.roster.pop(); });
  await expect(patches).toHaveClass(/locked/);
  expect((await ltd(page)).board.filter(o => o.tier === 2)).toHaveLength(0);
});

test('the demo runs hotfixes and patches, with managers', async ({ page }) => {
  await found(page);
  await expect(page.locator('#welcomeToast')).toContainText('In the demo it runs hotfixes, and patches once you have more than 10 staff');
  await expect(page.locator('#welcomeToast')).toContainText('reset when v0.1 comes out');
  // Managers can be hired once the company has left the spare room.
  await page.click('[data-action=open-jobs]');
  await expect(page.locator('.job-post', { has: page.locator('[data-role=Manager]') }).locator('.why')).toHaveText('managers need an office: move out of the spare room first');
  await page.keyboard.press('Escape');
  await editCompany(page, s => { s.office = { premises: 'unit-s', owned: true }; s.money = 50; });
  await page.click('[data-action=open-jobs]');
  await expect(page.locator('.job-post', { has: page.locator('[data-role=Manager]') }).locator('.why')).toHaveText('not enough cash');
  await page.keyboard.press('Escape');
  // Patches open above 10 staff.
  await editCompany(page, staffUpTo(11));
  await expect(page.locator('.board-group[data-tier=patch] .offer')).toHaveCount(2);
  for(const tier of ['minor', 'major']){
    await expect(page.locator('.board-group[data-tier=' + tier + ']')).toHaveClass(/locked/);
    await expect(page.locator('.board-group[data-tier=' + tier + '] .level-count')).toHaveText('coming in v0.1');
    await expect(page.locator('.board-group[data-tier=' + tier + '] .offer')).toHaveCount(0);
  }

  // A company from before the demo keeps its staff, but its bigger offers go.
  await editCompany(page, s => {
    s.board.push({ id: 'm1', tier: 3, lang: 'Python', sloc: 2700, expiresAt: Date.now() + 3600000 });
  });
  expect((await ltd(page)).board.filter(o => o.tier > 2)).toHaveLength(0);
});

test('a hotfix is replaced in the same language, whether the intern or a dev takes it', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.guideDone = true;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.board.find(o => o.tier === 0 && o.lang === 'Python').id = 'py1';
  });
  const intern = (await ltd(page)).roster.find(p => p.role === 'Intern');
  // A dev who knows the language can take it alone; one who doesn't can't (no learning solo).
  await page.click('[data-action=staff][data-offer=py1]');
  await expect(page.locator('[data-pick=g1]')).toHaveCount(1);
  await page.click('[data-pick=g1]');
  await expect(page.locator('#teamModal .check.no')).toHaveCount(0);
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job')).toContainText('Python');
  expect((await ltd(page)).jobs[0].team).toEqual(['g1']);
  // The intern and you take the replacement Python one.
  await editCompany(page, s => { s.board.find(o => o.tier === 0 && o.lang === 'Python').id = 'py2'; });
  await page.click('[data-action=staff][data-offer=py2]');
  await page.click('[data-pick="' + intern.id + '"]');
  await page.click('[data-pick="director"]');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job').nth(1)).toContainText('Python');
  const board = (await ltd(page)).board.filter(o => o.tier === 0);
  expect(board.map(o => o.lang).sort()).toEqual(['C/C++', 'JavaScript', 'Python', 'Rust']);
  expect(board.find(o => o.id === 'py1' || o.id === 'py2')).toBeUndefined();
  await expect(page.locator('.board-group[data-tier=hotfix] .level-count')).toHaveText('×4 · 2 running');
});

test('everyone needs a desk: the spare room has 4, then a small business unit for rent', async ({ page }) => {
  await found(page);
  // You, the Director, take one of the spare room's 4 desks.
  await expect(page.locator('.premises-row.here')).toContainText('Your spare room');
  await expect(page.locator('.premises-row.here')).toContainText('1/4 desks used');
  await expect(page.locator('[data-action=move][data-premises=spare-room]')).toHaveCount(0);
  await editCompany(page, s => {
    s.money = 5000;
    s.roster.push({ id: 'j0', name: 'Jun 0', role: 'Junior', since: Date.now(), lang: { Python: 150 } });
    for(let i = 0; i < 2; i++) s.roster.push({ id: 'g' + i, name: 'Grad ' + i, role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  // The spare room is full, but nobody's squeezed in, so it isn't cramped. Managers need an office.
  await expect(page.locator('.slot', { hasText: 'Desks' })).toHaveText('Desks 4/4');
  await expect(page.locator('.premises .cramped')).toHaveCount(0);
  await page.click('[data-action=open-jobs]');
  await expect(page.locator('.job-post', { has: page.locator('[data-role=Manager]') }).locator('.why')).toHaveText('managers need an office: move out of the spare room first');
  await page.keyboard.press('Escape');
  // The next premises can be rented or bought outright; ¤5,000 isn't enough to buy.
  await expect(page.locator('[data-action=move][data-tenure=rent]')).toHaveText('Rent a small business unit · 10 desks · ¤4/min');
  await expect(page.locator('[data-action=move][data-tenure=buy]')).toHaveText('Buy one · ¤60,000, then ¤1/min upkeep');
  await expect(page.locator('[data-action=move][data-tenure=buy]')).toBeDisabled();
  await page.click('[data-action=move][data-tenure=rent]');
  await expect(page.locator('.premises .cramped')).toHaveCount(0);
  await expect(page.locator('.premises-row.here')).toContainText('A small business unit');
  await expect(page.locator('.premises-row.here')).toContainText('10 desks on 2 floors · Rented, ¤4/min · 4/10 desks used');
  await expect(page.locator('#log')).toContainText('Moved into a rented small business unit: 10 desks, ¤4/min rent.');
  await expect(page.locator('#statPayrollLabel')).toHaveText('Payroll + rent');
  await expect(page.locator('#statPayroll')).toHaveText('−¤13/min');  // ¤9 salaries + ¤4 rent
  await hireManager(page);
  await expect(page.locator('.premises')).toContainText('5/10 desks used');
  expect((await ltd(page)).office).toEqual({ premises: 'unit-s', owned: false });
  // Nothing bigger in the demo yet.
  await expect(page.locator('.office-actions button', { hasText: 'Bigger premises' })).toBeDisabled();

  // Rent is paid every second, like salaries, while away too: 10 minutes of ¤4/min.
  await editCompany(page, s => {
    s.roster = s.roster.filter(p => p.role === 'Director');
    s.money = 100;
    s.lastTick = Date.now() - 10 * 60000;
  });
  expect(Math.round((await ltd(page)).money)).toBe(60);
  await page.click('[data-action=move][data-premises=spare-room]');
  expect((await ltd(page)).office).toEqual({ premises: 'spare-room', owned: false });
  await expect(page.locator('#statPayrollLabel')).toHaveText('Payroll');
});

test('premises can be bought outright: the price up front, then upkeep, and moving out sells it', async ({ page }) => {
  await found(page);
  await editCompany(page, s => { s.money = 70000; });
  await page.click('[data-action=move][data-tenure=buy]');
  let s = await ltd(page);
  expect(s.office).toEqual({ premises: 'unit-s', owned: true });
  expect(Math.round(s.money)).toBe(10000);
  await expect(page.locator('.premises-row.here')).toContainText('10 desks on 2 floors · Owned, ¤1/min upkeep');
  await expect(page.locator('#log')).toContainText('Bought a small business unit for ¤60,000: 10 desks, ¤1/min upkeep.');
  await expect(page.locator('#statPayrollLabel')).toHaveText('Payroll + upkeep');
  await expect(page.locator('[data-action=buy-premises]')).toHaveCount(0);
  // Moving back sells it for 90% of the price.
  await expect(page.locator('[data-action=move][data-premises=spare-room]')).toHaveText('Sell for ¤54,000 and move back to the spare room');
  await page.click('[data-action=move][data-premises=spare-room]');
  s = await ltd(page);
  expect(s.office).toEqual({ premises: 'spare-room', owned: false });
  expect(Math.round(s.money)).toBe(64000);
  await expect(page.locator('#log')).toContainText('Sold your small business unit for ¤54,000.');
  // Renting first, then buying the unit you're in, without moving.
  await page.click('[data-action=move][data-tenure=rent]');
  await page.click('[data-action=buy-premises]');
  s = await ltd(page);
  expect(s.office).toEqual({ premises: 'unit-s', owned: true });
  expect(Math.round(s.money)).toBe(4000);
  await expect(page.locator('#log')).toContainText('Bought the small business unit you rent for ¤60,000: ¤1/min upkeep instead of ¤4/min rent.');
});

test('a full office is fine; each person squeezed in, up to half the desks, slows everyone 6%', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.money = 5000; s.guideDone = true;
    s.roster.push({ id: 'j0', name: 'Jun 0', role: 'Junior', since: Date.now(), lang: { Python: 150 } });
    for(let i = 0; i < 2; i++) s.roster.push({ id: 'g' + i, name: 'Grad ' + i, role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  // Every desk taken, nobody squeezed in: full speed. A junior at Lv 3 writes 12 × 1.6 = 19.2 SLOC/min.
  // (A full spare room opens contracts, starting with your first client.)
  await expect(page.locator('.premises .cramped')).toHaveCount(0);
  const first = (await ltd(page)).board.find(o => o.first).id;
  await page.click('[data-action=staff][data-offer="' + first + '"]');
  await expect(page.locator('label.pick', { hasText: 'Jun 0' })).toContainText('19.2 SLOC/min');
  await page.keyboard.press('Escape');
  // Two managers squeezed in (the spare room takes half its 4 desks): 12% slower, and nobody else fits.
  // The others are on holiday, so the managers don't put them on hotfixes while we look.
  await editCompany(page, s => {
    s.roster.forEach(p => { if(p.role !== 'Director' && p.role !== 'Intern') p.away = { kind: 'holiday', until: Date.now() + 86400000 }; });
    for(let i = 0; i < 2; i++) s.roster.push({ id: 'm' + i, name: 'Manager ' + i, role: 'Manager', since: Date.now(), lang: {} });
    s.applicants = [{ id: 'ga1', role: 'Graduate', cost: 180, expiresAt: Date.now() + 3600000,
                      person: { id: 'ga1', name: 'Gus A.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } } }];
  });
  await expect(page.locator('.premises .cramped')).toContainText('2 squeezed in without a desk: cramped, so everyone is 12% slower');
  await openCandidate(page, 'ga1');
  await expect(page.locator('#candidateModalBody .blocked')).toHaveText('no room to squeeze anyone else in — rent or buy a small business unit');
  await page.keyboard.press('Escape');
  await page.click('[data-action=staff][data-offer="' + first + '"]');
  await expect(page.locator('label.pick', { hasText: 'Jun 0' })).toContainText('16.9 SLOC/min');   // 19.2 × 0.88
  await page.keyboard.press('Escape');
  // A small business unit has a desk for everyone. Moving back would squeeze in 2 again, which is allowed.
  await page.click('[data-action=move][data-tenure=rent]');
  await expect(page.locator('.premises .cramped')).toHaveCount(0);
  await expect(page.locator('[data-action=move][data-premises=spare-room]')).toBeEnabled();
  // The unit takes 5 squeezed in (half its 10 desks).
  await openCandidate(page, 'ga1');
  await expect(page.locator('#candidateModalBody .blocked')).toHaveCount(0);
  await page.keyboard.press('Escape');
  // One more and the spare room can't hold them.
  await editCompany(page, s => {
    s.roster.push({ id: 'g9', name: 'Grad 9', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  await expect(page.locator('[data-action=move][data-premises=spare-room]')).toBeDisabled();
  await expect(page.locator('[data-action=move][data-premises=spare-room]')).toHaveAttribute('title', 'Can’t move back: too many people to fit');
});

test('someone who hands in their notice can be kept with a pay rise, or leaves after a day', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.guideDone = true;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 },
                    notice: { reason: 'offer', until: Date.now() + 18 * 3600000, ask: 0.5 } });
    s.roster.push({ id: 'g2', name: 'Bo K.', role: 'Graduate', since: Date.now(), lang: { Rust: 10 },
                    notice: { reason: 'offer', until: Date.now() + 3600000, ask: 1 } });
  });
  await expect(page.locator('#notifications .alert[data-alert=notice]')).toHaveCount(2);
  await expect(page.locator('.alert[data-alert=notice][data-id=g1]')).toContainText('Ada L. (graduate) handed in their notice: a better offer · leaves in 18h');
  await expect(page.locator('#statPayroll')).toHaveText('−¤4/min');
  // The name opens their panel, which shows the same notice.
  await page.click('.alert[data-id=g1] .link-btn');
  await expect(page.locator('#personModalBody .notice')).toContainText('Handed in notice · leaves in 18h · has a better offer');
  await page.keyboard.press('Escape');
  await page.click('.alert[data-id=g1] [data-action=keep]');
  await expect(page.locator('.alert[data-id=g1]')).toHaveCount(0);
  await openPerson(page, 'g1');
  await expect(page.locator('#personModalBody .notice')).toHaveCount(0);
  await expect(page.locator('#personModalBody')).toContainText('−¤2.5/min');
  await page.keyboard.press('Escape');
  await expect(page.locator('#statPayroll')).toHaveText('−¤4.5/min');
  expect((await ltd(page)).roster.find(p => p.id === 'g1')).toMatchObject({ raise: 0.5 });
  expect((await ltd(page)).roster.find(p => p.id === 'g1').notice).toBeUndefined();
  // The other one's notice runs out: they leave.
  await editCompany(page, s => { s.roster.find(p => p.id === 'g2').notice.until = Date.now() - 1000; });
  await expect(page.locator('.person-link[data-id=g2]')).toHaveCount(0);
  await expect(page.locator('#log')).toContainText('Bo K. (graduate) has left the studio.');
});

test('each hour, anyone but the Director may hand in their notice', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.nextNoticeAt = Date.now() + 3600000;
  });
  // Forced: every roll comes up.
  await page.addInitScript(() => { Math.random = () => 0; });
  await editCompany(page, s => { s.nextNoticeAt = Date.now() - 1000; });
  const saved = await ltd(page);
  expect(saved.roster.find(p => p.role === 'Director').notice).toBeUndefined();
  const n = saved.roster.find(p => p.id === 'g1').notice;
  expect(n).toMatchObject({ reason: 'offer', ask: 0.5 });
  expect(n.until - saved.nextNoticeAt).toBeGreaterThan(22 * 3600000);
  await expect(page.locator('#log')).toContainText('Ada L. has handed in their notice: they’ve had a better offer. They’ll stay for a ¤0.5/min pay rise.');
});

test('a notice over a cramped office is withdrawn once there’s a free desk', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.money = 5000;
    s.roster.push({ id: 'j0', name: 'Jun 0', role: 'Junior', since: Date.now(), lang: { Python: 150 },
                    notice: { reason: 'cramped', until: Date.now() + 20 * 3600000, ask: 1 } });
    for(let i = 0; i < 3; i++) s.roster.push({ id: 'g' + i, name: 'Grad ' + i, role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  await openPerson(page, 'j0');
  await expect(page.locator('#personModalBody .notice')).toContainText('the office is too cramped');
  await page.keyboard.press('Escape');
  await expect(page.locator('.alert[data-alert=notice]')).toContainText('free up a desk to keep them');
  await page.click('[data-action=move][data-tenure=rent]');
  await openPerson(page, 'j0');
  await expect(page.locator('#personModalBody .notice')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#log')).toContainText('Jun 0 is staying, now there’s room in the office.');
});

test('a company from before desks starts in the spare room; co-working desks are gone, squeezing everyone in', async ({ page }) => {
  await found(page);
  await editCompany(page, s => { delete s.office; });
  expect((await ltd(page)).office).toEqual({ premises: 'spare-room', owned: false });
  // A company with 3 co-working desks and 7 staff: they all stay, 3 of them without a desk, and
  // nobody else fits until it moves.
  await editCompany(page, s => {
    s.office = { cowork: 3 };
    for(let i = 0; i < 7; i++) s.roster.push({ id: 'g' + i, name: 'Grad ' + i, role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  expect((await ltd(page)).office).toEqual({ premises: 'spare-room', owned: false });
  expect((await ltd(page)).roster.filter(p => p.role === 'Graduate')).toHaveLength(7);
  await expect(page.locator('.premises')).toContainText('8/4 desks used');
  await expect(page.locator('.premises .cramped')).toContainText('4 squeezed in without a desk: cramped, so everyone is 24% slower');
  await expect(page.locator('#log')).toContainText('Co-working desks are gone: everyone who sat at one is squeezed into your spare room.');
  await expect(page.locator('[data-action=move][data-tenure=rent]')).toBeEnabled();
});

test('expert contracts need someone at a skill level, and pay more', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.contractsOpen = true; s.firstClient = true;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.roster.push({ id: 'j1', name: 'Bo K.', role: 'Junior', since: Date.now(), lang: { Python: 1000 } });
    s.board.push({ id: 'x1', tier: 1, lang: 'Python', expert: 5, risk: 'standard', sloc: 600, expiresAt: Date.now() + 3600000 });
  });
  const offer = page.locator('.offer.expert-offer');
  await expect(offer.locator('.expert')).toHaveText('Expert · needs someone at Lv 5 Python · pays ×1.6');
  await page.click('[data-action=staff][data-offer=x1]');
  // The grad alone can't take it; with the junior at Lv 5 on the team, they can.
  await page.click('[data-pick=g1]');
  await expect(page.locator('[data-action=pick-start]')).toBeDisabled();
  await page.click('[data-pick=j1]');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job .expert-tag')).toHaveText('Lv 5');
  const job = (await ltd(page)).jobs.find(j => j.id === 'x1');
  expect(job).toMatchObject({ expert: 5, payout: 1440 });  // 600 SLOC × 1.5 × 1.6
});

test('each skill level past 5 adds a little speed', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'p1', name: 'Grace H.', role: 'Principal', since: Date.now(), lang: { Python: 5800 } });
    s.contractsOpen = true; s.firstClient = true;
    s.board.push({ id: 'py1', tier: 1, lang: 'Python', sloc: 600, risk: 'standard', expiresAt: Date.now() + 3600000 });
  });
  await page.click('[data-action=staff][data-offer=py1]');
  // A principal writes 70 SLOC/min: ×2 at Lv 5, and +5% more for each of Lv 6, 7 and 8.
  await expect(page.locator('label.pick', { hasText: 'Grace H.' })).toContainText('Lv 8 · 150.5 SLOC/min');
});

test('board groups fold, and stay folded', async ({ page }) => {
  await found(page);
  await editCompany(page, staffUpTo(11));
  const patches = page.locator('.board-group[data-tier=patch]');
  await expect(patches.locator('.offer').first()).toBeVisible();
  await patches.locator('.level-header').click();
  await expect(patches).toHaveClass(/collapsed/);
  await expect(patches.locator('.offer').first()).toBeHidden();
  await page.reload();
  await expect(page.locator('.board-group[data-tier=patch]')).toHaveClass(/collapsed/);
  await expect(page.locator('.board-group[data-tier=hotfix]')).not.toHaveClass(/collapsed/);
  expect((await ltd(page)).collapsedTiers).toEqual(['patch']);
});

test('a company saved with domains is converted to languages only', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  await hireGrad(page);
  await editCompany(page, s => {
    delete s.boardVersion;
    const g = s.roster.find(p => p.role === 'Graduate');
    g.lang = { Python: 10 };
    g.dom = { 'Web Dev': 60 };
    s.jobs.push({ id: 'j1', tier: 0, lang: 'Python', dom: 'Web Dev', sloc: 5, teamSloc: 5, team: [g.id],
                  startedAt: Date.now(), endsAt: Date.now() + 60000, chance: 1, payout: 20, repeat: false,
                  status: 'running', attempt: 1 });
    s.board = s.board.slice(5).map(o => Object.assign(o, { dom: 'Games' }));
  });
  const saved = await ltd(page);
  expect(JSON.stringify(saved)).not.toContain('"dom"');
  expect(saved.boardVersion).toBe(2);
  expect(saved.board.filter(o => o.tier === 0 && !o.expert).map(o => o.lang).sort()).toEqual(['C/C++', 'JavaScript', 'Python', 'Rust']);
  expect(saved.jobs).toHaveLength(1);
  await expect(page.locator('.job')).toContainText('Python');
});

test('promotion needs contract time and a language level only', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 150 }, worked: 11 * 3600000 });
  });
  // 12 hours on contracts for Junior…
  await expect(page.locator('[data-action=promote][data-id=g1]')).toHaveCount(0);
  // …and Lv 3 in a language: 12 hours at Lv 2 isn't enough.
  await editCompany(page, s => { Object.assign(s.roster.find(p => p.id === 'g1'), { worked: 12 * 3600000 + 60000, lang: { Python: 149 } }); });
  await expect(page.locator('[data-action=promote][data-id=g1]')).toHaveCount(0);
  await openPerson(page, 'g1');
  await expect(page.locator('#personModalBody')).toContainText('○ A language at level 3');
  await page.keyboard.press('Escape');
  await editCompany(page, s => { s.roster.find(p => p.id === 'g1').lang.Python = 150; });
  await openPerson(page, 'g1');
  await expect(page.locator('[data-action=promote][data-id=g1]')).toHaveText('Promote to Junior');
  await expect(page.locator('#personModalBody')).toContainText('✓ A language at level 3');
  await expect(page.locator('#personModalBody')).not.toContainText('omain');
});

test('pausing stops the clock until the company is resumed', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  await hireGrad(page);
  await editCompany(page, s => {
    const g = s.roster.find(p => p.role === 'Graduate');
    s.jobs.push({ id: 'j1', tier: 0, lang: 'Python', sloc: 5, teamSloc: 5, team: [g.id],
                  startedAt: Date.now(), endsAt: Date.now() + 60000, chance: 1, payout: 20, repeat: false,
                  status: 'running', attempt: 1 });
  });
  await page.click('#ltdPause');
  await expect(page.locator('body')).not.toHaveClass(/ltd-on/);
  expect(await page.evaluate(() => typeof window.DebuggLtd)).toBe('undefined');
  await expect(page.locator('#ltdLink')).toHaveText('Resume Debuggit Ltd');

  // Two hours later: no salaries were paid and the job hasn't moved on.
  await page.clock.setFixedTime(at(14));
  await page.reload();
  await page.click('#ltdLink');
  await expect(page.locator('#welcomeToast')).toContainText('paused for 2h');
  await expect(page.locator('#statMoney')).toHaveText('¤70');
  const job = (await ltd(page)).jobs[0];
  expect(job.endsAt - Date.parse(at(14))).toBe(60000);
});

test('closing the company keeps puzzle progress; resetting puzzles keeps the company', async ({ page }) => {
  await guess(page, (await puzzleFor(page, 3)).display);
  await found(page);
  await page.click('#resetLink');
  await expect(page.locator('body')).toHaveClass(/ltd-on/);
  expect(await ltd(page)).not.toBeNull();
  expect(await readJson(page, 'debuggit-daily-xp')).toBeNull();

  await page.click('#dailyTab');
  await expect(page.locator('#ltdNote')).toBeVisible();
  await guess(page, (await puzzleFor(page, 3)).display);
  await page.click('#ltdNote a');
  await page.click('#ltdClose');
  await expect(page.locator('body')).not.toHaveClass(/ltd-on/);
  expect(await ltd(page)).toBeNull();
  expect((await readJson(page, 'debuggit-daily-xp')).python).toBe(100);
});

test('a company saved on the old /studio/ page is imported', async ({ page }) => {
  const old = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/old-studio-save.json'), 'utf8'));
  old.lastTick = Date.parse(at(12));
  await withStorage(page, { 'contract-debugger-state-v3': old });
  await expect(page.locator('body')).toHaveClass(/ltd-on/);
  await expect(page.locator('#statMoney')).toHaveText('¤90');
  await expect(page.locator('#statHeads')).toHaveText('2');
  await expect(page.locator('#welcomeToast')).toContainText('Your company has moved in. Your desk has jobs for you');
  const saved = await ltd(page);
  expect(saved.activeContract).toBeUndefined();
  expect(saved.enabled).toBe(true);
  // Its domains are dropped (languages only for now).
  expect(JSON.stringify(saved)).not.toContain('"dom"');
  expect(saved.boardVersion).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem('contract-debugger-state-v3'))).toBeNull();
});

test('/studio/ redirects to the main page with the studio on', async ({ page }) => {
  await page.goto('studio/');
  await expect(page).toHaveURL(/\/index\.html\?ltd$/);
  await expect(page.locator('#ltdIntro')).toBeVisible();
  await page.click('#ltdLink');
  await expect(page.locator('body')).toHaveClass(/ltd-on/);
  await expect(page.locator('#statMoney')).toHaveText('¤250');
});

test('Daily and Ltd are tabs; on the Daily tab a running company is a note linking to it', async ({ page }) => {
  await expect(page.locator('.modes .lang-tab')).toHaveText(['debuggit.learn()', 'debuggit.daily() (demo)', 'debuggit.ltd() (demo)']);
  await expect(page.locator('#dailyTab')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#ltdIntro')).toBeHidden();
  await page.click('#ltdTab');
  await expect(page.locator('#ltdTab')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#ltdIntro')).toBeVisible();
  // Opening the tab doesn't start a company by itself.
  expect(await page.evaluate(() => typeof window.DebuggLtd)).toBe('undefined');
  expect(await ltd(page)).toBeNull();
  await page.click('#ltdLink');
  await expect(page.locator('#statMoney')).toHaveText('¤250');
  await expect(page.locator('#ltdIntro')).toBeHidden();

  await page.click('#dailyTab');
  await expect(page.locator('#dailyTab')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#ltdNote')).toBeVisible();
  await expect(page.locator('#ltdStats')).toBeHidden();
  await expect(page.locator('#ltdBoard')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/ltd-on/);
  await page.click('#ltdNote a');
  await expect(page.locator('#statMoney')).toHaveText('¤250');

  // The top buttons name each page: Learn (its own section, also linked from the
  // Director's languages, and it links back), then the daily and Ltd, both demos for now.
  await expect(page.locator('.modes a')).toHaveText(['debuggit.learn()', 'debuggit.daily() (demo)', 'debuggit.ltd() (demo)']);
  await openPerson(page, 'director');
  await expect(page.locator('#personModalBody a.learn-lang')).toHaveText('Python');
  await expect(page.locator('#personModalBody a.learn-lang')).toHaveAttribute('href', 'learn/#python');
  await page.click('#personModalBody a.learn-lang');
  await expect(page.locator('h1')).toHaveText('Learn Python');
  await page.click('#ltdTab');
  await expect(page.locator('#statMoney')).toBeVisible();
});

test('works at phone width with the studio on', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await found(page);
  await openDesk(page);
  await page.click('[data-action=desk-start]');
  await expect(page.locator('.desk-q')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

// The office view (ltd/office.js): the studio drawn as a building above the desk and the studio.
const officeLabel = page => page.locator('.office-canvas');
// Open someone's panel from the names-only list (the keyboard way in; the picture's taps do the same).
// Posts a manager job, lets the candidate reply, and hires them (they cost around the market price).
async function hireManager(page){
  await page.click('[data-action=open-jobs]');
  await page.click('[data-action=post-job][data-role=Manager]');
  await page.keyboard.press('Escape');
  await editCompany(page, s => { s.postings.forEach(p => { p.readyAt = Date.now() - 1000; }); });
  await page.click('[data-action=open-jobs]');
  await page.click('#jobsModalBody [data-action=hire-candidate]');
  await page.keyboard.press('Escape');
}
async function openCandidate(page, id){
  await page.evaluate(() => { document.querySelector('.people-list').open = true; });
  await page.click('.applicant-link[data-id="' + id + '"]');
  await expect(page.locator('#candidateModal')).toBeVisible();
}
async function openPerson(page, id){
  await page.evaluate(() => { document.querySelector('.people-list').open = true; });
  await page.click('.person-link[data-id="' + id + '"]');
  await expect(page.locator('#personModal')).toBeVisible();
}
// Breaks come from the game time; these fix who's on one (none, unless given).
const officeBreaks = (page, ids = []) => page.addInitScript(ids => { window.DEBUGG_OFFICE_BREAKS = ids; }, ids);
// Clicks the office where a tap target is (its kind and id, from DebuggOffice.targets()).
async function tapOffice(page, kind, id){
  await expect.poll(() => page.evaluate(([k, i]) => DebuggOffice.targets().some(t => t.kind === k && t.id === i), [kind, id])).toBe(true);
  const t = await page.evaluate(([k, i]) => DebuggOffice.targets().find(t => t.kind === k && t.id === i), [kind, id]);
  await officeLabel(page).click({ position: { x: t.x, y: t.y } });
}

test('the office is drawn on the Ltd tab, summed up for screen readers, and not on the Daily tab', async ({ page }) => {
  await officeBreaks(page);
  await found(page);
  await expect(officeLabel(page)).toBeVisible();
  await expect(officeLabel(page)).toHaveAttribute('role', 'img');
  await expect(officeLabel(page)).toHaveAttribute('aria-label',
    'Your office, the spare room: 1 of 4 desks taken, 0 on contracts, 1 on everyday work, 0 applicants waiting.');
  // Two grads (one on a contract, one on everyday work, with the intern) and two applicants.
  await editCompany(page, s => {
    const grad = (id, name) => ({ id, name, role: 'Graduate', since: Date.now(), worked: 0, lang: { Python: 10 } });
    s.roster.push(grad('g1', 'Ben'), grad('g2', 'Mei'));
    s.jobs = [{ id: 'h1', tier: 0, lang: 'Python', risk: 'standard', expert: 0, sloc: 5, teamSloc: 5, team: ['g1'],
                startedAt: Date.now(), endsAt: Date.now() + 3600000, chance: 0.7, payout: 5, repeat: false, status: 'running', attempt: 1 }];
    s.applicants = ['a1', 'a2'].map(id => ({ id, role: 'Graduate', cost: 180, expiresAt: Date.now() + 3600000, person: grad(id, 'Applicant ' + id) }));
  });
  await expect(officeLabel(page)).toHaveAttribute('aria-label',
    'Your office, the spare room: 3 of 4 desks taken, 1 on contracts, 2 on everyday work, 2 applicants waiting.');
  const kinds = await page.evaluate(() => DebuggOffice.targets().map(t => t.kind + ':' + t.id).sort());
  expect(kinds).toEqual(['applicant:a1', 'applicant:a2', 'director:director', 'jobs:jobs', 'person:g1', 'person:g2',
                         'person:' + (await ltd(page)).roster.find(p => p.role === 'Intern').id].sort());
  // The Daily tab doesn't load the company, so there's no office there.
  await page.click('#dailyTab');
  await expect(page.locator('#ltdNote')).toBeVisible();
  await expect(page.locator('.office-canvas')).toHaveCount(0);
  await expect(page.locator('#ltdOffice')).toBeHidden();
});

test('tapping the office: a person opens their panel, an applicant opens their card, a stuck intern asks for help', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await officeBreaks(page);
  await found(page);
  await editCompany(page, s => {
    const grad = (id, name) => ({ id, name, role: 'Graduate', since: Date.now(), worked: 0, lang: { Python: 10 } });
    s.roster.push(grad('g1', 'Ben'));
    s.applicants = [{ id: 'a1', role: 'Junior', cost: 700, expiresAt: Date.now() + 3600000, person: grad('a1', 'Kiri') }];
  });
  await tapOffice(page, 'person', 'g1');
  await expect(page.locator('#personModal')).toBeVisible();
  await expect(page.locator('#personModalBody')).toContainText('Ben');
  await page.click('[data-action=close-person]');
  await tapOffice(page, 'applicant', 'a1');
  await expect(page.locator('#candidateModal')).toBeVisible();
  await expect(page.locator('#candidateModalBody')).toContainText('Kiri');
  await page.keyboard.press('Escape');
  expect((await ltd(page)).roster.some(p => p.id === 'a1')).toBe(false);   // hiring stays a button
  await stuckHotfix(page);
  await expect(page.locator('.job.stuck')).toBeVisible();
  await expect(officeLabel(page)).toHaveAttribute('aria-label', /, 1 stuck, /);
  await tapOffice(page, 'stuck', 'ij1');
  await expect(page.locator('.desk-q')).toBeVisible();
  expect((await ltd(page)).jobs[0].question).toBeTruthy();
});

test('the office is always shown: there is nothing to hide', async ({ page }) => {
  await found(page);
  await expect(officeLabel(page)).toBeVisible();
  await expect(page.locator('#officeToggle')).toHaveCount(0);
  await page.reload();
  await expect(officeLabel(page)).toBeVisible();
});

test('the studio still plays when the office view fails to load', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/ltd/office.js', r => r.abort());
  await found(page);
  await expect(page.locator('#ltdOffice')).toBeHidden();
  await openDesk(page);
  await page.click('[data-action=desk-start]');
  await expect(page.locator('.desk-q')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a small business unit has two floors, each with a meeting room and a kitchen; the spare room has no meeting room', async ({ page }) => {
  await officeBreaks(page, ['g2']);
  await found(page);
  const seed = premises => editCompany(page, (s, premises) => {
    s.office = { premises, owned: false };
    s.roster = s.roster.filter(p => p.role === 'Director' || p.role === 'Intern');
    const hire = (id, name, role) => ({ id, name, role, since: Date.now(), worked: 0, lang: { Python: 10 } });
    s.roster.push(hire('m1', 'Aroha', 'Manager'), hire('g1', 'Ben', 'Graduate'), hire('g2', 'Mei', 'Graduate'));
    const job = (id, team) => ({ id, tier: 0, lang: 'Python', risk: 'standard', expert: 0, sloc: 5, teamSloc: 5, team,
      startedAt: Date.now(), endsAt: Date.now() + 3600000, chance: 0.7, payout: 5, repeat: false, status: 'running', attempt: 1 });
    s.jobs = [job('h1', ['g1']), job('h2', ['g2']), job('h3', ['m1'])];
  }, premises);
  const where = () => page.evaluate(() => Object.fromEntries(DebuggOffice.targets().map(t => [t.id, t])));
  // In the spare room the manager on a contract stays at their desk, left of Mei in the kitchen.
  await seed('spare-room');
  await expect(officeLabel(page)).toHaveAttribute('aria-label', /^Your office, the spare room: 4 of 4 desks taken, 3 on contracts, 1 on everyday work, 1 on a break, /);
  await expect.poll(async () => { const t = await where(); return t.m1 && t.g1 && t.g2 && t.m1.x < t.g1.x && t.g1.x < t.g2.x; }).toBe(true);
  // In the unit: the manager is in the meeting room, between the desks and the kitchen; you're at
  // the first desk on the ground floor.
  await seed('unit-s');
  await expect(officeLabel(page)).toHaveAttribute('aria-label', /^Your office, a rented small business unit on 2 floors: 4 of 10 desks taken, /);
  await expect.poll(async () => {
    const t = await where();
    return !!(t.m1 && t.g1 && t.g2 && t.director) && t.director.x < t.g1.x && t.g1.x < t.m1.x && t.m1.x < t.g2.x && t.director.y === t.g1.y;
  }).toBe(true);
});

test('a new company is named, with its Director, who chooses how they look', async ({ page }) => {
  // On for this test (beforeEach opened the page with it off, as tests have it).
  await page.addInitScript(() => { window.DEBUGG_FOUNDING = true; });
  await page.goto('index.html?ltd');
  await page.click('#ltdLink');
  await expect(page.locator('#foundingModal')).toBeVisible();
  // Cancelling goes back to the card, with no company.
  await page.click('#foundingCancel');
  await expect(page.locator('#foundingModal')).toHaveCount(0);
  await expect(page.locator('#ltdIntro')).toBeVisible();
  expect(await ltd(page)).toBeNull();
  await page.click('#ltdLink');
  await page.fill('#foundingCompany', 'Kiwi Code Ltd');
  await page.fill('#foundingDirector', 'Aroha');
  for(const [name, value] of [['skin', '#9a6748'], ['hair', '#8b3a2a'], ['hairStyle', '4'], ['beard', '3'], ['glasses', '1'], ['shirt', '#2f6f9f']])
    await page.check('input[name="found-' + name + '"][value="' + value + '"]', { force: true });
  await page.click('#foundingStart');
  await expect(page.locator('#statMoney')).toBeVisible();
  await expect(page.locator('#welcomeToast')).toContainText('You’ve founded Kiwi Code Ltd');
  await expect(page.locator('.panel h2', { hasText: 'Kiwi Code Ltd' })).toBeVisible();
  await openPerson(page, 'director');
  await expect(page.locator('#personModalBody .modal-name')).toHaveText('Aroha');
  const s = await ltd(page);
  expect(s.companyName).toBe('Kiwi Code Ltd');
  expect(s.roster[0]).toMatchObject({ role: 'Director', name: 'Aroha',
    look: { skin: '#9a6748', hair: '#8b3a2a', hairStyle: 4, beard: 3, glasses: 1, shirt: '#2f6f9f' } });
  // The Director sits at the first desk, and can change all of it later.
  await expect.poll(() => page.evaluate(() => DebuggOffice.targets().some(t => t.kind === 'director'))).toBe(true);
  await page.click('[data-action=edit-founder]');
  await expect(page.locator('#foundingCompany')).toHaveValue('Kiwi Code Ltd');
  await expect(page.locator('input[name=found-glasses][value="1"]')).toBeChecked();
  await page.fill('#foundingDirector', 'Aroha T.');
  await page.check('input[name=found-glasses][value="0"]', { force: true });
  await page.click('#foundingStart');
  await openPerson(page, 'director');
  await expect(page.locator('#personModalBody .modal-name')).toHaveText('Aroha T.');
  expect((await ltd(page)).roster[0].look.glasses).toBe(0);
});

test('someone who has handed in their notice gets a speech bubble in the office, and the notifications bar is apart from Recent', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await officeBreaks(page, []);
  await found(page);
  await expect(page.locator('#notifications')).toBeHidden();
  await editCompany(page, s => {
    s.guideDone = true;
    s.roster.push({ id: 'g1', name: 'Ben', role: 'Graduate', since: Date.now(), worked: 0, lang: { Python: 10 },
                    notice: { reason: 'offer', until: Date.now() + 5 * 3600000, ask: 0.5 } });
  });
  await expect(page.locator('#notifications .alert[data-id=g1]')).toContainText('a better offer');
  await expect(page.locator('#log .alert')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => DebuggOffice.targets().some(t => t.kind === 'person' && t.id === 'g1'))).toBe(true);
  await expect(officeLabel(page)).toHaveAttribute('aria-label', /, 1 handed in their notice, /);
});

test('hiring is done from the applicant’s card in the interview room', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.money = 5000; s.guideDone = true;
    s.applicants = [{ id: 'a1', role: 'Graduate', cost: 180, expiresAt: Date.now() + 3600000,
                      person: { id: 'a1', name: 'Kiri T.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } } }];
  });
  // No applicants list in the Studio box any more, just a note and the way in.
  await expect(page.locator('.applicant')).toHaveCount(0);
  await expect(page.locator('#applicants')).toContainText('1 applicant is waiting in the interview room');
  await openCandidate(page, 'a1');
  await expect(page.locator('#candidateModalBody')).toContainText('Kiri T.');
  await expect(page.locator('#candidateModalBody')).toContainText('asking ¤180');
  await expect(page.locator('#candidateModalBody')).toContainText('Python');
  await expect(page.locator('#candidateModalBody [data-wfh]')).toHaveCount(0);   // working from home is the job board's
  await page.click('#candidateModalBody [data-action=hire-applicant]');
  await expect(page.locator('#candidateModal')).toBeHidden();
  expect((await ltd(page)).roster.find(p => p.id === 'a1')).toMatchObject({ role: 'Graduate' });
  // An offer that runs out while its card is open closes it.
  await editCompany(page, s => {
    s.applicants = [{ id: 'a2', role: 'Graduate', cost: 180, expiresAt: Date.now() + 3600000,
                      person: { id: 'a2', name: 'Moe R.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } } }];
  });
  await openCandidate(page, 'a2');
  await page.keyboard.press('Escape');
  await expect(page.locator('#candidateModal')).toBeHidden();
});

test('the job board: post a job for a fee, a candidate replies later, managers and work-from-home people are hired there', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await officeBreaks(page);
  await found(page);
  await editCompany(page, s => { s.money = 5000; s.guideDone = true; s.reputation = 10; });
  // The JOBS screen in the interview room opens it.
  await tapOffice(page, 'jobs', 'jobs');
  await expect(page.locator('#jobsModal')).toBeVisible();
  // In the spare room a manager can't be hired, but work-from-home people can.
  await expect(page.locator('.job-post', { has: page.locator('[data-role=Manager]') }).locator('.why')).toHaveText('managers need an office: move out of the spare room first');
  await expect(page.locator('[data-action=post-job][data-wfh="1"]')).toHaveCount(4);
  await expect(page.locator('[data-action=post-job][data-role=Senior]')).toBeDisabled();   // needs 500 reputation
  await page.click('[data-action=post-job][data-role=Graduate]');
  expect(Math.round((await ltd(page)).money)).toBe(4980);   // a tenth of ¤180 is ¤18, to the nearest ¤5 ¤20
  await expect(page.locator('#jobsModalBody')).toContainText('Work-from-home graduate · replies in');
  await expect(page.locator('#jobsModalBody')).toContainText('Nobody has replied yet');
  await page.keyboard.press('Escape');
  // An hour later: they reply, asking around the market price.
  await editCompany(page, s => { s.postings.forEach(p => { p.readyAt = Date.now() - 1000; }); });
  await expect(page.locator('#log')).toContainText('replied to your work-from-home graduate posting');
  await page.click('[data-action=open-jobs]');
  const c = (await ltd(page)).candidates[0];
  expect(c).toMatchObject({ role: 'Graduate', wfh: true });
  await expect(page.locator('.candidate')).toContainText('WFH');
  await page.click('[data-action=hire-candidate]');
  expect((await ltd(page)).roster.find(p => p.id === c.id)).toMatchObject({ role: 'Graduate', wfh: true });
  expect((await ltd(page)).candidates).toHaveLength(0);
  // A reply nobody picked up goes after a day.
  await page.keyboard.press('Escape');
  await editCompany(page, s => { s.candidates = [{ id: 'x1', role: 'Graduate', wfh: true, cost: 180, expiresAt: Date.now() - 1000,
    person: { id: 'x1', name: 'Zed Q.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } } }]; });
  await expect(page.locator('#log')).toContainText('Zed Q. (work-from-home graduate) took a job elsewhere.');
  // A reply takes an hour.
  await page.click('[data-action=open-jobs]');
  await page.click('[data-action=post-job][data-role=Graduate]');
  await page.keyboard.press('Escape');
  const posting = (await ltd(page)).postings[0];
  expect(posting.readyAt - at(12).getTime()).toBeGreaterThanOrEqual(3600000 - 1000);
  expect(posting.readyAt - at(12).getTime()).toBeLessThanOrEqual(3600000 + 60000);
});

test('clicking someone lists the contracts they could take, and Staff… opens the team picker with them ticked', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.guideDone = true; s.contractsOpen = true; s.firstClient = true;
    s.board.push({ id: 'o1', tier: 1, lang: 'Python', sloc: 600, expiresAt: Date.now() + 3600000 });
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.roster.push({ id: 'g2', name: 'Bo K.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  await openPerson(page, 'g1');
  await expect(page.locator('#personModalBody .contract-row').first()).toContainText('Feature');
  await page.locator('#personModalBody [data-action=staff-with]').first().click();
  await expect(page.locator('#personModal')).toBeHidden();
  await expect(page.locator('#teamModal')).toBeVisible();
  await expect(page.locator('label.pick', { hasText: 'Ada L.' }).locator('input')).toBeChecked();
  await expect(page.locator('label.pick', { hasText: 'Bo K.' }).locator('input')).not.toBeChecked();
  await page.keyboard.press('Escape');
  // On a contract: no list, just what they're on.
  await page.click('[data-action=staff][data-offer=o1]');
  await page.click('[data-pick=g1]');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job')).toHaveCount(1);
  await openPerson(page, 'g1');
  await expect(page.locator('#personModalBody .contract-row')).toHaveCount(0);
});

test('the SLOC/min cell shows what the code earns per minute, and the tooltip nets it against payroll', async ({ page }) => {
  await found(page);
  await expect(page.locator('#statIncome')).toHaveText('+¤0.1/min');   // just the intern's tiny share
  await editCompany(page, s => {
    s.guideDone = true;
    s.roster.find(p => p.role === 'Intern').pace = 1;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 }, pace: 1 });
  });
  // 5 SLOC/min of everyday work at ¤0.54 a line is ¤2.7, plus the intern's tiny share.
  await expect(page.locator('#statIncome')).toContainText('+¤2.8/min');
  await expect(page.locator('#statSloc')).toHaveText('5.2');
  await expect(page.locator('#statIncome')).toHaveAttribute('title', /everyday work \(0\.54 a line\).*against ¤2\/min payroll and rent: \+¤0\.8\/min net/);
});

test('clicking yourself in the office opens your desk, and a badge over your head says when a desk job is waiting', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await officeBreaks(page);
  await found(page);
  await expect(page.locator('[data-action=open-desk]')).toContainText('1 waiting');
  await expect(page.locator('#deskModal')).toBeHidden();
  await tapOffice(page, 'director', 'director');
  await expect(page.locator('#deskModal')).toBeVisible();
  await expect(page.locator('.desk-job')).toHaveCount(1);
  // Your details (name, look, languages) are one click away, and so is the desk from there.
  await page.click('[data-action=desk-details]');
  await expect(page.locator('#deskModal')).toBeHidden();
  await expect(page.locator('#personModalBody .modal-name')).toBeVisible();
  await page.click('#personModalBody [data-action=go-desk]');
  await expect(page.locator('#deskModal')).toBeVisible();
  await page.click('[data-action=close-desk]');
  await expect(page.locator('#deskModal')).toBeHidden();
  // The office knows how many desk jobs are waiting, to draw the badge.
  await editCompany(page, s => { s.desk.jobs = []; s.desk.nextAt = Date.now() + 3600000; });
  await expect(page.locator('[data-action=open-desk]')).toHaveText('Your desk');
}
);

test("the Director's XP is Ltd's own: the daily's XP counts for nothing, and desk answers level you up", async ({ page }) => {
  // Lots of daily XP, but none of it is Ltd's.
  await withStorage(page, { 'debuggit-daily-xp': { python: 5000, javascript: 5000 } });
  await found(page);
  expect((await ltd(page)).xp).toEqual({});
  await openPerson(page, 'director');
  await expect(page.locator('#personModalBody')).toContainText('Python Lv 1');
  await page.keyboard.press('Escape');

  // 96 XP is just short of level 2; a right difficulty-1 answer adds 6 and tips it over.
  await editCompany(page, s => { s.xp = { python: 96 }; });
  const learn = (await deskQuestions(page)).find(q => q.source === 'learn' && q.kind === 'choice');
  await setDeskJob(page, [learn]);
  await openDesk(page);
  await page.click('[data-action=desk-start][data-job=dj1]');
  await answerDesk(page, learn, true);
  expect((await ltd(page)).xp.python).toBe(102);
  await page.click('[data-action=desk-close]');
  await page.keyboard.press('Escape');
  await openPerson(page, 'director');
  await expect(page.locator('#personModalBody')).toContainText('Python Lv 2 (+1% success)');
});

test('the Director knows a language once Ltd XP has been earned in it, never from the daily; Python is always known', async ({ page }) => {
  // JavaScript is in the rotation, so it's a language the Director could know.
  await page.addInitScript(() => { window.DEBUGG_ROTATION = [{ lang: 'python' }, { lang: 'javascript' }]; });
  await withStorage(page, { 'debuggit-daily-xp': { javascript: 500 } });  // the daily's JavaScript XP counts for nothing here
  await found(page);
  const intern = (await ltd(page)).roster.find(p => p.role === 'Intern');
  const js = (await ltd(page)).board.find(o => o.tier === 0 && !o.expert && o.lang === 'JavaScript');
  const knowCheck = page.locator('#teamModal .check', { hasText: 'know JavaScript' });
  const pickPair = async () => {
    await page.click('[data-action=staff][data-offer="' + js.id + '"]');
    await page.click('[data-pick="' + intern.id + '"]');
    await page.click('[data-pick="director"]');
  };
  await pickPair();
  await expect(knowCheck).toHaveClass(/no/);
  await expect(knowCheck).toHaveText('✕ you or ' + intern.name + ' know JavaScript');
  await page.click('[data-action=pick-cancel]');

  // With JavaScript XP in the Ltd save (a right JavaScript answer gives it), the Director is comfortable in it.
  await editCompany(page, s => { s.xp = { javascript: 6 }; });
  await pickPair();
  await expect(knowCheck).not.toHaveClass(/no/);
});
