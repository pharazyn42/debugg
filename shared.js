// Shared by the daily puzzle (index.html) and the sandbox (sandbox.html):
// languages, the day calendar, saved puzzle progress and the syntax highlighter.
// Load after puzzles.js with a plain <script> tag, so pages still work when opened straight from disk.
window.Debugg = (function(){
  // Day 1 is 27 September 2026. The puzzle changes at local midnight.
  const LAUNCH = Date.UTC(2026, 8, 27);
  const DAY_MS = 24 * 60 * 60 * 1000;

  const LANGS = {
    python: { name: 'Python', ext: 'py', indent: '    ' },
    javascript: { name: 'JavaScript', ext: 'js', indent: '  ' }
  };

  // Day number from the player's local calendar date (UTC maths avoids daylight-saving off-by-ones).
  function dayNumber(date){
    const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.max(1, Math.floor((today - LAUNCH) / DAY_MS) + 1);
  }
  function today(){ return dayNumber(new Date()); }

  // Each language has its own daily puzzle, cycling through that language's list.
  function puzzlesFor(lang){
    return window.DEBUGG_PUZZLES.filter(p => p.lang === lang);
  }
  function puzzleFor(lang, day){
    const list = puzzlesFor(lang);
    return list[(day - 1) % list.length];
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

  return { LANGS, dayNumber, today, puzzlesFor, puzzleFor, stateKey, readState, isFinished, highlight, escapeHtml };
})();
