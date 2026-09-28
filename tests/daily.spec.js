// The daily puzzle page: every puzzle, language tabs, streak, XP and old saves.
const { test, expect } = require('@playwright/test');
const { dayDate, openAt, fresh, withStorage, puzzleFor, guess, readJson } = require('./helpers');

const LANGS = ['python', 'javascript'];

// Switching language only changes the URL hash, and the page reloads itself to show the
// other puzzle, so wait for that puzzle before doing anything else.
async function gotoLang(page, lang, day){
  await page.goto('index.html#' + lang);
  await expect(page.locator('#filename')).toHaveText('day' + day + (lang === 'python' ? '.py' : '.js'));
}

for(const lang of LANGS){
  test(`every ${lang} puzzle is scheduled, shows its code and accepts its answer`, async ({ page }) => {
    await openAt(page, 'index.html#' + lang);
    const count = await page.evaluate(l => window.Debugg.puzzlesFor(l).length, lang);
    expect(count).toBeGreaterThan(5);
    const seen = new Set();
    for(let day = 1; seen.size < count && day <= 60; day++){
      const info = await page.evaluate(d => ({ slot: Debugg.slotDay(d), label: Debugg.dayLabel(d), title: Debugg.dayTitle(d) }), day);
      if(info.slot !== day) continue;  // Sunday shares Saturday's puzzle
      await page.clock.setFixedTime(dayDate(day));
      await fresh(page);
      const p = await puzzleFor(page, lang, day);
      seen.add(p.code);
      await expect(page.locator('#kicker')).toHaveText('Debugg · ' + info.label + ' · ' + info.title);
      await expect(page.locator('#filename')).toHaveText('day' + day + (lang === 'python' ? '.py' : '.js'));
      await expect(page.locator('#flag')).toHaveCount(1);
      await guess(page, 'definitely not the answer');
      await expect(page.locator('#feedback')).toHaveClass(/wrong/);
      await guess(page, p.display);
      await expect(page.locator('#feedback'), `day ${day}: ${p.display}`).toHaveClass(/correct/);
      await expect(page.locator('#takeawayOut')).not.toBeEmpty();
    }
    expect(seen.size, 'every puzzle comes up in the schedule').toBe(count);
  });
}

test('the week runs from an easy Monday to a hard Friday, then one weekend puzzle', async ({ page }) => {
  await openAt(page, 'index.html#python');
  const week = await page.evaluate(() => [1, 2, 3, 4, 5, 6, 7].map(d => {
    const p = Debugg.puzzleFor('python', d);
    return { title: Debugg.dayTitle(d), label: Debugg.dayLabel(d), xp: Debugg.baseXp(d), difficulty: p.difficulty, code: p.code };
  }));
  expect(week.map(w => w.title)).toEqual(['Monday · warm-up', 'Tuesday · easy', 'Wednesday · medium',
    'Thursday · tricky', 'Friday · hard', 'Weekend · hard', 'Weekend · hard']);
  expect(week.map(w => w.xp)).toEqual([60, 80, 100, 120, 150, 200, 200]);
  expect(week.map(w => w.label)).toEqual(['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Days 6–7', 'Days 6–7']);
  // Monday to Thursday get puzzles of their own difficulty, and Sunday is Saturday's puzzle.
  expect(week.slice(0, 4).map(w => w.difficulty)).toEqual([1, 2, 3, 4]);
  expect(week[6].code).toBe(week[5].code);
});

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
  await guess(page, (await puzzleFor(page, 'python', 3)).display);
  await page.click('a[href="#javascript"]');
  await expect(page.locator('#filename')).toHaveText('day3.js');
  await expect(page.locator('a[href="#python"]')).toContainText('✓');
  await page.click('#revealBtn');
  await expect(page.locator('a[href="#javascript"]')).toContainText('✕');
  await page.goto('index.html');
  await expect(page.locator('#filename')).toHaveText('day3.js');
});

