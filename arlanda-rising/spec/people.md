# Arlanda Rising — the staff: teams, fallback teams, IT, heads, practice

Part of the spec of `arlanda-rising`; the core rules and the index of these files are in [SPEC.md](../SPEC.md) ("Manual, people, systems: the automation ladder", "People"). Keep it in sync with the code like the rest of the spec. How the player manages the people of the airport — hiring, dismissing, the heads and their search, the drills — where each is on the screen and in which time it is allowed. The code: `sim/people.js` (`People`), `sim/systems.js` (`Systems`: the systems, IT, practice), `sim/actions.js`, the data in `data/people.js` (`DEPTS`, `MANAGERS`, `HEAD_STYLES`, `HEAD_NAMES`) and `data/domains.js` (each level's jobs), the numbers in `constants.js`; the screens `ui/people.js` (Departments), `ui/opscenter.js` (the Ops Center), `ui/plan.js` (the plan panel), `ui/text.js` (`ladder`, `practice`, `retire`, `span`).

## The departments

A department for every domain worked by people (its key is the domain's: stands → Operations, turnaround → Ground handling, checkin → Terminal service, snow → Snow and maintenance, baggage, info → Information, security, border — the police, whose wages the airport does not pay —, deice) and IT. Each has its jobs (`People.jobs`: its domain's level's `staff`, plus level 1's when a team is kept beside a system, less the jobs empty, `cut`), wages (`STAFF_MONTH` a job, IT `IT_JOB`, × its wage level `wageX`), morale, fatigue, skill, absence, a union with its wage round, the temps, and at most one head. The design of absence, strikes and the unions is in [SPEC.md](../SPEC.md) "People", the numbers as built in [sim.md](sim.md) "People, systems, chapters 2–3".

## Teams

- **Hire** (level 0 → 1, `People.hire`, `Actions.upgrade(dom)`): `HIRE_COST` (40 kSEK) a job; the people start after `HIRE_DAYS` (14) in plan time, or `CLEARANCE_DAYS` (42) where the department needs a security clearance (`DEPTS[d].clearance`, from 2002), at once between missions; never in ops time. A domain can be hired for once a mission has unlocked it (`S.unlock`). A new team starts at `SKILL_START`.
- **The team does the work** (`sim/tasks.js`): its tasks after its level's delay, × its skill and its head's `fast` / `slow`; short (absence, strike, empty jobs) it sends a share to the tray.
- **Dismiss the team** (`People.dismiss`, `Actions.dismiss`): a team doing the work alone (`People.teamKind` `team`) is let go — its notice paid (`LAYOFF_PAY_MONTHS`, 3 months of wages a job, the line `layoffs`), and its head goes with it (a head leads a team: the head's severance is in the price); the domain goes back to level 0, the player's hands. Its tasks come to the tray even in a mission that does not put them in the player's hands (`S.people.byHand[dom]`, added to each stage's hands by `People.withHands` in `Missions.beginStage`), so a dismissal never makes the work free; between missions a domain by hand loses its whole `SUMMARY_LOSS`. The lay-off's consequences (`People.layoffHit`, the same as a system bought with its team let go): every team's morale −`LAYOFF_MORALE` (12), every union's mood −15, the Neighbours −3. Not while a system is being put in or new people are on their way (`dismissCannot` `busy`), not in ops time. A mission's `setup.domains` still raises a domain to the owner's arrangement.

## Fallback teams

- When a system is bought from a team, the player keeps the team as the **fallback** (`keep`: `RETRAIN_COST` a job, the team's wages go on, its morale +6) or lets it go (`layoff`: the lay-off's consequences, the wages saved); a system bought straight from the hands comes alone (its own operators, level 2's `staff`).
- **Hire a team as the fallback** / **Hire a team back** (`People.hireBack`): beside a system with none, `HIRE_COST` × level 1's jobs, ready after the hiring days (or the clearance) in plan time, at once between missions; while the system is still being put in it works as the domain's team until the system is live. Its practice starts at 100 %.
- **Dismiss the fallback team** (`People.dismiss`, `teamKind` `fallback`): its notice for level 1's jobs (less those empty), the lay-off's consequences; the system goes on, and when it fails the work comes to the tray (`Systems.working`: a system down with no team kept falls to level 0).
- **A failure** (`Systems.working`): a system that is down falls to the team kept beside it (level 1), or to the player's hands; an integrated system (level 3) falls to level 2 unless the failure is deep (an outage, a blackout, a cyber attack), which takes both down to the team.

## IT people

The systems need IT people: `Systems.itNeed()` — each system's `it` jobs, × its head's `itNeed` (Jonas Wik: 0.7). Too few (`itFactor` = IT ÷ need, at least 0.25) and the failures come more often and take longer. **+1** costs `HIRE_COST` (at once, also in plan time); **−1** (`People.hireIT(-1)`) pays its notice (`LAYOFF_PAY_MONTHS` × `IT_JOB`, about 165 kSEK) and IT's morale −`ONE_JOB_MORALE` (4: one job, not a lay-off round); the last one goes with the head of IT, whose severance is then in the price (`People.itCutPrice`). Not in ops time.

## Dismissals and their prices

Swedish style: the notice of labour law is one to six months by the years served, a director's contract usually six months and some severance. Every price is shown on its button before the tap, and every dismissal takes a **second tap** within `SELL_CONFIRM_MS` (2.5 s; the first turns the button red, *Tap again: Dismiss*), as the shop's Sell on a terminal's card.

| Who | Price | What follows |
|---|---|---|
| A team doing the work | `LAYOFF_PAY_MONTHS` (3) months of its wages a job, + its head's | The domain back to the hands; the lay-off's consequences |
| A fallback team | 3 months of its wages a job | A failure then comes to the tray; the lay-off's consequences |
| One IT person | 3 months of `IT_JOB` (+ the head of IT's with the last one) | IT's morale −4 |
| A head | `HEAD_PAY_MONTHS` (6) months of salary (`MANAGER_SALARY` × the head's own), nothing within `HEAD_RETIRE_FREE_DAYS` (182) of retiring | The team works on without the head's perks; "No head — find one" |
| A head replaced from a search | The same as a dismissal | The new head starts at once |

For a sense of scale (1988, Medium): the Ramp supervisor's 4 jobs 0.58 MSEK, the baggage fallback team's 8 jobs 1.1 MSEK, Maja Ström 0.76 MSEK, Mira Haddad 0.65 MSEK. All of it goes on the line `layoffs`, a one-off sum the `lastMonth` goal leaves out.

## Heads

- **Candidates** come in pairs (`People.candidates`): the department's own heads of `MANAGERS` from their year first, then successors made of `HEAD_NAMES` and `HEAD_STYLES` (`next:<dept>:<n>`), never someone who has left the airport (`S.people.gone`) or leads a department now. Each has a salary, two strengths and a flaw (`perks`, read by the sim; `Text.managerLines`). A head hired for a department without a team comes with the team (its price and days).
- **A head's life:** a mood, a raise asked every `MANAGER_RAISE_MONTHS` (24), poached by a rival airport under a mood of 40 (`MANAGER_POACH` a month), and **retiring** `MANAGER_YEARS` (14) after starting (`m.since`; `People.retireDay`). Departments shows *⏳ Retires in 10 years 1 month (8 April 1998)* (`Text.retire`, `Text.span`: years and months, or days under a month). A head who leaves (`People.leave`, `letHeadGo`) never comes back; the department is vacant (`S.people.vacant`: its id, why — `retired`, `poached`, `dismissed` — and the day): Departments and the Office say so (the Office with **Find a new head**), in plan time a banner says so at once (the team keeps working — only the head's skill is gone) and the two successors come the next day as a decision (`Offers.head`, *A new head for …*, or *Nobody for now*; not for a dismissal, whose candidates the player is already looking at); a head who left between missions is told on the "Meanwhile…" card and offered in the mission's first plan time. A head offered for a department with no team says so on its card (`Text.headTeam`, the decision's effects: the team's price and days).
- **Dismiss** (`People.dismissHead`): its price as above; the department is vacant at once with its two candidates in Departments (*No head — find one*, *… was dismissed.*).
- **Find a replacement** (`People.search`): `HEAD_SEARCH_COST` (100 kSEK, the recruiting firm's fee) and `HEAD_SEARCH_DAYS` (30) of the calendar while the head works on (`S.people.search[dept] = { at, cands }`). The days are the calendar's: they run in plan time (a day a second at ▶) and in the days skipped between missions (`Summary.skip` runs `People.day`), not in ops time (a stage of a few hours moves no day). So a search started in the Office ends with the next mission's "Meanwhile…" when the jump is long enough (it is told there), or in its first plan days; one started in plan time ends in that mission or the next. When its days are done (`People.day`) the search has its **two candidates** (`candidates` then: the current head is not one); a banner says so in play, a line in the plan panel and the Office leads to Departments. There the player **takes one** (`People.pickHead`: the old head is paid off as for a dismissal, or leaves on the pension within half a year of it, and the new one starts at once — in ops time too, like hiring a head) or **keeps the head** (`dropSearch`: the fee is spent). A head who retires, is poached or is dismissed during a search ends it (the vacancy's candidates take over); so does a department that lost its team.
- Not in ops time: dismissing a head and starting a search. In ops time Departments hires a head, takes a search's candidate, keeps the head after a search and answers a raise (`edit: 'heads'`).

## Practice: the fallback readiness and the drills

- **What it is:** each system's `readiness` (0.2–1, `S.sys[dom].readiness`): how well the staff still know the manual way. Shown as **Practice** (RU *Выучка*, SV *Rutin*) with its percent, a bar and a word (`Text.practiceWord`): **sharp** (from `PRACTICE_SHARP`, 80 %; RU *в форме*, SV *i form*), **getting rusty** (from `PRACTICE_RUSTY`, 50 %; *подзабыли*, *ringrostiga*), **out of practice** (below; *забыли*, *har glömt*).
- **How it moves:** 100 % when a system goes live with its team kept, when a team is hired back beside it, and after a **drill** (`Systems.drill`: `DRILL_COST`, 150 kSEK, the line `drills`; the day kept as `drilled`); −`READINESS_DECAY` (10 %) every month (`Systems.month`), not below `READINESS_MIN` (20 %); a system live without a team starts at the floor. A mission's option `drills` drills every system.
- **What it does** (`sim/tasks.js`, `Systems.fallback`): when the system is down, the team beside it does each task in × (2 − readiness) of its time — at 1 ÷ (2 − readiness) of its speed: 56 % out of practice at the floor, 77 % at 70 % — and gets × (0.5 + 0.5 × readiness) of its right choices (its own, by skill and head, at 100 %). Without a team beside the system the work comes to the tray and practice does not help. Between missions a system's share of the summary loss is × (1 − 0.7 × readiness) with a team kept (`Systems.summaryLoss`). The goal `readiness` (7-10, 8-11) asks for the average of every system.
- **Shown** (`Text.practice`) in the Ops Center (the column *Practice*: `20 % · out of practice`, and under the domain the block) and in Departments (in the department's card): the bar, the word, *Without a drill it falls 10 % a month, to 20 % at the least*, the last drill (or *No drill since the system went live*), and the consequence computed from the rule: *If the system fails now: the team takes over at 56 % of its speed and gets 55 % of its choices right (after a drill: 100 % and 91 %)* (for an integrated system *If both systems fail (an outage):*), or *No team beside the system: if it fails, the work comes to you — practice does not help.*; and **Drill · 150 k** while it is below 100 % where the screen is editable.

## Where it is on the screen

| What | Departments (P) | Ops Center (O) | The plan panel | Elsewhere |
|---|---|---|---|---|
| Hire a team for work done by hand | ✋ *Done by hand* card: **Hire** | the ladder: **Hire** | only for a domain its goals ask for | — |
| Buy a system (keep or let the team go) | — | the ladder | only for a domain its goals ask for | — |
| The fallback team: hire, dismiss | in the department's card | **Hire a team back** (the ladder) | **Hire a team back** only for a domain its goals ask for | — |
| Dismiss a team | in the department's card | — | — | — |
| IT people +1 / −1 | the IT line (+1, −1 with its price) | IT against the need | **+1** when a goal asks for a system | — |
| Practice, Drill | in the department's card | the column and the block | — | 7-10's decision `drills` |
| Heads: retire, Dismiss, Find a replacement, candidates | in the department's card | the head's name, or *No head* with 👥 Departments | *No head — find one* and *Two candidates for head* with 👥 Departments | the Office's lines, the banner in play, "Meanwhile…" |

**The plan panel shows the teams only where the mission asks** (`ui/plan.js` `asks()`): a domain is the mission's when a goal of a stage, of the mission or of its stars names it — `level` (`dom`), `manager` (`dept`), or `handsOff` (tasks done by teams and systems: every domain); IT when a `level` goal asks for 2 or more (a system needs IT). For those it shows the domain's ladder (`Text.ladder`: hire, the system with the team kept or let go, the fallback team) and the IT people's +1; everything else — the other domains, the fallback teams, IT's −1, dismissals and heads — is in Departments and the Ops Center, reached by the line *Teams, fallback teams, IT and heads* with 👥 **Departments** and 🛠️ **Ops Center** (shown once the airport has a team, or something to add). Examples: 2-3 (`handsOff`: every domain's team), 2-4 (snow and Operations' head), 2-8 and 4-7 (baggage), 3-3 (stands), 3-4 (information), 3-7 (snow), 5-8 (de-icing), 6-4 (check-in), 6-10 (stands), 8-3 (turnaround), 8-4 (snow), 8-7 (border); a mission without such a goal (3-8, 3-9, …) shows only the line.

## What each time allows

| | The Office (time stopped) | Plan time | Ops time |
|---|---|---|---|
| Hire a team, a fallback team | at once | after `HIRE_DAYS` / `CLEARANCE_DAYS` | no |
| Buy a system | at once | after its days | no |
| Dismiss a team, a fallback team, IT | at once | at once | no |
| IT +1 | at once | at once | no |
| Hire a head (vacant) | at once | at once | at once |
| Dismiss a head, start a search | at once | at once | no |
| A search's days | run between missions | a day a second at ▶ | stand still |
| Take a search's candidate, keep the head | at once | at once | at once |
| A drill | at once | at once | no (the Ops Center is to look at) |

## Saves

Every new field defaults on its own, so a campaign, a mission or a Free Play airport saved before this works as it was: `S.people.search` (none: no search), `S.people.byHand` (none: every domain as its mission's hands say), a vacancy's `why` `dismissed` (new value, read by Departments and the Office), `S.sys[dom].drilled` (none: *No drill since the system went live*). The reference strategies never dismiss nor search, so `tools/missions-check.js` gives the same numbers as before.

## Testing

`node --experimental-websocket tools/cdp.js arlanda-rising/tools/people-shots.js [out-dir] --limit 400` (`ARLANDA_SIZE=phone360` or `desktop`, `ARLANDA_LANG=ru` / `sv`) plays 3-1…3-8 as a chain and shoots 3-9's plan panel (only the line), Departments (the teams, fallback teams, practice, heads with their retirement, Dismiss with its price, the armed second tap, the search on its way, its two candidates and the one taken), the Ops Center's practice and 3-7's plan panel (the snow ladder and IT asked by its goal); it prints what each step paid and every element out of its box. From the console in a plan stage: `Actions.dismiss('turnaround')`, `People.dismissPrice('baggage')`, `Actions.search('checkin')`, `S.people.search`, `Actions.pickHead('checkin', S.people.search.checkin.cands[0])`, `Actions.dismissHead('it')`, `Actions.hireIT(-1)`, `Systems.fallback('stands')`, `Text.retire('checkin')`.
