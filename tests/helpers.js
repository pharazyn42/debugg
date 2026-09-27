// Shared helpers for the browser tests.

// Local noon on game day n (Day 1 is 1 October 2026; days before it are previews: 0, -1, …).
function dayDate(n){
  return new Date(2026, 9, n, 12, 0, 0);
}

// Opens a page with the clock fixed to game day `day` (timers still run normally).
async function openAt(page, path, day = 1){
  await page.clock.setFixedTime(dayDate(day));
  // Google Fonts isn't needed and may be unreachable.
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
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
