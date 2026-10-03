// Shared by the daily puzzle (index.html), Debuggit Learn (learn/) and its sandbox (learn/sandbox.html):
// languages, the day calendar, saved puzzle progress and the syntax highlighter.
// Load after puzzles.js with a plain <script> tag, so pages still work when opened straight from disk.
window.Debugg = (function(){
  // This is the demo. Its Day 1 is Monday 5 October 2026, and the puzzle changes at local midnight.
  // Days before it are preview days, numbered 0, -1, -2… and labelled "Preview".
  // The real launch date isn't set yet: v0.1 sets it, and resets all demo progress (see below).
  const DEMO = true;
  const LAUNCH = Date.UTC(2026, 9, 5);
  const DAY_MS = 24 * 60 * 60 * 1000;
  // The Day 1 date before this one, for saves made before the calendar remembered its date.
  const OLD_LAUNCH = Date.UTC(2026, 8, 27);
  const EPOCH_KEY = 'debugg-epoch';

  // Save versions. Every save is marked with the version that made it (`debugg-version`). Saves from
  // a version in WIPED_VERSIONS lose all their progress on load, as the demo warns players: v0.1 sets
  // SAVE_VERSION to '0.1' and WIPED_VERSIONS to ['demo', ''] ('' is a save from before the marker).
  // Sandbox drafts are kept. Backup codes from a wiped version are refused (backup.js).
  const SAVE_VERSION = 'demo';
  // The versions players see (footer, What's new, releases), set by tools/release.js. Debuggit (the
  // daily puzzle), Debuggit Ltd and Debuggit Learn are released separately, each with its own
  // version, changelog and tags (see "Releases" in CLAUDE.md). Semantic versioning: 0.0.x during the
  // demo, 0.1.0 for the launch (which resets demo saves). All are separate from SAVE_VERSION, which
  // only changes when saves have to be reset.
  const APP_VERSION = '0.0.10';
  const LTD_VERSION = '0.0.15';
  const LEARN_VERSION = '0.0.16';
  // Per product: its version, where "seen" is kept, which saves mean a returning player, its What's
  // new and its changelog. `game` is the daily's old name, kept for callers that still pass it.
  const PRODUCTS = {
    daily: { version: APP_VERSION, seen: 'debugg-seen-version', name: 'Debuggit', label: '', page: 'whatsnew.html',
             log: 'CHANGELOG.md', returning: /^debugg-(day-?\d+|xp|streak)$/ },
    ltd:   { version: LTD_VERSION, seen: 'debugg-seen-ltd-version', name: 'Debuggit Ltd', label: 'Ltd ', page: 'whatsnew.html?ltd',
             log: 'ltd/CHANGELOG.md', returning: /^debugg-ltd$/ },
    learn: { version: LEARN_VERSION, seen: 'debugg-seen-learn-version', name: 'Debuggit Learn', label: 'Learn ', page: 'whatsnew.html?learn',
             log: 'learn/CHANGELOG.md', returning: /^debugg-learn$/ }
  };
  PRODUCTS.game = PRODUCTS.daily;
  const VERSION_KEY = 'debugg-version';
  const WIPED_VERSIONS = window.DEBUGG_WIPED_VERSIONS || [];
  function isWipedVersion(v){ return WIPED_VERSIONS.includes(v || ''); }
  (function wipeOldVersions(){
    try{
      const saved = localStorage.getItem(VERSION_KEY) || '';
      if(saved !== SAVE_VERSION && isWipedVersion(saved)){
        Object.keys(localStorage)
          .filter(k => (k.startsWith('debugg-') && !k.startsWith('debugg-sandbox-')) || k === 'contract-debugger-state-v3')
          .forEach(k => localStorage.removeItem(k));
      }
      localStorage.setItem(VERSION_KEY, SAVE_VERSION);
    }catch(e){}
  })();

  // If Day 1 has moved since this browser last played, every saved day number now points at a
  // different date. Clear what's keyed by day number (per-day progress, the streak, and Debugg
  // Ltd's list of paid puzzles) so an old save can't show up as a new day already played.
  // XP, a company and sandbox drafts are kept.
  (function resetOnNewCalendar(){
    try{
      const saved = localStorage.getItem(EPOCH_KEY);
      const keys = Object.keys(localStorage);
      const hasDays = keys.some(k => /^debugg-(\w+-)?day-?\d+$/.test(k));
      const previous = saved !== null ? Number(saved) : (hasDays ? OLD_LAUNCH : LAUNCH);
      if(previous !== LAUNCH){
        keys.filter(k => /^debugg-(\w+-)?day-?\d+$/.test(k) || k === 'debugg-streak').forEach(k => localStorage.removeItem(k));
        const company = JSON.parse(localStorage.getItem('debugg-ltd'));
        if(company && company.paid){
          company.paid = {};
          localStorage.setItem('debugg-ltd', JSON.stringify(company));
        }
      }
      localStorage.setItem(EPOCH_KEY, String(LAUNCH));
    }catch(e){}
  })();

  // Every language with puzzles. `runnable` ones run in the sandbox; `studio` is the name Debuggit Ltd
  // uses for it; `playground` makes a link that runs a snippet on another site.
  const LANG_INFO = {
    python: { name: 'Python', ext: 'py', indent: '    ', runnable: true, studio: 'Python' },
    javascript: { name: 'JavaScript', ext: 'js', indent: '  ', runnable: true, studio: 'JavaScript' },
    c: { name: 'C', ext: 'c', indent: '    ', studio: 'C/C++' },
    rust: { name: 'Rust', ext: 'rs', indent: '    ', studio: 'Rust',
            playground: code => ({ name: 'the Rust Playground',
              url: 'https://play.rust-lang.org/?version=stable&mode=debug&edition=2021&code=' + encodeURIComponent(code) }) }
  };
  // The puzzle files, one per language, in load order (the checker, tools/check-puzzles.js, reads them too).
  const PUZZLE_FILES = ['puzzles/python.js', 'puzzles/javascript.js', 'puzzles/c.js', 'puzzles/rust.js'];

  // --- The language rotation --------------------------------------------------
  // There's one puzzle a day, and the languages take turns. ROTATION lists the languages in play and
  // the day each one joins (`from`; left out, it's there from the start). Languages are introduced
  // gradually: add one here with the day it joins, once its puzzles are written and checked.
  //
  // Each week has six puzzle slots, Monday (easiest) to Friday (hardest) and the weekend. Languages
  // that have been in for NEW_LANG_WEEKS weeks or more share them in turn, shifting one slot along
  // each week, so over a few weeks every language gets every difficulty. A newcomer only gets
  // Monday and Tuesday for its first NEW_LANG_WEEKS weeks, so players meet it on the easy days.
  // window.DEBUGG_ROTATION overrides this for tests.
  const ROTATION = window.DEBUGG_ROTATION || [
    { lang: 'python' }
  ];
  const NEW_LANG_WEEKS = 2;
  const EASY_SLOTS = 2;  // Monday and Tuesday

  // Languages that have joined by `day`, keyed like LANG_INFO, in rotation order.
  function langsBy(day){
    const res = {};
    ROTATION.forEach(r => { if(r.from == null || r.from <= day) res[r.lang] = LANG_INFO[r.lang]; });
    return res;
  }
  // The languages players can see today (the sandbox's tabs, the Director's skills).
  const LANGS = langsBy(slotDay(dayNumber(new Date())));

  // Day number from the player's local calendar date (UTC maths avoids daylight-saving off-by-ones).
  function dayNumber(date){
    const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((today - LAUNCH) / DAY_MS) + 1;
  }
  function today(){ return dayNumber(new Date()); }
  function isPreview(day){ return day < 1; }
  // "Day 5", or "Preview" before launch. A weekend puzzle is "Days 3–4".
  function dayLabel(day){
    if(day < 1) return 'Preview';
    return isWeekend(day) ? 'Days ' + slotDay(day) + '–' + (slotDay(day) + 1) : 'Day ' + day;
  }

  // --- The weekly rotation ------------------------------------------------------
  // Monday is the easiest (difficulty 1) and Friday the hardest (5). Saturday and Sunday share one
  // weekend puzzle: it's saved under Saturday's day number (its "slot"), and solving it on either
  // day counts for both. Until the weekend code challenges exist, the weekend gets a hard puzzle.
  const DIFFICULTY_NAMES = { 1: 'warm-up', 2: 'easy', 3: 'medium', 4: 'tricky', 5: 'hard' };
  const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // XP for a first-guess, no-hint solve, by day. Extra guesses and hints scale it down.
  const BASE_XP = { 1: 60, 2: 80, 3: 100, 4: 120, 5: 150, weekend: 200 };
  const WEEKEND_STAND_IN = 5;

  function weekdayOf(day){ return new Date(LAUNCH + (day - 1) * DAY_MS).getUTCDay(); }  // 0 is Sunday
  function isWeekend(day){ const w = weekdayOf(day); return w === 0 || w === 6; }
  // The day a puzzle belongs to: Sunday shares Saturday's.
  function slotDay(day){ return weekdayOf(day) === 0 ? day - 1 : day; }
  function previousSlot(day){ return slotDay(slotDay(day) - 1); }
  // 1–5 for Monday to Friday, or 'weekend'.
  function dayKind(day){ return isWeekend(day) ? 'weekend' : weekdayOf(day); }
  function baseXp(day){ return BASE_XP[dayKind(day)]; }
  // e.g. "Thursday · tricky" or "Weekend · hard".
  function dayTitle(day){
    const kind = dayKind(day);
    return kind === 'weekend' ? 'Weekend · ' + DIFFICULTY_NAMES[WEEKEND_STAND_IN]
                              : WEEKDAY_NAMES[kind] + ' · ' + DIFFICULTY_NAMES[kind];
  }
  function launchDate(){
    const d = new Date(LAUNCH);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  // --- Puzzle formats ------------------------------------------------------------
  // How a puzzle is asked and answered (a puzzle's `format`; left out, it's 'output'). See
  // puzzles/README.md for each format's fields. `guesses` and `hints` are how many it allows.
  const FORMATS = {
    output: { name: 'what does this print?', guesses: 4, hints: 2 },
    choice: { name: 'multiple choice', guesses: 2, hints: 1 },
    value:  { name: 'what’s the value?', guesses: 4, hints: 2 },
    count:  { name: 'how many times?', guesses: 4, hints: 2 },
    error:  { name: 'will it error?', guesses: 2, hints: 1 },
    order:  { name: 'order the lines', guesses: 3, hints: 1 },
    bug:    { name: 'spot the bug', guesses: 4, hints: 2 },
    // The weekend code challenge: fix a function until its tests pass. Runs are unlimited; guesses are submissions.
    pass:   { name: 'make it pass', guesses: 4, hints: 2 }
  };
  function formatOf(p){ return (p && FORMATS[p.format]) ? p.format : 'output'; }
  // Which formats each weekday takes turns with, a week at a time, from Day 1 (Friday stays "what does
  // this print?"; the weekend is a code challenge). A day whose format has no
  // puzzle left falls back to 'output'. window.DEBUGG_WEEK_FORMATS overrides it for tests.
  const WEEK_FORMATS = window.DEBUGG_WEEK_FORMATS || { 1: ['choice', 'output', 'value'], 2: ['output', 'count'], 3: ['error', 'output', 'order'],
                         4: ['bug', 'output'], 5: ['output'], weekend: ['pass'] };
  function formatFor(day){
    const slot = slotDay(day);
    if(slot < 1) return 'output';
    const list = WEEK_FORMATS[dayKind(slot)];
    return list[weekOf(slot) % list.length];
  }

  function puzzlesFor(lang){
    return (window.DEBUGG_PUZZLES || []).filter(p => p.lang === lang);
  }

  // Week 0 starts on Day 1, a Monday. Its slots are its Monday to Saturday (Sunday shares Saturday's).
  function weekOf(day){ return Math.floor((day - 1) / 7); }
  function joinWeek(r){ return r.from == null ? -Infinity : weekOf(r.from); }

  // Which language each of week w's six slots gets (Monday first, the weekend last).
  function weekLangs(w){
    const inPlay = ROTATION.filter(r => joinWeek(r) <= w && puzzlesFor(r.lang).length);
    const newcomers = inPlay.filter(r => w - joinWeek(r) < NEW_LANG_WEEKS).map(r => r.lang);
    const settled = inPlay.filter(r => w - joinWeek(r) >= NEW_LANG_WEEKS).map(r => r.lang);
    const slots = [];
    for(let i = 0; i < 6; i++){
      if(!settled.length) slots.push(newcomers[(i + w) % newcomers.length]);
      else if(newcomers.length && i < EASY_SLOTS) slots.push(newcomers[(i + w) % newcomers.length]);
      else{
        const k = newcomers.length ? i - EASY_SLOTS : i;
        slots.push(settled[(k + w) % settled.length]);
      }
    }
    return slots;
  }
  // The language of a day's puzzle. Preview days (before Day 1) use the first language.
  function langFor(day){
    const slot = slotDay(day);
    if(slot < 1) return ROTATION[0].lang;
    const kind = dayKind(slot);
    return weekLangs(weekOf(slot))[kind === 'weekend' ? 5 : kind - 1];
  }

  // The schedule, from Day 1: each slot takes, in its language, the first unused puzzle (in the
  // order of its puzzle file) in the day's format (formatFor) at the day's difficulty; failing that,
  // the first unused "what does this print?" puzzle of the day's difficulty, or the nearest difficulty
  // if none is left (easier first on a tie). A puzzle is never served twice while the language has an
  // unused one, and the preview days' puzzles count as already served (PREVIEW_DAYS), so a puzzle
  // players have seen never comes back as a "new" day. Only when a language has used every puzzle does
  // the schedule start again, as a last resort: that day is recorded (firstRepeatDay) and
  // tools/check-puzzles.js fails well before it comes, so more puzzles get written in time. It's worked
  // out the same way in every browser, so everyone gets the same puzzle on the same date. Adding puzzles to the end of a file only changes days that would otherwise have
  // fallen back to another difficulty; adding a language to ROTATION only changes days from its
  // first week on.
  // How many preview days (0, -1, -2…) count as already served: the demo has been live for less than this.
  const PREVIEW_DAYS = 14;
  const schedule = { next: 1, used: {}, bySlot: {}, seeded: false, firstRepeat: null };
  function scheduled(slot){
    if(!schedule.seeded){
      schedule.seeded = true;
      for(let d = 0; d > -PREVIEW_DAYS; d--){
        const p = puzzleFor(d);
        if(p) (schedule.used[p.lang] || (schedule.used[p.lang] = new Set())).add(p);
      }
    }
    for(; schedule.next <= slot; schedule.next++){
      const d = schedule.next;
      if(slotDay(d) !== d) continue;  // Sundays share Saturday's puzzle
      const lang = langFor(d);
      const list = puzzlesFor(lang);
      const used = schedule.used[lang] || (schedule.used[lang] = new Set());
      if(used.size >= list.length){
        if(!schedule.firstRepeat) schedule.firstRepeat = { day: d, lang };
        used.clear();
      }
      const kind = dayKind(d);
      const want = kind === 'weekend' ? WEEKEND_STAND_IN : kind;
      // The day's format first (see WEEK_FORMATS), at the day's difficulty.
      const format = formatFor(d);
      let pick = format === 'output' ? null : list.find(p => !used.has(p) && formatOf(p) === format && (p.difficulty || 3) === want);
      for(let delta = 0; !pick && delta <= 4; delta++){
        for(const t of delta ? [want - delta, want + delta] : [want]){
          pick = list.find(p => !used.has(p) && formatOf(p) === 'output' && (p.difficulty || 3) === t);
          if(pick) break;
        }
      }
      if(!pick) pick = list.find(p => !used.has(p)) || list[0];  // only other formats left
      used.add(pick);
      schedule.bySlot[d] = pick;
    }
    return schedule.bySlot[slot];
  }

  // The first day whose puzzle has to be one that was already served (every puzzle of its language has
  // been used), as { day, lang }, or null if the schedule is fresh for `within` days from Day 1.
  function firstRepeatDay(within){
    const n = within || 1000;
    scheduled(n);
    return schedule.firstRepeat && schedule.firstRepeat.day <= n ? schedule.firstRepeat : null;
  }

  // The day's puzzle (its `lang` says which language it's in).
  function puzzleFor(day){
    const slot = slotDay(day);
    if(slot >= 1) return scheduled(slot);
    // Preview days count backwards from the end of the first language's "what does this print?" puzzles.
    const list = puzzlesFor(langFor(slot)).filter(p => formatOf(p) === 'output');
    return list[(((slot - 1) % list.length) + list.length) % list.length];
  }

  // A short id for a puzzle's code (FNV-1a, as hex), so data made from the code, like the step-through
  // traces in puzzles/traces-python.js, stays matched to it whatever order the puzzles are in.
  function codeId(code){
    let h = 0x811c9dc5;
    for(let i = 0; i < code.length; i++){ h ^= code.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }

  // One save per day, whatever the language. Keyed by slot, so a weekend puzzle has one save for
  // Saturday and Sunday.
  function stateKey(day){ return 'debugg-day' + slotDay(day); }
  function readState(day){
    try{ return JSON.parse(localStorage.getItem(stateKey(day))); }catch(e){ return null; }
  }
  function isFinished(day){
    const s = readState(day);
    return !!(s && (s.solved || s.revealed));
  }

  // Loose answer matching, so "[1, 2]", "1,2" and "1 2" all count, as do answers with or without
  // quotes. Colons keep their neighbours so dict output like {1: 'bool'} normalises to "1:bool".
  function normaliseAnswer(text){
    return String(text).toLowerCase()
      .replace(/['"`]/g, '')
      .replace(/[\[\]{}()]/g, ' ')
      .replace(/\s*:\s*/g, ':')
      .replace(/[\s,]+/g, ',')
      .replace(/^,|,$/g, '');
  }

  // --- XP and levels -------------------------------------------------------------
  // Puzzle XP is stored per language key: { python: 120, rust: 40 }. The overall XP is their total.
  function readXp(){
    try{
      const raw = JSON.parse(localStorage.getItem('debugg-xp'));
      if(raw && typeof raw === 'object') return raw;
    }catch(e){}
    return {};
  }
  // Level n starts at 100 * (n-1) * n / 2 XP: 0, 100, 300, 600, 1000, …
  // so each level needs 100 more XP than the one before.
  function levelStart(n){ return 100 * (n - 1) * n / 2; }
  function totalXp(xp){
    return Object.values(xp || readXp()).reduce((a, b) => a + (b > 0 ? b : 0), 0);
  }
  function levelFor(xp){
    let n = 1;
    while(xp >= levelStart(n + 1)) n++;
    return n;
  }

  // --- Syntax highlighting -----------------------------------------------------
  // Keywords and comment/string syntax for the tiny highlighter, per language.
  const SYNTAX = {
    python: {
      keywords: ['def','return','if','elif','else','for','while','in','not','and','or','is',
        'try','except','finally','raise','with','as','import','from','class','lambda','pass','break',
        'continue','None','True','False','global','nonlocal','yield','del','assert'],
      comment: '#.*$',
      string: `"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'`
    },
    javascript: {
      keywords: ['const','let','var','function','return','if','else','for','while','do','of','in','new',
        'typeof','instanceof','true','false','null','undefined','this','class','extends','try','catch',
        'finally','throw','break','continue','switch','case','default','async','await'],
      comment: '\\/\\/.*$',
      string: `"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\``
    },
    c: {
      keywords: ['int','char','short','long','unsigned','signed','float','double','void','const','static',
        'struct','union','enum','typedef','sizeof','return','if','else','for','while','do','switch','case',
        'default','break','continue','goto','NULL','bool','true','false'],
      comment: '\\/\\/.*$|\\/\\*.*?\\*\\/',
      string: `"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)'|#\\w+`
    },
    rust: {
      keywords: ['fn','let','mut','const','static','if','else','match','for','while','loop','in','return',
        'break','continue','struct','enum','impl','trait','pub','use','mod','as','ref','move','self','Self',
        'true','false','Some','None','Ok','Err','where','dyn','type','unsafe'],
      comment: '\\/\\/.*$',
      string: `b?"(?:[^"\\\\]|\\\\.)*"|b?'(?:[^'\\\\]|\\\\.)'`
    }
  };
  const compiled = {};
  function syntaxFor(lang){
    if(!compiled[lang]){
      const s = SYNTAX[lang];
      compiled[lang] = {
        keywords: new Set(s.keywords),
        source: '(' + s.comment + ')|(' + s.string + ')|(\\b\\d\\w*(?:\\.\\d+)?\\b)|([A-Za-z_$][\\w$]*!?)(?=\\s*\\()|([A-Za-z_$][\\w$]*)'
      };
    }
    return compiled[lang];
  }

  function escapeHtml(t){
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // --- The wordmark ---------------------------------------------------------------
  // The game is called Debuggit, and its wordmark is a line of code: "debug it" written in the day's
  // puzzle language. (The share text and picture start with `debuggit.daily()`, the daily's button.) The sandbox's heading is `debuggit.run()`;
  // the other pages are named by the buttons at the top, so they have no wordmark of their own.
  // It's coloured by the same highlighter as the puzzles.
  const NAME = 'Debuggit';
  const WORDMARKS = {
    python:     { code: 'debugg(it)',   lang: 'python' },
    javascript: { code: 'debugg.it()',  lang: 'javascript' },
    c:          { code: 'debugg(&it);', lang: 'c' },
    rust:       { code: 'debugg!(it)',  lang: 'rust' },
    sandbox:    { code: 'debuggit.run()', lang: 'javascript', label: NAME + ' Sandbox' }
  };
  // The wordmark's text for a language or page ('python', 'sandbox'; anything else gets the default,
  // debugg.it()), with no page element needed.
  function wordmarkFor(which){ return (WORDMARKS[which] || WORDMARKS.javascript).code; }
  // Fills `el` with the wordmark for a language or page. Screen readers hear the plain name.
  function renderWordmark(el, which){
    const w = WORDMARKS[which] || WORDMARKS.javascript;
    el.innerHTML = '<span aria-hidden="true">' + highlight(w.code, w.lang) + '</span>';
    el.setAttribute('aria-label', w.label || NAME);
    el.title = w.label || NAME;
    el.dataset.wordmark = w.code;
  }

  // Highlights one line of code: comments, strings, numbers, keywords and called names.
  function highlight(text, lang){
    const syn = syntaxFor(lang);
    const re = new RegExp(syn.source, 'g');
    let out = '', last = 0, m;
    while((m = re.exec(text))){
      out += escapeHtml(text.slice(last, m.index));
      const tok = escapeHtml(m[0]);
      if(m[1]) out += '<span class="com">' + tok + '</span>';
      else if(m[2]) out += '<span class="str">' + tok + '</span>';
      else if(m[3]) out += '<span class="num">' + tok + '</span>';
      else if(m[4]) out += '<span class="' + (syn.keywords.has(m[4]) ? 'kw' : 'fn') + '">' + tok + '</span>';
      else out += syn.keywords.has(m[5]) ? '<span class="kw">' + tok + '</span>' : tok;
      last = m.index + m[0].length;
    }
    return out + escapeHtml(text.slice(last));
  }

  // The footer's version link to What's new, for the daily ('daily'), Ltd ('ltd') or Learn ('learn'). A returning
  // player sees "new" until they've looked at What's new for this version; a first visit just
  // remembers the version, quietly. `root` is the way back to the site's top folder from a page in a
  // subfolder (learn/ passes '../').
  function renderVersion(el, root = '', product = 'daily'){
    if(!el) return;
    const P = PRODUCTS[product];
    let seen = null;
    try{
      seen = localStorage.getItem(P.seen);
      const returning = Object.keys(localStorage).some(k => P.returning.test(k));
      if(!seen && !returning){ seen = P.version; localStorage.setItem(P.seen, P.version); }
    }catch(e){}
    const fresh = seen !== null && seen !== P.version;
    el.innerHTML = '<a class="version-link' + (fresh ? ' new' : '') + '" href="' + root + P.page + '" title="What’s new in ' + P.name + '">' +
      P.label + 'v' + P.version + (DEMO ? ' demo' : '') + (fresh ? ' · new' : '') + '</a>';
  }
  function markVersionSeen(product = 'daily'){ try{ localStorage.setItem(PRODUCTS[product].seen, PRODUCTS[product].version); }catch(e){} }

  return { NAME, APP_VERSION, LTD_VERSION, LEARN_VERSION, PRODUCTS, renderVersion, markVersionSeen, renderWordmark, wordmarkFor, DEMO, SAVE_VERSION, isWipedVersion, LANG_INFO, LANGS, PUZZLE_FILES, ROTATION, langsBy, langFor, weekLangs,
           dayNumber, today, isPreview, dayLabel, launchDate, slotDay, previousSlot, isWeekend,
           dayKind, dayTitle, baseXp, puzzlesFor, puzzleFor, firstRepeatDay, codeId, FORMATS, formatOf, formatFor, stateKey, readState, isFinished, normaliseAnswer,
           readXp, totalXp, levelStart, levelFor, highlight, escapeHtml };
})();
