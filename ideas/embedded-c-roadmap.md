# Embedded C in Debuggit: roadmap

A track for the C that runs on microcontrollers: bits, registers, fixed-width types, interrupts
and timing. It builds on the daily C puzzles and the Learn engine, adds a few question types that
suit hardware, and later connects to Debuggit Ltd's Embedded/Controls contracts. Summary and status
live in `CLAUDE.md` (item 3e); this file is the detail.

## Why a separate track

Plain C puzzles test the language. Embedded C adds a different set of surprises, and they're the
ones that cost real projects days of debugging:

- sizes and signedness that change between a PC and a microcontroller (`int` is 16 bits on
  AVR, plain `char` is unsigned on ARM);
- bit manipulation everywhere: masks, shifts, set/clear/toggle, reading bit fields;
- hardware registers: memory-mapped I/O, `volatile`, read-modify-write;
- concurrency without threads: interrupts, shared variables, atomicity, critical sections;
- time: tick counters that wrap, debouncing, timeouts;
- no heap: static allocation, stack depth, `const` data in flash;
- integer maths instead of floats: fixed point, scaling, rounding, overflow.

They make excellent "what does this print?" puzzles, because the code looks obviously right.

## What we can check, and how

Every puzzle and lesson is run-checked (`tools/check-puzzles.js`). Embedded code can't run on real
hardware in CI, so the rules are:

- **Simulated hardware.** Registers are plain variables or a struct at a fake address, e.g.
  `volatile uint32_t GPIOA_ODR;`. Puzzles stay about the C, not one vendor's chip. Use made-up
  register names (`GPIO_OUT`, `TIMER_CNT`), not STM32/AVR names, so no chip's manual is needed.
