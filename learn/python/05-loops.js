// Python, Unit 5: Loops. See learn/README.md for the step types and fields.
window.DEBUGG_LEARN.units.push({
  lang: 'python',
  id: 'loops',
  title: 'Loops',
  summary: 'Repeat code with for and while, count with range, stop early with break, skip with continue, and build up totals and lists.',
  lessons: [
    {
      id: 'for',
      title: 'Going through a list',
      steps: [
        {
          type: 'teach',
          title: 'One item at a time',
          text: `A <code>for</code> loop runs its indented block once for each item in a list. Each time round, the loop variable (here <code>name</code>) holds the next item.`,
          code: `for name in ["Ada", "Bo", "Cy"]:
    print("Hi", name)`,
          output: 'Hi Ada\nHi Bo\nHi Cy'
        },
        {
          type: 'teach',
          title: 'Strings too',
          text: `A <code>for</code> loop over a string gives you one character at a time.`,
          code: `for ch in "duck":
    print(ch)`,
          output: 'd\nu\nc\nk'
        },
        {
          type: 'teach',
          title: 'Adding up as you go',
          text: `To total something, start a variable at 0 <b>before</b> the loop, then add to it inside. After the loop, it holds the result.`,
          code: `count = 0
for word in ["a", "bb", "ccc"]:
    count = count + len(word)
print(count)`,
          output: '6'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `total = 0
for n in [3, 4, 5]:
    total = total + n
print(total)`,
          options: [
            { text: '12', correct: true },
            { text: '5', why: `total isn't replaced each time: each n is added to what's already there.` },
            { text: '345', why: `These are numbers, so + adds them. Only strings join end to end.` }
          ],
          explain: `total goes 0, 3, 7, 12.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `word = ""
for ch in "abc":
    word = ch + word
print(word)`,
          display: 'cba',
          answers: ['cba'],
          nudge: 'Not quite. Each new character goes on the front of word, not the end.',
          explain: `word goes "a", then "ba", then "cba": each character is put in front, which reverses the string.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>3</code>, the number of items.',
          code: `count = 0
for x in [5, 8, 2]:
    count = ___
print(count)`,
          target: '3',
          options: [
            { text: 'count + 1', correct: true },
            { text: 'count + x', why: `That adds up the items themselves: 5 + 8 + 2 = 15.` },
            { text: 'x', why: `That just keeps the latest item, so count ends as 2.` }
          ],
          explain: `Adding 1 each time round counts the items: there are 3.`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `for n in [1, 2, 3]:
print(n)`,
          line: 2,
          errors: true,
          explain: `The loop's block must be indented. Line 2 isn't, so Python stops with an IndentationError.`
        }
      ]
    },
    {
      id: 'range',
      title: 'Counting with range',
      steps: [
        {
          type: 'teach',
          title: 'range()',
          text: `<code>range(3)</code> counts 0, 1, 2: it starts at 0 and stops <b>before</b> 3. So a loop over <code>range(n)</code> runs n times.`,
          code: `for i in range(3):
    print(i)`,
          output: '0\n1\n2'
        },
        {
          type: 'teach',
          title: 'Start, stop and step',
          text: `<code>range(2, 6)</code> starts at 2 and stops before 6. A third number is the step: <code>range(0, 10, 3)</code> goes up in 3s. <code>list()</code> turns a range into a list, so you can print it.`,
          code: `print(list(range(2, 6)))
print(list(range(0, 10, 3)))`,
          output: '[2, 3, 4, 5]\n[0, 3, 6, 9]'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `print(list(range(1, 4)))`,
          options: [
            { text: '[1, 2, 3]', correct: true },
            { text: '[1, 2, 3, 4]', why: `The stop number is never included: range(1, 4) stops before 4.` },
            { text: '[0, 1, 2, 3]', why: `With a start given, it starts there, at 1, not 0.` }
          ],
          explain: `From 1 up to, but not including, 4.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `total = 0
for i in range(5):
    total = total + i
print(total)`,
          display: '10',
          answers: ['10'],
          nudge: 'Not quite. range(5) is 0, 1, 2, 3, 4. Add those up.',
          explain: `0 + 1 + 2 + 3 + 4 = 10. There's no 5: range stops before it.`
        },
        {
          type: 'teach',
          title: 'Counting down',
          text: `A negative step counts down. The stop is still left out, so <code>range(3, 0, -1)</code> is 3, 2, 1.`,
          code: `for i in range(3, 0, -1):
    print(i)
print("Go!")`,
          output: '3\n2\n1\nGo!'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>[1, 2, 3, 4, 5]</code>.',
          code: `print(list(range(1, ___)))`,
          target: '[1, 2, 3, 4, 5]',
          options: [
            { text: '6', correct: true },
            { text: '5', why: `range stops before the stop number, so range(1, 5) ends at 4.` },
            { text: '7', why: `That goes one too far: range(1, 7) ends at 6.` }
          ],
          explain: `To include 5, the stop has to be one more: 6.`
        },
        {
          type: 'teach',
          title: 'Positions with range(len())',
          text: `<code>range(len(names))</code> gives each index of a list, so you can use the position and the item together.`,
          code: `names = ["Ada", "Bo"]
for i in range(len(names)):
    print(i, names[i])`,
          output: '0 Ada\n1 Bo'
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `nums = [10, 20, 30]
for i in range(4):
    print(nums[i])`,
          line: 3,
          errors: true,
          explain: `range(4) goes 0, 1, 2, 3, but the list only has indexes 0 to 2. When i is 3, nums[i] on line 3 is an IndexError. range(len(nums)) always fits.`
        }
      ]
    },
    {
      id: 'while',
      title: 'while loops',
      steps: [
        {
          type: 'teach',
          title: 'Repeat while it\'s true',
          text: `A <code>while</code> loop repeats its block as long as its condition is <code>True</code>. Use it when you don't know in advance how many times round you'll need.`,
          code: `n = 1
while n < 20:
    n = n * 2
print(n)`,
          output: '32'
        },
        {
          type: 'teach',
          title: 'Checked before each round',
          text: `The condition is checked before every round, including the first. If it's <code>False</code> from the start, the block never runs at all.`,
          code: `count = 5
while count < 3:
    print("never")
    count = count + 1
print("count is", count)`,
          output: 'count is 5'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `n = 10
steps = 0
while n > 0:
    n = n - 3
    steps = steps + 1
print(steps)`,
          options: [
            { text: '4', correct: true },
            { text: '3', why: `After 3 rounds n is 1, which is still greater than 0, so it goes round once more.` },
            { text: '10', why: `steps counts rounds, and n drops by 3 each round, not 1.` }
          ],
          explain: `n goes 10, 7, 4, 1, -2. That's 4 rounds before n > 0 is False.`
        },
        {
          type: 'teach',
          title: 'Make sure it ends',
          text: `Something inside a <code>while</code> loop must change so the condition becomes <code>False</code> in the end. If nothing does, like <code>while x &lt; 5:</code> with no change to <code>x</code>, the loop runs forever.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `x = 100
while x >= 10:
    x = x // 2
print(x)`,
          display: '6',
          answers: ['6'],
          nudge: 'Not quite. Halve it (rounding down) until it drops below 10.',
          explain: `x goes 100, 50, 25, 12, 6. 6 >= 10 is False, so the loop stops.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>3</code>.',
          code: `n = 0
while n ___ 3:
    n = n + 1
print(n)`,
          target: '3',
          options: [
            { text: '<', correct: true },
            { text: '<=', why: `When n is 3, 3 <= 3 is still True, so it goes round once more and prints 4.` },
            { text: '>', why: `0 > 3 is False from the start, so the loop never runs and it prints 0.` }
          ],
          explain: `n goes up while it's less than 3, so it stops at exactly 3.`
        },
        {
          type: 'line',
          question: 'This should print 1, 2 and 3, but it never stops. Tap the line that\'s wrong.',
          code: `i = 1
while i <= 3:
    print(i)
    i = i - 1`,
          line: 4,
          explain: `i goes down instead of up (1, 0, -1…), so i <= 3 is always True. Line 4 should be i = i + 1.`
        }
      ]
    },
    {
      id: 'break',
      title: 'Stopping early, building lists',
      steps: [
        {
          type: 'teach',
          title: 'break',
          text: `<code>break</code> ends the loop straight away, skipping the rest of the block and any items left.`,
          code: `for n in [4, 7, 12, 3]:
    if n > 10:
        print("found", n)
        break
    print("checked", n)`,
          output: 'checked 4\nchecked 7\nfound 12'
        },
        {
          type: 'teach',
          title: 'continue',
          text: `<code>continue</code> skips the rest of this round and moves on to the next item. Here it skips the even numbers (<code>n % 2 == 0</code>).`,
          code: `for n in range(6):
    if n % 2 == 0:
        continue
    print(n)`,
          output: '1\n3\n5'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `total = 0
for n in [5, 10, 15, 20]:
    if n == 15:
        break
    total = total + n
print(total)`,
          options: [
            { text: '15', correct: true },
            { text: '50', why: `break ends the loop at 15, so 15 and 20 are never added.` },
            { text: '30', why: `break comes before the adding, so 15 itself isn't added either.` }
          ],
          explain: `5 and 10 are added; at 15 the loop breaks before adding it. 5 + 10 = 15.`
        },
        {
          type: 'teach',
          title: 'Building a list',
          text: `Start with an empty list before the loop and <code>append()</code> to it inside. It's the same idea as a running total.`,
          code: `squares = []
for n in range(1, 4):
    squares.append(n * n)
print(squares)`,
          output: '[1, 4, 9]'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `evens = []
for n in range(1, 8):
    if n % 2 == 0:
        evens.append(n)
print(evens)`,
          display: '[2, 4, 6]',
          answers: ['[2, 4, 6]'],
          nudge: 'Not quite. range(1, 8) is 1 to 7; keep the ones that divide by 2 with nothing left over.',
          explain: `From 1 to 7, the even numbers are 2, 4 and 6.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>[3, 1]</code>.',
          code: `result = []
for n in [3, 2, 1]:
    if n == 2:
        ___
    result.append(n)
print(result)`,
          target: '[3, 1]',
          options: [
            { text: 'continue', correct: true },
            { text: 'break', why: `break would end the whole loop at 2, so 1 is never added: [3].` },
            { text: 'pass', why: `pass does nothing, so 2 is appended like the others: [3, 2, 1].` }
          ],
          explain: `continue skips just the 2 and carries on with the next item.`
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `count = 0
while True:
    count = count + 1
    if count == 3:
        break
print(count)`,
          options: [
            { text: '3', correct: true },
            { text: 'Nothing: it never stops', why: `while True would go on forever, but break ends it once count reaches 3.` },
            { text: '2', why: `count goes up before the check, so it's 3 when the loop breaks.` }
          ],
          explain: `while True repeats until something breaks out. Here that's when count is 3.`
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
        code: `s = 0
for n in [2, 4, 6]:
    s = s + n
print(s)`,
        options: [
          { text: '12', correct: true },
          { text: '6', why: `Each n is added to s, not put in its place.` },
          { text: '246', why: `They're numbers, so + adds them up.` }
        ],
        explain: `s goes 0, 2, 6, 12.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `print(list(range(3, 7)))`,
        display: '[3, 4, 5, 6]',
        answers: ['[3, 4, 5, 6]'],
        nudge: 'Not quite. It starts at 3 and stops before 7.',
        explain: `range(3, 7) is 3, 4, 5, 6: the stop, 7, is left out.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `n = 1
while n < 10:
    n = n + 4
print(n)`,
        options: [
          { text: '13', correct: true },
          { text: '9', why: `9 < 10 is still True, so it goes round once more.` },
          { text: '10', why: `n goes up in 4s (1, 5, 9, 13), so it never lands on 10.` }
        ],
        explain: `n goes 1, 5, 9, 13, and 13 < 10 is False.`
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>aabbcc</code>.',
        code: `out = ""
for ch in "abc":
    out = out + ___
print(out)`,
        target: 'aabbcc',
        options: [
          { text: 'ch + ch', correct: true },
          { text: 'ch', why: `That adds each character once: abc.` },
          { text: '"ch"', why: `In quotes it's the text "ch" itself, not the variable: chchch.` }
        ],
        explain: `Each character goes on twice, so "abc" becomes "aabbcc".`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `for i in range(10):
    if i == 3:
        break
print(i)`,
        options: [
          { text: '3', correct: true },
          { text: '9', why: `break ends the loop when i is 3, so it never gets further.` },
          { text: '10', why: `range(10) never reaches 10, and the loop breaks at 3 anyway.` }
        ],
        explain: `The loop stops with i at 3, and i keeps that value after the loop.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `nums = []
for i in range(4):
    if i == 1:
        continue
    nums.append(i * 10)
print(nums)`,
        display: '[0, 20, 30]',
        answers: ['[0, 20, 30]'],
        nudge: 'Not quite. i goes 0 to 3, and 1 is skipped.',
        explain: `i is 0, 1, 2, 3; continue skips 1, and the rest are multiplied by 10.`
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `words = ["a", "b", "c"]
for i in range(len(words) + 1):
    print(words[i])`,
        line: 3,
        errors: true,
        explain: `range(len(words) + 1) goes up to 3, but the last index is 2. words[3] on line 3 is an IndexError.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `x = 3
while x > 0:
    x = x - 1
print(x)`,
        options: [
          { text: '0', correct: true },
          { text: '1', why: `When x is 1, 1 > 0 is True, so it goes round once more.` },
          { text: '-1', why: `Once x is 0, 0 > 0 is False, so the loop stops there.` }
        ],
        explain: `x goes 3, 2, 1, 0, and stops as soon as x > 0 is False.`
      }
    ]
  }
});
