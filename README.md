# Debuggit

A Wordle-style daily game where you guess what a short, buggy code snippet actually prints — no coding required, just read the code and reason it out. The languages take turns: Python for now, with C, Rust and JavaScript written and ready to join.

**The name and the wordmark.** It's called **Debuggit** ("debug it"), and its logo is that phrase written as a line of code in the day's puzzle language: `debugg(it)` on a Python day, `debugg.it()` in JavaScript, `debugg!(it)` in Rust, `debugg(&it);` in C. Each page has its own: `debugg.learn()`, `debugg.run()` (the sandbox) and `debugg.ltd()` (the studio). Beside it sits the **Debuggit duck** (`img/duck.svg`), a rubber duck for rubber-duck debugging: it's the logo and favicon, it reacts after every puzzle ("Quack! First try, no hints."), and it cheers Learn lessons on. `img/share.png` is the link-preview card and `img/duck-180.png` the home-screen icon. `renderWordmark()` in `shared.js` draws it with the puzzles' syntax colours. The repository, the `debugg-*` save keys and names like `window.Debugg` keep the old spelling: players never see them, and renaming them would break saves.

**This is the demo.** Demo Day 1 is Monday 5 October 2026, and there's no release date for v0.1 yet. A notice on the first visit (and the **demo** badge in the header) warns players that all progress will be reset when v0.1 comes out; `shared.js` carries the save version and the reset, and Debuggit Ltd is cut down to hotfixes, with no managers (see "Debuggit Ltd" below).

**One puzzle a day, and the languages take turns.** `ROTATION` in `shared.js` lists the languages in play and the day each one joins; for now it's Python only. With more than one, they share the week's six puzzles (Monday to Friday and the weekend), shifting one day along each week so every language gets every difficulty in turn. A newly added language only gets Monday and Tuesday, the easy days, for its first two weeks. C, Rust and JavaScript puzzles are written and checked; to introduce one, add it to `ROTATION` with the day it joins.

There's a new puzzle every day at local midnight. **Difficulty follows the week:** Monday is a warm-up, then easy, medium, tricky, and Friday is hard. Saturday and Sunday share one harder weekend puzzle (solving it on either day counts for both). Each puzzle gives you 4 guesses. Two optional hints are available and don't cost you a guess; using them is tracked and shown alongside your result. Once the game ends you get the explanation, the fix, and a one-line **takeaway**: the general rule to remember. Solving the daily puzzle builds your bug streak. When it's over, **Share your result** copies a spoiler-free line of squares (right, wrong, unused) and hints, Wordle-style.

Each puzzle also earns XP in its language, so you level up in each language you play, and all of it adds up to an **overall level** shown above them. A first-guess, no-hint solve earns the day's XP:

| Monday | Tuesday | Wednesday | Thursday | Friday | Weekend |
|---|---|---|---|---|---|
| 60 | 80 | 100 | 120 | 150 | 200 |

Solving on the 2nd, 3rd or 4th guess earns 75%, 50% or 25% of that, and each hint takes off a quarter (1 hint: 75%, 2 hints: 50%). For example, a Wednesday puzzle solved on the 2nd guess with 1 hint earns 100 × 0.75 × 0.75 = 56. Running out of guesses or revealing the answer still earns 10 XP. Level 2 starts at 100 XP, and each level after that needs 100 more than the last (300, 600, 1000, …).

## Learn

`learn.html` (the **Learn** tab next to **Daily**) teaches a language from the very start, one short lesson at a time. A course is made of units, each with a few lessons and a checkpoint. Lessons mix quick teaching points with questions: multiple choice, "what does this print?", fill the blank, and "tap the line with the bug". Answer a question wrong and you're told why, then it comes back before the end of the lesson; stars show how cleanly you got through. Passing a unit's checkpoint unlocks the next unit, and anyone can take it straight away to skip what they already know.

Learn has its **own XP and streak**, separate from the daily puzzles. The Python course's Unit 1 (Values and printing) is built; the next units are listed as coming soon. C has a coming-soon tab showing its planned units, with Embedded C as a section at the end. `learn/README.md` explains the format for writing more, and the puzzle checker runs every lesson snippet too.

## Playing

Open `index.html` directly, or visit the GitHub Pages site once enabled (see below).

## Sandbox

`sandbox.html` is a scratchpad for writing and running your own Python or JavaScript, linked from the daily page's footer. After each game, a "Run it yourself" link opens that day's puzzle in it so you can experiment with the code. You can also load any puzzle from an earlier day, or today's once you've finished it, so the sandbox can't spoil today's answer.

