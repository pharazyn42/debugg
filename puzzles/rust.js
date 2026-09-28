// Debuggit's Rust puzzles. See puzzles/README.md for the fields, and run `npm run check-puzzles`
// after adding one: it runs every snippet and checks it prints the puzzle's answer. Rust snippets
// are compiled with rustc in debug mode, as the Rust Playground runs them by default.
(window.DEBUGG_PUZZLES = window.DEBUGG_PUZZLES || []).push(
  {
    lang: 'rust',
    difficulty: 1,
    code: `fn main() {
    let slices = 7;
    let people = 2;
    println!("{}", slices / people);
}`,
    flag: { line: 4, text: 'slices / people' },
    answers: ['3'],
    display: '3',
    nudge: 'Not quite. What type are slices and people?',
    hints: [
      'Whole-number literals like 7 are integers (i32 by default).',
      'Dividing two integers gives an integer, and the remainder is dropped.'
    ],
    explain: '<code>7</code> and <code>2</code> are integers (<code>i32</code> unless something says otherwise), and integer division drops the remainder: <code>7 / 2</code> is <code>3</code>. Rust never quietly turns integers into floats.',
    fix: 'Use floats: <code>let slices = 7.0;</code> and <code>let people = 2.0;</code>, or convert with <code>as f64</code>. <code>slices % people</code> gives the remainder.',
    takeaway: 'Integer divided by integer is an integer in Rust, remainder dropped. Use <code>f64</code> values, or convert with <code>as f64</code>, for fractions.'
  },
  {
    lang: 'rust',
    difficulty: 1,
    code: `fn main() {
    let lives = 3;
    let lives = lives * 2;
    println!("{}", lives);
}`,
    flag: { line: 3, text: 'let lives = lives * 2' },
    answers: ['6'],
    display: '6',
    nudge: 'Not quite. Is line 3 allowed to use the name again?',
    hints: [
      'lives isn\'t mut, but line 3 starts with let. What does a second let do?',
      'A second let makes a new variable with the same name ("shadowing"), set from the old one: 3 * 2.'
    ],
    explain: 'Line 3 doesn\'t change the first <code>lives</code>: <code>let</code> declares a <b>new</b> variable that <b>shadows</b> the old one, starting from its value. So the new <code>lives</code> is <code>3 * 2</code> = 6. Without <code>let</code>, <code>lives = lives * 2</code> wouldn\'t compile, since <code>lives</code> isn\'t <code>mut</code>.',
    fix: 'Nothing to fix: shadowing is idiomatic Rust for transforming a value step by step, and it even allows changing the type (e.g. parsing a string into a number).',
    takeaway: 'A second <code>let</code> with the same name shadows the first: it\'s a new variable, so it works without <code>mut</code> and can even change type.'
  },
  {
    lang: 'rust',
    difficulty: 1,
    code: `fn main() {
    let mut total = 0;
    for day in 1..4 {
        total += day;
    }
    println!("{}", total);
}`,
    flag: { line: 3, text: '1..4' },
    answers: ['6'],
    display: '6',
    nudge: 'Not quite. Which numbers does 1..4 include?',
    hints: [
      'Does the range 1..4 include the 4?',
      'a..b includes a but stops before b, so this adds 1, 2 and 3.'
    ],
    explain: 'The range <code>1..4</code> is <b>half-open</b>: it includes 1 and stops before 4, giving 1, 2, 3. So the total is 6. Write <code>1..=4</code> for a range that includes the end.',
    fix: 'Use <code>1..=4</code> to include 4 (total 10). Or sum it directly: <code>(1..=4).sum::&lt;i32&gt;()</code>.',
    takeaway: '<code>a..b</code> stops before <code>b</code>; <code>a..=b</code> includes it.'
  },
  {
    lang: 'rust',
    difficulty: 2,
    code: `fn main() {
    let distance = 1.0;
    println!("{}", distance);
}`,
    flag: { line: 3, text: '"{}"' },
    answers: ['1'],
    display: '1',
    nudge: 'Not quite. How does {} display a float with nothing after the point?',
    hints: [
      'distance is an f64. Does {} always show a decimal point?',
      'Display ({}) prints the shortest form that reads back as the same value, so 1.0 prints as 1.'
    ],
    explain: 'The <code>{}</code> (Display) format prints a float in its shortest exact form, so <code>1.0_f64</code> prints as <code>1</code>. The <code>{:?}</code> (Debug) format keeps the <code>.0</code> and prints <code>1.0</code>.',
    fix: 'Say how many decimals you want: <code>println!("{:.1}", distance)</code> prints <code>1.0</code>, <code>{:.2}</code> prints <code>1.00</code>.',
    takeaway: '<code>{}</code> prints whole-number floats without a decimal point (<code>1</code>). Use <code>{:?}</code> or a precision like <code>{:.1}</code> to show it.'
  },
  {
    lang: 'rust',
    difficulty: 2,
    code: `fn main() {
    let balance = -7;
    println!("{}", balance / 2);
}`,
    flag: { line: 3, text: 'balance / 2' },
    answers: ['-3'],
    display: '-3',
    nudge: 'Not quite. Which way does integer division round a negative number?',
    hints: [
      'The exact answer is -3.5. Does Rust round down, or towards zero?',
      'Integer division in Rust (as in C) truncates towards zero, so -3.5 becomes -3.'
    ],
    explain: 'Rust\'s integer <code>/</code> <b>truncates towards zero</b>: -3.5 becomes <code>-3</code>, not -4. (Python\'s <code>//</code> rounds down instead, giving -4.) The remainder matches: <code>-7 % 2</code> is <code>-1</code>.',
    fix: 'For rounding down, use <code>balance.div_euclid(2)</code> (gives -4) and <code>balance.rem_euclid(2)</code> (gives 1).',
    takeaway: 'Integer division truncates towards zero, so negative results round up. Use <code>div_euclid</code> and <code>rem_euclid</code> to round down.'
  },
  {
    lang: 'rust',
    difficulty: 2,
    code: `fn main() {
    let a = "10";
    let b = "9";
    println!("{}", a < b);
}`,
    flag: { line: 4, text: 'a < b' },
    answers: ['true'],
    display: 'true',
    nudge: 'Not quite. These are strings, not numbers.',
    hints: [
      'Strings compare character by character, like words in a dictionary.',
      'The first characters are "1" and "9", and "1" comes first, so "10" < "9".'
    ],
    explain: 'String slices compare <b>lexicographically</b>, byte by byte. The first bytes are <code>\'1\'</code> and <code>\'9\'</code>, and \'1\' is smaller, so <code>"10" &lt; "9"</code> is <code>true</code>: the rest of the string is never looked at.',
    fix: 'Parse them first: <code>a.parse::&lt;i32&gt;().unwrap() &lt; b.parse::&lt;i32&gt;().unwrap()</code> gives <code>false</code>.',
    takeaway: 'Strings compare like dictionary words, not numbers, so <code>"10" &lt; "9"</code>. Parse numbers before comparing them.'
  },
  {
    lang: 'rust',
    difficulty: 3,
    code: `fn main() {
    let word = "héllo";
    println!("{}", word.len());
}`,
    flag: { line: 3, text: 'word.len()' },
    answers: ['6'],
    display: '6',
    nudge: 'Not quite. What does len() count for a Rust string?',
    hints: [
      'Rust strings are UTF-8. Is every character one byte?',
      'len() counts bytes, and é takes two bytes in UTF-8: 1 + 2 + 1 + 1 + 1.'
    ],
    explain: 'Rust strings are UTF-8, and <code>len()</code> returns the length in <b>bytes</b>, not characters. "h", "l", "l" and "o" are one byte each, but "é" is two, so the total is 6.',
    fix: 'Count characters with <code>word.chars().count()</code> (5). For what a reader sees as letters, including accents built from several code points, use a crate like <code>unicode-segmentation</code>.',
    takeaway: '<code>str::len()</code> counts bytes, not characters. Use <code>.chars().count()</code> to count characters.'
  },
  {
    lang: 'rust',
    difficulty: 3,
    code: `fn main() {
    let level = 1;
    {
        let level = 2;
    }
    println!("{}", level);
}`,
    flag: { line: 4, text: 'let level = 2' },
    answers: ['1'],
    display: '1',
    nudge: 'Not quite. Did line 4 change the outer level?',
    hints: [
      'Line 4 uses let inside its own block. Is that the same variable?',
      'let inside the block makes a new variable that only lives until the closing brace.'
    ],
    explain: 'The inner <code>let level = 2</code> declares a <b>new</b> variable that shadows the outer one only inside the <code>{ }</code> block. When the block ends it goes away, and <code>level</code> means the outer variable again, which is still 1.',
    fix: 'To change the outer value, make it mutable and assign without <code>let</code>: <code>let mut level = 1; { level = 2; }</code>.',
    takeaway: 'Shadowing with <code>let</code> lasts until the end of the block. To change a variable, declare it <code>mut</code> and assign without <code>let</code>.'
  },
  {
    lang: 'rust',
    difficulty: 3,
    code: `fn main() {
    let total: i32 = (0..5).step_by(2).sum();
    println!("{}", total);
}`,
    flag: { line: 2, text: '(0..5).step_by(2)' },
    answers: ['6'],
    display: '6',
    nudge: 'Not quite. List the numbers first, then add them.',
    hints: [
      'step_by(2) takes the first number, then every second one after it.',
      '0..5 is 0, 1, 2, 3, 4; every second one from 0 is 0, 2, 4.'
    ],
    explain: '<code>0..5</code> is 0, 1, 2, 3, 4 (the end is excluded). <code>step_by(2)</code> keeps the first and then every second item: 0, 2, 4. Their sum is 6.',
    fix: 'Nothing to fix. To include 5 in the range, use <code>0..=5</code>, which gives 0, 2, 4 (and 6 for <code>0..=6</code>).',
    takeaway: '<code>step_by(n)</code> always starts with the first item, then takes every nth. The range\'s end is still excluded unless you write <code>..=</code>.'
  },
  {
    lang: 'rust',
    difficulty: 4,
    code: `fn main() {
    let big: i32 = 300;
    let small = big as u8;
    println!("{}", small);
}`,
    flag: { line: 3, text: 'big as u8' },
    answers: ['44'],
    display: '44',
    nudge: 'Not quite. What does as do when the number doesn\'t fit?',
    hints: [
      'A u8 holds 0 to 255. Does as check, or panic?',
      'as between integer types just keeps the low bits: 300 - 256 = 44.'
    ],
    explain: 'Casting between integer types with <code>as</code> never fails: it keeps the <b>low bits</b> that fit. A <code>u8</code> has 8 bits, so 300 becomes 300 mod 256 = 44, silently. Rust\'s overflow checks apply to arithmetic, not to <code>as</code>.',
    fix: 'Use a checked conversion: <code>u8::try_from(big)</code> returns an <code>Err</code> for 300, so you have to handle it. Or clamp: <code>big.clamp(0, 255) as u8</code>.',
    takeaway: '<code>as</code> truncates integers silently. Use <code>try_from</code> when a value might not fit.'
  },
  {
    lang: 'rust',
    difficulty: 4,
    code: `fn main() {
    let n = 15;
    let label = match n {
        x if x % 3 == 0 => "fizz",
        x if x % 5 == 0 => "buzz",
        x if x % 15 == 0 => "fizzbuzz",
        _ => "number",
    };
    println!("{}", label);
}`,
    flag: { line: 6, text: 'x if x % 15 == 0' },
    answers: ['fizz'],
    display: 'fizz',
    nudge: 'Not quite. Which arm does match try first?',
    hints: [
      'match checks the arms from top to bottom and stops at the first that fits.',
      '15 % 3 == 0, so the first arm matches, and the fizzbuzz arm is never reached.'
    ],
    explain: '<code>match</code> tries its arms <b>in order</b> and uses the first one that matches. 15 is divisible by 3, so the first arm wins and gives <code>"fizz"</code>. The <code>% 15</code> arm can never be reached for any number, because anything divisible by 15 is caught by the <code>% 3</code> arm first.',
    fix: 'Put the most specific case first: move the <code>% 15</code> arm to the top. Or match on a tuple: <code>match (n % 3, n % 5) { (0, 0) =&gt; "fizzbuzz", (0, _) =&gt; "fizz", … }</code>.',
    takeaway: '<code>match</code> uses the first arm that fits, so put specific cases before general ones. The compiler can\'t spot unreachable arms when they use <code>if</code> guards.'
  },
  {
    lang: 'rust',
    difficulty: 4,
    code: `fn main() {
    let orders = vec![1, 2, 3];
    let mut processed = 0;
    let _doubled = orders.iter().map(|x| {
        processed += 1;
        x * 2
    });
    println!("{}", processed);
}`,
    flag: { line: 4, text: 'orders.iter().map(' },
    answers: ['0'],
    display: '0',
    nudge: 'Not quite. Did anything ever ask the map for its values?',
    hints: [
      'Iterators in Rust are lazy: they do nothing until something consumes them.',
      'Nothing calls collect(), sum() or a for loop on _doubled, so the closure never runs.'
    ],
    explain: 'Iterator adapters like <code>map</code> are <b>lazy</b>: they only describe the work. The closure runs when something pulls values out, such as <code>collect()</code>, <code>sum()</code> or a <code>for</code> loop. Nothing does, so <code>processed</code> stays 0. (Without the underscore, the compiler warns: "iterators are lazy and do nothing unless consumed".)',
    fix: 'Consume it: <code>let doubled: Vec&lt;i32&gt; = orders.iter().map(…).collect();</code>. For side effects alone, use a <code>for</code> loop or <code>for_each</code>.',
    takeaway: 'Iterator adapters (<code>map</code>, <code>filter</code>, …) do nothing until consumed by <code>collect</code>, <code>sum</code>, a <code>for</code> loop or similar.'
  },
  {
    lang: 'rust',
    difficulty: 5,
    code: `fn main() {
    println!("{}", -2i32.pow(2));
}`,
    flag: { line: 2, text: '-2i32.pow(2)' },
    answers: ['-4'],
    display: '-4',
    nudge: 'Not quite. What does the minus sign apply to?',
    hints: [
      'Method calls bind tighter than the unary minus.',
      'It\'s -(2i32.pow(2)), which is -(4).'
    ],
    explain: 'A method call binds more tightly than unary <code>-</code>, so <code>-2i32.pow(2)</code> is <code>-(2i32.pow(2))</code> = <code>-(4)</code> = <code>-4</code>. The minus isn\'t part of the literal, so it isn\'t (-2) squared.',
    fix: 'Bracket the base: <code>(-2i32).pow(2)</code> is <code>4</code>.',
    takeaway: 'Method calls bind tighter than unary minus: <code>-x.pow(2)</code> is <code>-(x.pow(2))</code>. Bracket negative numbers before calling methods on them.'
  },
  {
    lang: 'rust',
    difficulty: 5,
    code: `fn main() {
    let x = 5;
    let result = {
        x * 2;
    };
    println!("{:?}", result);
}`,
    flag: { line: 4, text: 'x * 2;' },
    answers: ['()', 'unit'],
    display: '()',
    nudge: 'Not quite. What value does a block end with?',
    hints: [
      'A block\'s value is its last expression. Look at the end of line 4.',
      'The semicolon turns x * 2 into a statement, so the block has no final expression and its value is the unit type, ().'
    ],
    explain: 'A block evaluates to its final <b>expression</b>, the one without a semicolon. The <code>;</code> after <code>x * 2</code> makes it a statement whose value is thrown away, so the block evaluates to <code>()</code>, the unit value. <code>{:?}</code> prints it as <code>()</code>.',
    fix: 'Drop the semicolon: <code>let result = { x * 2 };</code> gives <code>10</code>. The same rule applies to a function\'s last line.',
    takeaway: 'A block\'s value is its last expression without a semicolon. Adding <code>;</code> turns it into a statement, and the block becomes <code>()</code>.'
  },
  {
    lang: 'rust',
    difficulty: 5,
    code: `fn main() {
    let up = 2.5_f64.round();
    let down = (-2.5_f64).round();
    println!("{} {}", up, down);
}`,
    flag: { line: 2, text: '2.5_f64.round()' },
    answers: ['3 -3', '3,-3'],
    display: '3 -3',
    nudge: 'Not quite. Which way does Rust round an exact half?',
    hints: [
      'Rust\'s round() rounds halves away from zero. (Python rounds them to even.)',
      '2.5 goes up to 3 and -2.5 goes down to -3; {} prints whole floats without ".0".'
    ],
    explain: '<code>f64::round</code> rounds exact halves <b>away from zero</b>: 2.5 becomes 3 and -2.5 becomes -3. (Python\'s <code>round()</code> uses banker\'s rounding instead, giving 2 and -2.) The <code>{}</code> format prints whole-number floats without a decimal point.',
    fix: 'If you want halves to go to the even number (fairer for statistics and money), use <code>round_ties_even()</code>, which gives 2 and -2.',
    takeaway: 'Rust\'s <code>round()</code> sends halves away from zero; <code>round_ties_even()</code> sends them to the even number. Different languages disagree here, so check.'
  }
);
