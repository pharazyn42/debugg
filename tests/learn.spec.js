// Debugg Learn: the course map, lessons (with wrong answers coming back), checkpoints, and Learn's own
// XP and streak, kept apart from the daily puzzles.
const { test, expect } = require('@playwright/test');
const { dayDate, openAt, fresh, readJson } = require('./helpers');

const current = page => page.evaluate(() => window.DebuggLearn.current());
const learnSave = page => readJson(page, 'debuggit-learn-save');

async function pickOption(page, text){
  await page.evaluate(t => [...document.querySelectorAll('#step .option')].find(b => b.dataset.text === t).click(), text);
}

// Answers the step on screen, right or wrong, then continues.
async function answer(page, right = true){
  const s = await current(page);
  if(s.type === 'teach'){
    await page.click('#continueBtn');
    return s;
  }
  if(s.type === 'predict'){
    await page.fill('#answer', right ? s.display : 'definitely not it');
    await page.click('#checkBtn');
  }else if(s.type === 'line'){
    const n = right ? s.line : (s.line === 1 ? 2 : 1);
    await page.click('#step .code-line[data-line="' + n + '"]');
  }else{
    await pickOption(page, s.options.find(o => right ? o.correct : !o.correct).text);
  }
  await expect(page.locator('#stepFeedback')).toHaveClass(right ? /correct/ : /wrong/);
  await page.click('#continueBtn');
  return s;
}
// Answers every step right until the lesson or checkpoint ends.
async function finishAll(page){
  while(!(await page.locator('#summary').count())) await answer(page, true);
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', d => d.accept());
  await openAt(page, 'learn/');
  await fresh(page);
});

test('the course map opens with the first lesson, and every unit file is loaded', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Learn Python');
  const unit = page.locator('.unit[data-unit=values]');
  await expect(unit.locator('h2')).toHaveText('Values and printing');
  const rows = unit.locator('.lesson-row');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toBeEnabled();
  await expect(rows.nth(1)).toBeDisabled();
  await expect(rows.nth(2)).toBeDisabled();
  // The checkpoint can be taken straight away, to test out of the unit.
  await expect(rows.nth(3)).toBeEnabled();
  await expect(rows.nth(3)).toContainText('Test out');
  await expect(page.locator('.unit.planned').first()).toContainText('The classic traps');
  // Part 1 has its heading above Unit 1.
  await expect(page.locator('.course-section .section-title').first()).toHaveText('Python Part 1: The basics');
  expect(await page.evaluate(() => document.querySelector('.course-section').compareDocumentPosition(document.querySelector('.unit')) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  // Part 2 is a teaser under its own heading, its units numbered on from Unit 8.
  await expect(page.locator('.course-section .section-title').nth(1)).toHaveText('Python Part 2: Intermediate');
  await expect(page.locator('.unit.planned')).toHaveCount(7);
  await expect(page.locator('.unit.planned').nth(1)).toContainText('Unit 9');
  await expect(page.locator('.unit.planned').nth(1)).toContainText('Tuples and sets');
  await expect(page.locator('.unit.planned').last()).toContainText('Errors and exceptions');
  await expect(page.locator('#learnStreak')).toHaveText('0');
  // learn/index.html loads every unit file its course lists.
  expect(await page.evaluate(() => Object.values(DEBUGG_LEARN.courses).reduce((n, c) => n + c.files.length, 0)))
    .toBe(await page.evaluate(() => DEBUGG_LEARN.units.length));
});

test('the Continue card starts the next lesson or checkpoint in one tap', async ({ page }) => {
  const card = page.locator('#continue');
  // A first visit starts at the very beginning.
  await expect(card.locator('.continue-label')).toHaveText('Start here');
  await expect(card.locator('h2')).toHaveText('print() and text');
  await expect(card).toContainText('Unit 1: Values and printing · Lesson 1 of 3');
  await card.locator('button').click();
  await expect(page.locator('.session-top')).toBeVisible();
  await finishAll(page);
  await page.click('#summary [data-action=quit]');
  // Then it picks up where you left off.
  await expect(card.locator('.continue-label')).toHaveText('Continue');
  await expect(card.locator('h2')).toHaveText('Numbers and arithmetic');
  await expect(card.locator('button')).toHaveText('Continue →');
  // With every lesson in a unit done, it's the checkpoint.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('debuggit-learn-save'));
    s.lessons['python/values/numbers'] = { stars: 3 };
    s.lessons['python/values/variables'] = { stars: 2 };
    localStorage.setItem('debuggit-learn-save', JSON.stringify(s));
  });
  await page.reload();
  await expect(card.locator('h2')).toHaveText('Checkpoint');
  await expect(card).toContainText('Pass it to unlock the next unit');
  await card.locator('button').click();
  await finishAll(page);
  await page.click('#summary [data-action=quit]');
  await expect(card.locator('h2')).toHaveText('Characters and length');
  await expect(card).toContainText('Unit 2: Strings · Lesson 1 of 4');
  // Testing out of a unit skips its lessons; with every unit passed, you're caught up.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('debuggit-learn-save'));
    s.checkpoints['python/strings'] = { passed: true, best: 8 };
    s.checkpoints['python/lists'] = { passed: true, best: 8 };
    s.checkpoints['python/conditions'] = { passed: true, best: 8 };
    s.checkpoints['python/loops'] = { passed: true, best: 8 };
    s.checkpoints['python/functions'] = { passed: true, best: 8 };
    s.checkpoints['python/dictionaries'] = { passed: true, best: 8 };
    localStorage.setItem('debuggit-learn-save', JSON.stringify(s));
  });
  await page.reload();
  await expect(card.locator('.continue-label')).toHaveText('All caught up');
  await expect(card).toContainText('Next up: The classic traps, coming soon.');
  // Nothing left to continue; the only button is mixed practice.
  await expect(card.locator('button')).toHaveCount(1);
  await expect(card.locator('#mixedBtn')).toBeVisible();
  // A coming-soon course has no card.
  await page.goto('learn/#c');
  await expect(page.locator('h1')).toHaveText('Learn C');
  await expect(card).toHaveCount(0);
});

