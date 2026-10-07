#!/usr/bin/env node
// The Debuggit Ltd pacing simulator: plays the real game (ltd/ltd.js, unchanged) headless, with a
// fake clock, a seeded random number generator and a stand-in page, and reports when the milestones
// in ideas/ltd-pacing-targets.md happen.
//
//   node tools/sim-ltd.js [--profile keen|casual|always] [--days 30] [--seeds 5] [--seed 1]
//                         [--full] [--hit 0.8] [--xp 0] [--step 1] [--ltd file] [--json]
//
// How it works. Each check-in "opens the page": a fresh VM context runs shared.js and ltd/ltd.js and
// calls DebuggLtd.start(), which resumes the save from a shared localStorage, so time away is caught
// up exactly as it is for players (the 4-hour offline cap included). While the page is open the
// simulator runs the game's own one-second tick once a game minute, and a player strategy clicks the
// game's own buttons (hire, staff a team, promote, desk jobs…) through stand-in click events. When
// the check-in ends the context is thrown away and the clock jumps to the next one.
//
// Graduates, like everyone else, are hired from applicants (from 15 reputation).
// Profiles (ideas/ltd-pacing-targets.md §1): keen checks in every 2–4 hours from 7am to 11pm for
// 5–10 minutes; casual at about 8am and 8pm for 10 minutes; always keeps the page open.
// --full plays the whole game (DEMO off); the default is the demo, as players have it today.
// --hit is how often the player answers a desk question right; --xp is puzzle XP before founding.
// --step is the game minutes between ticks and looks while the page is open (default 1; 5 makes the
// always profile about five times faster, at a little accuracy). --ltd plays a copy of ltd/ltd.js
// instead, e.g. with a balance change to try before making it.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SHARED = new vm.Script(fs.readFileSync(path.join(ROOT, 'shared.js'), 'utf8'), { filename: 'shared.js' });
let LTD = null;   // ltd/ltd.js, or the --ltd copy
function loadLtd(file){ LTD = new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }); }

const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const DAY1 = Date.UTC(2026, 9, 5);
const START = DAY1 + 9 * HOUR;   // founded on Day 1 at 9am (times are UTC throughout)

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

function parseArgs(argv){
  const o = { profile: 'keen', days: 30, seeds: 5, seed: 1, full: false, hit: 0.8, xp: 0, step: 1, ltd: null, json: false };
  for(let i = 0; i < argv.length; i++){
    const a = argv[i], next = () => argv[++i];
    if(a === '--profile') o.profile = next();
    else if(a === '--days') o.days = +next();
    else if(a === '--seeds') o.seeds = +next();
    else if(a === '--seed') o.seed = +next();
    else if(a === '--full') o.full = true;
    else if(a === '--hit') o.hit = +next();
    else if(a === '--xp') o.xp = +next();
    else if(a === '--step') o.step = +next();
    else if(a === '--ltd') o.ltd = next();
    else if(a === '--json') o.json = true;
    else if(a === '--help' || a === '-h'){ console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 23).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
    else throw new Error('Unknown option ' + a);
  }
  if(!PROFILES[o.profile]) throw new Error('Unknown profile ' + o.profile + ' (keen, casual or always)');
  return o;
}

// ---------------------------------------------------------------------------
// Randomness and the clock
// ---------------------------------------------------------------------------

function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fakeDate(clock){
  const Real = Date;
  class FakeDate extends Real {
    constructor(...args){ if(args.length) super(...args); else super(clock.now); }
    static now(){ return clock.now; }
  }
  return FakeDate;
}

// ---------------------------------------------------------------------------
// A stand-in page: just enough DOM for ltd.js to render into and listen on
// ---------------------------------------------------------------------------

function fakeElement(id){
  const listeners = {};
  return {
    id, hidden: false, innerHTML: '', textContent: '', className: '', style: {}, dataset: {}, checked: false, disabled: false,
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    listeners,
    addEventListener(type, fn){ (listeners[type] = listeners[type] || []).push(fn); },
    removeEventListener(){},
    querySelectorAll(){ return []; },
    querySelector(){ return null; },
    appendChild(c){ return c; },
    scrollIntoView(){}, focus(){}, blur(){},
    setAttribute(){}, getAttribute(){ return null; }, hasAttribute(){ return false; },
    closest(){ return null; }, contains(){ return false; }
  };
}

