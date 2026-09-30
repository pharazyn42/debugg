// Debuggit Ltd: switching the studio on, desk jobs, the Director's languages,
// the studio engine, the contract board, pausing, closing, importing old saves and the
// /studio/ redirect.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openAt, fresh, withStorage, puzzleFor, guess, readJson } = require('./helpers');

const at = (h, m = 0) => new Date(2026, 9, 7, h, m, 0);  // Day 3, a Wednesday
const ltd = page => readJson(page, 'debugg-ltd');

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
// Replaces the desk's jobs with one asking these questions (and no more arriving for a while).
async function setDeskJob(page, questions){
  await page.evaluate(ids => {
    if(window.DebuggLtd) window.DebuggLtd.stop();
    const s = JSON.parse(localStorage.getItem('debugg-ltd'));
    s.desk.jobs = [{ id: 'dj1', size: ids.length, questions: ids, answered: [], expiresAt: Date.now() + 3600000 }];
    s.desk.nextAt = Date.now() + 3600000;
    localStorage.setItem('debugg-ltd', JSON.stringify(s));
  }, questions.map(q => q.id));
  await page.reload();
  await expect(page.locator('[data-action=desk-start][data-job=dj1]')).toBeVisible();
}

// Edits the saved company, then reloads.
async function editCompany(page, fn){
  await page.evaluate(src => {
    if(window.DebuggLtd) window.DebuggLtd.stop();  // so the running page can't save over the edit
    const s = JSON.parse(localStorage.getItem('debugg-ltd'));
    new Function('s', src)(s);
    localStorage.setItem('debugg-ltd', JSON.stringify(s));
  }, '(' + fn.toString() + ')(s)');
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
  // The wordmark becomes the studio's.
  await expect(page.locator('#wordmark')).toHaveAttribute('data-wordmark', 'debugg.ltd()');
  await expect(page.locator('#wordmark')).toHaveAttribute('aria-label', 'Debuggit Ltd');
});

test("founding pays a founder's bonus for puzzle XP, capped at ¤1,000", async ({ page }) => {
  await withStorage(page, { 'debugg-xp': { python: 450, javascript: 120 } });
  await found(page);
  await expect(page.locator('#statMoney')).toHaveText('¤720');
  await expect(page.locator('#welcomeToast')).toContainText('¤570 founder’s bonus');

  await page.click('#ltdClose');
  await withStorage(page, { 'debugg-xp': { python: 5000 } });
  await found(page);
  await expect(page.locator('#statMoney')).toHaveText('¤1,150');
});