test('missed questions come back in review rounds: tomorrow, then after 3 and 7 days', async ({ page }) => {
  // Miss one question in the first lesson (it comes back in the lesson, and joins the review queue).
  await page.locator('#continue button').click();
  let missed = null;
  while(!(await page.locator('#summary').count())){
    const s = await current(page);
    if(!missed && s.type !== 'teach'){
      missed = await answer(page, false);
    }else await answer(page, true);
  }
  let save = await learnSave(page);
  expect(save.review).toEqual([{ lang: 'python', unit: 'values', lesson: 'print', q: missed.question + '\n' + (missed.code || ''), box: 0, due: 4 }]);
  await page.click('#summary [data-action=quit]');
  await expect(page.locator('#reviewDue')).toHaveCount(0);  // not due until tomorrow

  // Tomorrow it's in the Continue card.
  const reviewDay = async (day, right) => {
    await openAt(page, 'learn/', day);
    await expect(page.locator('#reviewDue')).toContainText('1 question you missed before');
    await page.click('#reviewBtn');
    await expect(page.locator('h1')).toHaveText('Review');
    expect((await current(page)).question).toBe(missed.question);
    if(!right){ await answer(page, false); await expect(page.locator('h1')).toHaveText('Review'); }
    await answer(page, true);
    await expect(page.locator('#summary')).toBeVisible();
    return (await learnSave(page)).review;
  };
  const xpBefore = save.xp.python;
  expect(await reviewDay(4, true)).toMatchObject([{ box: 1, due: 7 }]);
  await expect(page.locator('#summary')).toContainText('1 right first time +2 XP');
  expect((await learnSave(page)).xp.python).toBe(xpBefore + 2);
  expect((await learnSave(page)).streak).toEqual({ count: 2, lastDay: 4 });
  await openAt(page, 'learn/', 6);
  await expect(page.locator('#reviewDue')).toHaveCount(0);
  // Missed again, it starts over from tomorrow.
  expect(await reviewDay(7, false)).toMatchObject([{ box: 0, due: 8 }]);
  await expect(page.locator('#summary')).toContainText('0 right first time. 1 will come back tomorrow.');
  expect(await reviewDay(8, true)).toMatchObject([{ box: 1, due: 11 }]);
  expect(await reviewDay(11, true)).toMatchObject([{ box: 2, due: 18 }]);
  // Right three times running, it's learnt.
  expect(await reviewDay(18, true)).toEqual([]);
  await expect(page.locator('#summary')).toContainText('1 learnt for good.');

  // Checkpoint misses join too, and a round takes at most 8, oldest first.
  await page.click('#summary [data-action=quit]');
  await page.locator('.unit[data-unit=values] [data-action=checkpoint]').click();
  while(!(await page.locator('#summary').count())) await answer(page, false);
  save = await learnSave(page);
  expect(save.review.length).toBe(8);
  expect(save.review.every(r => r.lesson === null && r.due === 19)).toBe(true);
  // A question that's since been reworded or removed is dropped from the round.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('debuggit-learn-save'));
    s.review.push({ lang: 'python', unit: 'values', lesson: 'print', q: 'a question that no longer exists', box: 0, due: 10 });
    localStorage.setItem('debuggit-learn-save', JSON.stringify(s));
  });
  await openAt(page, 'learn/', 19);
  await expect(page.locator('#reviewDue')).toContainText('8 questions you missed before');
  await expect(page.locator('#reviewBtn')).toHaveText('Review 8 →');
});

