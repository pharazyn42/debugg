# Puzzles

One file per language: `python.js`, `javascript.js`, `c.js`, `rust.js`. Each file pushes its puzzles
onto `window.DEBUGG_PUZZLES`, and the pages load them with plain `<script>` tags (so the site still
works when opened straight from disk).

## How a day's puzzle is chosen

There's one puzzle a day, and the languages take turns. `ROTATION` in `shared.js` lists the languages
in play and the day each joins. A new language only gets the easy days (Monday and Tuesday) for its
first two weeks, then takes its turn at every difficulty, shifting one day along each week. Within its
days, a language uses its puzzles in the order they appear in its file: each day takes the first unused
puzzle of that weekday's difficulty (Monday 1 up to Friday 5; the weekend gets a 5), or the nearest
difficulty if none is left. Once all of a language's puzzles are used, they start over.

So add new puzzles to the **end** of a file: that only changes days that would otherwise have fallen
back to another difficulty. (Adding an output puzzle also moves the preview days, which count back from
the end of the output puzzles; that matters only until Day 1.) Reordering or removing puzzles changes which puzzle every later day gets.

## Formats

A puzzle's `format` says how it's asked and answered (left out, it's `'output'`). From Day 1 each
weekday takes turns with its formats, a week at a time (`WEEK_FORMATS` in `shared.js`): Monday
multiple choice, output and "what's the value?"; Tuesday output and "how many times?"; Wednesday
"will it error?", output and "order the lines"; Thursday "spot the bug" and output; Friday and the
weekend output. A day whose format has no puzzle left falls back to an output puzzle. Preview days
(before Day 1) only use output puzzles. Other formats are Python only for now.

| Format | The player… | Guesses / hints | Extra fields | The checker makes sure… |
|---|---|---|---|---|
| `output` | types what it prints | 4 / 2 | `answers` | it prints `display` |
| `choice` | picks what it prints from 4 | 2 / 1 | `options` (4, including `display`) | it prints `display`, and no other option |
| `value` | types a variable's value at the end | 4 / 2 | `ask: { name }`, `answers` | `repr(name)` after running is `display` (the snippet prints nothing) |
| `count` | types how many times a line runs | 4 / 2 | `ask: { line }`, `answers` | that line runs `display` times (traced) |
| `error` | picks "Runs fine" or the error it raises | 2 / 1 | `options` (4, including `'Runs fine'`) | it raises `display` (the exception's name), or runs fine |
| `order` | puts the shuffled lines in order | 3 checks / 1 | none (`code` is the right order, 3–7 lines) | it prints `display`, and **no other order of the lines does** |
| `bug` | taps the line with the bug | 4 / 2 | `expected`, `bugLine`, `fixLine` | it prints `display` (not `expected`), and with `fixLine` in place of `bugLine` it prints `expected`; the `flag` is on `bugLine` |

Formats with one hint have exactly one in `hints`. Options and lines are shuffled the same way for
everyone (seeded by the code).

## Step-through traces

After a game, "Step through it" plays back how real Python ran the code. The traces are made by
`npm run traces` (`tools/trace-puzzles.js`, which runs `tools/trace.py`) into `traces-python.js`.
Run it after adding or changing a Python puzzle; the checker fails a puzzle whose trace is missing
or doesn't end the way the puzzle says.

## Fields

| Field | What it is |
|---|---|
| `lang` | `'python'`, `'javascript'`, `'c'` or `'rust'` (see `LANG_INFO` in `shared.js`). |
| `difficulty` | 1 (warm-up) to 5 (hard). |
| `code` | The snippet. It should print exactly one thing: the answer. |
| `flag` | `{ line, text }`: the buggy or surprising bit, underlined once the game ends. `text` must appear on that line. |
| `format` | Optional: how it's asked (see Formats above). Left out, it's `'output'`. |
| `answers` | For typed formats: accepted guesses, compared loosely (case, spaces, quotes, commas and brackets are ignored; see `normaliseAnswer` in `shared.js`). |
| `display` | The exact output, shown as the answer. The code must print exactly this. |
| `nudge` | Feedback after a wrong guess. |
| `hints` | Two hints, a gentle one then a strong one (one for choice, error and order puzzles). |
| `explain` | Why it prints what it does (HTML). |
| `fix` | How to write it properly (HTML). |
| `takeaway` | The general rule to remember, in a sentence or two (HTML). |
| `learn` | Optional: the id of the Debuggit Learn unit that teaches this (e.g. `'strings'`). After a missed or revealed puzzle, the page links to it. The checker makes sure the unit exists. |

## Checking

```sh
npm run check-puzzles            # every language
node tools/check-puzzles.js c    # one language
```

The checker validates the fields, then runs every snippet with the real toolchain and checks it prints
`display` and nothing else: `python3`; `node`; `gcc` and `clang` at `-O0` and `-O2` for C (all four must
agree, which catches undefined behaviour); `rustc` in debug mode for Rust. It also prints how many
puzzles each language has at each difficulty. It runs in CI on every pull request.

## Writing good ones

- One idea per puzzle, grounded in something a real program might do.
- Monday puzzles (1) are for learners: one basic rule, no tricks stacked on tricks.
- Friday and weekend puzzles (5) can combine two surprises, but must still be fair to reason out.
- C: keep to well-defined behaviour. No signed overflow, unsequenced side effects or uninitialised
  reads, and no reliance on type sizes beyond `char` being 8 bits and `int` being 32.
- Rust: snippets must compile. A puzzle can't be about a compile error (yet).
