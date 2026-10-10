// Loads shared.js, the puzzle files and Learn's units the way the pages do, with just enough of a
// browser around them. Used by tools/check-puzzles.js and tools/trace-puzzles.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
  for(const f of ['shared.js', 'calendar.js', 'daily/core.js']){
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  for(const f of ctx.Debugg.PUZZLE_FILES){
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  const traces = path.join(ROOT, 'puzzles/traces-python.js');
  if(fs.existsSync(traces)) vm.runInContext(fs.readFileSync(traces, 'utf8'), ctx, { filename: 'puzzles/traces-python.js' });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'learn/courses.js'), 'utf8'), ctx, { filename: 'learn/courses.js' });
  for(const course of Object.values(ctx.DEBUGG_LEARN.courses)){
    for(const f of course.files) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return ctx;
}

module.exports = { loadGame, ROOT };