test('lessons play from the keyboard, and the summary celebrates stars, level-ups and the streak', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('debuggit-learn-save', JSON.stringify({ xp: { python: 95 } })));
  await page.reload();
  await page.locator('#continue button').click();
  // 1–9 pick an option (in the order shown) or a line of code; Enter continues.
  while(!(await page.locator('#summary').count())){
    const s = await current(page);
    if(s.type === 'choice' || s.type === 'blank'){
      const texts = await page.locator('#step .option').evaluateAll(els => els.map(e => e.dataset.text));
      await expect(page.locator('#step .option .key').first()).toHaveText('1');
      await page.keyboard.press(String(texts.indexOf(s.options.find(o => o.correct).text) + 1));
    }else if(s.type === 'line'){
      await page.keyboard.press(String(s.line));
    }else if(s.type === 'predict'){
      await page.fill('#answer', s.display);
      await page.keyboard.press('Enter');
    }
    if(s.type !== 'teach'){
      await expect(page.locator('#stepFeedback')).toHaveClass(/correct/);
      await expect(page.locator('#stepFeedback .fb-mascot')).toBeVisible();
    }
    await page.locator('body').click({ position: { x: 2, y: 2 } });  // Enter works wherever the focus is
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#summary .big-stars')).toHaveText('★★★');
  await expect(page.locator('#levelUp')).toHaveText('Level up! Python · Learn Lv 2');
  await expect(page.locator('#streakUp')).toHaveText('Learn streak: 1 day, +1 today');
  await expect(page.locator('#learnLevel')).toHaveText('2');
  // The next lesson is one Enter away.
  await page.keyboard.press('Enter');
  await expect(page.locator('h1')).toHaveText('Numbers and arithmetic');
  // The progress bar slides on as steps are done.
  await page.keyboard.press('Enter');
  await expect.poll(() => page.locator('#progressFill').evaluate(e => e.style.width)).not.toBe('0%');
  // A second lesson the same day: no level-up, and the streak is already counted.
  await finishAll(page);
  await expect(page.locator('#levelUp')).toHaveCount(0);
  await expect(page.locator('#streakUp')).toHaveCount(0);
  await expect(page.locator('#summary .streak-line')).toHaveText('Learn streak: 1');
});

test('steps with code link to the sandbox to run it yourself, in a new tab', async ({ page }) => {
  await page.locator('#continue button').click();
  let s = await current(page);
  while(!s.code) s = (await answer(page, true), await current(page));
  const link = s.type === 'teach' ? page.locator('#step .run-link') : null;
  if(link){
    await expect(link).toHaveText('Run it yourself ↗');
    await expect(link).toHaveAttribute('target', '_blank');
    expect(decodeURIComponent((await link.getAttribute('href')).split('code=')[1])).toBe(s.code);
  }
  // Questions show it once answered, in the feedback.
  while((s = await current(page)).type === 'teach' || !s.code) await answer(page, true);
  await expect(page.locator('#step .run-link')).toHaveCount(0);
  if(s.type === 'predict'){ await page.fill('#answer', s.display); await page.click('#checkBtn'); }
  else if(s.type === 'line') await page.click('#step .code-line[data-line="' + s.line + '"]');
  else await pickOption(page, s.options.find(o => o.correct).text);
  await expect(page.locator('#stepFeedback .run-link')).toHaveAttribute('href', /^sandbox\.html\?lang=python&code=/);
});

test('a long line of code scrolls sideways instead of being cut off', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.locator('#continue button').click();
  const pre = page.locator('#step pre.editor');
  await expect(pre).toBeVisible();
  await pre.locator('code').evaluate(c => c.lastChild.after('  # ' + 'a long comment that runs well past the edge '.repeat(3) + 'END'));
  const box = await pre.evaluate(p => ({ overflow: getComputedStyle(p).overflowX, scroll: p.scrollWidth, client: p.clientWidth }));
  expect(box.overflow).toBe('auto');
  expect(box.scroll).toBeGreaterThan(box.client);
});

test('C is a coming-soon tab with its planned units', async ({ page }) => {
  const tabs = page.locator('#langs .lang-tab');
  await expect(tabs).toHaveCount(2);
  await expect(tabs.nth(0)).toHaveAttribute('aria-current', 'page');
  await expect(tabs.nth(1)).toContainText('C');
  await expect(tabs.nth(1).locator('.soon-badge')).toHaveText('soon');
  await tabs.nth(1).click();
  await expect(page.locator('h1')).toHaveText('Learn C');
  await expect(page.locator('#sub')).toContainText('coming soon');
  await expect(page.locator('.lesson-row')).toHaveCount(0);
  await expect(page.locator('.unit.planned').first()).toContainText('Values and printf');
  // Embedded C is a section of the C course, with its own heading and units.
  const section = page.locator('.course-section[data-section=embedded]');
  await expect(section.locator('h2')).toHaveText('Embedded C');
  await expect(page.locator('.course-section + .unit.planned')).toContainText('Unit 8');
  await expect(page.locator('.course-section + .unit.planned')).toContainText('Fixed-width types');
  await expect(page.locator('.unit.planned')).toHaveCount(17);
  await tabs.nth(0).click();
  await expect(page.locator('h1')).toHaveText('Learn Python');
});

