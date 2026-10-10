// The What's new page's reader: shows one product's changelog to players (see "Releases" in CLAUDE.md).
// A page sets window.WHATSNEW first, then loads shared.js and this file.
// Shows a list of changes (see "Releases" in CLAUDE.md) with a small Markdown reader: headings,
// lists, paragraphs, **bold**, `code` and [links](…). Each product has its own page (whatsnew.html,
// ltd/whatsnew.html, learn/whatsnew.html), its own changelog and its own versions; this reader is
// shared, and a product's repo keeps a copy.
//
// The changelogs are the developer log, in full. What players see is curated (see "Releases" in
// CLAUDE.md): while the demo runs (0.0.x, before any 0.1.0) every section is shown; after that only
// the <!-- player --> … <!-- /player --> block of a section, which every minor release (0.1.0,
// 0.2.0…) has, and a patch has only when players would notice the fix.
(function(){
  const D = window.Debugg;
  // Each product has its own What's new page, which says which product it is:
  //   window.WHATSNEW = { product: 'daily' | 'ltd' | 'learn', log: 'CHANGELOG.md' (relative to the page), root: '' }
  const CFG = window.WHATSNEW || {};
  const product = CFG.product || 'daily';
  const P = D.PRODUCTS[product];
  const VERSION = P.version;
  const esc = D.escapeHtml;
  function inline(text){
    return esc(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+|[\w./#?=&-]+)\)/g, '<a href="$2">$1</a>');
  }
  const versionOf = t => { const m = /^(\d+)\.(\d+)\.(\d+)/.exec(t); return m && m.slice(1).map(Number); };
  const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  const BLOCK = /<!--\s*player\s*-->([\s\S]*?)<!--\s*\/player\s*-->/g;
  // The markdown players see, and the version to mark "you're here" (the newest one shown that isn't
  // newer than this one, as a hidden patch isn't listed).
  function playerView(md){
    const parts = md.split(/^## /m);
    const sections = parts.slice(1).map(p => {
      const i = p.indexOf('\n');
      return { title: p.slice(0, i).trim(), body: p.slice(i + 1) };
    });
    const launched = sections.some(s => { const v = versionOf(s.title); return v && (v[0] > 0 || v[1] > 0); });
    const mine = versionOf(VERSION);
    let here = null;
    const kept = [];
    sections.forEach(sec => {
      const v = versionOf(sec.title);
      if(!v) return kept.push({ sec, text: sec.body });  // "Unreleased" and the like are handled by render()
      const demo = v[0] === 0 && v[1] === 0;
      const blocks = [...sec.body.matchAll(BLOCK)].map(m => m[1].trim());
      const text = demo && !launched ? sec.body.replace(BLOCK, '$1') : blocks.join('\n\n');
      if(text.trim()) kept.push({ sec, text, v });
    });
    kept.filter(k => k.v && mine && cmp(k.v, mine) <= 0).forEach(k => { if(!here || cmp(k.v, here) > 0) here = k.v; });
    return { md: parts[0] + kept.map(k => '## ' + k.sec.title + '\n\n' + k.text.trim() + '\n').join('\n'),
             here: here && here.join('.') };
  }
  function render(md, here){
    const out = [];
    let list = null, para = [];
    const flush = () => {
      if(para.length){ out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
      if(list){ out.push('<ul>' + list.map(li => '<li>' + inline(li) + '</li>').join('') + '</ul>'); list = null; }
    };
    let skipping = false;  // "Unreleased" is for the dev site's notes, not players
    let intro = true;      // the note about version numbers above the first version is for developers
    md.split('\n').forEach(line => {
      const h = /^(#{1,3}) (.*)$/.exec(line);
      if(h && h[1].length === 2) intro = false;
      if(intro) return;
      if(h && h[1].length <= 2) skipping = h[1].length === 2 && /^unreleased/i.test(h[2]);
      if(skipping) return;
      const li = /^\s*[-*] (.*)$/.exec(line);
      if(h){
        flush();
        if(h[1].length === 1) return;  // the file's own title; the page has one
        const level = h[1].length;
        const text = h[2];
        const current = level === 2 && text.startsWith(here + ' ');
        out.push('<h' + level + '>' + inline(text) + (current ? '<span class="current">you’re here</span>' : '') + '</h' + level + '>');
      }else if(li){
        if(para.length) flush();
        (list = list || []).push(li[1]);
      }else if(!line.trim()){
        flush();
      }else if(list && /^\s{2,}\S/.test(line)){
        list[list.length - 1] += ' ' + line.trim();
      }else{
        if(list) flush();
        para.push(line.trim());
      }
    });
    flush();
    return out.join('\n');
  }
  fetch(CFG.log || P.log, { cache: 'no-cache' })
    .then(r => { if(!r.ok) throw new Error(r.status); return r.text(); })
    .then(md => { const view = playerView(md); document.getElementById('notes').innerHTML = render(view.md, view.here); })
    .catch(() => { document.getElementById('notes').innerHTML = '<p>The list of changes couldn’t load. Try again in a moment.</p>'; });
  D.markVersionSeen(product);
  D.renderVersion(document.getElementById('appVersion'), CFG.root || '', product);
})();
