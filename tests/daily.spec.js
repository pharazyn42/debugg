// The daily puzzle page: every puzzle, the language rotation, streak, XP and old saves.
const { test, expect } = require('@playwright/test');
const { dayDate, openAt, fresh, withStorage, puzzleFor, guess, solve, miss, readJson } = require('./helpers');

const EXT = { python: 'py', javascript: 'js', c: 'c', rust: 'rs' };
const NAME = { python: 'Python', javascript: 'JavaScript', c: 'C', rust: 'Rust' };

// Each language on its own, so every one of its puzzles comes up in turn.
for(const lang of Object.keys(EXT)){
  test(`every ${NAME[lang]} puzzle is scheduled, shows its code and accepts its answer`, async ({ page }) => {
    await openAt(page, 'index.html', 1, { rotation: [{ lang }], formats: true });
    const count = await page.evaluate(l => window.Debugg.puzzlesFor(l).length, lang);
    expect(count).toBeGreaterThan(5);
    const seen = new Set();
    for(let day = 1; seen.size < count && day <= 400; day++){
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
      // Order the lines has no flag until it's solved; a code challenge has none at all.
      const flagged = !['order', 'pass'].includes(p.format || 'output');
      if(flagged) await expect(page.locator('#flag')).toHaveCount(1);
      await miss(page, day);
      await expect(page.locator('#feedback')).toHaveClass(/wrong/);
      await solve(page, day);
      await expect(page.locator('#feedback'), `day ${day}: ${p.display}`).toHaveClass(/correct/);
      if(p.format !== 'pass') await expect(page.locator('#flag')).toHaveCount(1);
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
  expect(await readJson(page, 'debuggit-daily-xp')).toEqual({ rust: 60 });
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

test('the wordmark is "debug it" in the day\'s language, and each app has its title', async ({ page }) => {
  const expected = { python: 'debugg(it)', javascript: 'debugg.it()', c: 'debugg(&it);', rust: 'debugg!(it)' };
  for(const [lang, code] of Object.entries(expected)){
    await openAt(page, 'index.html', 1, { rotation: [{ lang }] });
    expect(await page.evaluate(l => window.Debugg.wordmarkFor(l), lang)).toBe(code);
    // The daily's header has the kiwi and its title, the same as its button at the top.
    await expect(page.locator('#wordmark')).toHaveText('debuggit.daily()');
    await expect(page.locator('.brand .mascot-logo')).toHaveCount(1);
  }
  await expect(page).toHaveTitle('Debuggit');
  await page.goto('learn/');
  await expect(page.locator('#wordmark')).toHaveText('debuggit.learn()');
  await expect(page.locator('#wordmark')).toHaveAttribute('aria-label', 'Debuggit Learn');
  await expect(page.locator('.modes a').first()).toHaveText('debuggit.learn()');
  await page.goto('learn/sandbox.html');
  await expect(page.locator('#wordmark')).toHaveText('debuggit.run()');
  await expect(page.locator('#wordmark')).toHaveAttribute('aria-label', 'Debuggit Sandbox');
  await page.goto('privacy.html');
  await expect(page.locator('.wordmark')).toHaveText('debugg.it()');
});

test('the Debuggit kiwi is the logo and favicon, and reacts to how the game went', async ({ page }) => {
  await openAt(page, 'index.html', 3);
  await fresh(page);
  await expect(page.locator('.brand .mascot-logo')).toHaveAttribute('src', 'img/kiwi.svg');
  await expect.poll(() => page.evaluate(() => document.querySelector('.brand .mascot-logo').naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', 'img/kiwi.svg');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /img\/share\.png\?v=\d+$/);
  await expect(page.locator('#kiwiSays')).toBeHidden();
  await guess(page, (await puzzleFor(page, 3)).display);
  await expect(page.locator('#kiwiSays')).toHaveClass(/happy/);
  await expect(page.locator('#kiwiLine')).toHaveText('First try, no hints.');

  // A solve with a hint and a miss.
  await page.clock.setFixedTime(dayDate(4));
  await page.reload();
  await page.click('#hintBtn');
  await guess(page, 'nope');
  await guess(page, (await puzzleFor(page, 4)).display);
  await expect(page.locator('#kiwiLine')).toHaveText('Debugged it in 2 guesses, with 1 hint.');

  // A reveal gets a wobble, and it's still there after a reload.
  await page.clock.setFixedTime(dayDate(5));
  await page.reload();
  await page.click('#revealBtn');
  await expect(page.locator('#kiwiSays')).toHaveClass(/dizzy/);
  await page.reload();
  await expect(page.locator('#kiwiLine')).toContainText('Even the kiwi misses a bug sometimes');
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
  expect((await readJson(page, 'debuggit-daily-xp')).python).toBe(200);
  await page.clock.setFixedTime(dayDate(7));
  await page.reload();
  await expect(page.locator('#feedback')).toContainText('Solved');
  expect((await readJson(page, 'debuggit-daily-xp')).python).toBe(200);
});

test('XP depends on the day, guesses and hints, and is only awarded once', async ({ page }) => {
  const xp = () => readJson(page, 'debuggit-daily-xp');
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
  expect(await readJson(page, 'debuggit-daily-xp')).toEqual({ python: 100, javascript: 10 });
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
    'debuggit-daily-streak': '3',
    'debuggit-daily-day2': { attempts: ['wrong', 'correct'], solved: true, revealed: true, hintLevel: 2 }
  });
  await expect(page.locator('#streak')).toHaveText('3');
  await expect(page.locator('#feedback')).toContainText('Solved');
  // Tuesday (80), 2nd guess with 2 hints: 80 × 0.75 × 0.5 = 30, awarded once.
  expect((await readJson(page, 'debuggit-daily-xp')).python).toBe(30);
  await page.reload();
  expect((await readJson(page, 'debuggit-daily-xp')).python).toBe(30);
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
  await expect(page.locator('#kicker')).toHaveText('Preview');
  await expect(page.locator('#filename')).toHaveText('preview.py');
  await guess(page, (await puzzleFor(page, -2)).display);
  await expect(page.locator('#feedback')).toHaveClass(/correct/);
  expect(await readJson(page, 'debuggit-daily-day-2')).toMatchObject({ solved: true });

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
    localStorage.setItem('debuggit-daily-day1', JSON.stringify({ attempts: ['correct'], solved: true, revealed: true, hintLevel: 0, xp: 100 }));
    localStorage.setItem('debuggit-daily-streak', JSON.stringify({ count: 1, lastDay: 1 }));
    localStorage.setItem('debuggit-daily-xp', JSON.stringify({ python: 100 }));
    localStorage.setItem('debuggit-ltd-save', JSON.stringify({ enabled: false, pausedAt: 1, money: 500, paid: { 'python-1': true } }));
  });
  await page.reload();
  await expect(page.locator('#feedback')).not.toHaveClass(/correct/);
  const kept = await page.evaluate(() => ({
    day1: localStorage.getItem('debuggit-daily-day1'),
    streak: localStorage.getItem('debuggit-daily-streak'),
    xp: JSON.parse(localStorage.getItem('debuggit-daily-xp')),
    company: JSON.parse(localStorage.getItem('debuggit-ltd-save'))
  }));
  expect(kept.day1).toBeNull();
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
  expect(text).toBe('debuggit.daily() Day 3 · Python\n🟥🟩⬛⬛ · 1 hint\nDebugged it in 2\n' + site);
  expect(text).not.toContain(p.display);

  // A revealed puzzle shares too.
  await page.clock.setFixedTime(dayDate(4));
  await page.goto('index.html');
  await page.click('#revealBtn');
  await page.click('#shareBtn');
  await expect(page.locator('#shareNote')).toHaveText('Copied. Paste it anywhere.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^debuggit\.daily\(\) Day 4 · Python\n🟥🟥🟥🟥\nNot this time 🥝\n/);
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
    'debuggit-daily-day1': { attempts: ['correct'], solved: true, revealed: true, hintLevel: 0 },
    'debuggit-daily-day2': { attempts: ['wrong', 'wrong', 'correct'], solved: true, revealed: true, hintLevel: 1 },
    'debuggit-daily-day3': { attempts: ['wrong', 'wrong', 'wrong', 'wrong'], solved: false, revealed: true, hintLevel: 0 },
    'debuggit-daily-day4': { attempts: ['wrong', 'correct'], solved: true, revealed: true, hintLevel: 0 },
    'debuggit-daily-practice-day2': { attempts: ['correct'], solved: true, revealed: true, hintLevel: 0 },  // practice doesn't count
    'debuggit-daily-streak': { count: 1, lastDay: 4 }
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
    const c = await DebuggShareCard.draw({ wordmark: 'debuggit.daily()', title: 'Day 3 · Python', attempts: ['wrong', 'correct'], max: 4,
      hints: 0, solved: true, result: 'Debugged it in 2', site: 'x', mascot: 'img/kiwi.svg' });
    const g = c.getContext('2d');
    return [0, 1, 2].map(i => Array.from(g.getImageData(92 + i * 140 + 10, 260, 1, 1).data.slice(0, 3)));
  });
  expect(colours).toEqual([[0x4a, 0x22, 0x22], [0x1f, 0x4a, 0x35], [0x13, 0x14, 0x17]]);
});

test('past puzzles can be played again as practice, for no XP, streak or company pay', async ({ page }) => {
  await openAt(page, 'index.html', 5);
  await withStorage(page, {
    'debuggit-daily-day2': { attempts: ['wrong', 'correct'], solved: true, revealed: true, hintLevel: 0, xp: 60 },
    'debuggit-daily-streak': { count: 1, lastDay: 2 },
    'debuggit-daily-xp': { python: 60 }
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
  expect(await readJson(page, 'debuggit-daily-xp')).toEqual({ python: 60 });
  expect(await readJson(page, 'debuggit-daily-streak')).toEqual({ count: 1, lastDay: 2 });
  expect((await readJson(page, 'debuggit-daily-day2')).attempts).toEqual(['wrong', 'correct']);
  expect((await readJson(page, 'debuggit-daily-practice-day2')).solved).toBe(true);
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
  // Every Python puzzle has a trace, except the code challenges, which run the player's own code.
  expect(await page.evaluate(() => Debugg.puzzlesFor('python').filter(p => p.format !== 'pass').every(p => DebuggTrace.stepsFor(p)))).toBe(true);
});

test('from Day 1 the weekdays take turns with the puzzle formats', async ({ page }) => {
  await openAt(page, 'index.html', 1, { formats: true });
  const formats = await page.evaluate(() => [1, 2, 3, 4, 5, 6, 8, 9, 10, 15, 17].map(d => (Debugg.puzzleFor(d).format || 'output') + '/' + Debugg.formatFor(d)));
  expect(formats).toEqual(['choice/choice', 'output/output', 'error/error', 'bug/bug', 'output/output', 'pass/pass',
    'output/output', 'count/count', 'output/output', 'value/value', 'order/order']);
  // Preview days stay "what does this print?", so nothing already played changes.
  expect(await page.evaluate(() => [0, -1, -2, -3, -4, -5].every(d => !Debugg.puzzleFor(d).format))).toBe(true);
});

test('multiple choice: pick what it prints, in 2 tries with 1 hint', async ({ page }) => {
  await openAt(page, 'index.html', 1, { formats: true });
  await fresh(page);
  const p = await puzzleFor(page, 1);
  expect(p.format).toBe('choice');
  await expect(page.locator('#title')).toHaveText('What does this print?');
  await expect(page.locator('#tiles .tile')).toHaveCount(2);
  await expect(page.locator('#guessRow')).toBeHidden();
  await expect(page.locator('#choices .choice')).toHaveCount(4);
  await page.click('#hintBtn');
  await expect(page.locator('#hint2Btn')).toBeHidden();
  await expect(page.locator('#hintDot2')).toBeHidden();
  await miss(page, 1);
  await expect(page.locator('#choices .choice.wrong')).toHaveCount(1);
  // A reload keeps the wrong pick marked.
  await page.reload();
  await expect(page.locator('#choices .choice.wrong')).toBeDisabled();
  await solve(page, 1);
  await expect(page.locator('#feedback')).toHaveText(/^Correct: debugdebug \(1 hint used\)\. \+23 XP\./);  // 60 × 50% × 75%
  await expect(page.locator('#choices .choice.right')).toHaveText(p.display);
  await expect(page.locator('#answerOut')).toHaveText(p.display);
});

test('will it error: runs fine, or which error, in 2 tries', async ({ page }) => {
  await openAt(page, 'index.html', 3, { formats: true });
  await fresh(page);
  const p = await puzzleFor(page, 3);
  expect(p.format).toBe('error');
  await expect(page.locator('#title')).toHaveText('Will it run, or crash?');
  await expect(page.locator('#ask')).toHaveText('Does it run fine, or stop with an error?');
  await expect(page.locator('#choices .choice', { hasText: 'Runs fine' })).toHaveCount(1);
  await miss(page, 3);
  await miss(page, 3);
  await expect(page.locator('#feedback')).toHaveText(/^Out of guesses/);
  await expect(page.locator('#answerOut')).toHaveText('It stops with a KeyError.');
  await expect(page.locator('#choices .choice.right')).toHaveText('KeyError');
});

test('spot the bug: see what it should print, then tap the line', async ({ page }) => {
  await openAt(page, 'index.html', 4, { formats: true });
  await fresh(page);
  const p = await puzzleFor(page, 4);
  expect(p.format).toBe('bug');
  await expect(page.locator('#title')).toHaveText('Spot the bug');
  await expect(page.locator('#ask .ask-out').first()).toHaveText(p.expected);
  await expect(page.locator('#ask .ask-out.wrong')).toHaveText(p.display);
  await expect(page.locator('#tiles .tile')).toHaveCount(4);
  await miss(page, 4);
  await expect(page.locator('#code .cl.wrong')).toHaveCount(1);
  // Keyboard works too: focus the line and press Enter.
  await page.locator('#code .cl[data-line="' + p.bugLine + '"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedback')).toHaveText(/^Correct: the bug is on line 2/);
  await expect(page.locator('#code .cl.right')).toHaveAttribute('data-line', String(p.bugLine));
  await expect(page.locator('#code')).not.toHaveClass(/tappable/);
  await expect(page.locator('#answerOut')).toContainText('Fixed, it reads return items[-3:].');
});

test('what’s the value and how many times: typed, with the question above the code', async ({ page }) => {
  await openAt(page, 'index.html', 9, { formats: true });
  await fresh(page);
  let p = await puzzleFor(page, 9);
  expect(p.format).toBe('count');
  await expect(page.locator('#title')).toHaveText('How many times does it run?');
  await expect(page.locator('#ask')).toHaveText('How many times does line ' + p.ask.line + ' run?');
  await expect(page.locator('#code .cl.asked')).toHaveAttribute('data-line', String(p.ask.line));
  await expect(page.locator('#guess')).toHaveAttribute('placeholder', 'a number');
  await solve(page, 9);
  await expect(page.locator('#answerOut')).toHaveText('Line ' + p.ask.line + ' runs ' + p.display + ' times.');

  await page.clock.setFixedTime(dayDate(15));
  await page.reload();
  p = await puzzleFor(page, 15);
  expect(p.format).toBe('value');
  await expect(page.locator('#title')).toHaveText('What’s the value of ' + p.ask.name + '?');
  await guess(page, 'nope');
  await expect(page.locator('#feedback')).toHaveText(p.nudge);
  await guess(page, p.answers[0]);
  await expect(page.locator('#answerOut')).toHaveText(p.ask.name + ' ends as ' + p.display + '.');
});

test('order the lines: tap to move or use the arrows, with 3 checks', async ({ page }) => {
  await openAt(page, 'index.html', 17, { formats: true });
  await fresh(page);
  const p = await puzzleFor(page, 17);
  expect(p.format).toBe('order');
  await expect(page.locator('#title')).toHaveText('Put the lines in order');
  await expect(page.locator('#ask .ask-out')).toHaveText(p.display);
  await expect(page.locator('#tiles .tile')).toHaveCount(3);
  const lines = p.code.split('\n');
  const shown = () => page.locator('#code .order-code').allTextContents();
  const start = await shown();
  expect([...start].sort()).toEqual([...lines].sort());
  expect(start).not.toEqual(lines);
  // Tap a line, then tap where it goes.
  await page.locator('#code .order-row').nth(start.indexOf(lines[0])).click();
  await expect(page.locator('#code .order-row.picked')).toHaveCount(1);
  await page.locator('#code .order-row').nth(0).click();
  expect((await shown())[0]).toBe(lines[0]);
  // A wrong check marks the lines already in place, and the order survives a reload.
  await page.click('#checkOrder');
  await expect(page.locator('#feedback')).toHaveClass(/wrong/);
  await expect(page.locator('#code .order-row.placed').first()).toBeVisible();
  const before = await shown();
  await page.reload();
  expect(await shown()).toEqual(before);
  await solve(page, 17);
  await expect(page.locator('#feedback')).toHaveText(/^Correct: that’s the order/);
  // Once done, the code shows normally, in order.
  await expect(page.locator('#code .order-row')).toHaveCount(0);
  await expect(page.locator('#code .cl')).toHaveCount(lines.length);
});

// Phones zoom in on a text box under 16px when it gets the focus, so on touch screens they're 16px.
test('the weekend is a code challenge: make it pass, with hidden tests and 4 submissions', async ({ page }) => {
  // Real Python (Pyodide), from the CDN or PYODIDE_DIR; it loads twice, as the runaway loop throws it away.
  test.setTimeout(240000);
  const T = { timeout: 90000 };
  await openAt(page, 'index.html', 6, { formats: true });
  await fresh(page);
  const p = await puzzleFor(page, 6);
  expect(p.format).toBe('pass');
  await expect(page.locator('#title')).toHaveText('Make it pass');
  await expect(page.locator('#ask')).toContainText('add_tag(tag, tags)');
  await expect(page.locator('#tiles .tile')).toHaveCount(4);
  await expect(page.locator('#guessRow')).toBeHidden();
  await expect(page.locator('#code')).toBeHidden();
  await expect(page.locator('#challengeSrc')).toHaveValue(p.code);
  await expect(page.locator('#tests tbody tr')).toHaveCount(p.tests.length + 1);
  await expect(page.locator('#tests .hidden-row')).toHaveText(p.hidden.length + ' hidden testschecked when you submit');

  // Running the visible tests is free, as often as you like.
  await page.click('#runTests');
  await expect(page.locator('#challengeStatus')).toHaveText('2 of 3 tests pass.', T);
  await expect(page.locator('#tests tbody tr').nth(1)).toHaveClass('bad');
  await expect(page.locator('#tests tbody tr').nth(1)).toContainText("✕ gave ['python', 'debug']");
  await expect(page.locator('#tiles .tile.wrong')).toHaveCount(0);

  // Hard-coding the visible tests passes them, but the hidden tests catch it, and it uses a submission.
  await page.fill('#challengeSrc', p.wrong[2]);
  await page.click('#submitCode');
  await expect(page.locator('#challengeStatus')).toHaveText(/^3 of 3 tests pass, and [0-4] of 5 hidden ones\.$/, T);
  await expect(page.locator('#tiles .tile.wrong')).toHaveCount(1);
  await expect(page.locator('#feedback')).toHaveText(p.nudge);
  await expect(page.locator('#tests .hidden-row')).toHaveClass(/bad/);

  // An error in the code shows, and what the code prints shows too.
  await page.fill('#challengeSrc', 'print("hi")\ndef add_tag(:\n');
  await page.click('#runTests');
  await expect(page.locator('#challengeStatus')).toHaveText('Your code stops with an error before the tests can run.', T);
  await expect(page.locator('#challengePrinted')).toContainText('SyntaxError');

  // A runaway loop is stopped, and doesn't use a submission.
  await page.fill('#challengeSrc', 'while True:\n    pass\n');
  await page.click('#submitCode');
  await expect(page.locator('#challengeStatus')).toHaveText(/Is there an infinite loop\? That didn’t use a submission\.$/, { timeout: 30000 });
  await expect(page.locator('#tiles .tile.wrong')).toHaveCount(1);

  // The code is kept on a reload. Solved on the second submission: 200 XP × 75%.
  await page.fill('#challengeSrc', p.solution);
  await page.reload();
  await expect(page.locator('#challengeSrc')).toHaveValue(p.solution);
  await page.click('#submitCode');
  await expect(page.locator('#feedback')).toHaveText(/^Correct: every test passes\. \+150 XP\./, T);
  await expect(page.locator('#tests .hidden-row')).toContainText('5 of 5 pass');
  await expect(page.locator('#challengeSrc')).toHaveJSProperty('readOnly', true);
  await expect(page.locator('#challengeActions')).toBeHidden();
  await expect(page.locator('#answerOut')).toContainText('One way to pass every test');
  await expect(page.locator('#kiwiLine')).toHaveText('Debugged it in 2 submissions.');
  await expect(page.locator('#tryLink')).toBeHidden();

  // Sunday is the same challenge, still solved.
  await page.clock.setFixedTime(dayDate(7));
  await page.reload();
  await expect(page.locator('#feedback')).toHaveText(/^Solved: every test passes\./);
  await expect(page.locator('#challengeSrc')).toHaveValue(p.solution);
});

test('weekend code challenges stay out of Debuggit Ltd’s desk jobs', async ({ page }) => {
  await openAt(page, 'index.html?ltd', 8, { formats: true });
  const r = await page.evaluate(() => new Promise(resolve => {
    const s = document.createElement('script');
    s.src = 'ltd/desk.js';
    s.onload = () => resolve({ challenge: Debugg.puzzleFor(6).format,
      ids: [...DebuggDesk.all(8).keys()], id: 'd:' + Debugg.codeId(Debugg.puzzleFor(6).code) });
    if(window.DebuggDesk) s.onload(); else document.head.appendChild(s);
  }));
  expect(r.challenge).toBe('pass');
  expect(r.ids.length).toBeGreaterThan(0);
  expect(r.ids).not.toContain(r.id);
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test('text boxes are 16px, so tapping into one doesn\'t zoom the page', async ({ page }) => {
    const size = sel => page.locator(sel).evaluate(el => getComputedStyle(el).fontSize);
    await openAt(page, 'index.html');
    expect(await size('#guess')).toBe('16px');
    await openAt(page, 'learn/sandbox.html');
    expect(await size('#src')).toBe('16px');
    expect(await size('#puzzlePick')).toBe('16px');
  });
});

test('the schedule never serves a puzzle twice until a language has used them all, previews included', async ({ page }) => {
  await openAt(page, 'index.html', 1, { formats: true });
  const r = await page.evaluate(() => {
    const D = window.Debugg;
    const rep = D.firstRepeatDay();
    const end = rep ? rep.day - 1 : 400;
    const seen = new Map(), repeats = [];
    // From two weeks of preview days to the day before the first repeat.
    for(let d = -13; d <= end; d++){
      if(D.slotDay(d) !== d) continue;  // Sundays share Saturday's puzzle
      const p = D.puzzleFor(d);
      const key = p.lang + '|' + p.code;
      if(seen.has(key)) repeats.push([d, seen.get(key)]);
      seen.set(key, d);
    }
    return { rep, repeats, served: seen.size, total: D.puzzlesFor('python').length };
  });
  expect(r.repeats, 'a puzzle came up twice, as [day, earlier day]').toEqual([]);
  // When the schedule does start again, it's because every puzzle has been served, not before.
  if(r.rep) expect(r.served).toBe(r.total);
});

test('the Save/restore progress, Sandbox and Feedback buttons at the bottom all look the same', async ({ page }) => {
  const look = () => page.evaluate(() => [...document.querySelectorAll('.footer-actions > *')].map(el => {
    const s = getComputedStyle(el);
    return { text: el.textContent.trim(), font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, color: s.color,
             border: s.borderTopWidth + ' ' + s.borderTopColor, radius: s.borderTopLeftRadius, padding: s.padding,
             height: Math.round(el.getBoundingClientRect().height), cursor: s.cursor };
  }));
  for(const path of ['index.html', 'learn/']){
    await openAt(page, path, 3);
    const [save, sandbox, feedback] = await look();
    expect(save.text).toBe('Save/restore progress');
    expect(sandbox.text).toBe('Sandbox');
    expect(feedback.text).toBe('Feedback');
    for(const key of ['font', 'size', 'weight', 'color', 'border', 'radius', 'padding', 'height', 'cursor']){
      expect(sandbox[key], path + ': Sandbox ' + key).toBe(save[key]);
      expect(feedback[key], path + ': Feedback ' + key).toBe(save[key]);
    }
  }
});