test('Unit 2, Strings, opens once Unit 1’s checkpoint is passed', async ({ page }) => {
  const strings = page.locator('.unit[data-unit=strings]');
  await expect(strings.locator('h2')).toHaveText('Strings');
  await expect(strings).toHaveClass(/locked/);
  await expect(strings).toContainText('Pass Unit 1’s checkpoint to unlock.');
  // Test out of Unit 1.
  await page.click('[data-action=checkpoint][data-unit=values]');
  await finishAll(page);
  await page.click('#summary [data-action=quit]');
  await expect(strings).not.toHaveClass(/locked/);
  const rows = strings.locator('.lesson-row');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('Characters and length');
  // Its first lesson, perfectly, then its checkpoint.
  await page.click('[data-action=lesson][data-lesson=indexing]');
  await finishAll(page);
  await expect(page.locator('#summary .big-stars')).toHaveText('★★★');
  await page.click('#summary [data-action=quit]');
  await expect(rows.nth(1)).toBeEnabled();
  await page.click('[data-action=checkpoint][data-unit=strings]');
  await finishAll(page);
  await expect(page.locator('#summary h2')).toHaveText('Checkpoint passed!');
  expect(await learnSave(page)).toMatchObject({
    lessons: { 'python/strings/indexing': { stars: 3 } },
    checkpoints: { 'python/values': { passed: true }, 'python/strings': { passed: true, best: 8 } },
    xp: { python: 30 + 25 + 30 }
  });
});

test('Unit 3, Lists, opens once Unit 2’s checkpoint is passed', async ({ page }) => {
  const lists = page.locator('.unit[data-unit=lists]');
  await expect(lists.locator('h2')).toHaveText('Lists');
  await expect(lists.locator('.unit-num')).toHaveText('Unit 3');
  await expect(lists).toHaveClass(/locked/);
  // Test out of Units 1 and 2.
  for(const unit of ['values', 'strings']){
    await page.click('[data-action=checkpoint][data-unit=' + unit + ']');
    await finishAll(page);
    await page.click('#summary [data-action=quit]');
  }
  await expect(lists).not.toHaveClass(/locked/);
  const rows = lists.locator('.lesson-row');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('Making a list');
  await expect(rows.nth(3)).toContainText('Sorting and summing');
  await page.click('[data-action=lesson][data-lesson=making]');
  await finishAll(page);
  await expect(page.locator('#summary .big-stars')).toHaveText('★★★');
  await page.click('#summary [data-action=quit]');
  await page.click('[data-action=checkpoint][data-unit=lists]');
  await finishAll(page);
  await expect(page.locator('#summary h2')).toHaveText('Checkpoint passed!');
  expect(await learnSave(page)).toMatchObject({
    lessons: { 'python/lists/making': { stars: 3 } },
    checkpoints: { 'python/lists': { passed: true, best: 8 } }
  });
  // A link from a missed puzzle can pick it out.
  await page.goto('learn/#python/lists');
  await expect(lists).toHaveClass(/focus/);
});

test('Unit 4, Conditions, opens once Unit 3’s checkpoint is passed', async ({ page }) => {
  const unit = page.locator('.unit[data-unit=conditions]');
  await expect(unit.locator('h2')).toHaveText('Conditions');
  await expect(unit.locator('.unit-num')).toHaveText('Unit 4');
  await expect(unit).toHaveClass(/locked/);
  for(const id of ['values', 'strings', 'lists']){
    await page.click('[data-action=checkpoint][data-unit=' + id + ']');
    await finishAll(page);
    await page.click('#summary [data-action=quit]');
  }
  await expect(unit).not.toHaveClass(/locked/);
  const rows = unit.locator('.lesson-row');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('True or false');
  await expect(rows.nth(3)).toContainText('and, or, not');
  await page.click('[data-action=lesson][data-lesson=comparing]');
  await finishAll(page);
  await expect(page.locator('#summary .big-stars')).toHaveText('★★★');
  await page.click('#summary [data-action=quit]');
  await page.click('[data-action=checkpoint][data-unit=conditions]');
  await finishAll(page);
  await expect(page.locator('#summary h2')).toHaveText('Checkpoint passed!');
  expect(await learnSave(page)).toMatchObject({
    lessons: { 'python/conditions/comparing': { stars: 3 } },
    checkpoints: { 'python/conditions': { passed: true, best: 8 } }
  });
});

test('Unit 5, Loops, opens once Unit 4’s checkpoint is passed', async ({ page }) => {
  const unit = page.locator('.unit[data-unit=loops]');
  await expect(unit.locator('h2')).toHaveText('Loops');
  await expect(unit.locator('.unit-num')).toHaveText('Unit 5');
  await expect(unit).toHaveClass(/locked/);
  for(const id of ['values', 'strings', 'lists', 'conditions']){
    await page.click('[data-action=checkpoint][data-unit=' + id + ']');
    await finishAll(page);
    await page.click('#summary [data-action=quit]');
  }
  await expect(unit).not.toHaveClass(/locked/);
  const rows = unit.locator('.lesson-row');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('Going through a list');
  await expect(rows.nth(3)).toContainText('Stopping early, building lists');
  await page.click('[data-action=lesson][data-lesson=for]');
  await finishAll(page);
  await expect(page.locator('#summary .big-stars')).toHaveText('★★★');
  await page.click('#summary [data-action=quit]');
  await page.click('[data-action=checkpoint][data-unit=loops]');
  await finishAll(page);
  await expect(page.locator('#summary h2')).toHaveText('Checkpoint passed!');
  expect(await learnSave(page)).toMatchObject({
    lessons: { 'python/loops/for': { stars: 3 } },
    checkpoints: { 'python/loops': { passed: true, best: 8 } }
  });
});

