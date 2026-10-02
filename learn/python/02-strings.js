// Python, Unit 2: Strings. See learn/README.md for the step types and fields.
window.DEBUGG_LEARN.units.push({
  lang: 'python',
  id: 'strings',
  title: 'Strings',
  summary: 'Pick characters out of text, slice it, change it with string methods, and build it with f-strings.',
  lessons: [
    {
      id: 'indexing',
      title: 'Characters and length',
      steps: [
        {
          type: 'teach',
          title: 'Every character has a position',
          text: `A string is a row of characters, and each one has a position called its <b>index</b>. Counting starts at <b>0</b>, not 1. Put the index in square brackets to get that character.`,
          code: `word = "kiwi"
print(word[0])
print(word[3])`,
          output: 'k\ni'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `name = "Python"
print(name[1])`,
          options: [
            { text: 'y', correct: true },
            { text: 'P', why: `P is at index 0. Counting starts at 0, so index 1 is the second character.` },
            { text: 't', why: `That's index 2. Index 0 is P, index 1 is y.` }
          ],
          explain: `Indexes start at 0: P is 0, y is 1, t is 2, and so on.`
        },
        {
          type: 'teach',
          title: 'How long is it?',
          text: `<code>len()</code> counts the characters in a string. Because indexes start at 0, the last character's index is always one less than the length.`,
          code: `print(len("debug"))`,
          output: '5'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `word = "rubber"
print(len(word), word[5])`,
          display: '6 r',
          answers: ['6 r', '6,r'],
          nudge: 'Not quite. Count the letters, then count positions from 0.',
          explain: `"rubber" has 6 characters, at indexes 0 to 5, so word[5] is the last one: r.`
        },
        {
          type: 'teach',
          title: 'Counting from the end',
          text: `A negative index counts back from the end: <code>[-1]</code> is the last character, <code>[-2]</code> the one before. It's handy when you don't know how long the string is.`,
          code: `word = "feather"
print(word[-1])
print(word[-2])`,
          output: 'r\ne'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>k</code>.',
          code: `word = "beak"
print(word[___])`,
          target: 'k',
          options: [
            { text: '-1', correct: true },
            { text: '4', why: `"beak" has indexes 0 to 3. Index 4 is past the end, which is an error.` },
            { text: '1', why: `Index 1 is the second character, e.` }
          ],
          explain: `-1 always means the last character, whatever the length.`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `word = "bug"
print(word[0])
print(word[2])
print(word[3])`,
          line: 4,
          errors: true,
          explain: `"bug" has 3 characters, at indexes 0, 1 and 2. There's no index 3, so line 4 stops with an IndexError: string index out of range.`
        }
      ]
    },
    {
      id: 'slicing',
      title: 'Slices',
      steps: [
        {
          type: 'teach',
          title: 'Taking a slice',
          text: `<code>word[start:stop]</code> gives you part of a string, a <b>slice</b>. It starts at <code>start</code> and stops <b>just before</b> <code>stop</code>: the stop index itself isn't included.`,
          code: `word = "debugging"
print(word[0:5])`,
          output: 'debug'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `word = "Python"
print(word[1:4])`,
          options: [
            { text: 'yth', correct: true },
            { text: 'ytho', why: `The stop index isn't included: the slice ends just before index 4 (the o).` },
            { text: 'Pyt', why: `The slice starts at index 1, the y. P is index 0.` }
          ],
          explain: `Indexes 1, 2 and 3: y, t and h. It stops before index 4.`
        },
        {
          type: 'teach',
          title: 'From the start, to the end',
          text: `Leave out <code>start</code> to begin at the start, or leave out <code>stop</code> to go to the end. <code>word[:3]</code> is the first three characters; <code>word[3:]</code> is everything after them.`,
          code: `word = "rubber"
print(word[:3])
print(word[3:])`,
          output: 'rub\nber'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `s = "keyboard"
print(s[3:])`,
          display: 'board',
          answers: ['board'],
          nudge: 'Not quite. Start at index 3 (the fourth character) and go to the end.',
          explain: `k, e and y are indexes 0 to 2, so s[3:] starts at the b: board.`
        },
        {
          type: 'teach',
          title: 'Backwards and from the end',
          text: `Negative numbers work in slices too: <code>word[-3:]</code> is the last three characters. A third number is the <b>step</b>, and a step of <code>-1</code> walks backwards, so <code>word[::-1]</code> is the string reversed.`,
          code: `word = "stressed"
print(word[-3:])
print(word[::-1])`,
          output: 'sed\ndesserts'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>dog</code>.',
          code: `word = "god"
print(word[___])`,
          target: 'dog',
          options: [
            { text: '::-1', correct: true },
            { text: ':-1', why: `That's everything up to (not including) the last character: "go".` },
            { text: '-1:', why: `That starts at the last character and goes to the end: just "d".` }
          ],
          explain: `A step of -1 walks the string backwards, so "god" becomes "dog".`
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `word = "hi"
print(word[0:10])`,
          options: [
            { text: 'hi', correct: true },
            { text: 'IndexError', why: `Slices never go out of range: a stop past the end just means "to the end". Only a single index like word[10] is an error.` },
            { text: 'h', why: `The slice goes from index 0 up to 10, and the string ends first, so you get all of it.` }
          ],
          explain: `A slice that runs past the end stops at the end, with no error. That's different from word[10], which would be an IndexError.`
        }
      ]
    },
    {
      id: 'methods',
      title: 'String methods',
      steps: [
        {
          type: 'teach',
          title: 'Methods',
          text: `Strings come with built-in tools called <b>methods</b>. You call one with a dot after the string: <code>name.upper()</code>. <code>upper()</code> gives the text in capitals, and <code>lower()</code> in small letters.`,
          code: `name = "Ada"
print(name.upper())
print(name.lower())`,
          output: 'ADA\nada'
        },
        {
          type: 'teach',
          title: 'Strings never change',
          text: `A method gives you a <b>new</b> string; the original stays exactly as it was. Strings can't be changed in place. To keep the result, store it: <code>word = word.upper()</code>.`,
          code: `word = "quiet"
word.upper()
print(word)`,
          output: 'quiet'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `shout = "hello"
shout.upper()
print(shout)`,
          options: [
            { text: 'hello', correct: true },
            { text: 'HELLO', why: `upper() made a new string, "HELLO", but nothing kept it. shout still holds the original "hello".` },
            { text: 'Hello', why: `That's what capitalize() would give. And either way, the new string wasn't stored.` }
          ],
          explain: `Line 2 makes "HELLO" and throws it away. To keep it, write shout = shout.upper().`
        },
        {
          type: 'teach',
          title: 'Tidying text',
          text: `<code>strip()</code> removes spaces from both ends (not the middle). <code>replace(old, new)</code> swaps every copy of one piece of text for another.`,
          code: `msg = "  hi there  "
print(msg.strip())
print("a-b-c".replace("-", "+"))`,
          output: 'hi there\na+b+c'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `s = "banana"
print(s.replace("a", "o"))`,
          display: 'bonono',
          answers: ['bonono'],
          nudge: 'Not quite. replace() swaps every "a", not just the first.',
          explain: `replace() changes every copy of "a", so all three become "o": bonono.`
        },
        {
          type: 'teach',
          title: 'Searching',
          text: `<code>in</code> checks whether one string appears inside another, giving <code>True</code> or <code>False</code>. <code>count()</code> says how many times it appears.`,
          code: `print("nan" in "banana")
print("banana".count("a"))`,
          output: 'True\n3'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>True</code>.',
          code: `print("kiwi" ___ "baby kiwi")`,
          target: 'True',
          options: [
            { text: 'in', correct: true },
            { text: '==', why: `== asks whether the two strings are exactly equal, and they aren't, so it prints False.` },
            { text: '+', why: `+ joins the strings, printing "kiwibaby kiwi".` }
          ],
          explain: `"kiwi" appears inside "baby kiwi", so "kiwi" in "baby kiwi" is True.`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `word = "bug"
print(word.upper())
print(word.Upper())`,
          line: 3,
          errors: true,
          explain: `Python cares about capitals: the method is upper(), and there's no Upper(). Line 3 stops with an AttributeError.`
        }
      ]
    },
    {
      id: 'fstrings',
      title: 'f-strings and conversions',
      steps: [
        {
          type: 'teach',
          title: 'Text and numbers don\'t mix with +',
          text: `<code>+</code> can add two numbers or join two strings, but not one of each. Turn a number into text first with <code>str()</code>.`,
          code: `age = 7
print("Age: " + str(age))`,
          output: 'Age: 7'
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `lives = 3
print("Lives:", lives)
print("Lives: " + lives)`,
          line: 3,
          errors: true,
          explain: `Line 2 is fine: commas let print() show text and numbers together. Line 3 tries to + a string and a number, which is a TypeError. It needs str(lives).`
        },
        {
          type: 'teach',
          title: 'f-strings',
          text: `An <b>f-string</b> has an <code>f</code> before the quotes. Anything inside <code>{curly brackets}</code> is worked out and dropped into the text, numbers included. It's the easiest way to build a message.`,
          code: `name = "Ada"
level = 3
print(f"{name} is level {level}")`,
          output: 'Ada is level 3'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `a = 4
b = 5
print(f"{a} + {b} = {a + b}")`,
          display: '4 + 5 = 9',
          answers: ['4 + 5 = 9', '4+5=9'],
          nudge: 'Not quite. Only the parts in {curly brackets} are worked out; the rest is printed as it is.',
          explain: `{a} and {b} become 4 and 5, and {a + b} is worked out as 9. The + and = outside the brackets are just text.`
        },
        {
          type: 'teach',
          title: 'Numbers stored as text',
          text: `<code>"3"</code> is text that happens to look like a number, so <code>"3" + "4"</code> joins them. <code>int()</code> turns text into a whole number you can do sums with.`,
          code: `print("3" + "4")
print(int("3") + int("4"))`,
          output: '34\n7'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `print("5" * 3)`,
          options: [
            { text: '555', correct: true },
            { text: '15', why: `"5" is a string, not a number. * with a string repeats it.` },
            { text: '5 5 5', why: `Repeating a string adds nothing in between: "5" three times is "555".` }
          ],
          explain: `A string times a number repeats the string: "5" * 3 is "555".`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>10</code>.',
          code: `x = "5"
print(___(x) * 2)`,
          target: '10',
          options: [
            { text: 'int', correct: true },
            { text: 'str', why: `x is already a string, so str(x) * 2 repeats it: "55".` },
            { text: 'len', why: `len(x) is the number of characters, 1, so this prints 2.` }
          ],
          explain: `int(x) turns the text "5" into the number 5, and 5 * 2 is 10.`
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
        code: `s = "hello"
print(s[1])`,
        options: [
          { text: 'e', correct: true },
          { text: 'h', why: `h is at index 0. Index 1 is the second character.` },
          { text: 'l', why: `That's index 2 (and 3).` }
        ],
        explain: `Indexes start at 0, so s[1] is the second character, e.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `print(len("Debuggit"))`,
        display: '8',
        answers: ['8'],
        nudge: 'Not quite. Count every letter.',
        explain: `D-e-b-u-g-g-i-t: 8 characters.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `word = "pythonic"
print(word[2:6])`,
        options: [
          { text: 'thon', correct: true },
          { text: 'ytho', why: `That's word[1:5]. Index 2 is the t.` },
          { text: 'thoni', why: `The stop index, 6, isn't included: the slice ends at index 5.` }
        ],
        explain: `Indexes 2 to 5: t, h, o, n.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `print("level"[::-1])`,
        display: 'level',
        answers: ['level'],
        nudge: 'Not quite. [::-1] reverses the string. What is "level" backwards?',
        explain: `[::-1] reverses it, and "level" reads the same both ways.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `s = "Hi"
s.lower()
print(s)`,
        options: [
          { text: 'Hi', correct: true },
          { text: 'hi', why: `lower() made a new string, but nothing stored it. s is still "Hi".` },
          { text: 'HI', why: `Nothing here makes capitals, and s hasn't changed anyway.` }
        ],
        explain: `Strings never change in place. To keep the result: s = s.lower().`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `name = "Bo"
print(f"Hi {name}!")`,
        display: 'Hi Bo!',
        answers: ['Hi Bo!'],
        nudge: 'Not quite. {name} is swapped for the value of name.',
        explain: `The f-string drops name's value into the text: Hi Bo!`
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `score = 10
print("Score:", score)
print("Score: " + score)`,
        line: 3,
        errors: true,
        explain: `+ can't join a string and a number. Line 3 needs str(score), or an f-string.`
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>4</code>.',
        code: `print("banana".___("a") + 1)`,
        target: '4',
        options: [
          { text: 'count', correct: true },
          { text: 'find', why: `find() gives the index of the first "a", which is 1, so this prints 2.` },
          { text: 'upper', why: `upper() doesn't take anything in its brackets, so this is an error.` }
        ],
        explain: `There are three a's in "banana", and 3 + 1 is 4.`
      }
    ]
  }
});
