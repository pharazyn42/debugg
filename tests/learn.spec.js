// Debugg Learn: the course map, lessons (with wrong answers coming back), checkpoints, and Learn's own
// XP and streak, kept apart from the daily puzzles.
const { test, expect } = require('@playwright/test');
const { dayDate, openAt, fresh, readJson } = require('./helpers');

const current = page => page.evaluate(() => window.DebuggLearn.current());
const learnSave = page => readJson(page, 'debugg-learn');

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
  await expect(page.locator('.unit.planned').first()).toContainText('Conditions');
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
    const s = JSON.parse(localStorage.getItem('debugg-learn'));
    s.lessons['python/values/numbers'] = { stars: 3 };
    s.lessons['python/values/variables'] = { stars: 2 };
    localStorage.setItem('debugg-learn', JSON.stringify(s));
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
    const s = JSON.parse(localStorage.getItem('debugg-learn'));
    s.checkpoints['python/strings'] = { passed: true, best: 8 };
    s.checkpoints['python/lists'] = { passed: true, best: 8 };
    localStorage.setItem('debugg-learn', JSON.stringify(s));
  });
  await page.reload();
  await expect(card.locator('.continue-label')).toHaveText('All caught up');
  await expect(card).toContainText('Next up: Conditions, coming soon.');
  await expect(card.locator('button')).toHaveCount(0);
  // A coming-soon course has no card.
  await page.goto('learn/#c');
  await expect(page.locator('h1')).toHaveText('Learn C');
  await expect(card).toHaveCount(0);
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
  await page.click('#gameLink');
  await expect(page.locator('h1')).toHaveText('What does this print?');
  // Learn isn't one of the game's tabs: it's linked from the footer.
  await expect(page.locator('.modes a')).toHaveText(['Daily', 'Ltd']);
  await page.click('#resetLink');
  await page.click('#learnFooter');
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
  // The summary duck loads from the site's img/ folder.
  await page.click('[data-action=lesson][data-lesson=print]');
  await finishAll(page);
  expect(await page.locator('.summary-duck').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
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
