# Debuggit Ltd: design and implementation notes

How the studio game works now. Loaded by Claude Code when working in `ltd/`; the root `CLAUDE.md`
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
START_CASH = 250, FOUNDER_BONUS_CAP = 1000             // + ¤1 per puzzle XP at founding
DIRECTOR_BOOST_PER_LEVEL = 0.01, DIRECTOR_BOOST_CAP = 0.10   // success chance per puzzle level above 1

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
  office: { cowork },                             // co-working desks rented beyond the spare room's 4
  showOffice,                                     // false once the player hides the office view
  nextNoticeAt                                    // when the next hourly notice roll is due
}
```

## What's implemented

- **The desk is desk jobs** (the player-owner's call, September 2026, when the daily was separated
  from the game; `moveDesk()`, `state.desk`, `ltd/desk.js`). A job turns up every 45–90 minutes
  (the first straight away), while the page is closed too (not while paused), at most 3 waiting,
  each open for 4 hours. It's 1, 2 or 3 questions (50/33/17%), drawn from:
  - **past daily puzzles** (the last 40 slots, never today's), in their own format; "order the
    lines" is asked as "what does this print?";
  - **Debuggit Learn's questions** from any written unit (decided: Learn stays open to everyone),
    whose unit files `desk.js` loads on demand.

  Each question gets one answer. **Pay is per right answer** (`DESK_PAY` by difficulty, Learn
  questions as 1: ¤40–¤100), and a job with every answer right is boosted (×1.25 for 2, ×1.5 for 3);
  1 reputation per right answer. Answers are saved as they're given, so a reload carries on rather
  than retrying. Questions asked lately (`seen`) and ones in other waiting jobs are kept out of new
  jobs. Desk pay shrinks by business stage, as before. The Director card reads "Taking desk jobs".
  Before this the desk was today's daily puzzle (¤2 per puzzle XP, a streak bonus, the `paid`
  ledger, which old saves drop), and before that an unlimited set of desk contracts; a lone grad
  on a hotfix still pays for itself.
- **The intern** (the player-owner's idea, September 2026, after a playtest where a lone grad lost
  money; `ROLES.Intern`, `INTERN_DAYS`, `evaluateInternTeam()`, `moveInterns()`): every company
  starts with one (older saves get one once, `state.internGiven`). Free (no salary), 0.2 SLOC/min
  (3 until item 4c, so a hotfix takes them about 25 minutes),
  65% reliability, and only on hotfixes, which they take **with the Director as a second person**
  (so one intern job at a time), in a language the intern knows or the Director is comfortable in
  (`directorKnows()`: Python always, which was the player-owner's open question and is a
  placeholder, plus any language with daily-puzzle XP). No desk, not in the headcount, the
  supervision structure, notices or odd jobs, and never auto-staffed by managers. "Suggest a team"
  picks the pair when nobody else can take a hotfix; the guide's first step is now staffing them.
  After 7 days (company time) they finish their hotfix (and its review), leave, and apply as a
  **graduate** for half a graduate's hire cost (`INTERN_OFFER`), keeping their XP, whatever the
  studio's reputation.
- **The intern gets stuck** (item 4c, built; `INTERN_STUCK`, `isStuck()`, `startHelp()`,
  `finishHelp()`): the intern writes each hotfix on the clock (about 25 minutes), and can get
  stuck up to `INTERN_STUCK_MAX` (3) times: when it starts, each of 3 points, at random between 10%
  and 90% of the way, is a sticking point with `INTERN_STUCK` (50%) chance (`job.stuckPoints`,
  shares of the work, so 0–3 stops: 12.5 / 37.5 / 37.5 / 12.5%; the player-owner's call, after a
  first cut with at most one). A stuck job
  (`status: 'stuck'`, `job.left` = the time it still needs) stalls, however long the player is
  away, until **Help them** (on the job card) asks one puzzle in the hotfix's language from the
  desk's pool (`stuckQuestion()`: not asked lately or waiting in a desk job; kept in
  `job.question` so a reload asks the same one), played in the desk's player. Right: the hotfix
  jumps `INTERN_NUDGE` (25%) of its length ahead (clearing any sticking point it jumps past), and the help pays `DESK_PAY` by the puzzle's
  difficulty × the stage's desk share, and `DESK_REP`. Wrong: it loses 25% of its progress (never
  more than it had). Settled on the answer, so a reload can't retry it. Once written, an intern's
  hotfix is always delivered (no success roll), for a hotfix's usual pay and XP; `state.internDone`
  counts them. No repeats (old saves' intern jobs lose theirs). The pair can only take hotfixes in
  languages the pool has puzzles for (`hasPuzzles()`; Python for now). Decided with the
  player-owner, after a first version where every hotfix waited for a review puzzle: getting stuck
  keeps the writing time as the limit, so puzzles can't be farmed for money.
- **Founding**: a new company gets ¤250 (enough for a ¤180 grad; ¤150 until October 2026) plus a
  founder's bonus of ¤1 per puzzle XP already earned, up to ¤1,000.
- **The Director's languages are the player's puzzle levels** (read live
  from `debugg-xp`). Each level above 1 adds 1% success chance to contracts
  in that language, up to +10%, shown on the Director's card and in the
  team picker. Only languages with puzzles (Python, JavaScript) count.
- **Pause / Close**: pausing stores `pausedAt` and reloads without the
  studio; resuming shifts every clock in the save (`lastTick`, jobs,
  offers, `since`) forward by the paused time, so nothing happens while
  paused. Closing deletes `debugg-ltd`. The page's "reset puzzles" keeps
  the company.
- **Start-up**: you begin as the Director alone, and you double as the
  manager. The Director gives one slot at every level, one principal slot,
  and room for `DIRECTOR_SPAN` (4) devs, so you can hire a grad straight
  away. Growing beyond that needs real managers.
- **Tiered structure** (`capacity()` / `structureProblem()`):
  - Each dev supervises up to 3 people of the level directly below.
  - Each manager adds one slot per level, 3 principal slots, and room for
    12 devs.
  - Managers produce no SLOC.
  - Hiring, promoting and "Let go" are all blocked if they would break the
    structure, and the UI says why.
- **Hires' starting skills** (languages only):
  - Grads: one language at level 1.
  - Juniors: a language at level 1–2, sometimes a second at 1.
  - Seniors: a language at 4–5, and a second at 1–3.
  - Principals: a language at 7–8, plus two more lower down (3–5 and 1–3).
- **Promotions** need three things, and the player confirms with a
  "Promote" button:
  - **Contract time at the current level**: 12 hours for Junior, 3 days for
    Senior, 14 days for Principal. Deliberately slow (September 2026, after a playtest
    where the first promotion came an hour in): hiring at a level is the quick route,
    growing your own people the cheap one. Only time spent on contracts counts;
    time on the bench doesn't. It's credited when each contract finishes
    (`p.worked`) and resets on promotion.
  - **A skill level** in their best language: 3 for Junior, 5 for Senior, 8
    for Principal (`PROMOTION`; 1 / 3 / 5 until September 2026, when levels lost their top and
    the player-owner asked for higher barriers). Set so someone who sticks to one language gets
    there about when the contract time is up (Lv 3 after about 7 hours on hotfixes, Lv 5 about 3
    days later, Lv 8 after about 14 days on patches); spreading across languages takes longer.
  - **A free slot** at the next level.
- **Contract board**: shown as a tree like the roster, one foldable group
  per contract type (Hotfixes, Patches, Minor releases, Major releases),
  each header showing how many offers and how many are running. Folded
  groups are remembered (`collapsedTiers`). There's **always a hotfix in
  every language**: a taken or expired hotfix is replaced in the same
  language, and the board fills in any language that's missing, so a lone
  dev always has something they can take (these everyday hotfixes are never expert work), plus
  `EXPERT_HOTFIXES` (1) **expert hotfix** in any language, replaced by another expert one. The other types have 2 offers
  each, in random languages, but only once the company has **more than 10 staff**, the
  Director included (`PATCH_HEADCOUNT`, `tierLock()`); until then they show locked as
  "unlocks above 10 staff", and dropping back to 10 takes their offers off the board (running
  contracts finish; repeats stop). Each offer shows its language and SLOC
  target. Staff them via the team picker, which ticks off the
  requirements and shows success chance, payout and salary cost. It has a
  "Suggest a team" button. Each person can only be on one contract at a
  time.
  - **Skill rule**: a dev "knows the stack" for a contract if they have at
    least one bar in its language (`qualifiedFor()`; managers are exempt).
    - Solo hotfixes need someone who knows the stack.
    - On team contracts, devs who don't can join as **learners**. They
      write no code and each costs the team `LEARNER_DRAG` (10%) of its
      output in mentoring time. There must be at least one dev who knows
      the stack per learner. Learners earn XP as normal on delivery. This
      is the only way to gain a first bar in a new language.
    - The picker labels learners (and greys out non-learners on quick
      fixes), and "Suggest a team" only adds learners when short-handed.
    - A board card warns when nobody on staff knows the stack.
  - **Offer expiry**: untaken offers are replaced after `offerLife`
    minutes (3 / 15 / 45 / 120 by tier), so the board keeps turning over;
    an offer open in the picker is never swapped out.
  - **SLOC drives time**: each offer is a SLOC target, shown on the card.
    Duration is the target divided by the team's combined SLOC/min
    (managers add none), with a 5-second floor.

    Each dev's SLOC/min on a contract is boosted by skill match:
    × (1 + `SKILL_SPEED` × level / 5) in that contract's language, up to level 5 (double
    output), then +`SKILL_SPEED_BEYOND` (5%) per level after (a principal at Lv 8: 70 × 2.15
    = 150.5 SLOC/min; `speedFor()`). Success chance stops growing at level 5.

    The reference team, with no matching skills, takes the nominal time:
    - a lone grad on a hotfix: ~1 min;
    - senior + 2 grads on a patch: ~10 min;
    - principal + 4 grads on a minor release: ~30 min;
    - 2 principals + 3 seniors + 4 grads + a manager on a major release:
      ~90 min.

    More senior, bigger or better-matched teams finish sooner. The picker
    shows each person's SLOC/min on that contract, plus the team total with
    the skill-match boost and the resulting time.
  - Payout = SLOC target × `LINE_RATE` × tier multiplier. So a contract pays the same
    whoever does it; faster (more skilled) teams simply earn more per minute and pay less
    salary per contract. Skill used to raise the payout too, which squared its effect.
  - Success chance = average reliability by level, plus up to
    `SKILL_CHANCE` (+5%) scaled by the team's average bars in the
    language (a grad with 1 bar adds +1%), plus the Director's boost.
  - On delivery, everyone on the team gains the tier's XP in that
    language. XP is per minute spent on it (`xpPerMin`: 0.33 /
    0.4 / 0.45 / 0.5 by tier), independent of team speed, so skill bars
    build at roughly the pace of the contract-time promotion timers. This is the placeholder skill-gain
    mechanic; it doesn't yet model supervision.
  - **Risk** (the player-owner's idea, September 2026; `RISKS`, `offer.risk`, copied to the
    job): each offer rolls **Standard** (70%), **Risky** (22%: pay ×1.4, −15% success, failing
    costs 2× the usual reputation) or **High stakes** (8%: pay ×2, −30% success, 4× reputation).
    Success never drops below `MIN_CHANCE` (5%). A repeat keeps its contract's risk; managers
    staff any risk. Per attempt, risk is roughly break-even or better for a grad (71% × 1 vs
    41% × 2) and clearly better for strong teams, with the reputation cost as the catch. Offers,
    the picker and jobs show it ("High stakes · pays ×2 · −30% success"); older offers count as
    Standard.
  - **Expert contracts** (the player-owner's idea, September 2026; `EXPERT`, `offer.expert`,
    copied to the job): an offer can need someone on the team at a skill level in its
    language, **Lv 3** (14%, pay ×1.3), **Lv 5** (7%, ×1.6) or **Lv 8** (3%, ×2.2), rolled per
    offer on patches and up (76% need none) and always on the expert hotfix. It's a check in
    `evaluateTeam()` ("someone at Python Lv 5+ (expert)"); a solo hotfix needs its one dev at
    the level (`meetsExpert()`), and "Suggest a team" takes the best-matched qualifying dev
    first. The pay stacks with risk. A repeat keeps its contract's level; managers staff them.
    Cards show "Expert · needs Lv 5 Python · pays ×1.6", and warn when nobody on staff is at
    the level yet; jobs show a "Lv 5" tag. Older offers have none.
  - **Retry on failure**: a failed contract can be retried once, in half
    the time, for 75% of the payout. If the retry fails, the contract is
    lost. Non-repeating jobs wait in a "failed" state, with the team held,
    until the player picks Retry or Drop. Repeating jobs retry
    automatically, since it's the better deal per minute.
- **Repeat**: a job can be set to roll straight into a new contract of the
  same type with the same team when it finishes. The new contract is chosen
  so the whole team qualifies under the skill rule. This is on by default for
  hotfixes. Repeats keep chaining while the page is closed, through the last
  4 hours (the offline cap: time away beyond it is skipped, and a repeat or retry due before it
  picks up from it; until October 2026 a repeat finished before the cap stopped, so an overnight
  company paid 4 hours' salary for no work), and stop if the team no longer meets the
  requirements.
- **Roster UI**: the Director card, then a collapsible tree grouped by
  level. Each group header shows its headcount, how many are busy, SLOC/min
  and salary/min. Collapse state persists. Clicking a card opens the
  employee panel: every language as a level ("Lv 6", with no top; the best in amber) and a bar
  of XP towards the next level ("2600/3400 xp"), current assignment, and a promotion checklist.
  Roster cards show a dev's two best languages ("Python Lv 6 · Rust Lv 2"). Skill levels were
  five pips until September 2026 (the player-owner's call); levels 1–5 need the same XP as the
  five pips did, so nothing changed for existing staff, and levels above 5 don't yet add speed or
  success (`SKILL_FULL`).
- **Payroll** is drawn every second, including offline (capped at 4 hours).
  Cash can go negative.
- **Odd jobs** (the player-owner's call, September 2026): developers on no contract earn their
  salary plus `BENCH_MARGIN` (5%), netted against payroll every second (and offline, by who was
  busy at the start), so a benched team grows the company slowly: a grad ¤2.10 vs ¤2/min, a
  senior ¤12.60 vs ¤12. No XP or promotion time, so contracts stay far better. Managers earn
  none. Cards read "On the bench · odd jobs · +¤0.1/min". **Only the bench earns it**
  (`onBench()`): anyone doing something else earns none, whether on a contract (including a failed
  one waiting for Retry or Drop) or away. Anything that takes someone away (training, holiday, off
  sick, events) must set `p.away = { kind, until }`, which `onBench()` already respects.
- **Business stages** (`STAGES`, `stageIndex()`, shown in a stage bar above the stats, with a
  step track and what the next stage needs): **Start-up** (no managers), **Small business** (1
  manager), **Mid-size company** (3 managers, 25 staff), **Large company** (6, 60),
  **Multinational** (12, 150); headcount includes the Director. Decided with the player-owner:
  a start-up is run by hand and lives on the daily puzzle; from a small business on,
  **managers staff idle developers** (`managersStaff()`, every tick and on load: the biggest
  team contracts a free team can take, by "Suggest a team", then hotfixes; all on repeat, and
  never the offer open in the picker), and **desk pay shrinks** by stage (`desk`: 100%, 50%,
  25%, 10%, 5%; reputation from puzzles doesn't). A change of stage is logged, announced and
  tracked (`ltd/stage/<key>`); `state.stage` remembers the last one. Managers are in the demo
  (they were locked until September 2026), so a demo company can become a small business. This is the
  start of item 13.
- **First steps and warnings** (`guideStep()`, `renderGuide()`): a "Next step" card at the
  top of the Studio panel walks a new company through putting the intern on the Python hotfix with
  the Director, helping them when they're stuck, a desk job, earning the 5
  reputation graduates need and hiring one who applies, and putting them on a hotfix
  they can take (the button pulses, `.guide-target`) with repeat on.
  It ends (`state.guideDone`) once those are done, or when dismissed. After that, notes stay:
  devs on the bench doing odd jobs (which barely cover their salary; a contract earns far more),
  and cash below zero. The welcome message can be dismissed. Added after a playtest where an unstaffed
  grad left the company ¤315 in debt three hours in.
- **Slot counts** explain themselves: when a level is full but there's room for more devs, a
  note under the counts says why (everyone needs someone a level up) and what makes room. Hire
  buttons say e.g. "grads full — a junior makes room for 3 more".
- **The board folds offers nobody can take**: offers in languages nobody on staff knows sit
  behind a "Show 3 in languages nobody on staff knows" toggle (`state.showUnknownOffers`), unless
  nobody's been hired yet.
- **Applicants** (`moveApplicants()`, `state.applicants`, `state.nextApplicantAt`): only
  managers have a hire button. Developers *apply*, graduates included since item 4d: one
  every 8–24 hours, at most 3 waiting, each asking the
  market price × 0.9–1.2, with the offer open for 12 hours ("took a job elsewhere" after).
  Reputation decides who applies (`APPLICANT_REP`): nobody below 5 (`nextApplicantAt` is 0
  meanwhile), then graduates and juniors, seniors from 500, principals from 5,000, weighted
  10 : 6 : 3 : 1 among those open; the first comes within `FIRST_APPLICANT_H` (1) of anyone being
  able to. A competition move on a
  level also hires away a waiting applicant at it. Arrivals and expiries happen while the
  page is closed (not while paused). Decided with the player-owner: promotion is the steady,
  cheap way to grow seniority; applicants are the pricey chance to get ahead. This is
  reputation's first use (item 12).
- **The hiring market** (`moveMarket()`): hire costs only go up. Every 12–36 hours (at
  random), either inflation raises every role's cost by 2–4%, or a rival studio competing
  for one level raises that one by 6–15%. Each move is logged, and hire buttons show the
  rise since founding ("¤270 ↑50%"). Moves happen while the page is closed (not while
  paused), and are kept in `state.market`.
- **The office** (phase 1 of item 15e, September 2026; `SPARE_ROOM_DESKS`, `COWORK_*`,
  `state.office`): everyone on staff needs a desk, except the Director, who works from home at
  their own desk jobs. The spare room has 4 desks, free, matching the Director's span of 4 devs, so
  the first manager needs the first **co-working desk**: ¤1/min each (`COWORK_RATE`), up to 8
  (`COWORK_MAX`, so 12 staff and the Director, enough for patches), rented and given up from the
  **Office** line in the Studio panel (a desk can only be given up while one is free). Rent is
  drawn with payroll every second (`paySalaries()`), offline too, not while paused; the stats bar
  then reads "Payroll + rent". The structure line shows "Desks 5/6". Saves from before desks get
  co-working desks for everyone they have. Business units, WFH applicants and bigger premises are
  the next phases.
- **A cramped office** (the player-owner's call, September 2026; `CRAM_MAX`, `CRAMPED`,
  `cramLevel()`): a full office is cramped, and up to 2 more people can be squeezed in without
  desks. Everyone writes 5% less code with every desk taken, 15% with one squeezed in and 30% with
  two (applied in `devSlocOn()`, so to contracts started while it's cramped), and notices are
  likelier. Past that, `deskProblem()` blocks hiring ("no room to squeeze anyone else in"); hire
  buttons and applicants warn first ("no desk: squeezed in, everyone −15% speed"), and the Office
  line says how cramped it is. A co-working desk can be given up as long as nobody more than
  `CRAM_MAX` ends up without one.
- **Notice** (the player-owner's idea, September 2026; `moveNotices()`, `p.notice = { reason,
  until, ask }`): every hour (`state.nextNoticeAt`) each person but the Director hands in their
  notice with `NOTICE_PER_DAY` (1.5%) / 24 chance, × `NOTICE_CRAMPED` (1, 3, 5, 7 by cramp
  level); a cramped office gives the reason "the office is too cramped", otherwise "has a better
  offer". They stay `NOTICE_H` (24) hours, then leave once off any running contract (a repeat
  stops for them; a failed contract loses them). Turned around by a free desk (cramped notices
  are withdrawn) or by the **Keep** button on their card, a pay rise of `ask` ¤/min (15–35% of
  their level's salary, `RAISE`), kept in `p.raise`; `salaryOf(p)` is their pay everywhere. A
  "handed in their notice" alert shows in the Studio panel. Only the last 4 hours roll while the
  page is closed; paused time doesn't count. Leaving can break the supervision structure, which
  then blocks hiring until it's fixed.
- **The office view** (item 21b, step 1 of `ideas/ltd-office-view-plan.md`, October 2026;
  `ltd/office.js`, `officeSnapshot()`, `officeApi`, `renderOffice()`): the studio drawn on a canvas
  in its own slot above the desk and the studio (`#ltdOffice`), as the spare room: a house with the
  front door, the interview room (a chair per `MAX_APPLICANTS`, applicants in grey holding a CV in
  their level's colour), the Director's own table (the kiwi, with the intern beside it; not a
  counted desk), the 4 desks, the co-working desks in a tinted corner, stools for anyone squeezed
  in, the meeting room (managers on a contract stand there) and the kitchen, the break room. Every
  floor gets a meeting room and a break room (the player-owner's call, October 2026). **Breaks are
  only a picture** (also theirs): the view picks who's on one from a hash of their id and the
  10-minute window of game time (`BREAK_ODDS`, `BREAK_MS`: about 12% of the time; contract and
  bench only), so nothing in `ltd.js` or the save changes and nobody's work slows; their monitor
  shows the work carrying on. Tests fix the list with `window.DEBUGG_OFFICE_BREAKS`. Monitors show the job: code in its language's colours with its progress, a
  flashing "?" when stuck, ✗ when failed, a manager's board of cards, a screensaver on the bench; a
  note on the chair when away. The view hands out desk numbers itself (lowest free, kept while the
  page is open; nothing in the save), and people walk to wherever the snapshot puts them. Taps do
  what a panel button does: a person opens their panel, an applicant's card scrolls into view and
  flashes (hiring stays a button), a stuck intern opens Help, the kiwi scrolls to the desk. The
  canvas is `role="img"` with an `aria-label` summary. Shown by default; **Hide the office** sets
  `state.showOffice = false`. Nothing is drawn while the tab is hidden; reduced motion stops the
  walking and flashing. `ltd.js` works without the script or the slot (the simulator has neither).

## Known gaps — not wired in yet

- **Reputation only decides which applicants turn up** (roadmap item 12 has more for it).
- **Skill gain is a placeholder**: a flat XP rate with no supervision
  effect (item 22).
- **No training spend, studio upgrades, or prestige** (items 14, 15, 19).
- **Balance is untuned** (item 10).

