# Debugg

A Wordle-style daily game where you guess what a short, buggy Python snippet actually prints — no coding required, just read the code and reason it out.

There's a new puzzle every day at local midnight. Each puzzle gives you 4 guesses. Two optional hints are available and don't cost you a guess; using them is tracked and shown alongside your result. Once the game ends you get the explanation, the fix, and an "In the wild" note: a real incident caused by the same kind of bug, or an interesting fact about it. Solving puzzles on consecutive days builds your bug streak.

Each puzzle also earns XP, tracked separately for each language so you level up in each one:

| Solved on guess | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| No hints | 100 | 75 | 50 | 25 |
| 1 hint | 75 | 56 | 38 | 19 |
| 2 hints | 50 | 38 | 25 | 13 |

Running out of guesses or revealing the answer still earns 10 XP. Level 2 starts at 100 XP, and each level after that needs 100 more than the last (300, 600, 1000, …).

## Playing

Open `index.html` directly, or visit the GitHub Pages site once enabled (see below).

## Adding a puzzle

Puzzles live in `puzzles.js`, one per day in order (Day 1 was 27 September 2026). After the last one, the list starts over from the beginning, so add new puzzles to the end to keep things fresh. The comment at the top of the file explains each field. Before adding a puzzle, run the snippet in real Python to check its output.

## Deploying with GitHub Pages

1. Push this repo to GitHub (already done if you're reading this here).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Save — the site will be published at `https://<username>.github.io/debugg/` within a minute or two.

## Roadmap

- Add puzzles in more languages. XP is already tracked per language: add the language to `LANGS` in `index.html` and set `lang` on its puzzles. The syntax highlighter only knows Python so far.
- Add a sandbox where players can write and run their own code snippets.
- Add new puzzle types alongside "what does this print?":
  - **Fix it:** modify the given code so it produces the correct output.
  - **Write it:** write code from scratch that produces a given output.
- Add progression that keeps people coming back, building on the daily bug streak and language levels, e.g. unlockable puzzle packs or harder tiers, and achievements.

## Other ideas

`ideas/contract-debugger-concept.md` sketches a separate idle-game concept that grew out of Debugg's puzzle mechanic. It's a distinct project, not a direction for this game — kept here as a note, not wired into anything.

A first playable slice of that concept lives at `studio/index.html` (served at `/studio/` on GitHub Pages once enabled). You start as a lone Director who also manages the start-up:
- **Your desk:** you solve puzzle contracts yourself for cash.
- **Your first hires:** hire up to 4 devs yourself; after that you need real managers.
- **A tiered team:** each person supervises up to 3 at the level below. Promotions need both time served and skill bars.
- **The contract board:** staff contracts of 1, 10, 30 or 90 minutes. Each has team requirements and shows its random language and domain.
- **Repeat:** a team can keep taking the same kind of contract, even while you're away.

`studio/CLAUDE.md` has the full current design.

`ideas/bbq-idle-concept.md` sketches another separate idle-game idea: a BBQ smokehouse where real low-and-slow cook times are the idle timers. It's just a concept note for now.

It's a prototype slice, not balanced or feature-complete — see the open questions in the concept doc for what's still to design.
