# PROCESS — how work moves in Debuggit

One screen. Design lives in `CLAUDE.md`; this file is only the workflow, gates and token rules.

## Stages

| Stage | I type | Agents | Gate | Check |
|---|---|---|---|---|
| plan an idea | `/develop ideas/<file>.md <n>` | Explore → roadmap → plan-writer → todo-curator | I set `PLAN.md` to `Status: Approved` | — |
| build one item | `/implement [daily\|ltd\|learn]` | one product worker → verifier | green verdict only | fast set |
| review | `/review` | verifier + fresh reader | I read the diff | full set |
| close | `/status` | — | I do the git | — |
| release | I say "release [product] [version]" | `tools/release.js` (see CLAUDE.md "Releases") | I approve any `<!-- player -->` block | CI |
| distribute | `/distribute` | ship-web / ship-phone | I do deploy, DNS, store submission | — |

## Gates — never cross without me
- `PLAN.md` at `Status: Draft` (no code).
- Commit, push, tag, `tools/release.js`, deploy, DNS, store submission.
- Renaming a `debuggit-*` key or state key, or changing `SAVE_VERSION` (live saves) without a boot-sequence guard.
- A balance number (salary, payout, SLOC, timing, XP) without its source value.
- Bumping a minor version before I approve its `<!-- player -->` block.

## One product per branch
`daily-worker` · `ltd-worker` · `learn-worker` each own their files (`tools/check-scope.js` enforces it in CI).
Shared files (`shared.js`, `base.css`, `backup.js`, `tools/`, CI) count for none; a change players see still
needs a line under `## Unreleased` in each affected product's changelog.

## Checks
```bash
npx playwright test tests/<product>.spec.js   # fast set, run on every item (daily | ltd | learn | sandbox)
npm run check-puzzles                         # whenever puzzles/ or learn/ snippets change
node tools/check-scope.js                     # before a PR
npm test                                      # full set, only before a PR
npm run sim                                   # Ltd balance/pacing changes only
```

## Token rules (the point of this file)
- **Read order is fixed:** `NOTES.md` handoff → `TODO.md` Now → `PLAN.md` → only the section of
  `CLAUDE.md` / `ltd/CLAUDE.md` the item names. Never read a whole 20 KB+ file to answer a narrow question.
- **Never read whole:** `ideas/roadmap.md` (88 KB), `ltd/CLAUDE.md` (27 KB), `puzzles/*.js`, `learn/*/*.js`,
  `CHANGELOG.md`s. `grep -n` for the heading or id, then read with `offset`/`limit`.
- **Broad searches go to Explore**, which returns conclusions with `file:line`, not file dumps.
- **One item per session.** Finish with the `NOTES.md` handoff, then `/clear` — the files carry state, not the chat.
- **Test output is piped through `tail -40`.** Workers report pass/fail and failing spec names, not logs.
- **Handoff stays under 10 lines;** `NOTES.md` stays under 40 — prune a decision once it lives in code or `CLAUDE.md`.
- **Durable lesson?** One line into `NOTES.md` Gotchas (or the relevant `CLAUDE.md` section), not a new file.

## Escalate (stop and ask) when
- the diff would touch more than one product, or more than 3 files outside the item's named files
- the item needs a decision I haven't made
- two items are independent → separate branches, parallel workers

## Where the truth lives
what the game is: `CLAUDE.md` (`ltd/CLAUDE.md` for Ltd) · what's next: `PLAN.md` + `TODO.md` ·
ideas and roadmap: `ideas/` · what happened last: `NOTES.md` handoff · players' view: the changelogs.

## Slash commands live in two places
`.pi/prompts/` (pi-code) and `.claude/commands/` (Claude Code) hold the same prompts. Edit `.pi/prompts/` first, then `cp .pi/prompts/*.md .claude/commands/` and re-add the `Arguments: $ARGUMENTS` line to `develop`, `implement` and `distribute`.
