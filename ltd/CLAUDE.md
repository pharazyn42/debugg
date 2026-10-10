# Debuggit Ltd: design and implementation notes

How the studio game works now. Loaded by Claude Code when working in `ltd/`; the root `CLAUDE.md` and `docs/design.md`
covers the whole site (files, the tabs and loader, releases, saves, the calendar). Item numbers
refer to the roadmap in `ideas/roadmap.md`.

## Data model (as currently implemented)

```js
// The desk: desk jobs (ltd/desk.js for the questions)
DESK_EVERY_MIN = [45, 90], DESK_MAX = 3, DESK_LIFE_H = 4   // a job every 45–90 min, 3 waiting at most, open 4h
DESK_SIZES = 1 (50%), 2 (33%), 3 (17%) questions
DESK_PAY = { 1: 40, 2: 55, 3: 70, 4: 85, 5: 100 }         // ¤ per right answer, by difficulty (Learn = 1)
DESK_BOOST = { 1: ×1, 2: ×1.25, 3: ×1.5 }                 // when every answer in the job is right
DESK_REP = 1, DESK_SEEN = 40                               // reputation per right answer; recent questions kept out
START_CASH = 250                                       // no founder's bonus (gone October 2026: Ltd's XP is its own)
LTD_XP_PER_DIFFICULTY = 6                              // Director XP per right desk/help answer, per language (state.xp)
DIRECTOR_BOOST_PER_LEVEL = 0.01, DIRECTOR_BOOST_CAP = 0.10   // success chance per Director level above 1

LANGS   = ['Python', 'C/C++', 'JavaScript', 'Rust']   // Assembly dropped; old saves fold it into C/C++
// Languages only: domains were removed (item 3) and are planned to return later (item 16).
SKILL_XP = [10, 50, 150, 400, 1000] // total XP for skill levels 1..5; no top level: each later gap is
                                    // 800 longer (6 at 1,800, 7 at 3,400, 8 at 5,800…; skillXp())
SKILL_FULL = 5                      // skill's effects stop growing at level 5

ROLES = { Director, Manager, Graduate, Junior, Senior, Principal }  // sloc, salary/min, cost, reliability
// costs: Manager 900, Graduate 180, Junior 750, Senior 3000, Principal 12000 (× the market's prices)
PROMOTION = { Junior: {12h, lang:3}, Senior: {3 days, 5}, Principal: {14 days, 8} }  // contract time + a skill level
SKILL_SPEED_BEYOND = 0.05                // +5% base SLOC/min per skill level past 5
EXPERT = [Lv 3 ×1.3 (14), Lv 5 ×1.6 (7), Lv 8 ×2.2 (3)], none 76, EXPERT_HOTFIXES = 1   // expert contracts
LINE_RATE = 1                            // ¤ per SLOC delivered, × tier multiplier (skill doesn't raise pay)
MARKET_EVERY_H = [12, 36], INFLATION = [2%, 4%] (every role), COMPETITION = [6%, 15%] (one role),
COMPETITION_CHANCE = 0.4                 // hiring prices only go up
SKILL_SPEED = 1.0, SKILL_CHANCE = 0.05   // level 5+ in the contract's language: 2× SLOC/min, +5% success
RETRY_TIME = 0.5, RETRY_PAYOUT = 0.75
BENCH_MARGIN = 0.05                      // odd jobs on the bench pay salary + 5%
TIERS = [ hotfix ~5 SLOC / 1 dev, patch ~400 SLOC / 3-5 + senior,
          minor release ~2,700 SLOC / 5-10 + principal,
          major release ~22,500 SLOC / 10+ incl. manager, 2 principals, 3 seniors ]
// Renamed from quick fix / sprint / milestone / full delivery (same rules,
// same indices); TIERS_VERSION lets the boot sequence refresh old boards.
// The board holds one hotfix per language, plus OFFERS_PER_TIER (2) of each
// other type; BOARD_VERSION 2 = languages only (older saves are converted).
// each tier: minutes + refSloc (reference time for the cheapest valid team);
// an offer's SLOC target = refSloc × minutes ± SLOC_SPREAD (15%)
```

**Top-level state:**
```js
state = {
  money, reputation, lastTick,
  roster: [ { id, name, role, since, worked, lang: {name: xp}, away?, notice?, raise? } ],  // Director is roster[0]; worked = ms on contracts at current level;
                                                                        // away = { kind: 'training'|'holiday'|'sick'…, until } (no odd jobs meanwhile)
  board:  [ { id, tier, lang, sloc, risk, expert, expiresAt } ],  // a hotfix per language + an expert hotfix + 2 of each other type; sloc = work target;
                                                          // risk = 'standard'|'risky'|'high'; expert = skill level needed (0 = none)
  jobs:   [ { id, tier, lang, sloc, teamSloc, team: [ids], startedAt, endsAt, chance, payout, repeat,
              status: 'running'|'failed'|'stuck', attempt: 1|2, stuckPoints?, left?, question? } ],  // stuck*: intern hotfixes
  log:    [ { kind: 'ok'|'bad'|'info', text } ],
  collapsedLevels: [],                            // roster tree groups folded in the UI
  collapsedTiers: [],                             // contract board groups folded in the UI ('hotfix', …)
  tiersVersion, boardVersion,                     // save-shape markers for the boot migrations
  enabled, pausedAt,                              // false / a time while the player has it paused
  desk: { jobs: [ { id, size, questions: [ids], answered: [bools], expiresAt } ], nextAt, seen, done },  // desk jobs
  applicants: [ { id, role, person, cost, expiresAt } ], nextApplicantAt,
  guideDone, showUnknownOffers,                   // the first-steps guide is over; the board shows every offer
  stage,                                          // the business stage last announced ('startup', 'small', …)
  market: { prices: { Graduate: 1.08, … }, nextAt }, // hire-cost multipliers, and when the market next moves
  office: { premises, owned },                    // 'spare-room' | 'unit-s'; owned = bought rather than rented
  showOffice,                                     // false once the player hides the office view
  contractsOpen, firstClient, nextFeatureAt,      // features: open once the spare room is full; the first client offered; the next arrival
  companyName,                                    // the founding step's name (null: "Debuggit Ltd")
  nextNoticeAt                                    // when the next hourly notice roll is due
}
```

## What's implemented

Everything built so far is in `ltd/implemented.md` (about 21 KB, by topic). Grep it for the mechanic you are
changing (`grep -n "^- \*\*" ltd/implemented.md`) and read only that bullet; don't load it whole.

## Known gaps — not wired in yet

- **Reputation only decides which applicants turn up** (roadmap item 12 has more for it).
- **Skill gain is a placeholder**: a flat XP rate with no supervision
  effect (item 22).
- **No training spend, studio upgrades, or prestige** (items 14, 15, 19).
- **Balance is untuned** (item 10).

