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
  }
);
