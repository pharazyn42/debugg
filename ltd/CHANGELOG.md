# What's new in Debuggit Ltd

Debuggit Ltd has its own version numbers, separate from [the daily puzzle](whatsnew.html) and
[Debuggit Learn](whatsnew.html?learn). Until 0.0.4 it shared them with the daily puzzle, so its
list starts there.

Versions go 0.0.1, 0.0.2… through the demo. 0.1.0 is the launch, which clears demo progress, your
company included (you've been warned since your first visit). After that, the middle number goes up
for new things to play and the last one for fixes and balance changes.

## Unreleased

- **A notifications bar and speech bubbles.** When someone hands in their notice, a bar at the top of the contract board says who, why and how long they have left, with a **Keep** button and their name opening their panel. In the office they get a speech bubble over their head saying the same ("I've had a better offer…", "Too cramped here…"). The company being in debt shows in the bar too. The bar sits apart from the Recent list of results.
- **A clearer Studio box.** It's named after your company, and a new **Premises** list shows each place you can work from: what it is, its desks and floors, what it adds, what it costs to rent or buy, and which one you're in ("You are here"). The next-step guide and the headcount by type stay.
- **People live in the office picture.** The Director card and the staff list are gone: click anyone in the office, you included, to open their panel with their skills, what they're doing, promotion, Keep and Let go (and for you, your languages, your desk, and editing your name and look). There's still a plain list of names under "Everyone in the studio" for keyboards and screen readers. The office is always shown now, so there's nothing to hide.
- **SLOC/min in the stats bar.** A new cell between Cash and Reputation shows how many lines of code your company writes per minute, on contracts and everyday work together.
- **Screens pause on a break.** In the office view, when someone heads off for a break their monitor freezes (the code stops typing, the ticket queue stops ticking) until they're back at their desk.
- **More room to squeeze people in.** Once every desk is taken, an office takes up to half as many people again without desks (2 in the spare room, 5 in a small business unit). A full office no longer slows anyone down; each person squeezed in makes everyone 6% slower. In the office you'll see them sharing the end of someone's desk, at the meeting-room table, on the kitchen couch, on the stairs or on the floor with a laptop.
- **Working from home.** In the spare room you can hire an applicant to work from home: they need no desk, but are 80% as productive, on contracts and everyday work alike. Once you've moved out, they come into the office as desks free up. In the office view they're video-call tiles: their face from their webcam, or an empty chair while they're on a break. Now and then they're working from somewhere nicer: a beach, the ski slopes, a city at sunset, a lake or a tropical island.
- **Managers need an office**: you can only hire one once you've left the spare room.
- **A new start to the studio.** Your staff now earn their keep with **everyday work**, support tickets and bug fixes, worth about 1.35× their salary (a little more or less per person). **Contracts are events**: none until your spare room is full, starting with **your first client**, a feature for your whole team at double pay. After that, **features** (a new kind of contract, for 1–3 developers) turn up every hour or two and stay open for 6 hours. Contracts pay far more than everyday work, but nobody on one does everyday work meanwhile. Until you have a manager, nothing repeats or retries, and your junior team gets stuck now and then: the contract goes at half speed until you help with a puzzle. Hotfixes are your intern's alone. Odd jobs on the bench are gone.
- **Name your company, and yourself.** Starting a company now asks for its name, your name as its Director, and how you look in the office: skin, hair colour and style, facial hair, glasses and clothes, or **Surprise me**. **Edit** on your card changes any of it later. The company's name goes up on the office's sign.
- **You take one of the office's desks now**, so the spare room holds you and 3 others. Your intern works beside you. If your company was already running, it'll be one desk tighter.
- **Co-working desks are gone. Once the spare room is full, you can rent or buy a small business unit**: 10 desks on two floors. Renting costs ¤4 a minute. Buying costs ¤60,000 up front, then ¤1 a minute upkeep, and moving out sells it for ¤54,000. You can buy the unit you rent at any time, or move back to the spare room if everyone fits. If you had co-working desks, everyone who sat at one is squeezed into the spare room, and nobody new fits until you move.
- **Your studio is drawn as an office**, above your desk: your premises as a building, with everyone at their desk and their monitor showing what they're on (code typing in with the contract's progress, a flashing "?" when your intern is stuck, ✗ for a failed contract, a screensaver on the bench), stools when it's cramped, applicants waiting in the interview room, and people on a break with a coffee or on the kitchen couch (breaks are only for show: nobody's work slows). A small business unit has two floors, each with a meeting room, where managers on a contract go, and a kitchen, and a server room upstairs. Tap someone to see their details, an applicant to find their card, or a stuck intern to help them. **Hide the office** tucks it away, and it stays hidden until you show it again. Everything it shows is still in the panels.