test('the streak counts days with at least one solve, and the weekend as one', async ({ page }) => {
  // Days 7, 14, 21… are Sundays, which play Saturday's puzzle.
  const slotOf = day => (day % 7 === 0 ? day - 1 : day);
  const solveOn = async (day, lang = 'python') => {
    await page.clock.setFixedTime(dayDate(day));
    await page.goto('index.html?d=' + day + '#' + lang);  // a full page load, not just a hash change
    await expect(page.locator('#filename')).toHaveText('day' + slotOf(day) + (lang === 'python' ? '.py' : '.js'));
    await guess(page, (await puzzleFor(page, lang, day)).display);
  };
  await openAt(page, 'index.html#python', 3);  // Wednesday
  await fresh(page);
  await solveOn(3);
  await expect(page.locator('#streak')).toHaveText('1');
  await solveOn(4, 'javascript');
  await expect(page.locator('#streak')).toHaveText('2');
  // A second solve the same day doesn't add to it, and a loss doesn't reset it.
  await gotoLang(page, 'python', 4);
  await page.click('#revealBtn');
  await expect(page.locator('#streak')).toHaveText('2');
  await solveOn(5);
  await expect(page.locator('#streak')).toHaveText('3');

  // Saturday isn't played; solving the weekend puzzle on Sunday still carries the streak on.
  await solveOn(7);
  await expect(page.locator('#streak')).toHaveText('4');
  await expect(page.locator('#kicker')).toHaveText('Debugg · Days 6–7 · Weekend · hard');
  // Monday: still alive until Monday's puzzle is missed.
  await page.clock.setFixedTime(dayDate(8));
  await page.reload();
  await expect(page.locator('#streak')).toHaveText('4');
  await page.clock.setFixedTime(dayDate(9));
  await page.reload();
  await expect(page.locator('#streak')).toHaveText('0');
});

test('a weekend puzzle solved on Saturday is still solved on Sunday', async ({ page }) => {
  await openAt(page, 'index.html#python', 6);
  await fresh(page);
  await expect(page.locator('#kicker')).toHaveText('Debugg · Days 6–7 · Weekend · hard');
  await guess(page, (await puzzleFor(page, 'python', 6)).display);
  expect((await readJson(page, 'debugg-xp')).python).toBe(200);
  await page.clock.setFixedTime(dayDate(7));
  await page.reload();
  await expect(page.locator('#feedback')).toContainText('Solved');
  expect((await readJson(page, 'debugg-xp')).python).toBe(200);
});

test('XP depends on the day, guesses and hints, and is only awarded once', async ({ page }) => {
  const xp = () => readJson(page, 'debugg-xp');
  await openAt(page, 'index.html#python', 3);  // Wednesday: 100
  await fresh(page);
  await guess(page, (await puzzleFor(page, 'python', 3)).display);
  expect((await xp()).python).toBe(100);
  await expect(page.locator('#feedback')).toContainText('+100 XP. Level up: Python Lv 2!');
  await page.reload();
  expect((await xp()).python).toBe(100);

  // Thursday (120), second guess with one hint: 120 × 0.75 × 0.75 = 67.5, so 68.
  await page.clock.setFixedTime(dayDate(4));
  await page.reload();
  await page.click('#hintBtn');
  await guess(page, 'nope');
  await guess(page, (await puzzleFor(page, 'python', 4)).display);
  expect((await xp()).python).toBe(168);

  // Revealing earns 10, in its own language.
  await gotoLang(page, 'javascript', 4);
  await page.click('#revealBtn');
  expect(await xp()).toEqual({ python: 168, javascript: 10 });
  await expect(page.locator('.xp-row').first()).toContainText('JavaScript');

  // Monday is a warm-up: 60.
  await page.clock.setFixedTime(dayDate(8));
  await gotoLang(page, 'python', 8);
  await guess(page, (await puzzleFor(page, 'python', 8)).display);
  expect((await xp()).python).toBe(228);
});

test('saves from before languages and XP still load', async ({ page }) => {
  // Old bare-number streaks are read as ending on Day 1, so this runs on Day 2 (a Tuesday).
  await openAt(page, 'index.html#python', 2);
  // Old formats, but under the current calendar (the remembered Day 1 date is kept).
  await fresh(page);
  await withStorage(page, {
    'debugg-streak': '3',
    'debugg-day2': { attempts: ['wrong', 'correct'], solved: true, revealed: true, hintLevel: 2 }
  });
  await expect(page.locator('#streak')).toHaveText('3');
  await expect(page.locator('#feedback')).toContainText('Solved');
  // Tuesday (80), 2nd guess with 2 hints: 80 × 0.75 × 0.5 = 30, awarded once.
  expect((await readJson(page, 'debugg-xp')).python).toBe(30);
  await page.reload();
  expect((await readJson(page, 'debugg-xp')).python).toBe(30);
});

