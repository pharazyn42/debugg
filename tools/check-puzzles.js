#!/usr/bin/env node
// Checks every puzzle in puzzles/ and every Learn course in learn/: the fields are complete, and the
// code really prints what the puzzle or lesson says it does, when run with the real toolchain:
//   Python      python3
//   JavaScript  node
//   C           gcc and clang, at -O0 and -O2 (all four must agree, which catches undefined behaviour)
//   Rust        rustc in debug mode (as the Rust Playground runs it by default)
//
// For Learn steps it also checks that a multiple-choice question's right answer is what the code prints
// and no wrong answer is; that each fill-the-blank option does (or doesn't) give the target output; and
// that a "tap the line" error really happens on that line.
//
// Usage: node tools/check-puzzles.js [lang ...]    e.g. node tools/check-puzzles.js rust
// Exits non-zero if anything fails. A missing toolchain fails too, unless SKIP_MISSING=1.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

const { loadGame } = require('./load-game');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'debugg-check-'));
function run(cmd, args, opts = {}){
  const r = spawnSync(cmd, args, Object.assign({ encoding: 'utf8', timeout: 20000, cwd: TMP }, opts));
  if(r.error && r.error.code === 'ENOENT') return { missing: true };
  return { code: r.status, out: r.stdout || '', err: (r.stderr || '') + (r.error ? String(r.error) : '') };
}

// Each runner returns { outputs: [ { label, out } ] } or { error }.
const RUNNERS = {
  python(code){
    fs.writeFileSync(path.join(TMP, 'main.py'), code);
    const r = run('python3', ['main.py']);
    if(r.missing) return { missing: 'python3' };
    return { outputs: [{ label: 'python3', out: r.out, err: r.err, code: r.code }] };
  },
  javascript(code){
    fs.writeFileSync(path.join(TMP, 'main.js'), code);
    const r = run(process.execPath, ['main.js']);
    // Node pads arrays and objects ("[ 1, 2 ]"); the sandbox and browsers print "[1, 2]".
    const out = r.out.replace(/([\[{]) /g, '$1').replace(/ ([\]}])/g, '$1');
    return { outputs: [{ label: 'node', out, err: r.err, code: r.code }] };
  },
  c(code){
    fs.writeFileSync(path.join(TMP, 'main.c'), code);
    const outputs = [];
    for(const cc of ['gcc', 'clang']){
      for(const opt of ['-O0', '-O2']){
        const bin = path.join(TMP, 'main-' + cc + opt);
        const b = run(cc, ['-std=c17', opt, '-w', '-o', bin, 'main.c', '-lm']);
        if(b.missing) return { missing: cc };
        if(b.code !== 0) return { error: cc + ' ' + opt + ' failed to compile:\n' + b.err, compileErr: b.err };
        const r = run(bin, []);
        outputs.push({ label: cc + ' ' + opt, out: r.out, err: r.err, code: r.code });
      }
    }
    return { outputs };
  },
  rust(code){
    fs.writeFileSync(path.join(TMP, 'main.rs'), code);
    const bin = path.join(TMP, 'main-rs');
    const b = run('rustc', ['--edition', '2021', '-A', 'warnings', '-o', bin, 'main.rs']);
    if(b.missing) return { missing: 'rustc' };
    if(b.code !== 0) return { error: 'rustc failed to compile:\n' + b.err, compileErr: b.err };
    const r = run(bin, []);
    return { outputs: [{ label: 'rustc', out: r.out, err: r.err, code: r.code }] };
  }
};

const REQUIRED = ['lang', 'difficulty', 'code', 'flag', 'display', 'nudge', 'hints', 'explain', 'fix', 'takeaway'];
// What each format needs on top (see puzzles/README.md). Typed formats need `answers`.
const FORMAT_FIELDS = { output: ['answers'], choice: ['options'], value: ['answers', 'ask'], count: ['answers', 'ask'],
                        error: ['options'], order: [], bug: ['expected', 'bugLine', 'fixLine'],
                        pass: ['task', 'tests', 'hidden', 'solution', 'wrong'] };
