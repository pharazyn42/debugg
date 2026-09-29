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

const REQUIRED = ['lang', 'difficulty', 'code', 'flag', 'answers', 'display', 'nudge', 'hints', 'explain', 'fix', 'takeaway'];

// `learn` (optional) names the Learn unit that teaches what the puzzle is about; the puzzle page links
// to it after a missed puzzle, so it must be a written unit in the puzzle's language.
function checkFields(p, D, L){
  const problems = [];
  REQUIRED.forEach(f => { if(p[f] === undefined || p[f] === '') problems.push('missing ' + f); });
  if(!(p.difficulty >= 1 && p.difficulty <= 5)) problems.push('difficulty must be 1 to 5');
  if(!Array.isArray(p.hints) || p.hints.length !== 2) problems.push('needs exactly 2 hints');
  if(p.flag){
    const line = (p.code || '').split('\n')[p.flag.line - 1];
    if(line === undefined || !line.includes(p.flag.text)) problems.push('flag text "' + p.flag.text + '" is not on line ' + p.flag.line);
  }
  if(p.learn !== undefined && !L.units.some(u => u.lang === p.lang && u.id === p.learn)){
    problems.push('learn: no ' + p.lang + ' Learn unit "' + p.learn + '"');
  }
  if(Array.isArray(p.answers) && !p.answers.some(a => D.normaliseAnswer(a) === D.normaliseAnswer(p.display))){
    problems.push('the display "' + p.display + '" wouldn\'t be accepted as an answer');
  }
  return problems;
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
        const qs = u.checkpoint.steps.filter(s => s.type !== 'teach').length;
        if(!(u.checkpoint.pass >= 1 && u.checkpoint.pass <= qs)) fail(lang + '/' + u.id + '/checkpoint', ['pass mark must be 1 to ' + qs]);
        all.push({ where: lang + '/' + u.id + '/checkpoint', steps: u.checkpoint.steps });
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
  return end.out === p.display + '\n';
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
    // Python puzzles have a step-through trace (npm run traces), which must end the way the puzzle does.
    if(p.lang === 'python'){
      const t = (ctx.DEBUGG_TRACES || {})[D.codeId(p.code)];
      if(!t) problems.push('no step-through trace for this code: run npm run traces');
      else if(!traceEndsRight(p, t[t.length - 1])) problems.push('its step-through trace is out of date: run npm run traces');
    }
    const runner = RUNNERS[p.lang];
    if(!runner) problems.push('no runner for language "' + p.lang + '"');
    else if(!problems.length){
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
  console.log('\nPuzzles: ' + (puzzles.length - failed - skipped) + ' passed' + (failed ? ', ' + failed + ' failed' : '') +
    (skipped ? ', ' + skipped + ' skipped (toolchain missing)' : '') + '.');

  const learn = checkLearn(ctx, only);
  console.log('\nLearn courses:\n' + learn.summary.join('\n'));
  console.log('\nLearn: ' + (learn.steps - learn.failed) + ' of ' + learn.steps + ' steps passed.');
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(failed || learn.failed ? 1 : 0);
}

main();
