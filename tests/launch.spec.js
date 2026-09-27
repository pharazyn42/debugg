// Soft-launch features: save backup, feedback links, analytics events, the beta label and the privacy page.
const { test, expect } = require('@playwright/test');
const { openAt, fresh, puzzleFor, guess, readJson } = require('./helpers');

test('a backup code restores everything in another browser', async ({ page, browser }) => {
  page.on('dialog', d => d.accept());
  await openAt(page, 'index.html#python');
  await fresh(page);
  await guess(page, (await puzzleFor(page, 'python', 7)).display);
  await page.click('#ltdLink');
  // ¤150 plus a ¤100 founder's bonus (the puzzle was solved before the company existed).
  await expect(page.locator('#statMoney')).toHaveText('¤250');
  await page.click('#backupLink');
  const code = await page.inputValue('#backupCode');
  expect(code.startsWith('DEBUGG1.')).toBe(true);

  // A different browser, with nothing saved.
  const other = await (await browser.newContext()).newPage();
  other.on('dialog', d => d.accept());
  await openAt(other, 'index.html#python');
  await fresh(other);
  await other.click('#backupLink');
  await other.fill('#restoreCode', 'not a code');
  await other.click('#restoreBtn');
  await expect(other.locator('#restoreError')).toContainText('doesn’t look like a Debugg backup code');
  await other.fill('#restoreCode', code.slice(0, 20));
  await other.click('#restoreBtn');
  await expect(other.locator('#restoreError')).toContainText('incomplete or damaged');

  await other.fill('#restoreCode', code);
  await other.click('#restoreBtn');
  await expect(other.locator('#feedback')).toContainText('Solved');
  await expect(other.locator('#streak')).toHaveText('1');
  await expect(other.locator('#statMoney')).toHaveText('¤250');
  expect((await readJson(other, 'debugg-xp')).python).toBe(100);
});

test('feedback links open a prefilled GitHub issue for the puzzle', async ({ page }) => {
  await openAt(page, 'index.html#python', 5);
  await fresh(page);
  await page.click('#revealBtn');
  const href = await page.getAttribute('#reportLink', 'href');
  const url = new URL(href);
  expect(url.origin + url.pathname).toBe('https://github.com/pharazyn42/debugg/issues/new');
  expect(url.searchParams.get('title')).toBe('Puzzle problem: Python Day 5');
  expect(url.searchParams.get('body')).toContain('Expected answer: `' + (await puzzleFor(page, 'python', 5)).display + '`');
  await expect(page.locator('#feedbackLink')).toHaveAttribute('href', 'https://github.com/pharazyn42/debugg/issues/new');
});

test('analytics sends named events, and nothing when it is off', async ({ page }) => {
  // Off (the default): the GoatCounter script isn't even requested.
  const requested = [];
  page.on('request', r => requested.push(r.url()));
  await openAt(page, 'index.html#python');
  await fresh(page);
  await page.click('#revealBtn');
  expect(requested.some(u => u.includes('gc.zgo.at'))).toBe(false);

  // On, against a stand-in for GoatCounter's script that records what it's given.
  await page.addInitScript(() => { window.DEBUGG_GOATCOUNTER = 'https://example.goatcounter.com/count'; });
  await page.route('https://gc.zgo.at/count.js', r => r.fulfill({
    contentType: 'text/javascript',
    body: 'window.goatcounter = { count: e => (window.__sent = window.__sent || []).push(e.path) };'
  }));
  await fresh(page);
  await guess(page, (await puzzleFor(page, 'python', 7)).display);  // 100 XP: level 2
  await page.click('#ltdLink');
  await expect(page.locator('#statMoney')).toBeVisible();
  await page.click('[data-action=hire][data-role=Graduate]');
  await page.click('#backupLink');
  await expect.poll(() => page.evaluate(() => window.__sent || [])).toEqual([
    'level/python/2',
    'puzzle/python/day-7/solved-in-1',
    'ltd/founded',
    'ltd/hired/graduate',
    'backup/opened'
  ]);
});

test('Debugg Ltd is labelled beta, and the privacy page is linked', async ({ page }) => {
  await openAt(page, 'index.html#python');
  await fresh(page);
  await expect(page.locator('#ltdLinkSep .beta')).toHaveText('beta');
  await page.click('#ltdLink');
  await expect(page.locator('.company-controls .beta')).toHaveText('beta');
  await expect(page.locator('#welcomeToast')).toContainText('in beta');
  await page.click('a[href="privacy.html"]');
  await expect(page.locator('h1')).toHaveText('Privacy');
});
