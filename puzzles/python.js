// Debuggit's Python puzzles. See puzzles/README.md for the fields, and run `npm run check-puzzles`
// after adding one: it runs every snippet and checks it prints the puzzle's answer.
(window.DEBUGG_PUZZLES = window.DEBUGG_PUZZLES || []).push(

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
    learn: 'lists',
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
    learn: 'strings',
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
    learn: 'values',
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
  // The next four came from Debuggit Ltd's original desk.
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
    learn: 'strings',
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
    learn: 'lists',
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

  // Hard puzzles (difficulty 5) for Fridays and weekends.
  {
    lang: 'python',
    difficulty: 5,
    code: `scores = ([1], [2])
try:
    scores[0] += [3]
except TypeError:
    pass
print(scores)`,
    flag: { line: 3, text: 'scores[0] += [3]' },
    answers: ['([1, 3], [2])'],
    display: '([1, 3], [2])',
    nudge: 'Not quite. The line raises an error, but does it change anything first?',
    hints: [
      'A tuple can’t be changed, so line 3 raises a TypeError. But += does two things: what are they, and in which order?',
      '+= first extends the list in place (that works, lists can change), then tries to store it back into the tuple (that fails). The list has already changed.'
    ],
    explain: '<code>scores[0] += [3]</code> is really two steps: extend the list <code>scores[0]</code>, then assign the result back to <code>scores[0]</code>. The list is mutable, so step one <b>succeeds</b> and the list becomes <code>[1, 3]</code>. Step two tries to assign into the tuple, which raises <code>TypeError</code>. The error is caught, but the list has already changed.',
    fix: 'Change the list directly, without assigning back into the tuple: <code>scores[0].append(3)</code> or <code>scores[0].extend([3])</code>.',
    takeaway: '<code>x += y</code> changes a mutable <code>x</code> in place <i>and then</i> assigns it back. If the assignment fails, the change has still happened.'
  },
  {
    lang: 'python',
    difficulty: 5,
    learn: 'lists',
    code: `a = [1, 2]
b = a
a += [3]
a = a + [4]
print(b)`,
    flag: { line: 4, text: 'a = a + [4]' },
    answers: ['[1, 2, 3]'],
    display: '[1, 2, 3]',
    nudge: 'Not quite. Do += and a = a + … do the same thing to a list?',
    hints: [
      'b and a start as the same list. Which of lines 3 and 4 changes that list, and which makes a new one?',
      '+= extends the shared list in place, so b sees the 3. a + [4] builds a brand new list, and only a points at it.'
    ],
    explain: 'Line 2 makes <code>b</code> another name for the same list. <code>a += [3]</code> extends that list <b>in place</b>, so <code>b</code> sees <code>[1, 2, 3]</code>. But <code>a = a + [4]</code> builds a <b>new</b> list and points <code>a</code> at it. <code>b</code> still points at the old one, which never gets the 4.',
    fix: 'If you want an independent copy, make one up front: <code>b = a.copy()</code>. If you want both to change, use <code>a += [4]</code> or <code>a.append(4)</code>.',
    takeaway: 'For lists, <code>a += x</code> changes the existing list, but <code>a = a + x</code> creates a new one. Other names for the old list only see the first.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `print(False == False in [False])`,
    flag: { line: 1, text: 'False == False in [False]' },
    answers: ['True'],
    display: 'True',
    nudge: 'Not quite. == and in are both comparison operators. What does Python do with a chain of them?',
    hints: [
      'Python lets you chain comparisons, like 1 < x < 10. Are == and in both comparisons?',
      'It’s a chain: (False == False) and (False in [False]). Both parts are True.'
    ],
    explain: '<code>==</code> and <code>in</code> are both comparison operators, so Python <b>chains</b> them, just like <code>1 &lt; x &lt; 10</code>. The line means <code>(False == False) and (False in [False])</code>. Both parts are <code>True</code>, so the result is <code>True</code>. It is <i>not</i> <code>(False == False) in [False]</code>, which would be <code>True in [False]</code>, and so <code>False</code>.',
    fix: 'Add brackets to say which you mean: <code>(False == False) in [False]</code>. Better still, don’t mix different comparisons in one chain.',
    takeaway: 'All comparison operators (<code>&lt;</code>, <code>==</code>, <code>in</code>, <code>is</code>…) chain: <code>a op1 b op2 c</code> means <code>a op1 b and b op2 c</code>.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `name = ""
nickname = None
print(name or nickname or "anon" and len("anon") > 3)`,
    flag: { line: 3, text: '"anon" and len("anon") > 3' },
    answers: ['True'],
    display: 'True',
    nudge: 'Not quite. Which binds tighter, and or or? And what do they return?',
    hints: [
      'and is worked out before or, like × before +. Where does that put the brackets?',
      'It’s name or nickname or ("anon" and len("anon") > 3). The and returns its last value, True, and so does the whole or chain.'
    ],
    explain: '<code>and</code> binds tighter than <code>or</code>, so the line is <code>name or nickname or ("anon" and len("anon") &gt; 3)</code>. <code>and</code> and <code>or</code> return one of their <b>values</b>, not just True or False. <code>"anon" and True</code> gives <code>True</code>. Then <code>"" or None or True</code> returns the first truthy value, which is <code>True</code>, not <code>"anon"</code>.',
    fix: 'Put the default and the check on separate lines: <code>display = name or nickname or "anon"</code>, then test <code>len(display) &gt; 3</code> separately.',
    takeaway: '<code>and</code> binds tighter than <code>or</code>, and both return one of their operands. Use brackets whenever you mix them.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `class Counter:
    count = 0

    def add(self):
        self.count += 1

a = Counter()
b = Counter()
a.add()
a.add()
b.add()
print(Counter.count, a.count, b.count)`,
    flag: { line: 5, text: 'self.count += 1' },
    answers: ['0 2 1'],
    display: '0 2 1',
    nudge: 'Not quite. When self.count += 1 runs, which count does it change?',
    hints: [
      'self.count += 1 reads self.count, then assigns self.count. Where does each of those look?',
      'Reading finds the class’s count (0) the first time, but assigning creates a new count on the instance. The class’s count is never changed.'
    ],
    explain: '<code>self.count += 1</code> means <code>self.count = self.count + 1</code>. The <b>read</b> finds <code>Counter.count</code> (0) because the instance has no <code>count</code> yet. The <b>assignment</b> then creates a new <code>count</code> on that instance. So <code>a</code> ends up with its own 2, <code>b</code> with its own 1, and <code>Counter.count</code> is still 0.',
    fix: 'To count across all instances, change the class attribute directly: <code>Counter.count += 1</code>. To count per instance, set <code>self.count = 0</code> in <code>__init__</code> so it’s clearly per instance.',
    takeaway: 'Assigning to <code>self.x</code> always creates or changes an <i>instance</i> attribute, even when <code>x</code> was first read from the class.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `squares = (n * n for n in range(4))
print(sum(squares), sum(squares))`,
    flag: { line: 1, text: '(n * n for n in range(4))' },
    answers: ['14 0'],
    display: '14 0',
    nudge: 'Not quite. Round brackets make a generator, not a list. Can you go through a generator twice?',
    hints: [
      'The first sum() is 0 + 1 + 4 + 9. What’s left in the generator for the second one?',
      'A generator produces its values once. After the first sum() it’s used up, so the second sum() adds nothing: 0.'
    ],
    explain: 'Round brackets make a <b>generator</b>, which produces its values one at a time and only once. The first <code>sum()</code> uses them all up: 0 + 1 + 4 + 9 = 14. The second <code>sum()</code> finds the generator empty and returns 0. No error, just a silently wrong total.',
    fix: 'Use a list if you need the values more than once: <code>squares = [n * n for n in range(4)]</code>.',
    takeaway: 'Generators (and iterators like <code>map()</code>, <code>zip()</code> and open files) can only be read once. Make a list if you need to go through them again.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `words = ["bb", "a", "ccc", "dd"]
print(sorted(words, key=len, reverse=True))`,
    flag: { line: 2, text: 'key=len, reverse=True' },
    answers: ["['ccc', 'bb', 'dd', 'a']"],
    display: "['ccc', 'bb', 'dd', 'a']",
    nudge: 'Not quite. "bb" and "dd" are the same length. Which comes first?',
    hints: [
      'The longest word goes first. "bb" and "dd" tie on length: does reverse=True flip them too?',
      'Python’s sort is stable: items that tie keep their original order, even with reverse=True. "bb" came before "dd", so it stays first.'
    ],
    explain: 'The words are sorted by length, longest first: <code>"ccc"</code>, then the two 2-letter words, then <code>"a"</code>. Python’s sort is <b>stable</b>: items with equal keys keep their original order. <code>reverse=True</code> keeps that too; it doesn’t just flip the finished list. <code>"bb"</code> came before <code>"dd"</code>, so it stays first.',
    fix: 'If ties should be ordered too, sort by more than one key: <code>sorted(words, key=lambda w: (-len(w), w))</code>.',
    takeaway: 'Python’s sort is stable, even with <code>reverse=True</code>: items that tie keep their original order.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `count = 0

def bump():
    try:
        count += 1
    except UnboundLocalError:
        return "error"
    return count

print(bump())`,
    flag: { line: 5, text: 'count += 1' },
    answers: ['error'],
    display: 'error',
    nudge: 'Not quite. Inside bump(), is count the global count?',
    hints: [
      'Assigning to a name anywhere in a function makes it local to that whole function. Does bump() assign to count?',
      'count += 1 assigns to count, so count is local in bump(). Reading it before it has a value raises UnboundLocalError.'
    ],
    explain: 'Because <code>bump()</code> <b>assigns</b> to <code>count</code> (<code>+=</code> is an assignment), Python treats <code>count</code> as a local variable for the whole function. So <code>count += 1</code> tries to read the local <code>count</code> before it has a value, which raises <code>UnboundLocalError</code>, and the function returns <code>"error"</code>. The global <code>count</code> is never touched.',
    fix: 'Declare it: <code>global count</code> at the top of <code>bump()</code>. Better, avoid globals: pass the count in and return the new value.',
    takeaway: 'If a function assigns to a name anywhere, that name is local throughout the function. Use <code>global</code> or <code>nonlocal</code> to change an outer variable.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `print(sorted([True, 2, 1.5, 0]))`,
    flag: { line: 1, text: 'True' },
    answers: ['[0, True, 1.5, 2]'],
    display: '[0, True, 1.5, 2]',
    nudge: 'Not quite. Can True be compared with numbers? Where does it land?',
    hints: [
      'In Python, bool is a kind of int. What number is True?',
      'True is 1, so it sorts between 0 and 1.5, and it’s still printed as True.'
    ],
    explain: '<code>bool</code> is a subclass of <code>int</code>, and <code>True</code> equals 1. So the list sorts as if it were 1, 2, 1.5, 0: that gives 0, 1, 1.5, 2. Sorting doesn’t change the values, so <code>True</code> is still printed as <code>True</code>, sitting where 1 would be.',
    fix: 'Keep booleans and numbers in separate lists. If you really mean 1, use 1.',
    takeaway: '<code>True</code> and <code>False</code> are the integers 1 and 0 in disguise: they compare, sort and add like numbers.'
  },
  {
    lang: 'python',
    difficulty: 5,
    code: `for n in [2, 4, 6]:
    if n % 2:
        break
else:
    n = "none odd"
print(n)`,
    flag: { line: 4, text: 'else:' },
    answers: ['none odd'],
    display: 'none odd',
    nudge: 'Not quite. That else belongs to the for loop, not the if. When does it run?',
    hints: [
      'Look at the indentation: the else lines up with for, not with if. A loop’s else runs in one situation. Which?',
      'A for loop’s else runs when the loop finishes without a break. All three numbers are even, so there’s no break.'
    ],
    explain: 'The <code>else</code> lines up with <code>for</code>, so it belongs to the <b>loop</b>. A loop’s <code>else</code> runs when the loop finishes <b>without</b> hitting <code>break</code>. All three numbers are even, so <code>n % 2</code> is always 0, nothing breaks, and the <code>else</code> sets <code>n</code> to <code>"none odd"</code>.',
    fix: 'The code is fine. It’s a real idiom for “search, and handle not finding anything”. But many people misread it, so a short comment helps: <code># runs if no break</code>.',
    takeaway: 'A loop’s <code>else</code> runs when the loop ends normally, and is skipped when it ends with <code>break</code>. Read it as “no break”.'
  },

  // --- Added for the rotation: four more of each of difficulties 1 to 4 -------------------------
  {
    lang: 'python',
    difficulty: 1,
    learn: 'values',
    code: `slices = 7
people = 2
print(slices / people)`,
    flag: { line: 3, text: 'slices / people' },
    answers: ['3.5'],
    display: '3.5',
    nudge: 'Not quite. Does / throw away the remainder?',
    hints: [
      'In Python 3, what type does / give back, even for two whole numbers?',
      '/ is true division: it always gives a float, remainder included. // is the one that rounds down.'
    ],
    explain: 'In Python 3, <code>/</code> is <b>true division</b>: it always returns a float, so <code>7 / 2</code> is <code>3.5</code>. Many languages (and Python 2) drop the remainder when both numbers are whole; Python 3 doesn\'t.',
    fix: 'If you want whole slices each, use floor division: <code>slices // people</code> gives <code>3</code>, and <code>slices % people</code> gives the 1 left over.',
    takeaway: '<code>/</code> always gives a float in Python 3. Use <code>//</code> for whole-number division and <code>%</code> for the remainder.'
  },
  {
    lang: 'python',
    difficulty: 1,
    learn: 'strings',
    code: `greeting = "hello world"
print(len(greeting))`,
    flag: { line: 2, text: 'len(greeting)' },
    answers: ['11'],
    display: '11',
    nudge: 'Not quite. Count every character, not just the letters.',
    hints: [
      'Is the space between the words a character?',
      '"hello" is 5, "world" is 5, and the space in the middle counts too.'
    ],
    explain: '<code>len()</code> counts every character in a string, including spaces and punctuation. "hello" (5) + the space (1) + "world" (5) = 11.',
    fix: 'To count only letters: <code>sum(c.isalpha() for c in greeting)</code>. To count words: <code>len(greeting.split())</code>.',
    takeaway: '<code>len()</code> of a string counts every character: spaces, punctuation and newlines included.'
  },
  {
    lang: 'python',
    difficulty: 1,
    learn: 'lists',
    code: `queue = ["Ada", "Grace", "Linus"]
print(queue[-1])`,
    flag: { line: 2, text: 'queue[-1]' },
    answers: ['linus'],
    display: 'Linus',
    nudge: 'Not quite. Where does counting start when the index is negative?',
    hints: [
      'Negative indexes count from the other end of the list.',
      '-1 is the last item, -2 the one before it, and so on.'
    ],
    explain: 'Negative indexes count back from the end: <code>queue[-1]</code> is the last item, <code>queue[-2]</code> the second to last. It\'s the same as <code>queue[len(queue) - 1]</code>, without the arithmetic.',
    fix: 'Nothing to fix: <code>[-1]</code> is the tidy way to get the last item. For the first, use <code>[0]</code>.',
    takeaway: 'Negative indexes count from the end: <code>[-1]</code> is the last item, <code>[-2]</code> the one before.'
  },
  {
    lang: 'python',
    difficulty: 1,
    code: `left, right = "L", "R"
left, right = right, left
print(left, right)`,
    flag: { line: 2, text: 'left, right = right, left' },
    answers: ['r l', 'r,l'],
    display: 'R L',
    nudge: 'Not quite. Is the right-hand side worked out before or after anything is assigned?',
    hints: [
      'Python works out the whole right-hand side first, then assigns.',
      'right, left makes the pair ("R", "L") before either name changes, then unpacks it into left and right.'
    ],
    explain: 'Python evaluates the whole right-hand side first, building the tuple <code>("R", "L")</code>, and only then unpacks it into <code>left</code> and <code>right</code>. So the values really do swap, with no temporary variable needed. <code>print</code> with two arguments separates them with a space.',
    fix: 'Nothing to fix: this is the idiomatic swap in Python.',
    takeaway: '<code>a, b = b, a</code> swaps two values: the right-hand side is built in full before anything is assigned.'
  },
  {
    lang: 'python',
    difficulty: 2,
    learn: 'lists',
    code: `scores = [30, 10, 20]
ranked = scores.sort()
print(ranked)`,
    flag: { line: 2, text: 'ranked = scores.sort()' },
    answers: ['none'],
    display: 'None',
    nudge: 'Not quite. What does sort() give back?',
    hints: [
      'sort() changes the list it\'s called on. Does it also return it?',
      'Methods that change a list in place, like sort(), append() and reverse(), return None.'
    ],
    explain: '<code>list.sort()</code> sorts the list <b>in place</b> and returns <code>None</code>, so <code>ranked</code> is <code>None</code>. <code>scores</code> itself is now <code>[10, 20, 30]</code>.',
    fix: 'Use <code>ranked = sorted(scores)</code> for a new sorted list, or call <code>scores.sort()</code> on its own line and use <code>scores</code>.',
    takeaway: 'List methods that change the list in place (<code>sort</code>, <code>append</code>, <code>reverse</code>) return <code>None</code>. <code>sorted()</code> returns a new list.'
  },
  {
    lang: 'python',
    difficulty: 2,
    code: `answer = "False"  # read from a settings file
print(bool(answer))`,
    flag: { line: 2, text: 'bool(answer)' },
    answers: ['true'],
    display: 'True',
    nudge: 'Not quite. bool() doesn\'t read the words in a string.',
    hints: [
      'What makes a string count as true or false?',
      'Only the empty string "" is false. Any other string, even "False", is true.'
    ],
    explain: '<code>bool()</code> of a string only checks whether it\'s empty. <code>"False"</code> has five characters, so it\'s <code>True</code>. Python never looks at what the text says.',
    fix: 'Compare the text: <code>answer.strip().lower() == "true"</code>, or use a proper format (JSON, configparser\'s <code>getboolean()</code>) that parses booleans for you.',
    takeaway: 'Any non-empty string is truthy, even <code>"False"</code> and <code>"0"</code>. Compare the text to parse a boolean from a string.'
  },
  {
    lang: 'python',
    difficulty: 2,
    code: `price = 3.99
print(int(price))`,
    flag: { line: 2, text: 'int(price)' },
    answers: ['3'],
    display: '3',
    nudge: 'Not quite. Does int() round?',
    hints: [
      'int() doesn\'t round to the nearest whole number.',
      'int() cuts off everything after the decimal point, towards zero.'
    ],
    explain: '<code>int()</code> on a float <b>truncates</b>: it drops the fractional part, moving towards zero. <code>int(3.99)</code> is <code>3</code>, and <code>int(-3.99)</code> is <code>-3</code>.',
    fix: 'Use <code>round(price)</code> to round to the nearest whole number, or <code>math.floor()</code> / <code>math.ceil()</code> to round down or up.',
    takeaway: '<code>int()</code> chops off the decimals rather than rounding. Use <code>round()</code>, <code>math.floor()</code> or <code>math.ceil()</code> when you mean one of those.'
  },
  {
    lang: 'python',
    difficulty: 2,
    learn: 'lists',
    code: `basket = ["apple", "pear"]
backup = basket
backup.append("plum")
print(len(basket))`,
    flag: { line: 2, text: 'backup = basket' },
    answers: ['3'],
    display: '3',
    nudge: 'Not quite. Did line 2 make a copy?',
    hints: [
      'Assigning a list to a new name doesn\'t copy it.',
      'backup and basket are two names for the same list, so appending through either changes both.'
    ],
    explain: '<code>backup = basket</code> doesn\'t copy anything: it gives the same list a second name. Appending through <code>backup</code> changes the one list, so <code>basket</code> has 3 items too.',
    fix: 'Make a real copy: <code>backup = basket.copy()</code> or <code>backup = list(basket)</code>.',
    takeaway: 'Assignment never copies. Two names for one list see each other\'s changes; use <code>.copy()</code> when you need a separate list.'
  },
  {
    lang: 'python',
    difficulty: 3,
    code: `a = [1, 2, 3]
b = [1, 2, 3]
print(a == b, a is b)`,
    flag: { line: 3, text: 'a is b' },
    answers: ['true false', 'true,false'],
    display: 'True False',
    nudge: 'Not quite. == and is ask different questions.',
    hints: [
      '== asks whether two things have the same value. What does is ask?',
      'is asks whether two names point at the very same object. These are two separate lists that happen to be equal.'
    ],
    explain: '<code>==</code> compares values: both lists hold 1, 2, 3, so it\'s <code>True</code>. <code>is</code> checks identity, whether both names refer to the <b>same object</b>. Each list literal makes a new list, so it\'s <code>False</code>.',
    fix: 'Use <code>==</code> to compare values. Keep <code>is</code> for singletons like <code>None</code>: <code>if x is None</code>.',
    takeaway: '<code>==</code> compares values; <code>is</code> checks it\'s the same object. Use <code>is</code> only for <code>None</code> (and <code>True</code>/<code>False</code>).'
  },
  {
    lang: 'python',
    difficulty: 3,
    learn: 'strings',
    code: `filename = "text.txt"
print(filename.rstrip(".txt"))`,
    flag: { line: 2, text: 'rstrip(".txt")' },
    answers: ['te'],
    display: 'te',
    nudge: 'Not quite. rstrip() doesn\'t remove a suffix.',
    hints: [
      'rstrip(".txt") doesn\'t remove the text ".txt". It removes characters.',
      'It keeps removing any of the characters ".", "t" and "x" from the right until it meets one that isn\'t in that set.'
    ],
    explain: 'The argument to <code>strip</code>, <code>lstrip</code> and <code>rstrip</code> is a <b>set of characters</b>, not a string to remove. <code>rstrip(".txt")</code> strips any ".", "t" or "x" from the right: t, x, t, ., t, x all go, and it stops at the "e", leaving <code>"te"</code>.',
    fix: 'Use <code>filename.removesuffix(".txt")</code> (Python 3.9+), or <code>pathlib.Path(filename).stem</code> for file names.',
    takeaway: '<code>strip()</code> and friends remove a set of characters, not a word. Use <code>removesuffix()</code> or <code>removeprefix()</code> to cut off exact text.'
  },
  {
    lang: 'python',
    difficulty: 3,
    code: `countdown = list(range(10, 0, -3))
print(countdown)`,
    flag: { line: 1, text: 'range(10, 0, -3)' },
    answers: ['10,7,4,1'],
    display: '[10, 7, 4, 1]',
    nudge: 'Not quite. Step down by 3 from 10, and remember where range stops.',
    hints: [
      'With a negative step, range counts down and stops before reaching the stop value.',
      '10, 7, 4, 1… the next would be -2, which is past 0, so it stops.'
    ],
    explain: '<code>range(10, 0, -3)</code> starts at 10 and steps by -3 while the value is still <b>greater than</b> the stop, 0: 10, 7, 4, 1. The stop value is never included, whichever direction you count.',
    fix: 'Nothing to fix. To include the stop value when counting down, go one past it: <code>range(10, -1, -1)</code> is 10 down to 0.',
    takeaway: '<code>range</code> never includes its stop value, counting up or down. With a negative step it stops once it would reach or pass the stop.'
  },
  {
    lang: 'python',
    difficulty: 3,
    learn: 'strings',
    code: `row = "Ada,,London"  # name, email, city
fields = row.split(",")
print(len(fields))`,
    flag: { line: 2, text: 'row.split(",")' },
    answers: ['3'],
    display: '3',
    nudge: 'Not quite. What happens between two commas with nothing in between?',
    hints: [
      'split(",") keeps empty fields: ",," has an empty string between the commas.',
      'The fields are "Ada", "" and "London".'
    ],
    explain: '<code>split(",")</code> with a separator keeps empty fields, so the missing email becomes <code>""</code>: <code>["Ada", "", "London"]</code>, 3 fields. That\'s what you want for CSV-style data, where position matters.',
    fix: 'For real CSV (quotes, commas inside fields), use the <code>csv</code> module. To drop empty pieces: <code>[f for f in row.split(",") if f]</code>.',
    takeaway: '<code>split(sep)</code> keeps empty strings between separators. Only <code>split()</code> with no argument drops empty pieces (and splits on any whitespace).'
  },
  {
    lang: 'python',
    difficulty: 4,
    code: `defaults = {"tags": ["new"]}
settings = dict(defaults)
settings["tags"].append("sale")
print(defaults)`,
    flag: { line: 2, text: 'dict(defaults)' },
    answers: ["{'tags': ['new', 'sale']}", 'tags:new,sale'],
    display: "{'tags': ['new', 'sale']}",
    nudge: 'Not quite. How deep does dict() copy?',
    hints: [
      'dict(defaults) makes a new dictionary. Does it also copy the list inside it?',
      'It\'s a shallow copy: the new dict points at the same list object, so appending to it changes defaults too.'
    ],
    explain: '<code>dict(defaults)</code> (like <code>.copy()</code> and <code>{**defaults}</code>) makes a <b>shallow</b> copy: a new dictionary whose values are the same objects. Both dicts share one <code>["new"]</code> list, so appending <code>"sale"</code> through <code>settings</code> shows up in <code>defaults</code>.',
    fix: 'Use <code>copy.deepcopy(defaults)</code>, or copy the nested list yourself: <code>settings = {"tags": list(defaults["tags"])}</code>.',
    takeaway: '<code>dict()</code>, <code>.copy()</code> and <code>{**d}</code> are shallow copies: nested lists and dicts are still shared. Use <code>copy.deepcopy()</code> for a fully separate copy.'
  },
  {
    lang: 'python',
    difficulty: 4,
    code: `def count(*items):
    return len(items)

print(count([1, 2, 3]))`,
    flag: { line: 4, text: 'count([1, 2, 3])' },
    answers: ['1'],
    display: '1',
    nudge: 'Not quite. How many arguments does line 4 pass?',
    hints: [
      '*items collects each argument into a tuple. How many arguments are there?',
      'The list is a single argument, so items is ([1, 2, 3],): a tuple with one thing in it.'
    ],
    explain: '<code>*items</code> gathers the positional arguments into a tuple. Line 4 passes <b>one</b> argument, a list, so <code>items</code> is <code>([1, 2, 3],)</code> and its length is 1.',
    fix: 'Unpack the list when calling: <code>count(*[1, 2, 3])</code> passes three arguments. Or have the function take a list: <code>def count(items)</code>.',
    takeaway: '<code>*args</code> collects each argument you pass, so a list counts as one. Use <code>f(*my_list)</code> to spread a list into separate arguments.'
  },
  {
    lang: 'python',
    difficulty: 4,
    code: `print(max("apple", "Banana"))`,
    flag: { line: 1, text: 'max("apple", "Banana")' },
    answers: ['apple'],
    display: 'apple',
    nudge: 'Not quite. How do uppercase and lowercase letters compare?',
    hints: [
      'Strings compare character by character, by their Unicode code points.',
      'Every uppercase letter (A–Z are 65–90) comes before every lowercase one (a–z are 97–122), so "a" > "B".'
    ],
    explain: 'Strings compare by their characters\' Unicode code points, first character first. <code>"a"</code> is 97 and <code>"B"</code> is 66, so <code>"apple"</code> is the bigger string, even though B comes after A in the alphabet.',
    fix: 'Compare case-insensitively with a key: <code>max("apple", "Banana", key=str.lower)</code> gives <code>"Banana"</code>.',
    takeaway: 'String comparison is by code point, so every capital letter sorts before every lowercase one. Pass <code>key=str.lower</code> to compare alphabetically.'
  },
  {
    lang: 'python',
    difficulty: 4,
    code: `print(any([]), all([]))`,
    flag: { line: 1, text: 'all([])' },
    answers: ['false true', 'false,true'],
    display: 'False True',
    nudge: 'Not quite. What should "all of nothing" be?',
    hints: [
      'any() is True if at least one item is truthy. Is there one in an empty list?',
      'all() is True unless it finds a falsy item. An empty list has none, so all([]) is True.'
    ],
    explain: '<code>any()</code> looks for one truthy item and returns <code>False</code> if it finds none, so <code>any([])</code> is <code>False</code>. <code>all()</code> looks for one falsy item and returns <code>True</code> if it finds none, so <code>all([])</code> is <code>True</code>. It\'s "vacuous truth": every item in an empty list passes any test.',
    fix: 'If an empty input should fail a check, test for it: <code>if items and all(ok(x) for x in items)</code>.',
    takeaway: '<code>all([])</code> is <code>True</code> and <code>any([])</code> is <code>False</code>. Check for an empty list first when "no items" shouldn\'t count as passing.'
  },

  // --- Other formats (see puzzles/README.md). Monday: multiple choice and "what's the value?";
  // Tuesday: "how many times?"; Wednesday: "will it error?" and "order the lines"; Thursday: "spot the bug".

  {
    lang: 'python',
    format: 'choice',
    difficulty: 1,
    code: `word = "debug"
print(word * 2)`,
    flag: { line: 2, text: 'word * 2' },
    options: ['debugdebug', 'debug debug', 'debug2', "['debug', 'debug']"],
    display: 'debugdebug',
    nudge: 'Not quite. What does * do when one side is a string?',
    hints: ['Multiplying a string by a whole number repeats it, with nothing in between.'],
    explain: '<code>*</code> between a string and a whole number repeats the string that many times, joined with nothing in between: <code>"debug" * 2</code> is <code>"debugdebug"</code>.',
    fix: 'To repeat with spaces, join a list: <code>" ".join([word] * 2)</code> gives <code>debug debug</code>.',
    takeaway: '<code>text * n</code> repeats the text n times, with no spaces added.',
    learn: 'strings'
  },
  {
    lang: 'python',
    format: 'choice',
    difficulty: 1,
    code: `scores = [3, 1, 2]
scores.sort()
print(scores[0])`,
    flag: { line: 2, text: 'scores.sort()' },
    options: ['1', '3', '2', '[1, 2, 3]'],
    display: '1',
    nudge: 'Not quite. What does sort() do to the list?',
    hints: ['sort() rearranges the list itself, smallest first. Then [0] is the first item.'],
    explain: '<code>scores.sort()</code> sorts the list in place, smallest first, so it becomes <code>[1, 2, 3]</code>. <code>scores[0]</code> is its first item: <code>1</code>.',
    fix: 'To keep the original order, sort a copy: <code>sorted(scores)[0]</code>, or just use <code>min(scores)</code>.',
    takeaway: '<code>list.sort()</code> changes the list itself, smallest first. Index 0 is the first item.',
    learn: 'lists'
  },
  {
    lang: 'python',
    format: 'choice',
    difficulty: 1,
    code: `pages = 10
per_day = 5
print(pages / per_day)`,
    flag: { line: 3, text: 'pages / per_day' },
    options: ['2.0', '2', '0.5', '50'],
    display: '2.0',
    nudge: 'Close. What kind of number does / always give?',
    hints: ['In Python 3, / always gives a float, even when it divides exactly.'],
    explain: 'In Python 3, <code>/</code> is "true division" and always gives a <b>float</b>, even when the answer is whole. So <code>10 / 5</code> is <code>2.0</code>, not <code>2</code>.',
    fix: 'Use <code>//</code> for whole-number division: <code>pages // per_day</code> is <code>2</code>.',
    takeaway: '<code>/</code> always gives a float (<code>2.0</code>); <code>//</code> gives a whole number when both sides are ints.',
    learn: 'values'
  },
  {
    lang: 'python',
    format: 'choice',
    difficulty: 1,
    code: `name = "Ada"
name.upper()
print(name)`,
    flag: { line: 2, text: 'name.upper()' },
    options: ['Ada', 'ADA', 'ada', 'None'],
    display: 'Ada',
    nudge: 'Not quite. Does upper() change the string it\'s called on?',
    hints: ['Strings can\'t be changed. upper() makes a new string, and line 2 throws it away.'],
    explain: 'Strings are immutable: no method can change them. <code>name.upper()</code> returns a <b>new</b> string, <code>"ADA"</code>, but line 2 doesn\'t keep it, so <code>name</code> is still <code>"Ada"</code>.',
    fix: 'Keep the result: <code>name = name.upper()</code>.',
    takeaway: 'String methods return a new string. Assign it (<code>name = name.upper()</code>) or it\'s lost.',
    learn: 'strings'
  },

  {
    lang: 'python',
    format: 'value',
    difficulty: 1,
    code: `count = 0
for word in ["tea", "cake", "tea"]:
    if word == "tea":
        count += 1`,
    flag: { line: 3, text: 'word == "tea"' },
    ask: { name: 'count' },
    answers: ['2'],
    display: '2',
    nudge: 'Not quite. Go through the list one word at a time.',
    hints: [
      'The loop visits "tea", then "cake", then "tea" again.',
      'count only goes up when the word is "tea", which happens twice.'
    ],
    explain: 'The loop looks at each word in turn. <code>count</code> goes up by 1 for each <code>"tea"</code>: the first and third words. <code>"cake"</code> is skipped. So <code>count</code> ends at <code>2</code>.',
    fix: 'For counting one value, lists have a method for it: <code>["tea", "cake", "tea"].count("tea")</code>.',
    takeaway: 'A counter that starts at 0 and adds 1 under a condition counts how many items pass it.',
    learn: 'values'
  },
  {
    lang: 'python',
    format: 'value',
    difficulty: 1,
    code: `colours = ["red", "green"]
colours.insert(0, "blue")
colours.pop()`,
    flag: { line: 3, text: 'colours.pop()' },
    ask: { name: 'colours' },
    answers: ["['blue', 'red']", 'blue, red'],
    display: "['blue', 'red']",
    nudge: 'Not quite. Where does insert(0, …) put the new item, and which item does pop() take?',
    hints: [
      'insert(0, "blue") puts "blue" at the very front.',
      'pop() with no index removes the last item.'
    ],
    explain: '<code>insert(0, "blue")</code> adds <code>"blue"</code> at index 0, the front: <code>["blue", "red", "green"]</code>. <code>pop()</code> with no index removes the <b>last</b> item, <code>"green"</code>, leaving <code>["blue", "red"]</code>.',
    fix: 'To remove the first item instead, use <code>pop(0)</code>.',
    takeaway: '<code>insert(0, x)</code> adds at the front; <code>pop()</code> removes from the end, and <code>pop(0)</code> from the front.',
    learn: 'lists'
  },
  {
    lang: 'python',
    format: 'value',
    difficulty: 1,
    code: `total = 10
total = total - 3
total *= 2`,
    flag: { line: 3, text: 'total *= 2' },
    ask: { name: 'total' },
    answers: ['14'],
    display: '14',
    nudge: 'Not quite. Work through the lines one at a time.',
    hints: [
      'After line 2, total is 7.',
      'total *= 2 is short for total = total * 2.'
    ],
    explain: 'Each line uses the value from the line before: <code>total</code> starts at 10, becomes <code>10 - 3 = 7</code>, then <code>*= 2</code> doubles it to <code>14</code>.',
    fix: 'Nothing to fix. <code>total *= 2</code> is the usual short way to write <code>total = total * 2</code>.',
    takeaway: 'A variable holds one value at a time; each assignment replaces it. <code>x *= 2</code> means <code>x = x * 2</code>.',
    learn: 'values'
  },
  {
    lang: 'python',
    format: 'value',
    difficulty: 1,
    code: `greeting = "hi"
greeting.upper()
shout = greeting + "!"`,
    flag: { line: 2, text: 'greeting.upper()' },
    ask: { name: 'shout' },
    answers: ['hi!', "'hi!'"],
    display: "'hi!'",
    nudge: 'Not quite. Did line 2 change greeting?',
    hints: [
      'upper() gives back a new string. Is it stored anywhere?',
      'greeting is still "hi", so shout is "hi" + "!".'
    ],
    explain: 'Strings can\'t be changed in place. <code>greeting.upper()</code> makes <code>"HI"</code>, but nothing keeps it, so <code>greeting</code> is still <code>"hi"</code>, and <code>shout</code> is <code>"hi!"</code>.',
    fix: 'Keep the new string: <code>greeting = greeting.upper()</code>.',
    takeaway: 'String methods return new strings. If you don\'t assign the result, the original is unchanged.',
    learn: 'strings'
  },

  {
    lang: 'python',
    format: 'count',
    difficulty: 2,
    code: `for i in range(2, 10, 3):
    print(i)`,
    flag: { line: 1, text: 'range(2, 10, 3)' },
    ask: { line: 2 },
    answers: ['3'],
    display: '3',
    nudge: 'Not quite. List the numbers range(2, 10, 3) gives.',
    hints: [
      'range(start, stop, step): start at 2, add 3 each time, stop before 10.',
      'That\'s 2, 5 and 8. The next, 11, is past the stop.'
    ],
    explain: '<code>range(2, 10, 3)</code> starts at 2 and adds 3 each time, stopping before 10: <code>2, 5, 8</code>. Line 2 runs once for each, so <b>3</b> times.',
    fix: 'To check how many numbers a range gives, use <code>len(range(2, 10, 3))</code>.',
    takeaway: '<code>range(start, stop, step)</code> counts up by <code>step</code> and never reaches <code>stop</code>.'
  },
  {
    lang: 'python',
    format: 'count',
    difficulty: 2,
    code: `n = 10
while n > 1:
    n = n // 2`,
    flag: { line: 3, text: 'n // 2' },
    ask: { line: 3 },
    answers: ['3'],
    display: '3',
    nudge: 'Not quite. Follow n through each pass of the loop.',
    hints: [
      '// is whole-number division: 10 // 2 is 5, and 5 // 2 is 2.',
      'n goes 10, 5, 2, 1, and the loop stops once n is 1.'
    ],
    explain: 'Each pass halves <code>n</code>, rounding down: 10 → 5 → 2 → 1. Then <code>n > 1</code> is false and the loop stops. Line 3 ran <b>3</b> times.',
    fix: 'Nothing to fix. Halving until you reach 1 takes about log₂(n) steps, which is why it\'s fast.',
    takeaway: 'A <code>while</code> loop runs until its condition is false. Trace the variable through each pass to count them.'
  },
  {
    lang: 'python',
    format: 'count',
    difficulty: 2,
    code: `def greet(name):
    return "Hi " + name

for n in ["Ann", "Bo"]:
    print(greet(n))
print(greet("Cy"))`,
    flag: { line: 2, text: 'return "Hi " + name' },
    ask: { line: 2 },
    answers: ['3'],
    display: '3',
    nudge: 'Not quite. Line 2 runs each time greet() is called. How many calls are there?',
    hints: [
      'Defining a function (line 1) doesn\'t run its body.',
      'greet is called twice in the loop and once more on the last line.'
    ],
    explain: 'A function\'s body only runs when it\'s <b>called</b>. <code>greet</code> is called for "Ann" and "Bo" in the loop, then for "Cy" on line 6: <b>3</b> calls, so line 2 runs 3 times.',
    fix: 'Nothing to fix. It\'s a reminder that <code>def</code> only defines the function.',
    takeaway: 'A function body runs once per call, never when it\'s defined.'
  },
  {
    lang: 'python',
    format: 'count',
    difficulty: 2,
    code: `for row in range(3):
    for col in range(row):
        print(row, col)`,
    flag: { line: 2, text: 'range(row)' },
    ask: { line: 3 },
    answers: ['3'],
    display: '3',
    nudge: 'Not quite. How many times does the inner loop run for each row?',
    hints: [
      'The inner loop depends on row: range(row) has row numbers in it.',
      'row 0: none, row 1: one, row 2: two.'
    ],
    explain: 'The inner loop runs <code>range(row)</code>: for row 0 that\'s empty, for row 1 it\'s once, for row 2 twice. 0 + 1 + 2 = <b>3</b>.',
    fix: 'Nothing to fix. This "triangle" pattern is how you visit each pair of items once.',
    takeaway: 'When an inner loop depends on the outer one, count it row by row. <code>range(0)</code> is empty.'
  },

  {
    lang: 'python',
    format: 'error',
    difficulty: 3,
    code: `ages = {"ann": 31, "bo": 25}
print(ages["Ann"])`,
    flag: { line: 2, text: 'ages["Ann"]' },
    options: ['Runs fine', 'KeyError', 'TypeError', 'NameError'],
    display: 'KeyError',
    nudge: 'Not quite. Look closely at the key it asks for.',
    hints: ['Dictionary keys are case-sensitive: "Ann" and "ann" are different keys.'],
    explain: 'Dictionary keys must match exactly, capitals included. The dict has <code>"ann"</code>, not <code>"Ann"</code>, so <code>ages["Ann"]</code> raises a <code>KeyError</code>.',
    fix: 'Match the key (<code>ages["ann"]</code>), normalise it (<code>ages[name.lower()]</code>), or use <code>ages.get("Ann")</code>, which gives <code>None</code> instead of crashing.',
    takeaway: 'A missing dict key raises <code>KeyError</code>. Keys are case-sensitive; <code>.get()</code> returns <code>None</code> instead.'
  },
  {
    lang: 'python',
    format: 'error',
    difficulty: 3,
    code: `count = 3
print("Count: " + count)`,
    flag: { line: 2, text: '"Count: " + count' },
    options: ['Runs fine', 'TypeError', 'ValueError', 'SyntaxError'],
    display: 'TypeError',
    nudge: 'Not quite. What happens when you + a string and a number?',
    hints: ['Python won\'t turn the number into text for you when adding.'],
    explain: '<code>+</code> can join two strings or add two numbers, but not a string and an int. Python won\'t guess which you meant, so it raises a <code>TypeError</code>: "can only concatenate str (not "int") to str".',
    fix: 'Convert it, or use an f-string: <code>print(f"Count: {count}")</code>.',
    takeaway: 'Python never mixes strings and numbers with <code>+</code>. Use <code>str()</code> or an f-string.',
    learn: 'strings'
  },
  {
    lang: 'python',
    format: 'error',
    difficulty: 3,
    code: `nums = [1, 2, 3]
for i in range(len(nums)):
    print(nums[i + 1])`,
    flag: { line: 3, text: 'nums[i + 1]' },
    options: ['Runs fine', 'IndexError', 'KeyError', 'TypeError'],
    display: 'IndexError',
    nudge: 'Not quite. What is i on the last pass, and what does it look up?',
    hints: ['i goes 0, 1, 2. On the last pass it looks up nums[3].'],
    explain: '<code>i</code> runs 0, 1, 2, so the code looks up <code>nums[1]</code>, <code>nums[2]</code> and then <code>nums[3]</code>. A 3-item list only has indexes 0 to 2, so it prints 2 and 3, then raises an <code>IndexError</code>.',
    fix: 'Loop over the items you mean: <code>for n in nums[1:]: print(n)</code>.',
    takeaway: 'Indexes go from 0 to <code>len - 1</code>. <code>i + 1</code> in a loop over every index runs off the end.',
    learn: 'lists'
  },
  {
    lang: 'python',
    format: 'error',
    difficulty: 3,
    code: `letters = ["a", "b", "c"]
print(letters[-1], letters[5:])`,
    flag: { line: 2, text: 'letters[5:]' },
    options: ['Runs fine', 'IndexError', 'KeyError', 'ValueError'],
    display: 'Runs fine',
    nudge: 'Not quite. Do slices complain when they go past the end?',
    hints: ['An index past the end is an error, but a slice past the end just gives what\'s there.'],
    explain: '<code>letters[-1]</code> is the last item, <code>"c"</code>. <code>letters[5:]</code> is a slice, and slices never raise errors: past the end they\'re just empty. So it runs fine and prints <code>c []</code>.',
    fix: 'Nothing to fix, but be aware: <code>letters[5]</code> (no colon) would raise an <code>IndexError</code>.',
    takeaway: 'Indexing past the end raises <code>IndexError</code>; slicing past the end quietly gives an empty or shorter list.',
    learn: 'lists'
  },

  {
    lang: 'python',
    format: 'order',
    difficulty: 3,
    code: `text = ""
for ch in "abc":
    if ch == "c":
        break
    text += ch
print(text)`,
    flag: { line: 4, text: 'break' },
    display: 'ab',
    nudge: 'Not quite. Think about when the loop should stop, and when a letter gets added.',
    hints: ['The check for "c" has to come before the letter is added, so "c" never gets in.'],
    explain: 'The loop builds up <code>text</code> one letter at a time. Checking for <code>"c"</code> <b>before</b> adding means the loop stops as soon as it reaches <code>"c"</code>, so only <code>"ab"</code> is added. Swap the two and you get <code>"abc"</code>.',
    fix: 'Nothing to fix. The order of lines inside a loop matters as much as the lines themselves.',
    takeaway: '<code>break</code> leaves the loop at once, skipping the rest of that pass. Put the check before the work it should prevent.'
  },
  {
    lang: 'python',
    format: 'order',
    difficulty: 3,
    code: `def double(x):
    return x * 2
result = double(4)
result = double(result)
print(result)`,
    flag: { line: 4, text: 'double(result)' },
    display: '16',
    nudge: 'Not quite. A function has to exist before it\'s called, and result has to exist before it\'s used.',
    hints: ['Define double first, then call it on 4, then on the result.'],
    explain: 'The function has to be defined before anything calls it, with <code>return</code> inside it. Then <code>double(4)</code> is 8, and <code>double(8)</code> is 16.',
    fix: 'Nothing to fix. Python runs top to bottom, so definitions go before their use.',
    takeaway: 'Python runs a file from top to bottom: define functions and variables before the lines that use them.'
  },
  {
    lang: 'python',
    format: 'order',
    difficulty: 3,
    code: `n = 5
n = n * 2
n = n - 3
n = n * 10
print(n)`,
    flag: { line: 3, text: 'n - 3' },
    display: '70',
    nudge: 'Not quite. Try the three sums in different orders, starting from 5.',
    hints: ['70 is 7 × 10, and 7 is 5 × 2 − 3.'],
    explain: 'Each line changes <code>n</code>, so order matters: 5 × 2 = 10, then − 3 = 7, then × 10 = 70. Any other order gives something else (5 − 3 = 2, × 2 = 4, × 10 = 40, for example).',
    fix: 'Nothing to fix. When each step uses the last one\'s result, the steps don\'t commute.',
    takeaway: 'Reassigning a variable step by step is like a recipe: the same steps in a different order give a different result.'
  },
  {
    lang: 'python',
    format: 'order',
    difficulty: 3,
    code: `count = 3
while count > 0:
    print(count)
    count -= 1
print("Go!")`,
    flag: { line: 4, text: 'count -= 1' },
    display: '3\n2\n1\nGo!',
    nudge: 'Not quite. Inside the loop, print before or after counting down?',
    hints: ['To print 3 first, print count before taking 1 off it.'],
    explain: 'The loop prints <code>count</code> and then takes one off, so it prints 3, 2, 1 and stops when <code>count</code> reaches 0. Counting down first would print 2, 1, 0. The last line is outside the loop, so it runs once at the end.',
    fix: 'Nothing to fix. <code>for count in range(3, 0, -1)</code> would do the same in fewer lines.',
    takeaway: 'Inside a loop, the order of "do the work" and "move on" decides which values you see.'
  },

  {
    lang: 'python',
    format: 'bug',
    difficulty: 4,
    code: `def last_three(items):
    return items[-3:-1]

print(last_three([1, 2, 3, 4, 5]))`,
    flag: { line: 2, text: 'items[-3:-1]' },
    expected: '[3, 4, 5]',
    display: '[3, 4]',
    bugLine: 2,
    fixLine: '    return items[-3:]',
    nudge: 'Not that line. Which one decides which items come back?',
    hints: [
      'A slice stops before its end index.',
      'items[-3:-1] stops before the last item. Leave the end out to go all the way.'
    ],
    explain: 'A slice includes its start but stops <b>before</b> its end. <code>items[-3:-1]</code> starts three from the end and stops before the last item, giving <code>[3, 4]</code>.',
    fix: 'Leave the end out to run to the end of the list: <code>items[-3:]</code>.',
    takeaway: 'Slices exclude their end index. To go to the very end, leave it out: <code>items[-3:]</code>.',
    learn: 'lists'
  },
  {
    lang: 'python',
    format: 'bug',
    difficulty: 4,
    code: `original = [1, 2, 3]
backup = original
original.append(4)
print(backup)`,
    flag: { line: 2, text: 'backup = original' },
    expected: '[1, 2, 3]',
    display: '[1, 2, 3, 4]',
    bugLine: 2,
    fixLine: 'backup = original.copy()',
    nudge: 'Not that line. Is backup really a separate list?',
    hints: [
      'Assigning a list to a new name doesn\'t copy it.',
      'backup and original are two names for the same list, so the append shows up in both.'
    ],
    explain: '<code>backup = original</code> doesn\'t copy anything: it gives the <b>same list</b> a second name. Appending through one name changes the list both names point to.',
    fix: 'Make a real copy: <code>backup = original.copy()</code> (or <code>original[:]</code>).',
    takeaway: '<code>b = a</code> never copies a list. Use <code>a.copy()</code> when you need a separate one.',
    learn: 'lists'
  },
  {
    lang: 'python',
    format: 'bug',
    difficulty: 4,
    code: `def has_even(nums):
    for n in nums:
        if n % 2 == 0:
            return True
        return False

print(has_even([1, 3, 4]))`,
    flag: { line: 5, text: 'return False' },
    expected: 'True',
    display: 'False',
    bugLine: 5,
    fixLine: '    return False',
    nudge: 'Not that line. How many numbers does the loop actually look at?',
    hints: [
      'Look at how far each line is indented.',
      'return False is inside the loop, so the function gives up after the first number.'
    ],
    explain: '<code>return False</code> is indented inside the loop, so it runs on the <b>first</b> pass whenever the first number is odd. The function returns before it ever reaches the 4.',
    fix: 'Dedent it so it runs only after the loop has checked every number: <code>    return False</code> in line with <code>for</code>. Or use <code>any(n % 2 == 0 for n in nums)</code>.',
    takeaway: 'Indentation is logic in Python. A "not found" <code>return</code> belongs after the loop, not inside it.'
  },
  {
    lang: 'python',
    format: 'bug',
    difficulty: 4,
    code: `line = "  debug it  "
words = line.split(" ")
print(len(words))`,
    flag: { line: 2, text: 'line.split(" ")' },
    expected: '2',
    display: '6',
    bugLine: 2,
    fixLine: 'words = line.split()',
    nudge: 'Not that line. What does splitting on a single space do with extra spaces?',
    hints: [
      'split(" ") splits at every single space, even ones next to each other.',
      'The spaces at each end make empty strings: [\'\', \'\', \'debug\', \'it\', \'\', \'\'].'
    ],
    explain: '<code>split(" ")</code> cuts at <b>every</b> space, so the two leading and two trailing spaces produce empty strings: <code>[\'\', \'\', \'debug\', \'it\', \'\', \'\']</code>, 6 items.',
    fix: 'Call <code>split()</code> with no argument: it splits on any run of whitespace and drops the ends, giving <code>[\'debug\', \'it\']</code>.',
    takeaway: '<code>split()</code> with no argument is almost always what you want for words; <code>split(" ")</code> keeps empty strings.',
    learn: 'strings'
  },

  // --- Weekend code challenges: "make it pass" (see puzzles/README.md) ---
  {
    lang: 'python',
    format: 'pass',
    difficulty: 5,
    task: '<code>add_tag(tag, tags)</code> adds <code>tag</code> to the end of the list <code>tags</code> and returns that same list. Leave <code>tags</code> out and it starts from a new, empty list every time.',
    code: `def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags`,
    tests: [
      ['add_tag("python")', "['python']"],
      ['add_tag("debug")', "['debug']"],
      ['add_tag("b", ["a"])', "['a', 'b']"]
    ],
    hidden: [
      ['add_tag("it")', "['it']"],
      ['len(add_tag("one"))', '1'],
      ['add_tag("x", [])', "['x']"],
      ['(lambda t: (add_tag("c", t), t))([])', "(['c'], ['c'])"],
      ['(lambda t: add_tag("z", t) is t)(["y"])', 'True']
    ],
    solution: `def add_tag(tag, tags=None):
    if tags is None:
        tags = []
    tags.append(tag)
    return tags`,
    wrong: [
      // An empty list passed in is falsy, so it's swapped for a new one and never changes.
      `def add_tag(tag, tags=None):
    if not tags:
        tags = []
    tags.append(tag)
    return tags`,
      // Builds a new list instead of adding to the one it was given.
      `def add_tag(tag, tags=None):
    if tags is None:
        return [tag]
    return tags + [tag]`,
      // Hard-codes the visible tests.
      `def add_tag(tag, tags=None):
    if tags is None:
        return {"python": ["python"], "debug": ["debug"]}[tag]
    tags.append(tag)
    return tags`
    ],
    nudge: 'Not yet. Does every call without tags get a fresh list, and does a list you pass in really change?',
    hints: [
      'Run the tests: the second call remembers the first one’s tag. Where could that list be living between calls?',
      'A default value is made once, when <code>def</code> runs, and every call shares it. Make <code>None</code> the default and create the new list inside the function.'
    ],
    explain: 'A default like <code>tags=[]</code> is made <b>once</b>, when the function is defined, not on each call. Every call that leaves <code>tags</code> out appends to that one shared list, so the second call returns <code>[\'python\', \'debug\']</code>. The hidden tests also pass in an empty list: <code>if not tags</code> would swap it for a new one, because an empty list is falsy, so check <code>is None</code> instead.',
    fix: '<code>def add_tag(tag, tags=None):</code>, then <code>if tags is None: tags = []</code> before the append.',
    takeaway: 'Never use a mutable value (a list, dict or set) as a default. Default to <code>None</code> and make a new one inside, testing with <code>is None</code>.',
    learn: 'functions'
  },
  {
    lang: 'python',
    format: 'pass',
    difficulty: 5,
    task: '<code>median(nums)</code> returns the middle value of a list of numbers once they’re sorted, or, when there’s an even number of them, the mean of the middle two. It mustn’t change the list it’s given.',
    code: `def median(nums):
    nums.sort()
    mid = len(nums) // 2
    return nums[mid]`,
    tests: [
      ['median([3, 1, 2])', '2'],
      ['median([5])', '5'],
      ['median([4, 1, 3, 2])', '2.5']
    ],
    hidden: [
      ['median([10, 2])', '6.0'],
      ['median([1, 2, 3, 4, 5, 6])', '3.5'],
      ['median([-5, -1, -3])', '-3'],
      ['median([7, 7, 1, 9])', '7.0'],
      ['median([2.5, 0.5])', '1.5'],
      ['(lambda xs: (median(xs), xs))([3, 1, 2])', '(2, [3, 1, 2])']
    ],
    solution: `def median(nums):
    s = sorted(nums)
    mid = len(s) // 2
    if len(s) % 2:
        return s[mid]
    return (s[mid - 1] + s[mid]) / 2`,
    wrong: [
      // Right answers, but sort() reorders the caller's list.
      `def median(nums):
    nums.sort()
    mid = len(nums) // 2
    if len(nums) % 2:
        return nums[mid]
    return (nums[mid - 1] + nums[mid]) / 2`,
      // Hard-codes the visible tests.
      `def median(nums):
    return {3: 2, 1: 5, 4: 2.5}[len(nums)]`
    ],
    nudge: 'Not yet. Check the even-length lists, and look at the list after median() has finished with it.',
    hints: [
      'With 4 numbers, there are two middle ones: positions 1 and 2 once sorted. The answer is their mean.',
      '<code>nums.sort()</code> reorders the caller’s list too. <code>sorted(nums)</code> makes a sorted copy and leaves theirs alone.'
    ],
    explain: 'Two bugs. For an even count, <code>nums[len(nums) // 2]</code> is only the upper of the two middle values; the median is their mean, <code>(s[mid - 1] + s[mid]) / 2</code>. And <code>nums.sort()</code> sorts the caller’s own list in place, so working out a median quietly reorders their data. One hidden test checks the list afterwards.',
    fix: 'Sort a copy with <code>s = sorted(nums)</code>, and for an even length return <code>(s[mid - 1] + s[mid]) / 2</code>.',
    takeaway: '<code>list.sort()</code> changes the list in place (and returns <code>None</code>); <code>sorted()</code> returns a new one. Don’t change what a caller passed in unless that’s the job.',
    learn: 'lists'
  }
);