test('the daily puzzle is its own game: it pays the company nothing, and the Ltd tab shows the desk instead', async ({ page }) => {
  await found(page);
  await expect(page.locator('main.desk')).toBeHidden();
  await expect(page.locator('#ltdDesk')).toBeVisible();
  await expect(page.locator('#ltdDesk h2')).toContainText('Your desk');
  // A new company's first desk job is waiting straight away.
  await expect(page.locator('.desk-job')).toHaveCount(1);
  // On the Daily tab the company isn't loaded, and a solve pays it nothing.
  await page.click('#dailyTab');
  expect(await page.evaluate(() => typeof window.DebuggLtd)).toBe('undefined');
  await expect(page.locator('#ltdNote')).toHaveText('Your company is running, with 1 desk job waiting. Open Ltd →');
  await guess(page, (await puzzleFor(page, 3)).display);
  expect((await ltd(page)).money).toBe(150);
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
  await page.click('[data-action=desk-start][data-job=dj1]');
  await expect(page.locator('.desk-q-num')).toHaveText('Question 1 of 2');
  await answerDesk(page, daily, true);
  // Answers are saved as they're given: a reload carries on from the next question.
  await page.reload();
  await expect(page.locator('.desk-job')).toContainText('1 answered');
  await page.click('[data-action=desk-start][data-job=dj1]');
  await expect(page.locator('.desk-q-num')).toHaveText('Question 2 of 2');
  await answerDesk(page, learn, true);
  await expect(page.locator('#deskDone')).toContainText('Desk job: 2 of 2 right, ¤138 (with the ×1.25 bonus for getting them all) and +2 reputation.');
  expect((await ltd(page)).money).toBe(150 + 138);
  expect((await ltd(page)).desk).toMatchObject({ jobs: [], done: 1 });
  expect((await ltd(page)).desk.seen).toEqual([daily.id, learn.id]);

  // One wrong: only the right one pays, with no bonus.
  await setDeskJob(page, [daily, learn]);
  await page.click('[data-action=desk-start][data-job=dj1]');
  await answerDesk(page, daily, false);
  await answerDesk(page, learn, true);
  await expect(page.locator('#deskDone')).toContainText('Desk job: 1 of 2 right, ¤40 and +1 reputation.');
  // Every kind of question plays: typed, choice and tap the line.
  for(const kind of ['typed', 'line']){
    const q = qs.find(x => x.kind === kind);
    await setDeskJob(page, [q]);
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
  await expect(page.locator('.desk-job').nth(1)).toBeVisible();
  const desk = (await ltd(page)).desk;
  expect(desk.jobs.length).toBeGreaterThanOrEqual(2);
  expect(desk.jobs.length).toBeLessThanOrEqual(3);
  expect(desk.jobs.map(j => j.id)).not.toContain('old');
  expect(desk.jobs.every(j => j.expiresAt > Date.now() && j.size >= 1 && j.size <= 3)).toBe(true);
  expect(desk.nextAt).toBeGreaterThan(Date.now());
  // No question is asked twice across waiting jobs.
  const ids = desk.jobs.flatMap(j => j.questions);
  expect(new Set(ids).size).toBe(ids.length);
  await expect(page.locator('#deskCount')).toHaveText(desk.jobs.length + ' waiting');
});

test("the Director's puzzle levels boost contract success in that language", async ({ page }) => {
  await withStorage(page, { 'debugg-xp': { python: 450 } }); // Python level 3: +2%
  await found(page);
  await expect(page.locator('.card.director')).toContainText('Python Lv 3 (+2% success)');
  await editCompany(page, s => {
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.board[0] = { id: 'o1', tier: 0, lang: 'Python', sloc: 5, expiresAt: Date.now() + 3600000 };
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
  await withStorage(page, { 'debugg-xp': { python: 100 } });  // a ¤100 founder's bonus
  await found(page);
  // ¤150 is just short of a graduate's ¤180.
  await expect(page.locator('#statMoney')).toHaveText('¤250');
  await page.click('[data-action=hire][data-role=Graduate]');
  await expect(page.locator('#statMoney')).toHaveText('¤70');
  await expect(page.locator('#statHeads')).toHaveText('2');
  await editCompany(page, s => {
    const g = s.roster.find(p => p.role === 'Graduate');
    g.lang = { Python: 10 };
    s.jobs.push({ id: 'j1', tier: 0, lang: 'Python', sloc: 5, teamSloc: 5, team: [g.id],
                  startedAt: Date.now(), endsAt: Date.now() + 60000, chance: 1, payout: 20, repeat: false,
                  status: 'running', attempt: 1 });
  });
  await page.clock.setFixedTime(at(12, 30));
  await page.reload();
  // 30 minutes of a ¤2/min salary, plus the ¤20 contract.
  await expect(page.locator('#statMoney')).toHaveText('¤30');
  await expect(page.locator('#welcomeToast')).toContainText('1 contract wrapped up while you were away');
  await expect(page.locator('#log')).toContainText('delivered');
});

test('hiring costs only go up, with inflation and competition', async ({ page }) => {
  await withStorage(page, { 'debugg-xp': { python: 300 } });
  await found(page);
  const grad = page.locator('[data-action=hire][data-role=Graduate] .cost');
  await expect(grad).toHaveText('¤180');
  const nextAt = (await ltd(page)).market.nextAt - await page.evaluate(() => Date.now());
  expect(nextAt).toBeGreaterThanOrEqual(12 * 3600000 - 60000);
  expect(nextAt).toBeLessThanOrEqual(36 * 3600000);
  // A rival hiring graduates has pushed their price up by half.
  await editCompany(page, s => { s.market.prices.Graduate = 1.5; });
  await expect(grad).toHaveText('¤270 ↑50%');
  await page.click('[data-action=hire][data-role=Graduate]');
  await expect(page.locator('#statMoney')).toHaveText('¤180');
  // A move that's due happens on load, and is logged; prices never fall.
  await editCompany(page, s => { s.market.nextAt = Date.now() - 1000; });
  await expect(page.locator('#log')).toContainText(/Inflation: every hire costs|Competition: a rival studio is hiring/);
  const prices = (await ltd(page)).market.prices;
  expect(Object.values(prices).some(m => m > 1)).toBe(true);
  expect(Object.values(prices).every(m => m >= 1)).toBe(true);
  expect(prices.Graduate).toBeGreaterThanOrEqual(1.5);
});

test('experienced developers apply now and then; only grads and managers have hire buttons', async ({ page }) => {
  await found(page);
  await expect(page.locator('[data-action=hire]')).toHaveCount(2);
  await expect(page.locator('[data-action=hire][data-role=Junior]')).toHaveCount(0);
  await expect(page.locator('#applicants')).toContainText('Nobody’s applied yet');
  await expect(page.locator('#applicants')).toContainText('Seniors apply once the studio has 500 reputation; Principals apply once the studio has 3,000 reputation');
  const now = await page.evaluate(() => Date.now());
  expect((await ltd(page)).nextApplicantAt - now).toBe(2 * 3600000);

  // Someone applies. With no reputation yet, it's a junior.
  await editCompany(page, s => { s.money = 5000; s.nextApplicantAt = Date.now() - 1000; });
  const saved = await ltd(page);
  expect(saved.applicants).toHaveLength(1);
  const a = saved.applicants[0];
  expect(a.role).toBe('Junior');
  expect(a.cost).toBeGreaterThanOrEqual(675);
  expect(a.cost).toBeLessThanOrEqual(900);
  expect(saved.nextApplicantAt - now).toBeGreaterThanOrEqual(8 * 3600000 - 1000);
  await expect(page.locator('#log')).toContainText('applied to join as a junior');
  const card = page.locator('.applicant[data-applicant="' + a.id + '"]');
  await expect(card).toContainText('Offer open 12h');
  await card.locator('[data-action=hire-applicant]').click();
  await expect(page.locator('.applicant')).toHaveCount(0);
  const after = await ltd(page);
  expect(after.money).toBeCloseTo(5000 - a.cost, 0);
  expect(after.roster.find(p => p.id === a.id).role).toBe('Junior');

  // An offer that runs out is gone.
  await editCompany(page, s => {
    s.applicants = [{ id: 'x1', role: 'Senior', cost: 3000, expiresAt: Date.now() - 1000,
                      person: { id: 'x1', name: 'Sam Q.', role: 'Senior', since: Date.now(), lang: { Rust: 150 } } }];
  });
  expect((await ltd(page)).applicants).toHaveLength(0);
  await expect(page.locator('#log')).toContainText('Sam Q. (senior) took a job elsewhere.');
});

test('the Ltd tab is Debuggit Ltd, and a guide walks through the first steps', async ({ page }) => {
  await withStorage(page, { 'debugg-xp': { python: 100 } });
  await found(page);
  await expect(page.locator('h1')).toHaveText('Debuggit Ltd');
  await expect(page).toHaveTitle('Debuggit Ltd');
  // 1. Hire a graduate.
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'hire');
  await expect(page.locator('[data-action=hire][data-role=Graduate]')).toHaveClass(/guide-target/);
  await page.click('[data-action=hire][data-role=Graduate]');
  // 2. Put them on a hotfix they can take, with repeat on.
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'staff');
  const grad = (await ltd(page)).roster[1];
  const lang = Object.keys(grad.lang)[0];
  await expect(page.locator('.guide')).toContainText('Put ' + grad.name + ' to work');
  const target = page.locator('[data-action=staff].guide-target');
  await expect(target).toHaveCount(1);
  await expect(page.locator('.offer:has(.guide-target) .chip.lang')).toHaveText(lang);
  // Grads are full at one while you're alone, and the note says why.
  await expect(page.locator('#structureNote')).toContainText('Grads 1/1 are full, though you have room for 3 more devs (Devs 1/4)');
  await target.click();
  await page.click('[data-pick="' + grad.id + '"]');
  await page.click('[data-action=pick-start]');
  // 3. Take a desk job.
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'desk');
  const job = (await ltd(page)).desk.jobs[0];
  const qs = await page.evaluate(ids => { const all = DebuggDesk.all(Debugg.today()); return ids.map(id => all.get(id)); }, job.questions);
  await page.click('[data-action=desk-start].guide-target');
  for(const q of qs) await answerDesk(page, q, true);
  await expect(page.locator('.guide')).toHaveCount(0);
  expect((await ltd(page)).guideDone).toBe(true);
});

