// Debuggit Learn: the course map, lessons and checkpoints on learn/index.html.
//
// A course is a list of units; a unit has lessons and a checkpoint; a lesson is a list of steps (see
// learn/README.md). Lessons unlock in order. A question answered wrongly comes back at the end of the
// lesson, so a lesson is finished once every question has been answered correctly; mistakes cost stars.
// A unit's checkpoint can be taken at any time ("test out"), and passing it unlocks the next unit.
//
// Learn keeps its own XP and streak, separate from the daily puzzles, in one save: debugg-learn.
window.DebuggLearn = (function(){
  const D = window.Debugg;
  const L = window.DEBUGG_LEARN;
  const SAVE_KEY = 'debugg-learn';
  const LESSON_XP = 10;       // for finishing a lesson the first time
  const STAR_XP = 5;          // per star, paid again only for stars beyond your best
  const CHECKPOINT_XP = 30;   // for passing a checkpoint the first time
  // Stars for a lesson, by mistakes made: 0 → 3 stars, 1–2 → 2 stars, more → 1 star.
  function starsFor(mistakes){ return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1; }

  const $ = id => document.getElementById(id);
  const esc = D.escapeHtml;
  const today = D.today();

  // --- The save -------------------------------------------------------------------------------
  // { lessons: { 'python/values/print': { stars } }, checkpoints: { 'python/values': { passed, best } },
  //   xp: { python: 40 }, streak: { count, lastDay } }
  function read(){
    try{
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if(s && typeof s === 'object') return Object.assign({ lessons: {}, checkpoints: {}, xp: {}, streak: { count: 0, lastDay: null } }, s);
    }catch(e){}
    return { lessons: {}, checkpoints: {}, xp: {}, streak: { count: 0, lastDay: null } };
  }
  function write(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
  let save = read();

  // The Learn streak counts days with a lesson finished or a checkpoint passed.
  function streak(){ return save.streak.lastDay != null && save.streak.lastDay >= today - 1 ? save.streak.count : 0; }
  function markStreak(){
    if(save.streak.lastDay === today) return;
    save.streak = { count: streak() + 1, lastDay: today };
  }
  function track(path){ if(window.DebuggAnalytics) window.DebuggAnalytics.event('learn/' + path); }

  // --- The course -----------------------------------------------------------------------------
  const langs = Object.keys(L.courses);
  // The address picks the course, and optionally a unit to show: learn/#python or learn/#python/strings
  // (the daily puzzle and Debuggit Ltd link in this way).
  function pickLang(){
    const h = location.hash.slice(1).split('/')[0];
    return L.courses[h] ? h : langs[0];
  }
  function focusUnit(){
    const id = location.hash.slice(1).split('/')[1];
    const el = id && document.querySelector('.unit[data-unit="' + CSS.escape(id) + '"]');
    if(!el) return;
    el.classList.add('focus');
    el.scrollIntoView({ block: 'start' });
  }
  let lang = pickLang();
  const unitsOf = l => L.units.filter(u => u.lang === l);
  const lessonKey = (u, les) => u.lang + '/' + u.id + '/' + les.id;
  const unitKey = u => u.lang + '/' + u.id;
  const lessonDone = (u, les) => !!save.lessons[lessonKey(u, les)];
  const unitPassed = u => !!(save.checkpoints[unitKey(u)] && save.checkpoints[unitKey(u)].passed);
  // A unit is open once the one before it has been passed (the first is always open).
  function unitOpen(u){
    const list = unitsOf(u.lang);
    const i = list.indexOf(u);
    return i === 0 || unitPassed(list[i - 1]);
  }
  // A lesson is open once the one before it is done, or the unit's checkpoint has been passed.
  function lessonOpen(u, i){
    return unitOpen(u) && (i === 0 || unitPassed(u) || lessonDone(u, u.lessons[i - 1]));
  }
  const isQuestion = s => s.type !== 'teach';

  // --- The header, stats and course map ------------------------------------------------------------
  function renderStats(){
    const xp = save.xp[lang] || 0;
    const lv = D.levelFor(xp), start = D.levelStart(lv), next = D.levelStart(lv + 1);
    $('stats').innerHTML =
      '<div class="stat"><span class="stat-label">Learn streak</span><span class="stat-value" id="learnStreak">' + streak() + '</span></div>' +
      '<div class="stat grow"><span class="stat-label">' + esc(L.courses[lang].name) + ' · Learn Lv <span id="learnLevel">' + lv + '</span></span>' +
        '<div class="xp-bar"><div class="xp-fill" style="width:' + Math.round((xp - start) / (next - start) * 100) + '%"></div></div>' +
        '<span class="stat-note" id="learnXp">' + xp + ' / ' + next + ' XP</span></div>';
  }

  function renderLangs(){
    const nav = $('langs');
    nav.hidden = langs.length < 2;
    nav.innerHTML = langs.map(l => '<a class="lang-tab" href="#' + l + '"' + (l === lang ? ' aria-current="page"' : '') + '>' +
      esc(L.courses[l].name) + (L.courses[l].soon ? ' <span class="soon-badge">soon</span>' : '') + '</a>').join('');
  }

  function starText(n){ return '★'.repeat(n) + '☆'.repeat(3 - n); }

  // What to do next in a course: the first unit not yet passed, and in it the first lesson not
  // done yet, or its checkpoint once every lesson is. A unit passed by testing out counts as done.
  // Returns { kind: 'lesson' | 'checkpoint' | 'done', unit, unitIndex, lesson, lessonIndex }.
  function nextStep(l){
    const units = unitsOf(l);
    for(let ui = 0; ui < units.length; ui++){
      const u = units[ui];
      if(unitPassed(u)) continue;
      if(!unitOpen(u)) break;
      const li = u.lessons.findIndex((les, i) => !lessonDone(u, les) && lessonOpen(u, i));
      if(li >= 0) return { kind: 'lesson', unit: u, unitIndex: ui, lesson: u.lessons[li], lessonIndex: li };
      return { kind: 'checkpoint', unit: u, unitIndex: ui };
    }
    return { kind: 'done' };
  }
  // The card at the top of the course map: pick up where you left off in one tap.
  function continueHTML(){
    if(L.courses[lang].soon || !unitsOf(lang).length) return '';
    const next = nextStep(lang);
    const started = Object.keys(save.lessons).concat(Object.keys(save.checkpoints)).some(k => k.startsWith(lang + '/'));
    if(next.kind === 'done'){
      const planned = (L.courses[lang].planned || [])[0];
      return '<section class="continue done" id="continue"><span class="continue-label">All caught up</span>' +
        '<h2>You’ve finished every unit written so far</h2>' +
        '<p>' + (planned ? 'Next up: <b>' + esc(planned) + '</b>, coming soon. ' : '') + 'Replay any lesson to earn more stars.</p></section>';
    }
    const u = next.unit;
    const where = 'Unit ' + (next.unitIndex + 1) + ': ' + esc(u.title);
    const title = next.kind === 'lesson' ? esc(next.lesson.title) : 'Checkpoint';
    const detail = next.kind === 'lesson'
      ? 'Lesson ' + (next.lessonIndex + 1) + ' of ' + u.lessons.length
      : 'Pass it to unlock the next unit';
    const button = next.kind === 'lesson'
      ? '<button class="btn-primary" data-action="lesson" data-unit="' + u.id + '" data-lesson="' + next.lesson.id + '">' + (started ? 'Continue' : 'Start') + ' →</button>'
      : '<button class="btn-primary" data-action="checkpoint" data-unit="' + u.id + '">Take the checkpoint →</button>';
    return '<section class="continue" id="continue"><div class="continue-text">' +
      '<span class="continue-label">' + (started ? 'Continue' : 'Start here') + '</span>' +
      '<h2>' + title + '</h2><p>' + where + ' · ' + detail + '</p></div>' + button + '</section>';
  }

  function renderMap(){
    session = null;
    $('title').textContent = 'Learn ' + L.courses[lang].name;
    $('sub').textContent = L.courses[lang].soon
      ? 'The ' + L.courses[lang].name + ' course is coming soon. Here’s what it will cover.'
      : 'Short lessons that build up from the very start. Get each question right to move on.';
    renderStats();
    const units = unitsOf(lang);
    let html = continueHTML();
    units.forEach((u, ui) => {
      const open = unitOpen(u);
      const passed = unitPassed(u);
      const allDone = u.lessons.every(les => lessonDone(u, les));
      html += '<section class="unit' + (open ? '' : ' locked') + (passed ? ' passed' : '') + '" data-unit="' + u.id + '">' +
        '<div class="unit-head"><span class="unit-num">Unit ' + (ui + 1) + '</span>' +
        (passed ? '<span class="unit-badge">✓ passed</span>' : '') + '</div>' +
        '<h2>' + esc(u.title) + '</h2><p class="unit-summary">' + esc(u.summary) + '</p>';
      if(!open){
        html += '<p class="unit-lock">Pass Unit ' + ui + '’s checkpoint to unlock.</p></section>';
        return;
      }
      html += '<ol class="lessons">';
      u.lessons.forEach((les, i) => {
        const rec = save.lessons[lessonKey(u, les)];
        const can = lessonOpen(u, i);
        html += '<li><button class="lesson-row' + (rec ? ' done' : '') + '" data-action="lesson" data-unit="' + u.id + '" data-lesson="' + les.id + '"' +
          (can ? '' : ' disabled') + '>' +
          '<span class="lesson-name">' + (i + 1) + '. ' + esc(les.title) + '</span>' +
          '<span class="lesson-state">' + (rec ? '<span class="stars" aria-label="' + rec.stars + ' of 3 stars">' + starText(rec.stars) + '</span>'
            : can ? 'Start →' : '🔒') + '</span></button></li>';
      });
      const cp = u.checkpoint;
      const best = save.checkpoints[unitKey(u)];
      const qs = cp.steps.filter(isQuestion).length;
      html += '<li><button class="lesson-row checkpoint' + (passed ? ' done' : '') + '" data-action="checkpoint" data-unit="' + u.id + '">' +
        '<span class="lesson-name">Checkpoint · ' + qs + ' questions, pass with ' + cp.pass + '</span>' +
        '<span class="lesson-state">' + (passed ? best.best + '/' + qs : allDone ? 'Take it →' : 'Test out →') + '</span></button></li></ol>';
      if(!allDone && !passed) html += '<p class="unit-note">Already know this? Pass the checkpoint to skip ahead.</p>';
      html += '</section>';
    });
    let num = units.length;
    const planned = title => '<section class="unit planned"><div class="unit-head"><span class="unit-num">Unit ' + (++num) + '</span>' +
      '<span class="unit-badge soon">coming soon</span></div><h2>' + esc(title) + '</h2></section>';
    (L.courses[lang].planned || []).forEach(title => { html += planned(title); });
    // Later parts of the course (e.g. C's Embedded C), under their own heading.
    (L.courses[lang].sections || []).forEach(s => {
      html += '<div class="course-section" data-section="' + esc(s.id) + '"><h2 class="section-title">' + esc(s.title) + '</h2>' +
        (s.summary ? '<p class="section-summary">' + esc(s.summary) + '</p>' : '') + '</div>';
      (s.planned || []).forEach(title => { html += planned(title); });
    });
    $('view').innerHTML = html;
  }

  // --- Lessons and checkpoints ------------------------------------------------------------------
  // session: { kind, unit, lesson, queue: [step index], total, done, mistakes, correct, answered, current }
  let session = null;

  function startLesson(u, les){
    const steps = les.steps;
    session = { kind: 'lesson', unit: u, lesson: les, steps, queue: steps.map((_, i) => i),
                total: steps.length, done: 0, mistakes: 0 };
    track('started/' + lessonKey(u, les));
    next();
  }
  function startCheckpoint(u){
    const steps = u.checkpoint.steps;
    session = { kind: 'checkpoint', unit: u, steps, queue: steps.map((_, i) => i),
                total: steps.length, done: 0, correct: 0, mistakes: 0 };
    next();
  }

  function next(){
    if(!session.queue.length) return finish();
    session.current = session.queue.shift();
    session.answered = false;
    renderStep();
  }

  function codeHtml(code, opts = {}){
    const lines = code.split('\n');
    return '<pre class="editor"><code>' + lines.map((line, i) => {
      let body = D.highlight(line, lang);
      if(opts.gap) body = body.replace('___', '<span class="gap" id="gap">' + esc(opts.gap) + '</span>');
      const inner = '<span class="ln">' + (i + 1) + '</span>' + body;
      return opts.lines ? '<button class="code-line" data-action="pick-line" data-line="' + (i + 1) + '">' + inner + '</button>' : inner;
    }).join(opts.lines ? '' : '\n') + '</code></pre>';
  }

  function shuffle(a){
    for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function renderStep(){
    const s = session.steps[session.current];
    const unitName = 'Unit ' + (unitsOf(lang).indexOf(session.unit) + 1) + ': ' + session.unit.title;
    const where = session.kind === 'lesson'
      ? unitName + ' · lesson ' + (session.unit.lessons.indexOf(session.lesson) + 1) + ' of ' + session.unit.lessons.length
      : unitName + ' · pass with ' + session.unit.checkpoint.pass;
    $('title').textContent = session.kind === 'lesson' ? session.lesson.title : 'Checkpoint';
    $('sub').textContent = where;
    let body = '';
    if(s.type === 'teach'){
      body = (s.title ? '<h3>' + esc(s.title) + '</h3>' : '') + '<p class="teach">' + s.text + '</p>' +
        (s.code ? codeHtml(s.code) : '') +
        (s.output !== undefined ? '<div class="output"><span class="output-label">Output</span><pre>' + esc(s.output) + '</pre></div>' : '') +
        '<div class="step-actions"><button class="btn-primary" data-action="continue" id="continueBtn">Continue</button></div>';
    }else{
      body = '<p class="question">' + s.question + '</p>';
      if(s.type === 'choice'){
        body += (s.code ? codeHtml(s.code) : '') + '<div class="options">' +
          shuffle(s.options.slice()).map(o => '<button class="option" data-action="choose" data-text="' + esc(o.text).replace(/"/g, '&quot;') + '">' +
            '<code>' + esc(o.text) + '</code></button>').join('') + '</div>';
      }else if(s.type === 'blank'){
        body += codeHtml(s.code, { gap: '___' }) + '<div class="options">' +
          shuffle(s.options.slice()).map(o => '<button class="option" data-action="choose" data-text="' + esc(o.text).replace(/"/g, '&quot;') + '">' +
            '<code>' + esc(o.text) + '</code></button>').join('') + '</div>';
      }else if(s.type === 'predict'){
        body += codeHtml(s.code) + '<div class="guess-row"><input type="text" id="answer" placeholder="what gets printed?" autocomplete="off">' +
          '<button class="btn-primary" data-action="check" id="checkBtn">Check</button></div>';
      }else if(s.type === 'line'){
        body += codeHtml(s.code, { lines: true });
      }
      body += '<div class="feedback" id="stepFeedback" role="status"></div>' +
        '<div class="step-actions"><button class="btn-primary" data-action="continue" id="continueBtn" hidden>Continue</button></div>';
    }
    const pct = Math.round(session.done / session.total * 100);
    $('view').innerHTML =
      '<div class="session-top"><button class="btn-ghost btn-small" data-action="quit">← Course</button>' +
      '<div class="progress" aria-label="' + session.done + ' of ' + session.total + ' done"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="progress-num">' + session.done + '/' + session.total + '</span></div>' +
      '<article class="step" id="step" data-type="' + s.type + '">' + body + '</article>';
    const input = $('answer');
    if(input){
      input.focus();
      // Enter checks the answer. preventDefault stops the same key press from also landing on the
      // Continue button, which gets the focus as soon as the answer is marked.
      input.addEventListener('keydown', e => {
        if(e.key !== 'Enter' || e.isComposing) return;
        e.preventDefault();
        $('checkBtn').click();
      });
    }else if(s.type === 'teach') $('continueBtn').focus();
  }

  // Marks the current question right or wrong and shows why.
  function answer(right, whyWrong){
    if(session.answered) return;
    session.answered = true;
    const s = session.steps[session.current];
    const fb = $('stepFeedback');
    document.querySelectorAll('#step .option, #step .code-line, #answer, #checkBtn').forEach(el => { el.disabled = true; });
    if(right){
      session.done++;
      if(session.kind === 'checkpoint') session.correct++;
      fb.className = 'feedback show correct';
      fb.innerHTML = '<b>Quack! Correct.</b> ' + s.explain;
    }else{
      session.mistakes++;
      if(session.kind === 'lesson') session.queue.push(session.current);  // it comes back later
      else session.done++;
      fb.className = 'feedback show wrong';
      fb.innerHTML = '<b>Not quite.</b> ' + (whyWrong ? esc(whyWrong) + ' ' : '') +
        '<span class="right-answer">' + rightAnswerText(s) + '</span> ' + s.explain +
        (session.kind === 'lesson' ? '<span class="again">This one comes back before the end of the lesson.</span>' : '');
    }
    $('continueBtn').hidden = false;
    $('continueBtn').focus();
  }
  function rightAnswerText(s){
    if(s.type === 'choice' || s.type === 'blank') return 'The answer is <code>' + esc(s.options.find(o => o.correct).text) + '</code>.';
    if(s.type === 'predict') return 'It prints <code>' + esc(s.display) + '</code>.';
    if(s.type === 'line') return 'It’s line ' + s.line + '.';
    return '';
  }

  function onChoose(text, btn){
    const s = session.steps[session.current];
    const opt = s.options.find(o => o.text === text);
    if(s.type === 'blank' && $('gap')) $('gap').textContent = text;
    btn.classList.add(opt.correct ? 'right' : 'wrong');
    if(!opt.correct){
      const right = [...document.querySelectorAll('#step .option')].find(b => b.dataset.text === s.options.find(o => o.correct).text);
      if(right) right.classList.add('right');
    }
    answer(!!opt.correct, opt.why);
  }
  function onCheck(){
    const s = session.steps[session.current];
    const val = $('answer').value.trim();
    if(!val) return;
    const right = s.answers.some(a => D.normaliseAnswer(a) === D.normaliseAnswer(val));
    answer(right, right ? '' : s.nudge);
  }
  function onPickLine(n, btn){
    const s = session.steps[session.current];
    btn.classList.add(n === s.line ? 'right' : 'wrong');
    if(n !== s.line){
      const right = document.querySelector('#step .code-line[data-line="' + s.line + '"]');
      if(right) right.classList.add('right');
    }
    answer(n === s.line, n === s.line ? '' : 'Line ' + n + ' is fine.');
  }
  function onContinue(){
    const s = session.steps[session.current];
    if(s.type === 'teach') session.done++;
    next();
  }

  // --- Finishing ----------------------------------------------------------------------------------
  function finish(){
    const u = session.unit;
    let html = '';
    if(session.kind === 'lesson'){
      const key = lessonKey(u, session.lesson);
      const stars = starsFor(session.mistakes);
      const before = save.lessons[key];
      const best = before ? Math.max(before.stars, stars) : stars;
      const xp = (before ? 0 : LESSON_XP) + STAR_XP * (best - (before ? before.stars : 0));
      save.lessons[key] = { stars: best };
      save.xp[lang] = (save.xp[lang] || 0) + xp;
      markStreak();
      write();
      track('lesson/' + key + '/' + stars + '-stars');
      const i = u.lessons.indexOf(session.lesson);
      const nextLesson = u.lessons[i + 1];
      html = '<div class="summary" id="summary"><img class="summary-duck" src="../img/duck.svg" alt="The Debuggit duck" width="64" height="64"><p class="big-stars" aria-label="' + stars + ' of 3 stars">' + starText(stars) + '</p>' +
        '<h2>Lesson complete</h2><p>' + (session.mistakes ? session.mistakes + ' mistake' + (session.mistakes > 1 ? 's' : '') + ', all put right.' : 'No mistakes.') +
        ' <b>+' + xp + ' XP</b>' + (before && !xp ? ' (you’d already earned these stars)' : '') + '</p>' +
        '<p>Learn streak: <b>' + streak() + '</b></p><div class="step-actions">' +
        (nextLesson ? '<button class="btn-primary" data-action="lesson" data-unit="' + u.id + '" data-lesson="' + nextLesson.id + '">Next: ' + esc(nextLesson.title) + '</button>'
          : '<button class="btn-primary" data-action="checkpoint" data-unit="' + u.id + '">Take the checkpoint</button>') +
        '<button class="btn-ghost" data-action="quit">Back to the course</button></div></div>';
    }else{
      const key = unitKey(u);
      const total = session.steps.filter(isQuestion).length;
      const passed = session.correct >= u.checkpoint.pass;
      const before = save.checkpoints[key];
      let xp = 0;
      if(passed){
        if(!(before && before.passed)) xp = CHECKPOINT_XP;
        save.checkpoints[key] = { passed: true, best: Math.max(session.correct, before ? before.best || 0 : 0) };
        save.xp[lang] = (save.xp[lang] || 0) + xp;
        markStreak();
      }
      write();
      track('checkpoint/' + key + '/' + (passed ? 'passed' : 'not-passed'));
      const units = unitsOf(lang);
      const nextUnit = units[units.indexOf(u) + 1];
      html = '<div class="summary" id="summary"><img class="summary-duck' + (passed ? '' : ' dizzy') + '" src="../img/duck.svg" alt="The Debuggit duck" width="64" height="64"><p class="big-score">' + session.correct + '/' + total + '</p>' +
        '<h2>' + (passed ? 'Checkpoint passed!' : 'Not this time') + '</h2>' +
        '<p>' + (passed ? (xp ? '<b>+' + xp + ' XP.</b> ' : '') + (nextUnit ? 'Unit ' + (units.indexOf(nextUnit) + 1) + ' is unlocked.' : 'That’s every unit written so far. More are coming.')
          : 'You need ' + u.checkpoint.pass + ' to pass. Go over the lessons, then try again: there’s no limit.') + '</p>' +
        '<div class="step-actions">' + (passed ? '' : '<button class="btn-primary" data-action="checkpoint" data-unit="' + u.id + '">Try again</button>') +
        '<button class="' + (passed ? 'btn-primary' : 'btn-ghost') + '" data-action="quit">Back to the course</button></div></div>';
    }
    session = null;
    renderStats();
    $('view').innerHTML = html;
  }

  // --- Events -------------------------------------------------------------------------------------
  function unitById(id){ return unitsOf(lang).find(u => u.id === id); }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if(!btn || btn.disabled) return;
    const a = btn.dataset.action;
    if(a === 'lesson'){
      const u = unitById(btn.dataset.unit);
      startLesson(u, u.lessons.find(l => l.id === btn.dataset.lesson));
    }else if(a === 'checkpoint') startCheckpoint(unitById(btn.dataset.unit));
    else if(a === 'quit') renderMap();
    else if(a === 'continue') onContinue();
    else if(a === 'choose') onChoose(btn.dataset.text, btn);
    else if(a === 'check') onCheck();
    else if(a === 'pick-line') onPickLine(+btn.dataset.line, btn);
    else return;
    window.scrollTo(0, 0);
  });
  window.addEventListener('hashchange', () => {
    const l = pickLang();
    if(l !== lang || !session){ lang = l; renderLangs(); renderMap(); focusUnit(); }
  });
  $('resetLearn').addEventListener('click', e => {
    e.preventDefault();
    if(!confirm('Reset all your Learn progress: lessons, stars, Learn XP and the Learn streak? Daily puzzles aren’t affected.')) return;
    try{ localStorage.removeItem(SAVE_KEY); }catch(err){}
    save = read();
    renderMap();
  });

  renderLangs();
  renderMap();
  focusUnit();

  // For tests: the step on screen, and the whole save.
  return { current: () => session && session.steps[session.current], progress: () => save };
})();