test('Unit 6, Functions, opens once Unit 5’s checkpoint is passed', async ({ page }) => {
  const unit = page.locator('.unit[data-unit=functions]');
  await expect(unit.locator('h2')).toHaveText('Functions');
  await expect(unit.locator('.unit-num')).toHaveText('Unit 6');
  await expect(unit).toHaveClass(/locked/);
  for(const id of ['values', 'strings', 'lists', 'conditions', 'loops']){
    await page.click('[data-action=checkpoint][data-unit=' + id + ']');
    await finishAll(page);
    await page.click('#summary [data-action=quit]');
  }
  await expect(unit).not.toHaveClass(/locked/);
  const rows = unit.locator('.lesson-row');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('Making a function');
  await expect(rows.nth(3)).toContainText('Inside and outside');
  await page.click('[data-action=lesson][data-lesson=def]');
  await finishAll(page);
  await expect(page.locator('#summary .big-stars')).toHaveText('★★★');
  await page.click('#summary [data-action=quit]');
  await page.click('[data-action=checkpoint][data-unit=functions]');
  await finishAll(page);
  await expect(page.locator('#summary h2')).toHaveText('Checkpoint passed!');
  expect(await learnSave(page)).toMatchObject({
    lessons: { 'python/functions/def': { stars: 3 } },
    checkpoints: { 'python/functions': { passed: true, best: 8 } }
  });
});

test('Unit 7, Dictionaries, opens once Unit 6’s checkpoint is passed', async ({ page }) => {
  const unit = page.locator('.unit[data-unit=dictionaries]');
  await expect(unit.locator('h2')).toHaveText('Dictionaries');
  await expect(unit.locator('.unit-num')).toHaveText('Unit 7');
  await expect(unit).toHaveClass(/locked/);
  for(const id of ['values', 'strings', 'lists', 'conditions', 'loops', 'functions']){
    await page.click('[data-action=checkpoint][data-unit=' + id + ']');
    await finishAll(page);
    await page.click('#summary [data-action=quit]');
  }
  await expect(unit).not.toHaveClass(/locked/);
  const rows = unit.locator('.lesson-row');
  await expect(rows).toHaveCount(6);
  await expect(rows.nth(0)).toContainText('Keys and values');
  await expect(rows.nth(3)).toContainText('Looping over a dictionary');
  await expect(rows.nth(4)).toContainText('Nesting and converting');
  await page.click('[data-action=lesson][data-lesson=make]');
  await finishAll(page);
  await expect(page.locator('#summary .big-stars')).toHaveText('★★★');
  await page.click('#summary [data-action=quit]');
  await page.click('[data-action=checkpoint][data-unit=dictionaries]');
  await finishAll(page);
  await expect(page.locator('#summary h2')).toHaveText('Checkpoint passed!');
  expect(await learnSave(page)).toMatchObject({
    lessons: { 'python/dictionaries/make': { stars: 3 } },
    checkpoints: { 'python/dictionaries': { passed: true, best: 8 } }
  });
});

test('a perfect lesson earns 3 stars and Learn XP, and opens the next lesson', async ({ page }) => {
  await page.click('[data-action=lesson][data-lesson=print]');
  await finishAll(page);
  await expect(page.locator('#summary .big-stars')).toHaveText('★★★');
  await expect(page.locator('#summary')).toContainText('+25 XP');
  await expect(page.locator('#learnStreak')).toHaveText('1');
  expect(await learnSave(page)).toMatchObject({ lessons: { 'python/values/print': { stars: 3 } }, xp: { python: 25 } });
  // Learn keeps its own XP and streak: the daily puzzles' are untouched.
  expect(await readJson(page, 'debugg-xp')).toBeNull();
  expect(await readJson(page, 'debugg-streak')).toBeNull();

  await page.click('#summary [data-action=quit]');
  await expect(page.locator('.lesson-row').nth(0)).toContainText('★★★');
  await expect(page.locator('.lesson-row').nth(1)).toBeEnabled();

  // Replaying it doesn't pay again.
  await page.click('[data-action=lesson][data-lesson=print]');
  await finishAll(page);
  await expect(page.locator('#summary')).toContainText('+0 XP');
  expect((await learnSave(page)).xp.python).toBe(25);
});

test('a wrong answer is explained and comes back before the lesson ends', async ({ page }) => {
  await page.click('[data-action=lesson][data-lesson=print]');
  await answer(page);                    // the first teach step
  const missed = await answer(page, false);
  const later = [];
  while(!(await page.locator('#summary').count())) later.push(await answer(page));
  // It's asked again, last: the lesson only ends once every question has been answered right.
  expect(later[later.length - 1]).toEqual(missed);
  expect(later.filter(s => s.type !== 'teach')).toHaveLength(5);
  await expect(page.locator('#summary .big-stars')).toHaveText('★★☆');
  await expect(page.locator('#summary')).toContainText('1 mistake, all put right');
  expect((await learnSave(page)).lessons['python/values/print']).toEqual({ stars: 2 });
  // 10 for the lesson and 5 per star.
  expect((await learnSave(page)).xp.python).toBe(20);
});