test('staff on the bench and debt are flagged; the welcome can be dismissed', async ({ page }) => {
  await found(page);
  await page.click('#welcomeToast [data-action=close-toast]');
  await expect(page.locator('#welcomeToast')).toBeHidden();
  await editCompany(page, s => {
    s.guideDone = true;
    s.money = -50;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  await expect(page.locator('.guide')).toHaveCount(0);
  await expect(page.locator('[data-alert=idle]')).toContainText('Ada L. is on the bench doing odd jobs, which only just cover their salary (+¤0.1/min)');
  await expect(page.locator('[data-alert=debt]')).toContainText('The company is ¤50 in debt');
  await expect(page.locator('.card[data-id=g1]')).toContainText('On the bench · odd jobs · +¤0.1/min');
});

test('language skills are open-ended levels, each with a bar towards the next', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'p1', name: 'Grace H.', role: 'Principal', since: Date.now(), worked: 0,
                    lang: { Python: 2600, Rust: 60, JavaScript: 5 } });
  });
  await expect(page.locator('.card[data-id=p1]')).toContainText('Python Lv 6 · Rust Lv 2');
  await page.click('.card[data-id=p1] .card-name');
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

  // A manager joins (from an old save, say): it's a small business, and they staff the idle grad.
  await editCompany(page, s => {
    s.guideDone = true;
    s.roster.push({ id: 'm1', name: 'Mo M.', role: 'Manager', since: Date.now(), lang: {} });
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  await expect(page.locator('.stage-name')).toHaveText('Small business');
  await expect(page.locator('.stage-bar')).toContainText('Next: Mid-size company, with 3 managers (you have 1) and 25 staff (you have 3)');
  await expect(page.locator('#log')).toContainText('Debuggit Ltd is now a small business.');
  await expect(page.locator('#log')).toContainText('Your managers put Ada L. to work.');
  const job = (await ltd(page)).jobs[0];
  expect(job).toMatchObject({ team: ['g1'], lang: 'Python', tier: 0, repeat: true });
  expect((await ltd(page)).stage).toBe('small');

  // The desk pays half: a Learn question's ¤40 is ¤20.
  const q = (await deskQuestions(page)).find(x => x.source === 'learn' && x.kind === 'choice');
  await setDeskJob(page, [q]);
  const money = (await ltd(page)).money;
  await page.click('[data-action=desk-start][data-job=dj1]');
  await answerDesk(page, q, true);
  await expect(page.locator('#deskDone')).toContainText('¤20 (a small business gets 50% of desk pay)');
});

