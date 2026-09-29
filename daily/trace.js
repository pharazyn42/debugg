// "Step through it": plays back a puzzle's trace after the game, one step at a time. The line about to
// run is lit up in the code, with the variables at that moment (changed ones marked) and what has
// been printed so far. Traces are recorded by real Python (tools/trace-puzzles.js) into
// puzzles/traces-python.js, keyed by Debugg.codeId(code).
window.DebuggTrace = (function(){
  const D = window.Debugg;
  const esc = D.escapeHtml;

  function stepsFor(puzzle){
    return (window.DEBUGG_TRACES || {})[D.codeId(puzzle.code)] || null;
  }

  // Opens the player in `panel`, lighting up lines in `codeEl` (whose lines are .cl[data-line]).
  function open(steps, panel, codeEl){
    let i = 0;
    function what(s){
      if(s.end) return s.error ? 'Stopped with an error: <code>' + esc(s.error) + '</code>' : 'Finished.';
      if(s.ret != null) return '<code>' + esc(s.fn) + '()</code> returns <code>' + esc(s.ret) + '</code>';
      return 'Line ' + s.line + ' runs next' + (s.fn ? ', inside <code>' + esc(s.fn) + '()</code>' : '') + '.';
    }
    function render(){
      const s = steps[i], prev = steps[i - 1];
      codeEl.querySelectorAll('.cl.now').forEach(el => el.classList.remove('now'));
      const line = s.end ? null : codeEl.querySelector('.cl[data-line="' + s.line + '"]');
      if(line) line.classList.add('now');
      const same = prev && !prev.end && prev.fn === s.fn;
      const names = Object.keys(s.vars);
      panel.querySelector('#traceWhat').innerHTML = what(s);
      panel.querySelector('#traceVars').innerHTML = names.length
        ? names.map(k => '<div class="tv' + (same && prev.vars[k] !== s.vars[k] ? ' changed' : '') + '"><span class="tv-name">' + esc(k) +
            '</span><code class="tv-val">' + esc(s.vars[k]) + '</code></div>').join('')
        : '<span class="trace-none">No variables yet.</span>';
      panel.querySelector('#traceScope').textContent = s.end ? 'Variables at the end' : s.fn ? 'Variables in ' + s.fn + '()' : 'Variables';
      panel.querySelector('#traceOut').textContent = s.out || '';
      panel.querySelector('#traceOutWrap').hidden = !s.out;
      panel.querySelector('#traceNum').textContent = 'Step ' + (i + 1) + ' of ' + steps.length;
      panel.querySelector('#traceRange').value = i;
      panel.querySelector('#tracePrev').disabled = i === 0;
      panel.querySelector('#traceNext').disabled = i === steps.length - 1;
      panel.querySelector('#traceCut').hidden = !(s.end && s.cut);
    }
    const go = n => { i = Math.max(0, Math.min(steps.length - 1, n)); render(); };
    panel.innerHTML =
      '<div class="trace-head"><span class="section-label">Step through it</span><span class="trace-num" id="traceNum"></span>' +
        '<button class="btn-ghost btn-small" id="traceClose" type="button">Done</button></div>' +
      '<p class="trace-what" id="traceWhat" aria-live="polite"></p>' +
      '<p class="trace-scope" id="traceScope"></p><div class="trace-vars" id="traceVars"></div>' +
      '<div id="traceOutWrap"><p class="trace-scope">Printed so far</p><pre class="trace-out" id="traceOut"></pre></div>' +
      '<p class="trace-cut" id="traceCut" hidden>Long loops are cut short; this is how it ends.</p>' +
      '<div class="trace-controls"><button class="btn-ghost" id="tracePrev" type="button">◀ Back</button>' +
        '<input type="range" id="traceRange" min="0" max="' + (steps.length - 1) + '" value="0" aria-label="Step">' +
        '<button class="btn-primary" id="traceNext" type="button">Next ▶</button></div>';
    panel.hidden = false;
    panel.querySelector('#tracePrev').addEventListener('click', () => go(i - 1));
    panel.querySelector('#traceNext').addEventListener('click', () => go(i + 1));
    panel.querySelector('#traceRange').addEventListener('input', e => go(+e.target.value));
    panel.querySelector('#traceClose').addEventListener('click', () => close(panel, codeEl));
    panel.onkeydown = e => {
      if(e.target.id === 'traceRange') return;
      if(e.key === 'ArrowRight'){ e.preventDefault(); go(i + 1); }
      if(e.key === 'ArrowLeft'){ e.preventDefault(); go(i - 1); }
    };
    render();
    panel.querySelector('#traceNext').focus();
    if(window.DebuggAnalytics) window.DebuggAnalytics.event('trace/opened');
  }

  function close(panel, codeEl){
    panel.hidden = true;
    panel.innerHTML = '';
    codeEl.querySelectorAll('.cl.now').forEach(el => el.classList.remove('now'));
  }

  return { stepsFor, open, close };
})();
