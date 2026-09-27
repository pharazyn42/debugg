// Visitor and gameplay analytics, with GoatCounter (https://www.goatcounter.com): open source,
// no cookies and no personal data, so no consent banner is needed. It counts page views plus
// a few named events (see the list in privacy.html). What players type (answers, sandbox code)
// is never sent.
//
// SITE_COUNT_URL is the site's GoatCounter count address (dashboard: https://debugg.goatcounter.com).
// Leave it '' to switch analytics off. GoatCounter also ignores visits from localhost by itself.
window.DebuggAnalytics = (function(){
  const SITE_COUNT_URL = 'https://debugg.goatcounter.com/count';
  // window.DEBUGG_GOATCOUNTER overrides it: tests set it to '' (off) or to a stand-in.
  const GOATCOUNTER_URL = 'DEBUGG_GOATCOUNTER' in window ? window.DEBUGG_GOATCOUNTER : SITE_COUNT_URL;

  const queue = [];
  let loaded = false;

  if(GOATCOUNTER_URL){
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = GOATCOUNTER_URL;
    s.onload = () => {
      loaded = true;
      queue.splice(0).forEach(send);
    };
    document.head.appendChild(s);
  }

  function send(e){
    if(window.goatcounter && window.goatcounter.count) window.goatcounter.count(e);
  }

  // Records a named event, e.g. 'puzzle/python/day-5/solved-in-2'. Safe to call when analytics
  // is off or blocked: it does nothing.
  function event(path, title){
    if(!GOATCOUNTER_URL) return;
    const e = { path, title: title || path, event: true };
    if(loaded) send(e); else queue.push(e);
  }

  // Every finished daily puzzle: language, day, and how it went.
  document.addEventListener('debugg:puzzle-finished', (ev) => {
    const d = ev.detail || {};
    const day = d.day < 1 ? 'preview' + d.day : 'day-' + d.day;
    const result = d.solved ? 'solved-in-' + d.guesses : 'not-solved';
    event('puzzle/' + d.lang + '/' + day + '/' + result + (d.hintLevel ? '/hints-' + d.hintLevel : ''));
  });

  return { event, enabled: !!GOATCOUNTER_URL };
})();