- **Python** runs on [Pyodide](https://pyodide.org/) (CPython compiled to WebAssembly), downloaded from jsDelivr on the first Python run (about 13 MB, then cached). Opening the page from disk still needs the internet for this.
- **JavaScript** runs in a fresh Web Worker each time, with `console.log` output formatted much like Node's.
- Both run off the main page, so code that runs too long (10 seconds for Python, 5 for JavaScript) is stopped instead of freezing the tab.
- Drafts are saved per language in your browser.
- The sandbox shows the languages in the puzzle rotation that can run in a browser. C and Rust can't yet: a Rust puzzle links to the Rust Playground instead, and a C puzzle has no run link.

`shared.js` and `base.css` hold the code and styles the daily page and the sandbox share: languages, the day calendar, XP levels, the syntax highlighter and the base theme.

## Your progress, feedback and privacy

- **Backup:** everything is saved in the player's browser only. The footer's **backup** link shows a code holding all of it (puzzles, XP, streak, company, sandbox drafts) and restores from one on any device (`backup.js`).
- **Feedback:** after each game, "Report it" opens a GitHub issue prefilled with the puzzle's language, day, first line and expected answer; the footer's **feedback** link opens a blank one. Issues are public, and reporting needs a GitHub account.
- **Analytics:** `analytics.js` counts visits and a few anonymous events with [GoatCounter](https://www.goatcounter.com) (no cookies). The dashboard is at https://debugg.goatcounter.com. Setting `SITE_COUNT_URL` in that file to `''` switches it off. Events: puzzle results (language, day, solved in how many guesses, hints), level-ups, Debuggit Ltd founding/pausing/resuming/closing/hiring/promoting, backup and feedback use, and sandbox runs. Typed answers and code are never sent.
- **Privacy:** `privacy.html` explains all of the above to players. Fonts are served from `fonts/` (Sora and JetBrains Mono, SIL Open Font License), not Google Fonts.

## Debuggit Ltd

The **Ltd** tab at the top (headed **Debuggit Ltd**, next to Daily and Learn; "Start your own company" there, or after each finished puzzle) switches on **Debuggit Ltd** (labelled beta while it's balanced), an idle studio-management game, around the daily puzzles. The puzzles become the Director's desk; nothing about them changes.

- **Your desk:** each daily puzzle you finish pays the company ¤2 per XP it earned (¤200 for a first-guess, no-hint solve) and 1 reputation per 20 XP. Solves get +10% per day of streak beyond the first, up to +50%. Only today's puzzles pay, and only ones finished while the company is running.
- **Founder's bonus:** a new company starts with ¤150 plus ¤1 per puzzle XP you've already earned, up to ¤1,000.
- **You, the Director:** your puzzle level in each language is the Director's skill in it. Every level above 1 adds 1% success chance to contracts in that language, up to +10%.
- **The studio:** hire up to 4 devs yourself, then managers; each person supervises up to 3 at the level below. Promotions take a while (12 hours on contracts for Junior, 3 days for Senior, 14 days for Principal) plus skill bars, so hiring at a level is the quick route. But only graduates (and managers) can be hired at will: juniors, seniors and principals apply now and then, each asking their own price with an offer open for 12 hours, and seniors and principals only apply once the studio has earned some reputation. Hiring costs only go up: now and then inflation raises every price a little, or a rival studio competing for one level raises that one more.
- **The contract board:** staff hotfixes, patches, minor releases and major releases (about 1, 10, 30 and 90 minutes for a minimum team), grouped in foldable sections. There's always a hotfix in every language. Contracts, skills and promotions are by programming language. Teams can repeat contracts, and work carries on while the page is closed (up to 4 hours).
- **Pause company** stops the clock completely (no salaries, no progress) until you switch it back on. **Close company** deletes it; puzzle progress, XP and the streak are kept. The footer's "reset puzzles" does the opposite: it keeps the company.

Patches and bigger contracts only come to the board once the company has more than 10 staff, the Director included.

A **Next step** card walks a new company through its first hire, its first contract and the desk puzzle; after that, the studio warns about anyone left on the bench (they're still paid) and about debt. The board shows the contracts your staff can take, with the rest folded away.

**In the demo** the company is the start-up slice: no managers, so you can have up to 4 devs, which means hotfixes only (patches need more than 10 staff). Minor and major releases show on the board as "coming in v0.1".

The studio's code (`ltd/ltd.js`, `ltd/ltd.css`) only loads when it's switched on. The puzzle page fires a `debugg:puzzle-finished` event when a game ends, and the studio listens for it; nothing flows the other way. The company is saved under `debugg-ltd`. The old `/studio/` page now redirects to the main page with the studio on, and a company saved there before the merge is imported automatically.

`ideas/debugg-ltd-merge-plan.md` is the plan this was built from, and `CLAUDE.md` has the studio's full design and roadmap.

## Adding a puzzle

Puzzles live in `puzzles/`, one file per language (`python.js`, `c.js`, `rust.js`, `javascript.js`), each with a `difficulty` from 1 (warm-up) to 5 (hard). `puzzles/README.md` explains the fields and how days are scheduled. The demo's Day 1 is Monday 5 October 2026; days before it show a "Preview" puzzle. Add new puzzles to the end of their file, then run:

```sh
npm run check-puzzles
```

It runs every snippet with the real toolchain (`python3`, `node`, `gcc` and `clang`, `rustc`) and checks it prints exactly the puzzle's answer, and it also runs in CI. It prints how many puzzles each language has at each difficulty: a language on its own uses one each of difficulties 1 to 4 a week and two of 5.

To add a new language: add it to `LANG_INFO`, `PUZZLE_FILES` and `SYNTAX` in `shared.js` (name, file extension, keywords, comment and string syntax), give the checker a runner for it in `tools/check-puzzles.js`, write its puzzles, then add it to `ROTATION` with the day it joins.

## Tests

Browser tests (Playwright) cover the daily puzzles, the sandbox and Debuggit Ltd, and run in GitHub Actions on every pull request:

```sh
npm install
npx playwright install chromium   # first time only
npm test
```

The sandbox's Python tests download Pyodide from the CDN. Without internet access, point `PYODIDE_DIR` at an unpacked copy of the `pyodide` npm package and the test server hosts it instead.

## Deploying with GitHub Pages

1. Push this repo to GitHub (already done if you're reading this here).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Save — the site will be published at `https://<username>.github.io/debugg/` within a minute or two.

## Roadmap

- **v0.1:** the first real release, with a launch date, the full company and a reset of all demo progress. See items 2 and 2c in `CLAUDE.md`.
- **Company-first, decided from the demo:** make Debuggit Ltd the game, with the daily puzzle as the Director's desk (still shareable, and still playable without a company) and Learn as its own lane. The demo runs as the daily; GoatCounter's company events then show whether puzzle players take to the studio. The game is now called Debuggit (item 2c). See item 2c in `CLAUDE.md`.
- **Puzzle formats** (decided; see item 3b in `CLAUDE.md`): the weekly difficulty rotation is built, with every day using "what does this output" for now. Still to come are the other formats, which follow the week too. Monday is easiest (multiple choice, fill the blank), Friday the hardest, and the weekend is one bigger code challenge (make it pass, write it). Formats in the rotation: what does this output, multiple choice, fill the blank, value of `x`, how many times does this run, will it error, order the lines, spot the bug, spot the difference, fix it, make it pass, write it, which is faster, and code golf. Guesses and hints vary by format, and XP (and Debuggit Ltd desk pay) rises with difficulty.
- **Embedded C track:** C for microcontrollers (bits and masks, registers and `volatile`, fixed-width types, interrupts, timing) as daily puzzles, a 10-unit Learn course with new question types (register values, flip the bits, a virtual LED board), and later Debuggit Ltd's embedded contracts. See `ideas/embedded-c-roadmap.md`.
- **Learn track:** lessons per language played in order at any time, teaching one concept each with a "try this next" for the sandbox. Lessons earn XP but don't count towards the streak. Monday's daily puzzles are learn-level too.
- **Progression** that keeps people coming back, building on the streak, language levels and the company, e.g. unlockable puzzle packs and achievements.
- **Hosting, visitors and player stats:** work out how to host and serve the site, track visitors, and measure levels and progression (puzzle solve rates, return rates, how far players get in Debuggit Ltd). Probably cookie-free analytics first, then a small backend for shared puzzle stats and syncing progress between devices. See item 2b in `CLAUDE.md`.
- **Debuggit Ltd:** its own roadmap is in `CLAUDE.md`. Tests are done. Next are versioning and the balance pass, and a big company stats panel is planned (item 15d).

## Other ideas

`ideas/contract-debugger-concept.md` is the original brainstorm that Debuggit Ltd grew out of. `ideas/bbq-idle-concept.md` sketches a separate idle-game idea: a BBQ smokehouse where real low-and-slow cook times are the idle timers. It's just a concept note for now.
