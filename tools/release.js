#!/usr/bin/env node
// Releases (see "Releases" in CLAUDE.md). Debuggit (the daily puzzle), Debuggit Ltd and Debuggit
// Learn are released separately, each with its own version, changelog and tags:
//
//   daily  daily/version.js,  CHANGELOG.md,        tags v0.0.3
//   ltd    ltd/version.js,    ltd/CHANGELOG.md,    tags ltd-v0.0.3
//   learn  learn/version.js,  learn/CHANGELOG.md,  tags learn-v0.0.3
//
//   node tools/release.js [ltd|learn] bump 0.0.3 [2026-10-12]  Dates the changelog's "Unreleased" notes as
//                                                              0.0.3 and sets the version. Commit, merge, then
//                                                              run the Release workflow.
//   node tools/release.js [ltd|learn] notes 0.0.3              Prints that version's notes (the GitHub Release's text).
//
// The changelogs are the full developer log. What's new shows players only a section's
// <!-- player --> … <!-- /player --> block (while the demo runs, 0.0.x, every section). A minor release
// (0.1.0, 0.2.0…) must have one, so `bump` refuses without it; a patch only gets one when players would
// notice the fix.
//   node tools/release.js [ltd|learn] check 0.0.3              Fails unless the version file and the changelog are at 0.0.3.
//   node tools/release.js [ltd|learn] tag 0.0.3                Prints the tag name (v0.0.3, ltd-v0.0.3 or learn-v0.0.3).
//   node tools/release.js [ltd|learn] name 0.0.3               Prints the release's title.
// With no product, it's the daily puzzle ("daily", or its old name "game") here; in a repo that holds just one
// product (once they are split), it's that product, so the same file works unchanged in each.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PRODUCTS = {
  daily: { file: 'daily/version.js', changelog: 'CHANGELOG.md',       tag: 'v',       name: 'Debuggit' },
  ltd:   { file: 'ltd/version.js',   changelog: 'ltd/CHANGELOG.md',   tag: 'ltd-v',   name: 'Debuggit Ltd' },
  learn: { file: 'learn/version.js', changelog: 'learn/CHANGELOG.md', tag: 'learn-v', name: 'Debuggit Learn' }
};
PRODUCTS.game = PRODUCTS.daily;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EMPTY = 'Nothing yet.';
const PLAYER_BLOCK = /<!--\s*player\s*-->([\s\S]*?)<!--\s*\/player\s*-->/;
const MARKERS = /^[ \t]*<!--\s*\/?player\s*-->[ \t]*\n?/gm;
// 0.1.0, 0.2.0, 1.0.0…: a new "minor" (the demo's 0.0.x is all patches of nothing).
function isMinor(v){ const [a, b, c] = parse(v); return c === 0 && (a > 0 || b > 0); }

function fail(msg){ console.error('release: ' + msg); process.exit(1); }
function parse(v){
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v || '');
  if(!m) fail('"' + v + '" isn\'t a version like 0.0.2');
  return m.slice(1).map(Number);
}
function newer(a, b){ for(let i = 0; i < 3; i++) if(a[i] !== b[i]) return a[i] > b[i]; return false; }
// { head, sections: [{ title, body }] }, split on "## " headings.
function sections(md){
  const parts = md.split(/^## /m);
  return { head: parts[0], sections: parts.slice(1).map(p => {
    const i = p.indexOf('\n');
    return { title: p.slice(0, i).trim(), body: p.slice(i + 1).trim() };
  }) };
}
function join(doc){ return doc.head + doc.sections.map(s => '## ' + s.title + '\n\n' + s.body + '\n').join('\n'); }
function findVersion(doc, v){ return doc.sections.find(s => s.title === v || s.title.startsWith(v + ' ')); }

const args = process.argv.slice(2);
// The product present when only one of them has a changelog here; otherwise the daily puzzle.
function onlyProduct(){
  const here = ['daily', 'ltd', 'learn'].filter(k => fs.existsSync(path.join(ROOT, PRODUCTS[k].changelog)));
  return here.length === 1 ? here[0] : 'daily';
}
const named = PRODUCTS[args[0]] ? args.shift() : onlyProduct();
const productKey = named === 'game' ? 'daily' : named;
const P = PRODUCTS[productKey];
const [cmd, version, dateArg] = args;
const CHANGELOG = path.join(ROOT, P.changelog);
const VERSION_FILE = path.join(ROOT, P.file);
const pattern = new RegExp("(PRODUCTS\\." + productKey + "\\.version = ')([^']+)(';)");
const versionSource = fs.readFileSync(VERSION_FILE, 'utf8');
function current(){
  const m = pattern.exec(versionSource);
  if(!m) fail('no PRODUCTS.' + productKey + '.version in ' + P.file);
  return m[2];
}
const doc = sections(fs.readFileSync(CHANGELOG, 'utf8'));

if(cmd === 'bump'){
  const was = current();
  if(!newer(parse(version), parse(was))) fail(version + ' isn\'t newer than ' + was);
  if(findVersion(doc, version)) fail(P.changelog + ' already has ' + version);
  const unreleased = doc.sections.find(s => /^unreleased$/i.test(s.title));
  if(!unreleased) fail(P.changelog + ' has no "## Unreleased" section');
  if(!unreleased.body || unreleased.body === EMPTY) fail('nothing under "## Unreleased" to release');
  if(isMinor(version) && !PLAYER_BLOCK.test(unreleased.body))
    fail(version + ' is a minor release, so players get a curated entry. Under "## Unreleased" in ' + P.changelog + ', write 3 to 6 one-line\n' +
      'bullets of what players will notice, wrapped in <!-- player --> and <!-- /player --> lines (the detailed bullets can stay beside them).');
  const d = dateArg ? new Date(dateArg + 'T12:00:00Z') : new Date();
  if(isNaN(d)) fail('"' + dateArg + '" isn\'t a date like 2026-10-12');
  const title = version + ' — ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  doc.sections.splice(doc.sections.indexOf(unreleased) + 1, 0, { title, body: unreleased.body });
  unreleased.body = EMPTY;
  fs.writeFileSync(CHANGELOG, join(doc));
  fs.writeFileSync(VERSION_FILE, versionSource.replace(pattern, '$1' + version + '$3'));
  console.log('Released ' + P.name + ' ' + was + ' → ' + title + '.\nNext: commit, merge to main, then run the Release workflow ' +
    '(product ' + productKey + ', version ' + version + '), which tags ' + P.tag + version + '.');
}else if(cmd === 'notes'){
  parse(version);
  const s = findVersion(doc, version);
  if(!s) fail(P.changelog + ' has no ' + version);
  console.log(s.body.replace(MARKERS, ''));
}else if(cmd === 'check'){
  parse(version);
  if(current() !== version) fail(P.file + ' is at ' + current() + ', not ' + version);
  if(!findVersion(doc, version)) fail(P.changelog + ' has no ' + version);
  console.log(P.file + ' and ' + P.changelog + ' are at ' + version + '.');
}else if(cmd === 'tag'){
  parse(version);
  console.log(P.tag + version);
}else if(cmd === 'name'){
  parse(version);
  console.log(P.name + ' v' + version);
}else{
  fail('usage: node tools/release.js [ltd|learn] bump|notes|check|tag|name <version> [date]');
}