// A code challenge is judged by its tests, so it has no single printed answer or flagged spot.
const NOT_FOR = { pass: ['flag', 'display'] };

// `learn` (optional) names the Learn unit that teaches what the puzzle is about; the puzzle page links
// to it after a missed puzzle, so it must be a written unit in the puzzle's language.
function checkFields(p, D, L){
  const problems = [];
  const format = p.format || 'output';
  if(!D.FORMATS[format]) return ['unknown format "' + p.format + '"'];
  if(format !== 'output' && p.lang !== 'python') problems.push('only Python puzzles can use the ' + format + ' format so far');
  REQUIRED.filter(f => !(NOT_FOR[format] || []).includes(f)).concat(FORMAT_FIELDS[format]).forEach(f => { if(p[f] === undefined || p[f] === '') problems.push('missing ' + f); });
  if(!(p.difficulty >= 1 && p.difficulty <= 5)) problems.push('difficulty must be 1 to 5');
  const hints = D.FORMATS[format].hints;
  if(!Array.isArray(p.hints) || p.hints.length !== hints) problems.push('needs exactly ' + hints + ' hint' + (hints > 1 ? 's' : ''));
  if(p.options !== undefined){
    if(!Array.isArray(p.options) || p.options.length !== 4) problems.push('needs exactly 4 options');
    else if(new Set(p.options).size !== 4) problems.push('options must all be different');
    else if(!p.options.includes(p.display)) problems.push('the display "' + p.display + '" isn\'t one of the options');
  }
  if(format === 'error' && Array.isArray(p.options) && !p.options.includes('Runs fine')) problems.push('an error puzzle offers "Runs fine" as an option');
  if(format === 'count' && !(p.ask && p.ask.line >= 1 && p.ask.line <= p.code.split('\n').length)) problems.push('ask.line must be a line of the code');
  if(format === 'value' && !(p.ask && /^[A-Za-z_]\w*$/.test(p.ask.name || ''))) problems.push('ask.name must be a variable name');
  if(format === 'order'){
    const n = (p.code || '').split('\n').length;
    if(n < 3 || n > 7) problems.push('order puzzles have 3 to 7 lines');
  }
  if(format === 'bug'){
    if(p.flag && p.flag.line !== p.bugLine) problems.push('the flag should be on the bug line');
    if(p.expected === p.display) problems.push('what it should print is what it prints');
  }
  if(format === 'pass'){
    const isTest = t => Array.isArray(t) && t.length === 2 && t.every(x => typeof x === 'string' && x);
    if(!(Array.isArray(p.tests) && p.tests.length && p.tests.every(isTest))) problems.push('tests must be a list of [call, want] pairs');
    if(!(Array.isArray(p.hidden) && p.hidden.length >= 2 && p.hidden.every(isTest))) problems.push('hidden must be at least 2 [call, want] pairs');
    if(!(Array.isArray(p.wrong) && p.wrong.length)) problems.push('wrong must list at least one wrong solution the hidden tests catch');
  }
  if(p.flag){
    const line = (p.code || '').split('\n')[p.flag.line - 1];
    if(line === undefined || !line.includes(p.flag.text)) problems.push('flag text "' + p.flag.text + '" is not on line ' + p.flag.line);
  }
  if(p.learn !== undefined && !L.units.some(u => u.lang === p.lang && u.id === p.learn)){
    problems.push('learn: no ' + p.lang + ' Learn unit "' + p.learn + '"');
  }
  if(FORMAT_FIELDS[format].includes('answers') && Array.isArray(p.answers) && !p.answers.some(a => D.normaliseAnswer(a) === D.normaliseAnswer(p.display))){
    problems.push('the display "' + p.display + '" wouldn\'t be accepted as an answer');
  }
  return problems;
}

function probe(req){
  const r = spawnSync('python3', [path.join(__dirname, 'probe.py')], { input: JSON.stringify(req), encoding: 'utf8', timeout: 60000 });
  if(r.error && r.error.code === 'ENOENT') return { missing: 'python3' };
  if(r.status !== 0) return { error: 'probe.py failed: ' + (r.stderr || r.error).toString().trim().split('\n').pop() };
  return JSON.parse(r.stdout);
}

