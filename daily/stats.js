// The daily puzzle's stats, Wordle-style: played, win rate, current and best streak, and how many
// guesses the solves took. Worked out from the saved days (debugg-day<N>), so nothing extra is kept.
// Practice games from the archive have their own saves and don't count.
window.DebuggStats = (function(){
  const D = window.Debugg;

  // Every finished day: [{ slot, solved, guesses, hints }], oldest first.
  function games(){
    const list = [];
    let keys = [];
    try{ keys = Object.keys(localStorage); }catch(e){}
    keys.forEach(k => {
      const m = /^debugg-day(-?\d+)$/.exec(k);
      if(!m) return;
      const s = D.readState(+m[1]);
      if(!s || !(s.solved || s.revealed)) return;
      list.push({ slot: +m[1], solved: !!s.solved, guesses: (s.attempts || []).length, hints: s.hintLevel || 0 });
    });
    return list.sort((a, b) => a.slot - b.slot);
  }

  function readStreak(){
    try{
      const s = JSON.parse(localStorage.getItem('debugg-streak'));
      if(s && typeof s.count === 'number') return s;
    }catch(e){}
    return { count: 0, lastDay: 0 };
  }

  // { played, won, winPct, streak, best, dist: [solves in 1, 2, 3, 4 guesses], noHints }
  function compute(today){
    const list = games();
    const won = list.filter(g => g.solved);
    const dist = [0, 0, 0, 0];
    won.forEach(g => { if(g.guesses >= 1 && g.guesses <= 4) dist[g.guesses - 1]++; });
    // The best run of solved days in a row (the weekend puzzle counts once, as in the streak).
    let best = 0, run = 0, prev = null;
    won.forEach(g => {
      run = prev != null && D.previousSlot(g.slot) === prev ? run + 1 : 1;
      prev = g.slot;
      best = Math.max(best, run);
    });
    const s = readStreak();
    const streak = s.lastDay >= D.previousSlot(today) ? s.count : 0;
    return { played: list.length, won: won.length, winPct: list.length ? Math.round(won.length / list.length * 100) : 0,
             streak, best: Math.max(best, streak), dist, noHints: won.filter(g => !g.hints).length };
  }

  let dialog = null;
  function build(){
    dialog = document.createElement('dialog');
    dialog.className = 'stats';
    dialog.id = 'statsDialog';
    dialog.setAttribute('aria-labelledby', 'statsTitle');
    document.body.appendChild(dialog);
    dialog.addEventListener('click', e => { if(e.target === dialog || e.target.closest('[data-close]')) dialog.close(); });
  }

  // `highlight` is how many guesses today's solve took, to pick out its bar.
  function open(today, highlight){
    if(!dialog) build();
    const st = compute(today);
    const top = Math.max(1, ...st.dist);
    const num = (n, label, id) => '<div class="stat-box"><span class="stat-num" id="' + id + '">' + n + '</span><span class="stat-cap">' + label + '</span></div>';
    dialog.innerHTML =
      '<h2 id="statsTitle">Your stats</h2>' +
      '<div class="stat-boxes">' + num(st.played, 'played', 'statPlayed') + num(st.winPct + '%', 'solved', 'statWin') +
        num(st.streak, 'streak', 'statStreak') + num(st.best, 'best streak', 'statBest') + '</div>' +
      '<p class="section-label">Solved in</p>' +
      '<div class="dist" id="statDist">' + st.dist.map((n, i) =>
        '<div class="dist-row"><span class="dist-n">' + (i + 1) + '</span>' +
        '<span class="dist-bar' + (highlight === i + 1 ? ' today' : '') + '" style="width:' + Math.max(8, Math.round(n / top * 100)) + '%">' + n + '</span></div>').join('') + '</div>' +
      '<p class="stat-foot">' + (st.won ? st.noHints + ' of ' + st.won + ' solved without hints. ' : '') +
        'Missed or revealed: ' + (st.played - st.won) + '.</p>' +
      '<div class="backup-actions"><button class="btn-primary" type="button" data-close>Close</button></div>';
    dialog.showModal();
    if(window.DebuggAnalytics) window.DebuggAnalytics.event('stats/opened');
  }

  return { compute, open };
})();
