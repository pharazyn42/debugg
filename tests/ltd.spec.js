// Debuggit Ltd: switching the studio on, paying for desk puzzles, the Director's languages,
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
// Edits the saved company, then reloads.
async function editCompany(page, fn){
  await page.evaluate(src => {
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
  await expect(page.locator('#kicker')).toHaveText('Day 3 · Wednesday · medium · Python');
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

test('desk puzzles pay the company once, by XP earned', async ({ page }) => {
  await found(page);
  await expect(page.locator('#statMoney')).toHaveText('¤150');
  await guess(page, (await puzzleFor(page, 3)).display);
  await expect(page.locator('#statMoney')).toHaveText('¤350');
  await expect(page.locator('#statRep')).toHaveText('5');
  await expect(page.locator('#welcomeToast')).toContainText('Today’s Python puzzle paid ¤200');
  await page.reload();
  await expect(page.locator('#statMoney')).toHaveText('¤350');

  expect((await ltd(page)).paid).toEqual({ 'python-3': true });

  // A revealed puzzle still earns 10 XP, so ¤20.
  await page.clock.setFixedTime(new Date(2026, 9, 8, 12));  // Day 4
  await page.reload();
  await page.click('#revealBtn');
  await expect(page.locator('#statMoney')).toHaveText('¤370');
  expect((await ltd(page)).paid).toEqual({ 'python-3': true, 'python-4': true });
});

test('a streak adds 10% per day beyond the first', async ({ page }) => {
  // A 2-day streak ending yesterday; solving today makes it 3, so +20%.
  await withStorage(page, { 'debugg-streak': { count: 2, lastDay: 6 } });
  await found(page);
  await guess(page, (await puzzleFor(page, 3)).display);
  await expect(page.locator('#statMoney')).toHaveText('¤390');
  await expect(page.locator('#welcomeToast')).toContainText('+20% streak bonus');
});

test('puzzles finished before the company existed are not paid', async ({ page }) => {
  await guess(page, (await puzzleFor(page, 3)).display);
  await found(page);
  // ¤150 plus the ¤100 founder's bonus for that puzzle's XP, and no desk payment.
  await expect(page.locator('#statMoney')).toHaveText('¤250');
  expect((await ltd(page)).paid).toEqual({});
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
  // 3. Solve today's puzzle.
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'desk');
  await guess(page, (await puzzleFor(page, 3)).display);
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
  await expect(page.locator('[data-alert=idle]')).toContainText('Ada L. is on the bench, costing ¤2/min');
  await expect(page.locator('[data-alert=debt]')).toContainText('The company is ¤50 in debt');
  await expect(page.locator('.card[data-id=g1]')).toContainText('On the bench · −¤2/min');
});

test('on a phone, the Ltd tab folds a finished puzzle to its tiles', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await guess(page, (await puzzleFor(page, 3)).display);
  await page.click('#foundBtn');
  await expect(page.locator('#statMoney')).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/desk-folded/);
  await expect(page.locator('#code')).toBeHidden();
  await expect(page.locator('#tiles')).toBeVisible();
  await page.click('#deskToggle');
  await expect(page.locator('#code')).toBeVisible();
  await expect(page.locator('#deskToggle')).toHaveText('Fold ▴');
});

test('the business grows from a start-up; managers staff idle devs and the desk pays less', async ({ page }) => {
  await found(page);
  await expect(page.locator('.stage-name')).toHaveText('Start-up');
  await expect(page.locator('.stage-bar')).toContainText('your daily puzzle pays in full');
  await expect(page.locator('.stage-bar')).toContainText('Next: Small business, with your first manager (managers are coming in v0.1).');
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

  // The desk pays half: a first-try Wednesday solve is ¤100, not ¤200.
  await guess(page, (await puzzleFor(page, 3)).display);
  await expect(page.locator('#welcomeToast')).toContainText('paid ¤100');
  await expect(page.locator('#welcomeToast')).toContainText('a small business gets 50% of desk pay');
});