## 0.0.16 — 5 October 2026

- **The title is back at the top of the page**: `debuggit.ltd()`, beside the kiwi, the same as the button above it.
- A desk job's long lines of code scroll sideways right to the end, and a line you pick is outlined to its end, not just to the edge of the box.
- Desk jobs leave out the daily's new weekend code challenges, which need an editor rather than a single answer.

## 0.0.15 — 2 October 2026

- The list of changes no longer starts with a note about version numbers: it goes straight to the newest version.

## 0.0.14 — 2 October 2026

- The pages no longer repeat their name in a title under the buttons at the top: `debuggit.learn()`, `debuggit.daily()` and `debuggit.ltd()` are already there, so the kiwi stands alone. The sandbox's heading is now `debuggit.run()`. The share picture keeps its `debugg(it)`-style line.

## 0.0.13 — 2 October 2026

- The three buttons at the top of every page are now named `debuggit.learn()`, `debuggit.daily()` and `debuggit.ltd()`, so the daily puzzle's says what it is. The logos and the share picture keep their wordmarks.

## 0.0.12 — 2 October 2026

- Debuggit Ltd's button at the top is now named `debugg.ltd()` and marked **(demo)**, and a `debugg.learn()` button sits to its left. The link back to the daily puzzle at the bottom of the page is gone, since the buttons at the top do that.

## 0.0.11 — 2 October 2026

- A kiwi replaces the duck beside the desk when its jobs are done.

## 0.0.10 — 30 September 2026

- Your intern now needs you. They write each hotfix slowly (about 25 minutes, and they keep going
  while you're away), and they can get **stuck** up to 3 times on the way: each time the hotfix stalls until you
  help by answering a puzzle in its language, from past daily puzzles and Debuggit Learn. Get it
  right and the hotfix jumps a quarter ahead, and your help pays like a desk question (¤40–¤100 by
  difficulty) and 1 reputation; get it wrong and it loses a quarter of its progress. Once written,
  an intern's hotfix is always delivered. Intern hotfixes no longer repeat.
- Graduates now apply, like everyone else, instead of being hired with a button, and nobody applies
  until the studio has **5 reputation**: until then it's you, your intern and the puzzles. From 5,
  graduates and juniors apply (graduates most often), the first within the hour, and it's always a
  graduate. Your intern's offer
  to stay on as a graduate at the end of their week still comes whatever your reputation.

## 0.0.9 — 30 September 2026

- A new company starts with ¤250 instead of ¤150, so you can hire your first graduate (¤180) straight
  away.
- Reputation grows more slowly: a hotfix now earns 0.05 reputation instead of 0.5, and principals
  apply once the studio has 5,000 reputation instead of 3,000. Before, hotfixes on repeat piled up
  thousands in a day, so seniors and principals were applying almost from the start. Now seniors
  turn up after a day or two and principals after a week or two.

## 0.0.8 — 30 September 2026

- Contracts set to repeat now keep going while you're away for more than 4 hours. Time away counts
  for up to 4 hours, and payroll was drawn for all 4, but a repeat that had finished before those
  4 hours stopped instead of carrying on through them. A grad left overnight cost about ¤480 and
  earned nothing; now they earn their usual 4 hours' worth.

## 0.0.7 — 30 September 2026

- Every company now starts with an **intern**. They're free, and they take hotfixes with you
  alongside them, in Python or any language you've earned daily puzzle XP in (or one they've picked
  up). You can only help one at a time, and they're slow, but every hotfix is pure profit. After 7
  days the internship ends and they ask to stay on as a graduate for half the usual cost. Companies
  you already have get an intern too.

