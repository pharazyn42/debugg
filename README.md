# Debugg

A Wordle-style daily game where you guess what a short, buggy Python snippet actually prints — no coding required, just read the code and reason it out.

Each puzzle gives you 4 guesses. Two optional hints are available and don't cost you a guess; using them is tracked and shown alongside your result.

## Playing

Open `index.html` directly, or visit the GitHub Pages site once enabled (see below).

## Deploying with GitHub Pages

1. Push this repo to GitHub (already done if you're reading this here).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Save — the site will be published at `https://<username>.github.io/debugg/` within a minute or two.

## Roadmap

- Rotate in a new puzzle each day instead of always showing Day 1.
- Move puzzle content into a small JSON/data file so new days can be added without touching the page code.

## Other ideas

`ideas/contract-debugger-concept.md` sketches an idle-game concept that grew out of Debugg's puzzle mechanic. The plan is for it to become an optional "studio mode" on this site. Debugg stays playable as a plain daily puzzle; players who opt in get a studio-management game built around the same puzzles. See `studio/CLAUDE.md` for the roadmap.

A first playable slice of that concept lives at `studio/index.html` (served at `/studio/` on GitHub Pages once enabled). You start as a lone Director who also manages the start-up:
- **Your desk:** you solve puzzle contracts yourself for cash.
- **Your first hires:** hire up to 4 devs yourself; after that you need real managers.
- **A tiered team:** each person supervises up to 3 at the level below. Promotions need both time served and skill bars.
- **The contract board:** staff contracts of 1, 10, 30 or 90 minutes. Each has team requirements and shows its random language and domain.
- **Repeat:** a team can keep taking the same kind of contract, even while you're away.

`studio/CLAUDE.md` has the full current design.

`ideas/bbq-idle-concept.md` sketches another separate idle-game idea: a BBQ smokehouse where real low-and-slow cook times are the idle timers. It's just a concept note for now.

It's a prototype slice, not balanced or feature-complete — see the open questions in the concept doc for what's still to design.
