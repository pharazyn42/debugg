// Python, Unit 7: Dictionaries. See learn/README.md for the step types and fields.
window.DEBUGG_LEARN.units.push({
  lang: 'python',
  id: 'dictionaries',
  title: 'Dictionaries',
  summary: 'Store values under names instead of positions: making dictionaries, looking things up, changing and merging them, looping over them, nesting them, and converting to and from lists.',
  lessons: [
    {
      id: 'make',
      title: 'Keys and values',
      steps: [
        {
          type: 'teach',
          title: 'Pairs in curly braces',
          text: `A list finds things by position. A <b>dictionary</b> finds them by name. It's written in curly braces, as <b>key: value</b> pairs, and you look a value up by putting its key in square brackets.`,
          code: `legs = {"kiwi": 2, "cat": 4}
print(legs["cat"])`,
          output: '4'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `stock = {"apples": 3, "pears": 5}
print(stock["pears"])`,
          options: [
            { text: '5', correct: true },
            { text: '3', why: `3 belongs to the key "apples". The key "pears" has the value 5.` },
            { text: 'pears', why: `"pears" is the key you look up with. What comes back is its value.` }
          ],
          explain: `stock["pears"] looks up the key "pears" and gives back its value, 5.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `menu = {"tea": 2, "cake": 3}
print(menu["tea"] + menu["cake"])`,
          display: '5',
          answers: ['5'],
          nudge: 'Not quite. Look up each key, then add the two values.',
          explain: `menu["tea"] is 2 and menu["cake"] is 3, so it prints 2 + 3 = 5.`
        },
        {
          type: 'teach',
          title: 'How many pairs',
          text: `<code>len()</code> counts the pairs in a dictionary, not the letters or the values.`,
          code: `legs = {"kiwi": 2, "cat": 4}
print(len(legs))`,
          output: '2'
        },
        {
          type: 'teach',
          title: 'Each key once',
          text: `A key can only appear once: repeat it and the last value wins. Keys also match exactly, so <code>"emu"</code> and <code>"Emu"</code> are two different keys.`,
          code: `d = {"emu": 2, "Emu": 3, "emu": 4}
print(len(d), d["emu"])`,
          output: '2 4'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `d = {"a": 1, "b": 2, "a": 3}
print(len(d), d["a"])`,
          options: [
            { text: '2 3', correct: true },
            { text: '3 1', why: `"a" is repeated, so it's one pair, not two. And the later value, 3, replaces the 1.` },
            { text: '3 3', why: `The repeated "a" is one pair, so len gives 2 rather than 3.` },
            { text: '2 1', why: `The last value for a repeated key wins, so d["a"] is 3.` }
          ],
          explain: `The two "a" entries are one key, so there are 2 pairs, and "a" holds the later value, 3.`
        },
        {
          type: 'teach',
          title: 'A key that isn\'t there',
          text: `Looking up a key the dictionary doesn't have is an error, called a <b>KeyError</b>. A dictionary has no positions, so there's no "out of range": only keys it has, and keys it doesn't.`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `legs = {"kiwi": 2, "cat": 4}
print(legs["kiwi"])
print(legs["dog"])`,
          line: 3,
          errors: true,
          explain: `"dog" isn't a key in legs, so line 3 raises a KeyError. Line 2 is fine: "kiwi" is a key.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>3</code>.',
          code: `scores = {"ann": 3, "bob": 7}
print(scores[___])`,
          target: '3',
          options: [
            { text: '"ann"', correct: true },
            { text: 'ann', why: `Without quotes, ann is a variable name, and there's no variable called ann: a NameError.` },
            { text: '0', why: `Dictionaries aren't looked up by position. 0 isn't a key in scores, so it's a KeyError.` }
          ],
          explain: `The value 3 belongs to the key "ann", so look it up with scores["ann"].`
        }
      ]
    },
    {
      id: 'change',
      title: 'Changing a dictionary',
      steps: [
        {
          type: 'teach',
          title: 'Adding and updating',
          text: `Assigning to a key sets its value. If the key is new, it's added. If it's already there, its value is replaced.`,
          code: `legs = {"kiwi": 2}
legs["cat"] = 4
legs["kiwi"] = 3
print(legs)`,
          output: "{'kiwi': 3, 'cat': 4}"
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `d = {"fig": 3}
d["kiwi"] = 5
d["fig"] = d["fig"] + 1
print(d)`,
          options: [
            { text: "{'fig': 4, 'kiwi': 5}", correct: true },
            { text: "{'fig': 3, 'kiwi': 5}", why: `Line 3 changes "fig": its old value, 3, plus 1 makes 4.` },
            { text: "{'fig': 4}", why: `Line 2 adds a new key, "kiwi", so it's in the dictionary too.` },
            { text: "{'kiwi': 5, 'fig': 4}", why: `A dictionary remembers the order keys were added. "fig" was there first, so it comes first.` }
          ],
          explain: `"kiwi" is added with 5, and "fig" is updated from 3 to 4. Keys stay in the order they were added.`
        },
        {
          type: 'teach',
          title: 'Merging with update',
          text: `<code>update()</code> copies in all the pairs from another dictionary. New keys are added, and keys that already exist take the new value.`,
          code: `a = {"x": 1, "y": 2}
a.update({"y": 20, "z": 30})
print(a)`,
          output: "{'x': 1, 'y': 20, 'z': 30}"
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `d = {"a": 1, "b": 2}
d.update({"b": 5, "c": 6})
print(d)`,
          options: [
            { text: "{'a': 1, 'b': 5, 'c': 6}", correct: true },
            { text: "{'a': 1, 'b': 2, 'c': 6}", why: `"b" is in both dictionaries, and update() lets the new value win: 5, not 2.` },
            { text: "{'b': 5, 'c': 6}", why: `update() only adds to a dictionary. Pairs it isn't given, like "a", stay where they are.` }
          ],
          explain: `"c" is added, "b" is replaced by 5, and "a" is left alone.`
        },
        {
          type: 'teach',
          title: 'Removing a pair',
          text: `<code>del</code> removes a key and its value.`,
          code: `d = {"a": 1, "b": 2}
del d["a"]
print(d)`,
          output: "{'b': 2}"
        },
        {
          type: 'teach',
          title: 'pop gives it back',
          text: `<code>pop()</code> removes a key too, and hands you its value.`,
          code: `d = {"a": 1, "b": 2}
x = d.pop("b")
print(x, d)`,
          output: "2 {'a': 1}"
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `d = {"x": 10, "y": 20}
d["x"] = d["x"] + d["y"]
print(d["x"])`,
          display: '30',
          answers: ['30'],
          nudge: 'Not quite. The right-hand side is worked out first, then stored back in "x".',
          explain: `d["x"] + d["y"] is 10 + 20 = 30, which is stored back in "x".`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `d = {"a": 1}
del d["a"]
print(d["a"])`,
          line: 3,
          errors: true,
          explain: `Line 2 removed "a", so on line 3 it's no longer a key: a KeyError.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>{\'a\': 1}</code>.',
          code: `d = {"a": 1, "b": 2}
___
print(d)`,
          target: "{'a': 1}",
          options: [
            { text: 'del d["b"]', correct: true },
            { text: 'd.pop("a")', why: `That removes "a", leaving {'b': 2}.` },
            { text: 'd["b"] = 0', why: `That keeps "b" and just changes its value to 0.` }
          ],
          explain: `del d["b"] removes the "b" pair, leaving only "a".`
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `def add_pet(pets):
    pets["dog"] = 4

legs = {"cat": 4}
add_pet(legs)
print(legs)`,
          options: [
            { text: "{'cat': 4, 'dog': 4}", correct: true },
            { text: "{'cat': 4}", why: `The function gets the same dictionary, not a copy (just like with lists), so its change shows up outside too.` },
            { text: 'None', why: `add_pet returns None, but that isn't printed here: the last line prints legs.` }
          ],
          explain: `pets and legs are two names for one dictionary, so adding "dog" inside the function changes legs as well.`
        }
      ]
    },
    {
      id: 'lookup',
      title: 'Looking things up safely',
      steps: [
        {
          type: 'teach',
          title: 'Is the key there?',
          text: `<code>in</code> checks whether a key is in a dictionary, giving <code>True</code> or <code>False</code>. It only looks at keys, never at values.`,
          code: `d = {"kiwi": 2}
print("kiwi" in d)
print(2 in d)`,
          output: 'True\nFalse'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `menu = {"tea": 2, "cake": 3}
print("cake" in menu, 3 in menu)`,
          options: [
            { text: 'True False', correct: true },
            { text: 'True True', why: `in only looks at keys. 3 is a value, not a key, so that one is False.` },
            { text: 'False False', why: `"cake" is a key in menu, so the first check is True.` },
            { text: 'False True', why: `It's the other way round: "cake" is a key, but 3 is only a value.` }
          ],
          explain: `"cake" is a key, so True. 3 is a value, and in doesn't check values, so False.`
        },
        {
          type: 'teach',
          title: 'Check first',
          text: `Use <code>in</code> to check before you look up, so a missing key doesn't cause a KeyError.`,
          code: `stock = {"apples": 3}
if "pears" in stock:
    print(stock["pears"])
else:
    print("none")`,
          output: 'none'
        },
        {
          type: 'teach',
          title: 'get',
          text: `<code>get()</code> is a shortcut: it gives the value for a key, or <code>None</code> if the key isn't there, with no error.`,
          code: `stock = {"apples": 3}
print(stock.get("apples"))
print(stock.get("pears"))`,
          output: '3\nNone'
        },
        {
          type: 'teach',
          title: 'A fallback value',
          text: `Give <code>get()</code> a second argument and it uses that instead of <code>None</code> when the key is missing.`,
          code: `stock = {"apples": 3}
print(stock.get("pears", 0))`,
          output: '0'
        },
        {
          type: 'teach',
          title: 'setdefault',
          text: `<code>setdefault(key, value)</code> gives back the key's value. If the key is missing, it first <b>adds</b> it with the value you give. A key that's already there is left alone.`,
          code: `d = {"a": 1}
print(d.setdefault("a", 9))
print(d.setdefault("b", 9))
print(d)`,
          output: "1\n9\n{'a': 1, 'b': 9}"
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `d = {"a": 1}
d.setdefault("a", 9)
d.setdefault("b", 9)
print(d)`,
          options: [
            { text: "{'a': 1, 'b': 9}", correct: true },
            { text: "{'a': 9, 'b': 9}", why: `setdefault never changes a key that's already there, so "a" stays 1.` },
            { text: "{'a': 1}", why: `"b" is missing, so setdefault adds it with 9. Unlike get(), it changes the dictionary.` }
          ],
          explain: `"a" exists, so it's left as 1. "b" doesn't, so it's added with 9.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `d = {"a": 1}
print(d.get("a", 9), d.get("b", 9))`,
          display: '1 9',
          answers: ['1 9'],
          nudge: 'Not quite. The fallback is only used when the key is missing.',
          explain: `"a" is there, so get gives its value, 1. "b" isn't, so get gives the fallback, 9.`
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `d = {"kiwi": 2}
print(d.get("emu"))`,
          options: [
            { text: 'None', correct: true },
            { text: 'An error', why: `Only d["emu"] raises a KeyError. get() gives None instead.` },
            { text: '0', why: `No fallback was given, so a missing key gives None, not 0.` }
          ],
          explain: `"emu" isn't a key and there's no fallback, so get() gives back None.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>0</code>.',
          code: `scores = {"ann": 3}
print(___)`,
          target: '0',
          options: [
            { text: 'scores.get("bob", 0)', correct: true },
            { text: 'scores.get("bob")', why: `With no fallback, a missing key gives None, so it prints None.` },
            { text: 'scores["bob"]', why: `"bob" isn't a key, so square brackets raise a KeyError.` }
          ],
          explain: `"bob" is missing, so get() gives its fallback, 0.`
        }
      ]
    },
    {
      id: 'loops',
      title: 'Looping over a dictionary',
      steps: [
        {
          type: 'teach',
          title: 'A loop gives the keys',
          text: `A <code>for</code> loop over a dictionary goes through its keys, one at a time, in the order they were added.`,
          code: `legs = {"kiwi": 2, "cat": 4}
for name in legs:
    print(name)`,
          output: 'kiwi\ncat'
        },
        {
          type: 'teach',
          title: 'Keys lead to values',
          text: `Use each key to look up its value.`,
          code: `legs = {"kiwi": 2, "cat": 4}
for name in legs:
    print(name, legs[name])`,
          output: 'kiwi 2\ncat 4'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `menu = {"tea": 2, "cake": 3}
total = 0
for item in menu:
    total = total + menu[item]
print(total)`,
          options: [
            { text: '5', correct: true },
            { text: 'tea cake', why: `item is a key, but the loop adds up menu[item], the values. The names are never added.` },
            { text: '3', why: `total keeps growing: it's 2 after "tea" and 5 after "cake". It isn't reset each time round.` }
          ],
          explain: `The loop visits "tea" and then "cake", adding 2 and then 3 to total, so it ends at 5.`
        },
        {
          type: 'teach',
          title: 'items gives both',
          text: `<code>items()</code> gives each key and its value together, so the loop can name both. The first name gets the key and the second gets the value.`,
          code: `legs = {"kiwi": 2, "cat": 4}
for name, n in legs.items():
    print(name, "has", n)`,
          output: 'kiwi has 2\ncat has 4'
        },
        {
          type: 'teach',
          title: 'Just the values',
          text: `<code>values()</code> is only the values, which is handy with <code>sum</code>, <code>min</code> and <code>max</code>. <code>keys()</code> is only the keys, the same as looping over the dictionary itself.`,
          code: `legs = {"kiwi": 2, "cat": 4}
print(sum(legs.values()))`,
          output: '6'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `d = {"a": 1, "b": 2, "c": 3}
total = 0
for k, v in d.items():
    if v > 1:
        total = total + v
print(total)`,
          display: '5',
          answers: ['5'],
          nudge: 'Not quite. Only values bigger than 1 are added.',
          explain: `1 isn't more than 1, so it's skipped. 2 and 3 are added: 2 + 3 = 5.`
        },
        {
          type: 'teach',
          title: 'Counting things',
          text: `A dictionary is perfect for counting. Start with an empty <code>{}</code>, and for each item add 1 to its count. <code>get(ch, 0)</code> gives 0 the first time an item is seen.`,
          code: `seen = {}
for ch in "kiwi":
    seen[ch] = seen.get(ch, 0) + 1
print(seen)`,
          output: "{'k': 1, 'i': 2, 'w': 1}"
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `seen = {}
for w in ["a", "b", "a"]:
    seen[w] = seen.get(w, 0) + 1
print(seen)`,
          options: [
            { text: "{'a': 2, 'b': 1}", correct: true },
            { text: "{'a': 1, 'b': 1}", why: `The second "a" adds to the existing count, 1, making it 2.` },
            { text: "{'a': 2, 'b': 1, 'a': 1}", why: `A dictionary has each key once. The second "a" updates its count rather than adding a new pair.` }
          ],
          explain: `"a" is counted twice and "b" once, and each key appears just once in the dictionary.`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `seen = {}
for ch in "hello":
    seen[ch] = seen[ch] + 1
print(seen)`,
          line: 3,
          errors: true,
          explain: `The first time round, "h" isn't a key yet, so seen["h"] on line 3 is a KeyError. Use seen.get(ch, 0) to start from 0.`
        }
      ]
    },
    {
      id: 'nested',
      title: 'Nesting and converting',
      steps: [
        {
          type: 'teach',
          title: 'A dictionary in a dictionary',
          text: `A value can be anything, including another dictionary. To reach inside, look up one key after another: the first gives the inner dictionary, and the second looks in that.`,
          code: `pets = {
    "kiwi": {"legs": 2},
    "cat": {"legs": 4}
}
print(pets["cat"]["legs"])`,
          output: '4'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `zoo = {
    "emu": {"legs": 2, "age": 7},
    "ant": {"legs": 6, "age": 1}
}
print(zoo["ant"]["legs"])`,
          options: [
            { text: '6', correct: true },
            { text: '1', why: `1 is the ant's age. The second key asked for "legs".` },
            { text: '2', why: `2 is the emu's legs. The first key picked "ant", not "emu".` }
          ],
          explain: `zoo["ant"] is the ant's dictionary, and ["legs"] looks up its legs: 6.`
        },
        {
          type: 'teach',
          title: 'Changing inside',
          text: `Assign to a nested key the same way. You can also add a whole new inner dictionary.`,
          code: `zoo = {"emu": {"legs": 2}}
zoo["emu"]["legs"] = 3
zoo["ant"] = {"legs": 6}
print(zoo)`,
          output: "{'emu': {'legs': 3}, 'ant': {'legs': 6}}"
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `d = {"a": {"x": 1}, "b": {"x": 5}}
print(d["a"]["x"] + d["b"]["x"])`,
          display: '6',
          answers: ['6'],
          nudge: 'Not quite. Each part reaches into a different inner dictionary.',
          explain: `d["a"]["x"] is 1 and d["b"]["x"] is 5, so it prints 1 + 5 = 6.`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `d = {"a": {"x": 1}}
print(d["a"]["x"])
print(d["b"]["x"])`,
          line: 3,
          errors: true,
          explain: `"b" isn't a key in d, so the first lookup on line 3 is a KeyError, before ["x"] is even tried.`
        },
        {
          type: 'teach',
          title: 'From dictionary to list',
          text: `<code>list()</code> turns a dictionary's keys into a list, the same as <code>list(d.keys())</code>. For the values, use <code>list(d.values())</code>. And <code>sorted()</code> gives the keys in order.`,
          code: `legs = {"kiwi": 2, "cat": 4}
print(list(legs))
print(list(legs.keys()))
print(list(legs.values()))`,
          output: "['kiwi', 'cat']\n['kiwi', 'cat']\n[2, 4]"
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `d = {"b": 2, "a": 1}
print(sorted(d))`,
          options: [
            { text: "['a', 'b']", correct: true },
            { text: "['b', 'a']", why: `That's the order the keys were added in. sorted() puts them in order: "a" first.` },
            { text: '[1, 2]', why: `sorted(d) sorts the keys, not the values.` }
          ],
          explain: `sorted() on a dictionary sorts its keys, giving ['a', 'b'].`
        },
        {
          type: 'teach',
          title: 'From list to dictionary',
          text: `To go the other way, loop over a list and add a pair for each item.`,
          code: `names = ["kiwi", "cat"]
d = {}
for name in names:
    d[name] = len(name)
print(d)`,
          output: "{'kiwi': 4, 'cat': 3}"
        },
        {
          type: 'teach',
          title: 'Two lists into one',
          text: `<code>zip()</code> pairs two lists up item by item, and <code>dict()</code> turns those pairs into a dictionary. The first list gives the keys and the second gives the values.`,
          code: `names = ["kiwi", "cat"]
legs = [2, 4]
print(dict(zip(names, legs)))`,
          output: "{'kiwi': 2, 'cat': 4}"
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `ks = ["a", "b"]
vs = [10, 20]
d = dict(zip(ks, vs))
print(d["b"])`,
          display: '20',
          answers: ['20'],
          nudge: 'Not quite. The two lists are paired up in order: "a" with 10, "b" with 20.',
          explain: `zip pairs "a" with 10 and "b" with 20, so d["b"] is 20.`
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
        code: `d = {"a": {"x": 1}, "b": {"x": 2}}
print(d["b"]["x"])`,
        options: [
          { text: '2', correct: true },
          { text: '1', why: `1 is the "x" inside "a". The first key picks "b".` },
          { text: "{'x': 2}", why: `d["b"] alone would give that inner dictionary, but the second lookup, ["x"], goes inside it.` }
        ],
        explain: `d["b"] is {"x": 2}, and ["x"] looks up 2 inside it.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `d = dict(zip(["a", "b"], [1, 2]))
print(d["a"], len(d))`,
        display: '1 2',
        answers: ['1 2'],
        nudge: 'Not quite. zip pairs the keys with the values in order.',
        explain: `zip pairs "a" with 1 and "b" with 2, so d["a"] is 1 and there are 2 pairs.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `d = {"a": 1}
d["a"] = 5
d["b"] = 6
print(d)`,
        options: [
          { text: "{'a': 5, 'b': 6}", correct: true },
          { text: "{'a': 1, 'b': 6}", why: `d["a"] = 5 replaces the 1, so "a" holds 5.` },
          { text: "{'a': 1, 'a': 5, 'b': 6}", why: `A dictionary has each key once. Assigning to "a" again replaces its value.` }
        ],
        explain: `"a" is updated from 1 to 5 and "b" is added with 6.`
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>1</code>.',
        code: `d = {"a": 1, "b": 2}
___
print(len(d))`,
        target: '1',
        options: [
          { text: 'del d["a"]', correct: true },
          { text: 'd["a"]', why: `That only looks the value up. Nothing is removed, so len is still 2.` },
          { text: 'd.get("a")', why: `get() only reads a value. Both pairs are still there, so it prints 2.` }
        ],
        explain: `del d["a"] removes a pair, leaving one.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `ids = {"ann": 1, "bo": 2}
print("bo" in ids, 1 in ids)`,
        options: [
          { text: 'True False', correct: true },
          { text: 'True True', why: `in only checks keys. 1 is a value, not a key.` },
          { text: 'False True', why: `It's the other way round: "bo" is a key, and 1 is only a value.` }
        ],
        explain: `"bo" is a key, so True. 1 is a value, and in doesn't check values, so False.`
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `d = {"a": 1, "b": 2}
total = 0
for k in d:
    total = total + d[k]
print(d["c"])`,
        line: 5,
        errors: true,
        explain: `The loop is fine: it only looks up keys it's given. But "c" isn't a key in d, so line 5 is a KeyError.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `d = {"a": 1, "b": 2, "c": 3}
print(sum(d.values()), len(d))`,
        display: '6 3',
        answers: ['6 3'],
        nudge: 'Not quite. values() is just 1, 2 and 3.',
        explain: `1 + 2 + 3 is 6, and there are 3 pairs.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `seen = {}
for ch in "aab":
    seen[ch] = seen.get(ch, 0) + 1
print(seen["a"])`,
        options: [
          { text: '2', correct: true },
          { text: '1', why: `"a" turns up twice, so its count goes from 1 to 2.` },
          { text: '3', why: `"aab" has three letters, but only two of them are "a".` }
        ],
        explain: `The first "a" makes the count 1 and the second makes it 2.`
      }
    ]
  }
});
