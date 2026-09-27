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

`shared.js` and `base.css` hold the code and styles the daily page and the sandbox share: languages, the day calendar, XP levels, the syntax highlighter and the base theme.

## Debugg Ltd

"Start your own company" (in the footer, and after each finished puzzle) switches on **Debugg Ltd**, an idle studio-management game, around the daily puzzles. The puzzles become the Director's desk; nothing about them changes.

- **Your desk:** each daily puzzle you finish pays the company ¤2 per XP it earned (¤200 for a first-guess, no-hint solve) and 1 reputation per 20 XP. Solves get +10% per day of streak beyond the first, up to +50%. Only today's puzzles pay, and only ones finished while the company is running.
- **Founder's bonus:** a new company starts with ¤150 plus ¤1 per puzzle XP you've already earned, up to ¤1,000.
- **You, the Director:** your puzzle level in each language is the Director's skill in it. Every level above 1 adds 1% success chance to contracts in that language, up to +10%.
- **The studio:** hire up to 4 devs yourself, then managers; each person supervises up to 3 at the level below. Promotions need time on contracts and skill bars.
- **The contract board:** staff hotfixes, patches, minor releases and major releases (about 1, 10, 30 and 90 minutes for a minimum team). Teams can repeat contracts, and work carries on while the page is closed (up to 4 hours).
- **Pause company** stops the clock completely (no salaries, no progress) until you switch it back on. **Close company** deletes it; puzzle progress, XP and the streak are kept. The footer's "reset puzzles" does the opposite: it keeps the company.

The studio's code (`ltd/ltd.js`, `ltd/ltd.css`) only loads when it's switched on. The puzzle page fires a `debugg:puzzle-finished` event when a game ends, and the studio listens for it; nothing flows the other way. The company is saved under `debugg-ltd`. The old `/studio/` page now redirects to the main page with the studio on, and a company saved there before the merge is imported automatically.

`ideas/debugg-ltd-merge-plan.md` is the plan this was built from, and `CLAUDE.md` has the studio's full design and roadmap.

## Adding a puzzle

Puzzles live in `puzzles.js`. Each language's puzzles run one per day in the order they appear (Day 1 was 27 September 2026), and after a language's last puzzle its list starts over. Add new puzzles to the end of their language's section to keep things fresh. The comment at the top of the file explains each field. Before adding a puzzle, run the snippet for real (Python, or Node for JavaScript) to check its output.

To add a new language, add it to `LANGS` and `SYNTAX` in `shared.js` (name, file extension, indent, keywords, comment and string syntax), then add puzzles with that `lang`.

## Tests

Browser tests (Playwright) cover the daily puzzles, the sandbox and Debugg Ltd, and run in GitHub Actions on every pull request:

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

- **Release tiers:** alongside the daily puzzle (the Hotfix), add a twice-weekly Patch ("spot the bug": click the line that causes it), a weekly Minor release ("modify this code to output this") and a monthly Major release ("write code that outputs this"). The code tiers can build on the sandbox's editor and runners: run the player's code, then compare what it prints. In Debugg Ltd, bigger tiers pay more.
- **Progression** that keeps people coming back, building on the streak, language levels and the company, e.g. unlockable puzzle packs and achievements.
- **Hosting, visitors and player stats:** work out how to host and serve the site, track visitors, and measure levels and progression (puzzle solve rates, return rates, how far players get in Debugg Ltd). Probably cookie-free analytics first, then a small backend for shared puzzle stats and syncing progress between devices. See item 2b in `CLAUDE.md`.
- **Debugg Ltd:** its own roadmap is in `CLAUDE.md`. Tests are done. Next are versioning and the balance pass, and a big company stats panel is planned (item 15d).

## Other ideas

`ideas/contract-debugger-concept.md` is the original brainstorm that Debugg Ltd grew out of. `ideas/bbq-idle-concept.md` sketches a separate idle-game idea: a BBQ smokehouse where real low-and-slow cook times are the idle timers. It's just a concept note for now.