// Checks a puzzle in a format other than "what does this print?" against what really happens.
// Returns a list of problems, or { missing } when the toolchain isn't there.
function checkFormat(p){
  const f = p.format;
  const problems = [];
  const py = code => RUNNERS.python(code);
  const plain = r => r.outputs[0];
  if(f === 'choice' || f === 'order'){
    const r = py(p.code);
    if(r.missing) return r;
    const o = plain(r);
    if(o.code !== 0) problems.push('exits with an error: ' + o.err.trim().split('\n').pop());
    else if(!matches(o.out, p.display)) problems.push('prints ' + JSON.stringify(o.out.replace(/\s+$/, '')) + ', not ' + JSON.stringify(p.display));
    if(f === 'order' && !problems.length){
      const lines = p.code.split('\n');
      const t = probe({ mode: 'orders', lines, target: p.display });
      if(t.missing) return t;
      if(t.error) problems.push(t.error);
      else{
        const others = t.orders.filter(o => o.join(',') !== lines.map((_, i) => i).join(','));
        if(others.length) problems.push('another order also prints it:\n      ' + others[0].map(i => lines[i]).join('\n      '));
      }
    }
  }else if(f === 'value'){
    const r = py(p.code + '\nprint(repr(' + p.ask.name + '))');
    if(r.missing) return r;
    const o = plain(r);
    if(o.code !== 0) problems.push('exits with an error: ' + o.err.trim().split('\n').pop());
    else if(!matches(o.out, p.display)) problems.push(p.ask.name + ' ends as ' + JSON.stringify(o.out.replace(/\s+$/, '')) + (o.out.split('\n').length > 2 ? ' (the snippet itself should print nothing)' : '') + ', not ' + JSON.stringify(p.display));
  }else if(f === 'count'){
    const t = probe({ mode: 'count', code: p.code, line: p.ask.line });
    if(t.missing) return t;
    if(t.error) problems.push(t.error);
    else if(String(t.count) !== p.display) problems.push('line ' + p.ask.line + ' runs ' + t.count + ' times, not ' + p.display);
  }else if(f === 'error'){
    const r = py(p.code);
    if(r.missing) return r;
    const o = plain(r);
    const m = /^(\w+)(?::|$)/m.exec(o.err.trim().split('\n').pop() || '');
    const what = o.code === 0 ? 'Runs fine' : (m ? m[1] : 'an unknown error');
    if(what !== p.display) problems.push('it ' + (o.code === 0 ? 'runs fine' : 'raises ' + what) + ', not ' + p.display);
  }else if(f === 'pass'){
    // The starter fails a visible test, the solution passes every test, and each wrong solution
    // passes the visible tests but is caught by a hidden one (so hidden tests earn their keep).
    const all = p.tests.concat(p.hidden);
    const judge = src => testsRun(src, all);
    const failing = (r, from, to) => r.results.slice(from, to).map((t, i) => ({ t: all[from + i], got: t.got, ok: t.ok })).filter(x => !x.ok);
    const start = judge(p.code);
    if(start.missing) return start;
    if(start.crash) return [start.crash];
    if(!start.error && !failing(start, 0, p.tests.length).length) problems.push('the starter code already passes the visible tests');
    const sol = judge(p.solution);
    if(sol.crash) return [sol.crash];
    if(sol.error) problems.push('the solution raises ' + sol.error);
    else failing(sol, 0, all.length).forEach(x => problems.push('the solution fails ' + x.t[0] + ': got ' + x.got + ', not ' + x.t[1]));
    p.wrong.forEach((w, i) => {
      const r = judge(w);
      if(r.crash) return problems.push(r.crash);
      const name = 'wrong solution ' + (i + 1);
      if(r.error) return problems.push(name + ' raises ' + r.error + ' (it should pass the visible tests)');
      const vis = failing(r, 0, p.tests.length);
      if(vis.length) problems.push(name + ' fails visible test ' + vis[0].t[0] + ' (it should pass them, and be caught by a hidden one)');
      else if(!failing(r, p.tests.length, all.length).length) problems.push(name + ' passes every hidden test too');
    });
  }else if(f === 'bug'){
    const r = py(p.code);
    if(r.missing) return r;
    const o = plain(r);
    if(!matches(o.out, p.display)) problems.push('prints ' + JSON.stringify(o.out.replace(/\s+$/, '')) + ', not ' + JSON.stringify(p.display));
    const lines = p.code.split('\n');
    if(!(p.bugLine >= 1 && p.bugLine <= lines.length)) problems.push('bugLine is outside the code');
    else{
      lines[p.bugLine - 1] = p.fixLine;
      const fixed = plain(py(lines.join('\n')));
      if(!matches(fixed.out, p.expected)) problems.push('with the fixLine it prints ' + JSON.stringify(fixed.out.replace(/\s+$/, '')) + ', not the expected ' + JSON.stringify(p.expected));
    }
  }
  return problems;
}

