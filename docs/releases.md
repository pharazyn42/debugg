# Releases and one-product-per-branch

The full routine, moved out of `CLAUDE.md` (which keeps a summary under "Releases"). Code comments and CI refer to "Releases" in `CLAUDE.md`; this is the detail behind it.

**Releases.** Three products, released separately (the player-owner's calls, September 2026: Learn
**Releases.** Three products, released separately (the player-owner's calls, September 2026: Learn
first, since the Ltd game changes far more often than Learn, then the daily and Ltd): **Debuggit**,
the daily puzzle; **Debuggit Ltd**, the studio game; and **Debuggit Learn**. Each has:
- **Its own semantic version:** `APP_VERSION` (the daily), `LTD_VERSION` or `LEARN_VERSION` in
  `shared.js`. All are separate from `SAVE_VERSION`, which only changes to reset saves. The daily
  and Ltd shared one version up to 0.0.4, where Ltd's starts (its notes from 0.0.1 to 0.0.4 were
  moved into its own changelog); Learn split off at 0.0.2. They run 0.0.x through the demo;
  **0.1.0 is the launch** for each, since the v0.1 reset clears everything. After that, the middle
  number is for new things to play (Learn: new units or courses) and the last for fixes and balance.
- **Its own changelog:** `CHANGELOG.md` for the daily, `ltd/CHANGELOG.md` for Ltd,
  `learn/CHANGELOG.md` for Learn.
- **Its own What's new:** `whatsnew.html`, `whatsnew.html?ltd` or `whatsnew.html?learn`
  (`PRODUCTS` in `shared.js` says which changelog each reads). The Daily tab's footer (and the
  privacy page's) shows "v0.0.4 demo", the Ltd tab's "Ltd v0.0.4 demo" and Learn's "Learn v0.0.5
  demo", each linking to its own What's new. Each has its own "· new" until the player has looked
  (`debugg-seen-version`, `debuggit-ltd-seen-version`, `debugg-seen-learn-version`).
- **Its own tags and GitHub Releases:** `v0.0.5` / "Debuggit v0.0.5", `ltd-v0.0.5` / "Debuggit Ltd
  v0.0.5", and `learn-v0.0.5` / "Debuggit Learn v0.0.5". Only the daily's releases are marked the
  repository's "latest".

**One product per branch (decided with the player-owner).** A branch, and so a PR, changes one
product, never more. The exception is a change that really affects more than one: then each
changelog it touches gets notes in that PR, and those products are released together.
- The **scope** CI job (`tools/check-scope.js`) enforces this on every PR. Learn files are
  `learn/` (the sandbox included), `learn.html`, `sandbox.html`, `tests/learn.spec.js` and
  `tests/sandbox.spec.js`. Ltd files are `ltd/` (its changelog included), `studio/` and
  `tests/ltd.spec.js`. Daily files are `index.html`, `daily/`, `puzzles/`, `CHANGELOG.md` and
  `tests/daily.spec.js`. `index.html` also holds the Ltd tab, so on a branch whose other files are
  all Ltd's it counts as Ltd's. A PR touching more than one fails unless it changes each one's
  changelog.
- Everything else is shared (`shared.js`, `base.css`, `backup.js`, tools, docs, CI) and counts for
  none. A shared change players will notice still needs a line in the changelog of each product it
  affects.
- This session works from one designated branch, so each PR from it is kept to one product, and
  the branch is re-synced with `main` after every merge.

The routine:
- **Every change players will notice adds a line under `## Unreleased`** in its product's
  changelog, in the same PR, written for players. The changelogs are the full developer log and
  stay in full.
- **What's new shows players a curated view** (`playerView()` in `whatsnew.html`; the player-owner's
  call, October 2026). While the demo runs (0.0.x, before any 0.1.0) every section is shown. After
  that a section shows only its `<!-- player -->` … `<!-- /player -->` block: 3 to 6 one-line bullets
  of what players will notice (new things to play, changes they'd see, fixes they'd have hit; not
  tests, tooling, refactors or small balance tweaks). **Every minor release (0.1.0, 0.2.0…) has one**
  and `tools/release.js bump` refuses a minor without it. **Before bumping a minor, draft that block
  from the patch notes since the last minor, show it to the player-owner and get it approved**; for
  0.1.0 it is the launch summary of the product, and the 0.0.x demo sections drop out of the page
  automatically. A patch gets a block only for a critical fix players would notice, when the
  player-owner agrees. The "· new" badge still follows `shared.js`'s version.
- The player-owner says **release**, optionally with the product and version ("release Learn",
  "release 0.1.0").
  - Which product: whichever they name. If they don't name one, release every product with
    something under Unreleased.
  - Which version: the one they give, otherwise the next patch number.
  - Bump with `node tools/release.js bump <version>` for the daily,
    `node tools/release.js ltd bump <version>` for Ltd, or `node tools/release.js learn bump <version>`
    for Learn. That dates the Unreleased notes and
    sets the version. Then commit, PR (its scope check passes, since a release only touches
    `shared.js` and that product's changelog) and merge.
  - Then run the **Release** workflow on `main` with that product and version
    (`workflow_dispatch`). Claude starts it through the GitHub connection, since this session
    can't push tags, or the player-owner can from the Actions tab. Pushing a `v<version>`,
    `ltd-v<version>` or `learn-v<version>` tag also starts it.
- `.github/workflows/release.yml` runs every test (it calls `tests.yml`), checks that `shared.js`
  and that product's changelog agree with the version, then creates the tag and a GitHub
  Release with that version's notes. Tests failing means no release.
- Until item 2d, `main` still deploys straight to GitHub Pages, so a release is a label and a
  changelog entry; with 2d the public site will follow releases and `main` will go to a dev site.
