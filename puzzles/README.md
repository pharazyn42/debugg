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
back to another difficulty. Reordering or removing puzzles changes which puzzle every later day gets.

## Fields

| Field | What it is |
|---|---|
| `lang` | `'python'`, `'javascript'`, `'c'` or `'rust'` (see `LANG_INFO` in `shared.js`). |
| `difficulty` | 1 (warm-up) to 5 (hard). |
| `code` | The snippet. It should print exactly one thing: the answer. |
| `flag` | `{ line, text }`: the buggy or surprising bit, underlined once the game ends. `text` must appear on that line. |
| `answers` | Accepted guesses, compared loosely (case, spaces, quotes, commas and brackets are ignored; see `normaliseAnswer` in `shared.js`). |
| `display` | The exact output, shown as the answer. The code must print exactly this. |
| `nudge` | Feedback after a wrong guess. |
| `hints` | Two hints: a gentle one, then a strong one. |
| `explain` | Why it prints what it does (HTML). |
| `fix` | How to write it properly (HTML). |
| `takeaway` | The general rule to remember, in a sentence or two (HTML). |

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
