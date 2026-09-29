// The words and helpers for each puzzle format (see FORMATS in shared.js and puzzles/README.md): the
// question, how the answer reads, and the seeded shuffles for options and lines. The daily page
// (index.html) does the rest.
window.DebuggFormats = (function(){
  const D = window.Debugg;
  const esc = D.escapeHtml;
  const code = t => '<code>' + esc(t) + '</code>';
  const tries = n => n + (n === 1 ? ' try' : ' tries');

  // A shuffle that's the same for everyone on the same puzzle (seeded by its code).
  function shuffled(list, seed){
    let h = parseInt(D.codeId(seed), 16) || 1;
    const rand = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
    const a = list.slice();
    for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function options(p){ return shuffled(p.options, p.code + '|options'); }
  // The order the lines start in: shuffled, and never already right.
  function startOrder(p){
    const n = p.code.split('\n').length;
    const idx = [...Array(n).keys()];
    for(let k = 0; k < 20; k++){
      const s = shuffled(idx, p.code + '|order' + k);
      if(s.some((v, i) => v !== i)) return s;
    }
    return idx.slice(1).concat(0);
  }

  // { title, sub (plain text), ask (HTML shown above the code, or ''), placeholder }
  function question(p){
    const f = D.formatOf(p), info = D.FORMATS[f];
    const g = info.guesses;
    switch(f){
      case 'choice': return { title: 'What does this print?', sub: 'Pick what it prints. You’ve got ' + tries(g) + '.', ask: '' };
      case 'value': return { title: 'What’s the value of ' + p.ask.name + '?', sub: 'Read the code, then type the value ' + p.ask.name + ' ends up with. You’ve got ' + g + ' guesses.',
        ask: 'What’s the value of ' + code(p.ask.name) + ' when the code finishes?', placeholder: 'the value of ' + p.ask.name };
      case 'count': return { title: 'How many times does it run?', sub: 'Count how many times the marked line runs. You’ve got ' + g + ' guesses.',
        ask: 'How many times does <b>line ' + p.ask.line + '</b> run?', placeholder: 'a number' };
      case 'error': return { title: 'Will it run, or crash?', sub: 'Pick what happens when it runs: fine, or the error it stops with. You’ve got ' + tries(g) + '.',
        ask: 'Does it run fine, or stop with an error?' };
      case 'order': return { title: 'Put the lines in order', sub: 'Arrange the lines so the program prints the target. You’ve got ' + g + ' checks.',
        ask: 'Put the lines in order so it prints:<pre class="ask-out">' + esc(p.display) + '</pre>' };
      case 'bug': return { title: 'Spot the bug', sub: 'It doesn’t print what it should. Tap the line with the bug. You’ve got ' + g + ' guesses.',
        ask: '<span class="ask-row"><span>Should print</span><pre class="ask-out">' + esc(p.expected) + '</pre></span>' +
             '<span class="ask-row"><span>Actually prints</span><pre class="ask-out wrong">' + esc(p.display) + '</pre></span>' };
      default: return { title: 'What does this print?', sub: 'Read the snippet, then guess what it prints. You’ve got ' + g + ' guesses. Fewer guesses and hints earn more XP.', ask: '' };
    }
  }

  // The answer, for the reveal (HTML), and short, for "Correct: …".
  function answerHtml(p){
    switch(D.formatOf(p)){
      case 'value': return code(p.ask.name) + ' ends as ' + code(p.display) + '.';
      case 'count': return 'Line ' + p.ask.line + ' runs ' + code(p.display) + ' time' + (p.display === '1' ? '' : 's') + '.';
      case 'error': return p.display === 'Runs fine' ? 'It runs fine.' : 'It stops with a ' + code(p.display) + '.';
      case 'order': return 'In this order it prints ' + code(p.display) + '.';
      case 'bug': return 'Line ' + p.bugLine + '. Fixed, it reads ' + code(p.fixLine.trim()) + '.';
      default: return code(p.display);
    }
  }
  function answerShort(p){
    switch(D.formatOf(p)){
      case 'order': return 'that’s the order';
      case 'bug': return 'the bug is on line ' + p.bugLine;
      case 'error': return p.display === 'Runs fine' ? 'it runs fine' : p.display;
      default: return p.display;
    }
  }

  return { question, answerHtml, answerShort, options, startOrder, shuffled };
})();
