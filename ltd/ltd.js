// Debuggit Ltd: the studio, team, contract board and the Director's desk.
//
// Loaded by index.html on the Ltd tab, when the studio is switched on (see the loader there).
// The daily puzzle is its own game and pays nothing here. The Director's desk is desk jobs:
// questions from past dailies and Debuggit Learn that turn up over time (see "The desk" below,
// and ltd/desk.js for the questions).
//
// DebuggLtd.start({ stats, studio, board, desk }) builds the studio into those slots
// and starts the game. It either resumes the saved company, imports a save from before
// the merge (when the studio lived at /studio/), or founds a new one.
window.DebuggLtd = (function(){
  const D = window.Debugg;

  // The desk: desk jobs turn up every DESK_EVERY_MIN minutes (at random), at most DESK_MAX waiting,
  // each open for DESK_LIFE_H hours. A job is 1 to 3 questions (DESK_SIZES: size and weight). Each
  // right answer pays DESK_PAY by the question's difficulty (Learn questions count as 1) and
  // DESK_REP reputation; a job with every answer right is boosted by DESK_BOOST for its size.
  // Pay (not reputation) shrinks as the business grows (STAGES' `desk`).
  const DESK_EVERY_MIN = [45, 90];
  const DESK_MAX = 3;
  const DESK_LIFE_H = 4;
  const DESK_SIZES = [[1, 0.5], [2, 0.33], [3, 0.17]];
  const DESK_PAY = { 1: 40, 2: 55, 3: 70, 4: 85, 5: 100 };
  const DESK_BOOST = { 1: 1, 2: 1.25, 3: 1.5 };
  const DESK_REP = 1;
  const DESK_SEEN = 40;  // questions recently asked, kept out of new jobs
  // A new company starts with ¤150, plus ¤1 per puzzle XP already earned (up to ¤1,000).
  const START_CASH = 250;
  const FOUNDER_BONUS_CAP = 1000;
  // Puzzle levels boost contract success in that language: +1% per level above 1, up to +10%.
  const DIRECTOR_BOOST_PER_LEVEL = 0.01;
  const DIRECTOR_BOOST_CAP = 0.10;

  function start(slots){
    // A new company's name and its Director's name and look, from the founding step (ltd/founding.js).
    const founding = slots.founding || null;
    const statsSlot = slots.stats, studioSlot = slots.studio, boardSlot = slots.board, deskSlot = slots.desk;
    // The office view (ltd/office.js) is optional: without its slot or its script the studio plays the same.
    const officeSlot = slots.office && window.DebuggOffice ? slots.office : null;

    // ---------------------------------------------------------------------
    // Markup
    // ---------------------------------------------------------------------

    [statsSlot, studioSlot, boardSlot, deskSlot, officeSlot].forEach(el => { if(el){ el.classList.add('ltd'); el.hidden = false; } });
    if(officeSlot) officeSlot.innerHTML =
      '<div class="panel office-view">' +
        '<h2>Office <span class="tag" id="officeTag"></span></h2>' +
        '<div class="office-box" id="officeBox"></div>' +
      '</div>';
    deskSlot.innerHTML =
      '<div class="panel desk-panel">' +
        '<h2>Your desk <span class="tag" id="deskCount"></span></h2>' +
        '<p class="desk-intro">Desk jobs for you, the Director: questions from past daily puzzles and Debuggit Learn. ' +
          'Every right answer pays the company, and a job with every answer right pays a bonus.</p>' +
        '<div class="desk-play" id="deskPlay" hidden></div>' +
        '<div class="desk-jobs" id="deskJobs"></div>' +
      '</div>';
    statsSlot.innerHTML =
      '<div class="stage-bar" id="stageBar"></div>' +
      '<div class="stat-bar">' +
        '<div class="stat"><div class="label">Cash</div><div class="value money" id="statMoney">¤0</div></div>' +
        '<div class="stat"><div class="label">SLOC/min</div><div class="value rate" id="statSloc">0</div></div>' +
        '<div class="stat"><div class="label">Reputation</div><div class="value rep" id="statRep">0</div></div>' +
        '<div class="stat"><div class="label" id="statPayrollLabel">Payroll</div><div class="value rate" id="statPayroll">¤0/min</div></div>' +
        '<div class="stat"><div class="label">Headcount</div><div class="value" id="statHeads">1</div></div>' +
      '</div>' +
      '<div class="toast" id="welcomeToast"></div>';
    studioSlot.innerHTML =
      '<div class="panel">' +
        '<h2><span id="studioName">Studio</span> <span class="tag" id="rosterCount">1 person</span></h2>' +
        '<div id="guide"></div>' +
        '<div class="structure" id="structure"></div>' +
        '<p class="structure-note" id="structureNote"></p>' +
        '<div class="premises" id="office"></div>' +
        '<details class="people-list"><summary>Everyone in the studio</summary><div class="roster" id="roster"></div></details>' +
        '<div class="hire-grid" id="hireGrid"></div>' +
        '<h3>Applicants</h3>' +
        '<div class="applicants" id="applicants"></div>' +
      '</div>';
    boardSlot.innerHTML =
      '<div class="panel">' +
        '<div class="notifications" id="notifications" hidden></div>' +
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
    const statMoney = $('statMoney'), statRep = $('statRep'), statPayroll = $('statPayroll'), statHeads = $('statHeads'), statPayrollLabel = $('statPayrollLabel'), statSloc = $('statSloc');
    const structureEl = $('structure'), rosterEl = $('roster'), rosterCount = $('rosterCount'), studioName = $('studioName'), hireGrid = $('hireGrid'), applicantsEl = $('applicants');
    const guideEl = $('guide'), structureNote = $('structureNote'), stageBar = $('stageBar'), officeEl = $('office');
    const studioEl = studioSlot;
    const boardEl = $('board'), jobsEl = $('jobs'), logEl = $('log'), notifEl = $('notifications');
    const welcomeToast = $('welcomeToast');
    const teamModal = $('teamModal'), teamModalBody = $('teamModalBody');
    const personModal = $('personModal'), personModalBody = $('personModalBody');
    let tickTimer = null;
    let stopped = false;
    // Stops the clock and all saving, e.g. before a backup is restored over this company.
    stopGame = () => { stopped = true; clearInterval(tickTimer); if(officeSlot) window.DebuggOffice.unmount(); };

    // ---------------------------------------------------------------------
    // Studio model
    // ---------------------------------------------------------------------

    // Contracts, skills and XP are by language only for now. Domains (Web Dev, Games,
    // Embedded…) are planned to return later as an unlock with specialist hires.
    const LANGS = ['Python', 'C/C++', 'JavaScript', 'Rust'];
    // Language skill levels have no top. Levels 1–5 need 10, 50, 150, 400 and 1,000 XP in all;
    // after that each gap is 800 XP longer than the last (level 6 at 1,800, 7 at 3,400, 8 at
    // 5,800…; skillXp()). Up to SKILL_FULL each level adds 20% speed and some success chance;
    // after it, a little speed per level (SKILL_SPEED_BEYOND) and no more success chance.
    const SKILL_XP = [10, 50, 150, 400, 1000];
    const SKILL_FULL = 5;

    const DEV_LEVELS = ['Graduate', 'Junior', 'Senior', 'Principal'];
    const ROLES = {
      Director:  { sloc: 0,  salary: 0 },
      Manager:   { sloc: 0,  salary: 8,  cost: 900 },
      Graduate:  { sloc: 5,  salary: 2,  cost: 180,   reliability: 0.70 },
      Junior:    { sloc: 12, salary: 5,  cost: 750,   reliability: 0.80 },
      Senior:    { sloc: 30, salary: 12, cost: 3000,  reliability: 0.90 },
      Principal: { sloc: 70, salary: 28, cost: 12000, reliability: 0.95 },
      Intern:    { sloc: 0.2, salary: 0,               reliability: 0.65 }
    };
    // Every company starts with an intern (the player-owner's idea, September 2026): free, slow,
    // and only on hotfixes, which they take with the Director alongside them. The Director joins
    // the hotfix as a second person, so it's one intern job at a time. The pair can take a hotfix
    // in any language the intern knows or the Director is comfortable in (directorKnows()). An
    // intern takes no desk, isn't counted in the headcount or the supervision structure, and never
    // hands in their notice. After INTERN_DAYS the internship ends: they finish the hotfix they're
    // on, leave, and apply to stay on as a graduate for INTERN_OFFER of a graduate's hire cost
    // (whatever the studio's reputation).
    //
    // The intern gets stuck (the player-owner's idea, September 2026). They write a hotfix on the
    // clock (slowly: about 25 minutes), and can get stuck up to INTERN_STUCK_MAX times: each of
    // that many points, at random along the way (INTERN_STUCK_AT, as a share of the work), is a
    // sticking point with INTERN_STUCK chance (`job.stuckPoints`). Stuck, the hotfix stalls,
    // however long you're away, until the Director answers a puzzle in the hotfix's language from
    // the desk's pool. Right: the hotfix jumps INTERN_NUDGE of its length ahead (clearing any
    // sticking point it jumps past), and the answer pays like a desk question (DESK_PAY by
    // difficulty, × the stage's desk share) and DESK_REP reputation. Wrong: it loses INTERN_NUDGE
    // of its progress (never below none). Once written, it's always delivered, for a hotfix's pay.
    // No repeats, since each one may need you.
    const INTERN_STUCK = 0.5;
    const INTERN_STUCK_MAX = 3;
    const INTERN_STUCK_AT = [0.1, 0.9];
    const INTERN_NUDGE = 0.25;
    const INTERN_DAYS = 7;
    const INTERN_OFFER = 0.5;
    function isIntern(p){ return !!p && p.role === 'Intern'; }
    const HIRE_ORDER = ['Manager', 'Graduate', 'Junior', 'Senior', 'Principal'];
    // Developers can't be hired at will: they apply now and then (see "Applicants" below), graduates
    // included since September 2026 (the player-owner's call), so an early company gets by on its
    // intern and the puzzles until it has some reputation. Only managers have a hire button.
    const APPLICANT_ROLES = ['Graduate', 'Junior', 'Senior', 'Principal'];
    const HIRE_BUTTONS = HIRE_ORDER.filter(r => !APPLICANT_ROLES.includes(r));
    const ROSTER_GROUPS = ['Manager', 'Principal', 'Senior', 'Junior', 'Graduate', 'Intern'];

    // To be promoted INTO a level: minutes spent working on contracts at the
    // current level (bench time doesn't count), plus a skill level in their best language.
    // Deliberately slow: hiring at a level is the quick way to get one; growing your
    // own people is the cheap way. The skill levels are set so someone who sticks to one
    // language gets there at about the same time as the contract time (a grad on hotfixes
    // reaches Lv 3 in about 7 hours; Lv 5 about 3 days later; Lv 8 after about 14 days on
    // patches); someone spread across languages takes longer.
    const PROMOTION = {
      Junior:    { minutes: 12 * 60,  lang: 3 },  // 12 hours
      Senior:    { minutes: 72 * 60,  lang: 5 },  // 3 days
      Principal: { minutes: 336 * 60, lang: 8 }   // 14 days
    };

    // The hiring market: hire costs start at ROLES[role].cost and only go up. Every
    // MARKET_EVERY_H hours or so (at random), either inflation raises every role's
    // cost a little, or a rival studio competing for one level raises that one more.
    // Prices move while the page is closed too (not while the company is paused).
    const MARKET_EVERY_H = [12, 36];              // hours between market moves
    const INFLATION = [0.02, 0.04];               // every role, per move
    const COMPETITION = [0.06, 0.15];             // one role, per move
    const COMPETITION_CHANCE = 0.4;

    // The business's stage, by managers and headcount (the Director included). A start-up has
    // no managers: you staff every contract yourself, and desk jobs pay in full. From a small
    // business on, managers put idle developers on contracts, and desk jobs pay less
    // (`desk`), since the company earns its keep without you.
    const STAGES = [
      { key: 'startup', name: 'Start-up',        managers: 0,  heads: 0,   desk: 1,
        text: 'You run the team yourself: staff every contract, and desk jobs pay in full.' },
      { key: 'small',   name: 'Small business',  managers: 1,  heads: 0,   desk: 0.5,
        text: 'Your managers put idle developers on contracts. Desk jobs pay half.' },
      { key: 'midsize', name: 'Mid-size company', managers: 3, heads: 25,  desk: 0.25,
        text: 'Your managers keep everyone busy. Desk jobs pay a quarter.' },
      { key: 'large',   name: 'Large company',   managers: 6,  heads: 60,  desk: 0.1,
        text: 'The company runs itself. Desk jobs pay a tenth: they’re for you now.' },
      { key: 'multinational', name: 'Multinational', managers: 12, heads: 150, desk: 0.05,
        text: 'A household name. Desk jobs are pocket money.' }
    ];

    // Applicants: every APPLICANT_EVERY_H hours or so (at random) an experienced developer
    // applies, asking the market price ± a little, and their offer stays open for
    // APPLICANT_OPEN_H hours. Reputation decides who applies (APPLICANT_REP): nobody until the
    // studio has a little, then graduates and juniors (the very first applicant is always a
    // graduate, `state.hadApplicant`, so a new company can afford them), and seniors and principals
    // once it's known.
    // At most MAX_APPLICANTS wait at once. When a rival competes for a level, it also hires away an
    // applicant at it.
    const APPLICANT_EVERY_H = [8, 24];
    const FIRST_APPLICANT_H = 1;                  // the first applicant, once anyone will apply
    const APPLICANT_OPEN_H = 12;
    const MAX_APPLICANTS = 3;
    const APPLICANT_ASK = [0.9, 1.2];             // × the market price
    const APPLICANT_REP = { Graduate: 5, Junior: 5, Senior: 500, Principal: 5000 };
    const APPLICANT_WEIGHT = { Graduate: 10, Junior: 6, Senior: 3, Principal: 1 };

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
    // 2–3 minutes), so skill levels build at roughly the pace of the contract-time
    // promotion timers regardless of how fast the team is. Bigger contracts pay
    // slightly more XP per minute to reward teamwork.
    const SLOC_SPREAD = 0.15;
    // Skill match speeds a dev up on a contract: their SLOC/min is multiplied
    // by 1 + SKILL_SPEED × (their level in the contract's language, up to SKILL_FULL) / 5, so a
    // dev at level 5 in it works at double speed (and a little faster for each level after).
    const SKILL_SPEED = 1.0;
    // Past level 5, each level adds a little more speed: +5% of base SLOC/min per level.
    const SKILL_SPEED_BEYOND = 0.05;
    // …and adds up to this much success chance (a team at level 5 or more gets all of it).
    const SKILL_CHANCE = 0.05;
    const MIN_JOB_MS = 5000; // floor, so a principal on a hotfix isn't instant
    // A failed contract can be retried once in RETRY_TIME of the time for
    // RETRY_PAYOUT of the payout.
    const RETRY_TIME = 0.5;
    const RETRY_PAYOUT = 0.75;
    // Some offers are riskier: they pay more (`pay`) but succeed less often (`chance`, added to
    // the team's success chance, never below MIN_CHANCE), and failing them costs more reputation
    // (`repLoss`, times the usual). Rolled per offer by `weight`. A repeat keeps its contract's risk.
    const RISKS = {
      standard: { name: 'Standard',    weight: 70, pay: 1,   chance: 0,     repLoss: 1 },
      risky:    { name: 'Risky',       weight: 22, pay: 1.4, chance: -0.15, repLoss: 2 },
      high:     { name: 'High stakes', weight: 8,  pay: 2,   chance: -0.30, repLoss: 4 }
    };
    const MIN_CHANCE = 0.05;
    // Expert contracts need someone on the team at a skill level in the contract's language
    // (`offer.expert`), and pay more for it. Rolled per offer (0 = anyone who knows the
    // language), except the hotfix every language always has, which anyone can take; the
    // board also keeps EXPERT_HOTFIXES expert hotfixes. A repeat keeps its contract's level.
    const EXPERT = [
      { level: 3, weight: 14, pay: 1.3 },
      { level: 5, weight: 7,  pay: 1.6 },
      { level: 8, weight: 3,  pay: 2.2 }
    ];
    const EXPERT_NONE_WEIGHT = 76;
    const EXPERT_HOTFIXES = 0;   // hotfixes are the intern's now, so no expert ones (1 until October 2026)
    function expertOf(o){ return EXPERT.find(e => e.level === (o && o.expert)) || null; }
    function rollExpert(always){
      const pool = always ? EXPERT : [{ level: 0, weight: EXPERT_NONE_WEIGHT }].concat(EXPERT);
      let roll = Math.random() * pool.reduce((n, e) => n + e.weight, 0);
      return (pool.find(e => (roll -= e.weight) < 0) || pool[0]).level;
    }
    function meetsExpert(p, offer){ return !offer.expert || skillLevel(p.lang[offer.lang]) >= offer.expert; }
    function riskOf(o){ return RISKS[o && o.risk] || RISKS.standard; }
    function rollRisk(){
      let roll = Math.random() * Object.values(RISKS).reduce((n, r) => n + r.weight, 0);
      return Object.keys(RISKS).find(k => (roll -= RISKS[k].weight) < 0) || 'standard';
    }

    // Contract types are named after release types, smallest first:
    // hotfix → patch → minor release → major release.
    const TIERS = [
      { key: 'hotfix', name: 'Hotfix',        plural: 'Hotfixes',       minutes: 1,  offerLife: 3,   refSloc: 5,   min: 1,  max: 1,  mult: 1.0, xpPerMin: 0.33,  rep: 0.05,
        needs: {}, req: 'your intern, with you' },
      { key: 'feature', name: 'Feature',      plural: 'Features',       minutes: 60, offerLife: 360, refSloc: 10,  min: 1,  max: 3,  mult: 1.5, xpPerMin: 0.4,  rep: 1,
        needs: {}, req: '1–3 devs, any level' },
      { key: 'patch', name: 'Patch',          plural: 'Patches',        minutes: 10, offerLife: 15,  refSloc: 40,  min: 3,  max: 5,  mult: 1.2, xpPerMin: 0.4,  rep: 2,
        needs: { Senior: 1 }, req: '3–5 devs · 1+ senior' },
      { key: 'minor', name: 'Minor release',  plural: 'Minor releases', minutes: 30, offerLife: 45,  refSloc: 90,  min: 5,  max: 10, mult: 1.5, xpPerMin: 0.45, rep: 6,
        needs: { Principal: 1 }, req: '5–10 devs · 1+ principal' },
      { key: 'major', name: 'Major release',  plural: 'Major releases', minutes: 90, offerLife: 120, refSloc: 250, min: 10, max: 20, mult: 2.0, xpPerMin: 0.5,  rep: 20,
        needs: { Manager: 1, Principal: 2, Senior: 3 }, req: '10+ people · manager, 2 principals, 3 seniors' }
    ];
    // 1 = quick fix / sprint / milestone / full delivery (same rules, old names). 4 = features
    // inserted after hotfixes (October 2026), so patches and up moved one index along.
    const TIERS_VERSION = 4;
    // 1 = offers tagged with a language and a domain; 2 = language only, with a
    // hotfix in every language.
    const BOARD_VERSION = 2;
    // Hotfixes are the intern's (with you): one per language, while you have an intern.
    // Features (October 2026, ideas/ltd-early-game-plan.md): none until the spare room is full
    // (you and 3 staff, `state.contractsOpen`, kept once set). Then, before managers, up to
    // FEATURES_MAX turn up, one every FEATURE_EVERY_H hours, each open for its offerLife; with
    // managers there are always FEATURES_MAX. Every other contract type: OFFERS_PER_TIER offers,
    // in random languages, replaced at once.
    const OFFERS_PER_TIER = 2;
    const FEATURES_MAX = 3;
    const FEATURE_EVERY_H = [1, 3];
    // The first contract, once the spare room is full: "Your first client", a Python feature for
    // the whole team (FIRST_CLIENT_TEAM devs), paying FIRST_CLIENT_PAY times, with sticking points
    // you're sure to help with (FIRST_CLIENT_SNAGS). Open for a day.
    const FIRST_CLIENT_TEAM = 3;
    const FIRST_CLIENT_PAY = 2;
    const FIRST_CLIENT_SNAGS = [0.3, 0.65];
    // Unstaffed offers are replaced after `offerLife` minutes, so the board
    // keeps turning over even if nobody on staff can take what's on it. A
    // replacement hotfix keeps its language.

    // The demo is the start-up slice: hotfixes and patches only (patches need more than
    // PATCH_HEADCOUNT staff, so managers and the small business unit). Managers were locked in the demo
    // until September 2026, when they came in with desks as the demo's money sink. The rest is
    // shown as coming in v0.1. Old saves keep what they have; they just get no more of it.
    const DEMO = !!D.DEMO;
    const DEMO_TIERS = ['hotfix', 'feature', 'patch'];
    const DEMO_LOCKED_ROLES = [];
    const COMING = 'coming in v0.1';
    // Patches (and every bigger type) only come to the board once the company has more than
    // PATCH_HEADCOUNT people, the Director included. Hotfixes are always open.
    const PATCH_HEADCOUNT = 10;
    const STAFF_LOCK = 'unlocks above ' + PATCH_HEADCOUNT + ' staff';
    function headcount(){ return state ? state.roster.filter(p => !isIntern(p)).length : 1; }
    // Why a contract type isn't on the board yet, or null if it is.
    function tierLock(tierIndex){
      const key = TIERS[tierIndex].key;
      if(DEMO && !DEMO_TIERS.includes(key)) return COMING;
      if(key === 'hotfix') return state && state.roster.some(isIntern) ? null : 'your intern’s, while you have one';
      if(key === 'feature') return state && state.contractsOpen ? null
        : 'start once your spare room is full (' + (state ? Math.min(desksUsed(), SPARE_ROOM_DESKS) : 1) + ' of ' + SPARE_ROOM_DESKS + ' desks)';
      if(headcount() <= PATCH_HEADCOUNT) return STAFF_LOCK;
      return null;
    }
    // Managers run the team: with one, contracts repeat and retry, and nobody gets stuck.
    function managed(){ return stageIndex() >= 1; }
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

    // Total XP needed for a language skill level (0 for none).
    function skillXp(lv){
      if(lv <= 0) return 0;
      if(lv <= SKILL_XP.length) return SKILL_XP[lv - 1];
      return SKILL_XP[SKILL_XP.length - 1] + 400 * (lv - 5) * (lv - 4);
    }
    function skillLevel(xp){
      let lv = 0;
      while((xp || 0) >= skillXp(lv + 1)) lv++;
      return lv;
    }
    function bestLevel(skillMap){
      return Object.values(skillMap).reduce((m, xp) => Math.max(m, skillLevel(xp)), 0);
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

    function freshState(money, named){
      const now = Date.now();
      const director = { id: 'director', name: (named && named.director) || 'You', role: 'Director', since: now, lang: {} };
      if(named && named.look) director.look = named.look;
      return {
        money,
        reputation: 0,
        companyName: (named && named.company) || null,  // null: "Debuggit Ltd"
        roster: [director, makeIntern(now)],
        internGiven: true,    // the starting intern (see INTERN_DAYS); older saves get one on load
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
        office: { premises: 'spare-room', owned: false },
        directorDesk: true,   // the Director takes a desk (older saves are told once)
        contractsOpen: false, // features come once the spare room is full (moveFeatures())
        firstClient: false,   // your first client has been offered
        nextFeatureAt: 0,  // where the company works (PREMISES), and whether it's bought
        desk: freshDesk(now)  // desk jobs (see "The desk")
      };
    }

    // jobs: [{ id, size, questions: [ids], answered: [true|false…], expiresAt }]; the first job turns
    // up straight away. seen: recently asked question ids. done: jobs finished.
    function freshDesk(now){ return { jobs: [], nextAt: now, seen: [], done: 0 }; }

    function isHotfix(tierIndex){ return TIERS[tierIndex].key === 'hotfix'; }

    // `expert`: true for an expert hotfix, false for the everyday hotfix a language always has;
    // other contract types roll it.
    function makeOffer(tierIndex, lang, expert){
      const tier = TIERS[tierIndex];
      const spread = 1 - SLOC_SPREAD + Math.random() * 2 * SLOC_SPREAD;
      return { id: uid('c'), tier: tierIndex, lang: lang || pick(LANGS),
               sloc: Math.max(1, Math.round(tier.refSloc * tier.minutes * spread)),
               risk: rollRisk(),
               expert: expert === false ? 0 : rollExpert(expert === true),
               expiresAt: Date.now() + tier.offerLife * 60000 };
    }
    // The offer that takes a taken or expired one's place: an everyday hotfix keeps its language,
    // and an expert hotfix is replaced by another (in any language).
    // Features before managers aren't replaced: new ones turn up in their own time (moveFeatures()).
    function replacementFor(o){
      if(TIERS[o.tier].key === 'feature' && !managed()) return null;
      if(!isHotfix(o.tier)) return makeOffer(o.tier);
      return o.expert ? makeOffer(o.tier, null, true) : makeOffer(o.tier, o.lang, false);
    }
    // Swap out expired offers — except one the player has open in the team
    // picker, so it doesn't vanish mid-choice — and make sure there's a hotfix
    // in every language.
    function refreshBoard(now){
      state.board = state.board.filter(o => tierOpen(o.tier) || (picker && picker.offerId === o.id));
      state.board.forEach((o, i) => {
        if(o.expiresAt <= now && !(picker && picker.offerId === o.id)) state.board[i] = replacementFor(o);
      });
      state.board = state.board.filter(Boolean);
      const hotfix = TIERS.findIndex(t => t.key === 'hotfix');
      if(tierOpen(hotfix)) LANGS.forEach(lang => {
        if(!state.board.some(o => o.tier === hotfix && o.lang === lang && !o.expert)) state.board.push(makeOffer(hotfix, lang, false));
      });
      moveFeatures(now);
      for(let k = state.board.filter(o => o.tier === hotfix && o.expert).length; k < EXPERT_HOTFIXES; k++) state.board.push(makeOffer(hotfix, null, true));
      // A type that has just opened (e.g. patches, once the company is big enough) gets its offers.
      TIERS.forEach((t, i) => {
        if(isHotfix(i) || t.key === 'feature' || !tierOpen(i)) return;
        for(let k = state.board.filter(o => o.tier === i).length; k < OFFERS_PER_TIER; k++) state.board.push(makeOffer(i));
      });
    }

    // Features: the spare room filling up opens contracts (once, for good) with your first client;
    // after that, before managers, new features turn up every FEATURE_EVERY_H hours, while the page
    // is closed too (skipping any whose offer would already have run out); with managers, the board
    // always has FEATURES_MAX.
    function moveFeatures(now){
      const fi = TIERS.findIndex(t => t.key === 'feature');
      if(!state.contractsOpen && (desksUsed() >= SPARE_ROOM_DESKS || managed())){
        state.contractsOpen = true;
        if(!state.firstClient){
          state.firstClient = true;
          const o = makeOffer(fi, 'Python', false);
          Object.assign(o, { first: true, risk: 'standard', minTeam: FIRST_CLIENT_TEAM, bonus: FIRST_CLIENT_PAY, expiresAt: now + 24 * 3600000 });
          state.board.push(o);
          addLog('ok', '★ Your spare room is full, and your first client has a job for you: a Python feature for the whole team, at double pay.');
          showToast('Your first client! A Python feature for your whole team, at double pay, is on the contract board. ' +
            'They’re junior, so expect to help when they get stuck.');
          track('first-client/offered');
        }
        state.nextFeatureAt = now + between(FEATURE_EVERY_H) * 3600000;
      }
      if(!tierOpen(fi)) return;
      const count = () => state.board.filter(o => o.tier === fi).length;
      if(managed()){
        while(count() < FEATURES_MAX) state.board.push(makeOffer(fi));
        return;
      }
      if(!state.nextFeatureAt) state.nextFeatureAt = now + between(FEATURE_EVERY_H) * 3600000;
      for(let i = 0; state.nextFeatureAt <= now && i < 100; i++){
        const at = state.nextFeatureAt;
        const o = makeOffer(fi);
        o.expiresAt = at + TIERS[fi].offerLife * 60000;
        if(o.expiresAt > now && count() < FEATURES_MAX) state.board.push(o);
        state.nextFeatureAt = at + between(FEATURE_EVERY_H) * 3600000;
      }
    }

    function makeBoard(){
      const board = [];
      TIERS.forEach((t, i) => {
        if(!tierOpen(i) || t.key === 'feature') return;
        if(isHotfix(i)){
          LANGS.forEach(lang => board.push(makeOffer(i, lang, false)));
          for(let k = 0; k < EXPERT_HOTFIXES; k++) board.push(makeOffer(i, null, true));
        }
        else for(let k = 0; k < OFFERS_PER_TIER; k++) board.push(makeOffer(i));
      });
      return board;
    }

    // The starting intern knows no language yet: the Director's languages carry them.
    function makeIntern(now){
      return { id: uid('e'), name: pick(FIRST_NAMES) + ' ' + String.fromCharCode(65 + rand(26)) + '.', role: 'Intern', since: now, lang: {}, pace: between(PACE) };
    }

    function makeHire(role){
      const p = { id: uid('e'), name: pick(FIRST_NAMES) + ' ' + String.fromCharCode(65 + rand(26)) + '.',
                  role, since: Date.now(), lang: {}, pace: between(PACE) };
      const langs = shuffle(LANGS.slice());
      const set = (b, i) => { if(b > 0) p.lang[langs[i]] = skillXp(b); };

      if(role === 'Graduate'){
        // One language from uni.
        set(1, 0);
      }else if(role === 'Junior'){
        set(1 + rand(2), 0);
        if(Math.random() < 0.5) set(1, 1);
      }else if(role === 'Senior'){
        set(4 + rand(2), 0);
        set(1 + rand(3), 1);
      }else if(role === 'Principal'){
        // A deep specialist: one language at level 7 or 8, and two more lower down.
        set(7 + rand(2), 0);
        set(3 + rand(3), 1);
        set(1 + rand(3), 2);
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
      const role = !state.hadApplicant && roles.includes('Graduate') ? 'Graduate'
        : roles.find(r => (roll -= APPLICANT_WEIGHT[r]) < 0) || roles[0];
      state.hadApplicant = true;
      const p = makeHire(role);
      return { id: p.id, role, person: p, cost: Math.round(hireCost(role) * between(APPLICANT_ASK) / 5) * 5,
               expiresAt: at + APPLICANT_OPEN_H * 3600000 };
    }
    // Lets applicants go whose offers have run out, then brings in everyone due by `now`
    // (skipping any whose offer would already have run out while the page was closed). Until the
    // studio has the reputation for anyone to apply, nobody's due; the first comes within
    // FIRST_APPLICANT_H once someone will.
    function moveApplicants(now){
      if(!state.applicants) state.applicants = [];
      state.applicants = state.applicants.filter(a => {
        if(a.expiresAt > now) return true;
        addLog('info', a.person.name + ' (' + a.role.toLowerCase() + ') took a job elsewhere.');
        return false;
      });
      if(!applicantRoles().length){ state.nextApplicantAt = 0; return; }
      if(!state.nextApplicantAt) state.nextApplicantAt = now + FIRST_APPLICANT_H * 3600000;
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

    // ---------------------------------------------------------------------
    // The office: desks (phase 1 of ideas/company-growth-roadmap.md)
    // ---------------------------------------------------------------------
    // Everyone on staff needs a desk, the Director included (since October 2026, the player-owner's
    // call; they used to work from home); the intern works beside the Director. The company
    // starts in the spare room (4 desks, free). Each premises after it is a choice (the
    // player-owner's call, October 2026): rent it (rent per minute) or buy it outright (its price
    // up front, then a smaller upkeep per minute). Rent and upkeep are charged like payroll (offline
    // too, not while paused). A rented place can be bought later without moving; moving out of a
    // bought one sells it for SELL_BACK of its price. Moving is instant, as long as everyone fits
    // (desks plus cramMax() squeezed in). Co-working desks were the way past the spare room until
    // October 2026, when the unit replaced them (phase 2 of ideas/company-growth-roadmap.md,
    // without leases yet). Prices are placeholders for the balance pass.
    const PREMISES = {
      'spare-room': { name: 'spare room', floors: 1, perFloor: 4, rent: 0,
        blurb: 'Your own place, free. A kitchen and the interview room, but no meeting room, and not room for managers.' },
      'unit-s': { name: 'small business unit', floors: 2, perFloor: 5, rent: 4, price: 60000, upkeep: 1,
        blurb: 'A unit on two floors: a kitchen and a meeting room on each, a server room, stairs, and room for managers.' }
    };
    const SELL_BACK = 0.9;
    const PREMISES_ORDER = ['spare-room', 'unit-s'];
    const SPARE_ROOM_DESKS = PREMISES['spare-room'].perFloor;
    function premisesKey(){ return (state.office && PREMISES[state.office.premises]) ? state.office.premises : 'spare-room'; }
    function premises(){ return PREMISES[premisesKey()]; }
    function nextPremises(){ return PREMISES_ORDER[PREMISES_ORDER.indexOf(premisesKey()) + 1] || null; }
    function prevPremises(){ return PREMISES_ORDER[PREMISES_ORDER.indexOf(premisesKey()) - 1] || null; }
    function desksIn(key){ return PREMISES[key].floors * PREMISES[key].perFloor; }
    function deskCount(){ return desksIn(premisesKey()); }
    function desksUsed(){ return state.roster.filter(p => !isIntern(p) && !p.wfh).length; }
    // Working from home (the player-owner's call, October 2026): in the spare room, a developer
    // can be hired to work from home (`p.wfh`). They need no desk, and write WFH_EFFICIENCY of the
    // code, on contracts and everyday work alike. Once the company has left the spare room, they
    // come into the office as desks free up (moveWfh()).
    const WFH_EFFICIENCY = 0.8;
    function wfhFactor(p){ return p.wfh ? WFH_EFFICIENCY : 1; }
    function canHireWfh(role){ return premisesKey() === 'spare-room' && APPLICANT_ROLES.includes(role); }
    function moveWfh(){
      if(premisesKey() === 'spare-room') return;
      state.roster.filter(p => p.wfh).forEach(p => {
        if(desksUsed() >= deskCount()) return;
        delete p.wfh;
        addLog('info', p.name + ' has come into the office, now there’s a desk for them.');
      });
    }
    function companyName(){ return state.companyName || 'Debuggit Ltd'; }
    function owned(){ return !!(state.office && state.office.owned) && premisesKey() !== 'spare-room'; }
    // Rent, or upkeep for a place the company owns.
    function rentPerMinute(){ return owned() ? premises().upkeep : premises().rent; }
    function sellPrice(key){ return Math.round(PREMISES[key].price * SELL_BACK); }
    // Why the company can't move somewhere smaller ('' if it can).
    function moveProblem(key){ return desksUsed() > desksIn(key) + cramMax(key) ? 'too many people to fit' : ''; }
    // Up to half as many people as an office has desks (cramMax(): the spare room 2, the unit 5) can
    // be squeezed in without desks, and with anyone squeezed in it's cramped: everyone writes
    // CRAM_STEP less code for each person squeezed in (6%, 12%, 18%…) on contracts started meanwhile,
    // and people are likelier to hand in their notice (noticeCramped()). A full office with nobody
    // squeezed in is fine. The player-owner's calls (September 2026; October 2026 for half the desks,
    // the flat step, and no slowdown until someone's squeezed in, which replaced at most 2 squeezed in
    // and 5% / 15% / 30% from a full office).
    const CRAM_STEP = 0.06;
    function cramMax(key){ return Math.floor(desksIn(key || premisesKey()) / 2); }
    // How many are squeezed in (with `extra` more people): 0 while there's a desk for everyone.
    function cramLevel(extra){ return Math.max(0, desksUsed() + (extra || 0) - deskCount()); }
    function crampAt(n){ return Math.min(0.9, CRAM_STEP * n); }
    function crampedPenalty(){ return crampAt(cramLevel()); }
    function deskProblem(){
      if(desksUsed() < deskCount() + cramMax()) return null;
      return 'no room to squeeze anyone else in' + (nextPremises() ? ' — rent or buy a ' + PREMISES[nextPremises()].name : ' — bigger premises are coming in v0.1');
    }
    // What hiring one more would do to the office, for the hire buttons: '' when there's a free desk.
    function deskNote(){
      if(desksUsed() < deskCount()) return '';
      return 'no desk: squeezed in, everyone −' + Math.round(crampAt(cramLevel(1)) * 100) + '% speed';
    }

    // ---------------------------------------------------------------------
    // Notice: people sometimes hand in their notice
    // ---------------------------------------------------------------------
    // Checked every hour (state.nextNoticeAt): each person but the Director hands in their notice
    // with NOTICE_PER_DAY / 24 chance, times noticeCramped(): 1, plus NOTICE_CRAMPED_STEP for each
    // person squeezed in (×3 with one, ×5 with two…). A notice
    // (p.notice = { reason, until, ask }) runs NOTICE_H hours, then they leave, once they're off
    // any running contract (a repeat stops for them). It can be turned around: a cramped one is
    // withdrawn once there's a free desk again, and any can be settled by agreeing a pay rise of
    // `ask` ¤/min, a random 15–35% of their level's salary (p.raise). The player-owner's idea.
    // While the page is closed, only the last OFFLINE_CAP hours roll, like repeats.
    const NOTICE_PER_DAY = 0.015;
    const NOTICE_CRAMPED_STEP = 2;
    function noticeCramped(){ return 1 + NOTICE_CRAMPED_STEP * cramLevel(); }
    const NOTICE_H = 24;
    const RAISE = [0.15, 0.35];
    function giveNotice(p, at, reason){
      const ask = Math.max(0.5, Math.round(ROLES[p.role].salary * between(RAISE) * 2) / 2);
      p.notice = { reason, until: at + NOTICE_H * 3600000, ask };
      addLog('bad', '✉ ' + p.name + ' has handed in their notice' +
        (reason === 'cramped' ? ': the office is too cramped.' : ': they’ve had a better offer.') +
        ' They’ll stay for a ' + fmtRate(ask) + '/min pay rise' + (reason === 'cramped' ? ', or if a desk frees up.' : '.'));
    }
    function moveNotices(now){
      if(!state.nextNoticeAt) state.nextNoticeAt = now + 3600000;
      const from = now - OFFLINE_CAP_SECONDS * 1000;
      for(let i = 0; state.nextNoticeAt <= now && i < 400; i++){
        const at = state.nextNoticeAt;
        if(at >= from){
          const perHour = NOTICE_PER_DAY * noticeCramped() / 24;
          state.roster.forEach(p => {
            if(p.role !== 'Director' && !isIntern(p) && !p.notice && Math.random() < perHour) giveNotice(p, at, cramLevel() ? 'cramped' : 'offer');
          });
        }
        state.nextNoticeAt += 3600000;
      }
      if(state.nextNoticeAt <= now) state.nextNoticeAt = now + 3600000;
      // Things got better: a free desk ends a cramped notice.
      if(!cramLevel()) state.roster.forEach(p => {
        if(p.notice && p.notice.reason === 'cramped'){
          delete p.notice;
          addLog('ok', '✓ ' + p.name + ' is staying, now there’s room in the office.');
        }
      });
      // Notice worked out: they leave once they're off any running contract. A failed contract
      // waiting for Retry or Drop carries on without them (and goes, if nobody's left on it).
      state.roster.filter(p => p.notice && p.notice.until <= now).forEach(p => {
        const job = jobFor(p.id);
        if(job && isRunning(job)) return;
        if(job){
          job.team = job.team.filter(id => id !== p.id);
          if(!job.team.some(id => isDev(person(id) || {}))) state.jobs = state.jobs.filter(j => j !== job);
        }
        state.roster = state.roster.filter(x => x !== p);
        addLog('bad', p.name + ' (' + p.role.toLowerCase() + ') has left the studio.');
        track('left/' + p.role.toLowerCase());
      });
    }
    // An internship that has run its course: once their hotfix is written (unstuck), the intern
    // leaves and applies to stay on as a graduate, keeping what they've learnt.
    function internEnds(p){ return p.since + INTERN_DAYS * 86400000; }
    function moveInterns(now){
      state.roster.filter(p => isIntern(p) && internEnds(p) <= now).forEach(p => {
        if(jobFor(p.id)) return;
        state.roster = state.roster.filter(x => x !== p);
        const cost = Math.round(hireCost('Graduate') * INTERN_OFFER / 5) * 5;
        const grad = { id: p.id, name: p.name, role: 'Graduate', since: now, lang: Object.assign({}, p.lang) };
        if(!state.applicants) state.applicants = [];
        state.applicants.push({ id: grad.id, role: 'Graduate', person: grad, cost, expiresAt: now + APPLICANT_OPEN_H * 3600000 });
        addLog('info', p.name + '’s internship has ended. They’d like to stay on as a graduate for ' + fmt(cost) +
          ', half the usual cost: the offer’s open for ' + APPLICANT_OPEN_H + ' hours.');
        track('intern/ended');
      });
    }

    // "Handed in notice · leaves in 18h · the office is too cramped" and a button to keep them.
    function noticeHTML(p, now){
      if(!p.notice) return '';
      const n = p.notice;
      const left = n.until - now;
      return '<div class="card-foot notice">' +
        '<span class="promo blocked">✉ Handed in notice · ' + (left > 0 ? 'leaves in ' + fmtDuration(left) : 'leaves after this contract') +
          ' · ' + (n.reason === 'cramped' ? 'the office is too cramped' : 'has a better offer') + '</span>' +
        '<button class="btn-small btn-promote" data-action="keep" data-id="' + p.id + '">Keep: +' + fmtRate(n.ask) + '/min</button></div>';
    }

    // `wfh`: hiring them to work from home, so no desk is needed.
    function hireProblem(role, wfh){
      if(DEMO && DEMO_LOCKED_ROLES.includes(role)) return COMING;
      // Managers come once the company has left the spare room (the player-owner's call, October 2026).
      if(role === 'Manager' && premisesKey() === 'spare-room') return 'managers need an office: move out of the spare room first';
      return problemWith({ [role]: 1 }) || (wfh ? null : deskProblem());
    }
    function releaseProblem(p){
      if(jobFor(p.id)) return 'on a contract';
      if(isIntern(p)) return null;
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
      if(bestLevel(p.lang) < req.lang) missing.push('a language at level ' + req.lang);
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
    // The languages the Director is comfortable enough in to help an intern: Python, the first
    // puzzle language, always, and any other with daily-puzzle XP.
    function directorKnows(langName){
      if(langName === 'Python') return true;
      const key = puzzleKey(langName);
      return !!key && (D.readXp()[key] || 0) > 0;
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
      // The Director only takes hotfixes, alongside an intern.
      if(p.role === 'Director') return tier.key === 'hotfix' && state.roster.some(isIntern);
      if(isIntern(p)) return tier.key === 'hotfix';
      if(tier.key === 'hotfix') return false;   // hotfixes are the intern's (October 2026)
      if(p.role === 'Manager') return !!tier.needs.Manager;
      return true;
    }

    // 0..1: how well a dev knows this contract's language.
    function matchFit(d, offer){
      return Math.min(skillLevel(d.lang[offer.lang]), SKILL_FULL) / SKILL_FULL;
    }
    function speedFor(level){
      return 1 + SKILL_SPEED * Math.min(level, SKILL_FULL) / SKILL_FULL + SKILL_SPEED_BEYOND * Math.max(0, level - SKILL_FULL);
    }
    function devSlocOn(d, offer){
      return ROLES[d.role].sloc * speedFor(skillLevel(d.lang[offer.lang])) * (1 - crampedPenalty()) * wfhFactor(d);
    }

    // A dev "knows the stack" for a contract if they have at least level 1 in
    // its language. Managers don't write code, so they're exempt.
    // Devs who don't can only join a team as learners: they write nothing,
    // each one costs the team LEARNER_DRAG of its output in mentoring time,
    // and there must be at least one dev who knows the stack per learner.
    // It's the only way to pick up a first level in something new.
    const LEARNER_DRAG = 0.10;
    function qualifiedFor(p, offer){
      return !isDev(p) || skillLevel(p.lang[offer.lang]) > 0;
    }

    function evaluateTeam(tier, offer, members){
      if(members.some(p => isIntern(p) || p.role === 'Director')) return evaluateInternTeam(tier, offer, members);
      const devs = members.filter(isDev);
      const managers = members.filter(p => p.role === 'Manager').length;
      const atLeast = level => devs.filter(d => levelRank(d.role) >= levelRank(level)).length;
      const checks = [];

      const min = Math.max(tier.min, offer.minTeam || 0);   // your first client wants the whole team
      const sizeLabel = min === tier.max ? min + ' ' + (min > 1 ? 'people' : 'person')
                      : tier.key === 'major' ? min + '+ people'
                      : min + '–' + tier.max + ' people';
      checks.push({ label: sizeLabel + ' (' + members.length + ')', ok: members.length >= min && members.length <= tier.max });
      if(tier.needs.Manager) checks.push({ label: tier.needs.Manager + '+ manager', ok: managers >= tier.needs.Manager });
      if(tier.needs.Principal) checks.push({ label: tier.needs.Principal + '+ principal', ok: atLeast('Principal') >= tier.needs.Principal });
      if(tier.needs.Senior){
        // Extra principals can fill senior seats.
        const need = tier.needs.Senior + (tier.needs.Principal || 0);
        checks.push({ label: tier.needs.Senior + '+ senior' + (tier.needs.Principal ? ' (beyond the principals)' : ' or above'),
                      ok: atLeast('Senior') >= need });
      }
      if(!devs.length) checks.push({ label: 'at least one developer', ok: false });
      if(tier.key === 'hotfix') checks.push({ label: 'hotfixes are your intern’s, with you', ok: false });
      const knowers = devs.filter(d => qualifiedFor(d, offer));
      const learners = devs.length - knowers.length;
      if(tier.max === 1){
        checks.push({ label: 'knows ' + offer.lang + ' (no learning solo)', ok: learners === 0 });
      }else{
        checks.push({ label: 'someone knows ' + offer.lang, ok: knowers.length > 0 });
        if(learners) checks.push({ label: 'learners (' + learners + ') ≤ devs who know the stack (' + knowers.length + ')',
                                   ok: learners <= knowers.length });
      }
      if(offer.expert) checks.push({ label: (tier.max === 1 ? '' : 'someone ') + 'at ' + offer.lang + ' Lv ' + offer.expert + '+ (expert)',
                                     ok: devs.some(d => meetsExpert(d, offer)) });

      const valid = checks.every(c => c.ok);
      const drag = Math.max(0, 1 - LEARNER_DRAG * learners);
      const baseSloc = knowers.reduce((s, d) => s + ROLES[d.role].sloc, 0);
      const matchedSloc = knowers.reduce((s, d) => s + devSlocOn(d, offer), 0);
      const sloc = Math.round(matchedSloc * drag * 10) / 10;
      const skill = devs.length ? devs.reduce((s, d) => s + matchFit(d, offer), 0) / devs.length : 0;
      const reliability = devs.length ? devs.reduce((s, d) => s + ROLES[d.role].reliability, 0) / devs.length : 0;
      const boost = devs.length ? directorBoost(offer.lang) : 0;
      // Skill match adds up to +5%, scaled by the team's average level in the language (up to 5).
      const risk = riskOf(offer);
      const chance = devs.length ? Math.max(MIN_CHANCE, Math.min(0.98, reliability + SKILL_CHANCE * skill + boost + risk.chance)) : 0;
      const ms = sloc > 0 ? Math.max(MIN_JOB_MS, offer.sloc / sloc * 60000) : Infinity;
      // A contract pays the same whoever does it: skill makes a team faster (more contracts an
      // hour), not better paid per contract.
      const expert = expertOf(offer);
      const payout = Math.round(offer.sloc * LINE_RATE * tier.mult * risk.pay * (expert ? expert.pay : 1) * (offer.bonus || 1));
      const salaryCost = members.reduce((s, p) => s + salaryOf(p), 0) * ms / 60000;
      const xp = tier.xpPerMin * ms / 60000;

      return { checks, valid, baseSloc, matchedSloc, learners, sloc, ms, chance, boost, payout, salaryCost, xp };
    }

    // An intern's hotfix: the intern and the Director, in a language one of them knows. Only the
    // intern writes code; the Director's puzzle level adds its usual success boost.
    function evaluateInternTeam(tier, offer, members){
      const intern = members.find(isIntern);
      const director = members.find(p => p.role === 'Director');
      const others = members.filter(p => p !== intern && p !== director);
      const knows = !!intern && (skillLevel(intern.lang[offer.lang]) > 0 || directorKnows(offer.lang));
      const checks = [
        { label: 'an intern and you, the Director (' + members.length + ')', ok: !!intern && !!director && !others.length && tier.key === 'hotfix' },
        { label: 'you or ' + (intern ? intern.name : 'the intern') + ' know ' + offer.lang, ok: knows },
        { label: 'there are ' + offer.lang + ' puzzles for when they’re stuck', ok: hasPuzzles(offer.lang) }
      ];
      if(offer.expert) checks.push({ label: 'at ' + offer.lang + ' Lv ' + offer.expert + '+ (expert)', ok: !!intern && meetsExpert(intern, offer) });
      const valid = checks.every(c => c.ok);
      const baseSloc = intern ? ROLES.Intern.sloc : 0;
      const matchedSloc = intern ? ROLES.Intern.sloc * speedFor(skillLevel(intern.lang[offer.lang])) : 0;
      const sloc = Math.round(matchedSloc * 10) / 10;
      const boost = intern ? directorBoost(offer.lang) : 0;
      const risk = riskOf(offer);
      const chance = intern ? Math.max(MIN_CHANCE, Math.min(0.98, ROLES.Intern.reliability + SKILL_CHANCE * matchFit(intern, offer) + boost + risk.chance)) : 0;
      const ms = sloc > 0 ? Math.max(MIN_JOB_MS, offer.sloc / sloc * 60000) : Infinity;
      const expert = expertOf(offer);
      const payout = Math.round(offer.sloc * LINE_RATE * tier.mult * risk.pay * (expert ? expert.pay : 1));
      return { checks, valid, baseSloc, matchedSloc, learners: 0, sloc, ms, chance, boost, payout, salaryCost: 0, xp: tier.xpPerMin * ms / 60000 };
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
      const job = newJob(offer, memberIds.slice(), now, ev, !!repeat && managed() && !members.some(isIntern));
      if(members.some(isIntern)){
        job.stuckPoints = [];
        for(let i = 0; i < INTERN_STUCK_MAX; i++) if(Math.random() < INTERN_STUCK) job.stuckPoints.push(between(INTERN_STUCK_AT));
        job.stuckPoints.sort((a, b) => a - b);
      }else if(!managed() && hasPuzzles(offer.lang)){
        // A start-up's junior team gets stuck now and then, and slows to half speed until you help.
        job.snags = offer.first ? FIRST_CLIENT_SNAGS.slice() : [];
        if(!offer.first) for(let i = 0; i < SNAG_MAX; i++) if(Math.random() < SNAG_CHANCE) job.snags.push(between(SNAG_AT));
        job.snags.sort((a, b) => a - b);
      }
      if(offer.first){ job.first = true; track('first-client/started'); }
      state.jobs.push(job);
      const next = replacementFor(offer);
      if(next) state.board[offerIdx] = next; else state.board.splice(offerIdx, 1);
      save();
      return true;
    }

    // A start-up team's sticking points (October 2026): up to SNAG_MAX, each with SNAG_CHANCE, at
    // SNAG_AT of the way. Stuck, a contract runs at half speed (`job.slow`: when it got stuck, the
    // full-speed time it still needed, and its full-speed length) until you answer a puzzle in its
    // language. Right: back to full speed, INTERN_NUDGE further on, and the help pays like a desk
    // question. Wrong: back to full speed, but INTERN_NUDGE further back. Ignored, it just takes
    // longer. Only where there are puzzles to ask (hasPuzzles()), and never with managers.
    const SNAG_MAX = 3;
    const SNAG_CHANCE = 0.4;
    const SNAG_AT = [0.15, 0.85];
    function isSlow(job){ return !!job.slow; }
    // How far along a stuck (half-speed) contract is, 0–1.
    function slowDone(job, now){ return Math.min(1, 1 - Math.max(0, job.slow.left - Math.max(0, now - job.slow.since) / 2) / job.slow.length); }

    // status: 'running' | 'failed' (waiting for the player to retry or drop it).
    // attempt: 1 for the original run, 2 for the retry.
    function newJob(offer, team, startedAt, ev, repeat){
      return {
        id: offer.id, tier: offer.tier, lang: offer.lang, risk: offer.risk || 'standard', expert: offer.expert || 0,
        sloc: offer.sloc, teamSloc: ev.sloc,
        team, startedAt, endsAt: startedAt + ev.ms,
        chance: ev.chance, payout: ev.payout, repeat, status: 'running', attempt: 1
      };
    }

    function isRunning(job){ return (job.status || 'running') === 'running'; }
    // An intern's hotfix that's stuck, stalled until the Director answers a puzzle (see INTERN_STUCK).
    function isStuck(job){ return job.status === 'stuck'; }
    function isInternJob(job){ return job.team.some(id => isIntern(person(id))); }
    function jobTag(job){
      return (job.risk && job.risk !== 'standard' ? riskOf(job).name.toLowerCase() + ' ' : '') + (job.expert ? 'expert ' : '') +
        TIERS[job.tier].name + ' (' + job.lang + (job.expert ? ' Lv ' + job.expert : '') + ')';
    }
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
      const intern = isInternJob(job);  // once written, an intern's hotfix is always delivered
      if(intern) state.internDone = (state.internDone || 0) + 1;
      if(intern || Math.random() < job.chance){
        state.money += job.payout;
        state.reputation += tier.rep;
        if(job.first){
          addLog('ok', '★ Your first client is delighted: ' + fmt(job.payout) + ' in the bank.');
          showToast('Your first client is delivered, and paid ' + fmt(job.payout) + '. More features will turn up on the contract board every hour or two.');
          track('first-client/delivered');
        }
        job.team.forEach(id => {
          const p = person(id);
          if(!p || !(isDev(p) || isIntern(p))) return;
          p.lang[job.lang] = (p.lang[job.lang] || 0) + xp;
        });
        addLog('ok', '✓ ' + jobTag(job) + retry + ' delivered — ' + fmt(job.payout) + ', +' + fmtXp(xp) + ' XP to the team.');
        return true;
      }
      state.reputation = Math.max(0, state.reputation - tier.rep / 2 * riskOf(job).repLoss);
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
    // the last one ended (or `startAt`, the start of the offline cap) — so it
    // keeps working while the page is closed.
    function restartJob(job, startAt = job.endsAt){
      const members = job.team.map(person);
      const tier = TIERS[job.tier];
      const leaving = members.find(p => p && p.notice && p.notice.until <= startAt);
      if(leaving){
        addLog('info', tier.name + ' repeat stopped — ' + leaving.name + ' has worked out their notice.');
        return;
      }
      // Look for a fresh contract of the same type that the whole team is
      // qualified for.
      let offer = null, ev = null;
      for(let i = 0; i < 40 && members.every(Boolean) && tierOpen(job.tier); i++){
        const candidate = makeOffer(job.tier);
        candidate.risk = job.risk || 'standard';
        candidate.expert = job.expert || 0;
        const e = evaluateTeam(tier, candidate, members);
        if(e.valid){ offer = candidate; ev = e; break; }
      }
      if(!ev){
        addLog('info', tier.name + ' repeat stopped — ' +
          (tierOpen(job.tier) ? 'the team no longer fits the requirements.'
            : tier.plural.toLowerCase() + (tierLock(job.tier) === COMING ? ' are ' + COMING : ' need more than ' + PATCH_HEADCOUNT + ' staff') + '.'));
        return;
      }
      state.jobs.push(newJob(offer, job.team, startAt, ev, true));
    }

    function resolveDueJobs(now){
      // Repeats don't chain further back than the offline cap: time away beyond it is skipped, so a
      // repeat that finished before the cap picks up again from the cap, like a failure's retry.
      // (Until October 2026 it stopped instead, while payroll was still drawn for the cap's 4 hours.)
      const repeatCutoff = now - OFFLINE_CAP_SECONDS * 1000;
      let finished = 0;
      // A repeating job left failed (by a save from before repeats always retried) retries now.
      state.jobs.filter(j => !isRunning(j) && j.repeat).forEach(j => {
        retryJob(j, now);
        addLog('info', '↻ Retrying ' + jobTag(j) + ' for ' + fmt(j.payout) + '.');
      });
      // A start-up team that hits a snag slows to half speed until you help (see SNAG_MAX).
      const snagTime = j => j.snags && j.snags.length && !j.slow ? j.startedAt + j.snags[0] * (j.endsAt - j.startedAt) : Infinity;
      state.jobs.filter(j => isRunning(j) && snagTime(j) < j.endsAt && snagTime(j) <= now).forEach(j => {
        const since = snagTime(j), left = j.endsAt - since;
        j.slow = { since, left, length: j.endsAt - j.startedAt };
        j.endsAt = since + 2 * left;
        j.snags.shift();
        addLog('info', '✋ The team is stuck on the ' + j.lang + ' ' + TIERS[j.tier].name.toLowerCase() + ', and it’s going at half speed. Answer a puzzle to help them.');
      });
      // An intern who's got stuck stalls until you help (see INTERN_STUCK).
      const stuckTime = j => j.stuckPoints && j.stuckPoints.length ? j.startedAt + j.stuckPoints[0] * (j.endsAt - j.startedAt) : Infinity;
      state.jobs.filter(j => isRunning(j) && stuckTime(j) < j.endsAt && stuckTime(j) <= now).forEach(j => {
        j.left = j.endsAt - stuckTime(j);
        j.status = 'stuck';
        j.stuckPoints.shift();
        addLog('info', '✋ ' + (person(j.team.find(id => isIntern(person(id)))) || {}).name + ' is stuck on the ' +
          j.lang + ' hotfix. Answer a puzzle to help them.');
      });
      for(;;){
        const due = state.jobs.filter(j => isRunning(j) && j.endsAt <= now).sort((a, b) => a.endsAt - b.endsAt);
        if(!due.length) break;
        const job = due[0];
        const delivered = settleJob(job);
        finished++;
        if(!delivered && job.attempt === 1){
          // Repeating teams always retry automatically (it's the better deal per
          // minute); otherwise the team waits for the player to decide. A failure
          // from before the offline cap retries from the cap, like everything else.
          if(job.repeat){
            retryJob(job, Math.max(job.endsAt, repeatCutoff));
            addLog('info', '↻ Retrying ' + jobTag(job) + ' for ' + fmt(job.payout) + '.');
            continue;
          }
          // Before managers there are no retries: the contract is lost.
          if(managed()){
            job.status = 'failed';
            continue;
          }
          addLog('bad', 'The client has taken the ' + TIERS[job.tier].name.toLowerCase() + ' elsewhere.');
        }
        state.jobs = state.jobs.filter(j => j !== job);
        if(job.repeat) restartJob(job, Math.max(job.endsAt, repeatCutoff));
      }
      return finished;
    }

    function setRepeat(jobId, on){
      const job = state.jobs.find(j => j.id === jobId);
      if(job) job.repeat = on && managed() && !isInternJob(job);
    }

    // A person's salary: their level's, plus any pay rise agreed to keep them (p.raise).
    function salaryOf(p){ return ROLES[p.role].salary + (p.raise || 0); }
    function payrollPerMinute(){
      return state.roster.reduce((s, p) => s + salaryOf(p), 0);
    }
    // Everyday work (the player-owner's call, October 2026; ideas/ltd-early-game-plan.md): anyone
    // who writes code and isn't on a contract does the studio's everyday work, support tickets,
    // bug fixes and small hotfixes for existing clients, at their level's SLOC/min × their own pace
    // (PACE, set when they're hired), paid at EVERYDAY_RATE per SLOC: about 1.35× salary on average
    // (1.22× to 1.49× by pace). No XP or promotion time. Managers write no code, so none; the
    // Director takes desk jobs; the intern earns their tiny share. It replaced odd jobs (salary
    // + 5%). Contracts pay far more, but nobody on one does everyday work meanwhile.
    const EVERYDAY_RATE = 0.54;
    const PACE = [0.9, 1.1];
    function paceOf(p){ return p.pace || 1; }
    function everydaySloc(p){ return (isDev(p) || isIntern(p)) ? ROLES[p.role].sloc * paceOf(p) * wfhFactor(p) : 0; }
    function benchPerMinute(p){ return everydaySloc(p) * EVERYDAY_RATE; }
    // Doing everyday work ("on the bench" in the code) = someone who writes code doing nothing
    // else: not on a contract (including a failed one waiting for Retry or Drop), and not away.
    // Anything that takes someone away, such as training, a holiday or being off sick (items 14
    // and 15c), sets p.away = { kind, until }, and they earn nothing until it ends.
    function isAway(p, now){ return !!(p.away && !(p.away.until <= now)); }
    function onBench(p, busy, now){ return (isDev(p) || isIntern(p)) && !busy.has(p.id) && !isAway(p, now); }
    function benchIncomePerMinute(){
      const busy = busyIds(), now = Date.now();
      return state.roster.filter(p => onBench(p, busy, now)).reduce((s, p) => s + benchPerMinute(p), 0);
    }
    // Everyone's code per minute right now: contracts running (half speed while snagged, none
    // while stuck or failed) plus everyday work.
    function totalSlocPerMinute(){
      const busy = busyIds(), now = Date.now();
      const jobs = state.jobs.reduce((s, j) => s + (j.status === 'running' ? (j.teamSloc || 0) * (j.slow ? 0.5 : 1) : 0), 0);
      return jobs + state.roster.filter(p => onBench(p, busy, now)).reduce((s, p) => s + everydaySloc(p), 0);
    }
    function paySalaries(seconds){
      if(seconds > 0) state.money -= (payrollPerMinute() + rentPerMinute() - benchIncomePerMinute()) * seconds / 60;
    }
    // "¤1.5", "¤2": per-minute amounts to one decimal place.
    function fmtRate(n){ return '¤' + (Math.round(n * 10) / 10).toLocaleString('en-GB'); }

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
      state.jobs.forEach(j => { j.startedAt += ms; j.endsAt += ms; if(j.slow) j.slow.since += ms; });
      if(state.nextFeatureAt) state.nextFeatureAt += ms;
      state.board.forEach(o => { o.expiresAt += ms; });
      if(state.market) state.market.nextAt += ms;
      if(state.nextApplicantAt) state.nextApplicantAt += ms;
      if(state.nextNoticeAt) state.nextNoticeAt += ms;
      state.roster.forEach(p => { if(p.notice) p.notice.until += ms; });
      (state.applicants || []).forEach(a => { a.expiresAt += ms; });
      state.roster.forEach(p => { p.since += ms; });
      if(state.desk){
        state.desk.nextAt += ms;
        state.desk.jobs.forEach(j => { j.expiresAt += ms; });
      }
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
      opening = 'Your company has moved in. Your desk has jobs for you: questions that pay the company.';
    }else{
      const bonus = founderBonus();
      state = freshState(START_CASH + bonus, founding);
      track('founded');
      opening = 'You’ve founded ' + companyName() + ' with ' + fmt(state.money) +
        (bonus ? ' (' + fmt(START_CASH) + ' plus a ' + fmt(bonus) + ' founder’s bonus for your puzzle XP)' : '') +
        '. Debuggit Ltd is in beta, so its numbers may change.' +
        (DEMO ? ' In the demo it runs hotfixes, and patches once you have more than ' + PATCH_HEADCOUNT + ' staff; it will be reset when v0.1 comes out.' : '');
    }
    // The daily puzzle stopped paying the company in September 2026; desk jobs took over.
    delete state.paid;
    if(!state.desk) state.desk = freshDesk(Date.now());
    save();
    // Only remove the old save once the new one is safely written.
    if(old && readSave(STORAGE_KEY)){ try{ localStorage.removeItem(OLD_STORAGE_KEY); }catch(e){} }

    // ---------------------------------------------------------------------
    // The desk: desk jobs (questions from ltd/desk.js) that pay the company
    // ---------------------------------------------------------------------

    let deskPool = null;  // Map of question id → question, once Learn's units have loaded
    const deskReady = window.DebuggDesk ? window.DebuggDesk.load().then(() => { deskPool = window.DebuggDesk.all(D.today()); }) : Promise.resolve();
    let deskActive = null;  // the id of the job being played

    function pickSize(){
      let r = Math.random();
      for(const [size, w] of DESK_SIZES){ if((r -= w) < 0) return size; }
      return 1;
    }
    // A new job at time t: questions not asked lately and not in another waiting job.
    function makeDeskJob(t){
      const taken = new Set(state.desk.seen.concat(state.desk.jobs.flatMap(j => j.questions)));
      let ids = [...deskPool.keys()].filter(id => !taken.has(id));
      if(ids.length < 3) ids = [...deskPool.keys()];
      const size = Math.min(pickSize(), ids.length);
      const questions = [];
      while(questions.length < size && ids.length) questions.push(ids.splice(Math.floor(Math.random() * ids.length), 1)[0]);
      return { id: uid('d'), size: questions.length, questions, answered: [], expiresAt: t + DESK_LIFE_H * 3600000 };
    }
    // Jobs turn up (while the page is closed too, but not while paused) and expire unplayed. One
    // being played never expires under the player.
    function moveDesk(now){
      if(!deskPool || !deskPool.size) return false;
      const desk = state.desk;
      let changed = false;
      // Past a day away, only the last day's arrivals matter.
      if(now - desk.nextAt > 86400000) desk.nextAt = now - 86400000;
      while(desk.nextAt <= now){
        const t = desk.nextAt;
        if(desk.jobs.filter(j => j.expiresAt > t).length < DESK_MAX){
          desk.jobs = desk.jobs.filter(j => j.expiresAt > t || j.id === deskActive);
          desk.jobs.push(makeDeskJob(t));
          changed = true;
        }
        desk.nextAt = t + (DESK_EVERY_MIN[0] + Math.random() * (DESK_EVERY_MIN[1] - DESK_EVERY_MIN[0])) * 60000;
      }
      const before = desk.jobs.length;
      desk.jobs = desk.jobs.filter(j => j.expiresAt > now || j.id === deskActive || j.answered.length);
      return changed || desk.jobs.length !== before;
    }
    function deskQuestions(job){ return job.questions.map(id => deskPool && deskPool.get(id)).filter(Boolean); }
    // What a job pays, with every answer right (the most it can pay).
    function deskMax(job){
      const qs = deskQuestions(job);
      return Math.round(qs.reduce((n, q) => n + DESK_PAY[q.difficulty], 0) * DESK_BOOST[qs.length] * stage().desk);
    }
    function startDeskJob(id){
      const job = state.desk.jobs.find(j => j.id === id);
      if(!job || !deskPool || helpActive) return;
      const qs = deskQuestions(job);
      if(!qs.length){ state.desk.jobs = state.desk.jobs.filter(j => j !== job); save(); renderDesk(); return; }
      deskActive = id;
      const box = document.getElementById('deskPlay');
      box.hidden = false;
      renderDesk();
      window.DebuggDesk.play(box, qs, {
        answered: job.answered,
        onAnswer: right => { job.answered.push(right); save(); },
        onDone: results => finishDeskJob(job, qs, results)
      });
      box.scrollIntoView({ block: 'nearest' });
    }
    function finishDeskJob(job, qs, results){
      const right = qs.filter((q, i) => results[i]);
      const all = right.length === qs.length;
      const boost = all ? DESK_BOOST[qs.length] : 1;
      const cut = stage().desk;
      const cash = Math.round(right.reduce((n, q) => n + DESK_PAY[q.difficulty], 0) * boost * cut);
      const rep = right.length * DESK_REP;
      state.money += cash;
      state.reputation += rep;
      state.desk.jobs = state.desk.jobs.filter(j => j !== job);
      state.desk.seen = state.desk.seen.concat(job.questions).slice(-DESK_SEEN);
      state.desk.done = (state.desk.done || 0) + 1;
      deskActive = null;
      const text = 'Desk job: ' + right.length + ' of ' + qs.length + ' right, ' + fmt(cash) +
        (all && boost > 1 ? ' (with the ×' + boost + ' bonus for getting them all)' : '') +
        (cut < 1 && cash ? ' (a ' + stage().name.toLowerCase() + ' gets ' + Math.round(cut * 100) + '% of desk pay)' : '') +
        (rep ? ' and +' + rep + ' reputation.' : '.');
      addLog(right.length ? 'ok' : 'info', '✓ ' + text);
      track('desk/done/' + qs.length + '/' + right.length);
      const box = document.getElementById('deskPlay');
      box.innerHTML = '<div class="desk-done" id="deskDone"><img src="img/kiwi.svg" alt="" width="36" height="36" class="' + (all ? 'hop' : '') + '"><p>' + esc(text) + '</p>' +
        '<button type="button" class="btn-ghost btn-small" data-action="desk-close">Back to the desk</button></div>';
      save();
      renderAll();
    }
    // Helping a stuck intern (see INTERN_STUCK): one puzzle in the hotfix's language, from the
    // desk's pool, not asked lately and not waiting in a desk job. Before the pool has loaded, only
    // Python is assumed to have puzzles.
    function hasPuzzles(langName){
      if(!deskPool) return langName === 'Python';
      const key = puzzleKey(langName);
      for(const q of deskPool.values()) if(q.lang === key) return true;
      return false;
    }
    function stuckQuestion(job){
      const key = puzzleKey(job.lang);
      const taken = new Set(state.desk.seen.concat(state.desk.jobs.flatMap(j => j.questions)));
      const all = [...deskPool.values()].filter(q => q.lang === key);
      const fresh = all.filter(q => !taken.has(q.id));
      const from = fresh.length ? fresh : all;
      return from.length ? from[Math.floor(Math.random() * from.length)].id : null;
    }
    // What helping pays for a right answer: a desk question's pay, × the stage's desk share.
    function helpPay(difficulty){ return Math.round(DESK_PAY[difficulty] * stage().desk); }
    function helpPayText(){ return fmt(helpPay(1)) + '–' + fmt(helpPay(5)).replace('¤', ''); }
    let helpActive = null;  // the id of the stuck hotfix being helped with
    function startHelp(id){
      const job = state.jobs.find(j => j.id === id);
      if(!job || !(isStuck(job) || isSlow(job)) || !deskPool || deskActive || helpActive) return;
      if(!job.question || !deskPool.get(job.question)) job.question = stuckQuestion(job);
      const q = job.question && deskPool.get(job.question);
      if(!q) return;
      save();
      helpActive = job.id;
      let text = '';
      const box = document.getElementById('deskPlay');
      box.hidden = false;
      renderAll();
      window.DebuggDesk.play(box, [q], {
        answered: [],
        onAnswer: right => { text = finishHelp(job, q, right); },
        onDone: () => {
          helpActive = null;
          box.innerHTML = '<div class="desk-done" id="deskDone"><img src="img/kiwi.svg" alt="" width="36" height="36" class="hop"><p>' + esc(text) + '</p>' +
            '<button type="button" class="btn-ghost btn-small" data-action="desk-close">Back to the desk</button></div>';
          renderAll();
        }
      });
      if(box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
    }
    // Settles the answer at once (so a reload can't retry it): the hotfix jumps ahead or falls back
    // INTERN_NUDGE of its length and carries on from now. Returns what happened.
    function finishHelp(job, q, right){
      if(isSlow(job)) return finishSlowHelp(job, q, right);
      const intern = person(job.team.find(id => isIntern(person(id))));
      const name = intern ? intern.name : 'Your intern';
      const length = job.endsAt - job.startedAt;
      const left = right ? Math.max(0, job.left - length * INTERN_NUDGE) : Math.min(length, job.left + length * INTERN_NUDGE);
      const now = Date.now();
      state.desk.seen = state.desk.seen.concat(q.id).slice(-DESK_SEEN);
      delete job.question;
      delete job.left;
      job.status = 'running';
      job.startedAt = now - (length - left);
      job.endsAt = now + left;
      // A jump past a sticking point clears it.
      const done = 1 - left / length;
      job.stuckPoints = (job.stuckPoints || []).filter(p => p > done);
      let text;
      if(right){
        const cash = helpPay(q.difficulty);
        state.money += cash;
        state.reputation += DESK_REP;
        text = 'Right: ' + name + '’s ' + job.lang + ' hotfix jumps ahead, and your help earns ' + fmt(cash) + ' and +' + DESK_REP + ' reputation.';
        addLog('ok', '✓ ' + text);
      }else{
        text = 'Not quite: ' + name + ' went the wrong way, and the ' + job.lang + ' hotfix loses some progress.';
        addLog('bad', '✕ ' + text);
      }
      track('intern/help/' + (right ? 'right' : 'wrong'));
      resolveDueJobs(now);
      save();
      renderAll();
      return text;
    }
    // Helping a team stuck at half speed: the work done meanwhile counts, then right or wrong moves it
    // INTERN_NUDGE on or back, at full speed again.
    function finishSlowHelp(job, q, right){
      const now = Date.now(), L = job.slow.length;
      let left = Math.max(0, job.slow.left - Math.max(0, now - job.slow.since) / 2);
      left = right ? Math.max(0, left - L * INTERN_NUDGE) : Math.min(L, left + L * INTERN_NUDGE);
      state.desk.seen = state.desk.seen.concat(q.id).slice(-DESK_SEEN);
      delete job.question;
      delete job.slow;
      job.startedAt = now - (L - left);
      job.endsAt = now + left;
      const done = 1 - left / L;
      job.snags = (job.snags || []).filter(p => p > done);
      const what = 'the ' + job.lang + ' ' + TIERS[job.tier].name.toLowerCase();
      let text;
      if(right){
        const cash = helpPay(q.difficulty);
        state.money += cash;
        state.reputation += DESK_REP;
        text = 'Right: the team is unstuck, ' + what + ' jumps ahead at full speed again, and your help earns ' + fmt(cash) + ' and +' + DESK_REP + ' reputation.';
        addLog('ok', '✓ ' + text);
      }else{
        text = 'Not quite: the team is back at full speed, but went the wrong way, and ' + what + ' loses some progress.';
        addLog('bad', '✕ ' + text);
      }
      track('team/help/' + (right ? 'right' : 'wrong'));
      resolveDueJobs(now);
      save();
      renderAll();
      return text;
    }
    function renderDesk(){
      const now = Date.now();
      const jobs = state.desk.jobs;
      document.getElementById('deskCount').textContent = jobs.length ? jobs.length + ' waiting' : 'none waiting';
      const box = document.getElementById('deskJobs');
      if(!deskPool){ box.innerHTML = '<p class="desk-empty">Loading desk jobs…</p>'; return; }
      box.innerHTML = jobs.map(j => {
        const n = deskQuestions(j).length;
        const playing = j.id === deskActive;
        return '<div class="desk-job' + (playing ? ' playing' : '') + '" data-job="' + j.id + '">' +
          '<div><b>' + n + ' question' + (n > 1 ? 's' : '') + '</b> · up to ' + fmt(deskMax(j)) +
          (n > 1 ? ' <span class="desk-boost">×' + DESK_BOOST[n] + ' if all right</span>' : '') +
          '<div class="desk-meta">' + (j.answered.length ? j.answered.length + ' answered · ' : '') +
            (playing ? 'in progress' : fmtDuration(Math.max(0, j.expiresAt - now)) + ' left') + '</div></div>' +
          (playing ? '' : '<button type="button" class="btn-primary btn-small" data-action="desk-start" data-job="' + j.id + '"' +
            (deskActive || helpActive ? ' disabled' : '') + (guide && guide.key === 'desk' && j === jobs[0] ? ' data-guide="1"' : '') + '>' +
            (j.answered.length ? 'Carry on' : 'Start') + '</button>') + '</div>';
      }).join('') + (jobs.length < DESK_MAX ? '<p class="desk-empty">' + (jobs.length ? 'Another' : 'A desk job') + ' turns up in about ' +
        fmtDuration(Math.max(60000, state.desk.nextAt - now)) + '.</p>' : '');
      box.querySelectorAll('[data-guide]').forEach(b => b.classList.add('guide-target'));
    }
    deskSlot.addEventListener('click', e => {
      const b = e.target.closest('[data-action]');
      if(!b || b.disabled) return;
      if(b.dataset.action === 'desk-start') startDeskJob(b.dataset.job);
      else if(b.dataset.action === 'intern-help') startHelp(b.dataset.job);
      else if(b.dataset.action === 'desk-close'){
        const box = document.getElementById('deskPlay');
        box.hidden = true;
        box.innerHTML = '';
      }
    });
    deskReady.then(() => { if(moveDesk(Date.now())) save(); renderAll(); });

    // ---------------------------------------------------------------------
    // Rendering: stats, studio, board
    // ---------------------------------------------------------------------

    function stageIndex(){
      const managers = state.roster.filter(p => p.role === 'Manager').length;
      let i = 0;
      STAGES.forEach((st, k) => { if(managers >= st.managers && headcount() >= st.heads) i = k; });
      return i;
    }
    function stage(){ return STAGES[stageIndex()]; }
    // What it takes to reach the next stage.
    function nextStageText(){
      const next = STAGES[stageIndex() + 1];
      if(!next) return '';
      const managers = state.roster.filter(p => p.role === 'Manager').length;
      const needs = [];
      if(managers < next.managers) needs.push(next.managers === 1 ? 'your first manager' : next.managers + ' managers (you have ' + managers + ')');
      if(headcount() < next.heads) needs.push(next.heads + ' staff (you have ' + headcount() + ')');
      return 'Next: ' + next.name + ', with ' + needs.join(' and ') +
        (DEMO && DEMO_LOCKED_ROLES.includes('Manager') && managers < next.managers ? ' (managers are coming in v0.1)' : '') + '.';
    }
    // Logs and announces a change of stage (either way), once.
    function checkStage(){
      const st = stage();
      if(!state.stage){ state.stage = st.key; return; }
      if(state.stage === st.key) return;
      const up = STAGES.findIndex(x => x.key === st.key) > STAGES.findIndex(x => x.key === state.stage);
      state.stage = st.key;
      const text = 'Debuggit Ltd is ' + (up ? 'now' : 'back to being') + ' a ' + st.name.toLowerCase() + '. ' + st.text;
      addLog(up ? 'ok' : 'info', (up ? '★ ' : '') + text);
      showToast(text);
      track('stage/' + st.key);
    }

    // From a small business on, managers put idle developers to work: first on the biggest team
    // contracts a free team can take ("Suggest a team"'s choice), then each one left on a hotfix
    // in a language they know. Everything they start repeats. The offer open in the picker is left alone.
    function managersStaff(){
      if(stageIndex() < 1) return 0;
      let placed = [];
      const free = () => { const busy = busyIds(); return state.roster.filter(p => p.role !== 'Director' && !busy.has(p.id)); };
      for(let ti = TIERS.length - 1; ti > 0; ti--){
        const tier = TIERS[ti];
        state.board.filter(o => o.tier === ti && !(picker && picker.offerId === o.id)).forEach(o => {
          const pool = free().filter(p => eligibleFor(tier, p));
          const ids = suggestTeam(tier, o, pool);
          if(ids.length < tier.min || !evaluateTeam(tier, o, ids.map(person)).valid) return;
          if(startJob(o.id, ids, true)) placed = placed.concat(ids.filter(id => isDev(person(id))));
        });
      }
      if(placed.length){
        const names = placed.map(id => person(id).name);
        addLog('info', 'Your managers put ' + (names.length <= 2 ? names.join(' and ') : names.slice(0, 2).join(', ') + ' and ' + (names.length - 2) + ' more') + ' to work.');
      }
      return placed.length;
    }

    // The first steps, shown as one "next step" card until your first client's contract is under
    // way (or the guide is dismissed): put the intern on a hotfix and help them, take a desk job,
    // fill the spare room with graduates as they apply (they wait for a little reputation), then
    // staff your first client and help the team when they're stuck. Returns { key, text, offerId? }
    // or null.
    function guideStep(){
      if(state.guideDone) return null;
      const devs = state.roster.filter(isDev);
      const intern = state.roster.find(isIntern);
      const internJob = intern && jobFor(intern.id);
      if(internJob && isStuck(internJob)){
        return { key: 'stuck', text: '<b>' + esc(intern.name) + ' is stuck.</b> Press <b>Help them</b> under Contracts and answer the puzzle. ' +
          'Right, and the hotfix jumps ahead (and your help pays like a desk job); wrong, and it loses some progress.' };
      }
      if(state.jobs.some(isSlow)){
        return { key: 'team-stuck', text: '<b>Your team is stuck.</b> They’re junior, so it happens: the contract is going at half speed. ' +
          'Press <b>Help them</b> under Contracts and answer the puzzle to get them back to full speed.' };
      }
      if(!devs.length && intern && !internJob && !state.internDone){
        const offer = state.board.find(o => isHotfix(o.tier) && !o.expert && o.lang === 'Python') ||
                      state.board.find(o => internCan(o));
        return { key: 'intern', offerId: offer && offer.id,
          text: '<b>Put your intern, ' + esc(intern.name) + ', to work.</b> On the contract board, press <b>Staff a team</b> on the ' +
            esc(offer ? offer.lang : 'highlighted') + ' hotfix, tick them and yourself, and start it. Interns are free, and you help them ' +
            'in any language you know: Python, and any you’ve earned daily puzzle XP in. Now and then they get stuck, and need you to answer a puzzle.' };
      }
      if(!(state.desk && state.desk.done)){
        return { key: 'desk', text: '<b>Take a desk job.</b> At your desk, answer a question or two from past daily puzzles ' +
          'and Debuggit Learn. Every right answer pays the company and earns reputation, and new jobs turn up about every hour.' };
      }
      if(!state.contractsOpen){
        const grad = (state.applicants || []).find(a => a.role === 'Graduate');
        const desks = Math.min(desksUsed(), SPARE_ROOM_DESKS) + ' of ' + SPARE_ROOM_DESKS + ' desks';
        return { key: 'hire', text: (grad
          ? '<b>Hire a graduate.</b> ' + esc(grad.person.name) + ' has applied, under Applicants.'
          : (state.reputation || 0) >= APPLICANT_REP.Graduate
          ? '<b>Wait for applicants.</b> Graduates apply every few hours now the studio has the reputation; keep taking desk jobs meanwhile.'
          : '<b>Earn some reputation.</b> Graduates apply once the studio has ' + APPLICANT_REP.Graduate + ' reputation (you have ' +
            Math.floor(state.reputation || 0) + '). Every right answer, on a desk job or helping your stuck intern, earns 1.') +
          ' Clients only come once your spare room is full (' + desks + ': you and 3 more). Meanwhile your staff do everyday work, ' +
          'support tickets and bug fixes, which more than covers their salary.' };
      }
      const first = state.board.find(o => o.first);
      if(first){
        return { key: 'first', offerId: first.id, text: '<b>Your first client!</b> They’ve a Python feature for your whole team, at double pay. ' +
          'Press <b>Staff a team</b> on it, tick everyone and start it. Your team is junior, so be ready to help when they get stuck.' };
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
      setHTML(guideEl, html);
      return step;
    }

    // The notifications bar, at the top of the contract board: things that need you, with the
    // button to deal with them. Notices of resignation (the same message floats over the person's
    // head in the office) and debt for now.
    function renderNotifications(now){
      let html = '';
      state.roster.filter(p => p.notice).forEach(p => {
        const n = p.notice, left = n.until - now;
        html += '<div class="alert bad" data-alert="notice" data-id="' + p.id + '">' +
          '<span>✉ <button type="button" class="link-btn" data-action="inspect" data-id="' + p.id + '">' + esc(p.name) + '</button> (' + p.role.toLowerCase() +
          ') handed in their notice: ' + (n.reason === 'cramped' ? 'the office is too cramped (free up a desk to keep them)' : 'a better offer') +
          ' · ' + (left > 0 ? 'leaves in ' + fmtDuration(left) : 'leaves after this contract') + '</span>' +
          '<button class="btn-small btn-promote" data-action="keep" data-id="' + p.id + '">Keep: +' + fmtRate(n.ask) + '/min</button></div>';
      });
      if(state.money < 0){
        html += '<div class="alert bad" data-alert="debt">⚠ The company is ' + fmt(-state.money) + ' in debt, and salaries keep going out. ' +
          'Put everyone on contracts, take a desk job, or let someone go.</div>';
      }
      setHTML(notifEl, html);
      notifEl.hidden = !html;
    }

    function renderStage(){
      const i = stageIndex();
      const st = STAGES[i];
      setHTML(stageBar,
        '<div class="stage-steps" aria-hidden="true">' + STAGES.map((x, k) =>
          '<span class="stage-step' + (k < i ? ' done' : k === i ? ' now' : '') + '" title="' + esc(x.name) + '"></span>').join('') + '</div>' +
        '<div class="stage-name" data-stage="' + st.key + '">' + esc(st.name) + '</div>' +
        '<div class="stage-text">' + esc(st.text) + ' <span class="stage-next">' + esc(nextStageText()) + '</span></div>');
    }

    function renderStats(){
      statMoney.textContent = fmt(state.money);
      statMoney.classList.toggle('neg', state.money < 0);
      statRep.textContent = Math.floor(state.reputation).toLocaleString('en-GB');
      const rent = rentPerMinute();
      statPayroll.textContent = '−' + fmtRate(payrollPerMinute() + rent) + '/min';
      const rentWord = owned() ? 'upkeep' : 'rent';
      statPayroll.title = rent ? fmtRate(payrollPerMinute()) + '/min salaries + ' + fmtRate(rent) + '/min ' + rentWord : 'Salaries';
      statPayrollLabel.textContent = rent ? 'Payroll + ' + rentWord : 'Payroll';
      statHeads.textContent = headcount();
      const sloc = totalSlocPerMinute();
      statSloc.textContent = (Math.round(sloc * 10) / 10).toLocaleString('en-GB');
      statSloc.title = 'Lines of code written per minute, on contracts and everyday work';
    }

    // ---------------------------------------------------------------------
    // Employee panel
    // ---------------------------------------------------------------------

    let inspectId = null;

    function skillRowsHTML(names, map, kind){
      const top = names.reduce((m, n) => Math.max(m, skillLevel(map[n])), 0);
      return names.map(name => {
        const xp = map[name] || 0;
        const lv = skillLevel(xp);
        const from = skillXp(lv), to = skillXp(lv + 1);
        const pct = Math.max(0, Math.min(100, (xp - from) / (to - from) * 100));
        return '<div class="skill-row' + (lv ? '' : ' none') + '"><span class="skill-name">' + esc(name) + '</span>' +
               '<span class="skill-level' + (lv && lv === top ? ' best' : '') + '">Lv ' + lv + '</span>' +
               '<div class="skill-bar" role="progressbar" aria-label="' + esc(name) + ' XP to level ' + (lv + 1) + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '">' +
               '<div class="skill-fill ' + kind + '" style="width:' + pct.toFixed(1) + '%"></div></div>' +
               '<span class="skill-xp">' + Math.floor(xp) + '/' + to + ' xp</span></div>';
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
            row(bestLevel(p.lang) >= req.lang, 'A language at level ' + req.lang) +
            (ps.blocked ? '<div class="no" style="color:var(--amber)">⚠ ' + esc(ps.blocked) + '</div>' : '') +
            '</div>';
        }else{
          body += '<div class="skill-section-title">Promotion</div><div class="req-list"><div class="ok">Top of the ladder.</div></div>';
        }
      }else if(isIntern(p)){
        body += '<div class="skill-section-title">Languages</div>' + skillRowsHTML(LANGS, p.lang, 'lang');
        body += '<div class="skill-section-title">Internship</div><div class="req-list"><div class="no">' +
                'Free, and writes hotfixes with you alongside, in any language they or you know; when they get stuck, you help with a puzzle. ' +
                'Ends in ' + fmtDuration(Math.max(0, internEnds(p) - now)) + ', when they’ll ask to stay on as a graduate for half the usual cost.</div></div>';
      }else if(p.role === 'Director'){
        const c0 = headcounts(state.roster);
        body += '<div class="skill-section-title">Languages (your puzzle levels)</div><div class="req-list"><div class="no">' + Object.keys(D.LANGS).map(k => {
          const boost = directorBoost(D.LANGS[k].studio);
          const course = window.DEBUGG_LEARN && window.DEBUGG_LEARN.courses[k];
          const name = course && !course.soon
            ? '<a class="learn-lang" href="learn/#' + k + '" title="Learn ' + esc(D.LANGS[k].name) + ' in Debuggit Learn">' + esc(D.LANGS[k].name) + '</a>'
            : esc(D.LANGS[k].name);
          return name + ' Lv ' + directorLevel(k) + (boost ? ' (+' + Math.round(boost * 100) + '% success)' : '');
        }).join(' · ') + '</div></div>' +
          '<div class="skill-section-title">Role</div><div class="req-list"><div class="no">' +
          (jobFor(p.id) ? 'Helping on a hotfix with your intern, and taking desk jobs. ' : '') +
          (c0.Manager ? 'Taking desk jobs. Your managers look after the team.'
            : 'Taking desk jobs, and managing the start-up yourself (up to ' + DIRECTOR_SPAN + ' devs).') + '</div></div>' +
          '<div class="card-foot" style="margin-top:8px;"><button type="button" class="btn-small btn-ghost" data-action="go-desk">Go to your desk</button>' +
          (window.DebuggFounding ? '<button type="button" class="btn-small btn-ghost" data-action="edit-founder"' +
            ' title="Change the company’s name, your name and your look">Edit name and look</button>' : '') + '</div>';
      }else{
        body += '<div class="skill-section-title">Role</div><div class="req-list"><div class="no">' +
                'Managers don’t write code. Each one looks after up to ' + MANAGER_SPAN + ' devs and ' +
                PRINCIPALS_PER_MANAGER + ' principals, and one is needed on every major release.</div></div>';
      }

      setHTML(personModalBody,
        '<div class="modal-top"><div><div class="modal-name">' + esc(p.name) + '</div>' +
        '<div class="modal-level">' + p.role + '</div></div></div>' +
        (p.role === 'Director' ? '' : '<div class="modal-sub">' + (isDev(p) ? role.sloc + ' SLOC/min · ' : '') + '−' + fmtRate(salaryOf(p)) + '/min upkeep' +
        (p.raise ? ' (incl. a ' + fmtRate(p.raise) + ' rise)' : '') + ' · ' +
        fmtDuration((tenure || 0) * 60000, true) + ' in role · ' + fmtDuration(p.worked || 0, true) + ' on contracts' +
        (job && isRunning(job) ? '<br>' + fmtClock(job.endsAt - now) + ' left on the ' + TIERS[job.tier].name.toLowerCase() : '') + '</div>') +
        '<div class="person-actions">' + personActionsHTML(p, now) + '</div>' +
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
      else onAction(e);   // promote, Keep, Let go, the Director's Edit and desk
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
        slot('Devs', c.devs, cap.devs) +
        slot('Desks', desksUsed(), deskCount()));
      const here = premisesKey(), up = nextPremises(), down = prevPremises();
      const row = key => {
        const pr = PREMISES[key], cur = key === here;
        const price = key === 'spare-room' ? 'Free'
          : cur ? (owned() ? 'Owned, ' + fmtRate(pr.upkeep) + '/min upkeep' : 'Rented, ' + fmtRate(pr.rent) + '/min')
          : 'Rent ' + fmtRate(pr.rent) + '/min, or buy for ' + fmt(pr.price) + ' (then ' + fmtRate(pr.upkeep) + '/min upkeep)';
        const buttons = key === up
          ? '<button class="btn-small btn-ghost" data-action="move" data-premises="' + key + '" data-tenure="rent">Rent a ' + pr.name +
              ' · ' + desksIn(key) + ' desks · ' + fmtRate(pr.rent) + '/min</button>' +
            '<button class="btn-small btn-ghost" data-action="move" data-premises="' + key + '" data-tenure="buy"' +
              (state.money < pr.price ? ' disabled title="Not enough cash"' : '') + '>Buy one · ' + fmt(pr.price) +
              ', then ' + fmtRate(pr.upkeep) + '/min upkeep</button>'
          : cur && key !== 'spare-room' && !owned()
          ? '<button class="btn-small btn-ghost" data-action="buy-premises"' +
              (state.money < pr.price ? ' disabled title="Not enough cash"' : '') + '>Buy this ' + pr.name + ' · ' + fmt(pr.price) +
              ', then ' + fmtRate(pr.upkeep) + '/min upkeep</button>'
          : key === down
          ? '<button class="btn-small btn-ghost" data-action="move" data-premises="' + key + '"' +
              (moveProblem(key) ? ' disabled title="Can’t move back: ' + moveProblem(key) + '"' : '') + '>' +
              (owned() ? 'Sell for ' + fmt(sellPrice(here)) + ' and move back to the ' : 'Move back to the ') + pr.name + '</button>'
          : '';
        return '<div class="premises-row' + (cur ? ' here' : '') + '" data-premises="' + key + '">' +
          '<div class="premises-top"><b>' + (key === 'spare-room' ? 'Your ' : 'A ') + pr.name + '</b>' +
            (cur ? '<span class="tag">You are here</span>' : '') + '</div>' +
          '<div class="premises-facts">' + desksIn(key) + ' desks' + (pr.floors > 1 ? ' on ' + pr.floors + ' floors' : '') + ' · ' + price +
            (cur ? ' · <span class="' + (desksUsed() >= deskCount() ? 'full' : '') + '">' + desksUsed() + '/' + deskCount() + ' desks used</span>' : '') + '</div>' +
          '<div class="premises-blurb">' + esc(pr.blurb) + '</div>' +
          (cur && cramLevel() ? '<div class="cramped">' + cramLevel() + ' squeezed in without a desk' +
            ': cramped, so everyone is ' + Math.round(crampedPenalty() * 100) + '% slower on new contracts, and likelier to hand in their notice.</div>' : '') +
          (buttons ? '<div class="office-actions">' + buttons + '</div>' : '') +
          '</div>';
      };
      setHTML(officeEl,
        '<div class="premises-title">Premises</div>' +
        PREMISES_ORDER.map(row).join('') +
        (up ? '' : '<div class="premises-row soon"><div class="office-actions"><button class="btn-small btn-ghost" disabled title="Bigger premises are coming in v0.1">Bigger premises · coming in v0.1</button></div></div>'));
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

      studioName.textContent = companyName();
      // A names-only way in for anyone who can't tap the picture (keyboard, screen reader).
      let html = '';
      ['Director'].concat(ROSTER_GROUPS).forEach(level => {
        state.roster.filter(p => p.role === level).forEach(p => {
          html += '<button type="button" class="person-link" data-action="inspect" data-id="' + p.id + '">' + esc(p.name) +
            ' <span class="card-level ' + p.role + '">' + p.role + '</span>' + (p.notice ? ' ✉' : '') + '</button>';
        });
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
                '" data-action="hire" data-role="' + role + '"' +
                (why || broke ? ' disabled' : '') + '>' +
                '<span class="role">Hire ' + role.toLowerCase() + '</span> <span class="cost"' +
                  (rise > 0 ? ' title="Up ' + rise + '% since the company started, from inflation and competition"' : '') + '>' + fmt(cost) +
                  (rise > 0 ? ' <span class="rise">↑' + rise + '%</span>' : '') + '</span>' +
                '<span class="why">' + (why ? esc(why) : broke ? 'not enough cash' : deskNote() || ROLES[role].salary + '/min salary') + '</span>' +
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
          '<button class="btn-small btn-promote' + (guide && guide.key === 'hire' && a.role === 'Graduate' ? ' guide-target' : '') +
            '" data-action="hire-applicant" data-id="' + a.id + '"' + (why || broke ? ' disabled' : '') + '>' +
            'Hire for ' + fmt(a.cost) + '</button></div>' +
          (why || broke ? '<div class="card-foot"><span class="promo blocked">' + esc(why || 'not enough cash') + '</span></div>'
            : deskNote() ? '<div class="card-foot"><span class="promo">' + esc(deskNote()) + '</span></div>' : '') +
          (canHireWfh(a.role) ? '<div class="card-foot"><span class="promo">Or from home: no desk, ' + Math.round(WFH_EFFICIENCY * 100) + '% as productive</span>' +
            '<button class="btn-small btn-ghost" data-action="hire-applicant" data-wfh="1" data-id="' + a.id + '"' +
              (hireProblem(a.role, true) || broke ? ' disabled' : '') + '>Hire to work from home</button></div>' : '') +
          '</div>';
      }).join('');
      if(!html) html = '<p class="applicants-note">Nobody’s applied yet. Developers apply every day or so, and their offers stay open for ' + APPLICANT_OPEN_H + ' hours.</p>';
      // "Graduates and juniors apply once the studio has 15 reputation; seniors once it has 500"
      const locked = APPLICANT_ROLES.filter(r => (state.reputation || 0) < APPLICANT_REP[r]);
      if(locked.length){
        const by = [];
        locked.forEach(r => {
          const g = by.find(x => x.rep === APPLICANT_REP[r]);
          const name = (r === 'Graduate' ? 'graduate' : r.toLowerCase()) + 's';
          if(g) g.names.push(name); else by.push({ rep: APPLICANT_REP[r], names: [name] });
        });
        const text = by.map(g => g.names.join(' and ') + ' apply once the studio has ' + g.rep.toLocaleString('en-GB') + ' reputation').join('; ');
        html += '<p class="applicants-note">' + text.charAt(0).toUpperCase() + text.slice(1) +
          ' (you have ' + Math.floor(state.reputation || 0).toLocaleString('en-GB') + '). Delivered contracts, desk jobs and helping your intern earn it.</p>';
      }
      setHTML(applicantsEl, html);
    }

    // What's going on with someone, and what you can do about it: shown in their panel.
    function personActionsHTML(p, now){
      const job = jobFor(p.id);
      const status = job && isStuck(job)
        ? '<span class="promo blocked">Stuck on the ' + esc(job.lang) + ' hotfix — help them below</span>'
        : job && !isRunning(job)
        ? '<span class="promo blocked">' + TIERS[job.tier].name + ' failed — retry or drop it below</span>'
        : job
        ? '<span class="status-busy">On ' + TIERS[job.tier].name + ' · ' + esc(job.lang) +
          (job.repeat ? ' <span class="repeat-tag">↻</span>' : '') + '</span>'
        : isDev(p) || isIntern(p) ? '<span class="status-idle" title="Everyday work earns ' + fmtRate(benchPerMinute(p)) + '/min against a ' + fmtRate(salaryOf(p)) + '/min salary">' +
            'Everyday work · support tickets · +' + fmtRate(benchPerMinute(p)) + '/min</span>'
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

      return '<div class="card-foot">' + status + (p.wfh ? ' <span class="repeat-tag" title="Works from home: no desk, ' +
          Math.round(WFH_EFFICIENCY * 100) + '% as productive">WFH</span>' : '') + '</div>' +
        noticeHTML(p, now) +
        (promo ? '<div class="card-foot" style="margin-top:6px;">' + promo + '</div>' : '') +
        (isIntern(p) ? '<div class="card-foot" style="margin-top:6px;"><span class="promo">Internship ends in ' +
          fmtDuration(Math.max(0, internEnds(p) - now)) + '</span></div>' : '') +
        (p.role === 'Director' ? '' : '<div class="card-foot" style="margin-top:8px;"><span class="foot-actions">' + release + '</span></div>');
    }

    // Short summary of a dev's two best languages for a roster card; the full
    // breakdown is in the employee panel.
    function topSkillsText(p){
      const known = Object.keys(p.lang).filter(k => skillLevel(p.lang[k]) > 0)
        .sort((a, b) => p.lang[b] - p.lang[a]).slice(0, 2);
      return known.length ? known.map(k => esc(k) + ' Lv ' + skillLevel(p.lang[k])).join(' · ') : 'no languages yet';
    }

    // The board is a tree like the roster: one foldable group per contract type,
    // with its offers sorted by language. Folded groups are remembered in the save.
    function renderBoard(){
      let html = '';
      TIERS.forEach((t, ti) => {
        const offers = state.board.filter(o => o.tier === ti)
          .sort((a, b) => (a.expert || 0) - (b.expert || 0) || LANGS.indexOf(a.lang) - LANGS.indexOf(b.lang));
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
    // Whether the intern and the Director could take this offer (a hotfix in a language one knows).
    function internCan(o){
      const intern = state.roster.find(isIntern);
      return !!intern && isHotfix(o.tier) && !o.expert && (skillLevel(intern.lang[o.lang]) > 0 || directorKnows(o.lang)) && hasPuzzles(o.lang);
    }
    function offersHTML(offers){
      const devs = state.roster.filter(isDev);
      if(!devs.length) return offers.map(offerHTML).join('');
      const can = offers.filter(o => devs.some(d => qualifiedFor(d, o)) || internCan(o));
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

    // "Risky · pays ×1.4 · −15% success" on offers, the picker and jobs; nothing for standard ones.
    function riskChip(o){
      if(!o.risk || o.risk === 'standard') return '';
      const r = riskOf(o);
      return '<div class="risk ' + o.risk + '">' + r.name + ' · pays ×' + r.pay + ' · −' + Math.round(-r.chance * 100) + '% success</div>';
    }

    // "Expert · needs Lv 5 Python · pays ×1.6"
    function expertChip(o){
      const e = expertOf(o);
      return e ? '<div class="expert">Expert · needs ' + (TIERS[o.tier].max === 1 ? '' : 'someone at ') + 'Lv ' + e.level + ' ' + esc(o.lang) + ' · pays ×' + e.pay + '</div>' : '';
    }
    function expertTag(j){ return j.expert ? ' <span class="expert-tag">Lv ' + j.expert + '</span>' : ''; }

    function riskTag(j){ return j.risk && j.risk !== 'standard' ? ' <span class="risk-tag ' + j.risk + '">' + riskOf(j).name + '</span>' : ''; }

    function offerHTML(o){
      const t = TIERS[o.tier];
      return '<div class="offer' + (o.expert ? ' expert-offer' : '') + '">' +
        '<div class="offer-top"><span class="chip lang">' + esc(o.lang) + '</span><span class="dur">' + o.sloc.toLocaleString('en-GB') + ' SLOC</span></div>' +
        (o.first ? '<div class="expert">★ Your first client · pays ×' + o.bonus + ' · needs ' + o.minTeam + ' developers</div>' : '') +
        expertChip(o) + riskChip(o) +
        (!state.roster.some(p => isDev(p) && qualifiedFor(p, o)) && !internCan(o) ? '<div class="detail" style="color:var(--amber)">Nobody on staff knows ' + esc(o.lang) + '</div>'
          : !state.roster.some(p => isDev(p) && meetsExpert(p, o)) ? '<div class="detail" style="color:var(--amber)">Nobody on staff is at ' + esc(o.lang) + ' Lv ' + o.expert + ' yet</div>'
          : '') +
        '<div class="detail">≈ ' + fmtClock(o.sloc / t.refSloc * 60000) + ' with a minimum team, no ' + esc(o.lang) + ' skill · ' +
          t.xpPerMin + ' XP/min</div>' +
        '<div class="detail" style="color:var(--text-faint)">' + (TIERS[o.tier].key === 'feature' && !managed()
          ? 'Open for another ' + fmtDuration(o.expiresAt - Date.now()) : 'Replaced in ' + fmtDuration(o.expiresAt - Date.now()) + ' if not taken') + '</div>' +
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
          if(isStuck(j)){
            const done = Math.round((1 - j.left / (j.endsAt - j.startedAt)) * 100);
            return '<div class="job stuck">' +
              '<div class="job-top"><span class="left">' + t.name +
              ' <span class="chip lang">' + esc(j.lang) + '</span>' + riskTag(j) + '</span>' +
              '<span class="time" style="color:var(--amber)">Stuck</span></div>' +
              '<div class="progress"><div style="width:' + done + '%"></div></div>' +
              '<div class="detail">' + team + ' · stuck at ' + done + '% until you help: a ' + esc(j.lang) + ' puzzle. Right, and it jumps ' +
                Math.round(INTERN_NUDGE * 100) + '% ahead and pays ' + helpPayText() + '; wrong, and it loses ' + Math.round(INTERN_NUDGE * 100) + '%.</div>' +
              '<div class="actions" style="margin:8px 0 0;">' +
                '<button class="btn-primary btn-small' + (guide && guide.key === 'stuck' ? ' guide-target' : '') + '" data-action="intern-help" data-job="' + j.id + '"' +
                  (helpActive || deskActive ? ' disabled' : '') + '>Help them</button>' +
              '</div></div>';
          }
          if(isSlow(j)){
            const done = Math.round(slowDone(j, now) * 100);
            return '<div class="job stuck">' +
              '<div class="job-top"><span class="left">' + t.name +
              ' <span class="chip lang">' + esc(j.lang) + '</span>' + (j.first ? ' <span class="repeat-tag">★ first client</span>' : '') + riskTag(j) + '</span>' +
              '<span class="time" style="color:var(--amber)" data-time="' + j.id + '"></span></div>' +
              '<div class="progress"><div data-bar="' + j.id + '" style="width:' + done + '%"></div></div>' +
              '<div class="detail">' + team + ' · stuck, so going at half speed until you help: a ' + esc(j.lang) + ' puzzle. Right, and it’s back to full speed, ' +
                Math.round(INTERN_NUDGE * 100) + '% further on, and pays ' + helpPayText() + '; wrong, and it’s back to full speed but loses ' + Math.round(INTERN_NUDGE * 100) + '%.</div>' +
              '<div class="actions" style="margin:8px 0 0;">' +
                '<button class="btn-primary btn-small' + (guide && guide.key === 'team-stuck' ? ' guide-target' : '') + '" data-action="intern-help" data-job="' + j.id + '"' +
                  (helpActive || deskActive ? ' disabled' : '') + '>Help them</button>' +
              '</div></div>';
          }
          if(!isRunning(j)){
            return '<div class="job failed">' +
              '<div class="job-top"><span class="left">' + t.name +
              ' <span class="chip lang">' + esc(j.lang) + '</span>' + expertTag(j) + riskTag(j) + '</span>' +
              '<span class="time" style="color:var(--red)">Failed</span></div>' +
              '<div class="detail">' + team + ' · the team is waiting on your call.</div>' +
              '<div class="actions" style="margin:8px 0 0;">' +
                (managed() ? '<button class="btn-primary btn-small" data-action="retry-job" data-job="' + j.id + '">Retry — ' +
                  fmtClock(retryMs(j)) + ' for ' + fmt(retryPayout(j)) + ' (' + Math.round(j.chance * 100) + '%)</button>' : '') +
                '<button class="btn-ghost btn-small" data-action="drop-job" data-job="' + j.id + '">Drop it</button>' +
              '</div></div>';
          }
          return '<div class="job">' +
            '<div class="job-top"><span class="left">' + t.name +
            ' <span class="chip lang">' + esc(j.lang) + '</span>' + (j.first ? ' <span class="repeat-tag">★ first client</span>' : '') + expertTag(j) + riskTag(j) + '</span>' +
            '<span class="time" data-time="' + j.id + '"></span></div>' +
            '<div class="progress"><div data-bar="' + j.id + '"></div></div>' +
            '<div class="detail">' + team + (j.sloc ? ' · ' + j.sloc.toLocaleString('en-GB') + ' SLOC at ' + j.teamSloc + '/min' : '') +
            (isInternJob(j) ? ' · ' + fmt(j.payout) + ' when it’s written' + '</div>'
              : ' · ' + Math.round(j.chance * 100) + '% success · ' + fmt(j.payout) +
                ' on delivery' + (j.attempt === 2 ? ' · retry' : '') + '</div>' +
                (managed() ? '<label class="repeat-row" style="margin:6px 0 0;"><input type="checkbox" data-repeat="' + j.id + '"' +
                (j.repeat ? ' checked' : '') + '> Repeat with this team when it finishes</label>' : '')) +
            '</div>';
        }).join(''));
        jobs.filter(isRunning).forEach(j => {
          const time = jobsEl.querySelector('[data-time="' + j.id + '"]');
          const bar = jobsEl.querySelector('[data-bar="' + j.id + '"]');
          const pct = Math.min(100, (isSlow(j) ? slowDone(j, now) : (now - j.startedAt) / (j.endsAt - j.startedAt)) * 100);
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
      renderNotifications(now);
      renderStage();
      renderStats();
      renderStudio(now);
      renderBoard();
      renderJobs(now);
      renderDesk();
      renderOffice();
    }

    // ---------------------------------------------------------------------
    // The office view (ltd/office.js): a picture of the studio, drawn from officeSnapshot().
    // It changes nothing itself; a tap does what a button in the panels does.
    // ---------------------------------------------------------------------

    let officeMounted = false;
    function renderOffice(){
      if(!officeSlot) return;
      $('officeTag').textContent = (premisesKey() === 'spare-room' ? 'your ' : 'a ') + premises().name;
      if(officeMounted) return;
      officeMounted = true;
      window.DebuggOffice.mount($('officeBox'), officeApi);
    }
    function officeJob(job, now){
      const length = Math.max(1, job.endsAt - job.startedAt);
      const progress = isSlow(job) ? slowDone(job, now) : isStuck(job) ? 1 - (job.left || 0) / length : isRunning(job) ? (now - job.startedAt) / length : 1;
      return { id: job.id, tier: job.tier, lang: job.lang, status: job.status || 'running', progress: Math.max(0, Math.min(1, progress)) };
    }
    // Everything the office draws, from the save. state: director, working, stuck, failed, bench,
    // away, or idle (a manager or the intern with nothing on).
    function officeSnapshot(){
      const now = Date.now(), busy = busyIds();
      return {
        now,
        company: companyName(),
        premises: { kind: premisesKey(), name: premises().name, owned: owned(), floors: premises().floors, perFloor: premises().perFloor,
                    squeezed: Math.max(0, desksUsed() - deskCount()), maxApplicants: MAX_APPLICANTS },
        people: state.roster.map(p => {
          const job = jobFor(p.id);
          const st = p.role === 'Director' ? 'director'
            : isAway(p, now) ? 'away'
            : job ? (isStuck(job) || isSlow(job) ? 'stuck' : isRunning(job) ? 'working' : 'failed')
            : onBench(p, busy, now) ? 'bench' : 'idle';
          return { id: p.id, name: p.name, role: p.role, look: p.look || null, wfh: !!p.wfh, state: st, notice: p.notice ? { reason: p.notice.reason, until: p.notice.until } : null, job: job ? officeJob(job, now) : null };
        }),
        applicants: (state.applicants || []).slice(0, MAX_APPLICANTS).map(a => ({ id: a.id, name: a.person.name, role: a.role }))
      };
    }
    const officeApi = {
      snapshot: officeSnapshot,
      onTap(kind, id){
        if(kind === 'person'){
          if(person(id)) openPersonModal(id);
        }else if(kind === 'stuck'){
          startHelp(id);
        }else if(kind === 'director'){
          const d = state.roster.find(p => p.role === 'Director');
          if(d) openPersonModal(d.id);
        }else if(kind === 'applicant'){
          // Hiring costs money, so it stays a button: the tap shows you their card.
          const card = [...applicantsEl.querySelectorAll('.applicant')].find(el => el.dataset.applicant === id);
          if(!card) return;
          card.scrollIntoView({ block: 'center', behavior: 'smooth' });
          card.classList.remove('office-picked');
          void card.offsetWidth;
          card.classList.add('office-picked');
        }
      }
    };
    // ---------------------------------------------------------------------
    // Team picker
    // ---------------------------------------------------------------------

    let picker = null; // { offerId, selected: Set, repeat }

    function openPicker(offerId){
      const offer = state.board.find(o => o.id === offerId);
      // With managers, contracts default to repeating; before them there are no repeats.
      picker = { offerId, selected: new Set(), repeat: !!offer && managed() && !isHotfix(offer.tier) };
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
      const pool = tier.max > 1 ? free : free.filter(p => qualifiedFor(p, offer) && meetsExpert(p, offer));
      const unqualified = free.filter(p => pool.indexOf(p) < 0);
      // Drop any selection that's no longer available.
      picker.selected.forEach(id => { if(!pool.some(p => p.id === id)) picker.selected.delete(id); });
      return { offer, tier, pool, unqualified, busyCount: state.roster.filter(p => eligibleFor(tier, p) && busy.has(p.id)).length };
    }

    function suggestTeam(tier, offer, pool){
      const fit = p => skillLevel(p.lang[offer.lang]);
      const byFit = pool.slice().sort((a, b) => fit(b) - fit(a) || levelRank(b.role) - levelRank(a.role));
      const chosen = [];
      const take = (pred, n) => {
        for(const p of byFit){
          if(n <= 0) break;
          if(chosen.indexOf(p) < 0 && pred(p)){ chosen.push(p); n--; }
        }
      };
      // An expert contract needs its expert: the best-matched dev who qualifies.
      if(offer.expert) take(p => isDev(p) && meetsExpert(p, offer), 1);
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
      // Nobody else for a hotfix: the intern and the Director, if they're free and can take it.
      if(!chosen.length && tier.key === 'hotfix'){
        const pair = [pool.find(isIntern), pool.find(p => p.role === 'Director')];
        if(pair.every(Boolean) && evaluateTeam(tier, offer, pair).valid) return pair.map(p => p.id);
      }
      return chosen.map(p => p.id);
    }

    // What the intern's hotfix will be: written on the clock, with a chance of getting stuck.
    function internForecast(offer, ev, intern){
      return '<div class="forecast">' + esc(intern.name) + ' writes it in <b>' + (ev.sloc ? fmtClock(ev.ms) : '—') + '</b>' +
          ' (' + ev.sloc + ' SLOC/min), and it’s delivered for <b>' + fmt(ev.payout) + '</b> when it’s written.<br>' +
        'They can get <b>stuck</b> up to ' + INTERN_STUCK_MAX + ' times on the way, and each time the hotfix stalls, even while you’re away, until you help: a ' +
          esc(offer.lang) + ' puzzle from past daily puzzles and Debuggit Learn. Right, and it jumps ' + Math.round(INTERN_NUDGE * 100) +
          '% ahead, and your help pays <b>' + helpPayText() + '</b> and +' + DESK_REP + ' reputation; wrong, and it loses ' +
          Math.round(INTERN_NUDGE * 100) + '% of its progress.<br>' +
        esc(intern.name) + ' gains <b>+' + fmtXp(ev.xp) + ' XP</b> in ' + esc(offer.lang) + '.</div>';
    }
    function renderPicker(){
      if(!picker) return;
      const ctx = pickerContext();
      if(!ctx){ closePicker(); return; }
      const { offer, tier, pool, unqualified, busyCount } = ctx;
      const members = pool.filter(p => picker.selected.has(p.id));
      const ev = evaluateTeam(tier, offer, members);
      const intern = members.find(isIntern);

      const order = ['Manager', 'Principal', 'Senior', 'Junior', 'Graduate', 'Intern', 'Director'];
      const rows = pool.slice().sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role)).map(p => {
        const on = picker.selected.has(p.id);
        const meta = isIntern(p)
          ? '<span class="bars">Lv ' + skillLevel(p.lang[offer.lang]) + '</span> · ' + Math.round(ROLES.Intern.sloc * speedFor(skillLevel(p.lang[offer.lang])) * 10) / 10 + ' SLOC/min · free'
          : p.role === 'Director'
          ? (directorKnows(offer.lang) ? 'helps your intern · knows ' + esc(offer.lang) : 'helps your intern · doesn’t know ' + esc(offer.lang))
          : isDev(p)
          ? '<span class="bars">Lv ' + skillLevel(p.lang[offer.lang]) + '</span>' +
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
        expertChip(offer) + riskChip(offer) +
        '<div class="offer"><div class="detail" style="border:none;padding:0;">Needs ' + tier.req +
        '. Bars shown are each person’s ' + esc(offer.lang) + ' skill.</div></div>' +
        '<div class="pick-list">' + (rows || '<div class="empty">Nobody free who can take this on.</div>') + '</div>' +
        (busyCount ? '<div class="empty" style="margin-bottom:10px;">' + busyCount + ' more busy on other contracts.</div>' : '') +
        '<div class="checks">' + ev.checks.map(c => '<span class="check ' + (c.ok ? 'ok' : 'no') + '">' + (c.ok ? '✓ ' : '✕ ') + esc(c.label) + '</span>').join('') + '</div>' +
        (intern ? internForecast(offer, ev, intern) : '<div class="forecast">' +
          'Success chance <b>' + Math.round(ev.chance * 100) + '%</b>' +
            (ev.boost ? ' (incl. +' + Math.round(ev.boost * 100) + '% from your ' + esc(offer.lang) + ' level)' : '') +
            (offer.risk && offer.risk !== 'standard' ? ' (incl. −' + Math.round(-riskOf(offer).chance * 100) + '% for the risk)' : '') +
            ' · Payout <b>' + fmt(ev.payout) + '</b>' + (offer.risk && offer.risk !== 'standard' ? ' (×' + riskOf(offer).pay + ')' : '') + ' · ' +
          'Salaries over the job <b>' + fmt(ev.salaryCost) + '</b><br>' +
          'Team output <b>' + ev.sloc + ' SLOC/min</b>' +
            (ev.matchedSloc > ev.baseSloc || ev.learners
              ? ' (' + ev.baseSloc + ' base' +
                (ev.matchedSloc > ev.baseSloc ? ', +' + Math.round((ev.matchedSloc / ev.baseSloc - 1) * 100) + '% skill match' : '') +
                (ev.learners ? ', −' + Math.round(LEARNER_DRAG * ev.learners * 100) + '% for ' + ev.learners + ' learner' + (ev.learners > 1 ? 's' : '') : '') + ')'
              : '') +
            ' → takes <b>' + (ev.sloc ? fmtClock(ev.ms) : '—') + '</b><br>' +
          'Everyone gains <b>+' + fmtXp(ev.xp) + ' XP</b> in ' + esc(offer.lang) + ' if it’s delivered, and does no everyday work while they’re on it. ' +
          (managed() ? 'If it fails, you can retry once in half the time for ' + Math.round(RETRY_PAYOUT * 100) + '% of the payout'
            : 'If it fails, the client takes it elsewhere (retries and repeats come with your first manager)') +
          (offer.risk && offer.risk !== 'standard' ? ', and each failure costs ' + riskOf(offer).repLoss + '× the usual reputation.' : '.') +
          (!managed() && hasPuzzles(offer.lang) ? ' Your team is junior: now and then they’ll get stuck and slow to half speed until you help.' : '') +
        '</div>' +
        (managed() ? '<label class="repeat-row"><input type="checkbox" data-picker-repeat' + (picker.repeat ? ' checked' : '') + '>' +
          'Repeat with this team — roll straight into another ' + tier.name.toLowerCase() + ' when it finishes, even while you’re away</label>' : '')) +
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
        if(!HIRE_BUTTONS.includes(role) || state.money < cost || hireProblem(role)) return;
        state.money -= cost;
        const hire = makeHire(role);
        state.roster.push(hire);
        addLog('info', 'Hired ' + hire.name + ' as ' + role.toLowerCase() + '.');
        track('hired/' + role.toLowerCase());
      }else if(action === 'keep'){
        const p = person(btn.dataset.id);
        if(!p || !p.notice) return;
        p.raise = (p.raise || 0) + p.notice.ask;
        addLog('ok', '✓ ' + p.name + ' is staying, for a ' + fmtRate(p.notice.ask) + '/min pay rise.');
        delete p.notice;
        track('kept/' + p.role.toLowerCase());
      }else if(action === 'move'){
        const key = btn.dataset.premises, buy = btn.dataset.tenure === 'buy';
        if(!PREMISES[key] || key === premisesKey() || (key !== nextPremises() && key !== prevPremises()) || moveProblem(key)) return;
        const pr = PREMISES[key];
        if(buy && (key === 'spare-room' || state.money < pr.price)) return;
        // Leaving a place the company owns sells it.
        if(owned()){
          const from = premisesKey(), cash = sellPrice(from);
          state.money += cash;
          addLog('info', 'Sold your ' + PREMISES[from].name + ' for ' + fmt(cash) + '.');
          track('office/sell/' + from);
        }
        if(buy) state.money -= pr.price;
        state.office.premises = key;
        state.office.owned = buy;
        moveWfh();
        addLog('info', key === 'spare-room' ? 'Moved back into your spare room: ' + desksIn(key) + ' desks, free.'
          : buy ? 'Bought a ' + pr.name + ' for ' + fmt(pr.price) + ': ' + desksIn(key) + ' desks, ' + fmtRate(pr.upkeep) + '/min upkeep.'
          : 'Moved into a rented ' + pr.name + ': ' + desksIn(key) + ' desks, ' + fmtRate(pr.rent) + '/min rent.');
        track('office/' + (key === 'spare-room' ? 'move' : buy ? 'buy' : 'rent') + '/' + key);
      }else if(action === 'edit-founder'){
        closePersonModal();
        const d = state.roster.find(p => p.role === 'Director');
        window.DebuggFounding.open({
          edit: true,
          values: { company: state.companyName || '', director: d.name === 'You' ? '' : d.name, look: d.look },
          onDone: v => {
            state.companyName = v.company || null;
            d.name = v.director || 'You';
            d.look = v.look;
            save();
            renderAll();
          }
        });
        return;
      }else if(action === 'buy-premises'){
        const pr = premises();
        if(premisesKey() === 'spare-room' || owned() || state.money < pr.price) return;
        state.money -= pr.price;
        state.office.owned = true;
        addLog('info', 'Bought the ' + pr.name + ' you rent for ' + fmt(pr.price) + ': ' + fmtRate(pr.upkeep) + '/min upkeep instead of ' + fmtRate(pr.rent) + '/min rent.');
        track('office/buy/' + premisesKey());
      }else if(action === 'toggle-unknown'){
        state.showUnknownOffers = !state.showUnknownOffers;
      }else if(action === 'go-desk'){
        closePersonModal();
        if(deskSlot.scrollIntoView) deskSlot.scrollIntoView({ block: 'start', behavior: 'smooth' });
        return;
      }else if(action === 'skip-guide'){
        state.guideDone = true;
      }else if(action === 'hire-applicant'){
        const a = (state.applicants || []).find(x => x.id === btn.dataset.id);
        const wfh = !!btn.dataset.wfh;
        if(!a || state.money < a.cost || hireProblem(a.role, wfh) || (wfh && !canHireWfh(a.role))) return;
        state.money -= a.cost;
        state.applicants = state.applicants.filter(x => x !== a);
        a.person.since = Date.now();
        if(wfh) a.person.wfh = true;
        state.roster.push(a.person);
        addLog('info', 'Hired ' + a.person.name + ' as ' + a.role.toLowerCase() + (wfh ? ', working from home.' : '.'));
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
      }else if(action === 'intern-help'){
        startHelp(btn.dataset.job);
        return;
      }else if(action === 'retry-job' || action === 'drop-job'){
        const job = state.jobs.find(j => j.id === btn.dataset.job);
        if(!job || isRunning(job) || isStuck(job)) return;
        if(action === 'retry-job'){
          if(!managed()) return;
          retryJob(job, Date.now());
          addLog('info', '↻ Retrying ' + jobTag(job) + ' for ' + fmt(job.payout) + '.');
        }else{
          state.jobs = state.jobs.filter(j => j !== job);
          addLog('info', 'Dropped ' + jobTag(job) + '.');
        }
      }else if(action === 'inspect'){
        openPersonModal(btn.dataset.id);
        return;
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
    // Saves from before desks start in the spare room. Co-working desks are gone (the player-owner's
    // call, October 2026): anyone who sat at one is squeezed in, and past cramMax() hiring waits
    // until the company moves into a business unit. Nobody is let go.
    if(!state.office) state.office = { premises: 'spare-room' };
    if('cowork' in state.office){
      if(state.office.cowork > 0) addLog('info', 'Co-working desks are gone: everyone who sat at one is squeezed into your spare room. ' +
        'A small business unit (' + desksIn('unit-s') + ' desks) is the way to grow now.');
      delete state.office.cowork;
    }
    if(!state.office.premises) state.office.premises = 'spare-room';
    if(!('owned' in state.office)) state.office.owned = false;
    // The Director takes a desk since October 2026: say so once to companies from before.
    if(!state.directorDesk){
      if(state.roster.length > 2 || state.log.length) addLog('info', 'You now sit at one of the office’s desks yourself, so it holds one fewer of your staff.');
      state.directorDesk = true;
    }
    // Version 1 saves used quick fix / sprint / milestone / full delivery,
    // which map one-for-one onto hotfix / patch / minor / major (same tier
    // indices), so only the board needs refreshing to pick up the new names.
    if((state.tiersVersion || 1) < TIERS_VERSION){
      // Features went in after hotfixes (version 4): patches and up move one along.
      if((state.tiersVersion || 1) < 4) state.jobs.forEach(j => { if(j.tier >= 1) j.tier += 1; });
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

    // Companies from before interns get one, once.
    if(!state.internGiven){
      state.roster.push(makeIntern(Date.now()));
      state.internGiven = true;
      addLog('info', 'An intern has joined: free, and they write hotfixes with you in any language you know.');
    }
    // Everyday work (October 2026): everyone has a pace. A company whose spare room is already full
    // (or that has managers) has contracts open, and is past its first client. Before managers
    // nothing repeats.
    state.roster.forEach(p => { if(!p.pace && (isDev(p) || isIntern(p))) p.pace = between(PACE); });
    if(!('contractsOpen' in state)){
      state.contractsOpen = desksUsed() >= SPARE_ROOM_DESKS || managed();
      state.firstClient = state.contractsOpen;
    }
    if(!managed()) state.jobs.forEach(j => { j.repeat = false; });
    // Intern hotfixes from before they could get stuck: no repeats, and one left failed (they used
    // to fail) is delivered, as they all are now.
    state.jobs.forEach(j => {
      if(!isInternJob(j)) return;
      j.repeat = false;
      if(j.status === 'failed'){ j.status = 'running'; j.attempt = 1; }
    });

    // Offers from before contracts had a SLOC target.
    if(state.board.some(o => !o.sloc)) state.board = makeBoard();
    state.board.forEach(o => { if(!o.expiresAt) o.expiresAt = Date.now() + TIERS[o.tier].offerLife * 60000; });
    refreshBoard(Date.now());
    moveMarket(Date.now());
    moveApplicants(Date.now());
    checkStage();

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
    moveNotices(now);
    moveInterns(now);
    save();

    managersStaff();
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
      moveNotices(t);
      moveInterns(t);
      moveDesk(t);
      moveWfh();
      checkStage();
      managersStaff();
      renderAll();
      save();
    }, 1000);
  }

  let stopGame = () => {};
  return { start, stop: () => stopGame() };
})();