test('the wrong answer shows why it is wrong and what the right one is', async ({ page }) => {
  await page.click('[data-action=lesson][data-lesson=print]');
  await page.click('#continueBtn');
  await pickOption(page, '"Ready"');
  await expect(page.locator('#stepFeedback')).toContainText('The quotes only mark where the string starts and ends');
  await expect(page.locator('#stepFeedback')).toContainText('The answer is Ready');
  await expect(page.locator('#stepFeedback')).toContainText('comes back before the end of the lesson');
  await expect(page.locator('#step .option.wrong')).toHaveCount(1);
  await expect(page.locator('#step .option.right')).toHaveCount(1);
});

test('passing the checkpoint tests out of the unit; failing it can be retried', async ({ page }) => {
  // 6 of 8 isn't enough.
  await page.click('[data-action=checkpoint][data-unit=values]');
  let wrong = 2;
  while(!(await page.locator('#summary').count())) await answer(page, !(wrong-- > 0));
  await expect(page.locator('#summary .big-score')).toHaveText('6/8');
  await expect(page.locator('#summary h2')).toHaveText('Not this time');
  expect(await learnSave(page)).toMatchObject({ checkpoints: {}, xp: {} });

  // 7 of 8 passes, pays 30 XP and opens every lesson in the unit.
  await page.click('#summary [data-action=checkpoint]');
  wrong = 1;
  while(!(await page.locator('#summary').count())) await answer(page, !(wrong-- > 0));
  await expect(page.locator('#summary h2')).toHaveText('Checkpoint passed!');
  await expect(page.locator('#summary')).toContainText('+30 XP');
  expect(await learnSave(page)).toMatchObject({ checkpoints: { 'python/values': { passed: true, best: 7 } }, xp: { python: 30 } });
  await page.click('#summary [data-action=quit]');
  await expect(page.locator('.unit[data-unit=values]')).toHaveClass(/passed/);
  for(let i = 0; i < 3; i++) await expect(page.locator('.lesson-row').nth(i)).toBeEnabled();
  await expect(page.locator('.unit[data-unit=values] .lesson-row.checkpoint')).toContainText('7/8');
});

test('the Learn streak counts days with a lesson finished', async ({ page }) => {
  const lessonOn = async (day, id) => {
    await page.clock.setFixedTime(dayDate(day));
    await page.reload();
    await page.click('[data-action=lesson][data-lesson=' + id + ']');
    await finishAll(page);
  };
  await lessonOn(3, 'print');
  await expect(page.locator('#learnStreak')).toHaveText('1');
  await lessonOn(4, 'numbers');
  await expect(page.locator('#learnStreak')).toHaveText('2');
  // A day with no lesson breaks it.
  await page.clock.setFixedTime(dayDate(6));
  await page.reload();
  await expect(page.locator('#learnStreak')).toHaveText('0');
  await lessonOn(6, 'variables');
  await expect(page.locator('#learnStreak')).toHaveText('1');
});

test('the daily page links to Learn, and resetting puzzles keeps Learn progress', async ({ page }) => {
  await page.click('[data-action=lesson][data-lesson=print]');
  await finishAll(page);
  // Learn's page has the same three top buttons, with Learn the current one.
  await expect(page.locator('.modes a')).toHaveText(['debuggit.learn()', 'debuggit.daily() (demo)', 'debuggit.ltd() (demo)']);
  await expect(page.locator('#learnTab')).toHaveAttribute('aria-current', 'page');
  await page.click('#dailyTab');
  await expect(page.locator('h1')).toHaveText('What does this print?');
  await expect(page.locator('.modes a')).toHaveText(['debuggit.learn()', 'debuggit.daily() (demo)', 'debuggit.ltd() (demo)']);
  await page.click('#resetLink');
  await page.click('#learnTab');
  await expect(page.locator('h1')).toHaveText('Learn Python');
  await expect(page.locator('.lesson-row').nth(0)).toContainText('★★★');
});