test('developers on the bench do odd jobs, which cover their salary with 5% to spare', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  await editCompany(page, s => {
    s.guideDone = true;
    s.money = 1000;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.roster.push({ id: 's1', name: 'Sam Q.', role: 'Senior', since: Date.now(), lang: { Rust: 150 } });
  });
  // An hour away: a grad earns ¤2.10/min on odd jobs against ¤2/min salary, a senior ¤12.60 against ¤12,
  // so the company grows by ¤0.70/min: ¤42 over the hour.
  await page.clock.setFixedTime(at(13));
  await page.reload();
  await expect(page.locator('#statMoney')).toHaveText('¤1,042');
  // No XP and no promotion time for the bench.
  const saved = await ltd(page);
  expect(saved.roster.find(p => p.id === 'g1')).toMatchObject({ lang: { Python: 10 } });
  expect(saved.roster.find(p => p.id === 'g1').worked || 0).toBe(0);
  await expect(page.locator('.card[data-id=s1]')).toContainText('On the bench · odd jobs · +¤0.6/min');

  // Only the bench earns it: not someone on a contract (even a failed one waiting for Retry or
  // Drop), and not someone away (training, holiday, off sick).
  await editCompany(page, s => {
    s.money = 1000;
    s.jobs.push({ id: 'j1', tier: 0, lang: 'Python', sloc: 5, teamSloc: 5, team: ['g1'], startedAt: Date.now() - 120000,
                  endsAt: Date.now() - 60000, chance: 1, payout: 5, repeat: false, status: 'failed', attempt: 2 });
    s.roster.find(p => p.id === 's1').away = { kind: 'holiday', until: Date.now() + 2 * 3600000 };
  });
  await page.clock.setFixedTime(at(14));
  await page.reload();
  // Both just cost their salary for the hour: 60 × (¤2 + ¤12).
  await expect(page.locator('#statMoney')).toHaveText('¤160');
});