function fakeDocument(){
  const byId = new Map();
  const doc = fakeElement('document');
  doc.body = fakeElement('body');
  doc.getElementById = id => { if(!byId.has(id)) byId.set(id, fakeElement(id)); return byId.get(id); };
  doc.createElement = () => fakeElement();
  return doc;
}

// localStorage whose own enumerable keys are the stored keys (shared.js uses Object.keys on it).
function makeStorage(){
  const s = {};
  Object.defineProperties(s, {
    getItem: { value: k => Object.prototype.hasOwnProperty.call(s, k) ? s[k] : null },
    setItem: { value: (k, v) => { s[k] = String(v); } },
    removeItem: { value: k => { delete s[k]; } },
    clear: { value: () => Object.keys(s).forEach(k => delete s[k]) },
    key: { value: i => Object.keys(s)[i] || null },
    length: { get: () => Object.keys(s).length }
  });
  return s;
}

// Desk questions: past daily puzzles (difficulty 1–5) and Learn questions (difficulty 1), answered
// right with probability `hit`. ltd/desk.js needs the real puzzle bank and a page to play in, so this
// stands in for it with the same shape.
function fakeDesk(rng, hit){
  const pool = new Map();
  for(let d = 1; d <= 5; d++) for(let i = 0; i < 8; i++) pool.set('daily-' + d + '-' + i, { id: 'daily-' + d + '-' + i, difficulty: d });
  for(let i = 0; i < 120; i++) pool.set('learn-' + i, { id: 'learn-' + i, difficulty: 1 });
  pool.forEach(q => { q.lang = 'python'; });
  return {
    load: () => Promise.resolve(),
    all: () => pool,
    play(box, qs, { answered, onAnswer, onDone }){
      const results = answered.slice();
      while(results.length < qs.length){ const right = rng() < hit; results.push(right); onAnswer(right); }
      onDone(results);
    }
  };
}

// ---------------------------------------------------------------------------
// Opening the page
// ---------------------------------------------------------------------------

