#!/usr/bin/env node
// Keeps each pull request to one product (see "Releases" in CLAUDE.md): Debuggit (the daily puzzle
// and Debuggit Ltd) or Debuggit Learn, which are versioned and released separately. The
// player-owner's rule: a branch changes one or the other, never both, unless the change affects
// both, and then both changelogs get notes in the same PR, so both versions move together.
//
//   node tools/check-scope.js                  Checks the current branch against origin/main
//                                              (or $SCOPE_BASE, e.g. origin/main).
//   node tools/check-scope.js a.js b/c.html    Checks that list of changed files.
//
// Files that belong to neither (shared.js, base.css, tools, docs, CI…) are shared: they don't count
// towards either side. A shared change players will notice still needs a line in the changelog of
// every product it affects.
const { execFileSync } = require('child_process');

// The sandbox is part of Learn (learn/sandbox.html; sandbox.html is its old address, a redirect).
const LEARN = [/^learn\//, /^learn\.html$/, /^sandbox\.html$/, /^tests\/(learn|sandbox)\.spec\.js$/];
const GAME = [/^index\.html$/, /^daily\//, /^ltd\//, /^puzzles\//, /^studio\//, /^CHANGELOG\.md$/,
  /^tests\/(daily|ltd)\.spec\.js$/];
const LEARN_LOG = 'learn/CHANGELOG.md', GAME_LOG = 'CHANGELOG.md';

function side(file){
  if(LEARN.some(r => r.test(file))) return 'learn';
  if(GAME.some(r => r.test(file))) return 'game';
  return 'shared';
}

// Returns { ok, message }.
function check(files){
  const learn = files.filter(f => side(f) === 'learn');
  const game = files.filter(f => side(f) === 'game');
  if(!learn.length || !game.length){
    return { ok: true, message: 'Scope: ' + (learn.length ? 'Debuggit Learn' : game.length ? 'Debuggit (daily puzzle and Ltd)' : 'shared files only') + '.' };
  }
  if(files.includes(LEARN_LOG) && files.includes(GAME_LOG)){
    return { ok: true, message: 'Scope: both Debuggit and Debuggit Learn, with notes in both changelogs, so both versions move together.' };
  }
  return { ok: false, message:
    'This branch changes both Debuggit Learn and the game (the daily puzzle and Debuggit Ltd).\n' +
    'Keep a branch to one of them. If the change really affects both, add notes under "## Unreleased" in both\n' +
    GAME_LOG + ' and ' + LEARN_LOG + ', so both versions are updated together.\n' +
    '  Learn: ' + learn.join(', ') + '\n  Game:  ' + game.join(', ') };
}

if(require.main === module){
  let files = process.argv.slice(2);
  if(!files.length){
    const base = process.env.SCOPE_BASE || 'origin/main';
    files = execFileSync('git', ['diff', '--name-only', base + '...HEAD'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  }
  const r = check(files);
  (r.ok ? console.log : console.error)(r.message);
  process.exit(r.ok ? 0 : 1);
}

module.exports = { side, check };
