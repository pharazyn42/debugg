// Shared helpers for the browser tests.

// Local noon on game day n (the demo's Day 1 is Monday 5 October 2026; days before it are
// previews: 0, -1, …). Days 6–7, 13–14… are weekends, and Day 3 is a Wednesday.
function dayDate(n){
  return new Date(2026, 9, 4 + n, 12, 0, 0);
}

// Opens a page with the clock fixed to game day `day` (timers still run normally).
// Day 3 (a Wednesday, 100 XP for a perfect solve) is the default.
// `rotation` replaces the languages' rotation (ROTATION in shared.js), e.g. [{ lang: 'python' },
// { lang: 'rust', from: 8 }]; left out, the site runs with the rotation players get.
// The demo notice that opens on a first visit is off unless { notice: true }.
async function openAt(page, path, day = 3, { rotation = null, notice = false } = {}){
  await page.clock.setFixedTime(dayDate(day));
  if(rotation) await page.addInitScript(r => { window.DEBUGG_ROTATION = r; }, rotation);
  if(!notice) await page.addInitScript(() => { window.DEBUGG_DEMO_NOTICE = false; });
  // Tests never count as real visits (the analytics test switches it on against a stand-in).
  await page.addInitScript(() => { if(!('DEBUGG_GOATCOUNTER' in window)) window.DEBUGG_GOATCOUNTER = ''; });
  if(process.env.PYODIDE_DIR){
    await page.addInitScript(() => { window.DEBUGG_PYODIDE_URL = location.origin + '/__pyodide__/'; });
  }
  await page.goto(path);
}

// Clears everything saved and reloads, for a clean start.
async function fresh(page){
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

// Sets saved values (objects are JSON-encoded), then reloads.
async function withStorage(page, values){
  await page.evaluate(v => {
    for(const [k, x] of Object.entries(v)) localStorage.setItem(k, typeof x === 'string' ? x : JSON.stringify(x));
  }, values);
  await page.reload();
}

// The puzzle for a given day.
function puzzleFor(page, day){
  return page.evaluate(d => window.Debugg.puzzleFor(d), day);
}

async function guess(page, text){
  await page.fill('#guess', text);
  await page.click('#submit');
}

function readJson(page, key){
  return page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
}

module.exports = { dayDate, openAt, fresh, withStorage, puzzleFor, guess, readJson };
