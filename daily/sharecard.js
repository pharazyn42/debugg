// The share card: the day's result as a 1200×630 picture, with the duck, the wordmark, a square
// per guess and no spoilers. Drawn on a canvas, then shared as a file (phones) or downloaded.
window.DebuggShareCard = (function(){
  const W = 1200, H = 630;
  const C = { bg: '#131417', panel: '#1b1d22', line: '#2b2e36', text: '#e8e9ec', dim: '#9498a3', faint: '#5f6470',
              amber: '#f2b84b', green: '#4fd18b', greenDim: '#1f4a35', red: '#ef6a6a', redDim: '#4a2222' };
  const SANS = "'Sora', system-ui, sans-serif", MONO = "'JetBrains Mono', ui-monospace, monospace";

  function loadDuck(src){
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }
  function roundRect(g, x, y, w, h, r){
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  // A tick or a cross drawn as strokes, so it looks the same everywhere (no emoji fonts).
  function mark(g, kind, cx, cy, s){
    g.lineWidth = s * 0.14;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    if(kind === 'correct'){
      g.strokeStyle = C.green;
      g.moveTo(cx - s * 0.3, cy);
      g.lineTo(cx - s * 0.08, cy + s * 0.22);
      g.lineTo(cx + s * 0.32, cy - s * 0.24);
    }else{
      g.strokeStyle = C.red;
      g.moveTo(cx - s * 0.24, cy - s * 0.24);
      g.lineTo(cx + s * 0.24, cy + s * 0.24);
      g.moveTo(cx + s * 0.24, cy - s * 0.24);
      g.lineTo(cx - s * 0.24, cy + s * 0.24);
    }
    g.stroke();
  }

  // r: { wordmark, title ("Day 3 · Wednesday · Python"), attempts: ['wrong', 'correct'], max, hints,
  //      solved, result ("Debugged it in 2"), site, duck (image URL) }. Resolves to a canvas.
  async function draw(r){
    if(document.fonts && document.fonts.load){
      try{ await Promise.all([document.fonts.load('600 40px Sora'), document.fonts.load('500 40px "JetBrains Mono"')]); }catch(e){}
    }
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');
    g.fillStyle = C.bg;
    g.fillRect(0, 0, W, H);
    roundRect(g, 40, 40, W - 80, H - 80, 28);
    g.fillStyle = C.panel;
    g.fill();
    g.strokeStyle = C.line;
    g.lineWidth = 2;
    g.stroke();

    const duck = await loadDuck(r.duck || 'img/duck.svg');
    if(duck) g.drawImage(duck, 90, 80, 120, 120);
    g.textBaseline = 'middle';
    g.fillStyle = C.amber;
    g.font = '600 54px ' + MONO;
    g.fillText(r.wordmark, 230, 128);
    g.fillStyle = C.dim;
    g.font = '500 30px ' + SANS;
    g.fillText(r.title, 232, 182);

    // A square per guess: green right, red wrong, empty unused.
    const size = 118, gap = 22, top = 250;
    for(let i = 0; i < r.max; i++){
      const x = 92 + i * (size + gap);
      const a = r.attempts[i];
      roundRect(g, x, top, size, size, 18);
      g.fillStyle = a === 'correct' ? C.greenDim : a === 'wrong' ? C.redDim : C.bg;
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = a === 'correct' ? C.green : a === 'wrong' ? C.red : C.line;
      g.stroke();
      if(a) mark(g, a, x + size / 2, top + size / 2, size);
    }
    if(r.hints){
      g.fillStyle = C.amber;
      g.font = '500 28px ' + SANS;
      g.fillText('+ ' + r.hints + (r.hints === 1 ? ' hint' : ' hints'), 92 + r.max * (size + gap) + 4, top + size / 2);
    }

    g.fillStyle = r.solved ? C.text : C.dim;
    g.font = '700 50px ' + SANS;
    g.fillText(r.result, 92, 450);
    g.fillStyle = C.faint;
    g.font = '500 26px ' + MONO;
    g.fillText(r.site.replace(/^https?:\/\//, ''), 92, 530);
    g.textAlign = 'right';
    g.fillStyle = C.dim;
    g.font = '500 26px ' + SANS;
    g.fillText('Read the code. Guess what it prints.', W - 92, 530);
    g.textAlign = 'left';
    return canvas;
  }

  function toBlob(canvas){
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  // Shares the picture where the device can share files (phones), otherwise downloads it.
  // Resolves to 'shared', 'downloaded' or 'cancelled'.
  async function share(r, filename){
    const blob = await toBlob(await draw(r));
    const file = new File([blob], filename, { type: 'image/png' });
    if(navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches){
      try{
        await navigator.share({ files: [file] });
        return 'shared';
      }catch(err){
        if(err && err.name === 'AbortError') return 'cancelled';
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    return 'downloaded';
  }

  return { draw, share, W, H };
})();