async function openPage(world){
  const document = fakeDocument();
  let tick = null;
  const sandbox = {
    document, localStorage: world.storage, console,
    Date: world.Date,
    Math: Object.assign(Object.create(Math), { random: world.rng }),
    setInterval: fn => { tick = fn; return 1; },
    clearInterval: () => { tick = null; },
    setTimeout: () => 0, clearTimeout(){},
    confirm: () => true, alert(){},
    location: { reload(){}, search: '', href: '' },
    navigator: { userAgent: 'sim' },
    DEBUGG_DEMO_NOTICE: false
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  SHARED.runInContext(sandbox);
  if(world.full) sandbox.Debugg.DEMO = false;
  sandbox.DebuggDesk = world.desk;
  LTD.runInContext(sandbox);
  const slots = { stats: fakeElement('stats'), studio: fakeElement('studio'), board: fakeElement('board'), desk: fakeElement('desk') };
  sandbox.DebuggLtd.start(slots);
  await null; await null;   // let the desk's pool load (a resolved promise)
  if(tick) tick();

  const fire = (el, type, dataset, extra) => (el.listeners[type] || []).forEach(fn => fn(Object.assign({
    target: Object.assign({ dataset, disabled: false, checked: false, hasAttribute: () => false,
                            closest: () => ({ dataset, disabled: false }) }, extra || {}),
    preventDefault(){}
  })));
  return {
    tick: () => { if(tick) tick(); },
    state: () => JSON.parse(world.storage.getItem('debugg-ltd')),
    click: dataset => fire(slots.studio, 'click', dataset),
    desk: dataset => fire(slots.desk, 'click', dataset),
    picker: dataset => fire(document.getElementById('teamModal'), 'click', dataset),
    // Ticks someone in the team picker.
    pick: id => fire(document.getElementById('teamModal'), 'change', { pick: id }, { checked: true }),
    close: () => sandbox.DebuggLtd.stop()
  };
}

// ---------------------------------------------------------------------------
// The player
// ---------------------------------------------------------------------------

// Numbers the strategy needs, mirrored from ltd/ltd.js (the game still enforces its own rules:
// a click the game refuses does nothing).
const PREMISES = { 'spare-room': { desks: 4, rent: 0 }, 'unit-s': { desks: 10, rent: 4 } }, DIRECTOR_SPAN = 4, MANAGER_SPAN = 12;
const premisesOf = s => PREMISES[(s.office && s.office.premises) || 'spare-room'] || PREMISES['spare-room'];
// The strategy rents; buying (¤60,000, then ¤1/min upkeep) isn't modelled yet.
const DEV_ROLES = ['Graduate', 'Junior', 'Senior', 'Principal'];
const SALARY = { Manager: 8, Graduate: 2, Junior: 5, Senior: 12, Principal: 28 };
const COST = { Manager: 900, Graduate: 180 };   // hire costs; a job-board posting is a tenth of one
const skillLevel = xp => { const t = [10, 50, 150, 400, 1000]; let lv = 0;
  while((xp || 0) >= (lv < 5 ? t[lv] : 1000 + 400 * (lv - 4) * (lv - 3))) lv++; return lv; };

function payroll(s){ return s.roster.reduce((n, p) => n + (SALARY[p.role] || 0) + (p.raise || 0), 0) + (s.office && s.office.owned ? 1 : premisesOf(s).rent); }
function priceOf(s, role){ return Math.round(COST[role] * ((s.market && s.market.prices[role]) || 1) / 5) * 5; }
function devs(s){ return s.roster.filter(p => DEV_ROLES.includes(p.role)); }
// Headcount as the game counts it: the intern isn't in it.
function heads(s){ return s.roster.filter(p => p.role !== 'Intern').length; }

// One look at the company: what a sensible player does on a check-in, in order. Cash is kept
// above a reserve of half an hour's payroll, so the company never spends itself into debt.
// Returns what it spent (hires, raises), so income can be told apart from spending.
function play(page, log, now, opts){
  let s = page.state(), spent = 0;
  const reserve = () => payroll(s) * 30 + 50;
  const spendable = () => s.money - reserve();
  const act = (fn, dataset) => { const before = s.money; fn(dataset); s = page.state(); spent += Math.max(0, before - s.money); };

  // Desk jobs.
  for(const j of s.desk.jobs.slice()) act(page.desk, { action: 'desk-start', job: j.id });
  // Anyone who's handed in their notice: agree the rise.
  for(const p of s.roster.filter(p => p.notice)) act(page.click, { action: 'keep', id: p.id });
  // Failed contracts waiting for a decision: retry.
  for(const j of s.jobs.filter(j => j.status === 'failed')) act(page.click, { action: 'retry-job', job: j.id });
  // Promotions (the game checks readiness).
  if(now - (opts.lastPromoteTry || 0) >= 30 * MIN){
    opts.lastPromoteTry = now;
    for(const p of devs(s).filter(p => p.role !== 'Principal')){
      const before = p.role;
      act(page.click, { action: 'promote', id: p.id });
      const after = (s.roster.find(x => x.id === p.id) || {}).role;
      if(after && after !== before) log('promoted/' + after.toLowerCase());
    }
  }

  // Hiring. Room for one more on-site person, moving from the spare room into the small business
  // unit when it's full (and staying there). Returns 'free' or null (no room).
  const deskFor = () => {
    const used = s.roster.filter(p => p.role !== 'Intern' && !p.wfh).length;   // the Director takes a desk too
    if(used < premisesOf(s).desks) return 'free';
    if(premisesOf(s) !== PREMISES['spare-room']) return null;
    act(page.click, { action: 'move', premises: 'unit-s', tenure: 'rent' });
    if(premisesOf(s) === PREMISES['spare-room']) return null;
    log('moved/unit-s');
    return 'free';
  };
  // `wfh`: a work-from-home hire needs no desk.
  const hire = (role, dataset, cost, wfh) => {
    if(spendable() < cost) return false;
    const desk = wfh ? 'free' : deskFor();
    if(!desk) return false;
    const n = s.roster.length;
    act(page.click, dataset);
    if(s.roster.length > n){ log('hired/' + role.toLowerCase()); return true; }
    return false;
  };
  // Applicants first: they're the only way to hire above graduate (hired at a desk).
  for(const a of (s.applicants || []).slice().sort((x, y) => DEV_ROLES.indexOf(y.role) - DEV_ROLES.indexOf(x.role)))
    hire(a.role, { action: 'hire-applicant', id: a.id }, a.cost);
  // The job board: whoever has replied is hired (managers, and in a full spare room people who work
  // from home); a job is posted when none is out, and its candidate comes at a later check-in.
  const spare = () => premisesOf(s) === PREMISES['spare-room'];
  for(const c of (s.candidates || []).slice()) hire(c.role, { action: 'hire-candidate', id: c.id }, c.cost, c.wfh && spare());
  const post = (role, wfh) => {
    if((s.postings || []).some(p => p.role === role && !!p.wfh === !!wfh) || (s.candidates || []).some(c => c.role === role && !!c.wfh === !!wfh)) return;
    const fee = Math.max(5, Math.round(priceOf(s, role) * 0.1 / 5) * 5);
    if(spendable() < fee) return;
    act(page.click, wfh ? { action: 'post-job', role, wfh: '1' } : { action: 'post-job', role });
    log('posted/' + role.toLowerCase() + (wfh ? '/wfh' : ''));
  };
  // A full spare room: more people can only come from home (graduates, the cheap way).
  if(spare() && s.roster.filter(p => p.role !== 'Intern' && !p.wfh).length >= premisesOf(s).desks && (s.reputation || 0) >= 5) post('Graduate', true);
  // A manager when the developers are at the Director's and managers' span. Managers need an office,
  // so the player rents the unit first.
  const managers = s.roster.filter(p => p.role === 'Manager').length;
  if(devs(s).length >= DIRECTOR_SPAN + MANAGER_SPAN * managers && spendable() >= priceOf(s, 'Manager')){
    if(spare()){ act(page.click, { action: 'move', premises: 'unit-s', tenure: 'rent' }); if(!spare()) log('moved/unit-s'); }
    if(!spare()) post('Manager', false);
  }

  // The intern: a free Python hotfix with the Director alongside whenever they're idle, helped with
  // a puzzle (answered right at the desk's hit rate) when they're stuck.
  const intern = s.roster.find(p => p.role === 'Intern');
  // Stuck: the intern's hotfix (stalled), or a start-up team's contract (at half speed).
  for(const j of s.jobs.filter(j => j.status === 'stuck' || j.slow)) act(page.click, { action: 'intern-help', job: j.id });
  if(intern && !s.jobs.some(j => j.team.includes(intern.id))){
    const offer = s.board.find(o => o.tier === 0 && o.lang === 'Python' && (o.risk || 'standard') === 'standard' && !o.expert);
    if(offer){
      const n = s.jobs.length;
      act(page.click, { action: 'staff', offer: offer.id });
      act(page.pick, intern.id);
      act(page.pick, 'director');
      act(page.picker, { action: 'pick-start' });
      if(s.jobs.length === n) act(page.picker, { action: 'pick-cancel' });
    }
  }
  // Staffing: in a start-up the player puts idle developers on features as they turn up (first
  // client first; no repeats before managers, so each one is a fresh decision). From a small
  // business on, the managers do it every tick. Idle developers do everyday work meanwhile.
  if(!s.roster.some(p => p.role === 'Manager')){
    for(let k = 0; k < 10; k++){
      const busy = new Set(s.jobs.flatMap(j => j.team));
      const idle = devs(s).filter(p => !busy.has(p.id));
      const offer = s.board.filter(o => TIER_KEYS[o.tier] === 'feature' && (o.risk || 'standard') !== 'high' &&
                                        idle.some(d => skillLevel(d.lang[o.lang]) > 0 && skillLevel(d.lang[o.lang]) >= (o.expert || 0)))
        .sort((a, b) => (b.first ? 1 : 0) - (a.first ? 1 : 0) || (a.expert || 0) - (b.expert || 0))[0];
      if(!offer) break;
      const n = s.jobs.length;
      act(page.click, { action: 'staff', offer: offer.id });
      act(page.picker, { action: 'pick-suggest' });
      act(page.picker, { action: 'pick-start' });
      if(s.jobs.length === n){ act(page.picker, { action: 'pick-cancel' }); break; }
    }
  }
  return spent;
}

// ---------------------------------------------------------------------------
// Check-in schedules
// ---------------------------------------------------------------------------

const PROFILES = {
  // Every 2–4 hours from 7am to 11pm, 5–10 minutes each.
  keen: rng => from => {
    const t = from + (2 + 2 * rng()) * HOUR, h = new Date(t).getUTCHours();
    const start = h >= 7 && h < 23 ? t : nextHour(t, 7) + rng() * 30 * MIN;
    return { start, length: (5 + 5 * rng()) * MIN };
  },
  // About 8am and 8pm, 10 minutes each.
  casual: rng => from => {
    const h = new Date(from).getUTCHours();
    const start = nextHour(from + HOUR, h < 20 && h >= 8 ? 20 : 8) + (rng() - 0.5) * HOUR;
    return { start, length: 10 * MIN };
  },
  // The page never closes.
  always: () => from => ({ start: from, length: Infinity })
};
function nextHour(t, hour){
  const d = new Date(t);
  const at = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour);
  return at > t ? at : at + DAY;
}

