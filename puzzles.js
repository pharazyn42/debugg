// Debugg puzzle data. One puzzle per day, in order; after the last one the list starts over.
// Loaded with a plain <script> tag (not fetch) so index.html still works when opened straight from disk.
//
// Fields:
//   lang       language key (only 'python' so far)
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
  }
];
