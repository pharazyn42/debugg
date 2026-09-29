// Versions and releases: the footer's version link, What's new, and tools/release.js (on a copy).
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { openAt, fresh, guess, puzzleFor } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SHARED = fs.readFileSync(path.join(ROOT, 'shared.js'), 'utf8');
const APP_VERSION = /const APP_VERSION = '([^']+)';/.exec(SHARED)[1];
const LEARN_VERSION = /const LEARN_VERSION = '([^']+)';/.exec(SHARED)[1];
const { check: checkScope } = require('../tools/check-scope');

test('every page shows its product’s version, linking to its What’s new', async ({ page }) => {
  await openAt(page, 'index.html');
  await fresh(page);
  for(const p of ['index.html', 'privacy.html', 'whatsnew.html']){
    await page.goto(p);
    await expect(page.locator('#appVersion .version-link'), p).toHaveText('v' + APP_VERSION + ' demo');
    await expect(page.locator('#appVersion .version-link'), p).toHaveAttribute('href', 'whatsnew.html');
  }
  // Debuggit Learn has its own version and What's new.
  for(const [p, href] of [['learn/', '../whatsnew.html?learn'], ['learn/sandbox.html', '../whatsnew.html?learn'], ['whatsnew.html?learn', 'whatsnew.html?learn']]){
    await page.goto(p);
    await expect(page.locator('#appVersion .version-link'), p).toHaveText('Learn v' + LEARN_VERSION + ' demo');
    await expect(page.locator('#appVersion .version-link'), p).toHaveAttribute('href', href);
  }
});

test('Learn’s What’s new lists only Learn, and its "new" is separate from the game’s', async ({ page }) => {
  await openAt(page, 'learn/');
  await fresh(page);
  await page.click('[data-action=lesson][data-lesson=print]');
  // A returning Learn player who last saw an older Learn version sees "new" on Learn only.
  await page.evaluate(() => { localStorage.setItem('debugg-seen-learn-version', '0.0.0'); localStorage.setItem('debugg-learn', '{}'); });
  await page.goto('learn/');
  await expect(page.locator('.version-link')).toHaveText('Learn v' + LEARN_VERSION + ' demo · new');
  await page.goto('index.html');
  await expect(page.locator('.version-link')).not.toHaveClass(/new/);
  await page.goto('learn/');
  await page.click('.version-link');
  await expect(page.locator('h1')).toHaveText('What’s new in Learn');
  await expect(page).toHaveTitle('What’s new in Debuggit Learn');
  await expect(page.locator('#notes h2').first()).toContainText(LEARN_VERSION);
  await expect(page.locator('#notes h2').first().locator('.current')).toHaveText('you’re here');
  await expect(page.locator('#notes')).toContainText('Strings');
  await expect(page.locator('#notes')).not.toContainText('Managers are in the demo');
  await expect(page.locator('#notes')).not.toContainText('Unreleased');
  await expect(page.locator('#backLink')).toHaveAttribute('href', 'learn/');
  await page.goto('learn/');
  await expect(page.locator('.version-link')).not.toHaveClass(/new/);
  // The game's What's new doesn't list Learn, and links to it.
  await page.goto('whatsnew.html');
  await expect(page.locator('#notes')).not.toContainText('Strings');
  await expect(page.locator('#notes a[href="whatsnew.html?learn"]')).toHaveText('its own list of changes');
});

test('tools/check-scope.js keeps a branch to Learn or the game, unless both changelogs move', () => {
  expect(checkScope(['learn/learn.js', 'learn/python/03-lists.js', 'shared.js']).ok).toBe(true);
  expect(checkScope(['ltd/ltd.js', 'index.html', 'CHANGELOG.md', 'CLAUDE.md']).ok).toBe(true);
  expect(checkScope(['CLAUDE.md', 'base.css']).ok).toBe(true);
  const mixed = checkScope(['ltd/ltd.js', 'learn/learn.js']);
  expect(mixed.ok).toBe(false);
  expect(mixed.message).toContain('Learn: learn/learn.js');
  expect(mixed.message).toContain('Game:  ltd/ltd.js');
  // Only one changelog isn't enough.
  expect(checkScope(['ltd/ltd.js', 'learn/learn.js', 'CHANGELOG.md']).ok).toBe(false);
  expect(checkScope(['ltd/ltd.js', 'learn/learn.js', 'CHANGELOG.md', 'learn/CHANGELOG.md']).ok).toBe(true);
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
  fs.mkdirSync(path.join(dir, 'learn'));
  for(const f of ['shared.js', 'CHANGELOG.md', 'learn/CHANGELOG.md', 'tools/release.js']) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
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
  expect(fails('check', APP_VERSION)).toContain('shared.js has APP_VERSION at ' + next);
  expect(run('tag', next).trim()).toBe('v' + next);
  expect(run('name', next).trim()).toBe('Debuggit v' + next);

  // Debuggit Learn is released separately: its own version and changelog, and learn- tags.
  const [la, lb, lc] = LEARN_VERSION.split('.').map(Number);
  const lnext = la + '.' + lb + '.' + (lc + 1);
  const llog = path.join(dir, 'learn/CHANGELOG.md');
  fs.writeFileSync(llog, fs.readFileSync(llog, 'utf8').replace(/## Unreleased\n[\s\S]*?(?=\n## )/, '## Unreleased\n\n- Unit 3, Lists.\n'));
  run('learn', 'bump', lnext, '2026-10-14');
  expect(fs.readFileSync(llog, 'utf8')).toContain('## ' + lnext + ' — 14 October 2026\n\n- Unit 3, Lists.\n');
  const shared = fs.readFileSync(path.join(dir, 'shared.js'), 'utf8');
  expect(shared).toContain("const LEARN_VERSION = '" + lnext + "';");
  expect(shared).toContain("const APP_VERSION = '" + next + "';");
  expect(run('learn', 'check', lnext)).toContain('learn/CHANGELOG.md are at ' + lnext);
  expect(run('learn', 'notes', lnext).trim()).toBe('- Unit 3, Lists.');
  expect(run('learn', 'tag', lnext).trim()).toBe('learn-v' + lnext);
  expect(run('learn', 'name', lnext).trim()).toBe('Debuggit Learn v' + lnext);
  // The game's notes and version are untouched by a Learn release.
  expect(run('check', next)).toContain('are at ' + next);
});