// Runs a code challenge's tests with real Python, through the same harness the page uses
// (DebuggRunner.HARNESS in daily/runner.js). Returns { error, results, printed }, { missing } or { crash }.
let HARNESS = null;
function testsRun(src, tests){
  if(!HARNESS){
    const ctx = { window: {} };
    require('vm').runInNewContext(fs.readFileSync(path.join(ROOT, 'daily/runner.js'), 'utf8'), ctx);
    HARNESS = ctx.window.DebuggRunner.HARNESS;
  }
  const driver = HARNESS + '\nimport json as _j, sys as _s\n_a = _j.load(_s.stdin)\nprint(_debugg_tests(_a["src"], _a["tests"]))\n';
  fs.writeFileSync(path.join(TMP, 'challenge.py'), driver);
  const r = run('python3', ['challenge.py'], { input: JSON.stringify({ src, tests }) });
  if(r.missing) return { missing: 'python3' };
  if(r.code !== 0) return { crash: 'the test harness failed: ' + (r.err.trim().split('\n').pop() || 'no output') };
  return JSON.parse(r.out);
}

// A puzzle prints its display, and nothing else (a trailing newline is fine).
function matches(out, display){ return out.replace(/\s+$/, '') === display; }

// --- Learn ---------------------------------------------------------------------------------------

// Runs code and returns its output (every toolchain agreeing), or { error } / { missing }.
function outputOf(lang, code){
  const r = RUNNERS[lang](code);
  if(r.missing || r.error) return r;
  const outs = new Set(r.outputs.map(o => o.out.replace(/\s+$/, '')));
  if(outs.size > 1) return { error: 'toolchains disagree: ' + [...outs].map(o => JSON.stringify(o)).join(' vs ') };
  const o = r.outputs[0];
  if(o.code !== 0) return { error: 'exited with an error:\n      ' + o.err.trim().split('\n').slice(-2).join('\n      '), failed: true, err: o.err };
  return { out: o.out.replace(/\s+$/, '') };
}