test('risky contracts pay more, succeed less often, and cost more reputation when they fail', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  // Some offers are rolled risky; the board has every level over time.
  const risks = await page.evaluate(() => JSON.parse(localStorage.getItem('debugg-ltd')).board.map(o => o.risk));
  expect(risks.every(r => ['standard', 'risky', 'high'].includes(r))).toBe(true);
  await editCompany(page, s => {
    s.guideDone = true;
    s.reputation = 10;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.board[0] = { id: 'o1', tier: 0, lang: 'Python', sloc: 5, risk: 'high', expiresAt: Date.now() + 3600000 };
  });
  const offer = page.locator('.offer:has([data-offer=o1])');
  await expect(offer.locator('.risk.high')).toHaveText('High stakes · pays ×2 · −30% success');
  await page.click('[data-action=staff][data-offer=o1]');
  await page.click('[data-pick=g1]');
  // A grad's 70% reliability, +1% for 1 bar of Python, −30% for the risk; double the ¤5.
  await expect(page.locator('.forecast')).toContainText('Success chance 41% (incl. −30% for the risk) · Payout ¤10 (×2)');
  await expect(page.locator('.forecast')).toContainText('each failure costs 4× the usual reputation');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job')).toContainText('High stakes');
  expect((await ltd(page)).jobs[0]).toMatchObject({ risk: 'high', payout: 10, chance: 0.41 });

  // A failed retry loses the contract and 4× the usual reputation (a hotfix's 0.5 ÷ 2 × 4 = 1).
  await editCompany(page, s => {
    Object.assign(s.jobs[0], { chance: 0, attempt: 2, endsAt: Date.now() - 1000 });
  });
  await expect(page.locator('#log')).toContainText('✕ high stakes Hotfix (Python) retry failed again — contract lost.');
  expect((await ltd(page)).reputation).toBe(9);
});

test('a repeating contract always retries a failure itself, even one from long ago', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  await editCompany(page, s => {
    s.guideDone = true;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now() - 8 * 3600000, lang: { Python: 10 } });
    s.board[0] = { id: 'o1', tier: 0, lang: 'Python', sloc: 5, risk: 'standard', expiresAt: Date.now() + 3600000 };
  });
  await page.click('[data-action=staff][data-offer=o1]');
  await page.click('[data-pick=g1]');
  await page.click('[data-action=pick-start]');  // hotfixes repeat by default
  await expect(page.locator('.job')).toHaveCount(1);

  // It failed 6 hours ago, before the 4-hour offline cap: it retries from the cap, not waiting.
  await editCompany(page, s => {
    Object.assign(s.jobs[0], { chance: 0, startedAt: Date.now() - 6 * 3600000 - 60000, endsAt: Date.now() - 6 * 3600000 });
  });
  await expect(page.locator('#log')).toContainText('↻ Retrying Hotfix (Python)');
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

test('a repeating contract keeps working through the last 4 hours of a long time away', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await found(page);
  // A grad on a repeating Python hotfix that finished 8 hours ago, when the page was closed.
  await editCompany(page, s => {
    s.guideDone = true;
    s.money = 1000;
    s.lastTick = Date.now() - 8 * 3600000;
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now() - 9 * 3600000, lang: { Python: 10 } });
    s.jobs = [{ id: 'j1', tier: 0, lang: 'Python', risk: 'standard', expert: 0, sloc: 5, teamSloc: 6, team: ['g1'],
                startedAt: Date.now() - 8 * 3600000 - 50000, endsAt: Date.now() - 8 * 3600000,
                chance: 1, payout: 5, repeat: true, status: 'running', attempt: 1 }];
  });
  // Payroll is drawn for 4 hours (¤480), and the repeats ran through those 4 hours: a couple of
  // hundred hotfixes, about ¤1,000 and 70 reputation, and one still going.
  const s = await ltd(page);
  const job = s.jobs.find(j => j.team.includes('g1'));
  expect(job).toMatchObject({ status: 'running', repeat: true });
  expect(job.endsAt).toBeGreaterThan(Date.now());
  expect(s.reputation).toBeGreaterThan(40);
  expect(s.money).toBeGreaterThan(1300);
});

test('the board has a hotfix in every language, and no domains', async ({ page }) => {
  await found(page);
  const hotfixes = page.locator('.board-group[data-tier=hotfix] .offer:not(.expert-offer)');
  await expect(hotfixes).toHaveCount(4);
  await expect(hotfixes.locator('.chip.lang')).toHaveText(['Python', 'C/C++', 'JavaScript', 'Rust']);
  // …plus an expert hotfix, last.
  await expect(page.locator('.board-group[data-tier=hotfix] .offer').last()).toHaveClass(/expert-offer/);
  await expect(page.locator('.board-group .level-name')).toHaveText(['Hotfixes', 'Patches', 'Minor releases', 'Major releases']);
  const saved = await ltd(page);
  expect(JSON.stringify(saved)).not.toContain('"dom"');
  expect(saved.board.filter(o => o.tier !== 0)).toHaveLength(0);
});

// Adds staff until the company has `n` people, the Director included.
const staffUpTo = n => new Function('s', `
  while(s.roster.length < ${n}) s.roster.push({ id: 'g' + s.roster.length, name: 'Grad ' + s.roster.length, role: 'Graduate', since: Date.now(), lang: { Python: 10, 'C/C++': 10, JavaScript: 10, Rust: 10 } });`);

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
  expect((await ltd(page)).board.filter(o => o.tier === 1)).toHaveLength(0);
});

