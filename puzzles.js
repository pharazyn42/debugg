// Debugg puzzle data. Each language has its own daily puzzle, and the calendar in shared.js picks
// it: each day takes the first unused puzzle (in the order they appear here) with that weekday's
// difficulty, and once a language's puzzles have all been used they start over.
// Loaded with a plain <script> tag (not fetch) so index.html still works when opened straight from disk.
//
// Fields:
//   lang       language key: 'python' or 'javascript' (see LANGS in shared.js)
//   difficulty 1 (warm-up) to 5 (hard); the calendar gives Mondays 1 up to Fridays 5 (see shared.js)
//   code       the snippet; the last line is the print the player has to predict
//   flag       { line, text } marks the buggy bit, underlined once the game ends
//   answers    accepted guesses; compared after normalising (case, spaces, quotes and brackets ignored)
//   display    the exact output, as shown to the player
//   nudge      feedback after a wrong guess
//   hints      two hints, gentle then strong
//   explain    why it prints what it does (HTML)
//   fix        how to write it properly (HTML)
//   takeaway   the general rule to remember, in a sentence or two (HTML)
window.DEBUGG_PUZZLES = [
  {
    lang: 'python',
    difficulty: 3,
    code: `def add_item(item, lst=[]):
    lst.append(item)
    return lst

add_item(1)
print(add_item(2))`,
    flag: { line: 1, text: 'lst=[]' },
    answers: ['1,2'],
    display: '[1, 2]',
    nudge: 'Not quite. Think about when that default list gets created.',
    hints: [
      'Look closely at lst=[] in the function signature. How many times does that line actually run?',
      'A default argument value is created once, when the function is defined, not fresh on every call. So the list from the first call is still there when the second call runs.'
    ],
    explain: 'Default argument values are evaluated <b>once</b>, when the function is defined, not on every call. Since <code>lst=[]</code> is only created a single time, the list from the first call (line 5) is still there when the second call runs, so it grows instead of starting fresh.',
    fix: 'Use <code>lst=None</code> and create the list inside the function: <code>if lst is None: lst = []</code>.',
    takeaway: 'Default values are created once, when the function is defined. Never use a mutable default like <code>[]</code> or <code>{}</code>: default to <code>None</code> and create it inside.'
  },
  {
    lang: 'python',
    difficulty: 2,
    code: `total = 0.1 + 0.2
print(total == 0.3)`,
    flag: { line: 2, text: 'total == 0.3' },
    answers: ['false'],
    display: 'False',
    nudge: 'Not quite. How exactly can a computer store 0.1?',
    hints: [
      'Computers store decimals in binary. Can 0.1 be written exactly in binary?',
      '0.1 + 0.2 actually comes out as 0.30000000000000004, so it isn\'t equal to 0.3.'
    ],
    explain: 'Floats are stored in binary, and 0.1, 0.2 and 0.3 have no exact binary form, just like 1/3 has no exact decimal form. Each is stored as the nearest value that fits, and the tiny errors don\'t cancel out: <code>0.1 + 0.2</code> is <code>0.30000000000000004</code>.',
    fix: 'Compare with a tolerance: <code>math.isclose(total, 0.3)</code>. For money, use <code>decimal.Decimal</code> or whole cents.',
    takeaway: 'Floats are close approximations, so never compare them with <code>==</code>. Use <code>math.isclose()</code>, or <code>Decimal</code> for money.'
  },
  {
    lang: 'python',
    difficulty: 1,
    code: `total = 0
for day in range(1, 7):  # every day of the week
    total += day
print(total)`,
    flag: { line: 2, text: 'range(1, 7)' },
    answers: ['21'],
    display: '21',
    nudge: 'Not quite. Which days does that loop actually visit?',
    hints: [
      'Does range(1, 7) include the 7?',
      'range stops before its end value, so this loop only adds 1 to 6.'
    ],
    explain: '<code>range(1, 7)</code> gives 1, 2, 3, 4, 5, 6. The end value is <b>excluded</b>, so the loop covers six days, not seven: 1 + 2 + 3 + 4 + 5 + 6 = 21. The comment says one thing, the code does another.',
    fix: 'Use <code>range(1, 8)</code>, or loop over the thing itself (<code>for day in week:</code>) so there\'s no end value to get wrong.',
    takeaway: '<code>range(start, stop)</code> includes <code>start</code> but stops before <code>stop</code>: <code>range(1, 7)</code> is 1 to 6.'
  },
  {
    lang: 'python',
    difficulty: 1,
    code: `def verify(hash_ok, sig_ok):
    if not hash_ok:
        return "fail"
    return "ok"
    if not sig_ok:
        return "fail"

print(verify(True, False))`,
    flag: { line: 4, text: 'return "ok"' },
    answers: ['ok'],
    display: 'ok',
    nudge: 'Not quite. Follow the function line by line. Does it reach the signature check?',
    hints: [
      'The signature is bad (sig_ok is False). Trace the function from the top: which return runs first?',
      'Line 4 returns "ok" unconditionally, so the signature check below it never runs.'
    ],
    explain: 'The hash is fine, so line 2\'s check passes. Line 4 then returns <code>"ok"</code> no matter what, and nothing after a <code>return</code> runs. The signature check on lines 5 and 6 is dead code, so a bad signature gets approved.',
    fix: 'Move <code>return "ok"</code> to the end, after every check. Many linters flag code after a return as unreachable.',
    takeaway: 'Nothing after a <code>return</code> runs. Do every check first, and return success last.'
  },
  {
    lang: 'python',
    difficulty: 4,
    code: `grid = [[0] * 3] * 3
grid[0][0] = 1
print(grid)`,
    flag: { line: 1, text: '[[0] * 3] * 3' },
    answers: ['1,0,0,1,0,0,1,0,0'],
    display: '[[1, 0, 0], [1, 0, 0], [1, 0, 0]]',
    nudge: 'Not quite. How many separate rows does that grid really have?',
    hints: [
      'The outer * 3 repeats something. Does it copy the row, or repeat a reference to the same row?',
      'All three rows are the same list object, so changing one "row" changes all of them.'
    ],
    explain: 'Multiplying a list repeats its <b>references</b>, not copies of what\'s inside. <code>[[0] * 3] * 3</code> builds one row and puts it in the grid three times. Setting <code>grid[0][0]</code> changes that one shared row, so every row shows the change.',
    fix: 'Build a new row each time: <code>grid = [[0] * 3 for _ in range(3)]</code>.',
    takeaway: 'Multiplying a list repeats references to the same item. Build nested lists with a comprehension: <code>[[0] * 3 for _ in range(3)]</code>.'
  },
  {
    lang: 'python',
    difficulty: 4,
    code: `print(round(0.5) + round(1.5) + round(2.5))`,
    flag: { line: 1, text: 'round(2.5)' },
    answers: ['4'],
    display: '4',
    nudge: 'Not quite. Check how Python rounds numbers that end in exactly .5.',
    hints: [
      'Python doesn\'t always round .5 up. Try each round() on its own.',
      'Python rounds exact halves to the nearest even number: round(0.5) is 0, round(1.5) is 2, round(2.5) is 2.'
    ],
    explain: 'Python 3 uses <b>round half to even</b> (also called banker\'s rounding): an exact .5 goes to whichever neighbour is even. So <code>round(0.5)</code> is 0, <code>round(1.5)</code> is 2 and <code>round(2.5)</code> is 2, for a total of 4, not the 6 you\'d get by always rounding up.',
    fix: 'If you need halves to always round up, use <code>decimal.Decimal</code> with <code>ROUND_HALF_UP</code>. Otherwise, half-to-even is usually what you want.',
    takeaway: 'Python rounds exact halves to the even number (banker’s rounding): <code>round(2.5)</code> is 2 and <code>round(3.5)</code> is 4.'
  },
  {
    lang: 'python',
    difficulty: 1,
    code: `name = "debugg"
name.upper()
print(name)`,
    flag: { line: 2, text: 'name.upper()' },
    answers: ['debugg'],
    display: 'debugg',
    nudge: 'Not quite. Where does the result of upper() go?',
    hints: [
      'Strings can\'t be changed in place. So what does upper() do with its result?',
      'upper() returns a new, uppercase string, and line 2 throws it away. name is unchanged.'
    ],
    explain: 'Python strings are <b>immutable</b>: no method can change them in place. <code>name.upper()</code> builds a new string <code>"DEBUGG"</code> and returns it, but nothing stores it. <code>name</code> still points at the original lowercase string.',
    fix: 'Keep the result: <code>name = name.upper()</code>.',
    takeaway: 'Strings can’t be changed in place. String methods return a new string, so keep the result: <code>name = name.upper()</code>.'
  },
  {
    lang: 'python',
    difficulty: 2,
    code: `def is_leap(year):
    return year % 4 == 0

print(is_leap(1900))`,
    flag: { line: 2, text: 'year % 4 == 0' },
    answers: ['true'],
    display: 'True',
    nudge: 'Not quite. Don\'t ask whether 1900 was a leap year. Ask what this code thinks.',
    hints: [
      'You\'re predicting what the code prints, not the right answer. Is 1900 divisible by 4?',
      '1900 % 4 is 0, so the function says True, even though 1900 wasn\'t actually a leap year.'
    ],
    explain: '1900 divides evenly by 4, so the function returns <code>True</code>. But the real rule has two more steps: century years are only leap years if they also divide by 400. So 2000 was a leap year, but 1900 wasn\'t.',
    fix: '<code>return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)</code>, or use <code>calendar.isleap(year)</code>.',
    takeaway: 'A year is a leap year if it divides by 4, except century years, which must also divide by 400. Or use <code>calendar.isleap()</code>.'
  },
  {
    lang: 'python',
    difficulty: 4,
    code: `nums = [1, 2, 2, 3]
for n in nums:
    if n == 2:
        nums.remove(n)
print(nums)`,
    flag: { line: 4, text: 'nums.remove(n)' },
    answers: ['1,2,3'],
    display: '[1, 2, 3]',
    nudge: 'Not quite. What happens to the loop\'s position when the list shrinks under it?',
    hints: [
      'The loop walks through positions 0, 1, 2… What happens to the item after the one you remove?',
      'Removing the first 2 shifts the second 2 into its spot, and the loop moves past that spot without ever checking it.'
    ],
    explain: 'The loop tracks its <b>position</b> in the list. At position 1 it finds a 2 and removes it, so everything shifts left: the second 2 moves into position 1. The loop then moves on to position 2, which is now the 3. The second 2 is never checked.',
    fix: 'Build a new list instead of changing the one you\'re looping over: <code>nums = [n for n in nums if n != 2]</code>.',
    takeaway: 'Don’t add or remove items in a list while looping over it. Build a new list instead, or loop over a copy (<code>nums[:]</code>).'
  },
  {
    lang: 'python',
    difficulty: 3,
    code: `minutes_late = -7
print(minutes_late // 2)`,
    flag: { line: 2, text: '// 2' },
    answers: ['-4'],
    display: '-4',
    nudge: 'Not quite. Which way does // round when the number is negative?',
    hints: [
      '-7 / 2 is -3.5. Does // round that toward zero, or down?',
      'Python\'s // always rounds down (toward negative infinity), and down from -3.5 is -4.'
    ],
    explain: '<code>//</code> is <b>floor</b> division: it rounds down to the next whole number. For positive numbers that looks like chopping off the decimals, but for negatives "down" means further from zero: -3.5 becomes -4, not -3.',
    fix: 'If you want to round toward zero, use <code>int(minutes_late / 2)</code> or <code>math.trunc</code>.',
    takeaway: '<code>//</code> rounds down, towards minus infinity, not towards zero. For negative numbers that means further from zero.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])`,
    flag: { line: 1, text: 'lambda: i' },
    answers: ['2,2,2'],
    display: '[2, 2, 2]',
    nudge: 'Not quite. When does each lambda look up i: when it\'s created, or when it\'s called?',
    hints: [
      'A lambda doesn\'t save the value of i. It looks i up when it runs. When do these run?',
      'All three lambdas run after the loop has finished, and by then i is 2.'
    ],
    explain: 'The lambdas don\'t save i\'s value. They look it up <b>when called</b> (this is called late binding). All three are called on line 2, after the loop has finished, and by then i is 2. So each one returns 2.',
    fix: 'Capture the current value with a default argument: <code>lambda i=i: i</code>.',
    takeaway: 'A lambda or inner function looks variables up when it runs, not when it’s made. Capture the current value with a default: <code>lambda i=i: i</code>.'
  },
  {
    lang: 'python',
    difficulty: 2,
    code: `print("10" > "9")`,
    flag: { line: 1, text: '"10" > "9"' },
    answers: ['false'],
    display: 'False',
    nudge: 'Not quite. Those are strings, not numbers. How do strings compare?',
    hints: [
      'Strings are compared character by character, like words in a dictionary. What\'s the first character of each?',
      '"1" comes before "9", so "10" sorts before "9" and isn\'t greater.'
    ],
    explain: 'Strings compare <b>character by character</b>, like words in a dictionary. The first characters are "1" and "9", and "1" comes first, so the comparison is decided there: <code>"10"</code> is less than <code>"9"</code>. The numbers they look like don\'t matter.',
    fix: 'Convert first: <code>int("10") > int("9")</code>.',
    takeaway: 'Strings compare character by character, like words in a dictionary, not by the numbers they contain. Convert with <code>int()</code> first.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `d = {1: "int", 1.0: "float", True: "bool"}
print(d)`,
    flag: { line: 1, text: 'True: "bool"' },
    answers: ['1:bool'],
    display: "{1: 'bool'}",
    nudge: 'Not quite. Are those three keys really different?',
    hints: [
      'Try 1 == 1.0 and 1 == True. A dict treats keys that are equal as the same key.',
      'All three keys count as the same key. The first one\'s spelling (1) is kept, and the last value ("bool") wins.'
    ],
    explain: '<code>1</code>, <code>1.0</code> and <code>True</code> are all equal and have the same hash, so the dict treats them as <b>one key</b>. Each later entry overwrites the value, but the dict keeps the key from the first entry. You end up with key <code>1</code> and value <code>"bool"</code>.',
    fix: 'Don\'t mix numbers and booleans as keys. If you really need them apart, use strings or tuples like <code>("bool", True)</code>.',
    takeaway: 'Dict keys that are equal are the same key, and in Python <code>True == 1 == 1.0</code>.'
  },
  {
    lang: 'python',
    difficulty: 4,
    code: `def save():
    try:
        return "saved"
    finally:
        return "cancelled"

print(save())`,
    flag: { line: 5, text: 'return "cancelled"' },
    answers: ['cancelled'],
    display: 'cancelled',
    nudge: 'Not quite. Does the finally block run after try has already returned?',
    hints: [
      'A finally block always runs, even after a return in the try block. What does this one do?',
      'The return in finally replaces the return from try, so "saved" is thrown away.'
    ],
    explain: '<code>finally</code> <b>always</b> runs, even after <code>try</code> has returned. The try block gets ready to return <code>"saved"</code>, then finally runs and returns <code>"cancelled"</code> instead, which replaces it. If the try block had raised an exception, the return in finally would have silently swallowed that too.',
    fix: 'Never <code>return</code> from a <code>finally</code> block. Use finally only for cleanup, like closing files.',
    takeaway: '<code>finally</code> always runs, and a <code>return</code> inside it replaces any other result, even an exception. Use <code>finally</code> only for clean-up.'
  },
  // The next four came from Debugg Ltd's original desk.
  {
    lang: 'python',
    difficulty: 3,
    code: `total = 0.1 + 0.2
print(round(total, 2) == 0.3)`,
    flag: { line: 2, text: 'round(total, 2)' },
    answers: ['true'],
    display: 'True',
    nudge: 'Not quite. What does rounding to 2 places do to 0.30000000000000004?',
    hints: [
      '0.1 + 0.2 is 0.30000000000000004. What is that rounded to 2 decimal places?',
      'Rounded to 2 places it becomes 0.3, the very same float as the literal 0.3, so they compare equal.'
    ],
    explain: '<code>0.1 + 0.2</code> is <code>0.30000000000000004</code>, but <code>round(total, 2)</code> gives the float closest to 0.30, which is exactly the same float Python uses for the literal <code>0.3</code>. So this comparison is <code>True</code>. Rounding hid the error this time, but it isn\'t a general fix.',
    fix: 'Compare with a tolerance (<code>math.isclose(total, 0.3)</code>), or use <code>decimal.Decimal</code> for money. Rounding can still surprise you: <code>round(2.675, 2)</code> is 2.67, because 2.675 is stored as slightly less than 2.675.',
    takeaway: 'Rounding can hide a float error but doesn’t remove it. Compare floats with <code>math.isclose()</code>.'
  },
  {
    lang: 'python',
    difficulty: 1,
    code: `quantity = "3"  # from input()
print(quantity * 2)`,
    flag: { line: 2, text: 'quantity * 2' },
    answers: ['33'],
    display: '33',
    nudge: 'Not quite. quantity is a string. What does * do to a string?',
    hints: [
      'input() always gives you a string. What happens when you multiply a string by a number?',
      'Multiplying a string repeats it: "3" * 2 is "33", not 6.'
    ],
    explain: '<code>quantity</code> is the <b>string</b> <code>"3"</code>, not the number 3, because <code>input()</code> always returns text. Multiplying a string by a whole number repeats it, so <code>"3" * 2</code> is <code>"33"</code>. No error, just the wrong answer.',
    fix: 'Convert the input first: <code>quantity = int(input())</code>.',
    takeaway: '<code>input()</code> always returns a string. Convert it with <code>int()</code> or <code>float()</code> before doing maths.'
  },
  {
    lang: 'python',
    difficulty: 2,
    code: `nums = [10, 20, 30, 40, 50]
print(nums[1:-1])`,
    flag: { line: 2, text: 'nums[1:-1]' },
    answers: ['20,30,40'],
    display: '[20, 30, 40]',
    nudge: 'Not quite. Which end of a slice is included, and where does -1 point?',
    hints: [
      'A slice includes its start and stops before its end. Which item is at index -1?',
      'Index 1 is 20 and index -1 is 50, the last item. The slice stops before 50, giving 20, 30, 40.'
    ],
    explain: 'A slice <b>includes its start and excludes its end</b>. Index 1 is 20, and <code>-1</code> counts back from the end, so it\'s 50. The slice starts at 20 and stops just before 50: <code>[20, 30, 40]</code>. In other words, <code>nums[1:-1]</code> drops the first and last items.',
    fix: 'This one is correct Python. It\'s a common way to trim both ends. For the last item, use <code>nums[-1]</code>. To include it in a slice, leave the end off: <code>nums[1:]</code>.',
    takeaway: 'Slices include the start and exclude the end, and negative indexes count back from the end: <code>nums[1:-1]</code> drops the first and last items.'
  },
  {
    lang: 'python',
    difficulty: 3,
    code: `x = 10
squares = [x * x for x in range(3)]
print(x)`,
    flag: { line: 2, text: 'for x in range(3)' },
    answers: ['10'],
    display: '10',
    nudge: 'Not quite. Does the x inside the list comprehension change the x outside it?',
    hints: [
      'A list comprehension has its own loop variable. Is it the same x as the one on line 1?',
      'In Python 3, a comprehension\'s loop variable stays inside it, so the outer x is still 10.'
    ],
    explain: 'In Python 3, a list comprehension gets its <b>own scope</b>, so its loop variable <code>x</code> is separate from the <code>x</code> on line 1. The comprehension runs with x = 0, 1, 2, but the outer <code>x</code> is untouched and still 10.',
    fix: 'Nothing to fix in Python 3, but reusing a name like this is confusing. Give the loop variable its own name: <code>[n * n for n in range(3)]</code>.',
    takeaway: 'A comprehension’s loop variable stays inside the comprehension. A plain <code>for</code> loop’s variable doesn’t: it’s still there after the loop.'
  },

  // --- JavaScript ---------------------------------------------------------------
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
];