// Returns the problems with one Learn step.
function checkStep(lang, step){
  const problems = [];
  const need = f => { if(step[f] === undefined || step[f] === '') problems.push('missing ' + f); };
  const oneCorrect = () => {
    if(!Array.isArray(step.options) || step.options.length < 2) return problems.push('needs at least 2 options');
    if(step.options.filter(o => o.correct).length !== 1) problems.push('needs exactly one correct option');
    step.options.filter(o => !o.correct).forEach(o => { if(!o.why) problems.push('wrong option "' + o.text + '" needs a why'); });
  };
  const run = code => {
    const r = outputOf(lang, code);
    if(r.missing) problems.push(r.missing + ' is not installed');
    return r;
  };
  if(step.type === 'teach'){
    need('text');
    if(step.code !== undefined && step.output !== undefined){
      const r = run(step.code);
      if(r.error) problems.push(r.error);
      else if(r.out !== undefined && r.out !== step.output) problems.push('prints ' + JSON.stringify(r.out) + ', not ' + JSON.stringify(step.output));
    }
  }else if(step.type === 'choice'){
    need('question'); need('explain'); oneCorrect();
    if(step.asks === 'output' && !problems.length){
      const r = run(step.code);
      if(r.error) problems.push(r.error);
      else if(r.out !== undefined){
        const right = step.options.find(o => o.correct);
        if(right.text !== r.out) problems.push('the right answer "' + right.text + '" isn\'t what it prints: ' + JSON.stringify(r.out));
        step.options.filter(o => !o.correct && o.text === r.out).forEach(o => problems.push('wrong option "' + o.text + '" is actually what it prints'));
      }
    }
  }else if(step.type === 'predict'){
    ['question', 'code', 'display', 'answers', 'nudge', 'explain'].forEach(need);
    if(!problems.length){
      if(!step.answers.some(a => global.D.normaliseAnswer(a) === global.D.normaliseAnswer(step.display))) problems.push('the display wouldn\'t be accepted as an answer');
      const r = run(step.code);
      if(r.error) problems.push(r.error);
      else if(r.out !== undefined && r.out !== step.display) problems.push('prints ' + JSON.stringify(r.out) + ', not ' + JSON.stringify(step.display));
    }
  }else if(step.type === 'blank'){
    ['question', 'code', 'target', 'explain'].forEach(need); oneCorrect();
    if(!problems.length){
      if((step.code.match(/___/g) || []).length !== 1) problems.push('the code needs exactly one ___ gap');
      else step.options.forEach(o => {
        const r = run(step.code.replace('___', o.text));
        const hits = r.out === step.target;
        if(o.correct && !hits) problems.push('the right option "' + o.text + '" gives ' + (r.error ? 'an error: ' + r.error : JSON.stringify(r.out)) + ', not the target');
        if(!o.correct && hits) problems.push('wrong option "' + o.text + '" also gives the target');
      });
    }
  }else if(step.type === 'line'){
    ['question', 'code', 'line', 'explain'].forEach(need);
    const count = (step.code || '').split('\n').length;
    if(!(step.line >= 1 && step.line <= count)) problems.push('line ' + step.line + ' is outside the code');
    else if(step.errors){
      const r = run(step.code);
      const text = r.compileErr || r.err || '';
      if(!r.error) problems.push('it should stop with an error, but it ran fine');
      else if(!new RegExp('line ' + step.line + '\\b|:' + step.line + ':').test(text)) problems.push('the error isn\'t on line ' + step.line + ':\n      ' + text.trim().split('\n').slice(-3).join('\n      '));
    }
  }else{
    problems.push('unknown step type "' + step.type + '"');
  }
  return problems;
}

function checkLearn(ctx, only){
  let failed = 0, steps = 0;
  const L = ctx.DEBUGG_LEARN;
  const summary = [];
  for(const [lang, course] of Object.entries(L.courses)){
    if(only.length && !only.includes(lang)) continue;
    const units = L.units.filter(u => u.lang === lang);
    const fail = (where, problems) => { failed++; console.log('✗ learn ' + where + '\n    ' + problems.join('\n    ')); };
    if(units.length !== course.files.length) fail(lang, ['course lists ' + course.files.length + ' files but ' + units.length + ' units loaded']);
    const unitIds = new Set();
    let lessons = 0;
    units.forEach(u => {
      if(!u.id || unitIds.has(u.id)) fail(lang + '/' + u.id, ['unit id missing or repeated']);
      unitIds.add(u.id);
      const lessonIds = new Set();
      const all = u.lessons.map(l => {
        if(!l.id || lessonIds.has(l.id)) fail(lang + '/' + u.id + '/' + l.id, ['lesson id missing or repeated']);
        lessonIds.add(l.id);
        return { where: lang + '/' + u.id + '/' + l.id, steps: l.steps };
      });
      lessons += u.lessons.length;
      if(u.checkpoint){
        // The pool is `steps` plus `more`; each attempt asks `ask` of them (default: as many as `steps`).
        const pool = u.checkpoint.steps.concat(u.checkpoint.more || []);
        const ask = u.checkpoint.ask || u.checkpoint.steps.length;
        const where = lang + '/' + u.id + '/checkpoint';
        if(pool.some(s => s.type === 'teach')) fail(where, ['a checkpoint has questions only']);
        if(!(ask >= 1 && ask <= pool.length)) fail(where, ['ask must be 1 to ' + pool.length + ' (the pool size)']);
        if(!(u.checkpoint.pass >= 1 && u.checkpoint.pass <= ask)) fail(where, ['pass mark must be 1 to ' + ask]);
        all.push({ where, steps: pool });
      }
      all.forEach(({ where, steps: list }) => {
        // The review queue finds a missed question by its text and code, so no two in a lesson or
        // checkpoint may share both (learn.js, questionId).
        const ids = new Set();
        list.forEach((s, i) => {
          if(s.type === 'teach') return;
          const id = s.question + '\n' + (s.code || '');
          if(ids.has(id)) fail(where + ' step ' + (i + 1), ['same question and code as an earlier step (the review queue can\'t tell them apart)']);
          ids.add(id);
        });
      });
      all.forEach(({ where, steps: list }) => list.forEach((s, i) => {
        steps++;
        const problems = checkStep(lang, s);
        if(problems.length) fail(where + ' step ' + (i + 1) + ' (' + s.type + ')', problems);
      }));
    });
    const planned = (course.planned || []).length + (course.sections || []).reduce((n, s) => n + (s.planned || []).length, 0);
    summary.push('  ' + (lang + ':').padEnd(12) + units.length + ' unit' + (units.length === 1 ? '' : 's') + ', ' + lessons + ' lessons' +
      (planned ? ', ' + planned + ' more planned' : ''));
  }
  return { failed, steps, summary };
}

