// Debuggit Ltd: founding a company. Before a new company starts, the player names it and its
// Director (them) and chooses the Director's look: skin, hair colour and style, facial hair,
// glasses and clothes, with a live preview drawn by the office view (DebuggOffice.portrait). The
// Director card's Edit button opens the same dialog later.
//
//   DebuggFounding.open({ edit, values: { company, director, look }, onDone(values), onCancel() })
//
// values.look is { skin, hair, hairStyle, beard, glasses, shirt } (colours as hex, styles as
// indexes into DebuggOffice.LOOKS). Empty names are left empty: the game shows "Debuggit Ltd" and
// "You" for them. The index page skips this step when window.DEBUGG_FOUNDING is false (tests).
window.DebuggFounding = (function(){
  'use strict';

  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);

  function open(opts){
    const O = window.DebuggOffice;
    const L = O.LOOKS;
    const values = (opts && opts.values) || {};
    const look = Object.assign({}, O.DEFAULT_LOOK, values.look || {});
    const edit = !!(opts && opts.edit);

    // A row of choices: colour swatches, or words.
    const row = (key, legend, items, colours) =>
      '<fieldset class="found-row"><legend>' + legend + '</legend><div class="found-opts">' +
      items.map((it, i) => {
        const value = colours ? it[0] : i, label = colours ? it[1] : it;
        return '<label class="found-opt' + (colours ? ' swatch' : '') + '" title="' + esc(label) + '">' +
          '<input type="radio" name="found-' + key + '" value="' + value + '"' + (String(look[key]) === String(value) ? ' checked' : '') + '>' +
          (colours ? '<span class="chip" style="background:' + value + '"></span><span class="sr">' + esc(label) + '</span>' : '<span>' + esc(label) + '</span>') +
          '</label>';
      }).join('') + '</div></fieldset>';

    const back = document.createElement('div');
    back.className = 'ltd';
    back.innerHTML =
      '<div class="modal-back found-back" id="foundingModal" role="dialog" aria-modal="true" aria-labelledby="foundingTitle">' +
        '<div class="modal founding">' +
          '<h2 id="foundingTitle">' + (edit ? 'Your company' : 'Start your company') + '</h2>' +
          (edit ? '' : '<p class="found-intro">Name your company and yourself, its Director, and choose how you look in the office.</p>') +
          '<div class="found-grid">' +
            '<div class="found-preview"><canvas id="foundingPortrait" aria-hidden="true"></canvas></div>' +
            '<div class="found-fields">' +
              '<label class="found-name">Company name <input id="foundingCompany" maxlength="30" autocomplete="off" placeholder="Debuggit Ltd" value="' + esc(values.company || '') + '"></label>' +
              '<label class="found-name">Your name <input id="foundingDirector" maxlength="24" autocomplete="off" placeholder="You" value="' + esc(values.director || '') + '"></label>' +
              row('skin', 'Skin', L.skin, true) +
              row('hair', 'Hair colour', L.hair, true) +
              row('hairStyle', 'Hair', L.hairStyle, false) +
              row('beard', 'Facial hair', L.beard, false) +
              row('glasses', 'Glasses', L.glasses, false) +
              row('shirt', 'Clothes', L.shirt, true) +
            '</div>' +
          '</div>' +
          '<div class="found-actions">' +
            '<button type="button" class="btn-ghost btn-small" id="foundingRandom">Surprise me</button>' +
            '<span class="found-spacer"></span>' +
            '<button type="button" class="btn-ghost" id="foundingCancel">Cancel</button>' +
            '<button type="button" class="btn-primary" id="foundingStart">' + (edit ? 'Save' : 'Start the company') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(back);
    const $ = id => back.querySelector('#' + id);
    const portrait = $('foundingPortrait');
    const draw = () => O.portrait(portrait, look);

    back.addEventListener('change', e => {
      const m = e.target.name && e.target.name.match(/^found-(\w+)$/);
      if(!m) return;
      look[m[1]] = /^#/.test(e.target.value) ? e.target.value : Number(e.target.value);
      draw();
    });
    $('foundingRandom').addEventListener('click', () => {
      const pick = arr => arr[Math.floor(Math.random() * arr.length)];
      Object.assign(look, {
        skin: pick(L.skin)[0], hair: pick(L.hair)[0], shirt: pick(L.shirt)[0],
        hairStyle: Math.floor(Math.random() * L.hairStyle.length), beard: Math.floor(Math.random() * L.beard.length),
        glasses: Math.floor(Math.random() * L.glasses.length)
      });
      Object.keys(look).forEach(k => back.querySelectorAll('input[name="found-' + k + '"]').forEach(r => { r.checked = String(r.value) === String(look[k]); }));
      draw();
    });
    const close = () => { document.removeEventListener('keydown', onKey); back.remove(); };
    const cancel = () => { close(); if(opts.onCancel) opts.onCancel(); };
    const onKey = e => { if(e.key === 'Escape') cancel(); };
    document.addEventListener('keydown', onKey);
    $('foundingCancel').addEventListener('click', cancel);
    $('foundingStart').addEventListener('click', () => {
      const v = { company: $('foundingCompany').value.trim(), director: $('foundingDirector').value.trim(), look: Object.assign({}, look) };
      close();
      opts.onDone(v);
    });
    draw();
    $('foundingCompany').focus();
  }

  return { open };
})();
