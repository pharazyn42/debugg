// Python, Unit 3: Lists. See learn/README.md for the step types and fields.
window.DEBUGG_LEARN.units.push({
  lang: 'python',
  id: 'lists',
  title: 'Lists',
  summary: 'Keep many values in one list, pick them out, change them, sort them, and see why two names can share one list.',
  lessons: [
    {
      id: 'making',
      title: 'Making a list',
      steps: [
        {
          type: 'teach',
          title: 'Many values in one',
          text: `A <b>list</b> holds several values in order, inside square brackets and separated by commas. Printing a list shows the brackets too, and strings inside it keep their quotes.`,
          code: `ducks = ["Huey", "Dewey", "Louie"]
print(ducks)`,
          output: `['Huey', 'Dewey', 'Louie']`
        },
        {
          type: 'teach',
          title: 'Positions, like strings',
          text: `Items in a list have indexes, just like characters in a string: the first is at <b>0</b>, and <code>[-1]</code> is the last. <code>len()</code> counts the items.`,
          code: `scores = [10, 25, 40]
print(scores[0])
print(scores[-1])
print(len(scores))`,
          output: '10\n40\n3'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `colours = ["red", "green", "blue"]
print(colours[1])`,
          options: [
            { text: 'green', correct: true },
            { text: 'red', why: `red is at index 0. Counting starts at 0, so index 1 is the second item.` },
            { text: "['green']", why: `One index gives you the item itself, not a list, so there are no brackets or quotes.` }
          ],
          explain: `Index 0 is red, index 1 is green. Printing a single string item shows it without quotes.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `nums = [4, 8, 15, 16, 23, 42]
print(len(nums), nums[-2])`,
          display: '6 23',
          answers: ['6 23'],
          nudge: 'Not quite. Count the items, then count back from the end: -1 is the last one.',
          explain: `There are 6 items. -1 is 42, the last, so -2 is the one before: 23.`
        },
        {
          type: 'teach',
          title: 'Any kind of value',
          text: `A list can hold numbers, strings, or a mix, and it can be empty: <code>[]</code>. An empty list has length 0.`,
          code: `things = [3, "duck", 2.5]
empty = []
print(len(things), len(empty))`,
          output: '3 0'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>Dewey</code>.',
          code: `ducks = ["Huey", "Dewey", "Louie"]
print(ducks[___])`,
          target: 'Dewey',
          options: [
            { text: '1', correct: true },
            { text: '2', why: `Index 2 is the third item, Louie.` },
            { text: '-1', why: `-1 is the last item, Louie.` }
          ],
          explain: `Dewey is the second item, so its index is 1. (-2 would work too.)`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `days = ["Mon", "Tue", "Wed"]
print(days[0])
print(days[-1])
print(days[3])`,
          line: 4,
          errors: true,
          explain: `The list has 3 items, at indexes 0, 1 and 2. There's no index 3, so line 4 stops with an IndexError: list index out of range.`
        }
      ]
    },
    {
      id: 'changing',
      title: 'Changing a list',
      steps: [
        {
          type: 'teach',
          title: 'Lists can change',
          text: `Unlike a string, a list can be changed in place. Assign to an index to replace that item.`,
          code: `scores = [10, 20, 30]
scores[1] = 99
print(scores)`,
          output: '[10, 99, 30]'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `pets = ["cat", "dog", "fish"]
pets[0] = "duck"
print(pets)`,
          options: [
            { text: "['duck', 'dog', 'fish']", correct: true },
            { text: "['cat', 'dog', 'fish']", why: `Lists can change: pets[0] = "duck" replaces the first item.` },
            { text: "['duck', 'cat', 'dog', 'fish']", why: `Assigning to an index replaces the item there; it doesn't squeeze a new one in.` }
          ],
          explain: `Index 0 was "cat", and now it's "duck". The rest of the list is untouched.`
        },
        {
          type: 'teach',
          title: 'Adding and removing',
          text: `<code>append()</code> adds an item to the end. <code>pop()</code> takes the last item off and gives it back; <code>remove()</code> deletes the first item equal to what you pass it.`,
          code: `queue = ["Ada", "Grace"]
queue.append("Linus")
print(queue)
last = queue.pop()
print(last, queue)`,
          output: `['Ada', 'Grace', 'Linus']\nLinus ['Ada', 'Grace']`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `stack = [1, 2]
stack.append(3)
stack.append(4)
stack.pop()
print(stack)`,
          display: '[1, 2, 3]',
          answers: ['[1, 2, 3]'],
          nudge: 'Not quite. Two items go on the end, then pop() takes the last one off again.',
          explain: `After the appends it's [1, 2, 3, 4]. pop() removes the last item, 4, leaving [1, 2, 3].`
        },
        {
          type: 'teach',
          title: 'Is it in there?',
          text: `<code>in</code> asks whether a value is in the list, and gives <code>True</code> or <code>False</code>.`,
          code: `langs = ["Python", "C", "Rust"]
print("C" in langs)
print("Java" in langs)`,
          output: 'True\nFalse'
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>[3, 1]</code>.',
          code: `nums = [3, 1, 4]
nums.___()
print(nums)`,
          target: '[3, 1]',
          options: [
            { text: 'pop', correct: true },
            { text: 'append', why: `append() needs something to add, so with nothing in its brackets it's an error.` },
            { text: 'sort', why: `sort() puts the items in order, [1, 3, 4]; it doesn't take any away.` }
          ],
          explain: `pop() takes the last item, 4, off the end.`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `birds = ["duck", "goose"]
birds.append("swan")
birds.remove("goose")
birds.remove("goose")`,
          line: 4,
          errors: true,
          explain: `Line 3 removes the only "goose". On line 4 there isn't one left, so remove() stops with a ValueError.`
        }
      ]
    },
    {
      id: 'slices',
      title: 'Slices and joining',
      steps: [
        {
          type: 'teach',
          title: 'Slicing a list',
          text: `Slices work on lists exactly as on strings: <code>nums[1:3]</code> starts at index 1 and stops just before index 3. A slice is a new list.`,
          code: `nums = [10, 20, 30, 40, 50]
print(nums[1:3])
print(nums[:2])
print(nums[-2:])`,
          output: '[20, 30]\n[10, 20]\n[40, 50]'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `letters = ["a", "b", "c", "d", "e"]
print(letters[1:-1])`,
          options: [
            { text: "['b', 'c', 'd']", correct: true },
            { text: "['b', 'c', 'd', 'e']", why: `The stop isn't included, and -1 is the last item, so the slice ends just before "e".` },
            { text: "['a', 'b', 'c', 'd']", why: `The slice starts at index 1, "b". "a" is index 0.` }
          ],
          explain: `From index 1 up to, but not including, the last item: the first and last are dropped.`
        },
        {
          type: 'teach',
          title: 'Joining lists',
          text: `<code>+</code> joins two lists into a new one, and <code>*</code> repeats a list. Neither changes the lists you started with.`,
          code: `a = [1, 2]
b = [3]
print(a + b)
print(b * 3)
print(a)`,
          output: '[1, 2, 3]\n[3, 3, 3]\n[1, 2]'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `row = [0] * 3
print(row + [1])`,
          display: '[0, 0, 0, 1]',
          answers: ['[0, 0, 0, 1]'],
          nudge: 'Not quite. [0] * 3 repeats the list three times, then + adds [1] on the end.',
          explain: `[0] * 3 is [0, 0, 0], and joining [1] gives [0, 0, 0, 1].`
        },
        {
          type: 'teach',
          title: 'Two names, one list',
          text: `<code>b = a</code> doesn't copy a list: it gives the same list a second name. Change it through either name and both see it. To get a separate list, make a copy: <code>a.copy()</code> or <code>a[:]</code>.`,
          code: `a = [1, 2]
b = a
b.append(3)
print(a)`,
          output: '[1, 2, 3]'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `a = ["x"]
b = a.copy()
b.append("y")
print(a)`,
          options: [
            { text: "['x']", correct: true },
            { text: "['x', 'y']", why: `b is a copy, a separate list, so appending to b leaves a alone. Without .copy() this would be the answer.` },
            { text: "['y']", why: `append() adds to the end of b; it doesn't replace anything, and it doesn't touch a.` }
          ],
          explain: `copy() made a new list, so a and b are separate: only b got the "y".`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>[1, 2]</code>.',
          code: `a = [1, 2]
b = ___
b.append(3)
print(a)`,
          target: '[1, 2]',
          options: [
            { text: 'a[:]', correct: true },
            { text: 'a', why: `b = a gives the same list a second name, so the append shows up in a too: [1, 2, 3].` },
            { text: 'a.append', why: `That's the append method itself, not a list, so b.append(3) is an error.` }
          ],
          explain: `a[:] is a slice of the whole list: a new list with the same items, so a is left alone.`
        }
      ]
    },
    {
      id: 'sorting',
      title: 'Sorting and summing',
      steps: [
        {
          type: 'teach',
          title: 'Sorting',
          text: `<code>sorted(nums)</code> gives you a <b>new</b>, sorted list and leaves the original alone. <code>nums.sort()</code> sorts the list itself, in place.`,
          code: `nums = [3, 1, 2]
print(sorted(nums))
print(nums)
nums.sort()
print(nums)`,
          output: '[1, 2, 3]\n[3, 1, 2]\n[1, 2, 3]'
        },
        {
          type: 'teach',
          title: 'sort() gives back nothing',
          text: `Methods that change a list in place, like <code>sort()</code>, <code>append()</code> and <code>reverse()</code>, return <code>None</code>, Python's "nothing" value. So <code>x = nums.sort()</code> leaves <code>x</code> as <code>None</code>.`,
          code: `nums = [3, 1, 2]
x = nums.sort()
print(x)
print(nums)`,
          output: 'None\n[1, 2, 3]'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `names = ["Cy", "Al", "Bo"]
result = names.sort()
print(result)`,
          options: [
            { text: 'None', correct: true },
            { text: "['Al', 'Bo', 'Cy']", why: `names is sorted now, but sort() itself returns None, and that's what result holds.` },
            { text: "['Cy', 'Al', 'Bo']", why: `result isn't a list at all: sort() sorts in place and returns None.` }
          ],
          explain: `sort() changes names and returns None. To get a sorted list as a value, use sorted(names).`
        },
        {
          type: 'teach',
          title: 'Adding up',
          text: `<code>sum()</code> adds up a list of numbers, and <code>min()</code> and <code>max()</code> give the smallest and largest items.`,
          code: `temps = [12, 18, 9, 15]
print(sum(temps), min(temps), max(temps))`,
          output: '54 9 18'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `scores = [5, 3, 8]
print(sorted(scores)[0] + max(scores))`,
          display: '11',
          answers: ['11'],
          nudge: 'Not quite. sorted() puts the smallest first; then add the largest.',
          explain: `sorted(scores) is [3, 5, 8], so its [0] is 3. max is 8, and 3 + 8 = 11.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>[1, 2, 3]</code>.',
          code: `nums = [2, 3, 1]
print(___)`,
          target: '[1, 2, 3]',
          options: [
            { text: 'sorted(nums)', correct: true },
            { text: 'nums.sort()', why: `sort() sorts nums in place but returns None, so this prints None.` },
            { text: 'min(nums)', why: `min() gives the single smallest item, 1, not a sorted list.` }
          ],
          explain: `sorted() gives back a new sorted list, so it's the one to print.`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `nums = [4, 2, 6]
nums = nums.sort()
print("sorted")
print(nums[0])`,
          line: 4,
          errors: true,
          explain: `Line 2 stores sort()'s return value, None, back in nums. Line 4 then tries None[0], which stops with a TypeError. The fix: just nums.sort() on its own line.`
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
        code: `nums = [7, 8, 9]
print(nums[-1] - nums[0])`,
        options: [
          { text: '2', correct: true },
          { text: '1', why: `-1 is the last item, 9, not the one after the first. 9 - 7 is 2.` },
          { text: '-2', why: `nums[-1] is 9 and nums[0] is 7, so it's 9 - 7, not 7 - 9.` }
        ],
        explain: `nums[-1] is the last item, 9, and nums[0] is 7: 9 - 7 = 2.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `team = ["Ada"]
team.append("Bo")
team[0] = "Cy"
print(team)`,
        display: "['Cy', 'Bo']",
        answers: ["['Cy', 'Bo']"],
        nudge: 'Not quite. append() adds to the end, then index 0 is replaced.',
        explain: `After append it's ["Ada", "Bo"]; then team[0] = "Cy" replaces Ada.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `a = [1, 2, 3]
b = a
b[0] = 100
print(a[0])`,
        options: [
          { text: '100', correct: true },
          { text: '1', why: `b = a doesn't copy the list: a and b are two names for one list, so changing b[0] changes a[0].` },
          { text: '[100, 2, 3]', why: `a[0] is just the first item, not the whole list.` }
        ],
        explain: `a and b are the same list, so a[0] is 100 now.`
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>[3, 4]</code>.',
        code: `nums = [1, 2, 3, 4]
print(nums[___])`,
        target: '[3, 4]',
        options: [
          { text: '2:', correct: true },
          { text: '3:', why: `Index 3 is the 4, so nums[3:] is just [4].` },
          { text: ':2', why: `nums[:2] is the first two items, [1, 2].` }
        ],
        explain: `nums[2:] starts at index 2, the 3, and goes to the end.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `words = ["b", "c", "a"]
print(sorted(words), words)`,
        options: [
          { text: "['a', 'b', 'c'] ['b', 'c', 'a']", correct: true },
          { text: "['a', 'b', 'c'] ['a', 'b', 'c']", why: `sorted() makes a new list; words itself isn't changed.` },
          { text: "None ['a', 'b', 'c']", why: `That's what sort() would do. sorted() returns the new list and leaves words alone.` }
        ],
        explain: `sorted() returns a sorted copy; the original keeps its order.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `bag = [2, 4]
bag = bag + [6]
print(sum(bag), len(bag))`,
        display: '12 3',
        answers: ['12 3'],
        nudge: 'Not quite. + makes a new list with 6 on the end; then add them up and count them.',
        explain: `bag becomes [2, 4, 6]: that adds up to 12, and there are 3 items.`
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `cards = ["A", "K", "Q"]
top = cards.pop()
print(top)
print(cards[2])`,
        line: 4,
        errors: true,
        explain: `pop() took "Q" off the end, leaving 2 items at indexes 0 and 1. cards[2] on line 4 is out of range.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `langs = ["Python", "C"]
print("Rust" in langs, len(langs * 2))`,
        options: [
          { text: 'False 4', correct: true },
          { text: 'True 4', why: `"Rust" isn't one of the items, so in gives False.` },
          { text: 'False 2', why: `langs * 2 repeats the list, giving 4 items.` }
        ],
        explain: `"Rust" isn't in the list, and repeating a 2-item list twice gives 4 items.`
      }
    ]
  }
});
