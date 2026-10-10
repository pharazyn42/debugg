// What only the daily puzzle owns: its saved days, its XP and levels, and the clean-up when Day 1 moves.
// Load after shared.js and calendar.js, on the daily page only.
(function(D){
  const KEYS = D.KEYS;
  const LAUNCH = D.LAUNCH, OLD_LAUNCH = D.OLD_LAUNCH, slotDay = D.slotDay;
  const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A saved day: debuggit-daily-day<N>.
  const DAY_KEY_RE = new RegExp('^' + escapeRe(KEYS.daily.dayPrefix) + '-?\\d+$');
  const EPOCH_KEY = KEYS.shared.epoch;

  // If Day 1 has moved since this browser last played, every saved day number now points at a
  // different date. Clear what's keyed by day number (per-day progress and the streak) so an old save
  // can't show up as a new day already played. XP is kept; the other products' saves are not touched.
  (function resetOnNewCalendar(){
    try{
      const saved = localStorage.getItem(EPOCH_KEY);
      const keys = Object.keys(localStorage);
      const hasDays = keys.some(k => DAY_KEY_RE.test(k));
      const previous = saved !== null ? Number(saved) : (hasDays ? OLD_LAUNCH : LAUNCH);
      if(previous !== LAUNCH){
        keys.filter(k => DAY_KEY_RE.test(k) || k === KEYS.daily.streak).forEach(k => localStorage.removeItem(k));
      }
      localStorage.setItem(EPOCH_KEY, String(LAUNCH));
    }catch(e){}
  })();

  // One save per day, whatever the language. Keyed by slot, so a weekend puzzle has one save for
  // Saturday and Sunday.
  function stateKey(day){ return KEYS.daily.dayPrefix + slotDay(day); }
  function readState(day){
    try{ return JSON.parse(localStorage.getItem(stateKey(day))); }catch(e){ return null; }
  }
  function isFinished(day){
    const s = readState(day);
    return !!(s && (s.solved || s.revealed));
  }

  // --- XP and levels -------------------------------------------------------------
  // Puzzle XP is stored per language key: { python: 120, rust: 40 }. The overall XP is their total.
  function readXp(){
    try{
      const raw = JSON.parse(localStorage.getItem(KEYS.daily.xp));
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

  Object.assign(D, { stateKey, readState, isFinished, readXp, totalXp, levelStart, levelFor });
})(window.Debugg);
