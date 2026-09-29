// Versions and releases: the footer's version link, What's new, and tools/release.js (on a copy).
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { openAt, fresh, guess, puzzleFor } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const APP_VERSION = /const APP_VERSION = '([^']+)';/.exec(fs.readFileSync(path.join(ROOT, 'shared.js'), 'utf8'))[1];

test('every page shows the version, linking to What’s new', async ({ page }) => {
  await openAt(page, 'index.html');
  await fresh(page);
  for(const p of ['index.html', 'learn/', 'sandbox.html', 'privacy.html', 'whatsnew.html']){
    await page.goto(p);
    await expect(page.locator('#appVersion .version-link'), p).toHaveText('v' + APP_VERSION + ' demo');
    await expect(page.locator('#appVersion .version-link'), p).toHaveAttribute('href', p === 'learn/' ? '../whatsnew.html' : 'whatsnew.html');
  }
});

test('What’s new shows the changelog, and a returning player sees "new" until they look', async ({ page }) => {
  await openAt(page, 'index.html#python');
  await fresh(page);
  // A first visit isn't told about "new" versions.
  await expect(page.locator('.version-link')).not.toHaveClass(/new/);
  await guess(page, (await puzzleFor(page, 3)).display);
  // A returning player who last saw an older version is.
  await page.evaluate(() => localStorage.setItem('debugg-seen-version', '0.0.0'));
  await page.reload();
  await expect(page.locator('.version-link')).toHaveClass(/new/);
  await expect(page.locator('.version-link')).toHaveText('v' + APP_VERSION + ' demo · new');
  await page.click('.version-link');
  await expect(page.locator('h1')).toHaveText('What’s new');
  await expect(page.locator('#notes h2').first()).toContainText(APP_VERSION);
  await expect(page.locator('#notes h2').first().locator('.current')).toHaveText('you’re here');
  await expect(page.locator('#notes')).not.toContainText('Unreleased');
  // Markdown becomes headings, lists and bold text (the notes' sections come from CHANGELOG.md).
  await expect(page.locator('#notes h3').first()).toHaveText(/\S/);
  await expect(page.locator('#notes li').first()).toHaveText(/\S/);
  await expect(page.locator('#notes b').first()).toHaveText(/\S/);
  await expect(page.locator('#notes')).toContainText('Share your result');
  await page.goto('index.html');
  await expect(page.locator('.version-link')).not.toHaveClass(/new/);
});

test('tools/release.js dates the unreleased notes and bumps the version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'debugg-release-'));
  fs.mkdirSync(path.join(dir, 'tools'));
  for(const f of ['shared.js', 'CHANGELOG.md', 'tools/release.js']) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  const run = (...args) => execFileSync('node', [path.join(dir, 'tools/release.js'), ...args], { encoding: 'utf8', stdio: 'pipe' });
  const fails = (...args) => { try{ run(...args); }catch(e){ return e.stderr; } throw new Error('expected a failure'); };

  const [a, b, c] = APP_VERSION.split('.').map(Number);
  const next = a + '.' + b + '.' + (c + 1);
  expect(fails('bump', APP_VERSION)).toContain('isn\'t newer');
  // Whatever's waiting in the real changelog, the copy starts with nothing unreleased.
  const log = path.join(dir, 'CHANGELOG.md');
  const setUnreleased = text => fs.writeFileSync(log, fs.readFileSync(log, 'utf8').replace(/## Unreleased\n[\s\S]*?(?=\n## )/, '## Unreleased\n\n' + text + '\n'));
  setUnreleased('Nothing yet.');
  expect(fails('bump', next)).toContain('nothing under "## Unreleased"');

  setUnreleased('- Spot the bug puzzles.');
  run('bump', next, '2026-10-12');
  const md = fs.readFileSync(log, 'utf8');
  expect(md).toContain('## Unreleased\n\nNothing yet.\n\n## ' + next + ' — 12 October 2026\n\n- Spot the bug puzzles.\n');
  expect(md).toContain('## ' + APP_VERSION + ' — ');
  expect(fs.readFileSync(path.join(dir, 'shared.js'), 'utf8')).toContain("const APP_VERSION = '" + next + "';");
  expect(run('check', next)).toContain('are at ' + next);
  expect(run('notes', next).trim()).toBe('- Spot the bug puzzles.');
  expect(fails('check', APP_VERSION)).toContain('shared.js is at ' + next);
});
