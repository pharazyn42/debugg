# Debuggit Ltd: the office view

A plan for drawing the studio as an office building from the very start of Debuggit Ltd: a side-on
cut-away with one floor per storey, a desk per desk the company has, and the people at them. It
builds roadmap item 21b (the agent office) as the graphics version of the studio (item 21), and
grows with the premises of item 15e. Written October 2026 so another chat can pick it up; read
`ltd/CLAUDE.md` first for how the studio works now.

**Status:** agreed with the player-owner in outline (floors, an interview room, breaks); not
started. Decisions still to take are under "Decide first" and "Open questions".

## Where it comes from

- **Agent HQ** (claude-pet, the player-owner's other project): `pharazyn42/claude`, branch
  `claude/creature-animation-ideas-o53x86`, `web/office.js` and `web/creature.js`. A canvas
  office building of real Claude Code agents: a floor per team, a lift, desks with monitors that
  show what each agent is doing, a break room, arrivals by lift. No dependencies.
- **The prototype for this plan:** `ideas/ltd-office-demo.html`, a standalone page (open it in a
  browser; it needs nothing else). It fakes the game with its own fast simulation, but the
  drawing code (`layout()`, `drawShell()`, `drawFloor()`, `drawDesk()`, `screen()`,
  `drawPerson()`, `kiwi()`, `drawLeftRoom()`, `drawKitchen()`, the bubbles and particles) is meant
  to be lifted into the game. Try every premises, "Fill desks", tap applicants, tap a stuck grad.

## What the player-owner asked for

1. **The office from the start**, as a view of the floors like Agent HQ's.
2. **The first office has one floor; bigger offices have more floors, and more desks per floor.**
3. **An interview room** where applicants come, sit and wait.
4. **A break room** that employees go to sometimes, and **a break stops their work** while they're
   away.

## The premises ladder

Each premises is its own building. The prototype's numbers (desks per floor never shrink, floors
grow, so every move reads as a bigger building):

| Premises | Building | Floors × desks | Desks | In `company-growth-roadmap.md` | Cost (placeholder) |
|---|---|---|---|---|---|
| Spare room (now) | A house: pitched roof, chimney, front door | 1 × 4 | 4 (+ co-working) | 4 | free |
| Small business unit | A clad unit with stairs | 2 × 5 | 10 | 8 | ¤4/min |
| Large business unit | A clad unit with stairs | 3 × 6 | 18 | 16 | ¤8/min |
| Office floors | A tower with a lift | 4 × 10 | 40 | 40 | ¤16/min |
| Office building (bought) | A tower with a lift | 8 × 15 | 120 | 120 | ¤6/min upkeep |

- **Changed from the growth plan:** the two business units go from 8 to 10 desks and 16 to 18,
  so a floor never has fewer desks than the one before. Confirm with the player-owner before
  building 15e phase 2, then update `company-growth-roadmap.md` to match.
- **Only the spare room exists in the game today** (15e phase 1: `SPARE_ROOM_DESKS` 4 plus up to
  `COWORK_MAX` 8 co-working desks, `CRAM_MAX` 2 squeezed in). Phase 1 of this plan draws exactly
  that. The other buildings come with 15e phase 2 (business units) and later.
- **Co-working desks** are drawn on the spare room's floor, in a tinted "co-working · rented"
  corner between the home desks and the kitchen, as plain white hot desks. The prototype allows 6;
  the game allows 8.
- **Squeezed in** (a cramped office): the up-to-2 people without a desk sit on stools at the end
  of the last desk, so a cramped office looks cramped.

## The rooms on each floor

Left to right on every floor: the way in (front door, stairs or lift), a side room, the desks,
then the break room. None of the rooms take desks.