test('the demo runs hotfixes and patches, with managers', async ({ page }) => {
  await found(page);
  await expect(page.locator('#welcomeToast')).toContainText('In the demo it runs hotfixes, and patches once you have more than 10 staff');
  await expect(page.locator('#welcomeToast')).toContainText('reset when v0.1 comes out');
  // Managers can be hired (this company just can't afford one yet).
  await expect(page.locator('[data-action=hire][data-role=Manager] .why')).toHaveText('not enough cash');
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
    s.board.push({ id: 'm1', tier: 2, lang: 'Python', sloc: 2700, expiresAt: Date.now() + 3600000 });
  });
  expect((await ltd(page)).board.filter(o => o.tier > 1)).toHaveLength(0);
});

test('a hotfix that is taken is replaced in the same language', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Rust: 10 } });
    s.board.find(o => o.tier === 0 && o.lang === 'Rust').id = 'rust1';
  });
  // Only the Rust hotfix can be taken; the other three fold away (the expert hotfix aside).
  const hotfixes = page.locator('.board-group[data-tier=hotfix] .offer:not(.expert-offer)');
  await expect(hotfixes).toHaveCount(1);
  await expect(hotfixes.locator('.chip.lang')).toHaveText('Rust');
  await page.click('.board-group[data-tier=hotfix] [data-action=toggle-unknown]');
  await expect(hotfixes).toHaveCount(4);
  await expect(hotfixes.nth(1)).toContainText('Nobody on staff knows');
  await page.click('.board-group[data-tier=hotfix] [data-action=toggle-unknown]');
  await expect(hotfixes).toHaveCount(1);
  await page.click('[data-action=staff][data-offer=rust1]');
  await page.click('[data-pick=g1]');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job')).toContainText('Rust');
  const board = (await ltd(page)).board.filter(o => o.tier === 0 && !o.expert);
  expect(board.map(o => o.lang).sort()).toEqual(['C/C++', 'JavaScript', 'Python', 'Rust']);
  expect(board.find(o => o.id === 'rust1')).toBeUndefined();
  await expect(page.locator('.board-group[data-tier=hotfix] .level-count')).toHaveText('×5 · 1 running');
});