// The trace's last step matches what the puzzle says happens.
function traceEndsRight(p, end){
  if(!end || !end.end) return false;
  const f = p.format || 'output';
  if(f === 'value') return end.vars[p.ask.name] === p.display;
  if(f === 'error') return p.display === 'Runs fine' ? !end.error : !!end.error && end.error.startsWith(p.display + ':');
  if(f === 'count') return !end.error;
  return end.out === p.display + '\n';
}

// The schedule must never serve a puzzle twice (shared.js, "scheduled"). Two checks:
//  - no two puzzles of a language have the same code (ignoring spacing), and
//  - the stock lasts: the first day the schedule would have to reuse a puzzle must be at least
//    MIN_FRESH_DAYS after today (or after Day 1, if that's later), so the next batch gets written long
//    before the stock runs out. This one fails once the date draws near, on purpose.
const MIN_FRESH_DAYS = 30;
function checkSchedule(ctx){
  const D = ctx.Debugg;
  const lines = [];
  let failed = 0;
  const seen = new Map();
  ctx.DEBUGG_PUZZLES.forEach(p => {
    const key = p.lang + '|' + p.code.split('\n').map(l => l.trim().replace(/\s+/g, ' ')).join('\n').trim();
    if(seen.has(key)){
      failed++;
      lines.push('✗ two ' + p.lang + ' puzzles have the same code: ' + JSON.stringify(p.code.split('\n')[0]));
    }
    seen.set(key, true);
  });
  const dayMs = 24 * 60 * 60 * 1000;
  const day1 = D.launchDate();
  const repeat = D.firstRepeatDay();
  const startOfFresh = new Date(Math.max(Date.now(), day1.getTime()));
  const need = new Date(startOfFresh.getTime() + MIN_FRESH_DAYS * dayMs);
  if(!repeat){
    lines.push('No puzzle repeats for at least 1000 days.');
  }else{
    const when = new Date(day1.getTime() + (repeat.day - 1) * dayMs);
    const text = 'Fresh puzzles last until Day ' + (repeat.day - 1) + ' (' + new Date(when.getTime() - dayMs).toDateString() +
      '); Day ' + repeat.day + ' (' + when.toDateString() + ') would repeat a ' + repeat.lang + ' puzzle.';
    if(when < need){
      failed++;
      lines.push('✗ ' + text + '\n    That is less than ' + MIN_FRESH_DAYS + ' days away. Write more ' + repeat.lang +
        ' puzzles (see puzzles/README.md, and add them to the end of the file) so no puzzle is served twice.');
    }else lines.push(text);
  }
  return { failed, lines };
}

