// Past puzzles: every earlier day, newest first, with how you did on the day and a link to play it
// again as practice (index.html?day=N). Practice games are saved apart (debuggit-daily-practice-day<N>) and
// earn no XP, streak or company pay. Before Day 1 it lists the last two weeks of preview days.
window.DebuggArchive = (function(){
  const D = window.Debugg;
  const PREVIEW_DAYS = 14;

  function read(key){ try{ return JSON.parse(localStorage.getItem(key)); }catch(e){ return null; } }
  function result(s){
    if(!s || !(s.solved || s.revealed)) return null;
    const n = (s.attempts || []).length;
    return s.solved ? 'solved in ' + n : 'missed';
  }
  function dateOf(day){
    const d = D.launchDate();
    d.setDate(d.getDate() + day - 1);
    return d;
  }
  // The past slots to list, newest first.
  function slots(today){
    const first = today >= 1 ? 1 : D.slotDay(today - PREVIEW_DAYS);
    const list = [];
    for(let d = D.previousSlot(today); d >= first; d = D.previousSlot(d)) list.push(d);
    return list;
  }

  let dialog = null;
  function build(){
    dialog = document.createElement('dialog');
    dialog.className = 'archive';
    dialog.id = 'archiveDialog';
    dialog.setAttribute('aria-labelledby', 'archiveTitle');
    document.body.appendChild(dialog);
    dialog.addEventListener('click', e => { if(e.target === dialog || e.target.closest('[data-close]')) dialog.close(); });
  }

  function open(today){
    if(!dialog) build();
    const rows = slots(today).map(day => {
      const p = D.puzzleFor(day);
      const real = result(D.readState(day)), practice = result(read(window.Debugg.KEYS.daily.practicePrefix + day));
      const when = dateOf(day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      const name = (D.isPreview(day) ? 'Preview' : D.dayLabel(day)) + ' · ' + when;
      const status = real ? (real === 'missed' ? 'Missed on the day' : 'Solved on the day in ' + real.split(' ').pop())
                          : 'Not played';
      return '<li class="archive-row' + (real && real !== 'missed' ? ' solved' : '') + '" data-day="' + day + '">' +
        '<div><span class="archive-name">' + name + '</span>' +
        '<span class="archive-meta">' + D.dayTitle(day) + ' · ' + D.LANG_INFO[p.lang].name + ' · ' + status +
          (practice ? ' · practice: ' + practice : '') + '</span></div>' +
        '<a class="btn-ghost btn-small" href="index.html?day=' + day + '">' + (practice || real ? 'Play again' : 'Play') + '</a></li>';
    });
    dialog.innerHTML = '<h2 id="archiveTitle">Past puzzles</h2>' +
      '<p>Play any earlier day for practice. Practice earns no XP, streak or company pay, and your result on the day stays as it was.</p>' +
      (rows.length ? '<ol class="archive-list" id="archiveList">' + rows.join('') + '</ol>' : '<p id="archiveEmpty">No past puzzles yet. Come back tomorrow.</p>') +
      '<div class="backup-actions"><button class="btn-primary" type="button" data-close>Close</button></div>';
    dialog.showModal();
    if(window.DebuggAnalytics) window.DebuggAnalytics.event('archive/opened');
  }

  return { open, slots };
})();
