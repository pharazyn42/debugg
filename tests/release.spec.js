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
const LTD_VERSION = /const LTD_VERSION = '([^']+)';/.exec(SHARED)[1];
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
  // Debuggit Ltd has its own, on its page.
  for(const [p, href] of [['ltd/', '../whatsnew.html?ltd'], ['whatsnew.html?ltd', 'whatsnew.html?ltd']]){
    await page.goto(p);
    await expect(page.locator('#appVersion .version-link'), p).toHaveText('Ltd v' + LTD_VERSION + ' demo');
    await expect(page.locator('#appVersion .version-link'), p).toHaveAttribute('href', href);
  }
  // Debuggit Learn has its own version and What's new.
  for(const [p, href] of [['learn/', '../whatsnew.html?learn'], ['learn/sandbox.html', '../whatsnew.html?learn'], ['whatsnew.html?learn', 'whatsnew.html?learn']]){
    await page.goto(p);
    await expect(page.locator('#appVersion .version-link'), p).toHaveText('Learn v' + LEARN_VERSION + ' demo');
    await expect(page.locator('#appVersion .version-link'), p).toHaveAttribute('href', href);
  }
});

test('Learn’s What’s new lists only Learn, and its "new" is separate from the daily’s', async ({ page }) => {
  await openAt(page, 'learn/');
  await fresh(page);
  await page.click('[data-action=lesson][data-lesson=print]');
  // A returning Learn player who last saw an older Learn version sees "new" on Learn only.
  await page.evaluate(() => { localStorage.setItem('debuggit-learn-seen-version', '0.0.0'); localStorage.setItem('debuggit-learn-save', '{}'); });
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
  // The daily's What's new doesn't list Learn. None of the lists starts with the changelog's note
  // about version numbers: that's for developers.
  await page.goto('whatsnew.html');
  await expect(page.locator('#notes')).not.toContainText('Strings');
  for(const intro of ['own version numbers', 'Versions go 0.0.1']) await expect(page.locator('#notes')).not.toContainText(intro);
  await page.goto('whatsnew.html?learn');
  for(const intro of ['own version numbers', 'Versions go 0.0.1']) await expect(page.locator('#notes')).not.toContainText(intro);
  await expect(page.locator('#notes')).not.toContainText('0.1.0 is the launch');
});

test('Ltd’s What’s new lists only Ltd, and its "new" is separate from the daily’s', async ({ page }) => {
  await openAt(page, 'index.html');
  await fresh(page);
  // A returning company that last saw an older Ltd version sees "new" on the Ltd page only.
  await page.evaluate(() => { localStorage.setItem('debuggit-ltd-seen-version', '0.0.0'); localStorage.setItem('debuggit-ltd-save', '{}'); });
  await page.goto('ltd/');
  await expect(page.locator('.version-link')).toHaveText('Ltd v' + LTD_VERSION + ' demo · new');
  await page.goto('index.html');
  await expect(page.locator('.version-link')).not.toHaveClass(/new/);
  await page.goto('ltd/');
  await page.click('.version-link');
  await expect(page.locator('h1')).toHaveText('What’s new in Ltd');
  await expect(page).toHaveTitle('What’s new in Debuggit Ltd');
  await expect(page.locator('#notes h2').first()).toContainText(LTD_VERSION);
  await expect(page.locator('#notes h2').first().locator('.current')).toHaveText('you’re here');
  await expect(page.locator('#notes')).toContainText('Managers are in the demo');
  await expect(page.locator('#notes')).not.toContainText('Share your result');
  await expect(page.locator('#notes')).not.toContainText('Unreleased');
  await expect(page.locator('#backLink')).toHaveAttribute('href', 'ltd/');
  await page.goto('ltd/');
  await expect(page.locator('.version-link')).not.toHaveClass(/new/);
  // The daily's What's new doesn't list Ltd, and Ltd's doesn't start with the note about version numbers.
  await page.goto('whatsnew.html');
  await expect(page.locator('#notes')).not.toContainText('Managers are in the demo');
  await page.goto('whatsnew.html?ltd');
  for(const intro of ['own version numbers', 'Versions go 0.0.1']) await expect(page.locator('#notes')).not.toContainText(intro);
});

