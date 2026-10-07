// Debuggit Ltd: the office view (roadmap item 21b, ideas/ltd-office-view-plan.md).
//
// Draws the studio's premises as a building on a canvas, one floor per storey. The spare room is a
// house with one floor: the front door, the interview room, 4 desks (the Director takes the first,
// with the intern on a crate beside them), stools when it's cramped, and the kitchen. A small
// business unit is a clad unit with stairs and two floors of 5 desks: the interview room on the
// ground floor, a server room above it, and a meeting room and a kitchen on every floor. Everyone is
// a person; the Director looks the way the player chose when founding the company (LOOKS). The
// drawing is ported from the prototype, ideas/ltd-office-demo.html.
//
// Breaks are only a picture (the player-owner's call): who is on one comes from a hash of their
// id and the game time, so the same people are on a break after a reload, and nobody's work slows.
//
// It holds no game rules: ltd/ltd.js mounts it with a read-only api,
//   DebuggOffice.mount(box, { snapshot(), onTap(kind, id) })
// and it draws whatever snapshot() says, every animation frame. All it keeps of its own is where
// each person is standing and which desk they sit at, for as long as the page is open.
// ltd.js runs without it (tools/sim-ltd.js never loads it).
window.DebuggOffice = (function(){
  'use strict';

  // Layout in unscaled units; everything is multiplied by s. Left to right on a floor: the way in
  // (door or stairs), the side room (interviews, or a server room upstairs), the first desk and the
  // space beside it (the intern's crate), the other desks, any stools, the meeting room (not in the
  // spare room), the kitchen.
  const U = { margin: 18, side: 62, room: 124, pair: 58, desk: 88, stool: 50, meeting: 116, kitchen: 152, floor: 132, slab: 14, ground: 36,
              roof: { house: 96, unit: 64 } };
  // Breaks: in BREAK_ODDS of each BREAK_WINDOW of game time, a person takes a BREAK_MS break
  // (about 12% of the time).
  const BREAK_WINDOW = 10 * 60000, BREAK_MS = 3 * 60000, BREAK_ODDS = 0.4;
  const ROLE_COLOR = {
    Director: '#9a6a43', Intern: '#5cc8c8', Graduate: '#4fd18b', Junior: '#5aa9e6',
    Senior: '#a57be0', Principal: '#f2b84b', Manager: '#8a93a3'
  };
  // Code colours on a monitor, by contract language.
  const LANG_COLS = {
    Python: ['#5aa9e6', '#f2d04b', '#e8e9ec', '#7ee787'],
    JavaScript: ['#f2d04b', '#c9a0f0', '#e8e9ec', '#7eb6f0'],
    'C/C++': ['#82aaff', '#c792ea', '#e8e9ec', '#ef6a6a'],
    Rust: ['#f08d49', '#e8e9ec', '#c9a0f0', '#f2d04b']
  };
  const DIRECTOR_COLS = ['#f2b84b', '#e8e9ec', '#4fd18b'];
  // What a person can look like. The Director's look is chosen when founding the company
  // (ltd/founding.js); everyone else's comes from a hash of their id.
  const LOOKS = {
    skin: [['#f5d5bc', 'Very light'], ['#f1c9a5', 'Light'], ['#e0ac85', 'Light brown'], ['#c68863', 'Medium'], ['#9a6748', 'Brown'], ['#704a33', 'Dark brown'], ['#4a2f20', 'Very dark']],
    hair: [['#1a1a1a', 'Black'], ['#2b1d16', 'Dark brown'], ['#4a3020', 'Brown'], ['#7a4f2a', 'Light brown'], ['#c49a5a', 'Blond'], ['#8b3a2a', 'Red'], ['#d9d4cc', 'Grey'], ['#6f5bd6', 'Purple']],
    hairStyle: ['Short', 'Long', 'Bun', 'Bald', 'Curly'],
    beard: ['None', 'Stubble', 'Moustache', 'Beard'],
    glasses: ['None', 'Round', 'Square'],
    shirt: [['#9a6a43', 'Brown'], ['#2f6f9f', 'Blue'], ['#3f9b5b', 'Green'], ['#c0392b', 'Red'], ['#7d4fb3', 'Purple'], ['#e0a12c', 'Mustard'], ['#3a3d46', 'Charcoal'], ['#e8e2d6', 'White']]
  };
  const DEFAULT_LOOK = { skin: '#e0ac85', hair: '#2b1d16', hairStyle: 0, beard: 0, glasses: 0, shirt: '#9a6a43' };
  const SKIN = LOOKS.skin.map(x => x[0]).slice(0, 6);
  const HAIR = ['#2b1d16', '#4a3020', '#7a4f2a', '#c49a5a', '#1a1a1a', '#8b3a2a', '#d9d4cc'];
  const ON_CONTRACT = ['working', 'stuck', 'failed'];

  let box = null, api = null, canvas = null, ctx = null;
  let raf = 0, lastT = 0, th = null, reduceMotion = false;
  let sprites = new Map();   // id → where that person (or applicant) is and is heading
  let desks = new Map();     // staff id → desk index (stools after the desks)
  let placed = false;        // after the first frame, newcomers walk in rather than appear
  let targets = [];          // what a tap can hit, rebuilt every frame
  let lastLabel = '';
  let breaks = new Set();    // ids on a break this frame
  let lastKind = null;       // the premises last drawn, to notice moving day
  let movingUntil = 0;       // the moving-day banner shows until then

  const now = () => performance.now() / 1000;
  const hashRnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  function hashStr(s){ let h = 7; for(let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h; }

  // ---------------------------------------------------------------------------
  // Mounting
  // ---------------------------------------------------------------------------

  function mount(el, theApi){
    unmount();
    box = el;
    api = theApi;
    canvas = document.createElement('canvas');
    canvas.className = 'office-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'The office');
    box.appendChild(canvas);
    ctx = canvas.getContext('2d');
    reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    th = readTheme();
    placed = false;
    lastLabel = '';
    lastKind = null;
    movingUntil = 0;
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onHover);
    document.addEventListener('visibilitychange', wake);
    wake();
  }

  function unmount(){
    if(raf) cancelAnimationFrame(raf);
    raf = 0;
    document.removeEventListener('visibilitychange', wake);
    if(canvas) canvas.remove();
    box = api = canvas = ctx = null;
    sprites = new Map();
    desks = new Map();
    targets = [];
  }

  // Draws nothing while the tab is hidden; picks up again when it's shown.
  function wake(){
    if(!box || raf || document.hidden) return;
    lastT = now();
    raf = requestAnimationFrame(frame);
  }

  function readTheme(){
    const cs = getComputedStyle(canvas);
    const v = (n, d) => cs.getPropertyValue(n).trim() || d;
    return {
      text: v('--text', '#e8e9ec'), dim: v('--text-dim', '#9498a3'), faint: v('--text-faint', '#5f6470'),
      panel: v('--panel', '#1b1d22'), line: v('--line', '#2c2f37'), amber: v('--amber', '#f2b84b'),
      skyTop: v('--office-sky-top', '#1c2540'), skyBottom: v('--office-sky-bottom', '#33456b'),
      ground: v('--office-ground', '#24302a'), street: v('--office-street', '#2a2d33'), wallTop: v('--office-wall-top', '#24262c'),
      wallBottom: v('--office-wall-bottom', '#2b2e35'), slab: v('--office-slab', '#3a3d46'),
      slabText: v('--office-slab-text', '#c9ccd4'), brick: v('--office-brick', '#6b4436'), cladding: v('--office-cladding', '#4a5566'),
      roof: v('--office-roof', '#2c2f37')
    };
  }

  // ---------------------------------------------------------------------------
  // The frame
  // ---------------------------------------------------------------------------

  function frame(){
    raf = 0;
    if(!box || document.hidden) return;
    const t = now();
    const dt = Math.min(0.05, t - lastT);
    lastT = t;
    const viewW = box.clientWidth;
    if(viewW > 0){
      const snap = api.snapshot();
      const L = layout(viewW, snap);
      fit(L);
      sync(snap, L, t);
      steer(L, dt);
      drawSky(L, t);
      drawShell(L, t);
      targets = [];
      L.floors.forEach(f => drawFloor(L, f, snap, t));
      drawBubbles(L, snap);
      if(t < movingUntil) banner(L, 'Moving day · ' + L.name.charAt(0).toUpperCase() + L.name.slice(1));
      updateLabel(snap, L);
    }
    raf = requestAnimationFrame(frame);
  }

  function layout(viewW, snap){
    const pr = snap.premises;
    const house = pr.kind === 'spare-room';
    const pf = pr.perFloor, nf = pr.floors, stools = pr.squeezed;
    const meetW = house ? 0 : U.meeting;
    const need = U.margin * 2 + U.side + U.room + U.pair + pf * U.desk + stools * U.stool + meetW + U.kitchen + 20;
    const s = Math.max(0.56, Math.min(1.1, viewW / need));
    const W = Math.max(viewW, Math.ceil(need * s));
    const roof = house ? U.roof.house : U.roof.unit;
    const H = Math.round((roof + U.ground + nf * U.floor) * s);
    const x0 = U.margin * s, x1 = W - U.margin * s;
    const kx0 = x1 - U.kitchen * s;
    const mx0 = kx0 - meetW * s;
    const rx0 = x0 + U.side * s + 6 * s;
    const rx1 = rx0 + U.room * s;
    const dz0 = rx1 + 6 * s;
    const stoolW = U.stool * s, pairW = U.pair * s;
    const slotW = (mx0 - 12 * s - stools * stoolW - pairW - dz0) / Math.max(1, pf);
    const floors = [];
    for(let i = 0; i < nf; i++){
      const top = H - (U.ground + (i + 1) * U.floor) * s;
      floors.push({
        i, top, floorY: top + (U.floor - U.slab) * s, kx0, mx0, rx0, rx1, dz0, slotW, sideX: x0 + (U.side * s) / 2,
        pairX: dz0 + slotW,     // the space after the first desk
        deskX: j => dz0 + slotW * (j + 0.5) + (j > 0 ? pairW : 0),
        stoolX: k => dz0 + slotW * pf + pairW + stoolW * (k + 0.5)
      });
    }
    return { s, W, H, x0, x1, floors, house, pf, desksN: nf * pf, stools, seats: pr.maxApplicants, kind: pr.kind, name: pr.name, owned: !!pr.owned,
             company: snap.company || 'Debuggit Ltd' };
  }

  function fit(L){
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = L.W + 'px';
    canvas.style.height = L.H + 'px';
    const w = Math.round(L.W * dpr), h = Math.round(L.H * dpr);
    if(canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------------------------------------------------------------------------
  // Who goes where
  // ---------------------------------------------------------------------------

  // The game has no desk numbers, so the view gives them out: everyone keeps theirs while the
  // page is open, and a newcomer gets the lowest free one (desks first, then the stools).
  function assignDesks(staff, slots){
    const ids = new Set(staff.map(p => p.id));
    desks.forEach((d, id) => { if(!ids.has(id) || d >= slots) desks.delete(id); });
    const taken = new Set(desks.values());
    staff.forEach(p => {
      if(desks.has(p.id)) return;
      let d = 0;
      while(taken.has(d)) d++;
      desks.set(p.id, d);
      taken.add(d);
    });
  }

  function spriteFor(id, role, name, L){
    let sp = sprites.get(id);
    if(!sp){
      const h = hashStr(id);
      sp = { id, seed: h % 97, skin: SKIN[h % SKIN.length], hair: HAIR[(h >> 3) % HAIR.length], hairStyle: (h >> 5) % 3,
             x: L.floors[0].sideX, fi: 0, tfi: 0, home: 0, alpha: 0, facing: 1, walking: false, tx: 0, spot: 'desk', gone: false };
      sprites.set(id, sp);
    }
    sp.role = role;
    sp.name = name;
    return sp;
  }

  // Where everyone should be: a floor (tfi) and a spot on it (tx).
  function sync(snap, L, t){
    const s = L.s;
    // Moving day: a new building, so everyone starts again at their new place.
    if(lastKind && lastKind !== L.kind){
      sprites = new Map();
      desks = new Map();
      placed = false;
      movingUntil = t + 2.6;
    }
    lastKind = L.kind;
    // Everyone but the intern has a desk, the Director the first one.
    const staff = snap.people.filter(p => p.role !== 'Intern').sort((a, b) => (b.role === 'Director') - (a.role === 'Director'));
    assignDesks(staff, L.desksN + L.stools);
    breaks = new Set(snap.people.filter(p => onBreak(p, snap.now)).map(p => p.id));
    const director = snap.people.find(p => p.role === 'Director');
    const dDesk = director ? desks.get(director.id) : 0;
    const dFloor = L.floors[dDesk < L.desksN ? Math.floor(dDesk / L.pf) : 0];
    const seen = new Set();
    const inBreakRoom = new Map(), inMeeting = new Map();
    const next = (m, i) => { const k = m.get(i) || 0; m.set(i, k + 1); return k; };
    snap.people.forEach(p => {
      const sp = spriteFor(p.id, p.role, p.name, L);
      seen.add(p.id);
      sp.p = p;
      sp.applicant = false;
      sp.look = lookFor(sp, p);
      sp.gone = p.state === 'away';
      let f;
      if(p.role === 'Intern'){ f = dFloor; sp.spot = 'stool'; sp.tx = f.pairX + 40 * s; sp.desk = null; }
      else{
        const d = desks.get(p.id);
        sp.desk = d;
        if(d < L.desksN){ f = L.floors[Math.floor(d / L.pf)]; sp.spot = 'desk'; sp.tx = f.deskX(d % L.pf) + 20 * s; }
        else{ f = L.floors[0]; sp.spot = 'stool'; sp.tx = f.stoolX(d - L.desksN) + 10 * s; }
      }
      sp.home = f.i;
      sp.tfi = f.i;
      sp.onBreak = breaks.has(p.id);
      if(sp.gone){ sp.spot = 'exit'; sp.tfi = 0; sp.tx = L.floors[0].sideX; }
      else if(sp.onBreak){
        // Their own floor's break room: the couch first, then the coffee machine, then standing.
        const k = next(inBreakRoom, f.i);
        if(k < 3){ sp.spot = 'couch'; sp.tx = f.kx0 + (82 + k * 26) * s; }
        else if(k < 5){ sp.spot = 'coffee'; sp.tx = f.kx0 + (30 + (k - 3) * 22) * s; }
        else{ sp.spot = 'stand'; sp.tx = f.kx0 + (60 + ((k - 5) % 4) * 13) * s; }
      }else if(!L.house && p.role === 'Manager' && p.state === 'working'){
        // Managers write no code: on a contract, they're in their floor's meeting room. The spare
        // room has none, so there they stay at their desk.
        const k = next(inMeeting, f.i);
        sp.spot = 'meeting'; sp.tx = f.mx0 + (26 + (k % 4) * 22) * s;
      }
    });
    snap.applicants.forEach((a, k) => {
      const sp = spriteFor(a.id, a.role, a.name, L);
      seen.add(a.id);
      sp.p = null;
      sp.applicant = true;
      sp.look = lookFor(sp, null);
      sp.onBreak = false;
      sp.gone = false;
      sp.desk = null;
      sp.spot = 'chair';
      sp.home = sp.tfi = 0;
      sp.tx = L.floors[0].rx0 + (22 + k * 27) * s;
    });
    // Anyone no longer in the snapshot (left, or an applicant who gave up) walks out.
    sprites.forEach(sp => {
      if(seen.has(sp.id)) return;
      sp.gone = true; sp.leaving = true; sp.spot = 'exit'; sp.tfi = 0; sp.tx = L.floors[0].sideX;
    });
    if(!placed){
      sprites.forEach(sp => { sp.fi = sp.tfi; sp.x = sp.tx; sp.alpha = sp.gone ? 0 : 1; });
      placed = true;
    }
  }

  // Walks everyone towards their spot. Going to another floor means the stairs (or the door) first.
  function steer(L, dt){
    const speed = reduceMotion ? 1e6 : Math.max(120 * L.s, (L.x1 - L.x0) / 5);
    sprites.forEach(sp => {
      const f = L.floors[sp.fi] || L.floors[0];
      const changing = sp.fi !== sp.tfi;
      const goal = changing ? f.sideX : sp.tx;
      const dx = goal - sp.x;
      if(Math.abs(dx) > 1.5){ sp.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt); sp.facing = Math.sign(dx); }
      else if(changing){ sp.fi = sp.tfi; sp.x = (L.floors[sp.fi] || f).sideX; }
      sp.walking = sp.fi !== sp.tfi || Math.abs(sp.tx - sp.x) > 1.5;
      if(!sp.walking) sp.facing = sp.spot === 'chair' || sp.spot === 'meeting' ? 1 : sp.spot === 'couch' ? (sp.seed % 2 ? -1 : 1) : -1;
      const out = sp.gone && !sp.walking;
      sp.alpha += ((out ? 0 : 1) - sp.alpha) * (reduceMotion ? 1 : Math.min(1, dt * (out ? 2 : 3)));
      if(out && sp.alpha < 0.03){
        if(sp.leaving) sprites.delete(sp.id);
        else sp.alpha = 0;
      }
    });
  }
  // ---------------------------------------------------------------------------
  // Drawing helpers
  // ---------------------------------------------------------------------------

  function rrect(x, y, w, h, r){
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function ell(x, y, rx, ry){ ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, Math.PI * 2); }
  function tint(hex, a){ const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function font(w, px, mono){ ctx.font = w + ' ' + px + 'px ' + (mono ? "'JetBrains Mono', ui-monospace, monospace" : 'Sora, system-ui, sans-serif'); }

  // ---------------------------------------------------------------------------
  // The building
  // ---------------------------------------------------------------------------

  function drawSky(L, t){
    const g = ctx.createLinearGradient(0, 0, 0, L.H);
    g.addColorStop(0, th.skyTop); g.addColorStop(1, th.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L.W, L.H);
    for(let i = 0; i < 8; i++){
      const a = reduceMotion ? 0.5 : 0.35 + 0.3 * Math.sin(t * 1.5 + i);
      ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
      ell(hashRnd(i) * L.W, 10 + hashRnd(i + 9) * 0.25 * L.H, 1.2, 1.2); ctx.fill();
    }
  }

  // The spare room is a house: brick front, a pitched roof with a chimney, and the company's name
  // on the gable. A business unit is clad, with a flat roof and a sign, on a street.
  function drawShell(L, t){
    const { s, x0, x1, H } = L;
    const roofY = L.floors[L.floors.length - 1].top;
    const gy = H - U.ground * s;
    ctx.fillStyle = L.house ? th.ground : th.street;
    ctx.fillRect(0, gy, L.W, H - gy);
    ctx.fillStyle = th.slab;
    ctx.fillRect(0, gy, L.W, 3 * s);
    ctx.fillStyle = L.house ? th.brick : th.cladding;
    ctx.fillRect(x0 - 8 * s, roofY - 8 * s, x1 - x0 + 16 * s, gy - roofY + 8 * s);
    ctx.fillStyle = th.roof;
    if(!L.house){
      ctx.fillStyle = tint('#ffffff', 0.12);
      for(let x = 20 * s; x < L.W; x += 60 * s) ctx.fillRect(x, gy + 20 * s, 28 * s, 3 * s);
      ctx.fillStyle = th.roof;
      ctx.fillRect(x0 - 12 * s, roofY - 14 * s, x1 - x0 + 24 * s, 8 * s);
      ctx.fillStyle = tint('#000000', 0.12);
      for(let x = x0 - 8 * s; x < x1 + 8 * s; x += 9 * s) ctx.fillRect(x, roofY - 6 * s, 1.5 * s, 6 * s);
      sign(L, x0 + 150 * s, roofY - 36 * s, L.company.toUpperCase(), 'Unit 4 · ' + (L.owned ? 'owned' : 'rented'));
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x0 - 22 * s, roofY - 6 * s);
    ctx.lineTo((x0 + x1) / 2, roofY - U.roof.house * s + 8 * s);
    ctx.lineTo(x1 + 22 * s, roofY - 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(x1 - 120 * s, roofY - U.roof.house * s + 30 * s, 22 * s, 40 * s);
    if(!reduceMotion){
      ctx.fillStyle = tint('#ffffff', 0.25);
      for(let i = 0; i < 3; i++){
        const p = (t * 0.4 + i / 3) % 1;
        ctx.globalAlpha = 1 - p;
        ell(x1 - 109 * s + Math.sin(p * 6) * 4 * s, roofY - U.roof.house * s + 24 * s - p * 30 * s, (5 + p * 8) * s, (4 + p * 5) * s); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    sign(L, (x0 + x1) / 2, roofY - 40 * s, L.company.toUpperCase(), 'from the spare room');
  }

  function sign(L, cx, y, title, sub){
    const s = L.s;
    font(800, 12 * s, true);
    const tw = ctx.measureText(title).width;
    font(600, 8.5 * s, true);
    const w = Math.max(tw, ctx.measureText(sub).width) + 26 * s;
    ctx.fillStyle = '#131417';
    rrect(cx - w / 2, y - 14 * s, w, 32 * s, 5 * s); ctx.fill();
    ctx.strokeStyle = '#f2b84b'; ctx.lineWidth = 1.2 * s; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    font(800, 12 * s, true); ctx.fillStyle = '#f2b84b'; ctx.fillText(title, cx, y - 2 * s);
    font(600, 8.5 * s, true); ctx.fillStyle = '#9498a3'; ctx.fillText(sub, cx, y + 10 * s);
  }

  function drawFloor(L, f, snap, t){
    const s = L.s, x0 = L.x0, x1 = L.x1;
    const { top, floorY } = f;
    const g = ctx.createLinearGradient(0, top, 0, floorY);
    g.addColorStop(0, th.wallTop); g.addColorStop(1, th.wallBottom);
    ctx.fillStyle = g;
    ctx.fillRect(x0, top, x1 - x0, floorY - top);
    ctx.fillStyle = th.slab;
    ctx.fillRect(x0 - 8 * s, floorY, x1 - x0 + 16 * s, U.slab * s);
    drawSide(L, f);
    if(!L.house) drawMeeting(L, f);
    drawKitchen(L, f, t);
    if(f.i === 0) drawInterviews(L, f, snap);
    else drawServerRoom(L, f, t);
    drawFloorSign(L, f, snap, t);

    const at = sp => sp && !sp.walking && !sp.gone && sp.alpha > 0.5 && sp.fi === f.i ? sp : null;
    // Beside the first desk: the intern's crate on the Director's floor, a plant on the others.
    const intern = snap.people.find(p => p.role === 'Intern');
    const isp = intern && sprites.get(intern.id);
    if(isp && isp.home === f.i) drawStool(f.pairX + 30 * s, floorY, s, at(isp), isp, t);
    else{ ctx.fillStyle = '#8a6141'; ctx.fillRect(f.pairX + 22 * s, floorY - 14 * s, 12 * s, 14 * s); ctx.fillStyle = '#3f9b5b'; ell(f.pairX + 28 * s, floorY - 22 * s, 9 * s, 11 * s); ctx.fill(); }
    const owners = new Map();
    sprites.forEach(sp => { if(!sp.applicant && !sp.leaving && sp.desk != null && desks.get(sp.id) === sp.desk) owners.set(sp.desk, sp); });
    for(let j = 0; j < L.pf; j++){
      const owner = owners.get(f.i * L.pf + j);
      drawDesk(f.deskX(j), floorY, s, owner && at(owner), owner, t, false);
    }
    if(f.i === 0) for(let k = 0; k < L.stools; k++){
      const owner = owners.get(L.desksN + k);
      drawStool(f.stoolX(k), floorY, s, owner && at(owner), owner, t);
    }
    const people = [...sprites.values()].filter(sp => sp.fi === f.i && sp.alpha > 0.01).sort((a, b) => a.x - b.x);
    people.forEach(sp => drawPerson(sp, floorY, s, t));

    // Names on the slab, and "free" under empty desks.
    font(700, 8.5 * s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ny = floorY + (U.slab / 2 + 0.5) * s;
    for(let j = 0; j < L.pf; j++){
      if(!owners.get(f.i * L.pf + j)){ ctx.fillStyle = tint('#9498a3', 0.75); ctx.fillText('free', f.deskX(j), ny); }
    }
    const named = people.filter(sp => !sp.gone);
    named.forEach((sp, i) => {
      const gaps = [named[i - 1], named[i + 1]].filter(Boolean).map(o => Math.abs(o.x - sp.x));
      const room = Math.min(80 * s, ...gaps);
      if(room < 22 * s) return;
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = th.slabText;
      let n = sp.name;
      while(n.length > 2 && ctx.measureText(n).width > room - 4 * s) n = n.slice(0, -2) + '…';
      ctx.fillText(n, sp.x, ny);
      ctx.globalAlpha = 1;
    });
    addTargets(L, f);
  }

  function drawFloorSign(L, f, snap, t){
    const s = L.s;
    const x = f.dz0, y = f.top + 9 * s;
    const label = L.house ? 'SPARE ROOM' : f.i === 0 ? 'GROUND' : 'LEVEL ' + f.i;
    font(800, 10 * s, true);
    const w = ctx.measureText(label).width + 16 * s;
    ctx.fillStyle = '#f2b84b';
    rrect(x, y, w, 18 * s, 9 * s); ctx.fill();
    ctx.fillStyle = '#131417'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 8 * s, y + 9.5 * s);
    const c = counts(snap, f.i);
    font(600, 9.5 * s); ctx.fillStyle = th.dim;
    const txt = c.taken + '/' + L.pf + ' desks' + (c.squeezed ? ' + ' + c.squeezed + ' squeezed in' : '') + ' · ' + c.working + ' on contracts · ' +
      c.bench + ' on the bench' + (c.breaks ? ' · ' + c.breaks + ' on a break' : '') + (c.away ? ' · ' + c.away + ' away' : '');
    ctx.fillText(txt, x + w + 8 * s, y + 9.5 * s);
    if(c.stuck){
      const lx = x + w + 8 * s + ctx.measureText(txt).width + 14 * s;
      const on = reduceMotion || Math.sin(t * 6) > -0.2;
      ctx.fillStyle = on ? '#f2b84b' : '#7a5c22';
      ell(lx, y + 9 * s, 5.5 * s, 5.5 * s); ctx.fill();
      ctx.fillStyle = '#131417'; font(800, 8 * s); ctx.textAlign = 'center'; ctx.fillText('!', lx, y + 9.5 * s);
    }
  }

  // The way in: the spare room's front door; a unit's stairs on every floor, and its door on the
  // ground floor. The door opens while someone is walking through it.
  function drawSide(L, f){
    const s = L.s, x = f.sideX, fy = f.floorY;
    const open = [...sprites.values()].some(sp => sp.fi === f.i && Math.abs(sp.x - x) < 30 * s && (sp.walking || (sp.alpha > 0.03 && sp.alpha < 0.98)));
    if(L.house){ door(x, fy, s, open); return; }
    ctx.fillStyle = th.slab;
    const steps = 8, sw = 6 * s, rise = (U.floor - U.slab) * s / steps;
    for(let k = 0; k < steps; k++) ctx.fillRect(x - 24 * s + k * sw, fy - (k + 1) * rise, sw + 1, (k + 1) * rise);
    ctx.strokeStyle = th.dim; ctx.lineWidth = 1.5 * s;
    ctx.beginPath(); ctx.moveTo(x - 24 * s, fy - 22 * s); ctx.lineTo(x - 24 * s + steps * sw, fy - 22 * s - steps * rise); ctx.stroke();
    if(f.i === 0) door(x + 10 * s, fy, s, open);
  }

  function door(x, fy, s, open){
    const w = 30 * s, h = 64 * s;
    ctx.fillStyle = '#5a3f2c'; ctx.fillRect(x - w / 2 - 3 * s, fy - h - 3 * s, w + 6 * s, h + 3 * s);
    ctx.fillStyle = '#1a1714'; ctx.fillRect(x - w / 2, fy - h, w, h);
    const dw = w * (1 - (open ? 0.75 : 0));
    ctx.fillStyle = '#8a6141'; ctx.fillRect(x - w / 2, fy - h, dw, h);
    ctx.fillStyle = '#f2b84b'; ell(x - w / 2 + dw - 5 * s, fy - h / 2, 2 * s, 2 * s); ctx.fill();
    ctx.fillStyle = 'rgba(190,220,240,0.5)'; ctx.fillRect(x - w / 2 + 5 * s, fy - h + 6 * s, Math.max(0, dw - 10 * s), 14 * s);
  }

  // The kitchen, where breaks are taken, on every floor: a coffee machine (steaming while someone's at it), a
  // window and a couch.
  function drawKitchen(L, f, t){
    const s = L.s, k = f.kx0, fy = f.floorY, x1 = L.x1;
    ctx.fillStyle = tint('#f2b84b', 0.07);
    ctx.fillRect(k, f.top, x1 - k, fy - f.top);
    font(700, 8 * s); ctx.fillStyle = th.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('KITCHEN', k + 76 * s, f.top + 8 * s);
    const wx = k + 96 * s, wy = f.top + 26 * s;
    ctx.fillStyle = '#8a6141'; ctx.fillRect(wx - 26 * s, wy - 3 * s, 52 * s, 40 * s);
    const g = ctx.createLinearGradient(0, wy, 0, wy + 34 * s); g.addColorStop(0, th.skyTop); g.addColorStop(1, th.skyBottom);
    ctx.fillStyle = g; ctx.fillRect(wx - 23 * s, wy, 46 * s, 34 * s);
    ctx.fillStyle = '#8a6141'; ctx.fillRect(wx - 1.5 * s, wy, 3 * s, 34 * s);
    ctx.fillStyle = '#9aa3ae'; ctx.fillRect(k + 8 * s, fy - 36 * s, 40 * s, 4 * s);
    ctx.fillStyle = '#6a737e'; ctx.fillRect(k + 10 * s, fy - 32 * s, 36 * s, 32 * s);
    ctx.fillStyle = '#131417'; rrect(k + 14 * s, fy - 60 * s, 18 * s, 24 * s, 3 * s); ctx.fill();
    ctx.fillStyle = '#ef6a6a'; ell(k + 28 * s, fy - 55 * s, 1.5 * s, 1.5 * s); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(k + 19 * s, fy - 45 * s, 8 * s, 8 * s);
    if(!reduceMotion && [...sprites.values()].some(sp => sp.fi === f.i && sp.spot === 'coffee' && !sp.walking && !sp.gone)){
      ctx.strokeStyle = 'rgba(180,180,190,0.6)'; ctx.lineWidth = 1.2 * s;
      for(let i = 0; i < 2; i++){
        const p = (t * 0.8 + i * 0.5) % 1;
        ctx.globalAlpha = 1 - p;
        ctx.beginPath(); ctx.moveTo(k + (21 + i * 4) * s, fy - 46 * s - p * 14 * s);
        ctx.quadraticCurveTo(k + (24 + i * 4) * s, fy - 50 * s - p * 14 * s, k + (21 + i * 4) * s, fy - 54 * s - p * 14 * s);
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    const cx0 = k + 66 * s, cw = 80 * s, col = '#4a6fa5';
    ctx.fillStyle = tint(col, 0.85); rrect(cx0, fy - 36 * s, cw, 22 * s, 6 * s); ctx.fill();
    ctx.fillStyle = col; rrect(cx0 - 4 * s, fy - 22 * s, cw + 8 * s, 14 * s, 4 * s); ctx.fill();
    rrect(cx0 - 6 * s, fy - 28 * s, 9 * s, 20 * s, 4 * s); ctx.fill();
    rrect(cx0 + cw - 3 * s, fy - 28 * s, 9 * s, 20 * s, 4 * s); ctx.fill();
    ctx.fillStyle = '#3a2a1e'; ctx.fillRect(cx0 + 2 * s, fy - 8 * s, 4 * s, 8 * s); ctx.fillRect(cx0 + cw - 6 * s, fy - 8 * s, 4 * s, 8 * s);
  }

  // The meeting room, on every floor of a business unit (not the spare room): a whiteboard of cards and a table.
  function drawMeeting(L, f){
    const s = L.s, a = f.mx0, b = f.kx0, fy = f.floorY;
    ctx.fillStyle = tint('#a57be0', 0.07);
    ctx.fillRect(a, f.top, b - a, fy - f.top);
    ctx.fillStyle = th.slab;
    ctx.fillRect(a - 2 * s, f.top, 4 * s, fy - f.top - 62 * s);
    font(700, 8 * s); ctx.fillStyle = th.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('MEETING ROOM', (a + b) / 2, f.top + 8 * s);
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(a + 22 * s, f.top + 30 * s, 56 * s, 32 * s);
    ctx.strokeStyle = '#8a93a3'; ctx.lineWidth = 1 * s; ctx.strokeRect(a + 22 * s, f.top + 30 * s, 56 * s, 32 * s);
    ['#5aa9e6', '#f2b84b', '#4fd18b'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(a + 28 * s + i * 17 * s, f.top + 36 * s, 11 * s, 7 * s); ctx.fillRect(a + 28 * s + i * 17 * s, f.top + 47 * s, 11 * s, 7 * s); });
    ctx.fillStyle = '#a87b54'; ctx.fillRect(a + 20 * s, fy - 34 * s, 76 * s, 5 * s);
    ctx.fillStyle = '#8a6141'; ctx.fillRect(a + 55 * s, fy - 29 * s, 5 * s, 29 * s);
  }

  // The interview room, by the front door: a chair per applicant slot, a plant and a framed kiwi.
  function drawInterviews(L, f, snap){
    const s = L.s, a = f.rx0, b = f.rx1, fy = f.floorY;
    ctx.fillStyle = tint('#4fd18b', 0.07);
    ctx.fillRect(a, f.top, b - a, fy - f.top);
    ctx.fillStyle = th.slab;
    ctx.fillRect(b - 2 * s, f.top, 4 * s, fy - f.top - 62 * s);
    font(700, 8 * s); ctx.fillStyle = th.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('INTERVIEWS', (a + b) / 2, f.top + 8 * s);
    font(600, 7.5 * s, true); ctx.fillStyle = th.faint;
    ctx.fillText(snap.applicants.length + '/' + L.seats + ' waiting', (a + b) / 2, f.top + 20 * s);
    for(let k = 0; k < L.seats; k++){
      const cx = a + (22 + k * 27) * s;
      ctx.fillStyle = '#5a6170';
      rrect(cx - 10 * s, fy - 40 * s, 5 * s, 24 * s, 2 * s); ctx.fill();
      ctx.fillRect(cx - 10 * s, fy - 19 * s, 20 * s, 4 * s);
      ctx.fillRect(cx - 9 * s, fy - 15 * s, 2.5 * s, 15 * s); ctx.fillRect(cx + 6.5 * s, fy - 15 * s, 2.5 * s, 15 * s);
    }
    ctx.fillStyle = '#8a6141'; ctx.fillRect(b - 22 * s, fy - 14 * s, 12 * s, 14 * s);
    ctx.fillStyle = '#3f9b5b'; ell(b - 16 * s, fy - 22 * s, 9 * s, 11 * s); ctx.fill();
    ctx.fillStyle = '#8a6141'; ctx.fillRect(a + 34 * s, f.top + 34 * s, 30 * s, 22 * s);
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(a + 36 * s, f.top + 36 * s, 26 * s, 18 * s);
    ctx.fillStyle = '#9a6a43'; ell(a + 47 * s, f.top + 47 * s, 7 * s, 5 * s); ctx.fill(); ell(a + 53 * s, f.top + 43 * s, 3 * s, 3 * s); ctx.fill();
  }

  // Upstairs in a unit, above the interview room: a server room, racks of blinking lights.
  function drawServerRoom(L, f, t){
    const s = L.s, a = f.rx0, b = f.rx1, fy = f.floorY;
    ctx.fillStyle = tint('#5aa9e6', 0.06);
    ctx.fillRect(a, f.top, b - a, fy - f.top);
    ctx.fillStyle = th.slab;
    ctx.fillRect(b - 2 * s, f.top, 4 * s, fy - f.top - 62 * s);
    font(700, 8 * s); ctx.fillStyle = th.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('SERVER ROOM', (a + b) / 2, f.top + 8 * s);
    for(let r = 0; r < 3; r++){
      const x = a + (16 + r * 32) * s, h = 76 * s;
      ctx.fillStyle = '#1d2026'; ctx.fillRect(x, fy - h, 24 * s, h);
      for(let k = 0; k < 8; k++){
        ctx.fillStyle = '#2c2f37'; ctx.fillRect(x + 3 * s, fy - h + (5 + k * 9) * s, 18 * s, 6 * s);
        const on = reduceMotion ? hashRnd(r * 8 + k) > 0.4 : hashRnd(r * 8 + k + Math.floor(t * 2 + hashRnd(k + r) * 3)) > 0.4;
        ctx.fillStyle = on ? (k % 3 ? '#4fd18b' : '#f2b84b') : '#2f4a3a';
        ell(x + 17 * s, fy - h + (8 + k * 9) * s, 1.2 * s, 1.2 * s); ctx.fill();
      }
    }
  }

  function laptop(cx, y, s, seated, owner, t){
    ctx.fillStyle = '#2a2d33';
    ctx.fillRect(cx - 17 * s, y - 2 * s, 34 * s, 2 * s);
    rrect(cx - 16 * s, y - 24 * s, 32 * s, 22 * s, 2 * s); ctx.fill();
    screen(cx - 14 * s, y - 22 * s, 28 * s, 18 * s, seated, owner, t, s);
  }

  function drawDesk(x, fy, s, seated, owner, t, hot){
    const chx = x + 20 * s;
    ctx.fillStyle = '#4a4f57';
    rrect(chx + 9 * s, fy - 46 * s, 6 * s, 30 * s, 3 * s); ctx.fill();
    ctx.fillRect(chx - 10 * s, fy - 18 * s, 24 * s, 4 * s);
    ctx.fillRect(chx + 1 * s, fy - 14 * s, 3 * s, 10 * s);
    ctx.fillRect(chx - 8 * s, fy - 4 * s, 20 * s, 2 * s);
    // Someone away: a note on their chair.
    if(owner && owner.gone && owner.p){
      ctx.fillStyle = '#f2d04b'; ctx.fillRect(chx - 6 * s, fy - 30 * s, 12 * s, 10 * s);
      ctx.fillStyle = '#7a5c22'; ctx.fillRect(chx - 4 * s, fy - 27 * s, 8 * s, 1 * s); ctx.fillRect(chx - 4 * s, fy - 24 * s, 6 * s, 1 * s);
    }
    // Co-working desks are a plain white bench.
    ctx.fillStyle = hot ? '#d8dde3' : '#a87b54';
    ctx.fillRect(x - 36 * s, fy - 40 * s, 66 * s, 5 * s);
    ctx.fillStyle = hot ? '#9aa3ae' : '#8a6141';
    if(hot){ ctx.fillRect(x - 33 * s, fy - 35 * s, 3 * s, 35 * s); ctx.fillRect(x + 24 * s, fy - 35 * s, 3 * s, 35 * s); }
    else{ ctx.fillRect(x - 33 * s, fy - 35 * s, 22 * s, 35 * s); ctx.fillRect(x + 22 * s, fy - 35 * s, 4 * s, 35 * s); ctx.fillStyle = '#a87b54'; ctx.fillRect(x - 25 * s, fy - 27 * s, 6 * s, 2 * s); ctx.fillRect(x - 25 * s, fy - 14 * s, 6 * s, 2 * s); }
    if(owner){ ctx.fillStyle = (owner.look && owner.look.shirt) || ROLE_COLOR[owner.role] || '#8a93a3'; rrect(x + 6 * s, fy - 47 * s, 6 * s, 7 * s, 1.5 * s); ctx.fill(); }
    ctx.fillStyle = '#2a2d33';
    ctx.fillRect(x - 15 * s, fy - 47 * s, 8 * s, 7 * s);
    rrect(x - 32 * s, fy - 76 * s, 42 * s, 30 * s, 3 * s); ctx.fill();
    screen(x - 30 * s, fy - 74 * s, 38 * s, 26 * s, seated, owner, t, s);
  }

  // Squeezed in without a desk: a stool, and a laptop on a crate.
  function drawStool(x, fy, s, seated, owner, t){
    ctx.fillStyle = '#8a6141';
    ctx.fillRect(x - 22 * s, fy - 26 * s, 24 * s, 26 * s);
    ctx.fillStyle = '#6b4a31';
    ctx.fillRect(x - 22 * s, fy - 14 * s, 24 * s, 2 * s);
    laptop(x - 10 * s, fy - 26 * s, s, seated, owner, t);
    ctx.fillStyle = '#4a4f57';
    ctx.fillRect(x + 2 * s, fy - 18 * s, 18 * s, 4 * s);
    ctx.fillRect(x + 4 * s, fy - 14 * s, 2.5 * s, 14 * s); ctx.fillRect(x + 15.5 * s, fy - 14 * s, 2.5 * s, 14 * s);
  }

  // A monitor: code typing in while on a contract, with the contract's progress along the
  // bottom; a flashing "?" when stuck; ✗ when failed; a manager's board of cards; a
  // screensaver on the bench; dark when nobody's there.
  function screen(x, y, w, h, seated, owner, t, s){
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const bg = c => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const seed = owner ? owner.seed : 0;
    const p = owner && !owner.gone ? owner.p : null;
    // Someone on a break or in the meeting room has left their work running.
    const st = !p ? 'off'
      : seated ? (p.role === 'Manager' ? 'board' : p.state)
      : owner.walking ? 'off'
      : p.role === 'Manager' && owner.spot === 'meeting' ? 'board'
      : owner.onBreak ? (p.job ? 'break' : 'bench')
      : 'off';
    const motion = reduceMotion ? 0 : t;
    if(st === 'working' || st === 'director'){
      const cols = p.job ? (LANG_COLS[p.job.lang] || DIRECTOR_COLS) : DIRECTOR_COLS;
      bg('#16181c');
      const rate = st === 'director' ? 1.2 : 2.6;
      const n = reduceMotion ? 5 : Math.floor((motion * rate + seed) % 6) + 1;
      const lh = Math.max(3 * s, h / 7);
      for(let i = 0; i < n; i++){
        const indent = (hashRnd(i + seed + 3) > 0.5 ? 4 : 0) * s;
        const full = (w - 8 * s - indent) * (0.3 + hashRnd(i + seed) * 0.6);
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(x + 3 * s + indent, y + 3 * s + i * lh * 0.75, i === n - 1 && !reduceMotion ? full * ((motion * rate + seed) % 1) : full, 2 * s);
      }
      if(p.job){
        ctx.fillStyle = '#2c2f37'; ctx.fillRect(x, y + h - 3 * s, w, 3 * s);
        ctx.fillStyle = '#4fd18b'; ctx.fillRect(x, y + h - 3 * s, w * Math.min(1, p.job.progress), 3 * s);
      }
    }else if(st === 'break'){
      // The code sits still while they're away, the progress bar carries on, and a mug waits.
      bg('#16181c');
      ctx.fillStyle = '#5f6470';
      for(let i = 0; i < 4; i++) ctx.fillRect(x + 3 * s, y + 3 * s + i * Math.max(3 * s, h / 7) * 0.75, (w - 8 * s) * (0.3 + hashRnd(i + seed) * 0.6), 2 * s);
      ctx.fillStyle = '#e8e2d6'; rrect(x + w - 11 * s, y + h - 13 * s, 6 * s, 7 * s, 1.5 * s); ctx.fill();
      ctx.strokeStyle = '#e8e2d6'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.arc(x + w - 4.5 * s, y + h - 9.5 * s, 2 * s, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.fillStyle = '#2c2f37'; ctx.fillRect(x, y + h - 3 * s, w, 3 * s);
      ctx.fillStyle = '#4fd18b'; ctx.fillRect(x, y + h - 3 * s, w * Math.min(1, p.job.progress), 3 * s);
    }else if(st === 'stuck'){
      bg(reduceMotion || Math.sin(t * 6) > 0 ? '#f2b84b' : '#a67a1e');
      ctx.fillStyle = '#131417'; font(900, Math.min(16 * s, h * 0.8)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', x + w / 2, y + h / 2 + 1 * s);
    }else if(st === 'failed'){
      bg('#3b1f1f');
      ctx.strokeStyle = '#ef6a6a'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
      const cx = x + w / 2, cy = y + h / 2, r = Math.min(6 * s, h / 3);
      ctx.beginPath();
      ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r); ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r);
      ctx.stroke();
    }else if(st === 'board'){
      bg('#f4f1ea');
      const tick = Math.floor(motion / 2);
      for(let c = 0; c < 3; c++) for(let r = 0; r < 3; r++){
        if(hashRnd(c * 3 + r + seed + tick) > 0.35){
          ctx.fillStyle = ['#f2b84b', '#5aa9e6', '#4fd18b'][c];
          ctx.fillRect(x + 3 * s + c * 12 * s, y + 3 * s + r * 7 * s, 9 * s, 5 * s);
        }
      }
    }else if(st === 'bench' || st === 'idle'){
      bg('#121317');
      const px = x + 4 * s + Math.abs(((motion * 9 * s + seed * 7) % (2 * (w - 14 * s))) - (w - 14 * s));
      const py = y + 3 * s + Math.abs(((motion * 6 * s + seed * 3) % (2 * (h - 12 * s))) - (h - 12 * s));
      ctx.fillStyle = tint(ROLE_COLOR[p.role] || '#8a93a3', 0.8); rrect(px, py, 10 * s, 7 * s, 2 * s); ctx.fill();
    }else{
      bg('#0d0e10');
      ctx.fillStyle = '#2c2f37'; ell(x + w - 4 * s, y + h - 4 * s, 1.2 * s, 1.2 * s); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // People
  // ---------------------------------------------------------------------------

  function drawPerson(sp, fy, s, t){
    const p = sp.p;
    const pose = sp.walking ? 'walk' : sp.spot === 'couch' ? 'couch' : ['exit', 'coffee', 'stand', 'meeting'].indexOf(sp.spot) >= 0 ? 'stand' : 'sit';
    const motion = reduceMotion ? 0 : t;
    ctx.save();
    ctx.globalAlpha = sp.alpha;
    ctx.translate(sp.x, fy);
    const f = sp.facing || 1;
    const look = sp.look || DEFAULT_LOOK;
    const shirt = look.shirt;
    const seat = pose === 'sit' ? (sp.spot === 'stool' ? 20 : 18) * s : pose === 'couch' ? 22 * s : 0;
    const step = pose === 'walk' ? Math.sin(motion * 12 + sp.seed) : 0;
    const bob = pose === 'walk' ? Math.abs(step) * 2 * s : 0;
    const legH = 15 * s;
    const hip = seat ? -seat : -legH - bob;
    const bodyH = 25 * s, bodyW = 20 * s;
    const top = hip - bodyH;
    const state = p && !sp.walking ? p.state : '';
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ell(0, 0, 13 * s, 2.6 * s); ctx.fill();
    ctx.strokeStyle = '#2d3240'; ctx.lineWidth = 5.5 * s; ctx.lineCap = 'round';
    if(seat){
      [0, 1].forEach(k => { ctx.beginPath(); ctx.moveTo((k ? 3 : -3) * s, hip - 2 * s); ctx.lineTo(f * 12 * s + (k ? 2 : -2) * s, hip - 1 * s); ctx.lineTo(f * 12 * s + (k ? 2 : -2) * s, -2 * s); ctx.stroke(); });
    }else{
      [-1, 1].forEach(k => { ctx.beginPath(); ctx.moveTo(k * 4 * s, hip - 2 * s); ctx.lineTo(k * 4 * s + step * k * 4 * s, -2 * s); ctx.stroke(); });
    }
    ctx.fillStyle = shirt; rrect(-bodyW / 2, top, bodyW, bodyH, 8 * s); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ell(-bodyW * 0.2, top + 6 * s, 4 * s, 3 * s); ctx.fill();
    if(sp.applicant){
      // Holding a CV in their level's colour.
      ctx.fillStyle = ROLE_COLOR[sp.role] || '#8a93a3'; ctx.fillRect(f * 6 * s - 4 * s, top + 8 * s, 9 * s, 12 * s);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(f * 6 * s - 2.5 * s, top + 10 * s, 6 * s, 1.2 * s); ctx.fillRect(f * 6 * s - 2.5 * s, top + 13 * s, 6 * s, 1.2 * s);
    }else if(sp.role === 'Manager'){
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(f * 3 * s - 2 * s, top + 2 * s); ctx.lineTo(f * 3 * s + 2 * s, top + 2 * s); ctx.lineTo(f * 3 * s + 2.5 * s, top + 15 * s); ctx.lineTo(f * 3 * s, top + 18 * s); ctx.lineTo(f * 3 * s - 2.5 * s, top + 15 * s); ctx.closePath(); ctx.fill();
    }else if(sp.role === 'Graduate' || sp.role === 'Intern'){
      // A lanyard.
      ctx.strokeStyle = '#131417'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.moveTo(f * 1 * s - 4 * s, top + 1 * s); ctx.lineTo(f * 2 * s, top + 11 * s); ctx.lineTo(f * 1 * s + 4 * s, top + 1 * s); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(f * 2 * s - 2.5 * s, top + 11 * s, 5 * s, 6 * s);
    }
    ctx.strokeStyle = shirt; ctx.lineWidth = 5 * s;
    const sh = top + 7 * s;
    if(state === 'stuck'){
      ctx.beginPath(); ctx.moveTo(f * 4 * s, sh); ctx.lineTo(f * 6 * s, sh - 12 * s); ctx.lineTo(f * 2 * s, sh - 18 * s); ctx.stroke();
    }else if(pose === 'sit' && state === 'working' && sp.role !== 'Manager'){
      const tap = Math.sin(motion * 18 + sp.seed) * 1.2 * s;
      ctx.beginPath(); ctx.moveTo(f * 4 * s, sh); ctx.lineTo(f * 14 * s, sh + 8 * s + tap); ctx.lineTo(f * 22 * s, sh + 6 * s - tap); ctx.stroke();
    }else if(pose === 'stand' && sp.spot === 'coffee'){
      ctx.beginPath(); ctx.moveTo(f * 4 * s, sh); ctx.lineTo(f * 9 * s, sh + 8 * s); ctx.lineTo(f * 13 * s, sh + 2 * s); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(f * 13 * s - 3 * s, sh - 3 * s, 6 * s, 7 * s);
    }else if(sp.applicant && !sp.walking){
      ctx.beginPath(); ctx.moveTo(f * 4 * s, sh); ctx.lineTo(f * 7 * s, sh + 10 * s); ctx.stroke();
    }else{
      const sw = pose === 'walk' ? step * 6 * s : 0;
      ctx.beginPath(); ctx.moveTo(f * 5 * s, sh); ctx.lineTo(f * 6 * s + sw, sh + 15 * s); ctx.stroke();
    }
    const hy = top - 9 * s;
    drawHead(look, f, hy, s, !reduceMotion && Math.sin(t * 0.9 + sp.seed * 3) > 0.985);
    if(pose === 'couch'){ ctx.strokeStyle = '#131417'; ctx.lineWidth = 0.9 * s; ctx.beginPath(); ctx.arc(f * 4 * s, hy + 3 * s, 2 * s, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.restore();
  }

  // A head seen side-on, facing f: skin, hair (short, long, bun, bald or curly), the eye, glasses
  // (round or square) and facial hair (stubble, a moustache or a beard).
  function drawHead(look, f, hy, s, blink){
    ctx.fillStyle = look.skin; ell(0, hy, 9 * s, 9.5 * s); ctx.fill();
    if(look.beard === 1){ ctx.fillStyle = tint(look.hair, 0.35); ctx.beginPath(); ctx.ellipse(f * 1.5 * s, hy + 2.5 * s, 8 * s, 6.5 * s, 0, 0, Math.PI); ctx.fill(); }
    else if(look.beard === 3){ ctx.fillStyle = look.hair; ctx.beginPath(); ctx.ellipse(f * 1.5 * s, hy + 2.5 * s, 8.2 * s, 7.5 * s, 0, 0, Math.PI); ctx.fill(); }
    if(look.beard === 2 || look.beard === 3){ ctx.fillStyle = look.hair; rrect(f * 5 * s - 3.5 * s, hy + 2.8 * s, 7 * s, 2.2 * s, 1 * s); ctx.fill(); }
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    if(look.hairStyle === 0){ ctx.ellipse(-f * 1.5 * s, hy - 3 * s, 9.5 * s, 7 * s, 0, Math.PI, 2 * Math.PI); ctx.fill(); }
    else if(look.hairStyle === 1){ ctx.ellipse(-f * 2 * s, hy - 2 * s, 10 * s, 8 * s, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); ctx.fillRect(-f * 9.5 * s - (f < 0 ? 0 : 4 * s), hy - 3 * s, 4 * s, 13 * s); }
    else if(look.hairStyle === 2){ ctx.ellipse(-f * 1 * s, hy - 4 * s, 9 * s, 6 * s, 0, Math.PI, 2 * Math.PI); ctx.fill(); ell(-f * 6 * s, hy - 9 * s, 4 * s, 4 * s); ctx.fill(); }
    else if(look.hairStyle === 3){ ctx.ellipse(-f * 6 * s, hy - 1 * s, 3.5 * s, 4.5 * s, 0, 0, Math.PI * 2); ctx.fill(); }
    else{ for(let i = 0; i < 6; i++){ ell(-f * (7 - i * 2.6) * s, hy - (6 + Math.sin(i * 1.7) * 1.5) * s, 4 * s, 4 * s); ctx.fill(); } ell(-f * 8 * s, hy - 1 * s, 3.5 * s, 4 * s); ctx.fill(); }
    ctx.fillStyle = '#131417';
    if(blink) ctx.fillRect(f * 4 * s - 1.5 * s, hy, 3 * s, 0.8 * s); else{ ell(f * 4.2 * s, hy, 1.2 * s, 1.5 * s); ctx.fill(); }
    if(look.glasses){
      ctx.strokeStyle = '#131417'; ctx.lineWidth = 0.9 * s;
      if(look.glasses === 1){ ctx.beginPath(); ctx.arc(f * 4.2 * s, hy, 2.8 * s, 0, Math.PI * 2); ctx.stroke(); }
      else ctx.strokeRect(f * 4.2 * s - 2.6 * s, hy - 2.2 * s, 5.2 * s, 4.2 * s);
      ctx.beginPath(); ctx.moveTo(f * 1.4 * s, hy - 0.5 * s); ctx.lineTo(-f * 3 * s, hy - 1.5 * s); ctx.stroke();
    }
  }

  // Someone's look: the Director's from the save; anyone else's from a hash of their id, in their
  // level's colour (applicants in grey). Principals wear glasses.
  function lookFor(sp, p){
    if(p && p.role === 'Director') return Object.assign({}, DEFAULT_LOOK, p.look || {});
    const h = hashStr(sp.id);
    return {
      skin: SKIN[h % SKIN.length], hair: HAIR[(h >> 3) % HAIR.length], hairStyle: [0, 1, 2, 0, 4, 1, 3][(h >> 5) % 7],
      glasses: sp.role === 'Principal' ? 2 : (h >> 8) % 6 === 0 ? 1 : 0,
      beard: (h >> 10) % 5 === 0 ? 1 + (h >> 12) % 3 : 0,
      shirt: sp.applicant ? '#d9d4cc' : ROLE_COLOR[sp.role] || '#8a93a3'
    };
  }

  // Draws a person standing, large, on a canvas of its own: the founding step's preview.
  function portrait(cv, look){
    const saved = ctx;
    ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || cv.width, h = cv.clientHeight || cv.height;
    if(cv.width !== Math.round(w * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const s = Math.min(w / 46, h / 66);
    drawPerson({ id: 'portrait', role: 'Director', look: Object.assign({}, DEFAULT_LOOK, look), x: w / 2, alpha: 1, facing: 1,
                 walking: false, spot: 'exit', seed: 0, p: null }, h - 4 * s, s, 0);
    ctx = saved;
  }

  // A stuck intern says so over their head.
  function drawBubbles(L, snap){
    const s = L.s;
    snap.people.forEach(p => {
      if(p.state !== 'stuck') return;
      const sp = sprites.get(p.id);
      if(!sp || sp.walking || sp.alpha < 0.5) return;
      bubble(sp.x, L.floors[sp.fi].floorY - 62 * s, 'Stuck · tap to help', s, L.W);
    });
  }

  function banner(L, text){
    const s = L.s;
    font(800, 14 * s, true);
    const w = ctx.measureText(text).width + 30 * s;
    const x = Math.min(L.W, box.clientWidth) / 2 + box.scrollLeft;
    ctx.fillStyle = 'rgba(19,20,23,0.88)';
    rrect(x - w / 2, 12 * s, w, 30 * s, 15 * s); ctx.fill();
    ctx.fillStyle = '#f2b84b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, 27.5 * s);
  }

  function bubble(x, y, text, s, maxX){
    font(600, 10.5 * s);
    const padX = 7 * s;
    const w = ctx.measureText(text).width + padX * 2;
    const h = 20 * s;
    const bx = Math.max(4, Math.min(x - w / 2, maxX - w - 4));
    const by = y - h - 6 * s;
    ctx.fillStyle = '#f2b84b';
    ctx.strokeStyle = '#7a5c22'; ctx.lineWidth = 1;
    rrect(bx, by, w, h, 8 * s); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5 * s, by + h - 0.5); ctx.lineTo(x, y); ctx.lineTo(x + 5 * s, by + h - 0.5); ctx.fill();
    ctx.fillStyle = '#131417'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + padX, by + h / 2 + 0.5);
  }

  // ---------------------------------------------------------------------------
  // Taps, and the text summary
  // ---------------------------------------------------------------------------

  // Taps are a shortcut, never the only way: each does what a button in the panels does.
  function addTargets(L, f){
    const s = L.s;
    sprites.forEach(sp => {
      if(sp.fi !== f.i || sp.gone || sp.walking || sp.alpha < 0.5) return;
      const p = sp.p;
      const tap = sp.applicant ? { kind: 'applicant', id: sp.id }
        : p.role === 'Director' ? { kind: 'director', id: sp.id }
        : p.state === 'stuck' && p.job ? { kind: 'stuck', id: p.job.id }
        : { kind: 'person', id: sp.id };
      targets.push(Object.assign(tap, { x: sp.x - 22 * s, y: f.top + 20 * s, w: 44 * s, h: f.floorY - f.top - 20 * s + U.slab * s, cx: sp.x }));
    });
  }

  function targetAt(ev){
    const r = canvas.getBoundingClientRect();
    const x = ev.clientX - r.left, y = ev.clientY - r.top;
    let best = null;
    targets.forEach(tg => {
      if(x < tg.x || x > tg.x + tg.w || y < tg.y || y > tg.y + tg.h) return;
      const d = Math.abs(tg.cx - x);
      if(!best || d < best.d) best = { tg, d };
    });
    return best && best.tg;
  }
  function onClick(ev){
    const tg = targetAt(ev);
    if(tg && api) api.onTap(tg.kind, tg.id);
  }
  function onHover(ev){ canvas.style.cursor = targetAt(ev) ? 'pointer' : ''; }

  // Whether someone is on a break now. People on a contract or the bench take them; the Director,
  // a stuck or failed job, a manager in the meeting room and anyone away don't. Tests can fix the
  // list with window.DEBUGG_OFFICE_BREAKS (an array of ids).
  function onBreak(p, now){
    const fixed = window.DEBUGG_OFFICE_BREAKS;
    if(Array.isArray(fixed)) return fixed.indexOf(p.id) >= 0;
    if(p.role === 'Director' || !(p.state === 'bench' || (p.state === 'working' && p.role !== 'Manager'))) return false;
    const win = Math.floor(now / BREAK_WINDOW), h = hashStr(p.id);
    if(hashRnd(h + (win % 9973) * 1.37) >= BREAK_ODDS) return false;
    const start = hashRnd(h * 0.71 + (win % 9973)) * (BREAK_WINDOW - BREAK_MS);
    const into = now - win * BREAK_WINDOW;
    return into >= start && into < start + BREAK_MS;
  }

  // Who's where, for the whole building or (with fi) one floor: people count on the floor of their
  // desk, even while they're on a break.
  function counts(snap, fi){
    const here = p => fi == null || ((sprites.get(p.id) || {}).home || 0) === fi;
    const staff = snap.people.filter(p => p.role !== 'Intern' && here(p));
    const team = snap.people.filter(p => p.role !== 'Director' && here(p));
    const squeezed = fi == null || fi === 0 ? snap.premises.squeezed : 0;
    return {
      taken: staff.length - squeezed,
      desks: snap.premises.floors * snap.premises.perFloor,
      squeezed,
      working: team.filter(p => ON_CONTRACT.indexOf(p.state) >= 0).length,
      bench: team.filter(p => p.state === 'bench').length,
      breaks: team.filter(p => breaks.has(p.id)).length,
      away: team.filter(p => p.state === 'away').length,
      stuck: team.filter(p => p.state === 'stuck').length,
      applicants: snap.applicants.length
    };
  }

  // The canvas is a picture; its label sums it up for screen readers (the panels say it all too).
  function updateLabel(snap, L){
    const c = counts(snap);
    const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
    const where = L.house ? 'the spare room' : (L.owned ? 'an owned ' : 'a rented ') + L.name + ' on ' + L.floors.length + ' floors';
    const text = 'Your office, ' + where + ': ' + c.taken + ' of ' + c.desks + ' desks taken' +
      (c.squeezed ? ' and ' + c.squeezed + ' squeezed in' : '') + ', ' +
      c.working + ' on contracts, ' + c.bench + ' on the bench' +
      (c.breaks ? ', ' + c.breaks + ' on a break' : '') + (c.away ? ', ' + c.away + ' away' : '') + (c.stuck ? ', ' + c.stuck + ' stuck' : '') + ', ' +
      plural(c.applicants, 'applicant', 'applicants') + ' waiting.';
    if(text !== lastLabel){ canvas.setAttribute('aria-label', text); lastLabel = text; }
  }

  // Where each tap target's middle is, in CSS pixels from the canvas's top left (for tests).
  function listTargets(){
    return targets.map(tg => ({ kind: tg.kind, id: tg.id, x: Math.round(tg.cx), y: Math.round(tg.y + tg.h / 2) }));
  }

  return { mount, unmount, targets: listTargets, portrait, LOOKS, DEFAULT_LOOK };
})();
