# Debugg Learn

Courses that teach a language from the very start. `learn/index.html` is the page (at `/learn/`, its own section of the site; `learn.html` redirects there), `learn/learn.js` the
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
- A checkpoint asks each question once and you pass with `pass` correct; retry any time. It draws `ask` questions (default: as many as `steps`) from a pool, `steps` plus `more`, favouring the ones asked least often and shuffling the order, so a retry is a different set. Counts are kept in the save (`asked`). The same pool feeds **Practice**, a row on every passed unit: `ask` questions from the pool, a wrong answer coming back before the end until it's right (and joining the review queue), and 2 XP for each question right first time, as in a review. A **mixed practice** button on the course map does the same across every passed unit (10 questions, taking turns between units). Aim for about 24 questions in the pool.
- **Review:** every question missed, in a lesson or a checkpoint, joins the review queue and comes
  back a day later in a **Review** round (up to 8 questions, oldest first), shown in the Continue card
  when due. Right first time, it comes back after 3 days, then 7; right three times running, it's
  learnt and leaves the queue. Missed again, it starts over from the next day. 2 XP per question right
  first time. Entries find their question by its `question` and `code`, so rewording a question drops
  it from people's queues, and no two questions in one lesson or checkpoint may share both (the
  checker fails it).
- **Learn XP** (per language) and the **Learn streak** are separate from the daily puzzles':
  10 XP for finishing a lesson the first time, 5 per star (new stars only), 30 for first passing a
  checkpoint. The streak counts days with a lesson finished, a checkpoint passed or a review round done.
- Everything is saved under `debugg-learn` (backed up with the rest, reset with the demo at v0.1,
  and kept by the daily page's "reset puzzles").

## Playing

- Keys: 1–9 pick an option (in the order shown) or the line with that number, and Enter continues.
  Options show their number, except on touch screens.
- The kiwi reacts to each answer, and the summary pops the stars in and celebrates a new Learn level
  and the streak going up that day. Animations stop under "reduce motion".

- Every step with code links to the sandbox (`learn/sandbox.html?lang=python&code=…`, in a new tab):
  teaching steps under the code, questions in the feedback once answered (a blank filled in).

## The sandbox

`learn/sandbox.html` is part of Learn: write and run Python (Pyodide) or JavaScript in the browser.
`?lang=python&code=…` opens a lesson's example; `?lang=python&day=3` replays a finished daily puzzle
(the game's "Run it yourself" link). `sandbox.html` at the site root redirects here.

## Adding a unit

1. Write `learn/<lang>/NN-name.js`, pushing one unit onto `window.DEBUGG_LEARN.units` (copy an existing one).
2. Add the file to the course's `files` in `learn/courses.js` (and remove its title from `planned`).
   A new course can start as `soon: true` with `files: []`: its tab says "soon" and lists only
   the planned units. Drop `soon` when its first unit goes in. A course's `sections`
   (`{ id, title, summary, planned }`) list later parts under their own heading, like C's
   Embedded C; for now they hold planned units only.
3. Add a `<script>` tag for it in `learn/index.html`. (A test checks the page loads every listed file.)
4. Run `npm run check-puzzles`: it runs every snippet in every lesson.

A new language's course goes in `courses` in `learn/courses.js`; its language needs a runner in
`tools/check-puzzles.js` and syntax colours in `shared.js`, like the daily puzzles.

## Unit fields

```js
{
  lang: 'python', id: 'values', title: 'Values and printing', summary: 'One line on what it covers.',
  lessons: [ { id: 'print', title: 'print() and text', steps: [ … ] } ],
  checkpoint: { pass: 7, steps: [ … ], more: [ … ] }  // pass out of the questions asked; `ask: n` sets how many (default steps.length)
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

## Links into Learn

`learn/#python` opens a course, and `learn/#python/strings` also picks out a unit. The puzzle page
links to a unit after a missed puzzle whose `learn` field names it (see `puzzles/README.md`; the
checker makes sure the unit exists), so **don't rename a unit's `id`** once puzzles point at it.
When a new unit covers what some puzzles are about, tag them.

## Versions and releases

Debuggit Learn is versioned and released on its own, separate from the game (see "Releases" in
`CLAUDE.md`): `LEARN_VERSION` in `shared.js`, `learn/CHANGELOG.md`, `learn-v…` tags, and its own
What's new (`whatsnew.html?learn`). A branch that changes Learn shouldn't change the game too; the
**scope** CI check stops it, unless both changelogs get notes. Add a line under `## Unreleased` in
`learn/CHANGELOG.md` for anything players will notice, such as a new unit.
