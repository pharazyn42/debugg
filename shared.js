// The site kit, loaded by every page of every product (the daily puzzle, Debuggit Learn, Debuggit Ltd): the
// save keys, the product versions and the footer's version link, the wordmark, the syntax highlighter and
// answer matching. It knows nothing about the calendar or the puzzles; that is calendar.js. Each product
// keeps a copy of this file.
// Load with a plain <script> tag, so pages still work when opened straight from disk.
window.Debugg = (function(){
  // This is the demo. Its Day 1 is Monday 5 October 2026, and the puzzle changes at local midnight.
  // Days before it are preview days, numbered 0, -1, -2… and labelled "Preview".
  // The real launch date isn't set yet: v0.1 sets it, and resets all demo progress (see below).
  const DEMO = true;

  // Every localStorage key the site writes, by owner. Nothing else spells a key out, so splitting the
  // products later (their own prefixes) is a change here. `prefixes` is what isOurKey() matches on.
  const KEYS = {
    // Every prefix a save key can start with; isOurKey() matches any. Each product has its own
    // (debuggit-daily-, debuggit-ltd-, debuggit-learn-) under the shared family prefix.
    prefixes: ['debuggit-'],
    daily: { prefix: 'debuggit-daily-', xp: 'debuggit-daily-xp', streak: 'debuggit-daily-streak', dayPrefix: 'debuggit-daily-day',
             practicePrefix: 'debuggit-daily-practice-day', demoSeen: 'debuggit-daily-demo-seen', seen: 'debuggit-daily-seen-version' },
    ltd:   { save: 'debuggit-ltd-save', seen: 'debuggit-ltd-seen-version', demoSeen: 'debuggit-ltd-demo-seen' },
    learn: { save: 'debuggit-learn-save', session: 'debuggit-learn-session', collapsed: 'debuggit-learn-collapsed',
             lang: 'debuggit-learn-lang', sandboxPrefix: 'debuggit-learn-sandbox-', seen: 'debuggit-learn-seen-version' },
    shared: { version: 'debuggit-version', epoch: 'debuggit-daily-epoch', oldLtd: 'contract-debugger-state-v3' }
  };
  const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function isOurKey(k){ return KEYS.prefixes.some(p => k.startsWith(p)); }

  // Save versions. Every save is marked with the version that made it (`debuggit-version`). Saves from
  // a version in WIPED_VERSIONS lose all their progress on load, as the demo warns players: v0.1 sets
  // SAVE_VERSION to '0.1' and WIPED_VERSIONS to ['demo', ''] ('' is a save from before the marker).
  // Sandbox drafts are kept. Backup codes from a wiped version are refused (backup.js).
  const SAVE_VERSION = 'demo';
  // The versions players see (footer, What's new, releases), set by tools/release.js. Debuggit (the
  // daily puzzle), Debuggit Ltd and Debuggit Learn are released separately, each with its own
  // version, changelog and tags (see "Releases" in CLAUDE.md). Semantic versioning: 0.0.x during the
  // demo, 0.1.0 for the launch (which resets demo saves). All are separate from SAVE_VERSION, which
  // only changes when saves have to be reset.
  const APP_VERSION = '0.0.11';
  const LTD_VERSION = '0.0.18';
  const LEARN_VERSION = '0.0.17';
  // Per product: its version, where "seen" is kept, which saves mean a returning player, its What's
  // new and its changelog. `game` is the daily's old name, kept for callers that still pass it.
  const PRODUCTS = {
    daily: { version: APP_VERSION, seen: KEYS.daily.seen, name: 'Debuggit', label: '', page: 'whatsnew.html',
             log: 'CHANGELOG.md', returning: new RegExp('^(?:' + escapeRe(KEYS.daily.dayPrefix) + '-?\\d+|' + escapeRe(KEYS.daily.xp) + '|' + escapeRe(KEYS.daily.streak) + ')$') },
    ltd:   { version: LTD_VERSION, seen: KEYS.ltd.seen, name: 'Debuggit Ltd', label: 'Ltd ', page: 'ltd/whatsnew.html',
             log: 'ltd/CHANGELOG.md', returning: new RegExp('^' + escapeRe(KEYS.ltd.save) + '$') },
    learn: { version: LEARN_VERSION, seen: KEYS.learn.seen, name: 'Debuggit Learn', label: 'Learn ', page: 'learn/whatsnew.html',
             log: 'learn/CHANGELOG.md', returning: new RegExp('^' + escapeRe(KEYS.learn.save) + '$') }
  };
  PRODUCTS.game = PRODUCTS.daily;
  const VERSION_KEY = KEYS.shared.version;
  const WIPED_VERSIONS = window.DEBUGG_WIPED_VERSIONS || [];
  function isWipedVersion(v){ return WIPED_VERSIONS.includes(v || ''); }
  (function wipeOldVersions(){
    try{
      const saved = localStorage.getItem(VERSION_KEY) || '';
      if(saved !== SAVE_VERSION && isWipedVersion(saved)){
        Object.keys(localStorage)
          .filter(k => (isOurKey(k) && !k.startsWith(KEYS.learn.sandboxPrefix)) || k === KEYS.shared.oldLtd)
          .forEach(k => localStorage.removeItem(k));
      }
      localStorage.setItem(VERSION_KEY, SAVE_VERSION);
    }catch(e){}
  })();

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
  // puzzle language. Each app's header has its own title, the same as its button at the top:
  // `debuggit.daily()` (which also starts the share text and picture), `debuggit.learn()`,
  // `debuggit.ltd()`, and the sandbox's `debuggit.run()`. It's coloured by the same highlighter as the puzzles.
  const NAME = 'Debuggit';
  const WORDMARKS = {
    python:     { code: 'debugg(it)',   lang: 'python' },
    javascript: { code: 'debugg.it()',  lang: 'javascript' },
    c:          { code: 'debugg(&it);', lang: 'c' },
    rust:       { code: 'debugg!(it)',  lang: 'rust' },
    daily:      { code: 'debuggit.daily()', lang: 'javascript', label: NAME },
    learn:      { code: 'debuggit.learn()', lang: 'javascript', label: NAME + ' Learn' },
    ltd:        { code: 'debuggit.ltd()',   lang: 'javascript', label: NAME + ' Ltd' },
    sandbox:    { code: 'debuggit.run()',   lang: 'javascript', label: NAME + ' Sandbox' }
  };
  // The wordmark's text for a language or page ('python', 'learn'; anything else gets the default,
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

  return { NAME, KEYS, isOurKey, APP_VERSION, LTD_VERSION, LEARN_VERSION, PRODUCTS, renderVersion, markVersionSeen,
           renderWordmark, wordmarkFor, DEMO, SAVE_VERSION, isWipedVersion, normaliseAnswer, highlight, escapeHtml };
})();