test('works at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openAt(page, 'index.html');
  await fresh(page);
  await page.click('#revealBtn');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('days before Day 1 are previews with their own saves', async ({ page }) => {
  await openAt(page, 'index.html#python', -2);  // Friday 2 October 2026
  await fresh(page);
  await expect(page.locator('#kicker')).toHaveText('Debugg · Preview · Day 1 is 5 October');
  await expect(page.locator('#filename')).toHaveText('preview.py');
  await guess(page, (await puzzleFor(page, 'python', -2)).display);
  await expect(page.locator('#feedback')).toHaveClass(/correct/);
  expect(await readJson(page, 'debugg-day-2')).toMatchObject({ solved: true });

  // Day 1 is a fresh puzzle.
  await page.clock.setFixedTime(dayDate(1));
  await page.reload();
  await expect(page.locator('#kicker')).toHaveText('Debugg · Day 1 · Monday · warm-up');
  await expect(page.locator('#feedback')).not.toHaveClass(/correct/);
});

test('moving Day 1 clears progress saved under the old day numbers', async ({ page }) => {
  await openAt(page, 'index.html#python', 1);
  await page.evaluate(() => {
    localStorage.clear();  // no remembered calendar, as for saves made before it existed
    localStorage.setItem('debugg-day1', JSON.stringify({ attempts: ['correct'], solved: true, revealed: true, hintLevel: 0, xp: 100 }));
    localStorage.setItem('debugg-javascript-day1', JSON.stringify({ attempts: ['wrong'], solved: false, revealed: false, hintLevel: 0 }));
    localStorage.setItem('debugg-streak', JSON.stringify({ count: 1, lastDay: 1 }));
    localStorage.setItem('debugg-xp', JSON.stringify({ python: 100 }));
    localStorage.setItem('debugg-ltd', JSON.stringify({ enabled: false, pausedAt: 1, money: 500, paid: { 'python-1': true } }));
  });
  await page.reload();
  await expect(page.locator('#feedback')).not.toHaveClass(/correct/);
  const kept = await page.evaluate(() => ({
    day1: localStorage.getItem('debugg-day1'),
    js: localStorage.getItem('debugg-javascript-day1'),
    streak: localStorage.getItem('debugg-streak'),
    xp: JSON.parse(localStorage.getItem('debugg-xp')),
    company: JSON.parse(localStorage.getItem('debugg-ltd'))
  }));
  expect(kept.day1).toBeNull();
  expect(kept.js).toBeNull();
  expect(kept.streak).toBeNull();
  expect(kept.xp).toEqual({ python: 100 });
  expect(kept.company).toMatchObject({ money: 500, paid: {} });

  // Once the calendar is remembered, nothing else is cleared.
  await guess(page, (await puzzleFor(page, 'python', 1)).display);
  await page.reload();
  await expect(page.locator('#feedback')).toHaveClass(/correct/);
});

test('players see only Python for the soft launch', async ({ page }) => {
  await openAt(page, 'index.html#javascript', 1, { langs: null });
  await fresh(page);
  await expect(page.locator('#filename')).toHaveText('day1.py');
  await expect(page.locator('#langs')).toBeHidden();
  // Earlier JavaScript XP is kept, just not shown.
  await withStorage(page, { 'debugg-xp': { python: 10, javascript: 500 } });
  await expect(page.locator('.xp-row')).toHaveCount(1);
  await page.goto('sandbox.html#javascript');
  await expect(page.locator('#filename')).toHaveText('main.py');
  await expect(page.locator('#langs')).toBeHidden();
});

test('fonts load from the site itself, and nothing loads from anywhere else', async ({ page }) => {
  const outside = [];
  page.on('request', r => { if(!r.url().startsWith('http://localhost:4173/')) outside.push(r.url()); });
  await openAt(page, 'index.html');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 16px Sora') && document.fonts.check('400 16px "JetBrains Mono"'))).toBe(true);
  const loaded = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '') + ' ' + f.weight));
  expect(loaded).toEqual(expect.arrayContaining(['Sora 700', 'JetBrains Mono 400']));
  expect(outside).toEqual([]);
});
