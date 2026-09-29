// The daily puzzle page: every puzzle, the language rotation, streak, XP and old saves.
const { test, expect } = require('@playwright/test');
const { dayDate, openAt, fresh, withStorage, puzzleFor, guess, readJson } = require('./helpers');

const EXT = { python: 'py', javascript: 'js', c: 'c', rust: 'rs' };
const NAME = { python: 'Python', javascript: 'JavaScript', c: 'C', rust: 'Rust' };

// Each language on its own, so every one of its puzzles comes up in turn.
for(const lang of Object.keys(EXT)){
  test(`every ${NAME[lang]} puzzle is scheduled, shows its code and accepts its answer`, async ({ page }) => {
    await openAt(page, 'index.html', 1, { rotation: [{ lang }] });
    const count = await page.evaluate(l => window.Debugg.puzzlesFor(l).length, lang);
    expect(count).toBeGreaterThan(5);
    const seen = new Set();
    for(let day = 1; seen.size < count && day <= 150; day++){
      const info = await page.evaluate(d => ({ slot: Debugg.slotDay(d), label: Debugg.dayLabel(d), title: Debugg.dayTitle(d) }), day);
      if(info.slot !== day) continue;  // Sunday shares Saturday's puzzle
      await page.clock.setFixedTime(dayDate(day));
      await fresh(page);
      const p = await puzzleFor(page, day);
      expect(p.lang).toBe(lang);
      seen.add(p.code);
      await expect(page.locator('#kicker')).toHaveText(info.label + ' · ' + info.title + ' · ' + NAME[lang]);
      await expect(page.locator('#filename')).toHaveText('day' + day + '.' + EXT[lang]);
      await expect(page.locator('#langName')).toHaveText(NAME[lang]);
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
  await openAt(page, 'index.html');
  const week = await page.evaluate(() => [1, 2, 3, 4, 5, 6, 7].map(d => {
    const p = Debugg.puzzleFor(d);
    return { title: Debugg.dayTitle(d), label: Debugg.dayLabel(d), xp: Debugg.baseXp(d), difficulty: p.difficulty, code: p.code, lang: p.lang };
  }));
  expect(week.map(w => w.title)).toEqual(['Monday · warm-up', 'Tuesday · easy', 'Wednesday · medium',
    'Thursday · tricky', 'Friday · hard', 'Weekend · hard', 'Weekend · hard']);
  expect(week.map(w => w.xp)).toEqual([60, 80, 100, 120, 150, 200, 200]);
  expect(week.map(w => w.label)).toEqual(['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Days 6–7', 'Days 6–7']);
  expect(week.map(w => w.difficulty)).toEqual([1, 2, 3, 4, 5, 5, 5]);
  // Sunday is Saturday's puzzle, and for now every day is Python.
  expect(week[6].code).toBe(week[5].code);
  expect(new Set(week.map(w => w.lang))).toEqual(new Set(['python']));
});

test('languages take turns, shifting a day each week, and a new one starts on the easy days', async ({ page }) => {
  // Python and JavaScript from the start; Rust joins in week 2 (Day 15).
  await openAt(page, 'index.html', 1, { rotation: [{ lang: 'python' }, { lang: 'javascript' }, { lang: 'rust', from: 15 }] });
  const weeks = await page.evaluate(() => [0, 1, 2, 3, 4].map(w => Debugg.weekLangs(w).join(' ')));
  expect(weeks).toEqual([
    'python javascript python javascript python javascript',
    'javascript python javascript python javascript python',
    // Rust's first two weeks: Monday and Tuesday only.
    'rust rust python javascript python javascript',
    'rust rust javascript python javascript python',
    // Then it takes its turn at every difficulty.
    'javascript rust python javascript rust python'
  ]);
  // Each day's puzzle is in that day's language, at that day's difficulty, or the nearest one when
  // the language has run out: JavaScript has only one warm-up, used in week 0, so Day 29 gets a 2.
  const days = await page.evaluate(() => [15, 16, 17, 29, 30, 33].map(d => [Debugg.puzzleFor(d).lang, Debugg.puzzleFor(d).difficulty]));
  expect(days).toEqual([['rust', 1], ['rust', 2], ['python', 3], ['javascript', 2], ['rust', 2], ['rust', 5]]);
});

test('a Rust day shows Rust, links to the Rust Playground and earns Rust XP', async ({ page }) => {
  await openAt(page, 'index.html', 1, { rotation: [{ lang: 'rust' }] });
  await fresh(page);
  await expect(page.locator('#kicker')).toHaveText('Day 1 · Monday · warm-up · Rust');
  await expect(page.locator('#filename')).toHaveText('day1.rs');
  const p = await puzzleFor(page, 1);
  await guess(page, p.display);
  const link = page.locator('#tryLink');
  await expect(link).toHaveText('Run it yourself in the Rust Playground →');
  const href = new URL(await link.getAttribute('href'));
  expect(href.origin).toBe('https://play.rust-lang.org');
  expect(href.searchParams.get('code')).toBe(p.code);
  expect(await readJson(page, 'debugg-xp')).toEqual({ rust: 60 });
});

test("a C day has no run link, since C doesn't run in the browser yet", async ({ page }) => {
  await openAt(page, 'index.html', 1, { rotation: [{ lang: 'c' }] });
  await fresh(page);
  await page.click('#revealBtn');
  await expect(page.locator('#takeawayOut')).not.toBeEmpty();
  await expect(page.locator('p.try:has(#tryLink)')).toBeHidden();
  // C's Learn course is still to come, so no lesson is suggested either.
  await expect(page.locator('#learnMore')).toBeHidden();
  await expect(page.locator('#sandboxLink')).toHaveAttribute('href', 'learn/sandbox.html');
});

test('the wordmark is "debug it" in the day\'s language, and each page has its own', async ({ page }) => {
  const expected = { python: 'debugg(it)', javascript: 'debugg.it()', c: 'debugg(&it);', rust: 'debugg!(it)' };
  for(const [lang, code] of Object.entries(expected)){
    await openAt(page, 'index.html', 1, { rotation: [{ lang }] });
    const mark = page.locator('#wordmark');
    await expect(mark).toHaveAttribute('data-wordmark', code);
    await expect(mark).toHaveText(code);
    await expect(mark).toHaveAttribute('aria-label', 'Debuggit');
  }
  await expect(page).toHaveTitle('Debuggit');
  await page.goto('learn/');
  await expect(page.locator('#wordmark')).toHaveText('debugg.learn()');
  await page.goto('learn/sandbox.html');
  await expect(page.locator('#wordmark')).toHaveText('debugg.run()');
  await page.goto('privacy.html');
  await expect(page.locator('.wordmark')).toHaveText('debugg.it()');
});

test('the Debuggit duck is the logo and favicon, and reacts to how the game went', async ({ page }) => {
  await openAt(page, 'index.html', 3);
  await fresh(page);
  await expect(page.locator('.brand .duck-logo')).toHaveAttribute('src', 'img/duck.svg');
  await expect.poll(() => page.evaluate(() => document.querySelector('.brand .duck-logo').naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', 'img/duck.svg');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /img\/share\.png$/);
  await expect(page.locator('#duckSays')).toBeHidden();
  await guess(page, (await puzzleFor(page, 3)).display);
  await expect(page.locator('#duckSays')).toHaveClass(/happy/);
  await expect(page.locator('#duckLine')).toHaveText('Quack! First try, no hints.');

  // A solve with a hint and a miss.
  await page.clock.setFixedTime(dayDate(4));
  await page.reload();
  await page.click('#hintBtn');
  await guess(page, 'nope');
  await guess(page, (await puzzleFor(page, 4)).display);
  await expect(page.locator('#duckLine')).toHaveText('Quack! Debugged it in 2 guesses, with 1 hint.');

  // A reveal gets a wobble, and it's still there after a reload.
  await page.clock.setFixedTime(dayDate(5));
  await page.reload();
  await page.click('#revealBtn');
  await expect(page.locator('#duckSays')).toHaveClass(/dizzy/);
  await page.reload();
  await expect(page.locator('#duckLine')).toContainText('Even the duck gets stuck sometimes');
});

test('answers are matched loosely', async ({ page }) => {
  await openAt(page, 'index.html');
  for(const variant of ['1,2', '1 2', '[1,2]', '[1, 2]']){
    await fresh(page);
    await guess(page, variant);
    await expect(page.locator('#feedback'), variant).toHaveClass(/correct/);
  }
});

test('the streak counts days with a solve, and the weekend as one', async ({ page }) => {
  // Days 7, 14, 21… are Sundays, which play Saturday's puzzle.
  const slotOf = day => (day % 7 === 0 ? day - 1 : day);
  const solveOn = async day => {
    await page.clock.setFixedTime(dayDate(day));
    await page.goto('index.html?d=' + day);  // a full page load at the new time
    await expect(page.locator('#filename')).toHaveText('day' + slotOf(day) + '.py');
    await guess(page, (await puzzleFor(page, day)).display);
  };
  await openAt(page, 'index.html', 3);  // Wednesday
  await fresh(page);
  await solveOn(3);
  await expect(page.locator('#streak')).toHaveText('1');
  await solveOn(4);
  await expect(page.locator('#streak')).toHaveText('2');
  // Reloading a solved day doesn't add to it.
  await page.reload();
  await expect(page.locator('#streak')).toHaveText('2');
  await solveOn(5);
  await expect(page.locator('#streak')).toHaveText('3');

  // Saturday isn't played; solving the weekend puzzle on Sunday still carries the streak on.
  await solveOn(7);
  await expect(page.locator('#streak')).toHaveText('4');
  await expect(page.locator('#kicker')).toHaveText('Days 6–7 · Weekend · hard · Python');
  // Monday: still alive until Monday's puzzle is missed.
  await page.clock.setFixedTime(dayDate(8));
  await page.reload();
  await expect(page.locator('#streak')).toHaveText('4');
  await page.clock.setFixedTime(dayDate(9));
  await page.reload();
  await expect(page.locator('#streak')).toHaveText('0');
});

test('a weekend puzzle solved on Saturday is still solved on Sunday', async ({ page }) => {
  await openAt(page, 'index.html', 6);
  await fresh(page);
  await expect(page.locator('#kicker')).toHaveText('Days 6–7 · Weekend · hard · Python');
  await guess(page, (await puzzleFor(page, 6)).display);
  expect((await readJson(page, 'debugg-xp')).python).toBe(200);
  await page.clock.setFixedTime(dayDate(7));
  await page.reload();
  await expect(page.locator('#feedback')).toContainText('Solved');
  expect((await readJson(page, 'debugg-xp')).python).toBe(200);
});

test('XP depends on the day, guesses and hints, and is only awarded once', async ({ page }) => {
  const xp = () => readJson(page, 'debugg-xp');
  await openAt(page, 'index.html', 3);  // Wednesday: 100
  await fresh(page);
  await guess(page, (await puzzleFor(page, 3)).display);
  expect((await xp()).python).toBe(100);
  await expect(page.locator('#feedback')).toContainText('+100 XP. Level up: Python Lv 2, overall Lv 2!');
  await page.reload();
  expect((await xp()).python).toBe(100);

  // Thursday (120), second guess with one hint: 120 × 0.75 × 0.75 = 67.5, so 68.
  await page.clock.setFixedTime(dayDate(4));
  await page.reload();
  await page.click('#hintBtn');
  await guess(page, 'nope');
  await guess(page, (await puzzleFor(page, 4)).display);
  expect((await xp()).python).toBe(168);

  // Friday: revealing earns 10.
  await page.clock.setFixedTime(dayDate(5));
  await page.reload();
  await page.click('#revealBtn');
  expect((await xp()).python).toBe(178);

  // Monday is a warm-up: 60.
  await page.clock.setFixedTime(dayDate(8));
  await page.reload();
  await guess(page, (await puzzleFor(page, 8)).display);
  expect((await xp()).python).toBe(238);
});

test('XP is kept per language, with an overall level above them', async ({ page }) => {
  // Python and JavaScript alternate: Wednesday (Day 3) is Python, Thursday JavaScript.
  await openAt(page, 'index.html', 3, { rotation: [{ lang: 'python' }, { lang: 'javascript' }] });
  await fresh(page);
  await guess(page, (await puzzleFor(page, 3)).display);
  await page.clock.setFixedTime(dayDate(4));
  await page.reload();
  await expect(page.locator('#kicker')).toContainText('JavaScript');
  await page.click('#revealBtn');
  expect(await readJson(page, 'debugg-xp')).toEqual({ python: 100, javascript: 10 });
  // Overall first, then today's language, then the others.
  const rows = page.locator('.xp-row');
  await expect(rows.locator('.xp-lang')).toHaveText(['Overall', 'JavaScript', 'Python']);
  await expect(rows.nth(0).locator('.xp-level')).toHaveText('Lv 2');
  await expect(rows.nth(0).locator('.xp-num')).toHaveText('110 / 300 XP');
  await expect(rows.nth(1).locator('.xp-level')).toHaveText('Lv 1');
  await expect(rows.nth(2).locator('.xp-level')).toHaveText('Lv 2');
});

test('saves from before XP still load', async ({ page }) => {
  // Old bare-number streaks are read as ending on Day 1, so this runs on Day 2 (a Tuesday).
  await openAt(page, 'index.html', 2);
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
  await openAt(page, 'index.html', -2);  // Friday 2 October 2026
  await fresh(page);
  await expect(page.locator('#kicker')).toHaveText('Preview · Day 1 is 5 October');
  await expect(page.locator('#filename')).toHaveText('preview.py');
  await guess(page, (await puzzleFor(page, -2)).display);
  await expect(page.locator('#feedback')).toHaveClass(/correct/);
  expect(await readJson(page, 'debugg-day-2')).toMatchObject({ solved: true });

  // Day 1 is a fresh puzzle.
  await page.clock.setFixedTime(dayDate(1));
  await page.reload();
  await expect(page.locator('#kicker')).toHaveText('Day 1 · Monday · warm-up · Python');
  await expect(page.locator('#feedback')).not.toHaveClass(/correct/);
});

test('moving Day 1 clears progress saved under the old day numbers', async ({ page }) => {
  await openAt(page, 'index.html', 1);
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
  await guess(page, (await puzzleFor(page, 1)).display);
  await page.reload();
  await expect(page.locator('#feedback')).toHaveClass(/correct/);
});

test('players get Python only for now, in the puzzles and the sandbox', async ({ page }) => {
  await openAt(page, 'index.html', 1);
  await fresh(page);
  await expect(page.locator('#filename')).toHaveText('day1.py');
  const langs = await page.evaluate(() => {
    const seen = new Set();
    for(let d = 1; d <= 70; d++) seen.add(Debugg.puzzleFor(d).lang);
    return [...seen];
  });
  expect(langs).toEqual(['python']);
  await page.goto('learn/sandbox.html#javascript');
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

test('sharing copies a spoiler-free result', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openAt(page, 'index.html#python');
  await fresh(page);
  await expect(page.locator('#shareRow')).toBeHidden();
  const p = await puzzleFor(page, 3);
  await guess(page, 'definitely not it');
  await page.click('#hintBtn');
  await guess(page, p.display);
  await page.click('#shareBtn');
  await expect(page.locator('#shareNote')).toHaveText('Copied. Paste it anywhere.');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  const site = new URL('.', page.url()).href;
  expect(text).toBe('debugg(it) Day 3 · Python\n🟥🟩⬛⬛ · 1 hint\nDebugged it in 2\n' + site);
  expect(text).not.toContain(p.display);

  // A revealed puzzle shares too, and still with the puzzle's own wordmark on the Ltd tab.
  await page.clock.setFixedTime(dayDate(4));
  await page.goto('index.html?ltd');
  await page.click('#revealBtn');
  await page.click('#shareBtn');
  await expect(page.locator('#shareNote')).toHaveText('Copied. Paste it anywhere.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^debugg\(it\) Day 4 · Python\n🟥🟥🟥🟥\nNot this time 🦆\n/);
});

test('a missed puzzle links to Debuggit Learn: the unit it names, or the course', async ({ page }) => {
  await openAt(page, 'index.html', 3);
  await fresh(page);
  // A first-guess solve doesn't suggest a lesson.
  await guess(page, (await puzzleFor(page, 3)).display);
  await expect(page.locator('#reveal')).toHaveClass(/show/);
  await expect(page.locator('#learnMore')).toBeHidden();

  // A day whose puzzle names a Learn unit, and one that doesn't; both revealed.
  const days = await page.evaluate(() => {
    const out = {};
    for(let d = -200; d <= 0 && !(out.tagged && out.plain); d++){
      const p = window.Debugg.puzzleFor(d);
      if(p.lang !== 'python') continue;
      if(p.learn && !out.tagged) out.tagged = { day: d, unit: p.learn };
      if(!p.learn && !out.plain) out.plain = { day: d };
    }
    return out;
  });
  await openAt(page, 'index.html', days.tagged.day);
  await page.click('#revealBtn');
  await expect(page.locator('#learnMoreLink')).toHaveText('Brush up on this in Debuggit Learn →');
  await expect(page.locator('#learnMoreLink')).toHaveAttribute('href', 'learn/#python/' + days.tagged.unit);
  await page.click('#learnMoreLink');
  await expect(page.locator('.unit[data-unit=' + days.tagged.unit + ']')).toHaveClass(/focus/);

  await openAt(page, 'index.html', days.plain.day);
  await guess(page, 'not the answer');
  await page.click('#revealBtn');
  await expect(page.locator('#learnMoreLink')).toHaveText('Learn Python from the start in Debuggit Learn →');
  await expect(page.locator('#learnMoreLink')).toHaveAttribute('href', 'learn/#python');
});

test('the stats panel counts games played, the win rate, streaks and guesses, Wordle-style', async ({ page }) => {
  await openAt(page, 'index.html', 5);
  await withStorage(page, {
    'debugg-day1': { attempts: ['correct'], solved: true, revealed: true, hintLevel: 0 },
    'debugg-day2': { attempts: ['wrong', 'wrong', 'correct'], solved: true, revealed: true, hintLevel: 1 },
    'debugg-day3': { attempts: ['wrong', 'wrong', 'wrong', 'wrong'], solved: false, revealed: true, hintLevel: 0 },
    'debugg-day4': { attempts: ['wrong', 'correct'], solved: true, revealed: true, hintLevel: 0 },
    'debugg-practice-day2': { attempts: ['correct'], solved: true, revealed: true, hintLevel: 0 },  // practice doesn't count
    'debugg-streak': { count: 1, lastDay: 4 }
  });
  await page.click('#statsLink');
  const d = page.locator('#statsDialog');
  await expect(d).toBeVisible();
  await expect(d.locator('#statPlayed')).toHaveText('4');
  await expect(d.locator('#statWin')).toHaveText('75%');
  await expect(d.locator('#statStreak')).toHaveText('1');
  await expect(d.locator('#statBest')).toHaveText('2');
  await expect(d.locator('.dist-bar')).toHaveText(['1', '1', '1', '0']);
  await expect(d).toContainText('2 of 3 solved without hints. Missed or revealed: 1.');
  await d.locator('[data-close]').click();
  await expect(d).toBeHidden();
  // After today's solve, its bar is picked out.
  const p = await puzzleFor(page, 5);
  await guess(page, 'nope');
  await guess(page, p.display);
  await page.click('#statsBtn');
  await expect(d.locator('.dist-bar.today')).toHaveText('2');
  await expect(d.locator('#statPlayed')).toHaveText('5');
});

test('the result can be shared as a picture, with no spoilers', async ({ page }) => {
  await openAt(page, 'index.html', 3);
  await fresh(page);
  const p = await puzzleFor(page, 3);
  await guess(page, 'definitely not it');
  await guess(page, p.display);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#shareImageBtn')]);
  expect(download.suggestedFilename()).toBe('debuggit-day3.png');
  const fs = require('fs');
  const png = fs.readFileSync(await download.path());
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  await expect(page.locator('#shareNote')).toHaveText('Saved the picture. Post it anywhere.');
  // The squares: red then green, the rest empty.
  const colours = await page.evaluate(async () => {
    const c = await DebuggShareCard.draw({ wordmark: 'debugg(it)', title: 'Day 3 · Python', attempts: ['wrong', 'correct'], max: 4,
      hints: 0, solved: true, result: 'Debugged it in 2', site: 'x', duck: 'img/duck.svg' });
    const g = c.getContext('2d');
    return [0, 1, 2].map(i => Array.from(g.getImageData(92 + i * 140 + 10, 260, 1, 1).data.slice(0, 3)));
  });
  expect(colours).toEqual([[0x4a, 0x22, 0x22], [0x1f, 0x4a, 0x35], [0x13, 0x14, 0x17]]);
});

test('past puzzles can be played again as practice, for no XP, streak or company pay', async ({ page }) => {
  await openAt(page, 'index.html', 5);
  await withStorage(page, {
    'debugg-day2': { attempts: ['wrong', 'correct'], solved: true, revealed: true, hintLevel: 0, xp: 60 },
    'debugg-streak': { count: 1, lastDay: 2 },
    'debugg-xp': { python: 60 }
  });
  await page.click('#archiveLink');
  const rows = page.locator('#archiveList .archive-row');
  // Newest first: Days 4 to 1.
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText('Day 4');
  await expect(rows.nth(0)).toContainText('Thursday · tricky · Python · Not played');
  await expect(rows.nth(2)).toContainText('Solved on the day in 2');
  await expect(rows.nth(2)).toHaveClass(/solved/);
  await rows.nth(2).locator('a').click();
  await expect(page).toHaveURL(/index\.html\?day=2$/);
  await expect(page.locator('#kicker')).toHaveText(/^Practice · Day 2 · Tuesday/);
  await expect(page.locator('#practiceNote')).toContainText('You solved it on the day in 2.');
  // A fresh game, whatever happened on the day.
  await expect(page.locator('#tiles .tile.wrong, #tiles .tile.correct')).toHaveCount(0);
  const p = await puzzleFor(page, 2);
  await page.evaluate(() => document.addEventListener('debugg:puzzle-finished', () => { window.__finished = true; }));
  await guess(page, p.display);
  await expect(page.locator('#feedback')).toContainText('Practice: no XP.');
  expect(await page.evaluate(() => !!window.__finished)).toBe(false);
  await expect(page.locator('#shareRow')).toBeHidden();
  await expect(page.locator('#playAgain')).toBeVisible();
  expect(await readJson(page, 'debugg-xp')).toEqual({ python: 60 });
  expect(await readJson(page, 'debugg-streak')).toEqual({ count: 1, lastDay: 2 });
  expect((await readJson(page, 'debugg-day2')).attempts).toEqual(['wrong', 'correct']);
  expect((await readJson(page, 'debugg-practice-day2')).solved).toBe(true);
  // The archive shows the practice result, and it can be played again.
  await page.click('#archiveLink');
  await expect(rows.nth(2)).toContainText('practice: solved in 1');
  await page.keyboard.press('Escape');
  await page.click('#playAgain');
  await expect(page.locator('#guess')).toBeEnabled();
  // Today and later days can't be practised: ?day=5 is just today.
  await page.goto('index.html?day=5');
  await expect(page.locator('#kicker')).toHaveText(/^Day 5/);
  await expect(page.locator('#practiceNote')).toBeHidden();
});

test('before Day 1, the archive lists the last two weeks of preview days', async ({ page }) => {
  await openAt(page, 'index.html', -3);
  await page.click('#archiveLink');
  const rows = page.locator('#archiveList .archive-row');
  expect(await rows.count()).toBeGreaterThanOrEqual(11);
  await expect(rows.first()).toContainText('Preview · ');
  await openAt(page, 'index.html', 1);
  await page.click('#archiveLink');
  await expect(page.locator('#archiveEmpty')).toHaveText('No past puzzles yet. Come back tomorrow.');
});

test('after the game, Step through it plays the code back line by line, as real Python ran it', async ({ page }) => {
  await openAt(page, 'index.html', 3);
  await fresh(page);
  await expect(page.locator('#traceRow')).toBeHidden();
  const p = await puzzleFor(page, 3);
  await page.click('#revealBtn');
  await page.click('#traceBtn');
  const steps = await page.evaluate(() => DebuggTrace.stepsFor(Debugg.puzzleFor(3)));
  expect(steps.length).toBeGreaterThan(2);
  await expect(page.locator('#traceNum')).toHaveText('Step 1 of ' + steps.length);
  await expect(page.locator('#code .cl.now')).toHaveAttribute('data-line', String(steps[0].line));
  await expect(page.locator('#tracePrev')).toBeDisabled();
  await page.click('#traceNext');
  await expect(page.locator('#code .cl.now')).toHaveAttribute('data-line', String(steps[1].line));
  // Arrow keys step too; the last step is the end, with everything printed.
  for(let i = 1; i < steps.length - 1; i++) await page.keyboard.press('ArrowRight');
  await expect(page.locator('#traceWhat')).toHaveText('Finished.');
  await expect(page.locator('#traceOut')).toHaveText(p.display);
  await expect(page.locator('#code .cl.now')).toHaveCount(0);
  await expect(page.locator('#traceNext')).toBeDisabled();
  await page.click('#traceClose');
  await expect(page.locator('#trace')).toBeHidden();
  // Every Python puzzle has a trace.
  expect(await page.evaluate(() => Debugg.puzzlesFor('python').every(p => DebuggTrace.stepsFor(p)))).toBe(true);
});
