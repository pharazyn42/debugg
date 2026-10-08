# AI agents: the build plan (roadmap item 17f)

> **Status: a plan to agree with the player-owner** (October 2026), who asked for "the Agent
> office". It builds roadmap item 17f as decided there; read 17f in `ideas/roadmap.md` for the
> *why*. The numbers are a starting point for the balance pass, not tuned. Function and constant
> names refer to `ltd/ltd.js` as of Ltd 0.0.16.

## 1. What the player gets

An **AI** line in the Studio panel, under the Office line: the studio's licences, each running a
model, busy or idle, and what they cost a minute. You buy a licence, pick a model for it, and
then put it on a contract in the team picker alongside a developer who looks after it. The
licence writes code like several people would, needs no desk, earns no XP, and costs a fee every
minute like payroll. New models are announced in the news a few days before they arrive, each
faster, more accurate, acting as more people and costing more than the last.

## 2. Decisions this plan takes as given (from 17f)

- A licence runs **one model** and works **one contract at a time**.
- A contract with a licence needs **a supervising dev on the team**, at the level of the most
  senior dev the contract requires (any level on a hotfix, a senior on a patch, a principal on a
  minor or major release) and **knowing its language** to the level it needs (expert included).
- A model **acts as a number of people** (2 on the first, up to 10), which counts towards the
  contract's team size. Real people on top still raise the success chance.
- Models arrive **slowly** and must be **bought**; older ones stay on sale. A licence's model can
  be dropped any time it isn't on a contract, with no refund; that stops its fee.
- From a **small business** on, **managers** staff contracts with licences too.
- Agents need **no desks**, are never promoted, and run offline like repeats.
- **Made-up model names**, never real ones (this plan uses NZ birds, to sit beside the kiwi).

## 3. How it fits the code

### State (one new key, plus a field on jobs)

```js
state.ai = {
  licences: [ { id: 'ai…', model: 'kea' | null, since } ],   // model null = bought but empty
  arrived: ['kea'],                                           // models on sale now
  nextAt,                                                     // when the next model arrives
  announced                                                   // the model the news has announced
}
job.agents = ['ai…']                                          // licences on this contract
```

Licences stay **out of `state.roster`**. Putting them in would mean excluding them from payroll,
desks, headcount, the supervision structure, notice, promotion, bench income and the stage
headcount, one by one, as interns already are (`isIntern` checks). A separate list keeps every
one of those untouched. A boot guard adds `state.ai` to old saves (`if(!state.ai) …`, beside the
other guards), and `skipTime()` shifts `state.ai.nextAt` so a paused company doesn't miss or
gain models.

### The model table

```js
const AI_MODELS = [   // acts as, SLOC/min, reliability, price to buy, ¤/min, arrives (company days)
  { key: 'kea',     name: 'Kea 1',     actsAs: 2,  sloc: 3,   reliability: 0.50, cost: 500,     fee: 1,   day: 0  },
  { key: 'tui',     name: 'Tūī 2',     actsAs: 3,  sloc: 10,  reliability: 0.60, cost: 2000,    fee: 3,   day: 4  },
  { key: 'kereru',  name: 'Kererū 3',  actsAs: 4,  sloc: 25,  reliability: 0.70, cost: 8000,    fee: 8,   day: 10 },
  { key: 'karearea',name: 'Kārearea 4',actsAs: 6,  sloc: 60,  reliability: 0.80, cost: 30000,   fee: 25,  day: 18 },
  { key: 'kakapo',  name: 'Kākāpō 5',  actsAs: 8,  sloc: 120, reliability: 0.88, cost: 100000,  fee: 70,  day: 30 },
  { key: 'moa',     name: 'Moa 6',     actsAs: 10, sloc: 250, reliability: 0.93, cost: 300000,  fee: 180, day: 45 }
];
const AI_LICENCE_COST = 250;   // a licence slot itself, before any model
```

For scale: a graduate writes 5 SLOC/min for ¤2/min, a principal 70 for ¤28/min, and a
major-release team of 10 roughly 280 for ¤120/min. So Kea 1 is a weak, cheap helper, and Moa 6
writes about what a full major-release team does for more than that team costs.

### Systems it touches, in `ltd/ltd.js`