## 0.0.6 — 30 September 2026

- A contract set to repeat now always retries a failure by itself. Before, one that failed more
  than 4 hours before you came back waited for you to press Retry.

Nothing yet.

## 0.0.5 — 30 September 2026

- Debuggit Ltd has its own version number and its own list of changes (this one), shown in the
  footer on the Ltd tab.

## 0.0.4 — 30 September 2026

- **The daily puzzle and Debuggit Ltd are now separate.** The daily is its own game again and no
  longer pays the company, and the Ltd tab no longer shows it. Your puzzle levels still make your
  Director better at contracts.
- **Desk jobs** replace it at your company's desk: 1 to 3 questions from past daily puzzles and
  Debuggit Learn, turning up about every hour (while you're away too, up to 3 at once). Every
  right answer pays the company, and getting a whole job right pays a bonus. Do as many as turn up.

## 0.0.2 — 29 September 2026

- **Managers are in the demo.** Hire one once you're running four developers, and they'll put
  idle developers to work for you: your company becomes a small business. Patches open once you
  have more than 10 staff.
- **Everyone needs a desk.** Your spare room has 4. After that, rent co-working desks from the
  new Office line, ¤1 a minute each (up to 8), and give them up when you don't need them. You work
  from home, at the daily puzzle.
- A full office is **cramped**, and everyone works a little slower. You can squeeze up to two more
  people in without desks, but it slows everyone down more.
- Now and then someone **hands in their notice**, far more often in a cramped office. They stay
  for a day: find them a desk, or agree the pay rise they ask for, and they'll stay.
- Once today's puzzle is done, the Ltd tab folds it down to its result, on any screen, so the
  studio has room. **Show** opens it again, and it remembers how you left it.
- Language skills are levels with no top (Python Lv 6), each with a bar showing the XP to the
  next level. Levels 1 to 5 need the same XP as the old five pips, so nobody's skills changed.
  Each level past 5 makes a developer a little faster (5%) in that language.
- **Expert** contracts need someone on the team at a skill level in their language (Lv 3, 5 or
  8) and pay up to ×2.2 for it. The board always has one expert hotfix.
- Promotions ask for more skill: a language at Lv 3 for Junior, Lv 5 for Senior and Lv 8 for
  Principal. Sticking to one language gets there about when the contract time is up. Seniors
  and principals who apply come with higher levels to match.
- Developers on the bench do odd jobs, which cover their salary with 5% to spare, so a quiet
  spell grows the company slowly instead of costing it. Contracts still pay far better, and odd
  jobs don't count towards skills or promotion.
- Some contracts are **Risky** (pay ×1.4, 15% less likely to succeed) or **High stakes** (pay ×2,
  30% less likely), and failing them costs more reputation. Strong teams make the most of them.

## 0.0.1 — 28 September 2026

The first numbered release: the demo as it stands.

- Start your own software company on the **Ltd** tab. Your daily puzzle is your desk and pays it.
- Hire graduates, put them on hotfixes, and they keep working while you're away (up to 4 hours).
- Juniors, seniors and principals apply to join now and then, once your reputation is high
  enough. Hiring prices only go up, with inflation and rival studios.
- Promotions take real time on contracts: 12 hours to junior, 3 days to senior, 14 to principal.
- A **Next step** guide for your first hire and contract, and warnings for anyone on the bench.
- Your company grows through stages, from Start-up to Multinational. In the demo you stay a
  start-up: managers arrive in v0.1.
