// Debuggit's C puzzles. See puzzles/README.md for the fields, and run `npm run check-puzzles`
// after adding one: it runs every snippet and checks it prints the puzzle's answer. C snippets are
// compiled with gcc and clang at -O0 and -O2, which must all agree, so keep them free of undefined
// behaviour (signed overflow, unsequenced side effects, reading uninitialised memory).
(window.DEBUGG_PUZZLES = window.DEBUGG_PUZZLES || []).push(
  {
    lang: 'c',
    difficulty: 1,
    code: `#include <stdio.h>

int main(void) {
    int slices = 7, people = 2;
    printf("%d\\n", slices / people);
    return 0;
}`,
    flag: { line: 5, text: 'slices / people' },
    answers: ['3'],
    display: '3',
    nudge: 'Not quite. What happens to the remainder when you divide two ints?',
    hints: [
      'Both numbers are ints. Can the result of dividing them be 3.5?',
      'Dividing two ints gives an int: the fractional part is thrown away.'
    ],
    explain: 'When both operands are integers, <code>/</code> is <b>integer division</b>: the result is an int, and anything after the decimal point is dropped (towards zero). <code>7 / 2</code> is <code>3</code>.',
    fix: 'Make one side a floating-point number: <code>(double)slices / people</code> is <code>3.5</code>. Use <code>%</code> to get the remainder, <code>7 % 2</code> is <code>1</code>.',
    takeaway: 'In C, int divided by int is an int, with the remainder dropped. Cast one side to <code>double</code> for a fractional answer.'
  },
  {
    lang: 'c',
    difficulty: 1,
    code: `#include <stdio.h>

int main(void) {
    char grade = 'A' + 2;
    printf("%c\\n", grade);
    return 0;
}`,
    flag: { line: 4, text: "'A' + 2" },
    answers: ['c'],
    display: 'C',
    nudge: 'Not quite. In C, a character is just a small number.',
    hints: [
      "'A' is stored as a number (its ASCII code, 65). What's 65 + 2?",
      "67 is the code for 'C', and %c prints a number as its character."
    ],
    explain: "A <code>char</code> in C is a small integer holding the character's code. <code>'A'</code> is 65, so <code>'A' + 2</code> is 67, which is <code>'C'</code>. <code>%c</code> prints it as a character; <code>%d</code> would print 67.",
    fix: "Nothing to fix: character arithmetic is a normal way to step through letters, e.g. <code>for (char c = 'a'; c <= 'z'; c++)</code>.",
    takeaway: "A <code>char</code> is a number: letters have consecutive codes, so <code>'A' + 2</code> is <code>'C'</code>. <code>%c</code> prints the character, <code>%d</code> the number."
  },
  {
    lang: 'c',
    difficulty: 1,
    code: `#include <stdio.h>

int main(void) {
    int scores[] = {10, 20, 30};
    printf("%d\\n", scores[1]);
    return 0;
}`,
    flag: { line: 5, text: 'scores[1]' },
    answers: ['20'],
    display: '20',
    nudge: 'Not quite. Which element is number 1?',
    hints: [
      'What index does the first element of a C array have?',
      'Arrays start at index 0, so scores[1] is the second element.'
    ],
    explain: 'C arrays are indexed from <b>0</b>: <code>scores[0]</code> is 10, <code>scores[1]</code> is 20 and <code>scores[2]</code> is 30. The index is how far along from the start the element is.',
    fix: 'Nothing to fix. Just remember the last element of an array of <code>n</code> is at <code>n - 1</code>; <code>scores[3]</code> would read past the end.',
    takeaway: 'Arrays start at index 0, so the second element is <code>[1]</code> and the last of <code>n</code> is <code>[n - 1]</code>.'
  },
  {
    lang: 'c',
    difficulty: 2,
    code: `#include <stdio.h>

int main(void) {
    int price = 9.99;
    printf("%d\\n", price);
    return 0;
}`,
    flag: { line: 4, text: 'int price = 9.99' },
    answers: ['9'],
    display: '9',
    nudge: 'Not quite. Can an int hold 9.99?',
    hints: [
      'An int only holds whole numbers. What happens to the .99?',
      'Converting a floating-point number to an int truncates it: the fraction is dropped, not rounded.'
    ],
    explain: 'Storing a <code>double</code> in an <code>int</code> converts it by <b>truncating</b> towards zero, so <code>9.99</code> becomes <code>9</code>. The compiler accepts it silently (with warnings on, it will tell you).',
    fix: 'Use <code>double price = 9.99;</code> and print it with <code>%.2f</code>. For money, store whole cents in an int: <code>int cents = 999;</code>.',
    takeaway: 'Converting a floating-point value to an integer drops the fraction rather than rounding. Compile with <code>-Wall -Wconversion</code> to catch it.'
  },
  {
    lang: 'c',
    difficulty: 2,
    code: `#include <stdio.h>

int main(void) {
    int a = 3, b = 4;
    double average = (a + b) / 2;
    printf("%.1f\\n", average);
    return 0;
}`,
    flag: { line: 5, text: '(a + b) / 2' },
    answers: ['3.0', '3'],
    display: '3.0',
    nudge: 'Not quite. When does the division happen, and with what types?',
    hints: [
      'average is a double, but look at the types on the right-hand side.',
      '(a + b) / 2 is 7 / 2 with ints, which is 3. Only then is 3 stored in the double.'
    ],
    explain: 'The right-hand side is worked out first, entirely in ints: <code>(3 + 4) / 2</code> is <code>7 / 2</code>, which is <code>3</code> in integer division. Only then is that 3 converted to a double. The type of the variable you store into doesn\'t change how the maths is done.',
    fix: 'Divide by a double: <code>(a + b) / 2.0</code>, which gives <code>3.5</code>.',
    takeaway: 'The type of the variable on the left doesn\'t change the maths on the right. Make an operand a <code>double</code> (e.g. <code>2.0</code>) to get floating-point division.'
  },
  {
    lang: 'c',
    difficulty: 2,
    code: `#include <stdio.h>

int main(void) {
    printf("%d\\n", 5 / 2 * 2);
    return 0;
}`,
    flag: { line: 4, text: '5 / 2 * 2' },
    answers: ['4'],
    display: '4',
    nudge: 'Not quite. Work it out one step at a time, left to right.',
    hints: [
      '/ and * have the same precedence, so they go left to right: (5 / 2) * 2.',
      '5 / 2 is 2 in integer division, and 2 * 2 is 4.'
    ],
    explain: '<code>/</code> and <code>*</code> have equal precedence and group left to right, so this is <code>(5 / 2) * 2</code>. Integer division makes <code>5 / 2</code> equal <code>2</code>, and the lost half never comes back: <code>2 * 2</code> is <code>4</code>.',
    fix: 'Multiply first when you can: <code>5 * 2 / 2</code> is <code>5</code>. Or use doubles.',
    takeaway: 'With integers, dividing early loses the remainder for good. Multiply before you divide, or use floating point.'
  },
  {
    lang: 'c',
    difficulty: 3,
    code: `#include <stdio.h>

int main(void) {
    int level = 1, bonus = 0;
    switch (level) {
        case 1: bonus += 1;
        case 2: bonus += 10; break;
        case 3: bonus += 100;
    }
    printf("%d\\n", bonus);
    return 0;
}`,
    flag: { line: 6, text: 'case 1: bonus += 1;' },
    answers: ['11'],
    display: '11',
    nudge: 'Not quite. What stops a case from running on into the next?',
    hints: [
      'case 1 has no break at the end.',
      'Without break, execution falls through into case 2, which adds 10 before its break.'
    ],
    explain: 'A <code>case</code> label is just a place to jump to. After <code>case 1</code> runs, there\'s no <code>break</code>, so execution <b>falls through</b> into <code>case 2</code> and adds 10 as well, stopping at its <code>break</code>. 1 + 10 = 11.',
    fix: 'End every case with <code>break;</code>. If falling through is intended, say so with a comment (or <code>[[fallthrough]];</code> in C23).',
    takeaway: 'In a <code>switch</code>, each case runs on into the next unless it ends with <code>break</code>. Compile with <code>-Wimplicit-fallthrough</code> to be warned.'
  },
  {
    lang: 'c',
    difficulty: 3,
    code: `#include <stdio.h>

int main(void) {
    int errors = 0;
    if (errors = 5) {
        printf("failed %d\\n", errors);
    } else {
        printf("ok\\n");
    }
    return 0;
}`,
    flag: { line: 5, text: 'errors = 5' },
    answers: ['failed 5', 'failed,5'],
    display: 'failed 5',
    nudge: 'Not quite. Look very closely at the condition on line 5.',
    hints: [
      'That\'s one = in the condition, not two.',
      'errors = 5 assigns 5, and an assignment\'s value is the value assigned. 5 is non-zero, so it counts as true.'
    ],
    explain: '<code>errors = 5</code> is an <b>assignment</b>, not a comparison. It sets <code>errors</code> to 5 and has the value 5, which is non-zero and therefore true. So the first branch runs, and <code>errors</code> is now 5.',
    fix: 'Use <code>==</code> to compare: <code>if (errors == 5)</code>. Compile with <code>-Wall</code>, which warns about assignments used as conditions.',
    takeaway: 'In C, <code>=</code> assigns and <code>==</code> compares. An assignment inside <code>if</code> is always legal, so turn on warnings to catch it.'
  },
  {
    lang: 'c',
    difficulty: 3,
    code: `#include <stdio.h>
#include <string.h>

int main(void) {
    char name[] = "Ada";
    printf("%zu %zu\\n", sizeof(name), strlen(name));
    return 0;
}`,
    flag: { line: 6, text: 'sizeof(name)' },
    answers: ['4 3', '4,3'],
    display: '4 3',
    nudge: 'Not quite. What\'s stored after the last letter of a C string?',
    hints: [
      'C strings end with a hidden character that marks the end.',
      'The array holds \'A\', \'d\', \'a\' and the terminating \'\\0\', so it\'s 4 bytes; strlen counts only up to the \'\\0\'.'
    ],
    explain: 'A string literal gets a terminating <b>null character</b> (<code>\'\\0\'</code>) added to its end, so <code>name</code> is a 4-byte array. <code>sizeof</code> measures the whole array (4); <code>strlen</code> counts the characters before the <code>\'\\0\'</code> (3).',
    fix: 'Use <code>strlen</code> for the length of the text, and remember to allow one extra byte for the <code>\'\\0\'</code> when sizing buffers: <code>char copy[strlen(name) + 1];</code>.',
    takeaway: 'C strings end with a hidden <code>\'\\0\'</code>. <code>strlen</code> counts the characters; the array needs one byte more.'
  },
  {
    lang: 'c',
    difficulty: 4,
    code: `#include <stdio.h>

int main(void) {
    int balance = -1;
    unsigned int limit = 10;
    if (balance < limit) {
        printf("within limit\\n");
    } else {
        printf("over limit\\n");
    }
    return 0;
}`,
    flag: { line: 6, text: 'balance < limit' },
    answers: ['over limit', 'over'],
    display: 'over limit',
    nudge: 'Not quite. What type does the comparison happen in?',
    hints: [
      'When an int meets an unsigned int, C converts the int to unsigned first.',
      '-1 as an unsigned int is the largest possible value, 4294967295, which is not less than 10.'
    ],
    explain: 'Comparing an <code>int</code> with an <code>unsigned int</code> converts the int to unsigned (the "usual arithmetic conversions"). <code>-1</code> wraps round to <code>UINT_MAX</code>, 4294967295, which is far bigger than 10. So <code>-1 &lt; 10</code> is false here.',
    fix: 'Keep both sides signed (<code>int limit = 10;</code>), or check for negatives first: <code>if (balance &lt; 0 || (unsigned)balance &lt; limit)</code>. <code>-Wall -Wextra</code> warns about signed/unsigned comparisons.',
    takeaway: 'Mixing signed and unsigned converts the signed value to unsigned, so negatives become huge. Don\'t mix them in comparisons; <code>-Wsign-compare</code> will warn you.'
  },
  {
    lang: 'c',
    difficulty: 4,
    code: `#include <stdio.h>

int main(void) {
    unsigned char red = 200, boost = 100;
    unsigned char brighter = red + boost;
    printf("%d\\n", brighter);
    return 0;
}`,
    flag: { line: 5, text: 'unsigned char brighter' },
    answers: ['44'],
    display: '44',
    nudge: 'Not quite. How big a number fits in an unsigned char?',
    hints: [
      'An unsigned char holds 0 to 255. What happens to 300?',
      'Storing a value in an unsigned type keeps it modulo 256 (for 8 bits): 300 - 256 = 44.'
    ],
    explain: '<code>red + boost</code> is worked out as an int (300), but storing it in an <code>unsigned char</code> (0–255) keeps only the value <b>modulo 256</b>: 300 − 256 = 44. For unsigned types this wraparound is well defined, so no error or warning by default.',
    fix: 'Clamp it: <code>int sum = red + boost; unsigned char brighter = sum &gt; 255 ? 255 : sum;</code>, which is what you want for colour channels.',
    takeaway: 'Unsigned types wrap around silently: an 8-bit unsigned value keeps its result modulo 256. Clamp or use a wider type when a result can overflow.'
  },
  {
    lang: 'c',
    difficulty: 4,
    code: `#include <stdio.h>

#define SQUARE(x) x * x

int main(void) {
    printf("%d\\n", SQUARE(2 + 3));
    return 0;
}`,
    flag: { line: 3, text: 'x * x' },
    answers: ['11'],
    display: '11',
    nudge: 'Not quite. A macro pastes text; it doesn\'t evaluate its argument first.',
    hints: [
      'Write out what the preprocessor turns SQUARE(2 + 3) into, character for character.',
      'It becomes 2 + 3 * 2 + 3, and * binds tighter than +: 2 + 6 + 3.'
    ],
    explain: 'Macros are <b>text substitution</b>. <code>SQUARE(2 + 3)</code> becomes <code>2 + 3 * 2 + 3</code>, and multiplication happens first: 2 + 6 + 3 = 11, not 25.',
    fix: 'Bracket every parameter and the whole body: <code>#define SQUARE(x) ((x) * (x))</code>. Better still, use a function: <code>static inline int square(int x) { return x * x; }</code>.',
    takeaway: 'Macros paste text, so operator precedence can split their arguments apart. Put brackets round every parameter and the whole body, or use an inline function.'
  },
  {
    lang: 'c',
    difficulty: 5,
    code: `#include <stdio.h>

int main(void) {
    int flags = 6;  /* binary 110 */
    if (flags & 4 == 4) {
        printf("bit set\\n");
    } else {
        printf("bit clear\\n");
    }
    return 0;
}`,
    flag: { line: 5, text: 'flags & 4 == 4' },
    answers: ['bit clear', 'clear'],
    display: 'bit clear',
    nudge: 'Not quite. Which happens first here, & or ==?',
    hints: [
      'In C, == has higher precedence than &.',
      'So it\'s flags & (4 == 4), which is 6 & 1, which is 0: false.'
    ],
    explain: 'The bitwise operators <code>&amp;</code>, <code>|</code> and <code>^</code> have <b>lower precedence than <code>==</code></b> (a leftover from C\'s ancestor, B). So this is <code>flags &amp; (4 == 4)</code>, which is <code>6 &amp; 1</code>, which is <code>0</code>. Bit 4 is set in 6, but the test never looks at it.',
    fix: 'Bracket the mask: <code>if ((flags &amp; 4) == 4)</code>, or simply <code>if (flags &amp; 4)</code>.',
    takeaway: 'In C, <code>==</code> binds tighter than <code>&amp;</code>, <code>|</code> and <code>^</code>. Always bracket bit tests: <code>(flags &amp; MASK) == MASK</code>.'
  },
  {
    lang: 'c',
    difficulty: 5,
    code: `#include <stdio.h>

int main(void) {
    unsigned char mask = 0;
    if (~mask == 255) {
        printf("all ones\\n");
    } else {
        printf("%d\\n", ~mask);
    }
    return 0;
}`,
    flag: { line: 5, text: '~mask == 255' },
    answers: ['-1'],
    display: '-1',
    nudge: 'Not quite. What type is ~mask?',
    hints: [
      'Before ~ does anything, the unsigned char is promoted to an int.',
      '~0 as an int is all 32 bits set, which is -1, not 255.'
    ],
    explain: 'Arithmetic on anything smaller than an <code>int</code> first <b>promotes</b> it to <code>int</code>. So <code>~mask</code> flips all 32 bits of the int 0, giving <code>-1</code>, not the 8-bit value 255. The comparison fails and the else branch prints -1.',
    fix: 'Cast back to the small type before comparing: <code>(unsigned char)~mask == 255</code>, or mask the result: <code>(~mask &amp; 0xFF) == 0xFF</code>.',
    takeaway: 'C promotes <code>char</code> and <code>short</code> to <code>int</code> before any arithmetic or bitwise operation. Cast the result back when you want it to stay 8 or 16 bits.'
  }
);
