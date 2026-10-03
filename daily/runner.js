// Runs Python for the weekend code challenges ("make it pass"): the player's code and a list of tests,
// on Pyodide in a Web Worker, so a runaway loop can be stopped without freezing the page. Pyodide
// (about 13 MB the first time, then usually from the browser cache) loads only when a challenge
// opens. The worker is kept between runs, and thrown away when a run is stopped.
//
// A test is [call, want]: `call` is a Python expression, run after the player's code in the same
// globals, and it passes when repr() of its value is exactly `want`. Tests run in order, so state
// left over from one (a mutable default, say) shows in the next, as it would in a real program.
//
// HARNESS is also run by tools/check-puzzles.js with real Python, so the checker and the page
// judge a challenge the same way.
window.DebuggRunner = (function(){
  // window.DEBUGG_PYODIDE_URL lets tests point this at a local copy (as the sandbox does).
  const PYODIDE_URL = window.DEBUGG_PYODIDE_URL || 'https://cdn.jsdelivr.net/npm/pyodide@314.0.7/';
  const TIME_LIMIT = 10000;

  const HARNESS = `
import io, json, sys, traceback
def _debugg_tests(src, tests):
    buf = io.StringIO()
    old = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = buf
    g = {"__name__": "__main__"}
    res = {"error": None, "results": []}
    try:
        try:
            exec(compile(src, "main.py", "exec"), g)
        except BaseException as e:
            res["error"] = "".join(traceback.format_exception_only(type(e), e)).strip()
        if res["error"] is None:
            for call, want in tests:
                try:
                    got = repr(eval(call, g))
                    res["results"].append({"ok": got == want, "got": got})
                except BaseException as e:
                    res["results"].append({"ok": False, "got": type(e).__name__ + (": " + str(e) if str(e) else "")})
    finally:
        sys.stdout, sys.stderr = old
    res["printed"] = buf.getvalue()[:4000]
    return json.dumps(res)
`;

  // A module worker, because Pyodide no longer supports classic ones. Made from a Blob, so the page
  // still works when opened straight from disk.
  const WORKER = `
let py = null;
onmessage = async (e) => {
  const { code, tests, indexURL, harness } = e.data;
  try{
    if(!py){
      postMessage({ type: 'loading' });
      const { loadPyodide } = await import(indexURL + 'pyodide.mjs');
      py = await loadPyodide({ indexURL });
      py.setStdin({ error: true });
      py.runPython(harness);
    }
  }catch(err){
    postMessage({ type: 'fatal', text: String(err && err.message || err) });
    return;
  }
  postMessage({ type: 'started' });
  const out = py.globals.get('_debugg_tests')(code, py.toPy(tests));
  postMessage({ type: 'done', result: JSON.parse(out) });
};
`;

  let worker = null, workerUrl = null;
  function getWorker(){
    if(!workerUrl) workerUrl = URL.createObjectURL(new Blob([WORKER], { type: 'text/javascript' }));
    if(!worker) worker = new Worker(workerUrl, { type: 'module' });
    return worker;
  }

  // Runs `code`, then each test. Resolves to one of
  //   { error, results: [{ ok, got }], printed }   (error: the exception the code itself raised, or null)
  //   { timedOut: true }                             (still running after TIME_LIMIT; Python is reloaded next time)
  //   { fatal: message }                             (Pyodide couldn't load)
  // `onLoading` is called if Python has to load first.
  // Runs queue up, one at a time.
  let queue = Promise.resolve();
  function runTests(code, tests, { onLoading } = {}){
    const run = queue.then(() => new Promise(resolve => {
      const w = getWorker();
      let timer = null;
      const finish = r => { clearTimeout(timer); w.onmessage = null; resolve(r); };
      w.onmessage = e => {
        const m = e.data;
        if(m.type === 'loading'){ if(onLoading) onLoading(); return; }
        if(m.type === 'started'){
          timer = setTimeout(() => { w.terminate(); worker = null; finish({ timedOut: true }); }, TIME_LIMIT);
          return;
        }
        if(m.type === 'fatal'){ w.terminate(); worker = null; finish({ fatal: m.text }); return; }
        if(m.type === 'done') finish(m.result);
      };
      w.postMessage({ code, tests, indexURL: PYODIDE_URL, harness: HARNESS });
    }));
    queue = run;
    return run;
  }

  // Starts Python loading in the background, so the first run is quicker. Runs nothing.
  function warm(){
    if(worker) return;
    runTests('', []);
  }

  return { runTests, warm, HARNESS, TIME_LIMIT };
})();