| System | Change |
|---|---|
| `evaluateTeam()` | Takes the licences as well as the people. Size counts people + `actsAs`. A new check: "supervised by a senior+ who knows Python" (the tier's top level, `meetsExpert` for expert offers). With a licence on the team, the tier's role seats (`needs`) are met by the supervisor alone; see question 4. SLOC adds the model's `sloc`, unaffected by skill or a cramped office. Chance: the people's and the model's reliability averaged, the model weighted by `actsAs`, plus `AI_TEAM_BONUS` per real person beyond the supervisor (by tier). The result gains `agentNote` for the picker. |
| `startJob()`, `newJob()` | Take licence ids; store `job.agents`. A licence must be free and have a model. |
| `busyIds()` / a new `busyLicences()` | Which licences are on a contract. |
| `settleJob()` | Unchanged for people (the supervisor earns XP and contract time); nothing for licences. |
| `restartJob()` | Repeats keep their licences; the repeat stops if a licence was emptied or its model changed (it can't be while running, so only through an old save). |
| `paySalaries()` | Adds `aiFeesPerMinute()` beside `rentPerMinute()`, offline too, not while paused. |
| `renderStats()` | The payroll figure includes fees: "Payroll + rent + AI", with the split in its title. |
| `managersStaff()` | From a small business: after placing people as now, each idle licence goes with a free supervisor on the biggest offer the pair can take; see question 6. |
| `suggestTeam()`, `renderPicker()` | Licences listed below people, as rows to tick. The forecast reads "Tūī 2 (acts as 3) · supervised by Grace (senior) · −12% success". |
| `renderJobs()` | A licence's model name on the job's team line. |
| `renderStudio()` | The new AI line and its panel: buy a licence, set or drop a model, the next model's news. |
| `addLog()`, `showToast()` | The news: "Tūī 2 arrives in 2 days: acts as 3, 10 SLOC/min, 60% success, ¤2,000, ¤3/min." and "Tūī 2 is out." |
| Tick | `moveAi(now)`: announce the next model `AI_NEWS_DAYS` (2) before it arrives, then add it to `arrived`. |

Outside `ltd.js`: `tools/sim-ltd.js` learns to buy licences and models (a keen player buys
each model it can afford within a day of arrival); `ideas/ltd-pacing-targets.md` gets AI
milestones; `tests/ltd.spec.js` gets tests for each step; `ltd/CLAUDE.md`'s data model and
"What's implemented" are kept in step; `ltd/CHANGELOG.md` gets player notes. All of it is Ltd's
scope, so each step is one Ltd PR.

## 4. Steps, in order

Each step is a PR that ships on its own, behind `AI_ON` (false) until step 5.

1. **Licences and models, no contracts yet.** `state.ai`, the boot guard, `AI_MODELS`, buying a
   licence, setting and dropping a model, the fee in payroll and the stats bar, the AI line in
   the Studio panel. Tests: buying charges cash, the fee is drawn per minute and offline, dropping
   stops it.
2. **Agents on contracts.** `evaluateTeam()`, `startJob()`, the picker rows and forecast,
   `restartJob()` for repeats, the job line. Tests: a supervisor of the wrong level or language
   fails the check; "1 senior + Kea 1" takes a patch; a licence can't be on two contracts; a
   repeat keeps its licence offline.
3. **Model arrivals and the news.** `moveAi()`, the arrival schedule from the company's start,
   the news log line and toast, the "next model" line. Tests with the clock moved on.
4. **Managers use licences.** The `managersStaff()` change. Tests: a small business with an idle
   licence and a free senior gets a patch started.
5. **Balance and switch on.** Run `npm run sim` with and without agents, set the numbers against
   the pacing targets, decide when the feature opens (question 7), set `AI_ON`, and note it in
   `ltd/CHANGELOG.md`.

Later, with the items they need: agents raising Tech Debt or Merge Conflicts on early models
(17b, 17c), "the AI service is down" (17d), and the news growing into a wider feed (15b).

## 5. Open questions

1. **What "the Agent office" means.** This plan reads it as 17f. If it means agents also need a
   place to run (a server room that caps licences, rented like co-working desks), that's an
   extra step after 1, using the same pattern as `state.office`.
2. **Several licences on one contract?** Default: **one**, so the picker and checks stay simple.
   More would let a late studio staff a major release with a supervisor and two licences.
3. **Can one dev look after licences on two contracts at once?** Default: **no**. The supervisor
   is on the contract like any teammate, so they're on one contract at a time.
4. **Do agents fill role seats?** A major release needs a manager, 2 principals and 3 seniors.
   17f says one supervisor plus agents can take a big contract, so the default is that a
   licence waives the seats and only the supervisor's level counts. Should a major still need
   a manager?
5. **Hotfixes take one person.** Default: a licence on a hotfix ignores the size limit and just
   adds speed and risk, so a cheap old model on hotfixes (17f's example) works.
6. **Managers: people first, or licences first?** Default: people first, as now, then idle
   licences with whoever's left. Licences first would save salaries but leave devs on the bench.
7. **When it opens.** 17f puts it in Phase 4, with a weak early model "sooner as a taste".
   Default: the first model arrives when the company becomes a small business, and later ones
   follow on the schedule from there. Not in the demo, whose contracts stop at patches; or a
   taste of Kea 1 there?
8. **Company days or calendar days** for arrivals? Default: calendar days since the first model,
   minus time paused (what `skipTime()` already gives).
9. **A licence price as well as a model price?** Default: yes, a small one, so each extra
   licence is a decision; or licences free and only models cost.