// ---------------------------------------------------------------------------
// One run
// ---------------------------------------------------------------------------

const MILESTONES = [
  ['hired/graduate', 'First grad hired'],
  ['devs/3', 'Spare room full: contracts open'],
  ['job/feature', 'First contract (your first client)'],
  ['devs/4', "Director's span full: 4 devs"],
  ['hired/junior', 'First junior hired (applicant)'],
  ['stage/small', 'First manager: Small business'],
  ['promoted/junior', 'First home-grown junior'],
  ['heads/11', 'More than 10 staff: patches open'],
  ['job/patch', 'First patch'],
  ['applicant/senior', 'First senior applicant'],
  ['hired/senior', 'First senior hired'],
  ['promoted/senior', 'First home-grown senior'],
  ['stage/midsize', 'Mid-size: 3 managers, 25 staff'],
  ['applicant/principal', 'First principal applicant'],
  ['hired/principal', 'First principal hired'],
  ['job/minor', 'First minor release'],
  ['promoted/principal', 'First home-grown principal'],
  ['stage/large', 'Large: 6 managers, 60 staff'],
  ['job/major', 'First major release'],
  ['stage/multinational', 'Multinational: 12 managers, 150 staff']
];
const STAGE_KEYS = ['startup', 'small', 'midsize', 'large', 'multinational'];
const TIER_KEYS = ['hotfix', 'feature', 'patch', 'minor', 'major'];

