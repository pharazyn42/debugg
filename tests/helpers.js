// Shared helpers for the browser tests.

// Local noon on game day n (Day 1 is Thursday 1 October 2026; days before it are previews: 0, -1, …).
// Days 3–4, 10–11… are weekends; Day 5 is a Monday and Day 7 a Wednesday.
function dayDate(n){
  return new Date(2026, 9, n, 12, 0, 0);
}

// Opens a page with the clock fixed to game day `day` (timers still run normally).
// JavaScript is hidden from players for now, but the tests switch it back on so it stays
// covered; pass { langs: null } to test the site exactly as players see it.
// Day 7 (a Wednesday, 100 XP for a perfect solve) is the default.
async function openAt(page, path, day = 7, { langs = ['python', 'javascript'] } = {}){
  await page.clock.setFixedTime(dayDate(day));
  if(langs) await page.addInitScript(l => { window.DEBUGG_LANGS = l; }, langs);
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

// The puzzle a language shows on a given day.
function puzzleFor(page, lang, day){
  return page.evaluate(([l, d]) => window.Debugg.puzzleFor(l, d), [lang, day]);
}

async function guess(page, text){
  await page.fill('#guess', text);
  await page.click('#submit');
}

function readJson(page, key){
  return page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
}

module.exports = { dayDate, openAt, fresh, withStorage, puzzleFor, guess, readJson };