function main(){
  const ctx = loadGame();
  const D = global.D = ctx.Debugg;
  const only = process.argv.slice(2);
  const puzzles = ctx.DEBUGG_PUZZLES.filter(p => !only.length || only.includes(p.lang));
  const skipMissing = process.env.SKIP_MISSING === '1';
  let failed = 0, skipped = 0;
  const counts = {};

  puzzles.forEach((p, i) => {
    const firstLine = (p.code || '').split('\n').find(l => l.trim()) || '';
    const name = p.lang + ' #' + (ctx.DEBUGG_PUZZLES.filter(q => q.lang === p.lang).indexOf(p) + 1) + ' (' + firstLine.trim().slice(0, 50) + ')';
    counts[p.lang] = counts[p.lang] || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    counts[p.lang][p.difficulty] = (counts[p.lang][p.difficulty] || 0) + 1;

    const problems = checkFields(p, D, ctx.DEBUGG_LEARN);
    const runner = RUNNERS[p.lang];
    if(!runner) problems.push('no runner for language "' + p.lang + '"');
    else if(!problems.length && p.format && p.format !== 'output'){
      const r = checkFormat(p);
      if(r.missing){
        if(skipMissing){ skipped++; return; }
        problems.push(r.missing + ' is not installed (set SKIP_MISSING=1 to skip)');
      }else problems.push(...r);
    }else if(!problems.length){
      const r = runner(p.code);
      if(r.missing){
        if(skipMissing){ skipped++; return; }
        problems.push(r.missing + ' is not installed (set SKIP_MISSING=1 to skip)');
      }else if(r.error){
        problems.push(r.error.trim());
      }else{
        r.outputs.forEach(o => {
          if(!matches(o.out, p.display)){
            problems.push(o.label + ' printed ' + JSON.stringify(o.out.replace(/\s+$/, '')) + ', not ' + JSON.stringify(p.display) +
              (o.err.trim() ? '\n      stderr: ' + o.err.trim().split('\n').slice(-3).join('\n      ') : ''));
          }
        });
      }
    }
    // Python puzzles have a step-through trace (npm run traces), which must end the way the puzzle does.
    if(p.lang === 'python' && p.format !== 'pass' && !problems.length){
      const t = (ctx.DEBUGG_TRACES || {})[D.codeId(p.code)];
      if(!t) problems.push('no step-through trace for this code: run npm run traces');
      else if(!traceEndsRight(p, t[t.length - 1])) problems.push('its step-through trace is out of date: run npm run traces');
    }
    if(problems.length){
      failed++;
      console.log('✗ ' + name + '\n    ' + problems.join('\n    '));
    }
  });

  console.log('\nPuzzles by difficulty (1 warm-up … 5 hard):');
  Object.keys(counts).forEach(l => {
    const c = counts[l];
    console.log('  ' + (l + ':').padEnd(12) + [1, 2, 3, 4, 5].map(d => d + ': ' + c[d]).join('  ') +
      '   total ' + Object.values(c).reduce((a, b) => a + b, 0));
  });
  const byFormat = {};
  puzzles.forEach(p => { const f = p.format || 'output'; byFormat[f] = (byFormat[f] || 0) + 1; });
  console.log('\nBy format: ' + Object.entries(byFormat).map(([f, n]) => f + ' ' + n).join(', '));
  console.log('\nPuzzles: ' + (puzzles.length - failed - skipped) + ' passed' + (failed ? ', ' + failed + ' failed' : '') +
    (skipped ? ', ' + skipped + ' skipped (toolchain missing)' : '') + '.');

  const sched = only.length ? { failed: 0, lines: [] } : checkSchedule(ctx);
  if(sched.lines.length) console.log('\nSchedule:\n  ' + sched.lines.join('\n  '));
  const learn = checkLearn(ctx, only);
  console.log('\nLearn courses:\n' + learn.summary.join('\n'));
  console.log('\nLearn: ' + (learn.steps - learn.failed) + ' of ' + learn.steps + ' steps passed.');
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(failed || learn.failed || sched.failed ? 1 : 0);
}

main();
