// Debuggit Ltd: the studio, team and contract board, around the daily puzzles.
//
// Loaded by index.html only when the studio is switched on (see the loader there).
// The puzzle page never depends on this file. When a daily puzzle ends, the page fires
// a 'debugg:puzzle-finished' event; this file listens and pays the company for it.
// The puzzles are the Director's desk.
//
// DebuggLtd.start({ stats, studio, board }) builds the studio into those three slots
// and starts the game. It either resumes the saved company, imports a save from before
// the merge (when the studio lived at /studio/), or founds a new one.
window.DebuggLtd = (function(){
  const D = window.Debugg;

  // Desk pay: each daily puzzle pays for the XP it earned (100 XP for a first-guess,
  // no-hint solve, so ¤200 and 5 reputation), plus a streak bonus on solves:
  // +10% per day of streak beyond the first, up to +50%.
  const CASH_PER_XP = 2;
  const XP_PER_REP = 20;
  const STREAK_BONUS_PER_DAY = 0.10;
  const STREAK_BONUS_CAP = 0.50;
  // A new company starts with ¤150, plus ¤1 per puzzle XP already earned (up to ¤1,000).
  const START_CASH = 150;
  const FOUNDER_BONUS_CAP = 1000;
  // Puzzle levels boost contract success in that language: +1% per level above 1, up to +10%.
  const DIRECTOR_BOOST_PER_LEVEL = 0.01;
  const DIRECTOR_BOOST_CAP = 0.10;
  // Desk payments are remembered for this many days, so nothing is paid twice.
  const PAID_MEMORY_DAYS = 14;

  function start(slots){
    const statsSlot = slots.stats, studioSlot = slots.studio, boardSlot = slots.board;

    // ---------------------------------------------------------------------
    // Markup
    // ---------------------------------------------------------------------

    [statsSlot, studioSlot, boardSlot].forEach(el => { el.classList.add('ltd'); el.hidden = false; });
    statsSlot.innerHTML =
      '<div class="stat-bar">' +
        '<div class="stat"><div class="label">Cash</div><div class="value money" id="statMoney">¤0</div></div>' +
        '<div class="stat"><div class="label">Reputation</div><div class="value rep" id="statRep">0</div></div>' +
        '<div class="stat"><div class="label">Payroll</div><div class="value rate" id="statPayroll">¤0/min</div></div>' +
        '<div class="stat"><div class="label">Headcount</div><div class="value" id="statHeads">1</div></div>' +
      '</div>' +
      '<div class="toast" id="welcomeToast"></div>';
    studioSlot.innerHTML =
      '<div class="panel">' +
        '<h2>Studio <span class="tag" id="rosterCount">1 person</span></h2>' +
        '<div id="guide"></div>' +
        '<div class="structure" id="structure"></div>' +
        '<p class="structure-note" id="structureNote"></p>' +
        '<div class="roster" id="roster"></div>' +
        '<div class="hire-grid" id="hireGrid"></div>' +
        '<h3>Applicants</h3>' +
        '<div class="applicants" id="applicants"></div>' +
      '</div>';
    boardSlot.innerHTML =
      '<div class="panel">' +
        '<h2>Contract board <span class="tag">staff a team to take one on</span></h2>' +
        '<div class="board" id="board"></div>' +
        '<h3>In progress</h3>' +
        '<div class="jobs" id="jobs"></div>' +
        '<h3>Recent</h3>' +
        '<div class="log" id="log"></div>' +
      '</div>' +
      '<div class="company-controls">Debuggit Ltd <span class="beta">beta</span> · ' +
        '<button class="reset-btn" id="ltdPause" title="Stops the clock: no salaries and no contract progress until you switch it back on">Pause company</button>' +
        '<button class="reset-btn" id="ltdClose">Close company</button>' +
      '</div>';
    const modals = document.createElement('div');
    modals.className = 'ltd';
    modals.innerHTML =
      '<div class="modal-back" id="teamModal" hidden><div class="modal" id="teamModalBody"></div></div>' +
      '<div class="modal-back" id="personModal" hidden><div class="modal person">' +
        '<button class="modal-close" data-action="close-person" aria-label="Close" style="float:right;">✕</button>' +
        '<div id="personModalBody"></div></div></div>';
    document.body.appendChild(modals);

    const $ = id => document.getElementById(id);
    const statMoney = $('statMoney'), statRep = $('statRep'), statPayroll = $('statPayroll'), statHeads = $('statHeads');
    const structureEl = $('structure'), rosterEl = $('roster'), rosterCount = $('rosterCount'), hireGrid = $('hireGrid'), applicantsEl = $('applicants');
    const guideEl = $('guide'), structureNote = $('structureNote');
    const studioEl = studioSlot;
    const boardEl = $('board'), jobsEl = $('jobs'), logEl = $('log');
    const welcomeToast = $('welcomeToast');
    const teamModal = $('teamModal'), teamModalBody = $('teamModalBody');
    const personModal = $('personModal'), personModalBody = $('personModalBody');
    let tickTimer = null;
    let stopped = false;
    // Stops the clock and all saving, e.g. before a backup is restored over this company.
    stopGame = () => { stopped = true; clearInterval(tickTimer); };

    // ---------------------------------------------------------------------
    // Studio model
    // ---------------------------------------------------------------------

    // Contracts, skills and XP are by language only for now. Domains (Web Dev, Games,
    // Embedded…) are planned to return later as an unlock with specialist hires.
    const LANGS = ['Python', 'C/C++', 'JavaScript', 'Rust'];
    const BAR_XP = [10, 50, 150, 400, 1000]; // cumulative XP needed for bars 1..5
    const MAX_BARS = 5;

    const DEV_LEVELS = ['Graduate', 'Junior', 'Senior', 'Principal'];
    const ROLES = {
      Director:  { sloc: 0,  salary: 0 },
      Manager:   { sloc: 0,  salary: 8,  cost: 900 },
      Graduate:  { sloc: 5,  salary: 2,  cost: 180,   reliability: 0.70 },
      Junior:    { sloc: 12, salary: 5,  cost: 750,   reliability: 0.80 },
      Senior:    { sloc: 30, salary: 12, cost: 3000,  reliability: 0.90 },
      Principal: { sloc: 70, salary: 28, cost: 12000, reliability: 0.95 }
    };
    const HIRE_ORDER = ['Manager', 'Graduate', 'Junior', 'Senior', 'Principal'];
    // Experienced developers can't be hired at will: they apply now and then (see "Applicants"
    // below). Managers and graduates have hire buttons.
    const APPLICANT_ROLES = ['Junior', 'Senior', 'Principal'];
    const HIRE_BUTTONS = HIRE_ORDER.filter(r => !APPLICANT_ROLES.includes(r));
    const ROSTER_GROUPS = ['Manager', 'Principal', 'Senior', 'Junior', 'Graduate'];

    // To be promoted INTO a level: minutes spent working on contracts at the
    // current level (bench time doesn't count), plus bars in their best language.
    // Deliberately slow: hiring at a level is the quick way to get one; growing your
    // own people is the cheap way.
    const PROMOTION = {
      Junior:    { minutes: 12 * 60,  lang: 1 },  // 12 hours
      Senior:    { minutes: 72 * 60,  lang: 3 },  // 3 days
      Principal: { minutes: 336 * 60, lang: 5 }   // 14 days
    };

    // The hiring market: hire costs start at ROLES[role].cost and only go up. Every
    // MARKET_EVERY_H hours or so (at random), either inflation raises every role's
    // cost a little, or a rival studio competing for one level raises that one more.
    // Prices move while the page is closed too (not while the company is paused).
    const MARKET_EVERY_H = [12, 36];              // hours between market moves
    const INFLATION = [0.02, 0.04];               // every role, per move
    const COMPETITION = [0.06, 0.15];             // one role, per move
    const COMPETITION_CHANCE = 0.4;

    // Applicants: every APPLICANT_EVERY_H hours or so (at random) an experienced developer
    // applies, asking the market price ± a little, and their offer stays open for
    // APPLICANT_OPEN_H hours. Reputation decides who applies: juniors from the start, seniors
    // and principals once the studio is known (APPLICANT_REP). At most MAX_APPLICANTS wait
    // at once. When a rival competes for a level, it also hires away an applicant at it.
    const APPLICANT_EVERY_H = [8, 24];
    const FIRST_APPLICANT_H = 2;                  // a new company's first applicant
    const APPLICANT_OPEN_H = 12;
    const MAX_APPLICANTS = 3;
    const APPLICANT_ASK = [0.9, 1.2];             // × the market price
    const APPLICANT_REP = { Junior: 0, Senior: 500, Principal: 3000 };
    const APPLICANT_WEIGHT = { Junior: 6, Senior: 3, Principal: 1 };

    // Tiered structure: each dev supervises up to MENTOR_SPAN of the level
    // directly below; each manager personally covers one slot at every level
    // (so a new studio can get started) and up to PRINCIPALS_PER_MANAGER
    // principals, and can look after at most MANAGER_SPAN devs in total.
    // In a start-up the Director doubles as the manager, but only has time for
    // DIRECTOR_SPAN devs and one principal — beyond that you need real managers.
    const MENTOR_SPAN = 3;
    const PRINCIPALS_PER_MANAGER = 3;
    const MANAGER_SPAN = 12;
    const DIRECTOR_SPAN = 4;

    const LINE_RATE = 1; // ¤ per SLOC delivered, before multipliers

    // Each contract is a SLOC target. It takes target ÷ (team SLOC/min)
    // minutes, and pays for the SLOC delivered. `minutes` is the reference
    // time for the reference team (`refSloc` SLOC/min — the cheapest team
    // that meets the requirements, e.g. a lone grad on a hotfix, or a
    // senior + 2 grads on a patch); the target is refSloc × minutes, ±15%.
    // Bigger or more senior teams finish sooner.
    //
    // XP is earned per minute spent on the contract (xpPerMin, about 1 XP every
    // 2–3 minutes), so skill bars build at roughly the pace of the contract-time
    // promotion timers regardless of how fast the team is. Bigger contracts pay
    // slightly more XP per minute to reward teamwork.
    const SLOC_SPREAD = 0.15;
    // Skill match speeds a dev up on a contract: their SLOC/min is multiplied
    // by 1 + SKILL_SPEED × (bars in the contract's language) / 5 — so a dev at
    // full bars in it works at double speed.
    const SKILL_SPEED = 1.0;
    // …and adds up to this much success chance (a full-bars team gets all of it).
    const SKILL_CHANCE = 0.05;
    const MIN_JOB_MS = 5000; // floor, so a principal on a hotfix isn't instant
    // A failed contract can be retried once in RETRY_TIME of the time for
    // RETRY_PAYOUT of the payout.
    const RETRY_TIME = 0.5;
    const RETRY_PAYOUT = 0.75;

    // Contract types are named after release types, smallest first:
    // hotfix → patch → minor release → major release.
    const TIERS = [
      { key: 'hotfix', name: 'Hotfix',        plural: 'Hotfixes',       minutes: 1,  offerLife: 3,   refSloc: 5,   min: 1,  max: 1,  mult: 1.0, xpPerMin: 0.33,  rep: 0.5,
        needs: {}, req: '1 developer, any level' },
      { key: 'patch', name: 'Patch',          plural: 'Patches',        minutes: 10, offerLife: 15,  refSloc: 40,  min: 3,  max: 5,  mult: 1.2, xpPerMin: 0.4,  rep: 2,
        needs: { Senior: 1 }, req: '3–5 devs · 1+ senior' },
      { key: 'minor', name: 'Minor release',  plural: 'Minor releases', minutes: 30, offerLife: 45,  refSloc: 90,  min: 5,  max: 10, mult: 1.5, xpPerMin: 0.45, rep: 6,
        needs: { Principal: 1 }, req: '5–10 devs · 1+ principal' },
      { key: 'major', name: 'Major release',  plural: 'Major releases', minutes: 90, offerLife: 120, refSloc: 250, min: 10, max: 20, mult: 2.0, xpPerMin: 0.5,  rep: 20,
        needs: { Manager: 1, Principal: 2, Senior: 3 }, req: '10+ people · manager, 2 principals, 3 seniors' }
    ];
    // 1 = quick fix / sprint / milestone / full delivery (same rules, old names).
    const TIERS_VERSION = 3;
    // 1 = offers tagged with a language and a domain; 2 = language only, with a
    // hotfix in every language.
    const BOARD_VERSION = 2;
    // Hotfixes: one per language, always, so a lone dev always has one they can
    // take. Every other contract type: this many offers, in random languages.
    const OFFERS_PER_TIER = 2;
    // Unstaffed offers are replaced after `offerLife` minutes, so the board
    // keeps turning over even if nobody on staff can take what's on it. A
    // replacement hotfix keeps its language.

    // The demo is the start-up slice: hotfixes and patches only, and no managers (and with
    // patches needing more than PATCH_HEADCOUNT staff, that means hotfixes in practice),
    // so the Director looks after up to DIRECTOR_SPAN devs. The rest is shown as
    // coming in v0.1. Old saves keep what they have; they just get no more of it.
    const DEMO = !!D.DEMO;
    const DEMO_TIERS = ['hotfix', 'patch'];
    const DEMO_LOCKED_ROLES = ['Manager'];
    const COMING = 'coming in v0.1';
    // Patches (and every bigger type) only come to the board once the company has more than
    // PATCH_HEADCOUNT people, the Director included. Hotfixes are always open.
    const PATCH_HEADCOUNT = 10;
    const STAFF_LOCK = 'unlocks above ' + PATCH_HEADCOUNT + ' staff';
    function headcount(){ return state ? state.roster.length : 1; }
    // Why a contract type isn't on the board yet, or null if it is.
    function tierLock(tierIndex){
      if(DEMO && !DEMO_TIERS.includes(TIERS[tierIndex].key)) return COMING;
      if(!isHotfix(tierIndex) && headcount() <= PATCH_HEADCOUNT) return STAFF_LOCK;
      return null;
    }
    function tierOpen(tierIndex){ return !tierLock(tierIndex); }

    const FIRST_NAMES = ['Alex','Sam','Jamie','Taylor','Morgan','Riley','Casey','Drew','Reese','Quinn','Charlie','Jordan',
                         'Avery','Rowan','Kai','Emerson','Harper','Skyler','Parker','Sage','Hayden','Robin','Ari','Noa'];
    const OFFLINE_CAP_SECONDS = 4 * 60 * 60;
    const LOG_LENGTH = 8;

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    function rand(n){ return Math.floor(Math.random() * n); }
    function pick(arr){ return arr[rand(arr.length)]; }
    function shuffle(arr){
      for(let i = arr.length - 1; i > 0; i--){
        const j = rand(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    function uid(prefix){ return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
    function esc(s){ return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]); }

    function bars(xp){
      let b = 0;
      while(b < MAX_BARS && (xp || 0) >= BAR_XP[b]) b++;
      return b;
    }
    function xpForBars(b){ return b <= 0 ? 0 : BAR_XP[b - 1]; }
    function barString(b){ return '■'.repeat(b) + '□'.repeat(MAX_BARS - b); }
    function bestBars(skillMap){
      return Object.values(skillMap).reduce((m, xp) => Math.max(m, bars(xp)), 0);
    }

    function isDev(p){ return DEV_LEVELS.indexOf(p.role) >= 0; }
    function levelRank(role){ return DEV_LEVELS.indexOf(role); }

    function fmt(n){
      const sign = n < 0 ? '−' : '';
      return sign + '¤' + Math.abs(n).toLocaleString('en-GB', { maximumFractionDigits: 0 });
    }
    // Coarse "2d 3h" / "7h 12m" / "15m" for promotion timers. Time remaining
    // rounds up; time elapsed (roundDown) rounds down.
    function fmtDuration(ms, roundDown){
      const mins = Math.max(0, (roundDown ? Math.floor : Math.ceil)(ms / 60000));
      const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
      if(d) return d + 'd' + (h ? ' ' + h + 'h' : '');
      if(h) return h + 'h' + (m ? ' ' + m + 'm' : '');
      return m + 'm';
    }
    function fmtXp(xp){ return xp >= 10 ? String(Math.round(xp)) : xp.toFixed(1).replace(/\.0$/, ''); }
    function fmtClock(ms){
      const s = Math.max(0, Math.ceil(ms / 1000));
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      const pad = n => String(n).padStart(2, '0');
      return h ? h + ':' + pad(m) + ':' + pad(sec) : m + ':' + pad(sec);
    }

    // Replace a container's HTML only when it actually changes, so the
    // one-second tick doesn't swallow clicks on buttons inside it.
    function setHTML(el, html){
      if(el._html !== html){
        el.innerHTML = html;
        el._html = html;
      }
    }

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    const STORAGE_KEY = 'debugg-ltd';
    // Saves from before the merge, when the studio lived at /studio/.
    const OLD_STORAGE_KEY = 'contract-debugger-state-v3';

    function freshState(money){
      const now = Date.now();
      return {
        money,
        reputation: 0,
        roster: [{ id: 'director', name: 'You', role: 'Director', since: now, lang: {} }],
        board: makeBoard(),
        jobs: [],             // staffed contracts in progress
        log: [],
        lastTick: now,
        collapsedLevels: [],  // roster tree groups folded in the UI
        collapsedTiers: [],   // contract board groups folded in the UI
        tiersVersion: TIERS_VERSION,
        boardVersion: BOARD_VERSION,
        enabled: true,        // false while the player has the company paused
        pausedAt: null,
        paid: {}              // desk puzzles already paid for, e.g. { 'python-5': true }
      };
    }

    function isHotfix(tierIndex){ return TIERS[tierIndex].key === 'hotfix'; }

    function makeOffer(tierIndex, lang){
      const tier = TIERS[tierIndex];
      const spread = 1 - SLOC_SPREAD + Math.random() * 2 * SLOC_SPREAD;
      return { id: uid('c'), tier: tierIndex, lang: lang || pick(LANGS),
               sloc: Math.max(1, Math.round(tier.refSloc * tier.minutes * spread)),
               expiresAt: Date.now() + tier.offerLife * 60000 };
    }
    // The offer that takes a taken or expired one's place: hotfixes keep their language.
    function replacementFor(o){
      return makeOffer(o.tier, isHotfix(o.tier) ? o.lang : null);
    }
    // Swap out expired offers — except one the player has open in the team
    // picker, so it doesn't vanish mid-choice — and make sure there's a hotfix
    // in every language.
    function refreshBoard(now){
      state.board = state.board.filter(o => tierOpen(o.tier) || (picker && picker.offerId === o.id));
      state.board.forEach((o, i) => {
        if(o.expiresAt <= now && !(picker && picker.offerId === o.id)) state.board[i] = replacementFor(o);
      });
      const hotfix = TIERS.findIndex(t => t.key === 'hotfix');
      LANGS.forEach(lang => {
        if(!state.board.some(o => o.tier === hotfix && o.lang === lang)) state.board.push(makeOffer(hotfix, lang));
      });
      // A type that has just opened (e.g. patches, once the company is big enough) gets its offers.
      TIERS.forEach((_, i) => {
        if(isHotfix(i) || !tierOpen(i)) return;
        for(let k = state.board.filter(o => o.tier === i).length; k < OFFERS_PER_TIER; k++) state.board.push(makeOffer(i));
      });
    }

    function makeBoard(){
      const board = [];
      TIERS.forEach((_, i) => {
        if(!tierOpen(i)) return;
        if(isHotfix(i)) LANGS.forEach(lang => board.push(makeOffer(i, lang)));
        else for(let k = 0; k < OFFERS_PER_TIER; k++) board.push(makeOffer(i));
      });
      return board;
    }

    function makeHire(role){
      const p = { id: uid('e'), name: pick(FIRST_NAMES) + ' ' + String.fromCharCode(65 + rand(26)) + '.',
                  role, since: Date.now(), lang: {} };
      const langs = shuffle(LANGS.slice());
      const set = (b, i) => { if(b > 0) p.lang[langs[i]] = xpForBars(b); };

      if(role === 'Graduate'){
        // One language from uni.
        set(1, 0);
      }else if(role === 'Junior'){
        set(1 + rand(2), 0);
        if(Math.random() < 0.5) set(1, 1);
      }else if(role === 'Senior'){
        set(3 + rand(2), 0);
        set(1 + rand(2), 1);
      }else if(role === 'Principal'){
        // At least one language at full bars.
        set(5, 0);
        set(2 + rand(3), 1);
        set(1 + rand(2), 2);
      }
      return p;
    }

    let state = null;

    function readSave(key){
      try{ return JSON.parse(localStorage.getItem(key)); }catch(e){ return null; }
    }
    function save(){
      if(stopped) return;
      try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
    }

    function person(id){ return state.roster.find(p => p.id === id); }
    function busyIds(){
      const ids = new Set();
      state.jobs.forEach(j => j.team.forEach(id => ids.add(id)));
      return ids;
    }
    function jobFor(id){ return state.jobs.find(j => j.team.indexOf(id) >= 0); }

    // What a hire at this level costs today, rounded to ¤5.
    function hireCost(role){
      const m = state.market && state.market.prices[role] || 1;
      return Math.round(ROLES[role].cost * m / 5) * 5;
    }
    function nextMarketMove(from){
      const [lo, hi] = MARKET_EVERY_H;
      return from + (lo + Math.random() * (hi - lo)) * 3600000;
    }
    // Applies every market move that's due by `now`, oldest first, and logs each one.
    function moveMarket(now){
      if(!state.market) state.market = { prices: {}, nextAt: nextMarketMove(now) };
      const m = state.market;
      for(let i = 0; m.nextAt <= now && i < 60; i++){
        if(Math.random() < COMPETITION_CHANCE){
          const role = pick(HIRE_ORDER);
          const up = between(COMPETITION);
          m.prices[role] = (m.prices[role] || 1) * (1 + up);
          const lost = (state.applicants || []).find(a => a.role === role);
          if(lost) state.applicants = state.applicants.filter(a => a !== lost);
          addLog('info', 'Competition: a rival studio is hiring ' + (role === 'Graduate' ? 'graduates' : role.toLowerCase() + 's') +
            ', so ' + role.toLowerCase() + ' hires cost ' + Math.round(up * 100) + '% more' +
            (lost ? ', and it’s hired away ' + lost.person.name + ', who’d applied to you.' : '.'));
        }else{
          const up = between(INFLATION);
          HIRE_ORDER.forEach(r => { m.prices[r] = (m.prices[r] || 1) * (1 + up); });
          addLog('info', 'Inflation: every hire costs ' + Math.round(up * 100) + '% more.');
        }
        m.nextAt = nextMarketMove(m.nextAt);
      }
      if(m.nextAt <= now) m.nextAt = nextMarketMove(now);
    }

    function between([lo, hi]){ return lo + Math.random() * (hi - lo); }
    // The levels reputation has opened to applicants.
    function applicantRoles(){ return APPLICANT_ROLES.filter(r => (state.reputation || 0) >= APPLICANT_REP[r]); }
    function nextApplicantTime(from){ return from + between(APPLICANT_EVERY_H) * 3600000; }
    function newApplicant(at){
      const roles = applicantRoles();
      let roll = Math.random() * roles.reduce((n, r) => n + APPLICANT_WEIGHT[r], 0);
      const role = roles.find(r => (roll -= APPLICANT_WEIGHT[r]) < 0) || roles[0];
      const p = makeHire(role);
      return { id: p.id, role, person: p, cost: Math.round(hireCost(role) * between(APPLICANT_ASK) / 5) * 5,
               expiresAt: at + APPLICANT_OPEN_H * 3600000 };
    }
    // Lets applicants go whose offers have run out, then brings in everyone due by `now`
    // (skipping any whose offer would already have run out while the page was closed).
    function moveApplicants(now){
      if(!state.applicants) state.applicants = [];
      if(!state.nextApplicantAt) state.nextApplicantAt = now + FIRST_APPLICANT_H * 3600000;
      state.applicants = state.applicants.filter(a => {
        if(a.expiresAt > now) return true;
        addLog('info', a.person.name + ' (' + a.role.toLowerCase() + ') took a job elsewhere.');
        return false;
      });
      for(let i = 0; state.nextApplicantAt <= now && i < 60; i++){
        const at = state.nextApplicantAt;
        if(at + APPLICANT_OPEN_H * 3600000 > now && state.applicants.length < MAX_APPLICANTS){
          const a = newApplicant(at);
          state.applicants.push(a);
          addLog('info', a.person.name + ' applied to join as a ' + a.role.toLowerCase() + ', asking ' + fmt(a.cost) + '.');
        }
        state.nextApplicantAt = nextApplicantTime(at);
      }
      if(state.nextApplicantAt <= now) state.nextApplicantAt = nextApplicantTime(now);
    }

    function addLog(kind, text){
      state.log.unshift({ kind, text });
      state.log.length = Math.min(state.log.length, LOG_LENGTH);
    }

    // ---------------------------------------------------------------------
    // Structure rules
    // ---------------------------------------------------------------------

    function headcounts(roster){
      const c = { Manager: 0, Graduate: 0, Junior: 0, Senior: 0, Principal: 0, devs: 0 };
      roster.forEach(p => {
        if(c[p.role] !== undefined) c[p.role]++;
        if(isDev(p)) c.devs++;
      });
      return c;
    }
    // The Director counts as one extra "manager seed" (one slot per level) with
    // a smaller span of control.
    function capacity(c){
      const seeds = c.Manager + 1;
      return {
        Principal: PRINCIPALS_PER_MANAGER * c.Manager + 1,
        Senior:    MENTOR_SPAN * c.Principal + seeds,
        Junior:    MENTOR_SPAN * c.Senior + seeds,
        Graduate:  MENTOR_SPAN * c.Junior + seeds,
        devs:      MANAGER_SPAN * c.Manager + DIRECTOR_SPAN
      };
    }
    // Returns why a headcount would be invalid, or null if it's fine.
    function structureProblem(c){
      const cap = capacity(c);
      if(c.devs > cap.devs){
        return c.Manager ? 'managers are at capacity — hire another manager'
                         : 'you can only look after ' + DIRECTOR_SPAN + ' devs — hire a manager';
      }
      if(c.Principal > cap.Principal) return 'principals full — a manager makes room for more';
      if(c.Senior > cap.Senior) return 'seniors full — a principal makes room for 3 more';
      if(c.Junior > cap.Junior) return 'juniors full — a senior makes room for 3 more';
      if(c.Graduate > cap.Graduate) return 'grads full — a junior makes room for 3 more';
      return null;
    }
    function problemWith(change){
      const c = headcounts(state.roster);
      Object.keys(change).forEach(k => {
        c[k] += change[k];
        if(DEV_LEVELS.indexOf(k) >= 0) c.devs += change[k];
      });
      return structureProblem(c);
    }

    function hireProblem(role){
      if(DEMO && DEMO_LOCKED_ROLES.includes(role)) return COMING;
      return problemWith({ [role]: 1 });
    }
    function releaseProblem(p){
      if(jobFor(p.id)) return 'on a contract';
      const why = problemWith({ [p.role]: -1 });
      return why ? 'would leave the team unsupervised' : null;
    }

    function promotionStatus(p, now){
      const r = levelRank(p.role);
      if(r < 0 || r === DEV_LEVELS.length - 1) return null;
      const next = DEV_LEVELS[r + 1];
      const req = PROMOTION[next];
      const missing = [];
      const left = req.minutes * 60000 - (p.worked || 0);
      if(left > 0) missing.push(fmtDuration(left) + ' more contract time');
      if(bestBars(p.lang) < req.lang) missing.push('a language at ' + req.lang);
      const blocked = missing.length ? null : problemWith({ [p.role]: -1, [next]: 1 });
      return { next, missing, blocked, ready: !missing.length && !blocked };
    }

    // ---------------------------------------------------------------------
    // The Director's languages come from the daily puzzles
    // ---------------------------------------------------------------------

    // Puzzle languages are keyed 'python' / 'c' / …; the studio uses its own names ('C/C++').
    // Only languages in the puzzle rotation count.
    function puzzleKey(langName){
      return Object.keys(D.LANGS).find(k => D.LANGS[k].studio === langName) || null;
    }
    function directorLevel(key){
      return D.levelFor(D.readXp()[key] || 0);
    }
    // Every puzzle level above 1 in a language adds 1% success chance to contracts
    // in it (up to +10%): the better you know a language, the better your company is at it.
    function directorBoost(langName){
      const key = puzzleKey(langName);
      return key ? Math.min(DIRECTOR_BOOST_CAP, DIRECTOR_BOOST_PER_LEVEL * (directorLevel(key) - 1)) : 0;
    }

    // ---------------------------------------------------------------------
    // Staffed contracts
    // ---------------------------------------------------------------------

    function eligibleFor(tier, p){
      if(p.role === 'Director') return false;
      if(p.role === 'Manager') return !!tier.needs.Manager;
      return true;
    }

    // 0..1: how well a dev knows this contract's language.
    function matchFit(d, offer){
      return bars(d.lang[offer.lang]) / MAX_BARS;
    }
    function devSlocOn(d, offer){
      return ROLES[d.role].sloc * (1 + SKILL_SPEED * matchFit(d, offer));
    }

    // A dev "knows the stack" for a contract if they have at least one bar in
    // its language. Managers don't write code, so they're exempt.
    // Devs who don't can only join a team as learners: they write nothing,
    // each one costs the team LEARNER_DRAG of its output in mentoring time,
    // and there must be at least one dev who knows the stack per learner.
    // It's the only way to pick up a first bar in something new.
    const LEARNER_DRAG = 0.10;
    function qualifiedFor(p, offer){
      return !isDev(p) || bars(p.lang[offer.lang]) > 0;
    }

    function evaluateTeam(tier, offer, members){
      const devs = members.filter(isDev);
      const managers = members.filter(p => p.role === 'Manager').length;
      const atLeast = level => devs.filter(d => levelRank(d.role) >= levelRank(level)).length;
      const checks = [];

      const sizeLabel = tier.min === tier.max ? tier.min + ' person' + (tier.min > 1 ? 's' : '')
                      : tier.key === 'major' ? tier.min + '+ people'
                      : tier.min + '–' + tier.max + ' people';
      checks.push({ label: sizeLabel + ' (' + members.length + ')', ok: members.length >= tier.min && members.length <= tier.max });
      if(tier.needs.Manager) checks.push({ label: tier.needs.Manager + '+ manager', ok: managers >= tier.needs.Manager });
      if(tier.needs.Principal) checks.push({ label: tier.needs.Principal + '+ principal', ok: atLeast('Principal') >= tier.needs.Principal });
      if(tier.needs.Senior){
        // Extra principals can fill senior seats.
        const need = tier.needs.Senior + (tier.needs.Principal || 0);
        checks.push({ label: tier.needs.Senior + '+ senior' + (tier.needs.Principal ? ' (beyond the principals)' : ' or above'),
                      ok: atLeast('Senior') >= need });
      }
      if(!devs.length) checks.push({ label: 'at least one developer', ok: false });
      const knowers = devs.filter(d => qualifiedFor(d, offer));
      const learners = devs.length - knowers.length;
      if(tier.max === 1){
        checks.push({ label: 'knows ' + offer.lang + ' (no learning solo)', ok: learners === 0 });
      }else{
        checks.push({ label: 'someone knows ' + offer.lang, ok: knowers.length > 0 });
        if(learners) checks.push({ label: 'learners (' + learners + ') ≤ devs who know the stack (' + knowers.length + ')',
                                   ok: learners <= knowers.length });
      }

      const valid = checks.every(c => c.ok);
      const drag = Math.max(0, 1 - LEARNER_DRAG * learners);
      const baseSloc = knowers.reduce((s, d) => s + ROLES[d.role].sloc, 0);
      const matchedSloc = knowers.reduce((s, d) => s + devSlocOn(d, offer), 0);
      const sloc = Math.round(matchedSloc * drag * 10) / 10;
      const skill = devs.length ? devs.reduce((s, d) => s + matchFit(d, offer), 0) / devs.length : 0;
      const reliability = devs.length ? devs.reduce((s, d) => s + ROLES[d.role].reliability, 0) / devs.length : 0;
      const boost = devs.length ? directorBoost(offer.lang) : 0;
      // Skill match adds up to +5%, scaled by the team's average bars in the language.
      const chance = devs.length ? Math.min(0.98, reliability + SKILL_CHANCE * skill + boost) : 0;
      const ms = sloc > 0 ? Math.max(MIN_JOB_MS, offer.sloc / sloc * 60000) : Infinity;
      // A contract pays the same whoever does it: skill makes a team faster (more contracts an
      // hour), not better paid per contract.
      const payout = Math.round(offer.sloc * LINE_RATE * tier.mult);
      const salaryCost = members.reduce((s, p) => s + ROLES[p.role].salary, 0) * ms / 60000;
      const xp = tier.xpPerMin * ms / 60000;

      return { checks, valid, baseSloc, matchedSloc, learners, sloc, ms, chance, boost, payout, salaryCost, xp };
    }

    function startJob(offerId, memberIds, repeat){
      const offerIdx = state.board.findIndex(o => o.id === offerId);
      if(offerIdx < 0) return false;
      const offer = state.board[offerIdx];
      const tier = TIERS[offer.tier];
      const busy = busyIds();
      const members = memberIds.map(person).filter(p => p && !busy.has(p.id) && eligibleFor(tier, p));
      if(members.length !== memberIds.length) return false;
      const ev = evaluateTeam(tier, offer, members);
      if(!ev.valid) return false;

      const now = Date.now();
      state.jobs.push(newJob(offer, memberIds.slice(), now, ev, !!repeat));
      state.board[offerIdx] = replacementFor(offer);
      save();
      return true;
    }

    // status: 'running' | 'failed' (waiting for the player to retry or drop it).
    // attempt: 1 for the original run, 2 for the retry.
    function newJob(offer, team, startedAt, ev, repeat){
      return {
        id: offer.id, tier: offer.tier, lang: offer.lang,
        sloc: offer.sloc, teamSloc: ev.sloc,
        team, startedAt, endsAt: startedAt + ev.ms,
        chance: ev.chance, payout: ev.payout, repeat, status: 'running', attempt: 1
      };
    }

    function isRunning(job){ return (job.status || 'running') === 'running'; }
    function jobTag(job){ return TIERS[job.tier].name + ' (' + job.lang + ')'; }
    function retryPayout(job){ return Math.round(job.payout * RETRY_PAYOUT); }
    function retryMs(job){ return (job.endsAt - job.startedAt) * RETRY_TIME; }

    // Rolls the outcome, credits contract time to everyone on the team (only
    // the part worked at their current level), and pays out/awards XP on
    // success. Returns true if it was delivered.
    function settleJob(job){
      const tier = TIERS[job.tier];
      job.team.forEach(id => {
        const p = person(id);
        if(p) p.worked = (p.worked || 0) + Math.max(0, job.endsAt - Math.max(job.startedAt, p.since));
      });
      const retry = job.attempt === 2 ? ' retry' : '';
      const xp = tier.xpPerMin * (job.endsAt - job.startedAt) / 60000;
      if(Math.random() < job.chance){
        state.money += job.payout;
        state.reputation += tier.rep;
        job.team.forEach(id => {
          const p = person(id);
          if(!p || !isDev(p)) return;
          p.lang[job.lang] = (p.lang[job.lang] || 0) + xp;
        });
        addLog('ok', '✓ ' + jobTag(job) + retry + ' delivered — ' + fmt(job.payout) + ', +' + fmtXp(xp) + ' XP to the team.');
        return true;
      }
      state.reputation = Math.max(0, state.reputation - tier.rep / 2);
      addLog('bad', '✕ ' + jobTag(job) + retry + ' failed' +
        (job.attempt === 1 ? '.' : ' again — contract lost.'));
      return false;
    }

    function retryJob(job, startAt){
      const ms = retryMs(job); // from the original run's length, before it's overwritten
      job.status = 'running';
      job.attempt = 2;
      job.startedAt = startAt;
      job.endsAt = startAt + ms;
      job.payout = retryPayout(job);
    }

    // A repeating job rolls straight into a fresh contract of the same type
    // (a new random language) with the same team, starting the moment
    // the last one ended — so it keeps working while the page is closed.
    function restartJob(job){
      const members = job.team.map(person);
      const tier = TIERS[job.tier];
      // Look for a fresh contract of the same type that the whole team is
      // qualified for.
      let offer = null, ev = null;
      for(let i = 0; i < 40 && members.every(Boolean) && tierOpen(job.tier); i++){
        const candidate = makeOffer(job.tier);
        const e = evaluateTeam(tier, candidate, members);
        if(e.valid){ offer = candidate; ev = e; break; }
      }
      if(!ev){
        addLog('info', tier.name + ' repeat stopped — ' +
          (tierOpen(job.tier) ? 'the team no longer fits the requirements.'
            : tier.plural.toLowerCase() + (tierLock(job.tier) === COMING ? ' are ' + COMING : ' need more than ' + PATCH_HEADCOUNT + ' staff') + '.'));
        return;
      }
      state.jobs.push(newJob(offer, job.team, job.endsAt, ev, true));
    }

    function resolveDueJobs(now){
      // Repeats don't chain further back than the offline cap.
      const repeatCutoff = now - OFFLINE_CAP_SECONDS * 1000;
      let finished = 0;
      for(;;){
        const due = state.jobs.filter(j => isRunning(j) && j.endsAt <= now).sort((a, b) => a.endsAt - b.endsAt);
        if(!due.length) break;
        const job = due[0];
        const delivered = settleJob(job);
        finished++;
        if(!delivered && job.attempt === 1){
          // Repeating teams retry automatically (it's the better deal per
          // minute); otherwise the team waits for the player to decide.
          if(job.repeat && job.endsAt >= repeatCutoff){
            retryJob(job, job.endsAt);
            addLog('info', '↻ Retrying ' + jobTag(job) + ' for ' + fmt(job.payout) + '.');
          }else{
            job.status = 'failed';
          }
          continue;
        }
        state.jobs = state.jobs.filter(j => j !== job);
        if(job.repeat && job.endsAt >= repeatCutoff) restartJob(job);
      }
      return finished;
    }

    function setRepeat(jobId, on){
      const job = state.jobs.find(j => j.id === jobId);
      if(job) job.repeat = on;
    }

    function payrollPerMinute(){
      return state.roster.reduce((s, p) => s + ROLES[p.role].salary, 0);
    }
    function paySalaries(seconds){
      if(seconds > 0) state.money -= payrollPerMinute() * seconds / 60;
    }

    // ---------------------------------------------------------------------
    // Founding, importing, resuming
    // ---------------------------------------------------------------------

    function showToast(text){
      welcomeToast.className = 'toast show';
      welcomeToast.innerHTML = '<button class="toast-close" data-action="close-toast" aria-label="Dismiss">✕</button>' + esc(text);
    }
    welcomeToast.addEventListener('click', (e) => {
      if(e.target.closest('[data-action=close-toast]')) welcomeToast.className = 'toast';
    });

    // Founder's bonus: ¤1 per puzzle XP earned before the company existed, up to ¤1,000.
    function founderBonus(){
      const xp = D.readXp();
      const total = Object.keys(xp).reduce((s, k) => s + (xp[k] || 0), 0);
      return Math.min(FOUNDER_BONUS_CAP, Math.floor(total));
    }

    // Shifts every clock in the save forward by `ms`, so time spent paused never happened.
    function skipTime(ms){
      if(!(ms > 0)) return;
      state.lastTick = (state.lastTick || Date.now()) + ms;
      state.jobs.forEach(j => { j.startedAt += ms; j.endsAt += ms; });
      state.board.forEach(o => { o.expiresAt += ms; });
      if(state.market) state.market.nextAt += ms;
      if(state.nextApplicantAt) state.nextApplicantAt += ms;
      (state.applicants || []).forEach(a => { a.expiresAt += ms; });
      state.roster.forEach(p => { p.since += ms; });
    }

    let opening = null;
    function track(path){ if(window.DebuggAnalytics) window.DebuggAnalytics.event('ltd/' + path); }
    const saved = readSave(STORAGE_KEY);
    const old = saved ? null : readSave(OLD_STORAGE_KEY);
    if(saved){
      state = saved;
      if(!state.enabled){
        const away = Date.now() - (state.pausedAt || Date.now());
        skipTime(away);
        state.enabled = true;
        state.pausedAt = null;
        track('resumed');
        opening = 'Welcome back. Debuggit Ltd was paused' + (away > 60000 ? ' for ' + fmtDuration(away, true) : '') + ', so nothing changed while you were away.';
      }
    }else if(old){
      // A company from before the merge: keep everything except the old desk contract.
      state = old;
      delete state.activeContract;
      state.enabled = true;
      state.pausedAt = null;
      track('imported');
      opening = 'Your company has moved in with the daily puzzles. The desk is now today’s puzzle, and it pays the company.';
    }else{
      const bonus = founderBonus();
      state = freshState(START_CASH + bonus);
      track('founded');
      opening = 'You’ve founded Debuggit Ltd with ' + fmt(state.money) +
        (bonus ? ' (' + fmt(START_CASH) + ' plus a ' + fmt(bonus) + ' founder’s bonus for your puzzle XP)' : '') +
        '. Debuggit Ltd is in beta, so its numbers may change.' +
        (DEMO ? ' In the demo it runs hotfixes with up to ' + DIRECTOR_SPAN + ' devs, and it will be reset when v0.1 comes out.' : '');
    }
    if(!state.paid) state.paid = {};
    save();
    // Only remove the old save once the new one is safely written.
    if(old && readSave(STORAGE_KEY)){ try{ localStorage.removeItem(OLD_STORAGE_KEY); }catch(e){} }

    // ---------------------------------------------------------------------
    // The desk: daily puzzles pay the company
    // ---------------------------------------------------------------------

    function pruneLedger(){
      const cutoff = D.today() - PAID_MEMORY_DAYS;
      Object.keys(state.paid).forEach(k => {
        const day = parseInt((/-(-?\d+)$/.exec(k) || [])[1], 10);
        if(!(day >= cutoff)) delete state.paid[k];
      });
    }

    // Pays for a finished daily puzzle, once. Only today's puzzles pay, and only ones
    // finished while the company is running: the event fires when a game ends, never on reload.
    document.addEventListener('debugg:puzzle-finished', (e) => {
      const d = e.detail || {};
      const key = d.lang + '-' + d.day;
      // d.day is the puzzle's day; on a Sunday, the weekend puzzle belongs to Saturday.
      if(d.day !== D.slotDay(D.today()) || state.paid[key] || !(d.xp > 0)) return;
      const bonus = d.solved ? Math.min(STREAK_BONUS_CAP, STREAK_BONUS_PER_DAY * Math.max(0, (d.streak || 0) - 1)) : 0;
      const cash = Math.round(d.xp * CASH_PER_XP * (1 + bonus));
      const rep = d.xp / XP_PER_REP;
      state.money += cash;
      state.reputation += rep;
      state.paid[key] = true;
      pruneLedger();
      const name = (D.LANG_INFO[d.lang] || { name: d.lang }).name;
      const text = 'Today’s ' + name + ' puzzle ' + (d.solved ? 'paid ' : 'still paid ') + fmt(cash) +
        (bonus ? ' (incl. +' + Math.round(bonus * 100) + '% streak bonus)' : '') +
        ' and +' + (Math.round(rep * 10) / 10) + ' reputation.';
      addLog(d.solved ? 'ok' : 'info', '✓ Desk: ' + text);
      showToast(text);
      save();
      renderAll();
    });
    // ---------------------------------------------------------------------
    // Rendering: stats, studio, board
    // ---------------------------------------------------------------------

    // The first steps, shown as one "next step" card until the player has a dev on a contract and
    // has solved a desk puzzle (or dismisses it): hire a grad, put them on a hotfix they can
    // take (with repeat on), solve today's puzzle. Returns { key, text, offerId? } or null.
    function guideStep(){
      if(state.guideDone) return null;
      const devs = state.roster.filter(isDev);
      if(!devs.length){
        return { key: 'hire', text: '<b>Hire a graduate.</b> They write the code; you run the company. It costs ' +
          fmt(hireCost('Graduate')) + ' and ¤' + ROLES.Graduate.salary + '/min in salary.' };
      }
      if(!state.jobs.length){
        const d = devs[0];
        const offer = state.board.find(o => TIERS[o.tier].key === 'hotfix' && qualifiedFor(d, o));
        return { key: 'staff', offerId: offer && offer.id,
          text: '<b>Put ' + esc(d.name) + ' to work.</b> On the contract board, press <b>Staff a team</b> on the ' +
            esc(offer ? offer.lang : 'highlighted') + ' hotfix, tick them and start it. Leave <b>Repeat</b> on and they’ll keep going ' +
            'while you’re away. Staff on the bench still get paid.' };
      }
      const today = D.slotDay(D.today());
      if(!D.isFinished(today)){
        return { key: 'desk', text: '<b>Solve today’s puzzle at your desk.</b> It pays the company up to ' +
          fmt(D.baseXp(today) * CASH_PER_XP) + ', and a new one comes out every day.' };
      }
      state.guideDone = true;
      save();
      return null;
    }
    // Warnings that stay: people on the bench costing money, and cash below zero.
    function renderGuide(){
      const step = guideStep();
      let html = '';
      if(step){
        html += '<div class="guide" data-step="' + step.key + '"><button class="toast-close" data-action="skip-guide" aria-label="Hide the guide">✕</button>' +
          '<span class="guide-label">Next step</span>' + step.text + '</div>';
      }
      const busy = busyIds();
      const idle = state.roster.filter(p => isDev(p) && !busy.has(p.id));
      if(idle.length && !(step && step.key === 'staff')){
        const cost = idle.reduce((n, p) => n + ROLES[p.role].salary, 0);
        html += '<div class="alert" data-alert="idle">⚠ ' + (idle.length === 1 ? esc(idle[0].name) + ' is' : idle.length + ' developers are') +
          ' on the bench, costing ¤' + cost + '/min. Staff them on a contract below.</div>';
      }
      if(state.money < 0){
        html += '<div class="alert bad" data-alert="debt">⚠ The company is ' + fmt(-state.money) + ' in debt, and salaries keep going out. ' +
          'Put everyone on contracts, solve today’s puzzle, or let someone go.</div>';
      }
      setHTML(guideEl, html);
      return step;
    }

    function renderStats(){
      statMoney.textContent = fmt(state.money);
      statMoney.classList.toggle('neg', state.money < 0);
      statRep.textContent = Math.floor(state.reputation).toLocaleString('en-GB');
      statPayroll.textContent = '−¤' + payrollPerMinute() + '/min';
      statHeads.textContent = state.roster.length;
    }

    // ---------------------------------------------------------------------
    // Employee panel
    // ---------------------------------------------------------------------

    let inspectId = null;

    function skillRowsHTML(names, map, kind){
      const top = names.reduce((m, n) => Math.max(m, bars(map[n])), 0);
      return names.map(name => {
        const xp = map[name] || 0;
        const b = bars(xp);
        let pips = '';
        for(let i = 0; i < MAX_BARS; i++){
          const filled = i < b;
          pips += '<div class="skill-pip' + (filled ? ' filled ' + kind + (b === top ? ' best' : '') : '') + '"></div>';
        }
        const xpText = b >= MAX_BARS ? 'max' : Math.floor(xp) + '/' + BAR_XP[b];
        return '<div class="skill-row"><span class="skill-name">' + esc(name) + '</span>' +
               '<div class="skill-bar">' + pips + '</div><span class="skill-xp">' + xpText + ' xp</span></div>';
      }).join('');
    }

    function renderPersonModal(now){
      if(!inspectId) return;
      const p = person(inspectId);
      if(!p){ closePersonModal(); return; }
      const role = ROLES[p.role];
      const job = jobFor(p.id);
      const tenure = Math.floor((now - p.since) / 60000);

      let body = '';
      if(isDev(p)){
        body += '<div class="skill-section-title">Languages</div>' + skillRowsHTML(LANGS, p.lang, 'lang');
        const ps = promotionStatus(p, now);
        if(ps){
          const req = PROMOTION[ps.next];
          const worked = p.worked || 0;
          const needMs = req.minutes * 60000;
          const row = (ok, text) => '<div class="' + (ok ? 'ok' : 'no') + '">' + (ok ? '✓ ' : '○ ') + text + '</div>';
          body += '<div class="skill-section-title">Promotion to ' + ps.next + '</div><div class="req-list">' +
            row(worked >= needMs, fmtDuration(needMs) + ' on contracts as ' + p.role.toLowerCase() +
                (worked < needMs ? ' (' + fmtDuration(worked, true) + ' so far)' : '')) +
            row(bestBars(p.lang) >= req.lang, 'A language at ' + req.lang + ' bar' + (req.lang > 1 ? 's' : '')) +
            (ps.blocked ? '<div class="no" style="color:var(--amber)">⚠ ' + esc(ps.blocked) + '</div>' : '') +
            '</div>';
        }else{
          body += '<div class="skill-section-title">Promotion</div><div class="req-list"><div class="ok">Top of the ladder.</div></div>';
        }
      }else{
        body += '<div class="skill-section-title">Role</div><div class="req-list"><div class="no">' +
                'Managers don’t write code. Each one looks after up to ' + MANAGER_SPAN + ' devs and ' +
                PRINCIPALS_PER_MANAGER + ' principals, and one is needed on every major release.</div></div>';
      }

      setHTML(personModalBody,
        '<div class="modal-top"><div><div class="modal-name">' + esc(p.name) + '</div>' +
        '<div class="modal-level">' + p.role + '</div></div></div>' +
        '<div class="modal-sub">' + (isDev(p) ? role.sloc + ' SLOC/min · ' : '') + '−¤' + role.salary + '/min upkeep · ' +
        fmtDuration((tenure || 0) * 60000, true) + ' in role · ' + fmtDuration(p.worked || 0, true) + ' on contracts<br>' +
        (job && !isRunning(job) ? 'Waiting on you: ' + esc(jobTag(job)) + ' failed — retry or drop it'
         : job ? 'On ' + TIERS[job.tier].name + ' (' + esc(job.lang) + ') — ' + fmtClock(job.endsAt - now) + ' left'
             : 'Idle') + '</div>' +
        body);
    }

    function openPersonModal(id){
      inspectId = id;
      personModal.hidden = false;
      renderPersonModal(Date.now());
    }
    function closePersonModal(){
      inspectId = null;
      personModal.hidden = true;
      setHTML(personModalBody, '');
    }

    personModal.addEventListener('click', (e) => {
      if(e.target === personModal || e.target.closest('[data-action=close-person]')) closePersonModal();
    });

    function renderStudio(now){
      const c = headcounts(state.roster);
      const cap = capacity(c);
      const slot = (label, have, max) =>
        '<span class="slot' + (max > 0 && have >= max ? ' full' : '') + '">' + label + ' ' + have + '/' + max + '</span>';
      setHTML(structureEl,
        '<span class="slot">Managers ' + c.Manager + '</span>' +
        slot('Principals', c.Principal, cap.Principal) +
        slot('Seniors', c.Senior, cap.Senior) +
        slot('Juniors', c.Junior, cap.Junior) +
        slot('Grads', c.Graduate, cap.Graduate) +
        slot('Devs', c.devs, cap.devs));
      // Why a level is full while there's still room for devs overall: every level needs
      // someone at the level above (or you) to look after it.
      const LEVEL_NOTES = [
        ['Graduate', 'Grads', 'Each junior can look after ' + MENTOR_SPAN + ' more grads: hire one from Applicants below, or promote a grad.'],
        ['Junior', 'Juniors', 'Each senior can look after ' + MENTOR_SPAN + ' more juniors: wait for one to apply, or promote a junior.'],
        ['Senior', 'Seniors', 'Each principal can look after ' + MENTOR_SPAN + ' more seniors: wait for one to apply, or promote a senior.']
      ];
      const full = c.devs < cap.devs && LEVEL_NOTES.find(([role]) => c[role] >= cap[role]);
      const room = cap.devs - c.devs;
      structureNote.innerHTML = full
        ? '<b>' + full[1] + ' ' + c[full[0]] + '/' + cap[full[0]] + '</b> are full, though you have room for ' + room + ' more dev' + (room === 1 ? '' : 's') +
          ' (<b>Devs ' + c.devs + '/' + cap.devs + '</b>): everyone needs someone a level up, and you look after one per level. ' + full[2]
        : '';
      structureNote.hidden = !full;

      rosterCount.textContent = state.roster.length + (state.roster.length === 1 ? ' person' : ' people');

      const director = state.roster.find(p => p.role === 'Director');
      const c0 = headcounts(state.roster);
      const skills = Object.keys(D.LANGS).map(k => {
        const boost = directorBoost(D.LANGS[k].studio);
        return esc(D.LANGS[k].name) + ' Lv ' + directorLevel(k) + (boost ? ' (+' + Math.round(boost * 100) + '% success)' : '');
      }).join(' · ');
      let html = '<div class="card director"><div class="card-top"><span class="card-name">' + esc(director.name) + '</span>' +
                 '<span class="card-level">Director</span></div>' +
                 '<div class="card-stats"><span>' + skills + '</span></div>' +
                 '<div class="card-foot"><span>' + (c0.Manager
                   ? 'Solving the daily puzzles at your desk. Your managers look after the team.'
                   : 'Solving the daily puzzles at your desk, and managing the start-up yourself (up to ' + DIRECTOR_SPAN + ' devs).') +
                 '</span></div></div>';

      ROSTER_GROUPS.forEach(level => {
        const members = state.roster.filter(p => p.role === level);
        if(!members.length) return;
        const sloc = members.length * ROLES[level].sloc;
        const salary = members.length * ROLES[level].salary;
        const busy = members.filter(p => jobFor(p.id)).length;
        const collapsed = state.collapsedLevels.indexOf(level) >= 0;
        html += '<div class="level-group' + (collapsed ? ' collapsed' : '') + '">' +
          '<div class="level-header" data-action="toggle-level" data-level="' + level + '">' +
            '<div class="level-header-left"><span class="chevron">▾</span>' +
            '<span class="level-name">' + level + (members.length > 1 ? 's' : '') + '</span>' +
            '<span class="level-count">×' + members.length + ' · ' + busy + ' busy</span></div>' +
            '<div class="level-sum">' + (sloc ? sloc + ' SLOC/min · ' : '') + '−¤' + salary + '/min</div>' +
          '</div><div class="level-body">' +
          members.map(p => cardHTML(p, now)).join('') +
          '</div></div>';
      });
      setHTML(rosterEl, html);
      renderPersonModal(now);

      let hire = '';
      HIRE_BUTTONS.forEach(role => {
        const why = hireProblem(role);
        const cost = hireCost(role);
        const broke = state.money < cost;
        const rise = Math.round((cost / ROLES[role].cost - 1) * 100);
        hire += '<button class="hire-btn' + (role === 'Manager' ? ' mgr' : '') +
                (guide && guide.key === 'hire' && role === 'Graduate' ? ' guide-target' : '') + '" data-action="hire" data-role="' + role + '"' +
                (why || broke ? ' disabled' : '') + '>' +
                '<span class="role">Hire ' + role.toLowerCase() + '</span> <span class="cost"' +
                  (rise > 0 ? ' title="Up ' + rise + '% since the company started, from inflation and competition"' : '') + '>' + fmt(cost) +
                  (rise > 0 ? ' <span class="rise">↑' + rise + '%</span>' : '') + '</span>' +
                '<span class="why">' + (why ? esc(why) : broke ? 'not enough cash' : ROLES[role].salary + '/min salary') + '</span>' +
                '</button>';
      });
      setHTML(hireGrid, hire);
      renderApplicants(now);
    }

    function renderApplicants(now){
      let html = state.applicants.map(a => {
        const why = hireProblem(a.role);
        const broke = state.money < a.cost;
        return '<div class="applicant" data-applicant="' + a.id + '">' +
          '<div class="card-top"><span class="card-name">' + esc(a.person.name) + '</span>' +
          '<span class="card-level ' + a.role + '">' + a.role + '</span></div>' +
          '<div class="card-stats"><span>' + ROLES[a.role].sloc + ' SLOC/min · ' + topSkillsText(a.person) + '</span>' +
          '<span>−¤' + ROLES[a.role].salary + '/min</span></div>' +
          '<div class="card-foot"><span class="promo">Offer open ' + fmtDuration(a.expiresAt - now) + '</span>' +
          '<button class="btn-small btn-promote" data-action="hire-applicant" data-id="' + a.id + '"' + (why || broke ? ' disabled' : '') + '>' +
            'Hire for ' + fmt(a.cost) + '</button></div>' +
          (why || broke ? '<div class="card-foot"><span class="promo blocked">' + esc(why || 'not enough cash') + '</span></div>' : '') +
          '</div>';
      }).join('');
      if(!html) html = '<p class="applicants-note">Nobody’s applied yet. Experienced developers apply every day or so, and their offers stay open for ' + APPLICANT_OPEN_H + ' hours.</p>';
      const locked = APPLICANT_ROLES.filter(r => (state.reputation || 0) < APPLICANT_REP[r]);
      if(locked.length){
        html += '<p class="applicants-note">' + locked.map(r => (r === 'Senior' ? 'Seniors' : 'Principals') +
          ' apply once the studio has ' + APPLICANT_REP[r].toLocaleString('en-GB') + ' reputation').join('; ') +
          ' (you have ' + Math.floor(state.reputation || 0).toLocaleString('en-GB') + '). Delivered contracts and daily puzzles earn it.</p>';
      }
      setHTML(applicantsEl, html);
    }

    function cardHTML(p, now){
      const role = ROLES[p.role];
      const job = jobFor(p.id);
      const status = job && !isRunning(job)
        ? '<span class="promo blocked">' + TIERS[job.tier].name + ' failed — retry or drop it below</span>'
        : job
        ? '<span class="status-busy">On ' + TIERS[job.tier].name + ' · ' + esc(job.lang) +
          (job.repeat ? ' <span class="repeat-tag">↻</span>' : '') + '</span>'
        : isDev(p) ? '<span class="status-idle warn">On the bench · −¤' + role.salary + '/min</span>'
        : '<span class="status-idle">Idle</span>';

      let promo = '';
      const ps = promotionStatus(p, now);
      if(ps){
        if(ps.ready){
          promo = '<button class="btn-small btn-promote" data-action="promote" data-id="' + p.id + '">Promote to ' + ps.next + '</button>';
        }else if(ps.blocked){
          promo = '<span class="promo blocked">Ready for ' + ps.next + ', but ' + esc(ps.blocked) + '</span>';
        }else{
          promo = '<span class="promo">→ ' + ps.next + ': needs ' + ps.missing.join(', ') + '</span>';
        }
      }
      const releaseWhy = releaseProblem(p);
      const release = '<button class="btn-small btn-ghost" data-action="release" data-id="' + p.id + '"' +
                      (releaseWhy ? ' disabled title="Can’t let go: ' + esc(releaseWhy) + '"' : '') + '>Let go</button>';

      return '<div class="card" data-action="inspect" data-id="' + p.id + '">' +
        '<div class="card-top"><span class="card-name">' + esc(p.name) + '</span>' +
        '<span class="card-level ' + p.role + '">' + p.role + '</span></div>' +
        '<div class="card-stats"><span>' + (isDev(p) ? role.sloc + ' SLOC/min · ' + topSkillsText(p) : 'Looks after the team · no SLOC') + '</span>' +
        '<span>−¤' + role.salary + '/min</span></div>' +
        '<div class="card-foot">' + status + '<span class="foot-actions">' + release + '</span></div>' +
        (promo ? '<div class="card-foot" style="margin-top:6px;">' + promo + '</div>' : '') +
        '</div>';
    }

    // Short summary of a dev's two best languages for a roster card; the full
    // breakdown is in the employee panel.
    function topSkillsText(p){
      const known = Object.keys(p.lang).filter(k => bars(p.lang[k]) > 0)
        .sort((a, b) => p.lang[b] - p.lang[a]).slice(0, 2);
      return known.length ? known.map(k => esc(k) + ' ' + bars(p.lang[k])).join(' · ') : 'no languages yet';
    }

    // The board is a tree like the roster: one foldable group per contract type,
    // with its offers sorted by language. Folded groups are remembered in the save.
    function renderBoard(){
      let html = '';
      TIERS.forEach((t, ti) => {
        const offers = state.board.filter(o => o.tier === ti)
          .sort((a, b) => LANGS.indexOf(a.lang) - LANGS.indexOf(b.lang));
        if(!tierOpen(ti) && !offers.length){
          html += '<div class="level-group board-group collapsed locked" data-tier="' + t.key + '">' +
            '<div class="level-header"><div class="level-header-left">' +
            '<span class="level-name">' + t.plural + '</span><span class="level-count">' + tierLock(ti) + '</span></div>' +
            '<div class="level-sum board-sum">' + t.req + '</div></div></div>';
          return;
        }
        if(!offers.length) return;
        const running = state.jobs.filter(j => j.tier === ti).length;
        const collapsed = state.collapsedTiers.indexOf(t.key) >= 0;
        html += '<div class="level-group board-group' + (collapsed ? ' collapsed' : '') + '" data-tier="' + t.key + '">' +
          '<div class="level-header" data-action="toggle-tier" data-tier="' + t.key + '">' +
            '<div class="level-header-left"><span class="chevron">▾</span>' +
            '<span class="level-name">' + t.plural + '</span>' +
            '<span class="level-count">×' + offers.length + (running ? ' · ' + running + ' running' : '') + '</span></div>' +
            '<div class="level-sum board-sum">' + t.req + '</div>' +
          '</div><div class="level-body board-body">' + offersHTML(offers) + '</div></div>';
      });
      setHTML(boardEl, html);
    }

    // Offers someone on staff can take come first. The rest (languages nobody knows) fold
    // behind one toggle, unless nobody's been hired yet.
    function offersHTML(offers){
      const devs = state.roster.filter(isDev);
      if(!devs.length) return offers.map(offerHTML).join('');
      const can = offers.filter(o => devs.some(d => qualifiedFor(d, o)));
      const rest = offers.filter(o => !can.includes(o));
      let html = can.map(offerHTML).join('');
      if(rest.length){
        html += '<button class="board-more" data-action="toggle-unknown">' +
          (state.showUnknownOffers ? 'Hide' : 'Show') + ' ' + rest.length + ' in language' + (rest.length === 1 ? '' : 's') +
          ' nobody on staff knows' + (state.showUnknownOffers ? '' : ' ▾') + '</button>';
        if(state.showUnknownOffers) html += rest.map(offerHTML).join('');
      }
      return html;
    }

    function offerHTML(o){
      const t = TIERS[o.tier];
      return '<div class="offer">' +
        '<div class="offer-top"><span class="chip lang">' + esc(o.lang) + '</span><span class="dur">' + o.sloc.toLocaleString('en-GB') + ' SLOC</span></div>' +
        (state.roster.some(p => isDev(p) && qualifiedFor(p, o)) ? ''
          : '<div class="detail" style="color:var(--amber)">Nobody on staff knows ' + esc(o.lang) + '</div>') +
        '<div class="detail">≈ ' + fmtClock(o.sloc / t.refSloc * 60000) + ' with a minimum team, no ' + esc(o.lang) + ' skill · ' +
          t.xpPerMin + ' XP/min</div>' +
        '<div class="detail" style="color:var(--text-faint)">Replaced in ' + fmtDuration(o.expiresAt - Date.now()) + ' if not taken</div>' +
        '<button class="btn-ghost btn-small' + (guide && guide.offerId === o.id ? ' guide-target' : '') + '" data-action="staff" data-offer="' + o.id + '">Staff a team</button>' +
        '</div>';
    }

    // The job list is rebuilt only when jobs start/stop or their repeat flag
    // changes; the countdowns and progress bars are updated in place each tick
    // so the repeat toggles stay clickable.
    function renderJobs(now){
      const jobs = state.jobs.slice().sort((a, b) => a.endsAt - b.endsAt);
      if(!jobs.length){
        setHTML(jobsEl, '<div class="empty">Nobody is on a contract right now.</div>');
      }else{
        setHTML(jobsEl, jobs.map(j => {
          const t = TIERS[j.tier];
          const team = j.team.map(id => { const p = person(id); return p ? esc(p.name) : '?'; }).join(', ');
          if(!isRunning(j)){
            return '<div class="job failed">' +
              '<div class="job-top"><span class="left">' + t.name +
              ' <span class="chip lang">' + esc(j.lang) + '</span></span>' +
              '<span class="time" style="color:var(--red)">Failed</span></div>' +
              '<div class="detail">' + team + ' · the team is waiting on your call.</div>' +
              '<div class="actions" style="margin:8px 0 0;">' +
                '<button class="btn-primary btn-small" data-action="retry-job" data-job="' + j.id + '">Retry — ' +
                  fmtClock(retryMs(j)) + ' for ' + fmt(retryPayout(j)) + ' (' + Math.round(j.chance * 100) + '%)</button>' +
                '<button class="btn-ghost btn-small" data-action="drop-job" data-job="' + j.id + '">Drop it</button>' +
              '</div></div>';
          }
          return '<div class="job">' +
            '<div class="job-top"><span class="left">' + t.name +
            ' <span class="chip lang">' + esc(j.lang) + '</span></span>' +
            '<span class="time" data-time="' + j.id + '"></span></div>' +
            '<div class="progress"><div data-bar="' + j.id + '"></div></div>' +
            '<div class="detail">' + team + (j.sloc ? ' · ' + j.sloc.toLocaleString('en-GB') + ' SLOC at ' + j.teamSloc + '/min' : '') +
            ' · ' + Math.round(j.chance * 100) + '% success · ' + fmt(j.payout) +
            ' on delivery' + (j.attempt === 2 ? ' · retry' : '') + '</div>' +
            '<label class="repeat-row" style="margin:6px 0 0;"><input type="checkbox" data-repeat="' + j.id + '"' +
            (j.repeat ? ' checked' : '') + '> Repeat with this team when it finishes</label>' +
            '</div>';
        }).join(''));
        jobs.filter(isRunning).forEach(j => {
          const time = jobsEl.querySelector('[data-time="' + j.id + '"]');
          const bar = jobsEl.querySelector('[data-bar="' + j.id + '"]');
          const pct = Math.min(100, ((now - j.startedAt) / (j.endsAt - j.startedAt)) * 100);
          if(time) time.textContent = fmtClock(j.endsAt - now) + ' left';
          if(bar) bar.style.width = pct.toFixed(1) + '%';
        });
      }
      setHTML(logEl, state.log.length
        ? state.log.map(l => '<div class="' + l.kind + '">' + esc(l.text) + '</div>').join('')
        : '<div class="empty">Nothing delivered yet.</div>');
    }

    jobsEl.addEventListener('change', (e) => {
      const id = e.target.dataset && e.target.dataset.repeat;
      if(!id) return;
      setRepeat(id, e.target.checked);
      save();
      renderAll();
    });

    let guide = null;
    function renderAll(){
      const now = Date.now();
      guide = renderGuide();
      renderStats();
      renderStudio(now);
      renderBoard();
      renderJobs(now);
    }

    // ---------------------------------------------------------------------
    // Team picker
    // ---------------------------------------------------------------------

    let picker = null; // { offerId, selected: Set, repeat }

    function openPicker(offerId){
      const offer = state.board.find(o => o.id === offerId);
      // Hotfixes default to repeating so a grad keeps earning unattended.
      picker = { offerId, selected: new Set(), repeat: !!offer && TIERS[offer.tier].key === 'hotfix' };
      teamModal.hidden = false;
      renderPicker();
    }
    function closePicker(){
      picker = null;
      teamModal.hidden = true;
      teamModalBody.innerHTML = '';
    }

    function pickerContext(){
      const offer = state.board.find(o => o.id === picker.offerId);
      if(!offer) return null;
      const tier = TIERS[offer.tier];
      const busy = busyIds();
      const free = state.roster.filter(p => eligibleFor(tier, p) && !busy.has(p.id));
      // Learners can join team contracts, but not a solo hotfix.
      const pool = tier.max > 1 ? free : free.filter(p => qualifiedFor(p, offer));
      const unqualified = free.filter(p => pool.indexOf(p) < 0);
      // Drop any selection that's no longer available.
      picker.selected.forEach(id => { if(!pool.some(p => p.id === id)) picker.selected.delete(id); });
      return { offer, tier, pool, unqualified, busyCount: state.roster.filter(p => eligibleFor(tier, p) && busy.has(p.id)).length };
    }

    function suggestTeam(tier, offer, pool){
      const fit = p => bars(p.lang[offer.lang]);
      const byFit = pool.slice().sort((a, b) => fit(b) - fit(a) || levelRank(b.role) - levelRank(a.role));
      const chosen = [];
      const take = (pred, n) => {
        for(const p of byFit){
          if(n <= 0) break;
          if(chosen.indexOf(p) < 0 && pred(p)){ chosen.push(p); n--; }
        }
      };
      if(tier.needs.Manager) take(p => p.role === 'Manager', tier.needs.Manager);
      if(tier.needs.Principal) take(p => p.role === 'Principal', tier.needs.Principal);
      if(tier.needs.Senior){
        const have = () => chosen.filter(p => levelRank(p.role) >= levelRank('Senior')).length;
        const need = tier.needs.Senior + (tier.needs.Principal || 0);
        take(p => p.role === 'Senior', need - have());
        take(p => p.role === 'Principal', need - have());
      }
      // Fill the rest with the most junior people who know the stack first —
      // that's who needs the XP — then learners, if still short and there are
      // enough people who know the stack to mentor them.
      const knows = p => qualifiedFor(p, offer);
      const filler = pool.filter(isDev).sort((a, b) =>
        (knows(b) - knows(a)) || levelRank(a.role) - levelRank(b.role) || fit(b) - fit(a));
      for(const p of filler){
        if(chosen.length >= tier.min) break;
        if(chosen.indexOf(p) >= 0) continue;
        const devs = chosen.filter(isDev);
        const learners = devs.filter(d => !knows(d)).length;
        if(!knows(p) && learners + 1 > devs.length - learners) continue;
        chosen.push(p);
      }
      return chosen.map(p => p.id);
    }

    function renderPicker(){
      if(!picker) return;
      const ctx = pickerContext();
      if(!ctx){ closePicker(); return; }
      const { offer, tier, pool, unqualified, busyCount } = ctx;
      const members = pool.filter(p => picker.selected.has(p.id));
      const ev = evaluateTeam(tier, offer, members);

      const order = ['Manager', 'Principal', 'Senior', 'Junior', 'Graduate'];
      const rows = pool.slice().sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role)).map(p => {
        const on = picker.selected.has(p.id);
        const meta = isDev(p)
          ? '<span class="bars">' + barString(bars(p.lang[offer.lang])) + '</span>' +
            (qualifiedFor(p, offer) ? ' · ' + (Math.round(devSlocOn(p, offer) * 10) / 10) + ' SLOC/min'
                                    : ' · <span style="color:var(--amber)">learner, −' + Math.round(LEARNER_DRAG * 100) + '% team</span>')
          : 'no SLOC';
        return '<label class="pick' + (on ? ' on' : '') + '">' +
          '<input type="checkbox" data-pick="' + p.id + '"' + (on ? ' checked' : '') + '>' +
          '<span><b>' + esc(p.name) + '</b> · ' + p.role + '</span>' +
          '<span class="meta">' + meta + '</span></label>';
      }).join('') + unqualified.map(p =>
        '<label class="pick unqualified">' +
          '<input type="checkbox" disabled>' +
          '<span><b>' + esc(p.name) + '</b> · ' + p.role + '</span>' +
          '<span class="meta">no ' + esc(offer.lang) + ' skill — can only learn in a team</span></label>'
      ).join('');

      teamModalBody.innerHTML =
        '<h2>' + tier.name + ' <span class="chip lang">' + esc(offer.lang) + '</span>' +
        ' <span class="tag">' + offer.sloc.toLocaleString('en-GB') + ' SLOC</span></h2>' +
        '<div class="offer"><div class="detail" style="border:none;padding:0;">Needs ' + tier.req +
        '. Bars shown are each person’s ' + esc(offer.lang) + ' skill.</div></div>' +
        '<div class="pick-list">' + (rows || '<div class="empty">Nobody free who can take this on.</div>') + '</div>' +
        (busyCount ? '<div class="empty" style="margin-bottom:10px;">' + busyCount + ' more busy on other contracts.</div>' : '') +
        '<div class="checks">' + ev.checks.map(c => '<span class="check ' + (c.ok ? 'ok' : 'no') + '">' + (c.ok ? '✓ ' : '✕ ') + esc(c.label) + '</span>').join('') + '</div>' +
        '<div class="forecast">' +
          'Success chance <b>' + Math.round(ev.chance * 100) + '%</b>' +
            (ev.boost ? ' (incl. +' + Math.round(ev.boost * 100) + '% from your ' + esc(offer.lang) + ' level)' : '') + ' · Payout <b>' + fmt(ev.payout) + '</b> · ' +
          'Salaries over the job <b>' + fmt(ev.salaryCost) + '</b><br>' +
          'Team output <b>' + ev.sloc + ' SLOC/min</b>' +
            (ev.matchedSloc > ev.baseSloc || ev.learners
              ? ' (' + ev.baseSloc + ' base' +
                (ev.matchedSloc > ev.baseSloc ? ', +' + Math.round((ev.matchedSloc / ev.baseSloc - 1) * 100) + '% skill match' : '') +
                (ev.learners ? ', −' + Math.round(LEARNER_DRAG * ev.learners * 100) + '% for ' + ev.learners + ' learner' + (ev.learners > 1 ? 's' : '') : '') + ')'
              : '') +
            ' → takes <b>' + (ev.sloc ? fmtClock(ev.ms) : '—') + '</b><br>' +
          'Everyone gains <b>+' + fmtXp(ev.xp) + ' XP</b> in ' + esc(offer.lang) + ' if it’s delivered. If it fails, you can retry once in half the time for ' + Math.round(RETRY_PAYOUT * 100) + '% of the payout.' +
        '</div>' +
        '<label class="repeat-row"><input type="checkbox" data-picker-repeat' + (picker.repeat ? ' checked' : '') + '>' +
          'Repeat with this team — roll straight into another ' + tier.name.toLowerCase() + ' when it finishes, even while you’re away</label>' +
        '<div class="actions">' +
          '<button class="btn-primary" data-action="pick-start"' + (ev.valid ? '' : ' disabled') + '>Start contract</button>' +
          '<button class="btn-ghost" data-action="pick-suggest">Suggest a team</button>' +
          '<button class="btn-ghost" data-action="pick-cancel">Cancel</button>' +
        '</div>';
    }

    teamModal.addEventListener('change', (e) => {
      if(picker && e.target.hasAttribute('data-picker-repeat')){
        picker.repeat = e.target.checked;
        return;
      }
      const id = e.target.dataset && e.target.dataset.pick;
      if(!id || !picker) return;
      if(e.target.checked) picker.selected.add(id); else picker.selected.delete(id);
      renderPicker();
    });
    teamModal.addEventListener('click', (e) => {
      if(e.target === teamModal){ closePicker(); return; }
      const btn = e.target.closest('[data-action]');
      if(!btn || !picker) return;
      const action = btn.dataset.action;
      if(action === 'pick-cancel'){
        closePicker();
      }else if(action === 'pick-suggest'){
        const ctx = pickerContext();
        if(!ctx) return;
        picker.selected = new Set(suggestTeam(ctx.tier, ctx.offer, ctx.pool));
        renderPicker();
      }else if(action === 'pick-start'){
        if(startJob(picker.offerId, Array.from(picker.selected), picker.repeat)){
          closePicker();
          renderAll();
        }else{
          renderPicker();
        }
      }
    });
    // Pausing stops the clock: no salaries, no contract progress. The page reloads
    // without the studio, and switching it back on resumes where it left off.
    document.getElementById('ltdPause').addEventListener('click', () => {
      track('paused');
      clearInterval(tickTimer);
      state.enabled = false;
      state.pausedAt = Date.now();
      save();
      location.reload();
    });
    // Deletes the company for good. The tick is stopped first so it can't re-save it.
    document.getElementById('ltdClose').addEventListener('click', () => {
      if(!confirm('Close Debuggit Ltd? Your studio, staff, cash and reputation will be deleted. Your puzzle progress, XP and streak are kept.')) return;
      track('closed');
      stopGame();
      try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
      location.reload();
    });

    document.addEventListener('keydown', (e) => {
      if(e.key !== 'Escape') return;
      if(picker) closePicker();
      if(inspectId) closePersonModal();
    });

    // ---------------------------------------------------------------------
    // Studio actions
    // ---------------------------------------------------------------------

    function onAction(e){
      const btn = e.target.closest('[data-action]');
      if(!btn || btn.disabled) return;
      const action = btn.dataset.action;

      if(action === 'hire'){
        const role = btn.dataset.role;
        const cost = hireCost(role);
        if(state.money < cost || hireProblem(role)) return;
        state.money -= cost;
        const hire = makeHire(role);
        state.roster.push(hire);
        addLog('info', 'Hired ' + hire.name + ' as ' + role.toLowerCase() + '.');
        track('hired/' + role.toLowerCase());
      }else if(action === 'toggle-unknown'){
        state.showUnknownOffers = !state.showUnknownOffers;
      }else if(action === 'skip-guide'){
        state.guideDone = true;
      }else if(action === 'hire-applicant'){
        const a = (state.applicants || []).find(x => x.id === btn.dataset.id);
        if(!a || state.money < a.cost || hireProblem(a.role)) return;
        state.money -= a.cost;
        state.applicants = state.applicants.filter(x => x !== a);
        a.person.since = Date.now();
        state.roster.push(a.person);
        addLog('info', 'Hired ' + a.person.name + ' as ' + a.role.toLowerCase() + '.');
        track('hired/' + a.role.toLowerCase());
      }else if(action === 'promote'){
        const p = person(btn.dataset.id);
        const ps = p && promotionStatus(p, Date.now());
        if(!ps || !ps.ready) return;
        p.role = ps.next;
        p.since = Date.now();
        p.worked = 0;
        addLog('ok', '★ ' + p.name + ' promoted to ' + ps.next.toLowerCase() + '.');
        track('promoted/' + ps.next.toLowerCase());
      }else if(action === 'release'){
        const p = person(btn.dataset.id);
        if(!p || releaseProblem(p)) return;
        if(!confirm('Let ' + p.name + ' go?')) return;
        state.roster = state.roster.filter(x => x.id !== p.id);
        addLog('info', p.name + ' has left the studio.');
      }else if(action === 'staff'){
        openPicker(btn.dataset.offer);
        return;
      }else if(action === 'retry-job' || action === 'drop-job'){
        const job = state.jobs.find(j => j.id === btn.dataset.job);
        if(!job || isRunning(job)) return;
        if(action === 'retry-job'){
          retryJob(job, Date.now());
          addLog('info', '↻ Retrying ' + jobTag(job) + ' for ' + fmt(job.payout) + '.');
        }else{
          state.jobs = state.jobs.filter(j => j !== job);
          addLog('info', 'Dropped ' + jobTag(job) + '.');
        }
      }else if(action === 'inspect'){
        openPersonModal(btn.dataset.id);
        return;
      }else if(action === 'toggle-level'){
        const level = btn.dataset.level;
        const i = state.collapsedLevels.indexOf(level);
        if(i < 0) state.collapsedLevels.push(level); else state.collapsedLevels.splice(i, 1);
      }else if(action === 'toggle-tier'){
        const key = btn.dataset.tier;
        const i = state.collapsedTiers.indexOf(key);
        if(i < 0) state.collapsedTiers.push(key); else state.collapsedTiers.splice(i, 1);
      }else{
        return;
      }
      save();
      renderAll();
    }
    studioEl.addEventListener('click', onAction);
    boardSlot.addEventListener('click', onAction);

    // ---------------------------------------------------------------------
    // Boot + tick
    // ---------------------------------------------------------------------

    if(!state.collapsedLevels) state.collapsedLevels = [];
    if(!state.collapsedTiers) state.collapsedTiers = [];
    // Version 1 saves used quick fix / sprint / milestone / full delivery,
    // which map one-for-one onto hotfix / patch / minor / major (same tier
    // indices), so only the board needs refreshing to pick up the new names.
    if((state.tiersVersion || 1) < TIERS_VERSION){
      state.board = makeBoard();
      state.tiersVersion = TIERS_VERSION;
    }
    // Assembly was dropped as a language: fold anyone's Assembly XP into
    // C/C++ (the closest fit), and move running jobs and offers across too.
    state.roster.forEach(p => {
      if(p.lang && p.lang.Assembly){
        p.lang['C/C++'] = Math.max(p.lang['C/C++'] || 0, p.lang.Assembly);
        delete p.lang.Assembly;
      }
    });
    state.jobs.forEach(j => { if(j.lang === 'Assembly') j.lang = 'C/C++'; });
    state.board.forEach((o, i) => { if(o.lang === 'Assembly') state.board[i] = makeOffer(o.tier); });

    // Domains were dropped (languages only for now): strip them from staff and
    // contracts in progress, and rebuild the board with a hotfix in every language.
    if((state.boardVersion || 1) < BOARD_VERSION){
      state.roster.forEach(p => { delete p.dom; if(!p.lang) p.lang = {}; });
      state.jobs.forEach(j => { delete j.dom; });
      state.board = makeBoard();
      state.boardVersion = BOARD_VERSION;
    }

    // Offers from before contracts had a SLOC target.
    if(state.board.some(o => !o.sloc)) state.board = makeBoard();
    state.board.forEach(o => { if(!o.expiresAt) o.expiresAt = Date.now() + TIERS[o.tier].offerLife * 60000; });
    refreshBoard(Date.now());
    moveMarket(Date.now());
    moveApplicants(Date.now());

    const now = Date.now();
    const elapsedSeconds = Math.max(0, (now - (state.lastTick || now)) / 1000);
    const cappedSeconds = Math.min(elapsedSeconds, OFFLINE_CAP_SECONDS);
    if(cappedSeconds > 5){
      const before = state.money;
      paySalaries(cappedSeconds);
      const finished = resolveDueJobs(now);
      const delta = state.money - before;
      if(finished || delta !== 0){
        opening = 'Welcome back — ' +
          (finished ? finished + ' contract' + (finished > 1 ? 's' : '') + ' wrapped up while you were away. ' : '') +
          'Net change: ' + fmt(delta) + (elapsedSeconds > OFFLINE_CAP_SECONDS ? ' (payroll capped at 4 hours).' : '.');
      }
    }
    state.lastTick = now;
    save();

    renderAll();
    if(opening) showToast(opening);

    tickTimer = setInterval(() => {
      const t = Date.now();
      paySalaries((t - state.lastTick) / 1000);
      state.lastTick = t;
      if(resolveDueJobs(t) && picker) renderPicker();
      refreshBoard(t);
      moveMarket(t);
      moveApplicants(t);
      renderAll();
      save();
    }, 1000);
  }

  let stopGame = () => {};
  return { start, stop: () => stopGame() };
})();
