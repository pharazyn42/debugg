// Shared by the daily puzzle (index.html) and the sandbox (sandbox.html):
// languages, the day calendar, saved puzzle progress and the syntax highlighter.
// Load after puzzles.js with a plain <script> tag, so pages still work when opened straight from disk.
window.Debugg = (function(){
  // Day 1 is 1 October 2026. The puzzle changes at local midnight.
  // Days before it are preview days, numbered 0, -1, -2… and labelled "Preview".
  // Saves are keyed by day number, so once players have real progress this date must not change.
  const LAUNCH = Date.UTC(2026, 9, 1);
  const DAY_MS = 24 * 60 * 60 * 1000;
  // The Day 1 date before this one, for saves made before the calendar remembered its date.
  const OLD_LAUNCH = Date.UTC(2026, 8, 27);
  const EPOCH_KEY = 'debugg-epoch';

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

  const ALL_LANGS = {
    python: { name: 'Python', ext: 'py', indent: '    ' },
    javascript: { name: 'JavaScript', ext: 'js', indent: '  ' }
  };
  // The languages players can see. JavaScript is switched off for the soft launch: its puzzles,
  // sandbox runner and saves are all kept, and adding it back here brings everything back.
  // window.DEBUGG_LANGS overrides this, so tests keep covering the hidden languages.
  const ENABLED_LANGS = window.DEBUGG_LANGS || ['python'];
  const LANGS = {};
  ENABLED_LANGS.forEach(k => { if(ALL_LANGS[k]) LANGS[k] = ALL_LANGS[k]; });

  // Day number from the player's local calendar date (UTC maths avoids daylight-saving off-by-ones).
  function dayNumber(date){
    const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((today - LAUNCH) / DAY_MS) + 1;
  }
  function today(){ return dayNumber(new Date()); }
  function isPreview(day){ return day < 1; }
  // "Day 5", or "Preview" before launch.
  function dayLabel(day){ return day < 1 ? 'Preview' : 'Day ' + day; }
  function launchDate(){
    const d = new Date(LAUNCH);
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }

  // Each language has its own daily puzzle, cycling through that language's list.
  function puzzlesFor(lang){
    return window.DEBUGG_PUZZLES.filter(p => p.lang === lang);
  }
  function puzzleFor(lang, day){
    const list = puzzlesFor(lang);
    // Preview days count backwards from the end of the list.
    return list[(((day - 1) % list.length) + list.length) % list.length];
  }

  // Python keeps the original key so progress saved before languages existed still loads.
  function stateKey(lang, day){
    return lang === 'python' ? 'debugg-day' + day : 'debugg-' + lang + '-day' + day;
  }
  function readState(lang, day){
    try{ return JSON.parse(localStorage.getItem(stateKey(lang, day))); }catch(e){ return null; }
  }
  function isFinished(lang, day){
    const s = readState(lang, day);
    return !!(s && (s.solved || s.revealed));
  }

  // --- XP and levels -------------------------------------------------------------
  // Puzzle XP is stored per language key: { python: 120, javascript: 40 }.
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
    }
  };
  const compiled = {};
  function syntaxFor(lang){
    if(!compiled[lang]){
      const s = SYNTAX[lang];
      compiled[lang] = {
        keywords: new Set(s.keywords),
        source: '(' + s.comment + ')|(' + s.string + ')|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_$][\\w$]*)(?=\\s*\\()|([A-Za-z_$][\\w$]*)'
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

  return { LANGS, dayNumber, today, isPreview, dayLabel, launchDate, puzzlesFor, puzzleFor, stateKey, readState, isFinished,
           readXp, levelStart, levelFor, highlight, escapeHtml };
})();
