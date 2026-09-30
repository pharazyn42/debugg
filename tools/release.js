#!/usr/bin/env node
// Releases (see "Releases" in CLAUDE.md). Debuggit (the daily puzzle), Debuggit Ltd and Debuggit
// Learn are released separately, each with its own version, changelog and tags:
//
//   daily  APP_VERSION in shared.js,   CHANGELOG.md,        tags v0.0.3
//   ltd    LTD_VERSION in shared.js,   ltd/CHANGELOG.md,    tags ltd-v0.0.3
//   learn  LEARN_VERSION in shared.js, learn/CHANGELOG.md,  tags learn-v0.0.3
//
//   node tools/release.js [ltd|learn] bump 0.0.3 [2026-10-12]  Dates the changelog's "Unreleased" notes as
//                                                              0.0.3 and sets the version. Commit, merge, then
//                                                              run the Release workflow.
//   node tools/release.js [ltd|learn] notes 0.0.3              Prints that version's notes (the GitHub Release's text).
//   node tools/release.js [ltd|learn] check 0.0.3              Fails unless shared.js and the changelog are at 0.0.3.
//   node tools/release.js [ltd|learn] tag 0.0.3                Prints the tag name (v0.0.3, ltd-v0.0.3 or learn-v0.0.3).
//   node tools/release.js [ltd|learn] name 0.0.3               Prints the release's title.
// With no product, it's the daily puzzle ("daily", or its old name "game").
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHARED = path.join(ROOT, 'shared.js');
const PRODUCTS = {
  daily: { constant: 'APP_VERSION',   changelog: 'CHANGELOG.md',       tag: 'v',       name: 'Debuggit' },
  ltd:   { constant: 'LTD_VERSION',   changelog: 'ltd/CHANGELOG.md',   tag: 'ltd-v',   name: 'Debuggit Ltd' },
  learn: { constant: 'LEARN_VERSION', changelog: 'learn/CHANGELOG.md', tag: 'learn-v', name: 'Debuggit Learn' }
};
PRODUCTS.game = PRODUCTS.daily;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EMPTY = 'Nothing yet.';

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
const named = PRODUCTS[args[0]] ? args.shift() : 'daily';
const productKey = named === 'game' ? 'daily' : named;
const P = PRODUCTS[productKey];
const [cmd, version, dateArg] = args;
const CHANGELOG = path.join(ROOT, P.changelog);
const pattern = new RegExp("const " + P.constant + " = '([^']+)';");
const shared = fs.readFileSync(SHARED, 'utf8');
function current(){
  const m = pattern.exec(shared);
  if(!m) fail('no ' + P.constant + ' in shared.js');
  return m[1];
}
const doc = sections(fs.readFileSync(CHANGELOG, 'utf8'));

if(cmd === 'bump'){
  const was = current();
  if(!newer(parse(version), parse(was))) fail(version + ' isn\'t newer than ' + was);
  if(findVersion(doc, version)) fail(P.changelog + ' already has ' + version);
  const unreleased = doc.sections.find(s => /^unreleased$/i.test(s.title));
  if(!unreleased) fail(P.changelog + ' has no "## Unreleased" section');
  if(!unreleased.body || unreleased.body === EMPTY) fail('nothing under "## Unreleased" to release');
  const d = dateArg ? new Date(dateArg + 'T12:00:00Z') : new Date();
  if(isNaN(d)) fail('"' + dateArg + '" isn\'t a date like 2026-10-12');
  const title = version + ' — ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  doc.sections.splice(doc.sections.indexOf(unreleased) + 1, 0, { title, body: unreleased.body });
  unreleased.body = EMPTY;
  fs.writeFileSync(CHANGELOG, join(doc));
  fs.writeFileSync(SHARED, shared.replace(pattern, "const " + P.constant + " = '" + version + "';"));
  console.log('Released ' + P.name + ' ' + was + ' → ' + title + '.\nNext: commit, merge to main, then run the Release workflow ' +
    '(product ' + productKey + ', version ' + version + '), which tags ' + P.tag + version + '.');
}else if(cmd === 'notes'){
  parse(version);
  const s = findVersion(doc, version);
  if(!s) fail(P.changelog + ' has no ' + version);
  console.log(s.body);
}else if(cmd === 'check'){
  parse(version);
  if(current() !== version) fail('shared.js has ' + P.constant + ' at ' + current() + ', not ' + version);
  if(!findVersion(doc, version)) fail(P.changelog + ' has no ' + version);
  console.log('shared.js and ' + P.changelog + ' are at ' + version + '.');
}else if(cmd === 'tag'){
  parse(version);
  console.log(P.tag + version);
}else if(cmd === 'name'){
  parse(version);
  console.log(P.name + ' v' + version);
}else{
  fail('usage: node tools/release.js [ltd|learn] bump|notes|check|tag|name <version> [date]');
}
