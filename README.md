# Debugg

A Wordle-style daily game where you guess what a short, buggy Python or JavaScript snippet actually prints — no coding required, just read the code and reason it out.

There's a new puzzle in each language every day at local midnight; pick a language with the tabs at the top. Each puzzle gives you 4 guesses. Two optional hints are available and don't cost you a guess; using them is tracked and shown alongside your result. Once the game ends you get the explanation, the fix, and an "In the wild" note: a real incident caused by the same kind of bug, or an interesting fact about it. Solving at least one puzzle a day, in any language, builds your bug streak.

Each puzzle also earns XP, tracked separately for each language so you level up in each one:

| Solved on guess | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| No hints | 100 | 75 | 50 | 25 |
| 1 hint | 75 | 56 | 38 | 19 |
| 2 hints | 50 | 38 | 25 | 13 |

Running out of guesses or revealing the answer still earns 10 XP. Level 2 starts at 100 XP, and each level after that needs 100 more than the last (300, 600, 1000, …).

## Playing

Open `index.html` directly, or visit the GitHub Pages site once enabled (see below).

## Sandbox

`sandbox.html` is a scratchpad for writing and running your own Python or JavaScript, linked from the daily page's footer. After each game, a "Run it yourself" link opens that day's puzzle in it so you can experiment with the code. You can also load any puzzle from an earlier day, or today's once you've finished it, so the sandbox can't spoil today's answer.

- **Python** runs on [Pyodide](https://pyodide.org/) (CPython compiled to WebAssembly), downloaded from jsDelivr on the first Python run (about 13 MB, then cached). Opening the page from disk still needs the internet for this.
- **JavaScript** runs in a fresh Web Worker each time, with `console.log` output formatted much like Node's.
- Both run off the main page, so code that runs too long (10 seconds for Python, 5 for JavaScript) is stopped instead of freezing the tab.
- Drafts are saved per language in your browser.

`shared.js` and `base.css` hold the code and styles the daily page and the sandbox share: languages, the day calendar, the syntax highlighter and the base theme.

## Adding a puzzle

Puzzles live in `puzzles.js`. Each language's puzzles run one per day in the order they appear (Day 1 was 27 September 2026), and after a language's last puzzle its list starts over. Add new puzzles to the end of their language's section to keep things fresh. The comment at the top of the file explains each field. Before adding a puzzle, run the snippet for real (Python, or Node for JavaScript) to check its output.

To add a new language, add it to `LANGS` and `SYNTAX` in `index.html` (name, file extension, keywords, comment and string syntax), then add puzzles with that `lang`.

## Deploying with GitHub Pages

1. Push this repo to GitHub (already done if you're reading this here).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Save — the site will be published at `https://<username>.github.io/debugg/` within a minute or two.

## Roadmap

- Add new puzzle types alongside "what does this print?":
  - **Fix it:** modify the given code so it produces the correct output.
  - **Write it:** write code from scratch that produces a given output.

  Both can build on the sandbox's editor and runners: run the player's code, then compare what it prints.
- Add progression that keeps people coming back, building on the daily bug streak and language levels, e.g. unlockable puzzle packs or harder tiers, and achievements.

## Other ideas

`ideas/contract-debugger-concept.md` sketches an idle-game concept that grew out of Debugg's puzzle mechanic. The plan is for Debugg and that idle game, now called **Debugg Ltd**, to become one game, called Debugg. It opens as a puzzle game with four release tiers: a daily Hotfix ("what does this output?"), a twice-weekly Patch ("spot the bug"), a weekly Minor release ("modify this to output this") and a monthly Major release ("write code to output this"). A "Start your own company" option turns on Debugg Ltd, the studio-management game, around them. See `studio/CLAUDE.md` for the roadmap.

A first playable slice of that concept lives at `studio/index.html` (served at `/studio/` on GitHub Pages once enabled). You start as a lone Director who also manages the start-up:
- **Your desk:** you solve puzzle contracts yourself for cash.
- **Your first hires:** hire up to 4 devs yourself; after that you need real managers.
- **A tiered team:** each person supervises up to 3 at the level below. Promotions need both time served and skill bars.
- **The contract board:** staff hotfixes, patches, minor releases and major releases (about 1, 10, 30 and 90 minutes for a minimum team). Each has team requirements and shows its random language and domain.
- **Repeat:** a team can keep taking the same kind of contract, even while you're away.

`studio/CLAUDE.md` has the full current design.

`ideas/bbq-idle-concept.md` sketches another separate idle-game idea: a BBQ smokehouse where real low-and-slow cook times are the idle timers. It's just a concept note for now.

It's a prototype slice, not balanced or feature-complete — see the open questions in the concept doc for what's still to design.