test('learn.html, the old address, redirects to learn/ and keeps the course', async ({ page }) => {
  await page.goto('learn.html#c');
  await expect(page).toHaveURL(/\/learn\/#c$/);
  await expect(page.locator('h1')).toHaveText('Learn C');
});

test('a unit link opens the course with that unit picked out', async ({ page }) => {
  await page.goto('learn/#python/strings');
  await expect(page.locator('h1')).toHaveText('Learn Python');
  await expect(page.locator('.unit[data-unit=strings]')).toHaveClass(/focus/);
  await expect(page.locator('.unit[data-unit=values]')).not.toHaveClass(/focus/);
  // The summary kiwi loads from the site's img/ folder.
  await page.click('[data-action=lesson][data-lesson=print]');
  await finishAll(page);
  expect(await page.locator('.summary-mascot').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
});

test('pressing Enter on a wrong typed answer shows why, and waits for Continue', async ({ page }) => {
  // Regression: Enter used to check the answer and also press the Continue button that took the
  // focus, so the explanation flashed past and the lesson jumped ahead.
  await page.click('[data-action=lesson][data-lesson=print]');
  while((await current(page)).type !== 'predict') await answer(page);
  const predict = await current(page);
  await page.fill('#answer', 'definitely not it');
  await page.keyboard.press('Enter');
  await expect(page.locator('#stepFeedback')).toHaveClass(/wrong/);
  await expect(page.locator('#stepFeedback')).toContainText('It prints ' + predict.display);
  await expect(page.locator('#continueBtn')).toBeVisible();
  expect(await current(page)).toEqual(predict);
  // Enter again (on the focused Continue button) moves on, once.
  await page.keyboard.press('Enter');
  await expect(page.locator('#stepFeedback')).toHaveCount(0);
  expect(await current(page)).not.toEqual(predict);

  // A right answer by Enter behaves the same way.
  while((await current(page)).type !== 'predict') await answer(page);
  await page.fill('#answer', (await current(page)).display);
  await page.keyboard.press('Enter');
  await expect(page.locator('#stepFeedback')).toHaveClass(/correct/);
  await expect(page.locator('#continueBtn')).toBeVisible();
});

test('a lesson in progress carries on after a trip to the sandbox and back', async ({ page }) => {
  await page.click('[data-action=lesson][data-lesson=print]');
  await answer(page);                    // the first teach step
  const missed = await answer(page, false);
  await answer(page);
  const onScreen = await current(page);
  const progress = await page.locator('.progress-num').textContent();
  // Off to the sandbox, then its "← Debuggit Learn" link back.
  await page.goto('learn/sandbox.html');
  await page.click('#backLink');
  await expect(page.locator('h1')).toHaveText('print() and text');
  expect(await current(page)).toEqual(onScreen);
  await expect(page.locator('.progress-num')).toHaveText(progress);
  // An answered question moves on after a reload, as Continue would.
  const s = await current(page);
  if(s.type !== 'teach'){
    await pickOrType(page, s);
    await page.reload();
    expect(await current(page)).not.toEqual(s);
  }
  // The miss still counts, and still comes back before the end.
  const later = [];
  while(!(await page.locator('#summary').count())) later.push(await answer(page));
  expect(later[later.length - 1]).toEqual(missed);
  await expect(page.locator('#summary .big-stars')).toHaveText('★★☆');
  expect(await page.evaluate(() => localStorage.getItem('debuggit-learn-session'))).toBeNull();
  // Once it's over, a reload shows the course.
  await page.reload();
  await expect(page.locator('#continue')).toBeVisible();
});

test('leaving a lesson for the course, or following a unit link, drops it', async ({ page }) => {
  await page.click('[data-action=lesson][data-lesson=print]');
  await answer(page);
  await page.click('[data-action=quit]');
  await page.reload();
  await expect(page.locator('#continue')).toBeVisible();
  await page.click('[data-action=lesson][data-lesson=print]');
  await answer(page);
  await page.goto('learn/#python/strings');
  await page.reload();
  await expect(page.locator('.unit.focus')).toHaveAttribute('data-unit', 'strings');
  expect(await page.evaluate(() => localStorage.getItem('debuggit-learn-session'))).toBeNull();
});

test('a review round in progress carries on after a reload', async ({ page }) => {
  await page.click('[data-action=lesson][data-lesson=print]');
  let missed = null;
  while(!(await page.locator('#summary').count())){
    const s = await current(page);
    if(!missed && s.type !== 'teach') missed = await answer(page, false);
    else await answer(page, true);
  }
  await openAt(page, 'learn/', 4);
  await page.click('#reviewBtn');
  await answer(page, false);
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Review');
  expect((await current(page)).question).toBe(missed.question);
  await answer(page, true);
  await expect(page.locator('#summary .big-score')).toHaveText('0/1');
  expect((await learnSave(page)).review).toMatchObject([{ box: 0, due: 5 }]);
});

// Answers the question on screen right, without continuing.
async function pickOrType(page, s){
  if(s.type === 'predict'){ await page.fill('#answer', s.display); await page.click('#checkBtn'); }
  else if(s.type === 'line') await page.click('#step .code-line[data-line="' + s.line + '"]');
  else await pickOption(page, s.options.find(o => o.correct).text);
  await expect(page.locator('#stepFeedback')).toHaveClass(/correct/);
}

test('a repeated checkpoint draws a different set from the unit\'s pool', async ({ page }) => {
  const asked = async () => page.evaluate(() => JSON.parse(localStorage.getItem('debuggit-learn-session')).qs);
  await page.click('[data-action=checkpoint][data-unit=values]');
  const first = await asked();
  expect(first).toHaveLength(8);
  expect(new Set(first).size).toBe(8);
  // Quit the attempt, then start again: the 8 questions not yet asked come first.
  await page.evaluate(() => localStorage.removeItem('debuggit-learn-session'));
  await openAt(page, 'learn/');
  await page.click('[data-action=checkpoint][data-unit=values]');
  const second = await asked();
  expect(second).toHaveLength(8);
  expect(second.filter(h => first.includes(h))).toHaveLength(0);
  const counts = await page.evaluate(() => JSON.parse(localStorage.getItem('debuggit-learn-save')).asked['python/values']);
  expect(Object.keys(counts)).toHaveLength(16);
  expect(Object.values(counts).every(n => n === 1)).toBe(true);
  // Reloading mid-attempt keeps the same questions.
  await page.reload();
  expect(await asked()).toEqual(second);
  await expect(page.locator('#step')).toBeVisible();
});

test('a passed unit offers practice: wrong answers come back until right, and join the review queue', async ({ page }) => {
  // Not offered until the checkpoint is passed.
  await expect(page.locator('.lesson-row.practice')).toHaveCount(0);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('debuggit-learn-save') || '{}');
    s.checkpoints = { 'python/values': { passed: true, best: 8 } };
    localStorage.setItem('debuggit-learn-save', JSON.stringify(s));
  });
  await openAt(page, 'learn/');
  const row = page.locator('.unit[data-unit=values] .lesson-row.practice');
  await expect(row).toContainText('Practice · 8 questions');
  await row.click();
  await expect(page.locator('#title')).toHaveText('Practice');
  // Miss the first question: 8 questions plus 1 coming back is 9 answers in all.
  let answered = 0;
  await answer(page, false); answered++;
  while(!(await page.locator('#summary').count())){ await answer(page, true); answered++; }
  expect(answered).toBe(9);
  await expect(page.locator('#summary h2')).toHaveText('Practice done');
  const save = await learnSave(page);
  expect(save.review).toHaveLength(1);
  // 7 of the 8 were right first time, at 2 XP each, like a review.
  expect(save.xp.python).toBe(14);
  await expect(page.locator('#summary')).toContainText('+14 XP');
  // Practice again draws a different set from the pool of 24.
  await page.click('#summary [data-action=practice]');
  await expect(page.locator('#title')).toHaveText('Practice');
  const counts = (await learnSave(page)).asked['python/values'];
  expect(Object.keys(counts)).toHaveLength(16);
});