test('tools/check-scope.js keeps a branch to one product, unless each one’s changelog moves', () => {
  expect(checkScope(['learn/learn.js', 'learn/python/03-lists.js', 'shared.js']).ok).toBe(true);
  expect(checkScope(['ltd/ltd.js', 'ltd/CHANGELOG.md', 'CLAUDE.md']).ok).toBe(true);
  expect(checkScope(['daily/stats.js', 'index.html', 'CHANGELOG.md']).ok).toBe(true);
  expect(checkScope(['CLAUDE.md', 'base.css']).ok).toBe(true);
  // index.html holds the Ltd tab, so on an Ltd branch it counts as Ltd's.
  expect(checkScope(['ltd/ltd.js', 'index.html']).ok).toBe(true);
  // The daily puzzle and Ltd are separate products now.
  const dailyLtd = checkScope(['ltd/ltd.js', 'puzzles/python.js']);
  expect(dailyLtd.ok).toBe(false);
  expect(dailyLtd.message).toContain('ltd:   ltd/ltd.js');
  expect(dailyLtd.message).toContain('daily: puzzles/python.js');
  expect(checkScope(['ltd/ltd.js', 'daily/stats.js', 'index.html']).ok).toBe(false);
  const mixed = checkScope(['ltd/ltd.js', 'learn/learn.js']);
  expect(mixed.ok).toBe(false);
  expect(mixed.message).toContain('learn: learn/learn.js');
  // Every product touched needs its changelog.
  expect(checkScope(['ltd/ltd.js', 'learn/learn.js', 'ltd/CHANGELOG.md']).ok).toBe(false);
  expect(checkScope(['ltd/ltd.js', 'learn/learn.js', 'ltd/CHANGELOG.md', 'learn/CHANGELOG.md']).ok).toBe(true);
  expect(checkScope(['ltd/ltd.js', 'puzzles/python.js', 'ltd/CHANGELOG.md', 'CHANGELOG.md']).ok).toBe(true);
});

test('What’s new shows the changelog, and a returning player sees "new" until they look', async ({ page }) => {
  await openAt(page, 'index.html#python');
  await fresh(page);
  // A first visit isn't told about "new" versions.
  await expect(page.locator('.version-link')).not.toHaveClass(/new/);
  await guess(page, (await puzzleFor(page, 3)).display);
  // A returning player who last saw an older version is.
  await page.evaluate(() => localStorage.setItem('debuggit-daily-seen-version', '0.0.0'));
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
  await expect(page.locator('#notes')).not.toContainText('Managers are in the demo');
  await page.goto('index.html');
  await expect(page.locator('.version-link')).not.toHaveClass(/new/);
});

test('tools/release.js dates the unreleased notes and bumps the version', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'debugg-release-'));
  fs.mkdirSync(path.join(dir, 'tools'));
  fs.mkdirSync(path.join(dir, 'learn'));
  fs.mkdirSync(path.join(dir, 'ltd'));
  for(const f of ['shared.js', 'CHANGELOG.md', 'ltd/CHANGELOG.md', 'learn/CHANGELOG.md', 'tools/release.js']) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
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
  // The daily's notes and version are untouched by a Learn release.
  expect(run('check', next)).toContain('are at ' + next);

  // So is Debuggit Ltd: ltd/CHANGELOG.md and ltd- tags.
  const [ta, tb, tc] = LTD_VERSION.split('.').map(Number);
  const tnext = ta + '.' + tb + '.' + (tc + 1);
  const tlog = path.join(dir, 'ltd/CHANGELOG.md');
  fs.writeFileSync(tlog, fs.readFileSync(tlog, 'utf8').replace(/## Unreleased\n[\s\S]*?(?=\n## )/, '## Unreleased\n\n- Office floors.\n'));
  run('ltd', 'bump', tnext, '2026-10-15');
  expect(fs.readFileSync(tlog, 'utf8')).toContain('## ' + tnext + ' — 15 October 2026\n\n- Office floors.\n');
  const shared2 = fs.readFileSync(path.join(dir, 'shared.js'), 'utf8');
  expect(shared2).toContain("const LTD_VERSION = '" + tnext + "';");
  expect(shared2).toContain("const APP_VERSION = '" + next + "';");
  expect(shared2).toContain("const LEARN_VERSION = '" + lnext + "';");
  expect(run('ltd', 'check', tnext)).toContain('ltd/CHANGELOG.md are at ' + tnext);
  expect(run('ltd', 'notes', tnext).trim()).toBe('- Office floors.');
  expect(run('ltd', 'tag', tnext).trim()).toBe('ltd-v' + tnext);
  expect(run('ltd', 'name', tnext).trim()).toBe('Debuggit Ltd v' + tnext);
  // "game", the daily's old name, still works.
  expect(run('game', 'tag', next).trim()).toBe('v' + next);
  expect(run('daily', 'check', next)).toContain('CHANGELOG.md are at ' + next);
});

