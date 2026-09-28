#!/usr/bin/env node
// Checks every puzzle in puzzles/: its fields are complete, its answer matches its own display, and
// its code really prints that display when run with the real toolchain:
//   Python      python3
//   JavaScript  node
//   C           gcc and clang, at -O0 and -O2 (all four must agree, which catches undefined behaviour)
//   Rust        rustc in debug mode (as the Rust Playground runs it by default)
//
// Usage: node tools/check-puzzles.js [lang ...]    e.g. node tools/check-puzzles.js rust
// Exits non-zero if anything fails. A missing toolchain fails too, unless SKIP_MISSING=1.
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

// Load shared.js and the puzzle files the way the page does, with just enough of a browser around them.
function loadGame(){
  const store = {};
  const ctx = { console };
  ctx.window = ctx;
  ctx.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'shared.js'), 'utf8'), ctx, { filename: 'shared.js' });
  for(const f of ctx.Debugg.PUZZLE_FILES){
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return ctx;
}

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
    return { outputs: [{ label: 'python3', out: r.out, err: r.err }] };
  },
  javascript(code){
    fs.writeFileSync(path.join(TMP, 'main.js'), code);
    const r = run(process.execPath, ['main.js']);
    // Node pads arrays and objects ("[ 1, 2 ]"); the sandbox and browsers print "[1, 2]".
    const out = r.out.replace(/([\[{]) /g, '$1').replace(/ ([\]}])/g, '$1');
    return { outputs: [{ label: 'node', out, err: r.err }] };
  },
  c(code){
    fs.writeFileSync(path.join(TMP, 'main.c'), code);
    const outputs = [];
    for(const cc of ['gcc', 'clang']){
      for(const opt of ['-O0', '-O2']){
        const bin = path.join(TMP, 'main-' + cc + opt);
        const b = run(cc, ['-std=c17', opt, '-w', '-o', bin, 'main.c', '-lm']);
        if(b.missing) return { missing: cc };
        if(b.code !== 0) return { error: cc + ' ' + opt + ' failed to compile:\n' + b.err };
        const r = run(bin, []);
        outputs.push({ label: cc + ' ' + opt, out: r.out, err: r.err });
      }
    }
    return { outputs };
  },
  rust(code){
    fs.writeFileSync(path.join(TMP, 'main.rs'), code);
    const bin = path.join(TMP, 'main-rs');
    const b = run('rustc', ['--edition', '2021', '-A', 'warnings', '-o', bin, 'main.rs']);
    if(b.missing) return { missing: 'rustc' };
    if(b.code !== 0) return { error: 'rustc failed to compile:\n' + b.err };
    const r = run(bin, []);
    return { outputs: [{ label: 'rustc', out: r.out, err: r.err }] };
  }
};

const REQUIRED = ['lang', 'difficulty', 'code', 'flag', 'answers', 'display', 'nudge', 'hints', 'explain', 'fix', 'takeaway'];

function checkFields(p, D){
  const problems = [];
  REQUIRED.forEach(f => { if(p[f] === undefined || p[f] === '') problems.push('missing ' + f); });
  if(!(p.difficulty >= 1 && p.difficulty <= 5)) problems.push('difficulty must be 1 to 5');
  if(!Array.isArray(p.hints) || p.hints.length !== 2) problems.push('needs exactly 2 hints');
  if(p.flag){
    const line = (p.code || '').split('\n')[p.flag.line - 1];
    if(line === undefined || !line.includes(p.flag.text)) problems.push('flag text "' + p.flag.text + '" is not on line ' + p.flag.line);
  }
  if(Array.isArray(p.answers) && !p.answers.some(a => D.normaliseAnswer(a) === D.normaliseAnswer(p.display))){
    problems.push('the display "' + p.display + '" wouldn\'t be accepted as an answer');
  }
  return problems;
}

// A puzzle prints its display, and nothing else (a trailing newline is fine).
function matches(out, display){ return out.replace(/\s+$/, '') === display; }

function main(){
  const ctx = loadGame();
  const D = ctx.Debugg;
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

    const problems = checkFields(p, D);
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
  console.log('\n' + (puzzles.length - failed - skipped) + ' passed' + (failed ? ', ' + failed + ' failed' : '') +
    (skipped ? ', ' + skipped + ' skipped (toolchain missing)' : '') + '.');
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
}

main();