test('the board has a hotfix in every language, and no domains', async ({ page }) => {
  await found(page);
  const hotfixes = page.locator('.board-group[data-tier=hotfix] .offer');
  await expect(hotfixes).toHaveCount(4);
  await expect(hotfixes.locator('.chip.lang')).toHaveText(['Python', 'C/C++', 'JavaScript', 'Rust']);
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

test('the demo runs hotfixes and patches, with no managers yet', async ({ page }) => {
  await found(page);
  await expect(page.locator('#welcomeToast')).toContainText('In the demo it runs hotfixes');
  await expect(page.locator('#welcomeToast')).toContainText('reset when v0.1 comes out');
  // Patches still open above 10 staff (only an old save can get there without managers).
  await editCompany(page, staffUpTo(11));
  await expect(page.locator('.board-group[data-tier=patch] .offer')).toHaveCount(2);
  for(const tier of ['minor', 'major']){
    await expect(page.locator('.board-group[data-tier=' + tier + ']')).toHaveClass(/locked/);
    await expect(page.locator('.board-group[data-tier=' + tier + '] .level-count')).toHaveText('coming in v0.1');
    await expect(page.locator('.board-group[data-tier=' + tier + '] .offer')).toHaveCount(0);
  }
  await expect(page.locator('[data-action=hire][data-role=Manager]')).toBeDisabled();
  await expect(page.locator('[data-action=hire][data-role=Manager] .why')).toHaveText('coming in v0.1');

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
  // Only the Rust hotfix can be taken; the other three fold away.
  const hotfixes = page.locator('.board-group[data-tier=hotfix] .offer');
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
  const board = (await ltd(page)).board.filter(o => o.tier === 0);
  expect(board.map(o => o.lang).sort()).toEqual(['C/C++', 'JavaScript', 'Python', 'Rust']);
  expect(board.find(o => o.id === 'rust1')).toBeUndefined();
  await expect(page.locator('.board-group[data-tier=hotfix] .level-count')).toHaveText('×4 · 1 running');
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
  expect(saved.board.filter(o => o.tier === 0).map(o => o.lang).sort()).toEqual(['C/C++', 'JavaScript', 'Python', 'Rust']);
  expect(saved.jobs).toHaveLength(1);
  await expect(page.locator('.job')).toContainText('Python');
});

test('promotion needs contract time and language bars only', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 }, worked: 11 * 3600000 });
  });
  // 12 hours on contracts for Junior.
  await expect(page.locator('[data-action=promote][data-id=g1]')).toHaveCount(0);
  await editCompany(page, s => { s.roster.find(p => p.id === 'g1').worked = 12 * 3600000 + 60000; });
  await expect(page.locator('[data-action=promote][data-id=g1]')).toHaveText('Promote to Junior');
  await page.click('.card[data-id=g1] .card-name');
  await expect(page.locator('#personModalBody')).toContainText('A language at 1 bar');
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

  await guess(page, (await puzzleFor(page, 3)).display);
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
  await expect(page.locator('#welcomeToast')).toContainText('moved in with the daily puzzles');
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

test('Daily, Learn and Ltd are tabs; on the Daily tab a running company is hidden but still paid', async ({ page }) => {
  await expect(page.locator('.modes .lang-tab')).toHaveText(['Daily', 'Learn', 'Ltd']);
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
  await guess(page, (await puzzleFor(page, 3)).display);
  await expect.poll(async () => (await ltd(page)).money).toBeGreaterThanOrEqual(350);
  await page.click('#ltdNote a');
  await expect(page.locator('#statMoney')).toHaveText(/¤3[45]\d/);

  // Learn links to the Ltd tab too.
  await page.click('#learnLink');
  await page.click('.modes a[href="index.html?ltd"]');
  await expect(page.locator('#statMoney')).toBeVisible();
});

test('works at phone width with the studio on', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await found(page);
  await page.click('#revealBtn');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
