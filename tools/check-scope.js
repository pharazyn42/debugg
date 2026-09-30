#!/usr/bin/env node
// Keeps each pull request to one product (see "Releases" in CLAUDE.md): Debuggit (the daily
// puzzle), Debuggit Ltd or Debuggit Learn, which are versioned and released separately. The
// player-owner's rule: a branch changes one of them, never more, unless the change affects more
// than one, and then every one it touches gets notes in its changelog in the same PR, so their
// versions move together.
//
//   node tools/check-scope.js                  Checks the current branch against origin/main
//                                              (or $SCOPE_BASE, e.g. origin/main).
//   node tools/check-scope.js a.js b/c.html    Checks that list of changed files.
//
// Files that belong to none (shared.js, base.css, tools, docs, CI…) are shared: they don't count
// towards any product. A shared change players will notice still needs a line in the changelog of
// every product it affects.
//
// index.html is the daily puzzle's page, but it also holds the Ltd tab (its slots and the loader
// that switches the studio on). So on a branch that otherwise only changes Ltd, it counts as Ltd's.
const { execFileSync } = require('child_process');

const PRODUCTS = {
  // The sandbox is part of Learn (learn/sandbox.html; sandbox.html is its old address, a redirect).
  learn: { name: 'Debuggit Learn', log: 'learn/CHANGELOG.md',
           files: [/^learn\//, /^learn\.html$/, /^sandbox\.html$/, /^tests\/(learn|sandbox)\.spec\.js$/] },
  ltd:   { name: 'Debuggit Ltd', log: 'ltd/CHANGELOG.md',
           files: [/^ltd\//, /^studio\//, /^tests\/ltd\.spec\.js$/] },
  daily: { name: 'Debuggit (the daily puzzle)', log: 'CHANGELOG.md',
           files: [/^index\.html$/, /^daily\//, /^puzzles\//, /^CHANGELOG\.md$/, /^tests\/daily\.spec\.js$/] }
};
const SHARED_WITH_LTD = 'index.html';

function side(file){
  return Object.keys(PRODUCTS).find(k => PRODUCTS[k].files.some(r => r.test(file))) || 'shared';
}

// Returns { ok, message }.
function check(files){
  const by = {};
  files.forEach(f => { const s = side(f); if(s !== 'shared') (by[s] = by[s] || []).push(f); });
  // index.html alone, alongside Ltd's files, is an Ltd change (the Ltd tab lives in it).
  if(by.ltd && by.daily && by.daily.every(f => f === SHARED_WITH_LTD)){
    by.ltd.push(...by.daily);
    delete by.daily;
  }
  const touched = Object.keys(PRODUCTS).filter(k => by[k]);
  if(touched.length <= 1){
    return { ok: true, message: 'Scope: ' + (touched.length ? PRODUCTS[touched[0]].name : 'shared files only') + '.' };
  }
  const missing = touched.filter(k => !files.includes(PRODUCTS[k].log));
  const names = touched.map(k => PRODUCTS[k].name).join(', ');
  if(!missing.length){
    return { ok: true, message: 'Scope: ' + names + ', with notes in each changelog, so their versions move together.' };
  }
  return { ok: false, message:
    'This branch changes more than one product: ' + names + '.\n' +
    'Keep a branch to one of them. If the change really affects more than one, add notes under "## Unreleased" in\n' +
    'each one\'s changelog (' + touched.map(k => PRODUCTS[k].log).join(', ') + '), so their versions are updated together.\n' +
    'Missing: ' + missing.map(k => PRODUCTS[k].log).join(', ') + '\n' +
    touched.map(k => '  ' + (k + ':').padEnd(7) + by[k].join(', ')).join('\n') };
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