test('everyone needs a desk: the spare room has 4, then co-working desks for rent', async ({ page }) => {
  await found(page);
  await expect(page.locator('.office')).toContainText('your spare room, 4 desks · 0/4 desks used');
  await expect(page.locator('[data-action=cowork-drop]')).toHaveCount(0);
  await editCompany(page, s => {
    s.money = 5000;
    s.roster.push({ id: 'j0', name: 'Jun 0', role: 'Junior', since: Date.now(), lang: { Python: 150 } });
    for(let i = 0; i < 3; i++) s.roster.push({ id: 'g' + i, name: 'Grad ' + i, role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  // The spare room is full, so it's cramped, and a manager would have to be squeezed in.
  await expect(page.locator('.slot', { hasText: 'Desks' })).toHaveText('Desks 4/4');
  await expect(page.locator('.office .cramped')).toHaveText('Every desk is taken: cramped, so everyone is 5% slower on new contracts, and likelier to hand in their notice.');
  await expect(page.locator('[data-action=hire][data-role=Manager] .why')).toHaveText('no desk: squeezed in, everyone −15% speed');
  await page.click('[data-action=cowork-add]');
  await expect(page.locator('.office .cramped')).toHaveCount(0);
  await expect(page.locator('.office')).toContainText('+ 1 co-working desk (¤1/min) · 4/5 desks used');
  await expect(page.locator('#statPayrollLabel')).toHaveText('Payroll + rent');
  await expect(page.locator('#statPayroll')).toHaveText('−¤12/min');  // ¤11 salaries + ¤1 rent
  await page.click('[data-action=hire][data-role=Manager]');
  await expect(page.locator('.office')).toContainText('5/5 desks used');
  expect((await ltd(page)).office).toEqual({ cowork: 1 });

  // Rent is paid every second, like salaries, while away too: 10 minutes of ¤1/min.
  await editCompany(page, s => {
    s.roster = s.roster.filter(p => p.role === 'Director');
    s.money = 100;
    s.lastTick = Date.now() - 10 * 60000;
  });
  expect(Math.round((await ltd(page)).money)).toBe(90);
  await page.click('[data-action=cowork-drop]');
  expect((await ltd(page)).office).toEqual({ cowork: 0 });
  await expect(page.locator('#statPayrollLabel')).toHaveText('Payroll');
});

test('a full office is cramped: up to 2 more can be squeezed in, each slowing everyone more', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.money = 5000; s.guideDone = true;
    s.roster.push({ id: 'j0', name: 'Jun 0', role: 'Junior', since: Date.now(), lang: { Python: 150 } });
    for(let i = 0; i < 3; i++) s.roster.push({ id: 'g' + i, name: 'Grad ' + i, role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.board.find(o => o.tier === 0 && o.lang === 'Python' && !o.expert).id = 'py1';
  });
  // Every desk taken: 5% slower. A junior at Lv 3 writes 12 × 1.6 = 19.2 SLOC/min; 5% less is 18.2.
  await expect(page.locator('.office .cramped')).toContainText('Every desk is taken: cramped, so everyone is 5% slower');
  await page.click('[data-action=staff][data-offer=py1]');
  await expect(page.locator('label.pick', { hasText: 'Jun 0' })).toContainText('18.2 SLOC/min');
  await page.keyboard.press('Escape');
  // Two managers squeezed in: 30% slower, and nobody else fits.
  await editCompany(page, s => {
    for(let i = 0; i < 2; i++) s.roster.push({ id: 'm' + i, name: 'Manager ' + i, role: 'Manager', since: Date.now(), lang: {} });
  });
  await expect(page.locator('.office .cramped')).toContainText('2 squeezed in without a desk: cramped, so everyone is 30% slower');
  await expect(page.locator('[data-action=hire][data-role=Manager] .why')).toHaveText('no room to squeeze anyone else in — rent a co-working desk');
  // A desk for one of them: one squeezed in, 15% slower, and room to squeeze in one more.
  await page.click('[data-action=cowork-add]');
  await expect(page.locator('.office .cramped')).toContainText('1 squeezed in without a desk: cramped, so everyone is 15% slower');
  await expect(page.locator('[data-action=hire][data-role=Manager] .why')).toHaveText('no desk: squeezed in, everyone −30% speed');
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
  await expect(page.locator('.alert[data-alert=notice]')).toContainText('2 people have handed in their notice');
  await expect(page.locator('.card[data-id=g1] .notice')).toContainText('Handed in notice · leaves in 18h · has a better offer');
  await expect(page.locator('#statPayroll')).toHaveText('−¤4/min');
  await page.click('[data-action=keep][data-id=g1]');
  await expect(page.locator('.card[data-id=g1] .notice')).toHaveCount(0);
  await expect(page.locator('.card[data-id=g1]')).toContainText('−¤2.5/min');
  await expect(page.locator('#statPayroll')).toHaveText('−¤4.5/min');
  expect((await ltd(page)).roster.find(p => p.id === 'g1')).toMatchObject({ raise: 0.5 });
  expect((await ltd(page)).roster.find(p => p.id === 'g1').notice).toBeUndefined();
  // The other one's notice runs out: they leave.
  await editCompany(page, s => { s.roster.find(p => p.id === 'g2').notice.until = Date.now() - 1000; });
  await expect(page.locator('.card[data-id=g2]')).toHaveCount(0);
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
  await expect(page.locator('.card[data-id=j0] .notice')).toContainText('the office is too cramped');
  await expect(page.locator('.alert[data-alert=notice]')).toContainText('or free up a desk');
  await page.click('[data-action=cowork-add]');
  await expect(page.locator('.card[data-id=j0] .notice')).toHaveCount(0);
  await expect(page.locator('#log')).toContainText('Jun 0 is staying, now there’s room in the office.');
});

test('a company from before desks gets co-working desks for everyone it has', async ({ page }) => {
  await found(page);
  await editCompany(page, s => { delete s.office; });
  expect((await ltd(page)).office).toEqual({ cowork: 0 });
  await editCompany(page, s => {
    delete s.office;
    for(let i = 0; i < 6; i++) s.roster.push({ id: 'g' + i, name: 'Grad ' + i, role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
  });
  expect((await ltd(page)).office).toEqual({ cowork: 2 });
  await expect(page.locator('.office')).toContainText('6/6 desks used');
});

test('expert contracts need someone at a skill level, and pay more', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 } });
    s.roster.push({ id: 'j1', name: 'Bo K.', role: 'Junior', since: Date.now(), lang: { Python: 1000 } });
    const e = s.board.find(o => o.tier === 0 && o.expert);
    Object.assign(e, { id: 'x1', lang: 'Python', expert: 5, risk: 'standard', sloc: 5 });
  });
  const offer = page.locator('.offer.expert-offer');
  await expect(offer.locator('.expert')).toHaveText('Expert · needs Lv 5 Python · pays ×1.6');
  await page.click('[data-action=staff][data-offer=x1]');
  // Only someone at Lv 5 can take it on their own.
  await expect(page.locator('[data-pick=g1]')).toHaveCount(0);
  await page.click('[data-pick=j1]');
  await page.click('[data-action=pick-start]');
  await expect(page.locator('.job .expert-tag')).toHaveText('Lv 5');
  const job = (await ltd(page)).jobs.find(j => j.id === 'x1');
  expect(job).toMatchObject({ expert: 5, payout: 8 });  // 5 SLOC × 1.6
  // The board keeps an expert hotfix.
  expect((await ltd(page)).board.filter(o => o.tier === 0 && o.expert)).toHaveLength(1);
});

