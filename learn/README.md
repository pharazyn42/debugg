# Debugg Learn

Courses that teach a language from the very start. `learn.html` is the page, `learn/learn.js` the
engine, `learn/courses.js` the list of courses, and each unit is its own file, e.g.
`learn/python/01-values.js`.

## Structure

- A **course** (one per language) is a list of **units**, played in order.
- A **unit** has 3–5 **lessons** and a **checkpoint**.
- A **lesson** is 6–10 **steps**, alternating short teaching points with questions on what was just taught.
- A **checkpoint** is a short mixed quiz. Passing it unlocks the next unit. It can be taken at any time,
  so people who already know a unit can test out of it.

## Progress rules

- Lessons unlock in order (passing the unit's checkpoint opens them all).
- A wrong answer shows why, and the right answer, and the question comes back at the end of the lesson.
  The lesson ends once every question has been answered right.
- Stars by mistakes: none → 3, 1–2 → 2, more → 1. Replaying can raise them.
- Checkpoints ask each question once; pass with `pass` correct. Retry any time.
- **Learn XP** (per language) and the **Learn streak** are separate from the daily puzzles':
  10 XP for finishing a lesson the first time, 5 per star (new stars only), 30 for first passing a
  checkpoint. The streak counts days with a lesson finished or a checkpoint passed.
- Everything is saved under `debugg-learn` (backed up with the rest, reset with the demo at v0.1,
  and kept by the daily page's "reset puzzles").

## Adding a unit

1. Write `learn/<lang>/NN-name.js`, pushing one unit onto `window.DEBUGG_LEARN.units` (copy an existing one).
2. Add the file to the course's `files` in `learn/courses.js` (and remove its title from `planned`).
   A new course can start as `soon: true` with `files: []`: its tab says "soon" and lists only
   the planned units. Drop `soon` when its first unit goes in. A course's `sections`
   (`{ id, title, summary, planned }`) list later parts under their own heading, like C's
   Embedded C; for now they hold planned units only.
3. Add a `<script>` tag for it in `learn.html`. (A test checks the page loads every listed file.)
4. Run `npm run check-puzzles`: it runs every snippet in every lesson.

A new language's course goes in `courses` in `learn/courses.js`; its language needs a runner in
`tools/check-puzzles.js` and syntax colours in `shared.js`, like the daily puzzles.

## Unit fields

```js
{
  lang: 'python', id: 'values', title: 'Values and printing', summary: 'One line on what it covers.',
  lessons: [ { id: 'print', title: 'print() and text', steps: [ … ] } ],
  checkpoint: { pass: 7, steps: [ … ] }   // pass mark out of the checkpoint's questions
}
```

`id`s make up the save keys (`python/values/print`), so don't rename them once people have played.

## Step types

| type | Fields | The player… | The checker makes sure… |
|---|---|---|---|
| `teach` | `title`, `text` (HTML), optional `code` and `output` | reads it and continues | `code` prints `output` |
| `choice` | `question`, optional `code`, `options`, `explain`; `asks: 'output'` if it asks what the code prints | picks an option | one option is `correct`, every other has a `why`; with `asks: 'output'`, the correct one is exactly what the code prints and no wrong one is |
| `predict` | `question`, `code`, `display`, `answers`, `nudge`, `explain` | types what it prints | the code prints `display`, and `display` is an accepted answer |
| `blank` | `question`, `code` with one `___`, `target`, `options`, `explain` | picks what fills the gap | the correct option makes the code print `target`, and no wrong option does |
| `line` | `question`, `code`, `line`, `explain`; `errors: true` if the program fails | taps a line | with `errors`, running it fails, and the error points at `line` |

Options are `{ text, correct: true }` or `{ text, why }`, where `why` explains that wrong answer.
They're shuffled on screen. `explain` is shown after every answer, right or wrong.

## Writing good lessons

- Teach one idea per teaching step, in 2–3 sentences, with a tiny example and its output.
- Ask about it straight away, then mix earlier ideas into later questions.
- Every wrong option should be a mistake people really make, and its `why` should say exactly why.
- Keep code to a few lines; beginners read slowly.