test('mixed practice draws across the passed units, and a reload keeps the set', async ({ page }) => {
  await expect(page.locator('#mixedPractice')).toHaveCount(0);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('debuggit-learn-save') || '{}');
    s.checkpoints = { 'python/values': { passed: true, best: 8 }, 'python/strings': { passed: true, best: 8 } };
    localStorage.setItem('debuggit-learn-save', JSON.stringify(s));
  });
  await openAt(page, 'learn/');
  await expect(page.locator('#mixedPractice')).toContainText('10 questions from the 2 units');
  await page.click('#mixedBtn');
  await expect(page.locator('#title')).toHaveText('Mixed practice');
  const qs = await page.evaluate(() => JSON.parse(localStorage.getItem('debuggit-learn-session')).qs);
  expect(qs).toHaveLength(10);
  // Five from each unit, turn and turn about.
  expect(qs.filter(q => q.startsWith('values:'))).toHaveLength(5);
  expect(qs.filter(q => q.startsWith('strings:'))).toHaveLength(5);
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('debuggit-learn-session')).qs)).toEqual(qs);
  await expect(page.locator('#title')).toHaveText('Mixed practice');
  // A miss comes back before the end and joins the review queue.
  let answered = 0;
  await answer(page, false); answered++;
  while(!(await page.locator('#summary').count())){ await answer(page, true); answered++; }
  expect(answered).toBe(11);
  await expect(page.locator('#summary h2')).toHaveText('Mixed practice done');
  expect((await learnSave(page)).review).toHaveLength(1);
});

test('units fold away, Collapse all / Expand all work, and the choice is remembered', async ({ page }) => {
  // With one open unit there is nothing to fold all of.
  await expect(page.locator('#foldAll')).toHaveCount(0);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('debuggit-learn-save') || '{}');
    s.checkpoints = { 'python/values': { passed: true, best: 8 }, 'python/strings': { passed: true, best: 8 } };
    localStorage.setItem('debuggit-learn-save', JSON.stringify(s));
  });
  await openAt(page, 'learn/');
  const values = page.locator('.unit[data-unit=values]');
  const strings = page.locator('.unit[data-unit=strings]');
  await expect(values.locator('.lessons')).toBeVisible();
  await values.locator('.unit-toggle').click();
  await expect(values).toHaveClass(/collapsed/);
  await expect(values.locator('.unit-toggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(values.locator('.lessons')).toBeHidden();
  await expect(values.locator('h2')).toBeVisible();
  await expect(strings.locator('.lessons')).toBeVisible();
  // Collapse all folds the rest; the button then offers Expand all.
  await expect(page.locator('#foldAll')).toHaveText('Collapse all');
  await page.click('#foldAll');
  await expect(strings).toHaveClass(/collapsed/);
  await expect(page.locator('.unit.locked.collapsed')).toHaveCount(0);
  await expect(page.locator('#foldAll')).toHaveText('Expand all');
  // It is remembered across a reload.
  await page.reload();
  await expect(values).toHaveClass(/collapsed/);
  await expect(page.locator('#foldAll')).toHaveText('Expand all');
  await page.click('#foldAll');
  await expect(values).not.toHaveClass(/collapsed/);
  await expect(strings).not.toHaveClass(/collapsed/);
  await expect(page.locator('#foldAll')).toHaveText('Collapse all');
  // A link to a folded unit opens it.
  await strings.locator('.unit-toggle').click();
  await page.goto('learn/#python/strings');
  await page.reload();
  await expect(strings).not.toHaveClass(/collapsed/);
});