test('What’s new after launch shows only each minor release’s player entry, and a patch only if it has one', async ({ page }) => {
  const log = [
    '# What\'s new', '', 'A note about version numbers, for developers.', '',
    '## Unreleased', '', '- Not for players yet.', '',
    '## 0.1.2 — 3 November 2026', '', '- Internal tidy-up.', '',
    '## 0.1.1 — 2 November 2026', '', '- Dev detail.', '<!-- player -->', '- Fixed saves not restoring.', '<!-- /player -->', '',
    '## 0.1.0 — 1 November 2026', '', '- Dev detail of the launch.', '<!-- player -->', '- Play the daily puzzle.', '- Learn Python.', '<!-- /player -->', '',
    '## 0.0.9 — 20 October 2026', '', '- A demo-only change.', ''
  ].join('\n');
  await page.route('**/CHANGELOG.md*', r => r.fulfill({ contentType: 'text/markdown', body: log }));
  await page.goto('whatsnew.html');
  const notes = page.locator('#notes');
  await expect(notes.locator('h2')).toHaveText([/^0\.1\.1/, /^0\.1\.0/]);
  await expect(notes).toContainText('Fixed saves not restoring.');
  await expect(notes).toContainText('Learn Python.');
  for(const hidden of ['Internal tidy-up', 'Dev detail', 'demo-only', 'Not for players', 'version numbers', '<!--']) await expect(notes).not.toContainText(hidden);
});

test('tools/release.js refuses a minor release without a player entry, and strips the markers from the notes', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'debugg-release-'));
  fs.mkdirSync(path.join(dir, 'tools'));
  for(const f of ['shared.js', 'CHANGELOG.md', 'tools/release.js']) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  fs.mkdirSync(path.join(dir, 'learn')); fs.mkdirSync(path.join(dir, 'ltd'));
  for(const f of ['ltd/CHANGELOG.md', 'learn/CHANGELOG.md']) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  const run = (...args) => execFileSync('node', [path.join(dir, 'tools/release.js'), ...args], { encoding: 'utf8', stdio: 'pipe' });
  const fails = (...args) => { try{ run(...args); }catch(e){ return e.stderr; } throw new Error('expected a failure'); };
  const log = path.join(dir, 'CHANGELOG.md');
  const setUnreleased = text => fs.writeFileSync(log, fs.readFileSync(log, 'utf8').replace(/## Unreleased\n[\s\S]*?(?=\n## )/, '## Unreleased\n\n' + text + '\n'));
  setUnreleased('- Lots of detail.');
  expect(fails('bump', '0.1.0')).toContain('curated entry');
  // A patch needs none.
  setUnreleased('- A fix.');
  run('bump', '0.0.99', '2026-11-01');
  // With the block it goes through, and the GitHub Release text has no markers.
  setUnreleased('- Lots of detail.\n<!-- player -->\n- Play the daily.\n<!-- /player -->');
  run('bump', '0.1.0', '2026-11-02');
  expect(run('notes', '0.1.0')).toBe('- Lots of detail.\n- Play the daily.\n\n');
});
