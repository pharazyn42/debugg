// Debuggit Ltd's desk: the questions in desk jobs, and the player that asks them.
//
// Desk jobs (see "The desk" in ltd.js) are bundles of 1 to 3 questions drawn from two places:
//   - past daily puzzles (never today's), asked in their own format; "order the lines" puzzles are
//     asked as "what does this print?", with the lines in order, and weekend code challenges are left out;
//   - Debuggit Learn's questions, from any written unit (their unit files are loaded on demand).
// Each question gets one answer. Ids are stable across visits: 'd:<codeId>' for a daily puzzle,
// 'l:<lang>/<unit>:<codeId of question + code>' for a Learn question.
window.DebuggDesk = (function(){
  const D = window.Debugg;
  const esc = D.escapeHtml;
  const PAST_SLOTS = 40;  // how far back past dailies come from

  // --- Loading Learn's units -------------------------------------------------------------------
  let loading = null;
  function load(root = '../'){  // the site's top folder, from ltd/index.html
    if(loading) return loading;
    const L = window.DEBUGG_LEARN;
    const files = L ? Object.values(L.courses).flatMap(c => c.files || []) : [];
    const have = new Set((L ? L.units : []).map(u => u.lang + '/' + u.id));
    loading = Promise.all(files.map(f => new Promise(resolve => {
      // A unit file already on the page (say, loaded by Learn) isn't loaded twice.
      if(document.querySelector('script[data-desk-unit="' + f + '"]')) return resolve();
      const s = document.createElement('script');
      s.src = root + f;
      s.dataset.deskUnit = f;
      s.onload = s.onerror = () => resolve();
      document.head.appendChild(s);
    }))).then(() => {
      // Unit files push onto DEBUGG_LEARN.units; drop any loaded twice.
      if(L){
        const seen = new Set();
        L.units = L.units.filter(u => { const k = u.lang + '/' + u.id; if(seen.has(k)) return false; seen.add(k); return true; });
      }
      return have;
    });
    return loading;
  }

  // --- Questions ----------------------------------------------------------------------------------
  // { id, source, label, prompt (HTML), code, kind: 'typed'|'choice'|'line', answers, display,
  //   options: [{ text, correct, why }], line, explain (HTML), difficulty, lang }
  const code = t => '<code>' + esc(t) + '</code>';
  function fromDaily(p){
    const f = D.formatOf(p);
    const q = { id: 'd:' + D.codeId(p.code), source: 'daily', label: 'A past daily puzzle', code: p.code, explain: p.explain,
                difficulty: p.difficulty || 3, lang: p.lang, display: p.display };
    if(f === 'choice' || f === 'error'){
      q.kind = 'choice';
      q.prompt = f === 'error' ? 'Does it run fine, or stop with an error?' : 'What does this print?';
      q.options = p.options.map(t => ({ text: t, correct: t === p.display }));
    }else if(f === 'bug'){
      q.kind = 'line';
      q.line = p.bugLine;
      q.prompt = 'It should print ' + code(p.expected) + ' but prints ' + code(p.display) + '. Tap the line with the bug.';
      q.display = 'line ' + p.bugLine;
    }else{
      q.kind = 'typed';
      q.answers = p.answers || [p.display];
      q.prompt = f === 'value' ? 'What’s the value of ' + code(p.ask.name) + ' when it finishes?'
               : f === 'count' ? 'How many times does line ' + p.ask.line + ' run?'
               : 'What does this print?';
    }
    return q;
  }
  function fromLearn(u, s){
    const q = { id: 'l:' + u.lang + '/' + u.id + ':' + D.codeId(s.question + '\n' + (s.code || '')), source: 'learn',
                label: 'Learn · ' + u.title, prompt: s.question, code: s.code || '', explain: s.explain, difficulty: 1, lang: u.lang };
    if(s.type === 'choice' || s.type === 'blank'){
      q.kind = 'choice';
      q.options = s.options.map(o => ({ text: o.text, correct: !!o.correct, why: o.why }));
      q.display = s.options.find(o => o.correct).text;
      if(s.type === 'blank') q.gap = true;
    }else if(s.type === 'predict'){
      q.kind = 'typed';
      q.answers = s.answers;
      q.display = s.display;
    }else if(s.type === 'line'){
      q.kind = 'line';
      q.line = s.line;
      q.display = 'line ' + s.line;
    }else return null;
    return q;
  }

  // Every question a desk job can use today, by id.
  function all(today){
    const out = new Map();
    const slot = D.slotDay(today);
    for(let d = D.previousSlot(today), n = 0; n < PAST_SLOTS; d = D.previousSlot(d), n++){
      const p = D.puzzleFor(d);
      // Never today's puzzle, and never a weekend code challenge (it needs an editor, not one answer).
      if(p && p !== D.puzzleFor(slot) && D.formatOf(p) !== 'pass'){
        const q = fromDaily(p);
        out.set(q.id, q);
      }
    }
    ((window.DEBUGG_LEARN || {}).units || []).forEach(u => {
      [u.lessons.flatMap(l => l.steps), u.checkpoint ? u.checkpoint.steps : []].flat().forEach(s => {
        if(s.type === 'teach') return;
        const q = fromLearn(u, s);
        if(q) out.set(q.id, q);
      });
    });
    return out;
  }

  // --- The player -------------------------------------------------------------------------------
  function codeHtml(q, tappable){
    return '<pre class="desk-code"><code>' + q.code.split('\n').map((line, i) => {
      let body = D.highlight(line, q.lang);
      if(q.gap) body = body.replace('___', '<span class="desk-gap">___</span>');
      const inner = '<span class="ln">' + (i + 1) + '</span>' + body;
      return tappable ? '<button type="button" class="desk-line" data-line="' + (i + 1) + '">' + inner + '</button>' : '<span class="desk-row">' + inner + '</span>';
    }).join('') + '</code></pre>';
  }
  function shuffle(a){
    a = a.slice();
    for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  // Asks `questions` in turn in `box`, one answer each. `answered` holds answers already given (a job
  // picked up again after a reload carries on from the next question); onAnswer(right) fires as
  // each is given, so it can be saved at once, and onDone([true, false, …]) at the end.
  function play(box, questions, { answered = [], onAnswer = () => {}, onDone = () => {} } = {}){
    const results = answered.slice();
    let i = results.length;
    if(i >= questions.length){ onDone(results); return; }
    function ask(){
      const q = questions[i];
      let html = '<div class="desk-q" data-kind="' + q.kind + '" data-qid="' + esc(q.id) + '">' +
        '<div class="desk-q-head"><span class="desk-q-num">Question ' + (i + 1) + ' of ' + questions.length + '</span>' +
        '<span class="desk-q-src">' + esc(q.label) + '</span></div>' +
        '<p class="desk-prompt">' + q.prompt + '</p>' + (q.code ? codeHtml(q, q.kind === 'line') : '');
      if(q.kind === 'choice'){
        html += '<div class="desk-options">' + shuffle(q.options).map(o =>
          '<button type="button" class="desk-option" data-text="' + esc(o.text).replace(/"/g, '&quot;') + '"><code>' + esc(o.text) + '</code></button>').join('') + '</div>';
      }else if(q.kind === 'typed'){
        html += '<div class="desk-typed"><input type="text" class="desk-input" placeholder="your answer" autocomplete="off" aria-label="Your answer">' +
          '<button type="button" class="btn-primary btn-small desk-check">Check</button></div>';
      }
      html += '<div class="desk-feedback" role="status"></div></div>';
      box.innerHTML = html;
      const input = box.querySelector('.desk-input');
      if(input){
        input.focus();
        input.addEventListener('keydown', e => { if(e.key === 'Enter' && !e.isComposing){ e.preventDefault(); box.querySelector('.desk-check').click(); } });
      }
    }
    function mark(right, why){
      const q = questions[i];
      results.push(right);
      onAnswer(right);
      box.querySelectorAll('.desk-option, .desk-line, .desk-input, .desk-check').forEach(el => { el.disabled = true; });
      const fb = box.querySelector('.desk-feedback');
      fb.className = 'desk-feedback show ' + (right ? 'right' : 'wrong');
      const last = i === questions.length - 1;
      fb.innerHTML = (right ? '<b>Right.</b> ' : '<b>Not quite.</b> ' + (why ? esc(why) + ' ' : '') + 'The answer: ' + code(q.display) + '. ') +
        q.explain + '<div class="desk-next"><button type="button" class="btn-primary btn-small desk-go">' + (last ? 'Finish' : 'Next question') + '</button></div>';
      fb.querySelector('.desk-go').focus();
    }
    box.onclick = e => {
      const q = questions[i];
      const opt = e.target.closest('.desk-option:not(:disabled)');
      if(opt){
        const o = q.options.find(x => x.text === opt.dataset.text);
        opt.classList.add(o.correct ? 'right' : 'wrong');
        if(!o.correct){
          const r = [...box.querySelectorAll('.desk-option')].find(b => b.dataset.text === q.display);
          if(r) r.classList.add('right');
        }
        return mark(!!o.correct, o.why);
      }
      const line = e.target.closest('.desk-line:not(:disabled)');
      if(line){
        const n = +line.dataset.line;
        line.classList.add(n === q.line ? 'right' : 'wrong');
        if(n !== q.line){ const r = box.querySelector('.desk-line[data-line="' + q.line + '"]'); if(r) r.classList.add('right'); }
        return mark(n === q.line);
      }
      if(e.target.closest('.desk-check:not(:disabled)')){
        const val = box.querySelector('.desk-input').value.trim();
        if(!val) return;
        return mark(q.answers.some(a => D.normaliseAnswer(a) === D.normaliseAnswer(val)));
      }
      if(e.target.closest('.desk-go')){
        i++;
        if(i < questions.length) ask();
        else{ box.onclick = null; onDone(results); }
      }
    };
    ask();
  }

  return { load, all, play, fromDaily, fromLearn };
})();