test('each skill level past 5 adds a little speed', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'p1', name: 'Grace H.', role: 'Principal', since: Date.now(), lang: { Python: 5800 } });
    const o = s.board.find(o => o.tier === 0 && o.lang === 'Python' && !o.expert);
    o.id = 'py1';
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
  await withStorage(page, { 'debugg-xp': { python: 100 } });
  await found(page);
  await page.click('[data-action=hire][data-role=Graduate]');
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
  await page.click('.card[data-id=g1] .card-name');
  await expect(page.locator('#personModalBody')).toContainText('○ A language at level 3');
  await page.keyboard.press('Escape');
  await editCompany(page, s => { s.roster.find(p => p.id === 'g1').lang.Python = 150; });
  await expect(page.locator('[data-action=promote][data-id=g1]')).toHaveText('Promote to Junior');
  await page.click('.card[data-id=g1] .card-name');
  await expect(page.locator('#personModalBody')).toContainText('✓ A language at level 3');
  await expect(page.locator('#personModalBody')).not.toContainText('omain');
});

test('pausing stops the clock until the company is resumed', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
  await withStorage(page, { 'debugg-xp': { python: 100 } });
  await found(page);
  await page.click('[data-action=hire][data-role=Graduate]');
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
  expect(await readJson(page, 'debugg-xp')).toBeNull();

  await page.click('#dailyTab');
  await expect(page.locator('#ltdNote')).toBeVisible();
  await guess(page, (await puzzleFor(page, 3)).display);
  await page.click('#ltdNote a');
  await page.click('#ltdClose');
  await expect(page.locator('body')).not.toHaveClass(/ltd-on/);
  expect(await ltd(page)).toBeNull();
  expect((await readJson(page, 'debugg-xp')).python).toBe(100);
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
  await expect(page.locator('#statMoney')).toHaveText('¤150');
});

test('Daily and Ltd are tabs; on the Daily tab a running company is a note linking to it', async ({ page }) => {
  await expect(page.locator('.modes .lang-tab')).toHaveText(['Daily', 'Ltd']);
  await expect(page.locator('#dailyTab')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#ltdIntro')).toBeHidden();
  await page.click('#ltdTab');
  await expect(page.locator('#ltdTab')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#ltdIntro')).toBeVisible();
  // Opening the tab doesn't start a company by itself.
  expect(await page.evaluate(() => typeof window.DebuggLtd)).toBe('undefined');
  expect(await ltd(page)).toBeNull();
  await page.click('#ltdLink');
  await expect(page.locator('#statMoney')).toHaveText('¤150');
  await expect(page.locator('#ltdIntro')).toBeHidden();

  await page.click('#dailyTab');
  await expect(page.locator('#dailyTab')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#ltdNote')).toBeVisible();
  await expect(page.locator('#ltdStats')).toBeHidden();
  await expect(page.locator('#ltdBoard')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/ltd-on/);
  await page.click('#ltdNote a');
  await expect(page.locator('#statMoney')).toHaveText('¤150');

  // The game has two tabs, Daily and Ltd; Learn is its own section, linked from the footer and the
  // Director's languages, and it links back.
  await expect(page.locator('.modes a')).toHaveText(['Daily', 'Ltd']);
  await expect(page.locator('.card.director a.learn-lang')).toHaveText('Python');
  await expect(page.locator('.card.director a.learn-lang')).toHaveAttribute('href', 'learn/#python');
  await page.click('.card.director a.learn-lang');
  await expect(page.locator('h1')).toHaveText('Learn Python');
  await page.click('footer a[href="../index.html?ltd"]');
  await expect(page.locator('#statMoney')).toBeVisible();
});

test('works at phone width with the studio on', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await found(page);
  await page.click('[data-action=desk-start]');
  await expect(page.locator('.desk-q')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
