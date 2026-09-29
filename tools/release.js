#!/usr/bin/env node
// Releases (see "Releases" in CLAUDE.md).
//
//   node tools/release.js bump 0.0.2 [2026-10-12]  Dates CHANGELOG.md's "Unreleased" notes as 0.0.2 and
//                                                  sets APP_VERSION in shared.js. Commit, merge, then tag.
//   node tools/release.js notes 0.0.2              Prints that version's notes (the GitHub Release's text).
//   node tools/release.js check 0.0.2              Fails unless shared.js and CHANGELOG.md are at 0.0.2.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHARED = path.join(ROOT, 'shared.js');
const CHANGELOG = path.join(ROOT, 'CHANGELOG.md');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EMPTY = 'Nothing yet.';

function fail(msg){ console.error('release: ' + msg); process.exit(1); }
function parse(v){
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v || '');
  if(!m) fail('"' + v + '" isn\'t a version like 0.0.2');
  return m.slice(1).map(Number);
}
function newer(a, b){ for(let i = 0; i < 3; i++) if(a[i] !== b[i]) return a[i] > b[i]; return false; }
function appVersion(src){
  const m = /const APP_VERSION = '([^']+)';/.exec(src);
  if(!m) fail('no APP_VERSION in shared.js');
  return m[1];
}
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

const [cmd, version, dateArg] = process.argv.slice(2);
const shared = fs.readFileSync(SHARED, 'utf8');
const doc = sections(fs.readFileSync(CHANGELOG, 'utf8'));

if(cmd === 'bump'){
  const current = appVersion(shared);
  if(!newer(parse(version), parse(current))) fail(version + ' isn\'t newer than ' + current);
  if(findVersion(doc, version)) fail('CHANGELOG.md already has ' + version);
  const unreleased = doc.sections.find(s => /^unreleased$/i.test(s.title));
  if(!unreleased) fail('CHANGELOG.md has no "## Unreleased" section');
  if(!unreleased.body || unreleased.body === EMPTY) fail('nothing under "## Unreleased" to release');
  const d = dateArg ? new Date(dateArg + 'T12:00:00Z') : new Date();
  if(isNaN(d)) fail('"' + dateArg + '" isn\'t a date like 2026-10-12');
  const title = version + ' — ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  doc.sections.splice(doc.sections.indexOf(unreleased) + 1, 0, { title, body: unreleased.body });
  unreleased.body = EMPTY;
  fs.writeFileSync(CHANGELOG, join(doc));
  fs.writeFileSync(SHARED, shared.replace(/const APP_VERSION = '[^']+';/, "const APP_VERSION = '" + version + "';"));
  console.log('Released ' + current + ' → ' + title + '.\nNext: commit, merge to main, then tag the merge: git tag v' + version + ' && git push origin v' + version);
}else if(cmd === 'notes'){
  parse(version);
  const s = findVersion(doc, version);
  if(!s) fail('CHANGELOG.md has no ' + version);
  console.log(s.body);
}else if(cmd === 'check'){
  parse(version);
  if(appVersion(shared) !== version) fail('shared.js is at ' + appVersion(shared) + ', not ' + version);
  if(!findVersion(doc, version)) fail('CHANGELOG.md has no ' + version);
  console.log('shared.js and CHANGELOG.md are at ' + version + '.');
}else{
  fail('usage: node tools/release.js bump|notes|check <version> [date]');
}
