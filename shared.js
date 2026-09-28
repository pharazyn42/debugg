// Shared by the daily puzzle (index.html) and the sandbox (sandbox.html):
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

  // Every language with puzzles. `runnable` ones run in the sandbox; `studio` is the name Debugg Ltd
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
  // order of its puzzle file) of the day's difficulty, or the nearest difficulty if none is left
  // (easier first on a tie). Once all of a language's puzzles have been used, they're all available
  // again. It's worked out the same way in every browser, so everyone gets the same puzzle on the
  // same date. Adding puzzles to the end of a file only changes days that would otherwise have
  // fallen back to another difficulty; adding a language to ROTATION only changes days from its
  // first week on.
  const schedule = { next: 1, used: {}, bySlot: {} };
  function scheduled(slot){
    for(; schedule.next <= slot; schedule.next++){
      const d = schedule.next;
      if(slotDay(d) !== d) continue;  // Sundays share Saturday's puzzle
      const lang = langFor(d);
      const list = puzzlesFor(lang);
      const used = schedule.used[lang] || (schedule.used[lang] = new Set());
      if(used.size >= list.length) used.clear();
      const kind = dayKind(d);
      const want = kind === 'weekend' ? WEEKEND_STAND_IN : kind;
      let pick = null;
      for(let delta = 0; !pick && delta <= 4; delta++){
        for(const t of delta ? [want - delta, want + delta] : [want]){
          pick = list.find(p => !used.has(p) && (p.difficulty || 3) === t);
          if(pick) break;
        }
      }
      used.add(pick);
      schedule.bySlot[d] = pick;
    }
    return schedule.bySlot[slot];
  }

  // The day's puzzle (its `lang` says which language it's in).
  function puzzleFor(day){
    const slot = slotDay(day);
    if(slot >= 1) return scheduled(slot);
    // Preview days count backwards from the end of the first language's list.
    const list = puzzlesFor(langFor(slot));
    return list[(((slot - 1) % list.length) + list.length) % list.length];
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

  return { DEMO, SAVE_VERSION, isWipedVersion, LANG_INFO, LANGS, PUZZLE_FILES, ROTATION, langsBy, langFor, weekLangs,
           dayNumber, today, isPreview, dayLabel, launchDate, slotDay, previousSlot, isWeekend,
           dayKind, dayTitle, baseXp, puzzlesFor, puzzleFor, stateKey, readState, isFinished, normaliseAnswer,
           readXp, totalXp, levelStart, levelFor, highlight, escapeHtml };
})();