async function run(opts, seed){
  loadLtd(opts.ltd ? path.resolve(opts.ltd) : path.join(ROOT, 'ltd/ltd.js'));
  const rng = mulberry32(seed * 7919 + 1);
  const playerRng = mulberry32(seed * 104729 + 3);
  const clock = { now: START };
  const world = { storage: makeStorage(), rng, Date: fakeDate(clock), full: opts.full, desk: fakeDesk(playerRng, opts.hit) };
  world.storage.setItem('debugg-version', 'demo');
  world.storage.setItem('debugg-epoch', String(DAY1));
  if(opts.xp) world.storage.setItem('debugg-xp', JSON.stringify({ python: opts.xp }));

  const events = {};
  const log = key => { if(!(key in events)) events[key] = { at: clock.now - START, active: activeMs }; };
  let activeMs = 0;   // game time that counted: page open, plus caught-up time away (≤ 4h each)
  const days = [];
  let spent = 0;      // on hires, desks and raises, so income can be told from spending
  const end = START + opts.days * DAY;
  const schedule = PROFILES[opts.profile](playerRng);
  const note = s => {
    if(devs(s).length >= 3) log('devs/3');
    if(devs(s).length >= 4) log('devs/4');
    if(heads(s) > 10) log('heads/11');
    if(s.stage && s.stage !== 'startup') STAGE_KEYS.slice(1, STAGE_KEYS.indexOf(s.stage) + 1).forEach(k => log('stage/' + k));
    (s.applicants || []).forEach(a => log('applicant/' + a.role.toLowerCase()));
    s.jobs.forEach(j => log('job/' + TIER_KEYS[j.tier]));
  };
  const sample = s => {
    const day = Math.floor((clock.now - DAY1) / DAY) + 1;   // calendar days, as in the milestone times
    const counts = {};
    s.roster.forEach(p => { counts[p.role] = (counts[p.role] || 0) + 1; });
    days[day] = { day, money: s.money, rep: s.reputation, heads: heads(s), counts,
                  stage: s.stage || 'startup', payroll: payroll(s), spent, active: activeMs };
  };

  let next = { start: START, length: PROFILES[opts.profile] === PROFILES.always ? Infinity : 10 * MIN };
  let lastClose = null;
  while(next.start < end){
    if(lastClose !== null) activeMs += Math.min(4 * HOUR, next.start - lastClose);
    clock.now = next.start;
    const page = await openPage(world);
    const closeAt = Math.min(end, next.start + next.length);
    for(;;){
      note(page.state());   // before the player acts, so an applicant hired on sight still counts
      spent += play(page, log, clock.now, opts);
      const s1 = page.state();
      note(s1);
      sample(s1);
      const step = opts.step * MIN;
      if(clock.now + step > closeAt) break;
      clock.now += step;
      activeMs += step;
      page.tick();
    }
    page.close();
    lastClose = clock.now;
    next = schedule(clock.now);
  }
  return { seed, events, days: days.filter(d => d && d.day <= opts.days) };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

// "day 3 20:15" (day 1 is the founding day).
function fmtWhen(ms){
  if(ms == null) return '—';
  const t = new Date(START + ms), day = Math.floor((START + ms - DAY1) / DAY) + 1;
  return 'day ' + day + ' ' + String(t.getUTCHours()).padStart(2, '0') + ':' + String(t.getUTCMinutes()).padStart(2, '0');
}
function fmtHours(ms){ return ms == null ? '—' : ms < 10 * HOUR ? (ms / HOUR).toFixed(1) + 'h' : Math.round(ms / HOUR) + 'h'; }
function median(xs){ const v = xs.filter(x => x != null).sort((a, b) => a - b); return v.length ? v[Math.floor((v.length - 1) / 2)] : null; }
function money(n){ return (n < 0 ? '−' : '') + '¤' + Math.round(Math.abs(n)).toLocaleString('en-GB'); }

function report(opts, runs){
  const lines = [];
  const n = runs.length;
  lines.push('Debuggit Ltd pacing · ' + opts.profile + ' · ' + (opts.full ? 'full game' : 'demo') + ' · ' + opts.days + ' days · ' +
             n + ' seed' + (n > 1 ? 's' : '') + (opts.ltd ? ' · ' + opts.ltd : '') + ' · desk hit rate ' + Math.round(opts.hit * 100) + '%' + (opts.xp ? ' · ' + opts.xp + ' puzzle XP' : ''));
  lines.push('Real time is from founding (day 1, 9am). Game time is time that counted: the page open, plus up to 4h caught up each time away.');
  lines.push('');
  lines.push(pad('Milestone', 40) + pad('Real time (median)', 20) + pad('Game time', 11) + 'Reached');
  MILESTONES.forEach(([key, label]) => {
    const hits = runs.map(r => r.events[key]).filter(Boolean);
    lines.push(pad(label, 40) + pad(fmtWhen(median(hits.map(e => e.at))), 20) + pad(fmtHours(median(hits.map(e => e.active))), 11) + hits.length + '/' + n);
  });
  lines.push('');
  lines.push('End of each day (median across seeds; income = cash change + what was spent, per real hour of that day):');
  lines.push(pad('Day', 5) + pad('Cash', 12) + pad('Income/h', 11) + pad('Payroll/h', 11) + pad('Rep', 8) + pad('Staff', 7) + pad('G/J/S/P/M', 16) + pad('Stage', 10) + 'Game h');
  const maxDay = Math.max(...runs.map(r => r.days.length));
  for(let i = 0; i < maxDay; i++){
    const rows = runs.map(r => r.days[i]).filter(Boolean);
    if(!rows.length) continue;
    const prev = runs.map(r => r.days[i - 1]);
    const income = rows.map((d, k) => {
      const p = prev[k] || { money: 0, spent: 0 };
      return ((d.money - p.money) + (d.spent - p.spent)) / (d.day === 1 ? 15 : 24);   // day 1 starts at 9am
    });
    const c = role => median(rows.map(d => d.counts[role] || 0));
    lines.push(pad(String(rows[0].day), 5) + pad(money(median(rows.map(d => d.money))), 12) + pad(money(median(income)), 11) +
               pad(money(median(rows.map(d => d.payroll)) * 60), 11) + pad(String(Math.round(median(rows.map(d => d.rep)))), 8) +
               pad(String(median(rows.map(d => d.heads))), 7) +
               pad([c('Graduate'), c('Junior'), c('Senior'), c('Principal'), c('Manager')].join('/'), 16) +
               pad(mode(rows.map(d => d.stage)), 10) + fmtHours(median(rows.map(d => d.active))));
  }
  return lines.join('\n');
}
function pad(s, n){ return (s + ' '.repeat(n)).slice(0, Math.max(n, s.length + 1)); }
function mode(xs){ const c = {}; xs.forEach(x => { c[x] = (c[x] || 0) + 1; }); return Object.keys(c).sort((a, b) => c[b] - c[a])[0]; }

async function main(){
  const opts = parseArgs(process.argv.slice(2));
  const runs = [];
  for(let k = 0; k < opts.seeds; k++) runs.push(await run(opts, opts.seed + k));
  if(opts.json) console.log(JSON.stringify({ opts, runs }, null, 2));
  else console.log(report(opts, runs));
}

if(require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { run, report, parseArgs, openPage, play, fakeDate, fakeDesk, makeStorage };