- **Interview room** (ground floor, by the way in): a row of waiting chairs, one per applicant
  slot (`MAX_APPLICANTS` = 3 in the game), a plant and a framed kiwi. Each of
  `state.applicants` sits in a chair in grey, holding a CV in their level's colour. When an
  application expires they get up and leave; when hired they walk to their new desk (by the
  stairs or lift if it's upstairs).
- **Break room** (every floor; the spare room's is its kitchen): a coffee machine, a window and a
  couch. People on a break go there (the couch first, then the coffee machine, then standing).
- **Meeting room** (every floor above the ground; Claude's addition, not asked for, so confirm or
  drop): a whiteboard and a table. Managers on a contract stand there, since they write no code.
- **The bench is not a room.** Someone with no contract (on the bench, doing odd jobs) sits at
  their own desk with a screensaver.

## How the drawing maps to the game

Everything is drawn from the save (`state` in `ltd/ltd.js`); the view never changes the game
except through the actions the panels already have.

| In the game | In the office |
|---|---|
| `deskCount()`, `coworkDesks()`, `desksUsed()`, `cramLevel()` | The desks, the co-working corner, free desks labelled "free", stools when squeezed in |
| The Director (`roster[0]`) | The kiwi, at their own desk that isn't one of the staff's (see "Decide first") |
| The intern (`isIntern()`) | Beside the Director: they work as a pair and take no desk |
| A person on a running job | At their desk; the monitor types code in the job's language, with a progress bar from `startedAt`/`endsAt` |
| A stuck intern job (`isStuck()`) | The intern's monitor flashes "?"; tapping them does what the job card's **Help them** does (`startHelp()`) |
| A failed job waiting for Retry or Drop | The monitor shows ✗ until it's resolved |
| A delivered job | ✓ and confetti, a bubble with the pay (only when it happens while watching) |
| On the bench (`onBench()`) | At their desk, screensaver; the bubble says "odd jobs" |
| Away (`p.away`: training, holiday, sick) | Their desk empty, with a note on the chair ("on holiday") |
| On notice (`p.notice`) | A packing box on their desk |
| `state.applicants` | The interview room's chairs |
| A hire, a leaver | Walks in by the door, stairs or lift, or out the same way |
| Managers on a contract | The meeting room (upper floors) or their desk |
| Paused (`pausedAt`) | The lights are off and nobody moves |
| Cash, rent | Not drawn: the stats bar already has them |

**Who sits where.** The game has no desk numbers, so the view assigns them: staff (everyone but
the Director and the intern) in roster order, filling the ground floor first. To stop people
swapping desks when someone leaves, the view remembers its assignments while the page is open and
gives a newcomer the lowest free desk. Nothing about desks goes in the save (keep it that way
unless a later feature needs it).

## Decide first (with the player-owner)

1. **How breaks cost work.** The player-owner wants a break to stop a person's work. The game
   works out a contract's end time when it starts (SLOC target ÷ the team's SLOC/min), and
   simulates offline time, so per-person breaks that move `endsAt` would make offline progress and
   the drawing disagree. Two ways:
   - **Recommended: an average.** Everyone spends a set share of contract time on breaks
     (`BREAK_SHARE`, say 5%), applied in `devSlocOn()` like `crampedPenalty()`. The view then
     shows breaks at that rate, chosen deterministically from a hash of the person's id and the
     current 10-minute window, so the same people are on a break after a reload and the picture
     matches the maths. Offline needs nothing new. The balance pass (item 10) and
     `npm run sim` absorb the 5%. Later, break-room upgrades (15e "quality") could shorten breaks.
   - **Or real breaks:** each person's break pushes their job's `endsAt` and shows in the job
     card. Truer, but a lot more code (offline, teams, repeats) for little gain.
   - Or breaks are only a picture and cost nothing (not what was asked).
2. **Where the Director sits.** The game says the Director works from home, at their own desk, and
   takes no staff desk. Proposed: in the spare room (which is home) the kiwi has the kitchen table,
   an extra desk by the front door that isn't counted; in bigger premises, a corner office on the
   top floor. The prototype gives the Director desk 0, which the game must not do.
3. **The meeting room** (keep or drop), and **the desk numbers** in the table above.
4. **Shown by default, or a toggle.** Proposed: shown, with a "Hide the office" button whose
   setting goes in the save (`state.showOffice`).

## How to build it

### Files

- **`ltd/office.js`** (new): the renderer, a port of the prototype's drawing code into one object,
  `window.DebuggOffice = { mount(el, api), unmount() }`. No game rules in it.
- **`ltd/ltd.js`**: gives the view a read-only `api`, and fires events. Must work with no
  `DebuggOffice` loaded (`tools/sim-ltd.js` runs `ltd.js` headless with a stand-in page), so every
  call is guarded.
- **`ltd/ltd.css`**: the view's box, its toggle and the text summary, scoped under `.ltd` like the
  rest.
- **`index.html`**: a new slot, `<div id="ltdOffice" hidden></div>`, above `#ltdStudio`, hidden
  unless `body.ltd-on` (like the other four slots); the loader loads `ltd/office.js` with
  `ltd/desk.js` and passes `office: $('ltdOffice')` to `DebuggLtd.start()`. On a branch whose
  other files are all Ltd's, `index.html` counts as Ltd's, so the scope check passes.

### The api ltd.js passes in

```js
api = {
  snapshot(),        // { now, paused, premises: { kind, floors, perFloor, cowork, cramped },
                     //   director, intern, staff: [{ id, name, role, state, job, notice, away }],
                     //   applicants: [{ id, role, expiresAt }] }, built from `state` each call
  onTap(kind, id),   // 'applicant' → scroll to and highlight its card in the Studio panel (hiring
                     // costs money, so the existing hire-applicant button stays the way to hire);
                     // 'stuck' → startHelp(jobId); 'person' → open the employee panel
}
// ltd.js tells the view what just happened, beside the addLog() calls that already exist:
DebuggOffice.event({ kind: 'delivered' | 'failed' | 'hired' | 'left', ids, pay })
```

`job` in the snapshot is `{ id, tier, lang, progress (0–1), status }`, with `progress` from
`startedAt`/`endsAt` (or `job.left` while stuck).

### The drawing loop

- Its own `requestAnimationFrame` loop, reading `api.snapshot()` each frame (cheap: the roster is
  small). The game's 1-second `setInterval` keeps re-rendering the HTML panels as now.
- Stop drawing when the tab is hidden (`document.hidden`), the view is toggled off, or the company
  is paused (draw one still frame).
- Coming back from offline time: draw the end state, no catch-up animation. Events only animate
  while the page is open.
- Theme: read colours from CSS custom properties, as the prototype does (`readTheme()`), with
  light-theme values ready for item 10b.
- `prefers-reduced-motion`: people jump to their spots, no confetti or floating SLOC.
- Size: the building's width follows the widest floor; on a phone it scales down to a minimum and
  then scrolls sideways inside its box (`overflow-x: auto`), never the page.

### Accessibility

The canvas is a picture (`role="img"`, an `aria-label` summary like "Spare room: 4 of 6 desks
taken, 3 working, 1 on a break, 2 applicants waiting"). Everything it shows is already in the text
panels, which stay as they are, so the game still plays with a screen reader and on a phone. Tap
targets on the canvas are a convenience, never the only way to do something.

## Steps (one PR each, all Ltd scope)

Each PR adds a line for players under `## Unreleased` in `ltd/CHANGELOG.md`, updates
`ltd/CLAUDE.md` ("What's implemented") and this file's status, and adds tests to
`tests/ltd.spec.js`.

1. **The spare room, drawn.** `ltd/office.js` with the house, its 4 desks, the co-working corner,
   stools when squeezed in, the kitchen (break room), the interview room with
   `state.applicants`, the Director and the intern, and each person's monitor (working with a
   progress bar, bench screensaver, stuck "?", failed ✗). The slot, loader change, toggle and
   `aria-label` summary. Tap: applicant, stuck intern, person.
   Tests: the canvas appears on the Ltd tab and not on the Daily tab; its `aria-label` counts
   match a seeded save (desks, applicants, working); the toggle hides it and survives a reload;
   `npm run sim` still runs.
2. **Things happening.** `DebuggOffice.event()` from `ltd.js`: hires walk from the interview room
   to their desk, leavers walk out, applicants leave when their offer expires, ✓ and confetti with
   the pay on delivery, smoke on failure, floating SLOC while writing (item 20), the packing box on
   notice, the empty chair when away.
3. **Breaks**, once "Decide first" 1 is settled: `BREAK_SHARE` in `devSlocOn()` (if chosen), the
   deterministic who-is-on-a-break, people walking to and from the break room, the paused
   monitor, "on a break" in the summary. Rerun `npm run sim` and note the change in
   `ideas/ltd-pacing-targets.md` terms.
4. **Bigger buildings**, with 15e phase 2 (business units) and after: floors, the stairs and the
   lift, meeting rooms, moving day (everyone walks out of the old building and into the new one),
   rooftop signs. The prototype has all of it.
5. **Later:** a floor per team once managers lead teams; an AI floor with no desks (item 17f); a
   campus of buildings (item 18).

## Open questions

- Which way the phone view goes for tall buildings: the whole building scaled down, or one floor
  at a time with floor buttons.
- Whether the interview room's chairs should grow with premises (the game has 3 applicant slots
  at every stage today).
- Whether people ever visit other floors (a manager walking round their teams, say), or stay on
  their own.
- Names on the floor slab get cut short when a floor is full; is a tap enough to see who's who?
- Sound: none planned.
