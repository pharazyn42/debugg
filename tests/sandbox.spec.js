// The sandbox: running JavaScript and Python, the editor, and which puzzles it can load.
// Python needs Pyodide from the CDN, or a local copy via PYODIDE_DIR (see serve.js).
const { test, expect } = require('@playwright/test');
const { openAt, fresh, guess } = require('./helpers');

async function setCode(page, code){
  await page.evaluate(c => {
    const src = document.getElementById('src');
    src.value = c;
    src.dispatchEvent(new Event('input'));
  }, code);
}
async function run(page, timeout = 60000){
  await page.click('#runBtn');
  await expect(page.locator('#runBtn')).toBeEnabled({ timeout });
  return (await page.textContent('#out')).trim();
}
async function openSandbox(page, lang){
  await openAt(page, 'sandbox.html');
  await fresh(page);
  await page.click('.lang-tab:has-text("' + (lang === 'python' ? 'Python' : 'JavaScript') + '")');
}

test('JavaScript output is formatted like a console', async ({ page }) => {
  await openSandbox(page, 'javascript');
  await expect(page.locator('#filename')).toHaveText('main.js');
  expect(await run(page)).toBe('[1, 2, 3]');
  await setCode(page, `console.log("hi", 1, [1, 'a', [2]], {a: 1, 'b-c': "x"}, null, undefined, new Map([[1,2]]), new Set([1]), -0, 10n)
class User { constructor(){ this.name = "Ada"; } }
console.log(new User(), [ , 1], function foo(){})
console.error("boom")`);
  const out = await run(page);
  expect(out).toContain(`hi 1 [1, 'a', [2]] { a: 1, 'b-c': 'x' } null undefined Map(1) { 1 => 2 } Set(1) { 1 } -0 10n`);
  expect(out).toContain(`User { name: 'Ada' } [<1 empty item>, 1] [Function: foo]`);
  await expect(page.locator('#out .err')).toHaveText('boom\n');
});

test('JavaScript errors, async output and runaway loops', async ({ page }) => {
  await openSandbox(page, 'javascript');
  await setCode(page, 'const a = 1;\nnull.x;');
  expect(await run(page)).toMatch(/TypeError: .*\(line 2\)/);
  await setCode(page, 'const a = ;');
  expect(await run(page)).toContain('SyntaxError');
  await setCode(page, 'setTimeout(() => console.log("later"), 200); console.log("now")');
  await run(page);
  await expect(page.locator('#out')).toContainText('later');
  await setCode(page, 'while(true){}');
  await run(page, 10000);
  await expect(page.locator('#status')).toContainText('infinite loop');
  await setCode(page, 'console.log(typeof window, typeof document)');
  expect(await run(page)).toBe('undefined undefined');
});

test('every JavaScript puzzle prints its answer', async ({ page }) => {
  await openSandbox(page, 'javascript');
  const puzzles = await page.evaluate(() => window.Debugg.puzzlesFor('javascript'));
  for(const p of puzzles){
    await setCode(page, p.code);
    expect(await run(page), p.code).toBe(p.display);
  }
});

test.describe('Python', () => {
  test.describe.configure({ timeout: 180000 });

  test('runs, reports errors cleanly and stops runaway loops', async ({ page }) => {
    await openSandbox(page, 'python');
    expect(await run(page, 120000)).toBe('[1, 2, 3]');
    await setCode(page, 'x = 1\nprint(x / 0)');
    const err = await run(page);
    expect(err).toContain('File "main.py", line 2');
    expect(err).toContain('ZeroDivisionError');
    expect(err).not.toContain('_debugg_run');
    await setCode(page, 'print(x)');
    expect(await run(page)).toContain('NameError');
    await setCode(page, 'print("a", end="")');
    expect(await run(page)).toBe('a');
    await setCode(page, 'while True: pass');
    await run(page, 20000);
    await expect(page.locator('#status')).toContainText('infinite loop');
    await setCode(page, 'print("back")');
    expect(await run(page, 120000)).toBe('back');
  });

  test('every Python puzzle prints its answer', async ({ page }) => {
    await openSandbox(page, 'python');
    const puzzles = await page.evaluate(() => window.Debugg.puzzlesFor('python'));
    await run(page, 120000);
    for(const p of puzzles){
      await setCode(page, p.code);
      const lines = (await run(page)).split('\n');
      // The finally puzzle also prints Python 3.14's SyntaxWarning first.
      expect(lines[lines.length - 1], p.code).toBe(p.display);
    }
  });
});

test('the editor indents, undoes and runs with Ctrl+Enter', async ({ page }) => {
  await openSandbox(page, 'javascript');
  await page.click('.lang-tab:has-text("Python")');
  await setCode(page, '');
  await page.focus('#src');
  await page.keyboard.type('def f():');
  await page.keyboard.press('Enter');
  await page.keyboard.type('return 1');
  await expect(page.locator('#src')).toHaveValue('def f():\n    return 1');
  await page.keyboard.press('Control+z');
  await expect(page.locator('#src')).not.toHaveValue('def f():\n    return 1');

  await setCode(page, 'a\nb');
  await page.evaluate(() => document.getElementById('src').setSelectionRange(0, 3));
  await page.keyboard.press('Tab');
  await expect(page.locator('#src')).toHaveValue('    a\n    b');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#src')).toHaveValue('a\nb');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.id)).not.toBe('src');

  // Drafts are kept per language.
  await page.click('.lang-tab:has-text("JavaScript")');
  await setCode(page, 'console.log(42)');
  await page.focus('#src');
  await page.keyboard.press('Control+Enter');
  await expect(page.locator('#out')).toHaveText('42\n');
  await page.reload();
  await expect(page.locator('#src')).toHaveValue('console.log(42)');
});

test("today's puzzle only unlocks once it's finished", async ({ page }) => {
  await openAt(page, 'sandbox.html?lang=python&day=3');
  await fresh(page);
  await page.goto('sandbox.html?lang=python&day=3');
  await expect(page.locator('#note')).toContainText("isn't unlocked");
  // Earlier days are there to replay, but not today's.
  await expect(page.locator('#puzzlePick option', { hasText: 'Day 2' })).toHaveCount(1);
  await expect(page.locator('#puzzlePick option', { hasText: '(today)' })).toHaveCount(0);

  await page.goto('index.html#python');
  await guess(page, '[1, 2]');
  await page.click('#tryLink');
  await expect(page).toHaveURL(/sandbox/);
  await expect(page.locator('#src')).toHaveValue(/add_item/);
  await expect(page.locator('#note')).toContainText('[1, 2]');
  await expect(page.locator('#puzzlePick option', { hasText: 'Day 3 (today)' })).toHaveCount(1);
});
