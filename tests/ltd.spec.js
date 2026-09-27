// Debugg Ltd: switching the studio on, paying for desk puzzles, the Director's languages,
// the studio engine, the contract board, pausing, closing, importing old saves and the
// /studio/ redirect.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { openAt, fresh, withStorage, puzzleFor, guess, readJson } = require('./helpers');

const at = (h, m = 0) => new Date(2026, 9, 7, h, m, 0);  // Day 7, a Wednesday
const ltd = page => readJson(page, 'debugg-ltd');

async function found(page){
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
  await expect(page.locator('#kicker')).toHaveText('Debugg Ltd · Day 7 · Wednesday · medium');
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
  await guess(page, (await puzzleFor(page, 'python', 7)).display);
  await expect(page.locator('#statMoney')).toHaveText('¤350');
  await expect(page.locator('#statRep')).toHaveText('5');
  await expect(page.locator('#welcomeToast')).toContainText('Today’s Python puzzle paid ¤200');
  await page.reload();
  await expect(page.locator('#statMoney')).toHaveText('¤350');

  // A revealed puzzle still earns 10 XP, so ¤20.
  await page.click('a[href="#javascript"]');
  await page.click('#revealBtn');
  await expect(page.locator('#statMoney')).toHaveText('¤370');
  expect((await ltd(page)).paid).toEqual({ 'python-7': true, 'javascript-7': true });
});

test('a streak adds 10% per day beyond the first', async ({ page }) => {
  // A 2-day streak ending yesterday; solving today makes it 3, so +20%.
  await withStorage(page, { 'debugg-streak': { count: 2, lastDay: 6 } });
  await found(page);
  await guess(page, (await puzzleFor(page, 'python', 7)).display);
  await expect(page.locator('#statMoney')).toHaveText('¤390');
  await expect(page.locator('#welcomeToast')).toContainText('+20% streak bonus');
});

test('puzzles finished before the company existed are not paid', async ({ page }) => {
  await guess(page, (await puzzleFor(page, 'python', 7)).display);
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
  await found(page);
  await page.click('[data-action=hire][data-role=Graduate]');
  await expect(page.locator('#statMoney')).toHaveText('¤90');
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
  await expect(page.locator('#statMoney')).toHaveText('¤50');
  await expect(page.locator('#welcomeToast')).toContainText('1 contract wrapped up while you were away');
  await expect(page.locator('#log')).toContainText('delivered');
});

test('the board has a hotfix in every language, and no domains', async ({ page }) => {
  await found(page);
  const hotfixes = page.locator('.board-group[data-tier=hotfix] .offer');
  await expect(hotfixes).toHaveCount(4);
  await expect(hotfixes.locator('.chip.lang')).toHaveText(['Python', 'C/C++', 'JavaScript', 'Rust']);
  await expect(page.locator('.board-group .level-name')).toHaveText(['Hotfixes', 'Patches', 'Minor releases', 'Major releases']);
  const saved = await ltd(page);
  expect(JSON.stringify(saved)).not.toContain('"dom"');
  expect(saved.board.filter(o => o.tier !== 0)).toHaveLength(6);
});

test('a hotfix that is taken is replaced in the same language', async ({ page }) => {
  await found(page);
  await editCompany(page, s => {
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Rust: 10 } });
    s.board.find(o => o.tier === 0 && o.lang === 'Rust').id = 'rust1';
  });
  await expect(page.locator('.board-group[data-tier=hotfix] .offer').nth(1)).toContainText('Nobody on staff knows C/C++');
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
  const major = page.locator('.board-group[data-tier=major]');
  await expect(major.locator('.offer').first()).toBeVisible();
  await major.locator('.level-header').click();
  await expect(major).toHaveClass(/collapsed/);
  await expect(major.locator('.offer').first()).toBeHidden();
  await page.reload();
  await expect(page.locator('.board-group[data-tier=major]')).toHaveClass(/collapsed/);
  await expect(page.locator('.board-group[data-tier=hotfix]')).not.toHaveClass(/collapsed/);
  expect((await ltd(page)).collapsedTiers).toEqual(['major']);
});

test('a company saved with domains is converted to languages only', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
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
    s.roster.push({ id: 'g1', name: 'Ada L.', role: 'Graduate', since: Date.now(), lang: { Python: 10 }, worked: 61 * 60000 });
  });
  await expect(page.locator('[data-action=promote][data-id=g1]')).toHaveText('Promote to Junior');
  await page.click('.card[data-id=g1] .card-name');
  await expect(page.locator('#personModalBody')).toContainText('A language at 1 bar');
  await expect(page.locator('#personModalBody')).not.toContainText('omain');
});

test('pausing stops the clock until the company is resumed', async ({ page }) => {
  await page.clock.setFixedTime(at(12));
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
  await expect(page.locator('#ltdLink')).toHaveText('resume Debugg Ltd');

  // Two hours later: no salaries were paid and the job hasn't moved on.
  await page.clock.setFixedTime(at(14));
  await page.reload();
  await page.click('#ltdLink');
  await expect(page.locator('#welcomeToast')).toContainText('paused for 2h');
  await expect(page.locator('#statMoney')).toHaveText('¤90');
  const job = (await ltd(page)).jobs[0];
  expect(job.endsAt - Date.parse(at(14))).toBe(60000);
});

test('closing the company keeps puzzle progress; resetting puzzles keeps the company', async ({ page }) => {
  await guess(page, (await puzzleFor(page, 'python', 7)).display);
  await found(page);
  await page.click('#resetLink');
  await expect(page.locator('body')).toHaveClass(/ltd-on/);
  expect(await ltd(page)).not.toBeNull();
  expect(await readJson(page, 'debugg-xp')).toBeNull();

  await guess(page, (await puzzleFor(page, 'python', 7)).display);
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
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('body')).toHaveClass(/ltd-on/);
  await expect(page.locator('#statMoney')).toHaveText('¤150');
});

test('works at phone width with the studio on', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await found(page);
  await page.click('#revealBtn');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
