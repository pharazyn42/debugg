// Debuggit Learn: the course map, lessons and checkpoints on learn/index.html.
//
// A course is a list of units; a unit has lessons and a checkpoint; a lesson is a list of steps (see
// learn/README.md). Lessons unlock in order. A question answered wrongly comes back at the end of the
// lesson, so a lesson is finished once every question has been answered correctly; mistakes cost stars.
// A unit's checkpoint can be taken at any time ("test out"), and passing it unlocks the next unit.
// Every question missed, in a lesson or a checkpoint, also joins the review queue: it comes back in a
// short Review round a day later, then after 3 days and 7 days, until it's been right three times running.
//
// Learn keeps its own XP and streak, separate from the daily puzzles, in one save: debugg-learn.
// The lesson, checkpoint or review in progress is kept in debugg-learn-session, so a trip to the
// sandbox and back (or a reload) carries on where it was.
window.DebuggLearn = (function(){
  const D = window.Debugg;
  const L = window.DEBUGG_LEARN;
  const SAVE_KEY = 'debugg-learn';
  const SESSION_KEY = 'debugg-learn-session';
  const LESSON_XP = 10;       // for finishing a lesson the first time
  const STAR_XP = 5;          // per star, paid again only for stars beyond your best
  const CHECKPOINT_XP = 30;   // for passing a checkpoint the first time
  const REVIEW_XP = 2;        // per review question right first time
  const REVIEW_DAYS = [1, 3, 7];  // days until a missed question comes back, by how often it's been right since
  const REVIEW_ROUND = 8;     // questions in a review round at most
  // Stars for a lesson, by mistakes made: 0 → 3 stars, 1–2 → 2 stars, more → 1 star.
  function starsFor(mistakes){ return mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1; }

  const $ = id => document.getElementById(id);
  const esc = D.escapeHtml;
  const today = D.today();

  // --- The save -------------------------------------------------------------------------------
  // { lessons: { 'python/values/print': { stars } }, checkpoints: { 'python/values': { passed, best } },
  //   xp: { python: 40 }, streak: { count, lastDay },
  //   review: [ { lang, unit, lesson, q, box, due } ] }   // lesson null = the checkpoint; q = questionId()
  const blank = () => ({ lessons: {}, checkpoints: {}, xp: {}, streak: { count: 0, lastDay: null }, review: [] });
  function read(){
    try{
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if(s && typeof s === 'object') return Object.assign(blank(), s);
    }catch(e){}
    return blank();
  }
  function write(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){} }
  let save = read();

  // The Learn streak counts days with a lesson finished, a checkpoint passed or a review round done.
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

  // --- The review queue ---------------------------------------------------------------------------
  // Entries find their question by its text and code (questionId), so editing a unit's other steps
  // doesn't move them; one whose question has gone (or been reworded) is dropped. The checker makes
  // sure no two questions in a lesson or checkpoint share an id.
  const questionId = s => s.question + '\n' + (s.code || '');
  function reviewStep(r){
    const u = unitsOf(r.lang).find(x => x.id === r.unit);
    if(!u) return null;
    const steps = r.lesson == null ? u.checkpoint.steps : ((u.lessons.find(l => l.id === r.lesson) || {}).steps || []);
    const step = steps.find(s => isQuestion(s) && questionId(s) === r.q);
    return step ? { unit: u, step } : null;
  }
  // A missed question goes (back) to the start of the queue, due tomorrow.
  function addReview(u, lesson, step){
    const r = { lang: u.lang, unit: u.id, lesson: lesson ? lesson.id : null, q: questionId(step) };
    save.review = save.review.filter(x => !(x.lang === r.lang && x.unit === r.unit && x.lesson === r.lesson && x.q === r.q));
    save.review.push(Object.assign(r, { box: 0, due: today + REVIEW_DAYS[0] }));
    write();
  }
  function dueReviews(l){
    return save.review.filter(r => r.lang === l && r.due <= today && reviewStep(r)).sort((a, b) => a.due - b.due);
  }

  // --- The header, stats and course map ------------------------------------------------------------
  // With fromXp (the XP before something was just earned), the bar fills from there, from empty
  // after a level-up.
  function renderStats(fromXp){
    const xp = save.xp[lang] || 0;
    const lv = D.levelFor(xp), start = D.levelStart(lv), next = D.levelStart(lv + 1);
    const pct = x => Math.round((x - start) / (next - start) * 100);
    const from = fromXp == null ? pct(xp) : D.levelFor(fromXp) < lv ? 0 : pct(fromXp);
    $('stats').innerHTML =
      '<div class="stat"><span class="stat-label">Learn streak</span><span class="stat-value" id="learnStreak">' + streak() + '</span></div>' +
      '<div class="stat grow"><span class="stat-label">' + esc(L.courses[lang].name) + ' · Learn Lv <span id="learnLevel">' + lv + '</span></span>' +
        '<div class="xp-bar"><div class="xp-fill" id="xpFill" style="width:' + from + '%"></div></div>' +
        '<span class="stat-note" id="learnXp">' + xp + ' / ' + next + ' XP</span></div>';
    if(from !== pct(xp)) grow($('xpFill'), pct(xp));
  }
  // Sets a bar's width on the next frame, so its CSS transition runs from the width it was drawn at.
  function grow(el, pct){
    el.getBoundingClientRect();
    requestAnimationFrame(() => { el.style.width = pct + '%'; });
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
    const due = dueReviews(lang).length;
    const review = due ? '<div class="review-due" id="reviewDue"><span><b>Review</b> · ' + due + ' question' + (due > 1 ? 's' : '') +
      ' you missed before, back to check ' + (due > 1 ? 'they’ve' : 'it’s') + ' stuck</span>' +
      '<button class="btn-ghost btn-small" data-action="review" id="reviewBtn">Review ' + Math.min(due, REVIEW_ROUND) + ' →</button></div>' : '';
    const next = nextStep(lang);
    const started = Object.keys(save.lessons).concat(Object.keys(save.checkpoints)).some(k => k.startsWith(lang + '/'));
    if(next.kind === 'done'){
      const planned = (L.courses[lang].planned || [])[0];
      return '<section class="continue done" id="continue"><span class="continue-label">All caught up</span>' +
        '<h2>You’ve finished every unit written so far</h2>' +
        '<p>' + (planned ? 'Next up: <b>' + esc(planned) + '</b>, coming soon. ' : '') + 'Replay any lesson to earn more stars.</p>' + review + '</section>';
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
      '<h2>' + title + '</h2><p>' + where + ' · ' + detail + '</p></div>' + button + review + '</section>';
  }

  function renderMap(){
    session = null;
    dropSession();
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

  // A review round: up to REVIEW_ROUND due questions, from any unit, oldest first. Like a lesson, a
  // wrong answer comes back before the end.
  function startReview(){
    const items = dueReviews(lang).slice(0, REVIEW_ROUND).map(r => Object.assign({ entry: r }, reviewStep(r)));
    if(!items.length) return renderMap();
    session = { kind: 'review', items, unit: items[0].unit, steps: items.map(i => i.step), queue: items.map((_, i) => i),
                total: items.length, done: 0, mistakes: 0, missed: new Set() };
    track('review/started');
    next();
  }

  function next(){
    if(!session.queue.length) return finish();
    session.current = session.queue.shift();
    session.answered = false;
    if(session.kind === 'review') session.unit = session.items[session.current].unit;
    keepSession();
    renderStep();
  }

  // --- Keeping the session ------------------------------------------------------------------------
  // Saved by ids (and a review by its entries), after every step and answer. Dropped when it ends or
  // the course map is shown.
  function keepSession(){
    const s = session;
    const kept = { kind: s.kind, lang, unit: s.unit.id, lesson: s.lesson ? s.lesson.id : null, total: s.total,
                   queue: s.queue, current: s.current, answered: s.answered, done: s.done, mistakes: s.mistakes, correct: s.correct };
    if(s.kind === 'review'){
      kept.items = s.items.map(i => ({ lang: i.entry.lang, unit: i.entry.unit, lesson: i.entry.lesson, q: i.entry.q }));
      kept.missed = [...s.missed];
    }
    try{ localStorage.setItem(SESSION_KEY, JSON.stringify(kept)); }catch(e){}
  }
  function dropSession(){ try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }
  // Picks a kept session back up: an answered step moves on, as Continue would. One whose unit,
  // lesson or questions have changed since (or whose review entries have gone) is dropped.
  function resumeSession(){
    let k = null;
    try{ k = JSON.parse(localStorage.getItem(SESSION_KEY)); }catch(e){}
    if(!k || typeof k !== 'object' || k.lang !== lang || !Array.isArray(k.queue)) return false;
    const u = unitsOf(lang).find(x => x.id === k.unit);
    let s = null;
    if(k.kind === 'review' && Array.isArray(k.items)){
      const items = k.items.map(it => {
        const entry = save.review.find(r => r.lang === it.lang && r.unit === it.unit && r.lesson === it.lesson && r.q === it.q);
        const found = entry && reviewStep(entry);
        return found && Object.assign({ entry }, found);
      });
      if(items.length && items.every(Boolean))
        s = { kind: 'review', items, unit: items[0].unit, steps: items.map(i => i.step), missed: new Set(k.missed || []) };
    }else if(k.kind === 'lesson' && u){
      const les = u.lessons.find(l => l.id === k.lesson);
      if(les) s = { kind: 'lesson', unit: u, lesson: les, steps: les.steps };
    }else if(k.kind === 'checkpoint' && u) s = { kind: 'checkpoint', unit: u, steps: u.checkpoint.steps };
    const fits = i => Number.isInteger(i) && i >= 0 && s && i < s.steps.length;
    if(!s || s.steps.length !== k.total || !k.queue.every(fits) || !fits(k.current)) return false;
    session = Object.assign(s, { total: k.total, queue: k.queue, current: k.current, done: k.done || 0,
                                 mistakes: k.mistakes || 0, correct: k.correct || 0 });
    session.shownPct = Math.round(session.done / session.total * 100);
    renderStats();
    if(session.kind === 'review') session.unit = session.items[session.current].unit;
    if(k.answered) next();
    else{ session.answered = false; renderStep(); }
    return true;
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

  // "Run it yourself": a step's code in the sandbox (learn/sandbox.html), in a new tab so the lesson
  // stays open. Only for languages the sandbox runs. A fill-the-blank opens with the blank filled in.
  function runLink(s){
    const info = D.LANGS[lang];
    if(!s.code || !info || !info.runnable) return '';
    const code = s.type === 'blank' ? s.code.replace('___', s.options.find(o => o.correct).text) : s.code;
    return '<a class="run-link" href="sandbox.html?lang=' + lang + '&code=' + encodeURIComponent(code) + '" target="_blank" rel="noopener">Run it yourself ↗</a>';
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
      : session.kind === 'review' ? unitName + ' · a question you missed before'
      : unitName + ' · pass with ' + session.unit.checkpoint.pass;
    $('title').textContent = session.kind === 'lesson' ? session.lesson.title : session.kind === 'review' ? 'Review' : 'Checkpoint';
    $('sub').textContent = where;
    let body = '';
    let key = 0;
    const option = o => '<button class="option" data-action="choose" data-text="' + esc(o.text).replace(/"/g, '&quot;') + '">' +
      '<kbd class="key" aria-hidden="true">' + (++key) + '</kbd><code>' + esc(o.text) + '</code></button>';
    if(s.type === 'teach'){
      body = (s.title ? '<h3>' + esc(s.title) + '</h3>' : '') + '<p class="teach">' + s.text + '</p>' +
        (s.code ? codeHtml(s.code) : '') +
        (s.output !== undefined ? '<div class="output"><span class="output-label">Output</span><pre>' + esc(s.output) + '</pre></div>' : '') +
        runLink(s) + '<div class="step-actions"><button class="btn-primary" data-action="continue" id="continueBtn">Continue</button></div>';
    }else{
      body = '<p class="question">' + s.question + '</p>';
      if(s.type === 'choice'){
        body += (s.code ? codeHtml(s.code) : '') + '<div class="options">' + shuffle(s.options.slice()).map(option).join('') + '</div>';
      }else if(s.type === 'blank'){
        body += codeHtml(s.code, { gap: '___' }) + '<div class="options">' + shuffle(s.options.slice()).map(option).join('') + '</div>';
      }else if(s.type === 'predict'){
        body += codeHtml(s.code) + '<div class="guess-row"><input type="text" id="answer" placeholder="what gets printed?" autocomplete="off">' +
          '<button class="btn-primary" data-action="check" id="checkBtn">Check</button></div>';
      }else if(s.type === 'line'){
        body += codeHtml(s.code, { lines: true });
      }
      body += '<div class="feedback" id="stepFeedback" role="status"></div>' +
        '<div class="step-actions"><button class="btn-primary" data-action="continue" id="continueBtn" hidden>Continue</button></div>';
    }
    // The bar is drawn where it was on the last step, then slides on.
    const pct = Math.round(session.done / session.total * 100);
    const was = session.shownPct || 0;
    session.shownPct = pct;
    $('view').innerHTML =
      '<div class="session-top"><button class="btn-ghost btn-small" data-action="quit">← Course</button>' +
      '<div class="progress" aria-label="' + session.done + ' of ' + session.total + ' done"><div class="progress-fill" id="progressFill" style="width:' + was + '%"></div></div>' +
      '<span class="progress-num">' + session.done + '/' + session.total + '</span></div>' +
      '<article class="step" id="step" data-type="' + s.type + '">' + body + '</article>';
    if(was !== pct) grow($('progressFill'), pct);
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
    // The kiwi reacts: a hop when you're right, a wobble when you're not.
    const kiwi = '<img class="fb-mascot" src="../img/kiwi.svg" alt="" width="36" height="36">';
    document.querySelectorAll('#step .option, #step .code-line, #answer, #checkBtn').forEach(el => { el.disabled = true; });
    if(right){
      session.done++;
      if(session.kind === 'checkpoint') session.correct++;
      fb.className = 'feedback show correct';
      fb.innerHTML = kiwi + '<div><b>Correct.</b> ' + s.explain + runLink(s) + '</div>';
    }else{
      session.mistakes++;
      if(session.kind === 'checkpoint') session.done++;
      else session.queue.push(session.current);  // it comes back before the end
      if(session.kind === 'review') session.missed.add(session.current);
      else addReview(session.unit, session.kind === 'lesson' ? session.lesson : null, s);
      fb.className = 'feedback show wrong';
      fb.innerHTML = kiwi + '<div><b>Not quite.</b> ' + (whyWrong ? esc(whyWrong) + ' ' : '') +
        '<span class="right-answer">' + rightAnswerText(s) + '</span> ' + s.explain +
        '<span class="again">' + (session.kind === 'lesson' ? 'This one comes back before the end of the lesson, and in a review tomorrow.'
          : session.kind === 'review' ? 'This one comes back before the end of the review, and again tomorrow.'
          : 'This one comes back in a review tomorrow.') + '</span>' + runLink(s) + '</div>';
    }
    keepSession();
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
  // What the summary celebrates: a new Learn level, and the streak going up today.
  function celebrate(xpBefore, streakBefore){
    const lv = D.levelFor(save.xp[lang] || 0);
    let html = D.levelFor(xpBefore) < lv
      ? '<p class="level-up" id="levelUp">Level up! ' + esc(L.courses[lang].name) + ' · Learn Lv ' + lv + '</p>' : '';
    html += '<p class="streak-line">' + (streak() > streakBefore
      ? '<span class="streak-up" id="streakUp">Learn streak: <b>' + streak() + '</b> day' + (streak() > 1 ? 's' : '') + ', +1 today</span>'
      : 'Learn streak: <b>' + streak() + '</b>') + '</p>';
    return html;
  }
  // Stars that pop in one after another.
  function bigStars(n){
    return '<p class="big-stars" aria-label="' + n + ' of 3 stars">' +
      [0, 1, 2].map(i => '<span class="' + (i < n ? 'star on' : 'star') + '" style="animation-delay:' + (0.15 + i * 0.18) + 's">' + (i < n ? '★' : '☆') + '</span>').join('') + '</p>';
  }

  function finish(){
    const u = session.unit;
    const xpBefore = save.xp[lang] || 0, streakBefore = streak();
    let html = '';
    if(session.kind === 'review'){
      // Right first time moves a question to its next gap (1, 3, then 7 days); right three times
      // running, it's learnt and leaves the queue. Missed again, it starts over from tomorrow.
      let learnt = 0, again = 0;
      session.items.forEach((it, i) => {
        const r = it.entry;
        if(session.missed.has(i)){ r.box = 0; r.due = today + REVIEW_DAYS[0]; again++; return; }
        r.box++;
        if(r.box >= REVIEW_DAYS.length){ save.review = save.review.filter(x => x !== r); learnt++; }
        else r.due = today + REVIEW_DAYS[r.box];
      });
      const right = session.items.length - session.missed.size;
      const xp = REVIEW_XP * right;
      save.xp[lang] = (save.xp[lang] || 0) + xp;
      markStreak();
      write();
      track('review/done');
      const left = dueReviews(lang).length;
      html = '<div class="summary" id="summary"><img class="summary-mascot" src="../img/kiwi.svg" alt="The Debuggit kiwi" width="64" height="64">' +
        '<p class="big-score">' + right + '/' + session.items.length + '</p><h2>Review done</h2>' +
        '<p>' + right + ' right first time' + (xp ? ' <b>+' + xp + ' XP</b>' : '') + '.' +
        (learnt ? ' ' + learnt + ' learnt for good.' : '') +
        (again ? ' ' + again + ' will come back tomorrow.' : '') + '</p>' +
        celebrate(xpBefore, streakBefore) + '<div class="step-actions">' +
        (left ? '<button class="btn-primary" data-action="review">Review ' + Math.min(left, REVIEW_ROUND) + ' more</button>' : '') +
        '<button class="' + (left ? 'btn-ghost' : 'btn-primary') + '" data-action="quit">Back to the course</button></div></div>';
    }else if(session.kind === 'lesson'){
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
      html = '<div class="summary" id="summary"><img class="summary-mascot" src="../img/kiwi.svg" alt="The Debuggit kiwi" width="64" height="64">' + bigStars(stars) +
        '<h2>Lesson complete</h2><p>' + (session.mistakes ? session.mistakes + ' mistake' + (session.mistakes > 1 ? 's' : '') + ', all put right.' : 'No mistakes.') +
        ' <b>+' + xp + ' XP</b>' + (before && !xp ? ' (you’d already earned these stars)' : '') + '</p>' +
        celebrate(xpBefore, streakBefore) + '<div class="step-actions">' +
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
      html = '<div class="summary" id="summary"><img class="summary-mascot' + (passed ? '' : ' dizzy') + '" src="../img/kiwi.svg" alt="The Debuggit kiwi" width="64" height="64"><p class="big-score">' + session.correct + '/' + total + '</p>' +
        '<h2>' + (passed ? 'Checkpoint passed!' : 'Not this time') + '</h2>' +
        '<p>' + (passed ? (xp ? '<b>+' + xp + ' XP.</b> ' : '') + (nextUnit ? 'Unit ' + (units.indexOf(nextUnit) + 1) + ' is unlocked.' : 'That’s every unit written so far. More are coming.')
          : 'You need ' + u.checkpoint.pass + ' to pass. Go over the lessons, then try again: there’s no limit.') + '</p>' +
        (passed ? celebrate(xpBefore, streakBefore) : '') +
        '<div class="step-actions">' + (passed ? '' : '<button class="btn-primary" data-action="checkpoint" data-unit="' + u.id + '">Try again</button>') +
        '<button class="' + (passed ? 'btn-primary' : 'btn-ghost') + '" data-action="quit">Back to the course</button></div></div>';
    }
    session = null;
    dropSession();
    renderStats(xpBefore);
    $('view').innerHTML = html;
    const first = document.querySelector('#summary .btn-primary');
    if(first) first.focus();
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
    else if(a === 'review') startReview();
    else if(a === 'quit') renderMap();
    else if(a === 'continue') onContinue();
    else if(a === 'choose') onChoose(btn.dataset.text, btn);
    else if(a === 'check') onCheck();
    else if(a === 'pick-line') onPickLine(+btn.dataset.line, btn);
    else return;
    window.scrollTo(0, 0);
  });
  // Keys in a lesson: 1–9 pick an option (or a line of code, by its number), and Enter continues.
  document.addEventListener('keydown', e => {
    if(!session || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if(e.target && e.target.id === 'answer') return;  // typing an answer (its own Enter checks it)
    const cont = $('continueBtn');
    if(e.key === 'Enter' && cont && !cont.hidden){
      if(document.activeElement !== cont){ e.preventDefault(); cont.click(); }
      return;
    }
    if(!/^[1-9]$/.test(e.key) || session.answered) return;
    const n = +e.key;
    const target = document.querySelectorAll('#step .option')[n - 1] || document.querySelector('#step .code-line[data-line="' + n + '"]');
    if(target && !target.disabled){ e.preventDefault(); target.click(); }
  });
  window.addEventListener('hashchange', () => {
    const l = pickLang();
    if(l !== lang || !session){ lang = l; renderLangs(); renderMap(); focusUnit(); }
  });
  $('backupLink').addEventListener('click', () => window.DebuggBackup.open());
  $('resetLearn').addEventListener('click', e => {
    e.preventDefault();
    if(!confirm('Reset all your Learn progress: lessons, stars, Learn XP and the Learn streak? Daily puzzles aren’t affected.')) return;
    try{ localStorage.removeItem(SAVE_KEY); }catch(err){}
    save = read();
    renderMap();
  });

  renderLangs();
  // A lesson left open (e.g. for the sandbox) carries on, unless the address asks for a unit.
  if(location.hash.slice(1).split('/')[1] || !resumeSession()){
    renderMap();
    focusUnit();
  }

  // For tests: the step on screen, and the whole save.
  return { current: () => session && session.steps[session.current], progress: () => save };
})();