- **Fixed-width types by default** (`uint8_t`, `int16_t`, …) from `<stdint.h>`, so answers don't
  depend on the host. Puzzles *about* type sizes state the target in the question ("on a
  16-bit MCU where `int` is 16 bits").
- **New checker modes for C**, as puzzle fields:
  - `target: 'arm'`: also compile with `-funsigned-char` (ARM's default), and check the output
    there. Puzzles about `char` signedness show both answers. (Verified: `char c = 200; c > 127`
    prints 0 with gcc's x86 default and 1 with `-funsigned-char`.)
  - `int16: true`: for "16-bit int" puzzles, check the arithmetic with an explicit `int16_t`
    version of the snippet, since a 16-bit toolchain (avr-gcc) isn't on the CI image. Revisit if
    avr-gcc + simavr are added to CI.
  - `endian: 'little'`: assert the host is little-endian before running byte-order puzzles.
  - Keep gcc and clang at `-O0` and `-O2` agreeing, which is what catches undefined behaviour
    (and makes "the optimiser removed my loop" puzzles possible to *explain*, but never to *ask*,
    since UB has no fixed answer).
- **Warnings as teaching**: run a second compile with `-Wall -Wextra -Wconversion` and store the
  warnings, so an explanation can say "the compiler warned you: …".

## Question types that suit embedded (new, for puzzles and Learn)

| Type | How it plays | Checked by |
|---|---|---|
| **Register value** | Code runs a few bit operations on a register; answer its value. Shown as hex *and* as a row of 8/16/32 bit boxes. Accepts hex, decimal or binary. | The checker prints the value; the answer matcher accepts all three bases. |
| **Flip the bits** | Build the mask: tap bit boxes to make the constant that sets bits 3 and 5. | Compare with the expected value. |
| **Which line needs `volatile`** / **spot the race** | Tap the line (an ISR-shared flag, a busy-wait loop). | The line tapped (like Learn's "tap the line"). |
| **Trace the pins** | A virtual board (a few LEDs and a button) shows which LEDs are lit after the code runs. Pick or tap the final LED pattern. | The checker prints the register trace; the widget draws it. |
| **Timeline** | A tick counter wraps (e.g. `uint16_t` at 65535): does the timeout fire? | Multiple choice, checked by running. |

The board widget replays a **precomputed trace** (the checker runs the code and records register
writes), so nothing needs compiling in the browser.

## The Learn course: Embedded C

Assumes the basics (variables, `if`, loops, functions); a placement checkpoint lets people skip to
Unit 1, and the plain C course (when written) is the on-ramp for beginners.

| Unit | Topic | Key ideas | Classic trap |
|---|---|---|---|
| 1 | Fixed-width types | `uint8_t` to `int64_t`, `sizeof`, why `int` isn't portable | `uint8_t` + `uint8_t` is an `int` (integer promotion) |
| 2 | Bits and masks | `&`, `\|`, `^`, `~`, shifts; set, clear, toggle, test | `flags & MASK == MASK` precedence; shifting into the sign bit |
| 3 | Registers | memory-mapped I/O, `volatile`, read-modify-write, bit fields | writing `REG = BIT` instead of `REG \|= BIT` (clears the others) |
| 4 | Data layout | struct padding and alignment, endianness, packing a protocol frame | assuming `sizeof(struct)` is the sum of its fields |
| 5 | Integer maths | overflow and wraparound, fixed point (Q-format), scaling ADC readings, rounding | `(a * b) / c` overflowing before the divide |
| 6 | Time | tick counters, wraparound-safe comparisons, delays, debouncing | `if (now > deadline)` failing at wraparound |
| 7 | Interrupts | ISRs, `volatile` shared flags, atomic access, critical sections | a 32-bit counter read in two halves on an 8-bit CPU |
| 8 | Structure | state machines, ring buffers, no-heap design, `static` and `const` | a ring buffer that can't tell full from empty |
| 9 | Robust firmware | watchdogs, defensive checks, a taste of MISRA-style rules | ignoring return values; magic numbers |
| 10 | The classic traps | a mixed review that leads into the daily embedded puzzles | |

Each unit: 3–4 lessons and a checkpoint, as in the Python course.

## Daily puzzles

- Add **embedded-flavoured C puzzles** to `puzzles/c.js`, tagged `topic: 'embedded'`, spread
  across difficulties: Monday "what's this mask in hex?", Friday "a 16-bit tick counter wraps
  inside the timeout".
- When C joins the rotation (`ROTATION` in `shared.js`), roughly a third of C days could be
  embedded ones. Later, if people want it, **Embedded** could be a rotation "language" of its own,
  with its own XP and its own wordmark (e.g. `debugg(&it); // on target`).
- Target: 30 embedded puzzles before C joins the rotation (about 10 weeks at one C day a week).

## Debuggit Ltd

- **Domains return (item 16) with Embedded/Controls first**: some patches and releases are tagged
  "Embedded", need a dev with Embedded skill, and pay a premium.
- The Director's **embedded puzzle level** (and Embedded Learn XP, if Learn ever feeds the
  studio) boosts those contracts, like the language boost today.
- Contract flavour text: "Firmware patch for a smart kettle", "Motor controller release",
  "Fix a watchdog reset on the greenhouse sensors".

## Phases

1. **Content on today's engine** (no new UI):
   - embedded C puzzles (register values as typed hex, masks, promotion, wraparound);
   - the checker's `target: 'arm'` and warning capture;
   - hex/binary/decimal answer matching.
2. **The Embedded C course, Units 1–3**, using today's step types plus two new ones:
   - a register viewer (bit boxes under the code, showing a value in hex and binary);
   - "flip the bits".
3. **The virtual board**:
   - LEDs and a button, driven by traces recorded by the checker;
   - Units 4–7, including interrupts and timing;
   - a timeline view for tick counters.
4. **Debuggit Ltd tie-in**: the Embedded/Controls domain and its contracts, alongside item 16.
5. **Maybe later**:
   - running C in the browser for "fix it" puzzles. Options: a C interpreter compiled to
     WebAssembly (e.g. picoc or TinyCC), or an MCU emulator such as avr8js. Weigh download size
     against value;
   - a real-hardware bonus: "try it on an Arduino / Raspberry Pi Pico" links from lessons.

## Decided

- **Embedded C is a section of the C course** in Learn: the "Embedded C" heading and its 10
  units come after the plain C units on the C tab (`sections` in `learn/courses.js`), rather
  than being a course or tab of its own.
- **C standard: C99.** Puzzles and lessons compile with `-std=c99`; C11 extras (`_Static_assert`,
  `<stdatomic.h>`) stay out, and critical sections are taught the C99 way (disabling interrupts).

## Open questions

- **Audience**: hobbyists (Arduino, Pico) or professional firmware engineers? It decides the
  examples (LEDs and buttons vs UARTs and DMA) and how deep units 7–9 go.
- **Chip flavour**: generic made-up registers (portable, vendor-neutral), or a named family
  (e.g. AVR or ARM Cortex-M) so lessons map to real datasheets?
- **C++**: Arduino code is C++; include a later "Embedded C++" unit, or stay pure C?
- **Separate XP**: count embedded puzzles as C XP, or give Embedded its own XP and level?
