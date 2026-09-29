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
// Puzzle formats are off unless { formats: true }: every day is "what does this print?", so tests
// about other things can type the answer. Format tests switch them on and answer with solve()/miss().
async function openAt(page, path, day = 3, { rotation = null, notice = false, formats = false } = {}){
  await page.clock.setFixedTime(dayDate(day));
  if(rotation) await page.addInitScript(r => { window.DEBUGG_ROTATION = r; }, rotation);
  if(!formats) await page.addInitScript(() => {
    window.DEBUGG_WEEK_FORMATS = { 1: ['output'], 2: ['output'], 3: ['output'], 4: ['output'], 5: ['output'], weekend: ['output'] };
  });
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

// Answers today's puzzle, in whatever format it is: right (solve) or wrong (miss, once).
async function solve(page, day = 3){
  const p = await puzzleFor(page, day);
  const f = p.format || 'output';
  if(f === 'choice' || f === 'error') await page.click('#choices .choice[data-text="' + p.display.replace(/"/g, '\\"') + '"]');
  else if(f === 'bug') await page.click('#code .cl[data-line="' + p.bugLine + '"]');
  else if(f === 'order'){
    // Move each line into place with its arrows.
    const n = p.code.split('\n').length;
    for(let target = 0; target < n; target++){
      const order = await page.evaluate(d => (JSON.parse(localStorage.getItem(Debugg.stateKey(d)) || '{}').order)
        || DebuggFormats.startOrder(Debugg.puzzleFor(d)), day);
      let pos = order.indexOf(target);
      while(pos > target){
        await page.click('#code .order-row[data-pos="' + pos + '"] .order-move[data-move="-1"]');
        pos--;
      }
    }
    await page.click('#checkOrder');
  }
  else await guess(page, p.display);
  return p;
}
async function miss(page, day = 3){
  const p = await puzzleFor(page, day);
  const f = p.format || 'output';
  if(f === 'choice' || f === 'error'){
    const tried = await page.evaluate(() => [...document.querySelectorAll('#choices .choice:disabled')].map(b => b.dataset.text));
    const wrong = p.options.find(o => o !== p.display && !tried.includes(o));
    await page.click('#choices .choice[data-text="' + wrong.replace(/"/g, '\\"') + '"]');
  }else if(f === 'bug') await page.click('#code .cl[data-line="' + (p.bugLine === 1 ? 2 : 1) + '"]');
  else if(f === 'order') await page.click('#checkOrder');
  else await guess(page, 'definitely not the answer');
  return p;
}

function readJson(page, key){
  return page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
}

module.exports = { dayDate, openAt, fresh, withStorage, puzzleFor, guess, solve, miss, readJson };
