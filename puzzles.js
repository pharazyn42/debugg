// Debugg puzzle data. Each language has its own daily puzzle: a language's puzzles run one per day
// in the order they appear here, and after its last one they start over.
// Loaded with a plain <script> tag (not fetch) so index.html still works when opened straight from disk.
//
// Fields:
//   lang       language key: 'python' or 'javascript' (see LANGS in index.html)
//   code       the snippet; the last line is the print the player has to predict
//   flag       { line, text } marks the buggy bit, underlined once the game ends
//   answers    accepted guesses; compared after normalising (case, spaces, quotes and brackets ignored)
//   display    the exact output, as shown to the player
//   nudge      feedback after a wrong guess
//   hints      two hints, gentle then strong
//   explain    why it prints what it does (HTML)
//   fix        how to write it properly (HTML)
//   inTheWild  real-world context: an incident, what the bug can cause, or an interesting fact (HTML)
window.DEBUGG_PUZZLES = [
  {
    lang: 'python',
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
    inTheWild: 'Linters flag this pattern on sight: Pylint calls it <code>W0102 dangerous-default-value</code> and flake8-bugbear calls it <code>B006</code>. In a long-running web server, a shared default list or dict can quietly carry one request\'s data into the next.'
  },
  {
    lang: 'python',
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
    inTheWild: 'On 25 February 1991, a Patriot missile battery in Dhahran, Saudi Arabia failed to intercept an incoming Scud missile, and 28 US soldiers were killed. The system counted time in tenths of a second, and 0.1 can\'t be stored exactly in binary. After about 100 hours of running, the error had grown to around a third of a second, long enough for a Scud to travel more than half a kilometre.'
  },
  {
    lang: 'python',
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
    inTheWild: 'On 31 December 2008, every 30GB Microsoft Zune froze as it started up. Its clock code looped through the days of each year and didn\'t handle day 366 of a leap year, so the loop never ended. Microsoft\'s official fix was to let the battery run flat and wait until 1 January.'
  },
  {
    lang: 'python',
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
    inTheWild: 'In February 2014 Apple patched "goto fail" (CVE-2014-1266). A single duplicated <code>goto fail;</code> line in the TLS code of iOS and macOS jumped past the final signature check, so forged certificates were accepted on supposedly secure connections. As here, the check after the stray line looked fine. It just never ran.'
  },
  {
    lang: 'python',
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
    inTheWild: 'This exact trap has its own entry in Python\'s official Programming FAQ: "How do I create a multidimensional list?" It\'s a classic in game boards and matrices, where one move seems to happen on every row at once.'
  },
  {
    lang: 'python',
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
    inTheWild: 'Why round to even? Always rounding .5 up pushes totals slightly upward, and repeated millions of times, that bias adds up. In 1982 the Vancouver Stock Exchange launched a new index at 1000 and recalculated it thousands of times a day, cutting off extra decimals instead of rounding them. By November 1983 it read about 524. Recalculated properly, it should have been about 1098.'
  },
  {
    lang: 'python',
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
    inTheWild: 'Ignoring a return value is common enough that languages have added guards against it. C++17 has the <code>[[nodiscard]]</code> attribute and Rust has <code>#[must_use]</code>, both of which make the compiler warn when a result is thrown away. In Rust, ignoring a <code>Result</code> from something that can fail gives a warning by default.'
  },
  {
    lang: 'python',
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
    inTheWild: 'Excel still thinks 29 February 1900 existed. Lotus 1-2-3 had this bug, and Microsoft copied it on purpose so Excel could open Lotus spreadsheets with the same dates. It\'s kept to this day for backward compatibility, so Excel\'s date numbers before March 1900 are off by one.'
  },
  {
    lang: 'python',
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
    inTheWild: 'Java won\'t let this slide: changing most collections while a for-each loop is walking them throws a <code>ConcurrentModificationException</code>. Python lists don\'t check, so the loop just silently skips items. It\'s the kind of bug that hides in data-cleaning code until two bad values end up next to each other.'
  },
  {
    lang: 'python',
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
    inTheWild: 'Languages disagree here. C, C++ and Java round integer division toward zero and would give -3. Python floors and gives -4. Guido van Rossum explained why in his 2010 post "Why Python\'s Integer Division Floors": it means <code>a % b</code> always has the same sign as <code>b</code>, so wrapping things like clock times works with negative numbers.'
  },
  {
    lang: 'python',
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
    inTheWild: 'Python\'s official FAQ has an entry for this one too: "Why do lambdas defined in a loop with different values all return the same result?" JavaScript had the same trap with <code>var</code> in loops. ES2015\'s <code>let</code> fixed it by creating a fresh variable for each loop iteration.'
  },
  {
    lang: 'python',
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
    inTheWild: 'Sort numbered files as plain text and file10 lands before file2. That\'s why Windows Explorer and macOS Finder use "natural sort" for file names, comparing runs of digits as numbers. Version numbers have the same trap: as strings, "3.10" is less than "3.9", which is one reason Python\'s packaging tools parse versions instead of comparing text.'
  },
  {
    lang: 'python',
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
    inTheWild: 'In Python, <code>bool</code> is a subclass of <code>int</code>, and has been since booleans were added in Python 2.3 (PEP 285). That\'s also why <code>True + True</code> is 2, and why <code>sum()</code> over a list of booleans counts the Trues.'
  },
  {
    lang: 'python',
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
    inTheWild: 'This is risky enough that Python 3.14 now warns about it: PEP 765 makes <code>return</code>, <code>break</code> and <code>continue</code> that leave a <code>finally</code> block a <code>SyntaxWarning</code>, because they can silently hide both return values and exceptions.'
  },
  // The next four came from Debugg Ltd's original desk.
  {
    lang: 'python',
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
    inTheWild: 'Python\'s <code>decimal</code> module exists for exactly this. Its documentation uses the same kind of example: in decimal, <code>0.1 + 0.1 + 0.1 - 0.3</code> is exactly zero, while in binary floating point it\'s 5.55e-17. Finance and billing code typically uses decimals or whole cents for this reason.'
  },
  {
    lang: 'python',
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
    inTheWild: 'In Python 2, <code>input()</code> ran whatever the user typed as Python code, which was a security hole, so most programs used <code>raw_input()</code> instead. Python 3 (PEP 3111) made <code>input()</code> always return a plain string, which is safe but means every number has to be converted. JavaScript has its own version of this bug: <code>"3" * 2</code> is 6 there, but <code>"3" + 2</code> is "32".'
  },
  {
    lang: 'python',
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
    inTheWild: 'Half-open ranges (start included, end excluded) are deliberate. Edsger Dijkstra argued for them in his 1982 note "Why numbering should start at zero" (EWD831): they make the length of a range just <code>end - start</code>, and let ranges that touch share an endpoint without overlapping. Python\'s <code>range</code> and slices follow the same rule.'
  },
  {
    lang: 'python',
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
    inTheWild: 'In Python 2 this printed 2: list comprehension variables leaked into the surrounding code and overwrote variables with the same name. Python 3 fixed that, which is one of the quieter changes that broke old code during the migration. A plain <code>for</code> loop still leaks its variable in Python 3, by design.'
  },

  // --- JavaScript ---------------------------------------------------------------
  {
    lang: 'javascript',
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
    inTheWild: 'This has been the rule since the first edition of the ECMAScript spec in 1997, and it can\'t change without breaking old websites. Typed arrays like <code>Int32Array</code> came much later, and their <code>sort()</code> does sort numbers numerically.'
  },
  {
    lang: 'javascript',
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
    inTheWild: 'The first JavaScript engine stored a small type tag with every value, and the tag for objects was 0. <code>null</code> was stored as a null pointer, which is all zeros, so it read as an object. A proposal to make <code>typeof null</code> return <code>"null"</code> was considered for ES2015 but rejected because it broke too much existing code.'
  },
  {
    lang: 'javascript',
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
    inTheWild: 'A form input\'s <code>.value</code> is always a string, even for <code>&lt;input type="number"&gt;</code>, so "add to cart" totals like "10" + "5" = "105" are a classic web bug. Gary Bernhardt\'s 2012 lightning talk "Wat" made JavaScript\'s type conversions famous, with examples like <code>[] + {}</code>.'
  },
  {
    lang: 'javascript',
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
    inTheWild: 'This one is a JavaScript classic, and the lesson goes beyond <code>parseInt</code>: passing a function straight to <code>map</code> is only safe if it ignores extra arguments. It can also break later, when a library adds an optional second parameter to a function you were passing this way.'
  },
  {
    lang: 'javascript',
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
    inTheWild: 'Before <code>let</code> arrived in ES2015, the standard workaround was to wrap the loop body in a function that runs immediately (an "IIFE") just to get a fresh variable each time. The classic version of this bug is click handlers made in a loop, where every button reports the last index.'
  },
  {
    lang: 'javascript',
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
    inTheWild: 'This is one of the main reasons JavaScript style guides put opening braces on the same line, and Douglas Crockford warns about it in "JavaScript: The Good Parts" (2008). Code formatters like Prettier don\'t change what the code means, but they lay it out so the problem is easy to see.'
  },
  {
    lang: 'javascript',
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
    inTheWild: '<code>==</code>\'s conversion rules are confusing enough that ESLint has a built-in rule, <code>eqeqeq</code>, to require <code>===</code>, and most JavaScript style guides turn it on. Users whose answer is genuinely "0", like a quantity or a count, are the usual victims.'
  },
  {
    lang: 'javascript',
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
    inTheWild: 'JavaScript copied this from Java\'s <code>java.util.Date</code>, because JavaScript was made to look like Java. Java deprecated most of that class in 1997, but JavaScript kept it. The newer <code>Temporal</code> date API finally numbers months from 1.'
  },
  {
    lang: 'javascript',
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
    inTheWild: 'Twitter hit this when tweet IDs grew past 2⁵³: JavaScript clients parsing the JSON quietly got the wrong IDs. Twitter\'s API added an <code>id_str</code> field with the ID as a string. JavaScript later added <code>BigInt</code> in ES2020 for exact large whole numbers.'
  },
  {
    lang: 'javascript',
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
    inTheWild: 'Deep copying used to mean a library or the lossy <code>JSON.parse(JSON.stringify(x))</code> trick, which drops dates, functions and <code>undefined</code>. <code>structuredClone()</code> was available in all major browsers by 2022 and does it properly. In state libraries like Redux, a shallow copy like this one is a classic cause of screens that don\'t update.'
  },
  {
    lang: 'javascript',
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
    inTheWild: 'There\'s no way to stop a <code>forEach</code> early except throwing an error. That\'s why arrays have <code>some</code>, <code>every</code> and <code>find</code>, which all stop as soon as they have an answer. A plain <code>for...of</code> loop, where <code>return</code> works as expected, is another fix.'
  }
];
