// Python, Unit 6: Functions. See learn/README.md for the step types and fields.
window.DEBUGG_LEARN.units.push({
  lang: 'python',
  id: 'functions',
  title: 'Functions',
  summary: 'Name a piece of code and reuse it: parameters, return values, defaults and keyword arguments, and which variables a function can see.',
  lessons: [
    {
      id: 'def',
      title: 'Making a function',
      steps: [
        {
          type: 'teach',
          title: 'def',
          text: `<code>def</code> gives a block of code a name, so you can run it whenever you like by <b>calling</b> it: its name followed by brackets.`,
          code: `def greet():
    print("Hello!")

greet()
greet()`,
          output: 'Hello!\nHello!'
        },
        {
          type: 'teach',
          title: 'Defining isn\'t running',
          text: `A <code>def</code> only stores the function. Nothing inside it runs until it's called, so this prints just "start".`,
          code: `def shout():
    print("HEY")

print("start")`,
          output: 'start'
        },
        {
          type: 'teach',
          title: 'Parameters',
          text: `A function can take values in. The name in the brackets of the <code>def</code> is a <b>parameter</b>; each call fills it with the value you pass, called an <b>argument</b>.`,
          code: `def greet(name):
    print("Hi", name)

greet("Ada")
greet("Bo")`,
          output: 'Hi Ada\nHi Bo'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `def show(word):
    print(word + "!")

show("kiwi")`,
          options: [
            { text: 'kiwi!', correct: true },
            { text: 'word!', why: `word is the parameter's name. In this call it holds "kiwi", and that's what gets printed.` },
            { text: 'kiwi', why: `The function adds "!" to whatever it's given.` }
          ],
          explain: `show("kiwi") runs the function with word set to "kiwi", so it prints kiwi!.`
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `def area(w, h):
    print(w * h)

area(3, 4)`,
          display: '12',
          answers: ['12'],
          nudge: 'Not quite. w gets the first argument and h the second.',
          explain: `w is 3 and h is 4, so it prints 3 * 4 = 12.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>Hi Cy</code>.',
          code: `def greet(name):
    print("Hi", name)

___`,
          target: 'Hi Cy',
          options: [
            { text: 'greet("Cy")', correct: true },
            { text: 'greet', why: `Without brackets the function isn't called, so nothing is printed.` },
            { text: 'greet(Cy)', why: `Without quotes, Cy is a variable name, and there's no variable called Cy: a NameError.` }
          ],
          explain: `Call it with brackets, passing the text "Cy".`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `say_hi()

def say_hi():
    print("hi")`,
          line: 1,
          errors: true,
          explain: `Python runs from the top. On line 1, say_hi hasn't been defined yet, so it's a NameError. Define functions before you call them.`
        }
      ]
    },
    {
      id: 'return',
      title: 'Giving back a value',
      steps: [
        {
          type: 'teach',
          title: 'return',
          text: `<code>return</code> hands a value back to wherever the function was called. The call then stands for that value, so you can store it or use it in a sum.`,
          code: `def double(n):
    return n * 2

x = double(5)
print(x + 1)`,
          output: '11'
        },
        {
          type: 'teach',
          title: 'print is not return',
          text: `<code>print</code> only shows a value on screen. A function with no <code>return</code> gives back <code>None</code>, Python's "nothing" value.`,
          code: `def double(n):
    print(n * 2)

x = double(5)
print(x)`,
          output: '10\nNone'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `def add(a, b):
    return a + b

print(add(2, 3) * 2)`,
          options: [
            { text: '10', correct: true },
            { text: '7', why: `add(2, 3) is worked out first, giving 5, and then that's doubled.` },
            { text: '5', why: `5 is what add returns, but the line then multiplies it by 2.` }
          ],
          explain: `add(2, 3) returns 5, and 5 * 2 is 10.`
        },
        {
          type: 'teach',
          title: 'return ends the function',
          text: `As soon as a <code>return</code> runs, the function stops. Any lines after it in the same block never run.`,
          code: `def check(n):
    return "big"
    print("never printed")

print(check(5))`,
          output: 'big'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `def sign(n):
    if n < 0:
        return "negative"
    return "positive"

print(sign(-3), sign(7))`,
          display: 'negative positive',
          answers: ['negative positive'],
          nudge: 'Not quite. For -3 the first return runs and the function stops there.',
          explain: `-3 < 0, so the first call returns "negative". For 7 the if is skipped, so it reaches the second return.`
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `def square(n):
    n * n

print(square(4))`,
          options: [
            { text: 'None', correct: true },
            { text: '16', why: `The function works out 16 but never returns it, so the call gives back None.` },
            { text: 'An error', why: `It runs fine: a function with no return just returns None.` }
          ],
          explain: `Without return, the result of n * n is thrown away. The fix: return n * n.`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>9</code>.',
          code: `def triple(n):
    ___ n * 3

print(triple(3))`,
          target: '9',
          options: [
            { text: 'return', correct: true },
            { text: 'print', why: `print shows 9 inside the function, but it still returns None, so the last line prints None as well.` },
            { text: 'n =', why: `That stores 9 in n, but nothing is returned, so it prints None.` }
          ],
          explain: `return hands 9 back, and print(triple(3)) prints it.`
        }
      ]
    },
    {
      id: 'params',
      title: 'Arguments',
      steps: [
        {
          type: 'teach',
          title: 'Order matters',
          text: `Arguments fill the parameters in order: the first argument goes to the first parameter, and so on.`,
          code: `def minus(a, b):
    return a - b

print(minus(10, 3))
print(minus(3, 10))`,
          output: '7\n-7'
        },
        {
          type: 'teach',
          title: 'Default values',
          text: `A parameter can have a <b>default</b>, written with <code>=</code> in the <code>def</code>. If the call leaves that argument out, the default is used.`,
          code: `def greet(name, greeting="Hello"):
    print(greeting, name)

greet("Ada")
greet("Bo", "Hi")`,
          output: 'Hello Ada\nHi Bo'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `def scale(n, times=2):
    return n * times

print(scale(5), scale(5, 3))`,
          options: [
            { text: '10 15', correct: true },
            { text: '10 10', why: `The second call passes 3, which replaces the default of 2.` },
            { text: '5 15', why: `When times is left out it's 2, not 1, so scale(5) is 10.` }
          ],
          explain: `scale(5) uses the default, 5 * 2 = 10; scale(5, 3) is 5 * 3 = 15.`
        },
        {
          type: 'teach',
          title: 'Naming the arguments',
          text: `You can pass an argument by its parameter's name: a <b>keyword argument</b>. Then the order doesn't matter.`,
          code: `def describe(name, age):
    print(name, "is", age)

describe(age=7, name="Pip")`,
          output: 'Pip is 7'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `def label(text, left="[", right="]"):
    return left + text + right

print(label("ok", right=">"))`,
          display: '[ok>',
          answers: ['[ok>'],
          nudge: 'Not quite. left keeps its default; only right is changed.',
          explain: `left is still "[", right is now ">", so it's "[" + "ok" + ">".`
        },
        {
          type: 'blank',
          question: 'Pick what goes in the gap so this prints <code>Hi Bo!</code>.',
          code: `def greet(name, end="."):
    print("Hi " + name + end)

greet("Bo", ___)`,
          target: 'Hi Bo!',
          options: [
            { text: '"!"', correct: true },
            { text: '!', why: `Text needs quotes. A bare ! is a syntax error.` },
            { text: 'end', why: `end is only a name inside the function. Out here there's no variable called end: a NameError.` }
          ],
          explain: `Passing "!" replaces the default ".".`
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `def area(w, h):
    return w * h

print(area(5))`,
          line: 4,
          errors: true,
          explain: `area needs two arguments, and h has no default. The call on line 4 passes only one, so it's a TypeError.`
        }
      ]
    },
    {
      id: 'scope',
      title: 'Inside and outside',
      steps: [
        {
          type: 'teach',
          title: 'Variables stay inside',
          text: `A variable made inside a function is <b>local</b>: it only exists while the function runs. To get a value out, return it.`,
          code: `def make():
    secret = 42
    return secret

print(make())`,
          output: '42'
        },
        {
          type: 'line',
          question: 'This program stops with an error. Tap the line that causes it.',
          code: `def make():
    secret = 42

make()
print(secret)`,
          line: 5,
          errors: true,
          explain: `secret only existed inside make(). Out on line 5 there's no such variable, so it's a NameError.`
        },
        {
          type: 'teach',
          title: 'Reading from outside',
          text: `A function can <b>read</b> a variable made outside it.`,
          code: `rate = 3
def cost(n):
    return n * rate

print(cost(4))`,
          output: '12'
        },
        {
          type: 'teach',
          title: 'Assigning makes a new one',
          text: `But <b>assigning</b> to a name inside a function makes a new local variable, even if one outside has the same name. The outside one is left alone.`,
          code: `count = 0
def bump():
    count = 5

bump()
print(count)`,
          output: '0'
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `x = 1
def change():
    x = 99
    return x

print(change(), x)`,
          options: [
            { text: '99 1', correct: true },
            { text: '99 99', why: `x = 99 inside the function makes a new local x. The outside x is still 1.` },
            { text: '1 1', why: `Inside the function, x is its own local variable, 99, and that's what it returns.` }
          ],
          explain: `change() returns its own x, 99; the x outside was never changed.`
        },
        {
          type: 'teach',
          title: 'Functions using functions',
          text: `A function can call other functions, including the result of one as the argument to the next.`,
          code: `def double(n):
    return n * 2

def quad(n):
    return double(double(n))

print(quad(3))`,
          output: '12'
        },
        {
          type: 'predict',
          question: 'What does this print?',
          code: `def add_one(n):
    return n + 1

def twice(n):
    return add_one(add_one(n))

print(twice(5) * 2)`,
          display: '14',
          answers: ['14'],
          nudge: 'Not quite. twice adds one twice, then the result is doubled.',
          explain: `twice(5) is 7, and 7 * 2 is 14.`
        },
        {
          type: 'choice',
          asks: 'output',
          question: 'What does this print?',
          code: `def add_item(items):
    items.append("new")

stuff = ["old"]
add_item(stuff)
print(stuff)`,
          options: [
            { text: "['old', 'new']", correct: true },
            { text: "['old']", why: `The function gets the same list, not a copy (like b = a), so append changes stuff too.` },
            { text: 'None', why: `add_item returns None, but that isn't printed here: the last line prints stuff.` }
          ],
          explain: `items and stuff are two names for one list, so the append shows up in stuff.`
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
        code: `def f(x):
    return x + 10

print(f(5) - f(0))`,
        options: [
          { text: '5', correct: true },
          { text: '15', why: `f(5) is 15, but then f(0), which is 10, is taken away.` },
          { text: '25', why: `It's a minus: 15 - 10.` }
        ],
        explain: `f(5) is 15 and f(0) is 10, so it's 15 - 10 = 5.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `def hello(name="world"):
    return "hello " + name

print(hello())`,
        display: 'hello world',
        answers: ['hello world'],
        nudge: 'Not quite. No argument is passed, so name gets its default.',
        explain: `name defaults to "world", so it returns "hello world".`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `def half(n):
    n / 2

print(half(8))`,
        options: [
          { text: 'None', correct: true },
          { text: '4.0', why: `The function works out 4.0 but never returns it.` },
          { text: '4', why: `Nothing is returned, and / would give 4.0 anyway.` }
        ],
        explain: `There's no return, so half(8) gives back None.`
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>20</code>.',
        code: `def area(w, h):
    return w * h

print(area(___))`,
        target: '20',
        options: [
          { text: '4, 5', correct: true },
          { text: '4 5', why: `Arguments are separated by commas; without one it's a syntax error.` },
          { text: '20', why: `area needs two arguments; with only one, h is missing: a TypeError.` }
        ],
        explain: `w is 4 and h is 5, and 4 * 5 is 20.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `total = 10
def add(n):
    total = n + 1
    return total

print(add(5), total)`,
        options: [
          { text: '6 10', correct: true },
          { text: '6 6', why: `total = n + 1 inside makes a new local total; the outside one stays 10.` },
          { text: '11 10', why: `Inside, total is a new local set to n + 1, which is 6; the outer 10 isn't used.` }
        ],
        explain: `add(5) returns its local total, 6. The outside total is still 10.`
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `def grade(score):
    if score >= 50:
        return "pass"
    return "fail"

print(grade(49), grade(50))`,
        display: 'fail pass',
        answers: ['fail pass'],
        nudge: 'Not quite. Check each score against >= 50.',
        explain: `49 isn't >= 50, so "fail"; 50 is, so "pass".`
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `def greet(name):
    return "Hi " + name

print(greet())`,
        line: 4,
        errors: true,
        explain: `greet needs a name, and there's no default. The call on line 4 passes nothing, so it's a TypeError.`
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `def twice(n):
    return n * 2
    return n * 3

print(twice(4))`,
        options: [
          { text: '8', correct: true },
          { text: '12', why: `The first return ends the function, so the second one never runs.` },
          { text: '24', why: `Only one return runs: the first, giving 4 * 2.` }
        ],
        explain: `return stops the function straight away, so it gives back 8.`
      }
    ],
    more: [
      {
        type: 'predict',
        question: 'What does this print?',
        code: `def sq(n):
    return n * n
print(sq(5))`,
        display: '25',
        answers: ['25'],
        nudge: 'Not quite. The function gives back n times n.',
        explain: '5 * 5 is 25.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `def f(a, b):
    return a - b
print(f(b=1, a=5))`,
        display: '4',
        answers: ['4'],
        nudge: 'Not quite. The names say which value goes where.',
        explain: 'a is 5 and b is 1, so a - b is 4.'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `def inc(n=1):
    return n + 1
print(inc(), inc(5))`,
        options: [
          { text: '2 6', correct: true },
          { text: '2 2', why: 'When a value is given, it replaces the default: inc(5) is 6.' },
          { text: '1 5', why: 'The function adds 1 to n and returns it.' }
        ],
        explain: 'inc() uses the default 1 and gives 2; inc(5) gives 6.'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `def f(x):
    return x
    print("done")
print(f(3))`,
        options: [
          { text: '3', correct: true },
          { text: 'done', why: 'return ends the function, so the print inside never runs.' },
          { text: 'None', why: 'The function does return something: x.' }
        ],
        explain: 'return ends the function straight away, so only the 3 is printed.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `def add(a, b):
    return a + b
print(add(add(1, 2), 3))`,
        display: '6',
        answers: ['6'],
        nudge: 'Not quite. The inner add is worked out first.',
        explain: 'add(1, 2) is 3, and add(3, 3) is 6.'
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `def double(n):
    return n * 2
print(double(2))
print(n)`,
        line: 4,
        errors: true,
        explain: 'n only exists inside double, so line 4 stops with a NameError.'
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>7</code>.',
        code: `def f(a, b):
    return ___
print(f(3, 4))`,
        target: '7',
        options: [
          { text: 'a + b', correct: true },
          { text: 'a', why: 'That would give back just a, which is 3.' },
          { text: 'print(a + b)', why: 'That prints 7 inside the function, but then returns None, which is printed too.' }
        ],
        explain: 'a + b is 3 + 4 = 7, and return hands it back.'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `x = 1
def f():
    x = 5
f()
print(x)`,
        options: [
          { text: '1', correct: true },
          { text: '5', why: 'The x inside f is a new variable. The outer x is untouched.' },
          { text: 'None', why: 'x is an ordinary variable with the value 1.' }
        ],
        explain: 'Assigning inside a function makes a new local x, so the outside x stays 1.'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `def f(n):
    return n + 1
print(f(f(1)))`,
        options: [
          { text: '3', correct: true },
          { text: '2', why: 'The inner call gives 2, and the outer call adds one more.' },
          { text: 'None', why: 'The function returns a value, so it isn\'t None.' }
        ],
        explain: 'f(1) is 2, and f(2) is 3.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `def greet(name="you"):
    return "hi " + name
print(greet())`,
        display: 'hi you',
        answers: ['hi you'],
        nudge: 'Not quite. With no value given, the default is used.',
        explain: 'No value is given, so name is the default "you".'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `def f(n):
    n = n * 2
print(f(4))`,
        options: [
          { text: 'None', correct: true },
          { text: '8', why: 'There is no return, so nothing is given back.' },
          { text: '4', why: 'There is no return, so nothing is given back.' }
        ],
        explain: 'Without return the function gives back None.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `def big(a, b):
    if a > b:
        return a
    return b
print(big(3, 8))`,
        display: '8',
        answers: ['8'],
        nudge: 'Not quite. Which one is bigger?',
        explain: '3 > 8 is false, so the function returns b, 8.'
      },
      {
        type: 'choice',
        asks: 'output',
        question: 'What does this print?',
        code: `def total(a, b=10):
    return a + b
print(total(1), total(1, 2))`,
        options: [
          { text: '11 3', correct: true },
          { text: '11 11', why: 'When b is given, it replaces the default.' },
          { text: '2 3', why: 'Without a second value, b is 10.' }
        ],
        explain: 'total(1) uses b = 10 and gives 11; total(1, 2) gives 3.'
      },
      {
        type: 'line',
        question: 'This program stops with an error. Tap the line that causes it.',
        code: `def add(a, b):
    return a + b
print(add(1))`,
        line: 3,
        errors: true,
        explain: 'add needs two values and line 3 gives one, so Python stops with a TypeError.'
      },
      {
        type: 'blank',
        question: 'Pick what goes in the gap so this prints <code>12</code>.',
        code: `def f(x):
    return x * 3
print(f(___))`,
        target: '12',
        options: [
          { text: '4', correct: true },
          { text: '3', why: 'f(3) is 9.' },
          { text: '12', why: 'f(12) is 36.' }
        ],
        explain: 'f(4) is 4 * 3 = 12.'
      },
      {
        type: 'predict',
        question: 'What does this print?',
        code: `def f(x):
    y = x + 1
    return y
z = f(1)
print(z + f(2))`,
        display: '5',
        answers: ['5'],
        nudge: 'Not quite. Work out each call, then add the results.',
        explain: 'f(1) is 2 and f(2) is 3, so z + f(2) is 5.'
      }
    ]
  }
});
