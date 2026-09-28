// Python, Unit 1: Values and printing. See learn/README.md for the step types and fields.
window.DEBUGG_LEARN.units.push({
  lang: 'python',
  id: 'values',
  title: 'Values and printing',
  summary: 'Print text and numbers, do arithmetic, and store values in variables.',
  lessons: [
    {
      id: 'print',
      title: 'print() and text',
      steps: [
        {
          type: 'teach',
          title: 'Your first line of Python',
          text: '<code>print()</code> shows whatever you put between its brackets. Text goes in quotes: that\'s a <b>string</b>. The quotes tell Python where the text starts and ends; they aren\'t printed.',
          code: `print("Hello, world!")`,
          output: 'Hello, world!'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `print("Ready")`,
          options: [
            { text: 'Ready', correct: true },
            { text: '"Ready"', why: 'The quotes only mark where the string starts and ends. They aren\'t part of the text.' },
            { text: 'print("Ready")', why: 'Python runs the code rather than showing it: print() shows the value inside the brackets.' }
          ],
          explain: 'print() shows the string\'s text, without the quotes around it.'
        },
        {
          type: 'teach',
          title: 'Joining strings',
          text: '<code>+</code> joins two strings into one, exactly as they are. It doesn\'t add a space: if you want one, it has to be inside a string.',
          code: `print("Deb" + "ugg")`,
          output: 'Debugg'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `print("Hello" + "there")`,
          options: [
            { text: 'Hellothere', correct: true },
            { text: 'Hello there', why: '+ never adds a space. It joins the two strings exactly as they are.' },
            { text: 'Hello+there', why: 'The + is Python code, not text: it joins the strings, and isn\'t printed itself.' }
          ],
          explain: '+ joins strings with nothing in between, so you get "Hellothere".'
        },
        {
          type: 'teach',
          title: 'Printing several things',
          text: 'You can give <code>print()</code> several things, separated by commas. It prints them all on one line, with a space between each.',
          code: `print("Level", 3)`,
          output: 'Level 3'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>Hello world</code>.',
          code: `print("Hello" ___ "world")`,
          target: 'Hello world',
          options: [
            { text: ',', correct: true },
            { text: '+', why: '+ joins the strings with no space, giving "Helloworld".' },
            { text: '&', why: '& doesn\'t work on strings in Python: it\'s an error.' }
          ],
          explain: 'A comma gives print() two separate things, and print() puts a space between them.'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `print("Day", 1, "of", 7)`,
          display: 'Day 1 of 7',
          answers: ['Day 1 of 7'],
          nudge: 'Not quite. print() puts one space between each item.',
          explain: 'Four items, separated by commas, so print() shows them with a space between each: Day 1 of 7.'
        },
        {
          type: 'teach',
          title: 'Quotes must match',
          text: 'Strings can use double quotes <code>"like this"</code> or single quotes <code>\'like this\'</code>. Either works, but a string has to end with the same kind of quote it started with.',
          code: `print('single')
print("double")`,
          output: 'single\ndouble'
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `print("Welcome")
print('to Debugg')
print("Let's go')`,
          line: 3,
          errors: true,
          explain: 'Line 3 starts its string with " but tries to end it with \', so the string never ends. (The \' in "Let\'s" is fine: inside double quotes, a single quote is just a character.)'
        }
      ]
    },
    {
      id: 'numbers',
      title: 'Numbers and arithmetic',
      steps: [
        {
          type: 'teach',
          title: 'Python as a calculator',
          text: 'Numbers don\'t need quotes. Python does arithmetic with <code>+</code>, <code>-</code>, <code>*</code> (times) and <code>/</code> (divide). Division with <code>/</code> always gives a decimal number, called a <b>float</b>.',
          code: `print(6 * 7)
print(9 / 3)`,
          output: '42\n3.0'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `print(7 / 2)`,
          options: [
            { text: '3.5', correct: true },
            { text: '3', why: 'That\'s what // gives (floor division). / keeps the fraction.' },
            { text: '3.0', why: 'It is a float, but / keeps the .5: 7 divided by 2 is 3.5.' }
          ],
          explain: '/ is true division: 7 / 2 is 3.5.'
        },
        {
          type: 'teach',
          title: 'Whole-number division',
          text: '<code>//</code> divides and rounds down to a whole number. <code>%</code> (modulo) gives the remainder. Together they answer "how many fit, and how many are left over?"',
          code: `print(17 // 5)
print(17 % 5)`,
          output: '3\n2'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `print(7 // 2, 7 % 2)`,
          display: '3 1',
          answers: ['3 1', '3,1'],
          nudge: 'Not quite. How many whole 2s fit into 7, and how much is left?',
          explain: 'Three 2s fit into 7 (7 // 2 is 3), with 1 left over (7 % 2 is 1).'
        },
        {
          type: 'teach',
          title: 'Order of operations',
          text: 'Python follows the usual maths order: <code>**</code> (power) first, then <code>*</code> <code>/</code> <code>//</code> <code>%</code>, then <code>+</code> and <code>-</code>. Brackets go first of all.',
          code: `print(2 + 3 * 4)
print((2 + 3) * 4)`,
          output: '14\n20'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `print(10 - 2 * 3)`,
          options: [
            { text: '4', correct: true },
            { text: '24', why: 'That\'s (10 - 2) * 3. Multiplication happens before subtraction.' },
            { text: '10 - 6', why: 'Python works the whole sum out and prints the result.' }
          ],
          explain: '2 * 3 is worked out first (6), then 10 - 6 is 4.'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>8</code> (2 to the power 3).',
          code: `print(2 ___ 3)`,
          target: '8',
          options: [
            { text: '**', correct: true },
            { text: '*', why: '* multiplies: 2 * 3 is 6.' },
            { text: '^', why: 'In Python, ^ isn\'t "to the power". It\'s a bitwise operator, and 2 ^ 3 is 1.' }
          ],
          explain: '** is the power operator: 2 ** 3 is 2 × 2 × 2 = 8.'
        },
        {
          type: 'teach',
          title: 'Numbers and strings are different',
          text: 'A number in quotes is a string, not a number. <code>+</code> on two strings joins them, so <code>"2" + "3"</code> is <code>"23"</code>, not 5.',
          code: `print(2 + 3)
print("2" + "3")`,
          output: '5\n23'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `print("4" + "4")`,
          options: [
            { text: '44', correct: true },
            { text: '8', why: 'These are strings, because of the quotes. + joins strings rather than adding them.' },
            { text: '"4" + "4"', why: 'Python works out the expression: joining "4" and "4" gives 44.' }
          ],
          explain: 'With quotes, "4" is text, so + joins the two strings into 44.'
        }
      ]
    },
    {
      id: 'variables',
      title: 'Variables',
      steps: [
        {
          type: 'teach',
          title: 'Naming a value',
          text: 'A <b>variable</b> is a name for a value. <code>=</code> stores the value on the right under the name on the left. After that, using the name gives you the value.',
          code: `lives = 3
print(lives)`,
          output: '3'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `score = 5
score = score + 1
print(score)`,
          display: '6',
          answers: ['6'],
          nudge: 'Not quite. Work out the right-hand side of line 2 first, using the current score.',
          explain: 'Line 2 works out score + 1 (5 + 1 = 6) and then stores 6 back in score.'
        },
        {
          type: 'teach',
          title: '= means "store", not "equals"',
          text: '<code>=</code> copies a value in at that moment. If you later give one name a new value, other names that were set from it don\'t change.',
          code: `a = 1
b = a
a = 2
print(b)`,
          output: '1'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `price = 3
cost = price * 2
price = 10
print(cost)`,
          options: [
            { text: '6', correct: true },
            { text: '20', why: 'cost was worked out on line 2, when price was 3. Changing price afterwards doesn\'t redo that sum.' },
            { text: 'price * 2', why: 'Line 2 stores the result of the sum, not the sum itself.' }
          ],
          explain: 'cost was set to 3 * 2 = 6 on line 2. Giving price a new value later doesn\'t change cost.'
        },
        {
          type: 'teach',
          title: 'Names must exist first',
          text: 'You can only use a variable after it\'s been given a value. Names are also case-sensitive: <code>score</code> and <code>Score</code> are two different names.',
          code: `name = "Ada"
print(name)`,
          output: 'Ada'
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `score = 10
score = score + 5
print(Score)`,
          line: 3,
          errors: true,
          explain: 'Line 3 uses Score with a capital S, but only score (lower case) was ever set. Python stops with a NameError.'
        },
        {
          type: 'teach',
          title: 'Putting values into text',
          text: 'An <b>f-string</b> has an <code>f</code> before its opening quote. Inside it, anything in <code>{curly brackets}</code> is worked out and put into the text.',
          code: `name = "Ada"
print(f"Hi {name}!")`,
          output: 'Hi Ada!'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `city = "Oslo"
days = 3
print(f"{days} days in {city}")`,
          display: '3 days in Oslo',
          answers: ['3 days in Oslo'],
          nudge: 'Not quite. Swap each {name} for that variable\'s value.',
          explain: 'The f-string puts in the value of days (3) and city (Oslo).'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>12</code>.',
          code: `boxes = 4
per_box = 3
print(boxes ___ per_box)`,
          target: '12',
          options: [
            { text: '*', correct: true },
            { text: '+', why: '+ adds: 4 + 3 is 7.' },
            { text: 'x', why: 'x isn\'t an operator in Python; here it\'s an error. Multiplication is *.' }
          ],
          explain: '* multiplies: 4 boxes of 3 is 12.'
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
        code: `print(10 / 4)`,
        options: [
          { text: '2.5', correct: true },
          { text: '2', why: '/ keeps the fraction. 10 // 4 would be 2.' },
          { text: '3', why: 'Python doesn\'t round the result of /.' }
        ],
        explain: '/ is true division: 10 / 4 is 2.5.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `print(10 // 4, 10 % 4)`,
        display: '2 2',
        answers: ['2 2', '2,2'],
        nudge: 'Not quite. How many whole 4s fit into 10, and what\'s left?',
        explain: 'Two 4s fit into 10 (10 // 4 is 2), leaving 2 (10 % 4 is 2).'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `print("Hi", "Ada")`,
        options: [
          { text: 'Hi Ada', correct: true },
          { text: 'HiAda', why: 'That\'s what + would give. Separate items in print() get a space between them.' },
          { text: 'Hi, Ada', why: 'The comma separates the items in the code; it isn\'t printed.' }
        ],
        explain: 'print() puts a space between the items you give it.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `n = 4
n = n * 2
print(n)`,
        display: '8',
        answers: ['8'],
        nudge: 'Not quite. Line 2 uses n\'s current value, then stores the result.',
        explain: 'n * 2 is 4 * 2 = 8, which is stored back in n.'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `print(1 + 2 * 3)`,
        options: [
          { text: '7', correct: true },
          { text: '9', why: 'That\'s (1 + 2) * 3. Multiplication comes before addition.' },
          { text: '6', why: 'Work out 2 * 3 first (6), then add the 1.' }
        ],
        explain: '2 * 3 is worked out first, then 1 + 6 is 7.'
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `total = 5
print("start")
print(totl)`,
        line: 3,
        errors: true,
        explain: 'Line 3 misspells total as totl, a name that was never given a value, so Python stops with a NameError.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `name = "Grace"
print(f"Welcome, {name}")`,
        display: 'Welcome, Grace',
        answers: ['Welcome, Grace'],
        nudge: 'Not quite. The f-string swaps {name} for the value of name.',
        explain: 'The f-string puts in name\'s value: Welcome, Grace.'
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>9</code>.',
        code: `print(3 ___ 2)`,
        target: '9',
        options: [
          { text: '**', correct: true },
          { text: '*', why: '* multiplies: 3 * 2 is 6.' },
          { text: '^', why: '^ isn\'t "to the power" in Python: 3 ^ 2 is 1.' }
        ],
        explain: '** is the power operator: 3 ** 2 is 3 × 3 = 9.'
      }
    ]
  }
});
