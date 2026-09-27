// The daily puzzle page: every puzzle, language tabs, streak, XP and old saves.
const { test, expect } = require('@playwright/test');
const { openAt, fresh, withStorage, puzzleFor, guess, readJson } = require('./helpers');

const LANGS = ['python', 'javascript'];

// Switching language only changes the URL hash, and the page reloads itself to show the
// other puzzle, so wait for that puzzle before doing anything else.
async function gotoLang(page, lang, day){
  await page.goto('index.html#' + lang);
  await expect(page.locator('#filename')).toHaveText('day' + day + (lang === 'python' ? '.py' : '.js'));
}

for(const lang of LANGS){
  test(`every ${lang} puzzle shows its code and accepts its answer`, async ({ page }) => {
    await openAt(page, 'index.html#' + lang);
    const count = await page.evaluate(l => window.Debugg.puzzlesFor(l).length, lang);
    expect(count).toBeGreaterThan(5);
    for(let day = 1; day <= count; day++){
      await page.clock.setFixedTime(new Date(2026, 8, 26 + day, 12));
      await fresh(page);
      const p = await puzzleFor(page, lang, day);
      await expect(page.locator('#kicker')).toHaveText('Debugg · Day ' + day);
      await expect(page.locator('#filename')).toHaveText('day' + day + (lang === 'python' ? '.py' : '.js'));
      await expect(page.locator('#flag')).toHaveCount(1);
      await guess(page, 'definitely not the answer');
      await expect(page.locator('#feedback')).toHaveClass(/wrong/);
      await guess(page, p.display);
      await expect(page.locator('#feedback'), `day ${day}: ${p.display}`).toHaveClass(/correct/);
      await expect(page.locator('#wildOut')).not.toBeEmpty();
    }
  });
}

test('answers are matched loosely', async ({ page }) => {
  await openAt(page, 'index.html#python');
  for(const variant of ['1,2', '1 2', '[1,2]', '[1, 2]']){
    await fresh(page);
    await guess(page, variant);
    await expect(page.locator('#feedback'), variant).toHaveClass(/correct/);
  }
});

test('language tabs switch puzzles, remember the choice and show results', async ({ page }) => {
  await openAt(page, 'index.html');
  await fresh(page);
  await expect(page.locator('.lang-tab[aria-current]')).toHaveText('Python');
  await guess(page, (await puzzleFor(page, 'python', 1)).display);
  await page.click('a[href="#javascript"]');
  await expect(page.locator('#filename')).toHaveText('day1.js');
  await expect(page.locator('a[href="#python"]')).toContainText('✓');
  await page.click('#revealBtn');
  await expect(page.locator('a[href="#javascript"]')).toContainText('✕');
  await page.goto('index.html');
  await expect(page.locator('#filename')).toHaveText('day1.js');
});

test('the streak counts days with at least one solve', async ({ page }) => {
  await openAt(page, 'index.html#python', 1);
  await fresh(page);
  await guess(page, (await puzzleFor(page, 'python', 1)).display);
  await expect(page.locator('#streak')).toHaveText('1');

  await page.clock.setFixedTime(new Date(2026, 8, 28, 12));
  await gotoLang(page, 'javascript', 2);
  await guess(page, (await puzzleFor(page, 'javascript', 2)).display);
  await expect(page.locator('#streak')).toHaveText('2');
  // A second solve the same day doesn't add to it, and a loss doesn't reset it.
  await gotoLang(page, 'python', 2);
  await page.click('#revealBtn');
  await expect(page.locator('#streak')).toHaveText('2');

  // Day 3 with no solve, so on day 4 it's gone.
  await page.clock.setFixedTime(new Date(2026, 8, 30, 12));
  await page.reload();
  await expect(page.locator('#streak')).toHaveText('0');
});

test('XP depends on guesses and hints, and is only awarded once', async ({ page }) => {
  const xp = () => readJson(page, 'debugg-xp');
  await openAt(page, 'index.html#python', 1);
  await fresh(page);
  await guess(page, (await puzzleFor(page, 'python', 1)).display);
  expect((await xp()).python).toBe(100);
  await expect(page.locator('#feedback')).toContainText('+100 XP. Level up: Python Lv 2!');
  await page.reload();
  expect((await xp()).python).toBe(100);

  // Second guess with one hint: 75 × 0.75 = 56.
  await page.clock.setFixedTime(new Date(2026, 8, 28, 12));
  await page.reload();
  await page.click('#hintBtn');
  await guess(page, 'nope');
  await guess(page, (await puzzleFor(page, 'python', 2)).display);
  expect((await xp()).python).toBe(156);

  // Revealing earns 10, in its own language.
  await gotoLang(page, 'javascript', 2);
  await page.click('#revealBtn');
  expect(await xp()).toEqual({ python: 156, javascript: 10 });
  await expect(page.locator('.xp-row').first()).toContainText('JavaScript');
});

test('saves from before languages and XP still load', async ({ page }) => {
  await openAt(page, 'index.html#python', 1);
  await page.evaluate(() => localStorage.clear());
  await withStorage(page, {
    'debugg-streak': '3',
    'debugg-day1': { attempts: ['wrong', 'correct'], solved: true, revealed: true, hintLevel: 2 }
  });
  await expect(page.locator('#streak')).toHaveText('3');
  await expect(page.locator('#feedback')).toContainText('Solved');
  // 2nd guess with 2 hints: 75 × 0.5 = 38, awarded once.
  expect((await readJson(page, 'debugg-xp')).python).toBe(38);
  await page.reload();
  expect((await readJson(page, 'debugg-xp')).python).toBe(38);
});

test('works at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openAt(page, 'index.html');
  await fresh(page);
  await page.click('#revealBtn');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
