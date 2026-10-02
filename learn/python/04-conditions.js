// Python, Unit 4: Conditions. See learn/README.md for the step types and fields.
window.DEBUGG_LEARN.units.push({
  lang: 'python',
  id: 'conditions',
  title: 'Conditions',
  summary: 'Compare values, make choices with if, elif and else, and combine conditions with and, or and not.',
  lessons: [
    {
      id: 'comparing',
      title: 'True or false',
      steps: [
        {
          type: 'teach',
          title: 'Asking a question',
          text: `A <b>comparison</b> asks a question and answers <code>True</code> or <code>False</code>. <code>&gt;</code> and <code>&lt;</code> are greater and less than, <code>==</code> is "equal to" and <code>!=</code> is "not equal to".`,
          code: `print(5 > 3)
print(2 == 3)
print(2 != 3)`,
          output: 'True\nFalse\nTrue'
        },
        {
          type: 'teach',
          title: 'One = or two?',
          text: `One <code>=</code> <b>stores</b> a value in a variable. Two, <code>==</code>, <b>asks</b> whether two values are equal. <code>&gt;=</code> and <code>&lt;=</code> mean "or equal to" as well.`,
          code: `age = 12
print(age == 12)
print(age >= 13)`,
          output: 'True\nFalse'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `x = 7
print(x <= 7, x < 7)`,
          options: [
            { text: 'True False', correct: true },
            { text: 'False False', why: `<= means "less than or equal to", and 7 is equal to 7, so the first one is True.` },
            { text: 'True True', why: `< means strictly less than. 7 isn't less than 7, so the second one is False.` }
          ],
          explain: `7 <= 7 is True because they're equal; 7 < 7 is False because 7 isn't smaller than itself.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `a = 4
b = a * 2
print(b == 8, b != 8)`,
          display: 'True False',
          answers: ['True False'],
          nudge: 'Not quite. Work out b first, then answer each question in turn.',
          explain: `b is 8, so b == 8 is True and b != 8 ("b is not 8") is False.`
        },
        {
          type: 'teach',
          title: 'Comparing text',
          text: `Strings can be compared too. They're only equal if every character matches, capitals included. And a string is never equal to a number, even <code>"5"</code> and <code>5</code>.`,
          code: `print("cat" == "cat")
print("Cat" == "cat")
print("5" == 5)`,
          output: 'True\nFalse\nFalse'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `word = "kiwi"
print(word == "Kiwi", len(word) == 4)`,
          display: 'False True',
          answers: ['False True'],
          nudge: 'Not quite. Check the capital letter, then count the characters.',
          explain: `"kiwi" and "Kiwi" differ in their first letter, so that's False. "kiwi" has 4 characters, so the second is True.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>True</code>.',
          code: `score = 10
print(score ___ 10)`,
          target: 'True',
          options: [
            { text: '>=', correct: true },
            { text: '>', why: `10 isn't greater than 10, so this is False.` },
            { text: '!=', why: `score is 10, so "score is not 10" is False.` }
          ],
          explain: `>= asks "greater than or equal to", and 10 is equal to 10. (== would work too.)`
        },
        {
          type: 'choice',
          question: 'Which of these asks whether <code>x</code> is 5?',
          options: [
            { text: 'x == 5', correct: true },
            { text: 'x = 5', why: `One = stores 5 in x. It doesn't ask anything.` },
            { text: 'x === 5', why: `Some languages, like JavaScript, have ===, but Python doesn't: it's a syntax error.` }
          ],
          explain: `== asks whether two values are equal and gives True or False.`
        }
      ]
    },
    {
      id: 'if',
      title: 'if and else',
      steps: [
        {
          type: 'teach',
          title: 'Only if it\'s true',
          text: `<code>if</code> runs a block of code only when its condition is <code>True</code>. The line ends with a colon, and the block underneath is <b>indented</b> (4 spaces is usual).`,
          code: `temp = 30
if temp > 25:
    print("Hot!")
print("Done")`,
          output: 'Hot!\nDone'
        },
        {
          type: 'teach',
          title: 'Skipped when false',
          text: `When the condition is <code>False</code>, the indented block is skipped. The first line that isn't indented is back outside the <code>if</code>, so it always runs.`,
          code: `temp = 15
if temp > 25:
    print("Hot!")
print("Done")`,
          output: 'Done'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `coins = 3
if coins >= 5:
    print("Buy")
print("Bye")`,
          options: [
            { text: 'Bye', correct: true },
            { text: 'Buy', why: `3 >= 5 is False, so "Buy" is skipped. "Bye" isn't indented, so it isn't part of the if.` },
            { text: 'Nothing at all', why: `Only the indented line is skipped. The last line isn't indented, so it always runs.` }
          ],
          explain: `The condition is False, so the indented print is skipped, and the unindented one runs as usual.`
        },
        {
          type: 'teach',
          title: 'Otherwise: else',
          text: `<code>else</code> gives the other choice: its block runs when the condition is <code>False</code>. Exactly one of the two blocks runs, never both.`,
          code: `age = 10
if age >= 13:
    print("Teen")
else:
    print("Kid")`,
          output: 'Kid'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `x = 8
if x > 10:
    x = x - 10
else:
    x = x + 10
print(x)`,
          display: '18',
          answers: ['18'],
          nudge: 'Not quite. Is 8 greater than 10? That decides which block changes x.',
          explain: `8 > 10 is False, so the else block runs: x becomes 8 + 10 = 18.`
        },
        {
          type: 'teach',
          title: 'Blocks and flags',
          text: `A block can have several lines: everything indented under the <code>if</code> belongs to it. A variable holding <code>True</code> or <code>False</code> can be the condition on its own.`,
          code: `ready = False
if ready:
    print("Go")
    print("Going")
print("Waiting")`,
          output: 'Waiting'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>Go</code>.',
          code: `ready = ___
if ready:
    print("Go")
else:
    print("Wait")`,
          target: 'Go',
          options: [
            { text: 'True', correct: true },
            { text: 'False', why: `With ready False, the if block is skipped and else runs: Wait.` },
            { text: '5 < 3', why: `5 < 3 is False, so ready is False and it prints Wait.` }
          ],
          explain: `ready has to be True for the if block to run.`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `score = 9
if score > 5
    print("Pass")`,
          line: 2,
          errors: true,
          explain: `An if line must end with a colon. Line 2 is missing it, so Python stops with a SyntaxError before running anything.`
        }
      ]
    },
    {
      id: 'elif',
      title: 'More than two ways',
      steps: [
        {
          type: 'teach',
          title: 'elif',
          text: `<code>elif</code> (short for "else if") adds another condition to check when the ones above were <code>False</code>. You can have as many as you like, and an <code>else</code> at the end for when none are true.`,
          code: `temp = 18
if temp > 25:
    print("Hot")
elif temp > 15:
    print("Warm")
else:
    print("Cold")`,
          output: 'Warm'
        },
        {
          type: 'teach',
          title: 'The first match wins',
          text: `Python checks the conditions from the top and runs <b>only the first</b> block whose condition is <code>True</code>. Later ones are skipped, even if they're true too.`,
          code: `n = 50
if n > 10:
    print("over 10")
elif n > 40:
    print("over 40")`,
          output: 'over 10'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `score = 75
if score >= 90:
    print("A")
elif score >= 70:
    print("B")
elif score >= 50:
    print("C")
else:
    print("F")`,
          options: [
            { text: 'B', correct: true },
            { text: 'C', why: `75 is at least 50, but score >= 70 is checked first and is already true, so only its block runs.` },
            { text: 'F', why: `else only runs when every condition above it is False. 75 >= 70 is True.` }
          ],
          explain: `75 >= 90 is False, 75 >= 70 is True: "B" prints and the rest is skipped.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `x = 0
if x > 0:
    print("positive")
elif x < 0:
    print("negative")
else:
    print("zero")`,
          display: 'zero',
          answers: ['zero'],
          nudge: 'Not quite. Is 0 greater than 0? Is it less than 0?',
          explain: `0 is neither greater nor less than 0, so both conditions are False and the else runs.`
        },
        {
          type: 'teach',
          title: 'Separate ifs all get checked',
          text: `Two <code>if</code>s in a row are separate questions: each one is checked, whatever happened with the other. Only <code>elif</code> skips once something above has matched.`,
          code: `n = 50
if n > 10:
    print("over 10")
if n > 40:
    print("over 40")`,
          output: 'over 10\nover 40'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `points = 12
if points > 5:
    points = points + 1
if points > 12:
    points = points * 2
print(points)`,
          options: [
            { text: '26', correct: true },
            { text: '13', why: `The second if is separate, so it's checked too, with points now 13. 13 > 12 is True, so points doubles.` },
            { text: '24', why: `The first if runs as well: points is 13 before it's doubled.` }
          ],
          explain: `12 > 5, so points becomes 13. Then 13 > 12, so it doubles to 26.`
        },
        {
          type: 'line',
          question: 'This should print <code>Hot</code> when <code>temp</code> is over 30, but for 35 it prints <code>Warm</code>. Tap the line that causes it.',
          code: `temp = 35
if temp > 20:
    print("Warm")
elif temp > 30:
    print("Hot")`,
          line: 2,
          explain: `35 > 20 is True, so the first branch wins and the elif is never checked. Put the stricter check first: if temp > 30, then elif temp > 20.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>Warm</code>.',
          code: `temp = 20
if temp > 25:
    print("Hot")
___ temp > 15:
    print("Warm")`,
          target: 'Warm',
          options: [
            { text: 'elif', correct: true },
            { text: 'else', why: `else never takes a condition, so "else temp > 15:" is a syntax error.` },
            { text: 'else if', why: `Python spells it as one word, elif. "else if" on one line is a syntax error.` }
          ],
          explain: `elif adds a second condition, checked because temp > 25 was False.`
        }
      ]
    },
    {
      id: 'logic',
      title: 'and, or, not',
      steps: [
        {
          type: 'teach',
          title: 'and, or',
          text: `<code>and</code> is <code>True</code> only when <b>both</b> sides are true. <code>or</code> is <code>True</code> when <b>at least one</b> side is.`,
          code: `age = 15
print(age > 12 and age < 20)
print(age < 5 or age > 60)`,
          output: 'True\nFalse'
        },
        {
          type: 'teach',
          title: 'not',
          text: `<code>not</code> flips a value: <code>not True</code> is <code>False</code>, and <code>not False</code> is <code>True</code>.`,
          code: `raining = False
print(not raining)
if not raining:
    print("Go outside")`,
          output: 'True\nGo outside'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `has_ticket = True
is_late = True
print(has_ticket and not is_late)`,
          options: [
            { text: 'False', correct: true },
            { text: 'True', why: `not is_late is False, and "and" needs both sides to be True.` },
            { text: 'An error', why: `not goes in front of a value and flips it; this runs fine.` }
          ],
          explain: `has_ticket is True, but not is_late is False, so True and False is False.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `x = 7
if x < 5 or x > 6:
    print("yes")
else:
    print("no")`,
          display: 'yes',
          answers: ['yes'],
          nudge: 'Not quite. With or, one true side is enough. Is 7 less than 5? Is it greater than 6?',
          explain: `7 < 5 is False, but 7 > 6 is True, and one true side is enough for or.`
        },
        {
          type: 'teach',
          title: 'Truthy and falsy',
          text: `A condition doesn't have to be <code>True</code> or <code>False</code>. Zero, the empty string <code>""</code> and the empty list <code>[]</code> count as false; any other number, string or list counts as true.`,
          code: `name = ""
if name:
    print("Hi", name)
else:
    print("No name")
items = [3]
if items:
    print("Got items")`,
          output: 'No name\nGot items'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `count = 0
if count:
    print("some")
else:
    print("none")`,
          options: [
            { text: 'none', correct: true },
            { text: 'some', why: `0 counts as false, so the if block is skipped.` },
            { text: 'An error', why: `A number works fine as a condition: 0 counts as false, anything else as true.` }
          ],
          explain: `count is 0, which counts as false, so the else runs.`
        },
        {
          type: 'teach',
          title: 'A classic slip',
          text: `<code>x == 1 or 2</code> looks like "x is 1 or 2", but Python reads it as <code>(x == 1) or 2</code>, and <code>2</code> on its own counts as true. So it's <b>always</b> true. Write <code>x == 1 or x == 2</code> instead.`,
          code: `x = 5
if x == 1 or 2:
    print("one or two?")`,
          output: 'one or two?'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so Monday prints <code>weekday</code> (and Saturday or Sunday would print <code>weekend</code>).',
          code: `day = "Mon"
if ___:
    print("weekend")
else:
    print("weekday")`,
          target: 'weekday',
          options: [
            { text: 'day == "Sat" or day == "Sun"', correct: true },
            { text: 'day == "Sat" or "Sun"', why: `That's (day == "Sat") or "Sun", and "Sun" on its own is a non-empty string, which counts as true. So every day is a weekend.` },
            { text: 'day != "Sat" or day != "Sun"', why: `Every day differs from at least one of Sat and Sun, so this is always True.` }
          ],
          explain: `Each side of or needs its own full comparison: day == "Sat" or day == "Sun".`
        }
      ]
    }
  ],
  checkpoint: {
    pass: 7,
    steps: [
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `a = 3
b = 3
print(a == b, a != b)`,
        options: [
          { text: 'True False', correct: true },
          { text: 'False True', why: `a and b are both 3, so they are equal: == gives True.` },
          { text: 'True True', why: `!= means "not equal to". They are equal, so that's False.` }
        ],
        explain: `3 == 3 is True, and 3 != 3 is False.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `temp = 22
if temp > 25:
    print("Hot")
elif temp > 20:
    print("Warm")
else:
    print("Cool")`,
        display: 'Warm',
        answers: ['Warm'],
        nudge: 'Not quite. Check the conditions from the top: the first true one wins.',
        explain: `22 > 25 is False, 22 > 20 is True, so "Warm" prints.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `lives = 0
if lives:
    print("Play on")
else:
    print("Game over")`,
        options: [
          { text: 'Game over', correct: true },
          { text: 'Play on', why: `0 counts as false, so the if block is skipped.` }
        ],
        explain: `lives is 0, which counts as false, so the else runs.`
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>not a teen</code>.',
        code: `age = 25
if age >= 13 and age ___ 19:
    print("teen")
else:
    print("not a teen")`,
        target: 'not a teen',
        options: [
          { text: '<=', correct: true },
          { text: '>=', why: `25 >= 19 is True, so both sides are true and it prints "teen".` },
          { text: '!=', why: `25 isn't 19, so that side is True and it prints "teen".` }
        ],
        explain: `age <= 19 is False for 25, so "and" is False and the else runs.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `x = 5
if x > 1:
    print("A")
elif x > 3:
    print("B")`,
        options: [
          { text: 'A', correct: true },
          { text: 'B', why: `5 > 3 is true, but 5 > 1 comes first and is already true, so the elif is skipped.` },
          { text: 'Nothing at all', why: `5 > 1 is True, so "A" prints.` }
        ],
        explain: `Only the first true branch runs: x > 1.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `n = 4
if n > 2:
    n = n + 3
if n > 6:
    n = n * 10
print(n)`,
        display: '70',
        answers: ['70'],
        nudge: 'Not quite. These are two separate ifs, and the second one sees the new n.',
        explain: `4 > 2, so n becomes 7. Then 7 > 6, so n becomes 70.`
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `mark = 55
if mark >= 50:
    print("Pass")
else
    print("Fail")`,
        line: 4,
        errors: true,
        explain: `else needs a colon too. Line 4 is missing it, so it's a SyntaxError.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `x = 4
if x == 1 or 2:
    print("small")
else:
    print("big")`,
        options: [
          { text: 'small', correct: true },
          { text: 'big', why: `Python reads it as (x == 1) or 2, and 2 on its own counts as true, so the if always runs.` }
        ],
        explain: `x == 1 is False, but "or 2" is true, so the condition is true whatever x is.`
      }
    ],
    more: [
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `print(5 > 3, 5 == 3)`,
        options: [
          { text: 'True False', correct: true },
          { text: 'True True', why: '5 == 3 asks whether they are equal, and they aren\'t.' },
          { text: 'False False', why: '5 is bigger than 3, so 5 > 3 is True.' }
        ],
        explain: '5 > 3 is True and 5 == 3 is False.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `n = 7
if n % 2 == 0:
    print("even")
else:
    print("odd")`,
        display: 'odd',
        answers: ['odd'],
        nudge: 'Not quite. What is left when 7 is divided by 2?',
        explain: '7 % 2 is 1, not 0, so the else part runs.'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `x = 15
if x > 20:
    print("big")
elif x > 10:
    print("medium")
else:
    print("small")`,
        options: [
          { text: 'medium', correct: true },
          { text: 'big', why: '15 is not more than 20.' },
          { text: 'small', why: 'The elif is checked before the else, and 15 > 10 is true.' }
        ],
        explain: 'The first test fails, the elif x > 10 is true, so medium prints and the rest is skipped.'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `print(True and not False)`,
        options: [
          { text: 'True', correct: true },
          { text: 'False', why: 'not False is True, and True and True is True.' }
        ],
        explain: 'not False is True, so True and True is True.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `a = 5
n = 0
if a > 1:
    n = n + 1
if a > 3:
    n = n + 1
if a > 9:
    n = n + 1
print(n)`,
        display: '2',
        answers: ['2'],
        nudge: 'Not quite. Every separate if is checked. How many of them are true?',
        explain: 'The first two ifs are true and the third isn\'t, so n goes up twice: 2.'
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `mark = 70
if mark = 70:
    print("pass")`,
        line: 2,
        errors: true,
        explain: 'Line 2 uses = (store) where == (compare) is needed, so Python stops with a SyntaxError.'
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>not a teen</code>.',
        code: `age = 8
if age >= 13 ___ age <= 19:
    print("teen")
else:
    print("not a teen")`,
        target: 'not a teen',
        options: [
          { text: 'and', correct: true },
          { text: 'or', why: 'With or, one true side is enough: 8 <= 19, so it would print teen.' }
        ],
        explain: 'With and, both sides must be true, and 8 >= 13 isn\'t.'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `word = "apple"
print(word == "Apple", word == "apple")`,
        options: [
          { text: 'False True', correct: true },
          { text: 'True True', why: 'Capital letters matter when comparing text, so "apple" and "Apple" differ.' },
          { text: 'False False', why: 'word is exactly "apple", so the second comparison is True.' }
        ],
        explain: 'Text has to match exactly, capitals included.'
      }
    ]
  }
});
