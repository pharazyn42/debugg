// Debugg's JavaScript puzzles. See puzzles/README.md for the fields, and run `npm run check-puzzles`
// after adding one: it runs every snippet and checks it prints the puzzle's answer.
(window.DEBUGG_PUZZLES = window.DEBUGG_PUZZLES || []).push(
  {
    lang: 'javascript',
    difficulty: 2,
    code: `const scores = [10, 9, 1];
scores.sort();
console.log(scores);`,
    flag: { line: 2, text: 'scores.sort()' },
    answers: ['1,10,9'],
    display: '[1, 10, 9]',
    nudge: 'Not quite. How does sort() compare items if you don\'t tell it how?',
    hints: [
      'With no compare function, sort() doesn\'t compare the numbers as numbers. What does it compare?',
      'sort() turns each item into a string and sorts alphabetically, and "10" comes before "9".'
    ],
    explain: 'With no compare function, <code>sort()</code> converts every item to a <b>string</b> and sorts them in dictionary order. As strings, <code>"10"</code> comes before <code>"9"</code> because <code>"1"</code> comes before <code>"9"</code>. So the order is 1, 10, 9.',
    fix: 'Pass a compare function: <code>scores.sort((a, b) =&gt; a - b)</code>.',
    takeaway: '<code>sort()</code> compares items as strings unless you give it a compare function. For numbers use <code>sort((a, b) =&gt; a - b)</code>.'
  },
  {
    lang: 'javascript',
    difficulty: 1,
    code: `const user = null;
console.log(typeof user);`,
    flag: { line: 2, text: 'typeof user' },
    answers: ['object'],
    display: 'object',
    nudge: 'Not quite. typeof has a famous quirk with exactly this value.',
    hints: [
      'This is a well-known quirk of typeof. It isn\'t "null".',
      'typeof null is "object", a leftover from the very first version of JavaScript.'
    ],
    explain: '<code>typeof null</code> is <code>"object"</code>, even though <code>null</code> isn\'t an object. It\'s a bug from JavaScript\'s first version that was never fixed. That\'s why a check like <code>typeof x === "object"</code> lets <code>null</code> through, and the code then crashes on <code>x.name</code>.',
    fix: 'Check for null directly: <code>user === null</code>, or <code>user !== null &amp;&amp; typeof user === "object"</code> for "a real object".',
    takeaway: '<code>typeof null</code> is <code>"object"</code>, a leftover bug from JavaScript’s first version. Check for null with <code>=== null</code>.'
  },
  {
    lang: 'javascript',
    difficulty: 3,
    code: `const price = "5";  // from a form input
const shipping = 2;
console.log(price + shipping - shipping);`,
    flag: { line: 3, text: 'price + shipping' },
    answers: ['50'],
    display: '50',
    nudge: 'Not quite. price is a string. What does + do with a string?',
    hints: [
      'Work left to right. What is "5" + 2 when one side is a string?',
      '"5" + 2 joins them into the string "52". Then - only works on numbers, so "52" - 2 is 50.'
    ],
    explain: 'Work left to right. <code>+</code> with a string <b>joins</b> text, so <code>"5" + 2</code> is <code>"52"</code>. But <code>-</code> only means subtraction, so JavaScript converts <code>"52"</code> to a number: <code>52 - 2</code> is <code>50</code>. Two operators that look like opposites treat strings completely differently.',
    fix: 'Convert input as soon as you read it: <code>const price = Number(input.value);</code>',
    takeaway: '<code>+</code> joins strings, but <code>-</code>, <code>*</code> and <code>/</code> convert to numbers. Convert input with <code>Number()</code> as soon as you read it.'
  },
  {
    lang: 'javascript',
    difficulty: 5,
    code: `const nums = ["1", "7", "11"].map(parseInt);
console.log(nums);`,
    flag: { line: 1, text: 'map(parseInt)' },
    answers: ['1,nan,3'],
    display: '[1, NaN, 3]',
    nudge: 'Not quite. map() passes more than one argument to the function it calls.',
    hints: [
      'map() calls your function with (value, index, array). parseInt takes a second argument too. What is it?',
      'parseInt\'s second argument is the base. So this runs parseInt("1", 0), parseInt("7", 1) and parseInt("11", 2).'
    ],
    explain: '<code>map</code> calls the function with <b>(value, index, array)</b>, and <code>parseInt</code>\'s second argument is the number base. So you get <code>parseInt("1", 0)</code>, which is 1 (base 0 means "work it out"), <code>parseInt("7", 1)</code>, which is NaN (base 1 isn\'t valid), and <code>parseInt("11", 2)</code>, which is 3 (11 in binary).',
    fix: '<code>["1", "7", "11"].map(Number)</code>, or <code>.map(s =&gt; parseInt(s, 10))</code>.',
    takeaway: '<code>map()</code> calls your function with (value, index, array). Only pass a function straight in if it ignores the extra arguments.'
  },
  {
    lang: 'javascript',
    difficulty: 4,
    code: `const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map(f => f()));`,
    flag: { line: 2, text: 'var i = 0' },
    answers: ['3,3,3'],
    display: '[3, 3, 3]',
    nudge: 'Not quite. How many i variables does this loop create?',
    hints: [
      'var creates one variable for the whole function, not one per loop. When do the arrow functions read it?',
      'All three functions share the same i, and they run after the loop, when i has reached 3.'
    ],
    explain: '<code>var</code> creates <b>one</b> <code>i</code> for the whole function. Each arrow function reads <code>i</code> when it\'s <b>called</b>, not when it\'s created. They\'re all called on line 5, after the loop has finished, and the loop only stops once <code>i</code> reaches 3.',
    fix: 'Use <code>let</code>: <code>for (let i = 0; i &lt; 3; i++)</code> gives each loop iteration its own <code>i</code>.',
    takeaway: '<code>var</code> makes one variable for the whole function. <code>let</code> gives each loop iteration its own, so use <code>let</code> in loops.'
  },
  {
    lang: 'javascript',
    difficulty: 4,
    code: `function getConfig() {
  return
  {
    debug: true
  };
}
console.log(getConfig());`,
    flag: { line: 2, text: 'return' },
    answers: ['undefined'],
    display: 'undefined',
    nudge: 'Not quite. Look at what\'s on the same line as return.',
    hints: [
      'JavaScript can add semicolons for you. Where might it add one here?',
      'JavaScript puts a semicolon straight after return, because nothing follows it on that line. The function returns nothing.'
    ],
    explain: 'JavaScript inserts missing semicolons for you, and a line break straight after <code>return</code> ends the statement. So this is really <code>return;</code>, which returns <code>undefined</code>. The <code>{ debug: true }</code> below is never reached. It\'s parsed as a block, not an object.',
    fix: 'Keep the opening brace on the same line: <code>return {</code>.',
    takeaway: 'A line break straight after <code>return</code> ends the statement. Always start the returned value on the same line as <code>return</code>.'
  },
  {
    lang: 'javascript',
    difficulty: 2,
    code: `const input = "0";
if (input == false) {
  console.log("empty");
} else {
  console.log("has value");
}`,
    flag: { line: 2, text: 'input == false' },
    answers: ['empty'],
    display: 'empty',
    nudge: 'Not quite. What does == do when the two sides are different types?',
    hints: [
      '== converts both sides before comparing. What does "0" become? And false?',
      'Both sides become the number 0, so "0" == false is true.'
    ],
    explain: '<code>==</code> converts both sides to the same type before comparing. <code>false</code> becomes 0 and <code>"0"</code> becomes 0, so they\'re equal. That\'s despite <code>"0"</code> being a non-empty string, which counts as true in an <code>if (input)</code>. So a real value gets treated as empty.',
    fix: 'Use <code>===</code>, which never converts: <code>input === ""</code>.',
    takeaway: '<code>==</code> converts types before comparing, with surprising results. Use <code>===</code>, which never converts.'
  },
  {
    lang: 'javascript',
    difficulty: 3,
    code: `// Christmas: month 12, day 25?
const xmas = new Date(2026, 12, 25);
console.log(xmas.getFullYear());`,
    flag: { line: 2, text: '12' },
    answers: ['2027'],
    display: '2027',
    nudge: 'Not quite. What number is January in a JavaScript Date?',
    hints: [
      'Months in JavaScript\'s Date are counted from 0. So which month is 12?',
      'January is 0 and December is 11. Month 12 rolls over into January of the next year.'
    ],
    explain: 'Months in <code>Date</code> run from <b>0 to 11</b>, so 12 is one past December. Instead of raising an error, <code>Date</code> rolls the extra month into the next year, giving 25 January 2027. Days and years are counted normally, which makes this easy to miss.',
    fix: 'Use 11 for December: <code>new Date(2026, 11, 25)</code>, or pass an ISO string like <code>"2026-12-25"</code>.',
    takeaway: '<code>Date</code> months run from 0 (January) to 11 (December), and out-of-range values roll over into the next month or year.'
  },
  {
    lang: 'javascript',
    difficulty: 3,
    code: `const orderId = 9007199254740993;
console.log(orderId);`,
    flag: { line: 1, text: '9007199254740993' },
    answers: ['9007199254740992'],
    display: '9007199254740992',
    nudge: 'Not quite. How big a whole number can a JavaScript number store exactly?',
    hints: [
      'All JavaScript numbers are floating point. Above a certain size, not every whole number can be stored.',
      'Above 2⁵³ (9007199254740992), only every other whole number can be stored, so this one is rounded.'
    ],
    explain: 'Every JavaScript number is a 64-bit float, and whole numbers are only exact up to <b>2⁵³</b> (9007199254740992). Past that, the gaps between numbers you can store grow larger than 1, so <code>9007199254740993</code> gets rounded to the nearest one that fits. No error, just a different number.',
    fix: 'Keep big IDs as strings, or use <code>BigInt</code>: <code>9007199254740993n</code>.',
    takeaway: 'JavaScript numbers are exact only up to 2<sup>53</sup> (<code>Number.MAX_SAFE_INTEGER</code>). Keep bigger IDs as strings, or use <code>BigInt</code>.'
  },
  {
    lang: 'javascript',
    difficulty: 3,
    code: `const user = { name: "Ada", roles: ["admin"] };
const guest = { ...user };
guest.roles.push("guest");
console.log(user.roles);`,
    flag: { line: 2, text: '{ ...user }' },
    answers: ['admin,guest'],
    display: "['admin', 'guest']",
    nudge: 'Not quite. Does spreading copy the roles array, or share it?',
    hints: [
      '{ ...user } makes a new object. But what about the objects and arrays inside it?',
      'Spreading is a shallow copy: guest.roles and user.roles are the same array.'
    ],
    explain: '<code>{ ...user }</code> makes a <b>shallow</b> copy: a new outer object, but its properties still point at the same values. <code>guest.roles</code> is the very same array as <code>user.roles</code>, so pushing to one changes both, and the admin now has a guest role too.',
    fix: 'Copy the nested array too (<code>{ ...user, roles: [...user.roles] }</code>) or deep-copy with <code>structuredClone(user)</code>.',
    takeaway: 'Spread (<code>{ ...obj }</code>) is a shallow copy: nested arrays and objects are still shared. Use <code>structuredClone()</code> for a deep copy.'
  },
  {
    lang: 'javascript',
    difficulty: 2,
    code: `function hasNegative(nums) {
  nums.forEach(n => {
    if (n < 0) return true;
  });
  return false;
}
console.log(hasNegative([3, -1, 2]));`,
    flag: { line: 3, text: 'return true' },
    answers: ['false'],
    display: 'false',
    nudge: 'Not quite. Which function does that return true return from?',
    hints: [
      'That return is inside an arrow function. Does it return from hasNegative?',
      'return true only ends the arrow function for that one item. forEach ignores it, and hasNegative carries on to return false.'
    ],
    explain: 'The <code>return true</code> is inside the <b>arrow function</b>, so it only ends that call, for the item -1. <code>forEach</code> ignores return values and keeps going, then <code>hasNegative</code> reaches its own <code>return false</code>. The negative number was found, and the result was thrown away.',
    fix: 'Use <code>some</code>, which stops at the first match: <code>return nums.some(n =&gt; n &lt; 0);</code>',
    takeaway: '<code>return</code> inside <code>forEach</code> only ends that one callback. To stop early, use <code>some()</code>, <code>find()</code> or a <code>for...of</code> loop.'
  }
);
