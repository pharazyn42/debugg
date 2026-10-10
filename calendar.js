// The calendar and the puzzle bank's front door: the day numbers, the language rotation, which puzzle is
// today's and the puzzle formats. The daily puzzle uses all of it; Learn's sandbox (to replay past days) and
// Ltd's desk (to ask questions from past dailies) borrow some. It moves with the puzzles when they become
// their own package (PLAN.md, Phases 3-4). Load after shared.js (the kit) and before the pages' own scripts.
(function(D){
  // This is the demo. Its Day 1 is Monday 5 October 2026, and the puzzle changes at local midnight.
  // Days before it are preview days, numbered 0, -1, -2… and labelled "Preview".
  // The real launch date isn't set yet: v0.1 sets it, and resets all demo progress (see below).
  const LAUNCH = Date.UTC(2026, 9, 5);
  const DAY_MS = 24 * 60 * 60 * 1000;
  // The Day 1 date before this one, for saves made before the calendar remembered its date.
  const OLD_LAUNCH = Date.UTC(2026, 8, 27);

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

  Object.assign(D, { LAUNCH, OLD_LAUNCH, LANG_INFO, LANGS, PUZZLE_FILES, ROTATION, langsBy, langFor, weekLangs,
    dayNumber, today, isPreview, dayLabel, launchDate, slotDay, previousSlot, isWeekend,
    dayKind, dayTitle, baseXp, puzzlesFor, puzzleFor, firstRepeatDay, codeId, FORMATS, formatOf, formatFor });
})(window.Debugg);
