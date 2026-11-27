# Dev Life — the life simulation

Part of [SPEC.md](../SPEC.md). The meters, the routine, the body, money, home, the people and the events. Numbers here are the starting tuning; they live in `constants.js` and `data/`, and the bot ([SPEC.md › Testing](../SPEC.md#testing)) checks them.

## The meters

Every meter is **0–100 and higher is better** — so tiredness is shown as Energy, sleepiness as Rest, excess weight as Fitness (with the weight in kg beside it), stress as Calm. A meter has a colour band (≥ 70 green, 40–69 calm yellow, 20–39 amber, < 20 soft red — never alarming), a trend arrow from the last week, and a tooltip that says **why it moves** ("▲ sport 4 h/week, ▼ sitting 10 h/day, ▼ fast food").

| Group | Meter | What it is | Moves fast or slow |
|---|---|---|---|
| Body | ⚡ **Energy** | The day's fuel; sets how well the hero works and learns today | Fast (hours) |
| Body | 😴 **Rest** | The sleep balance; sleep debt pulls it down, it refills with good nights | Days |
| Body | 💪 **Fitness** | Shape and stamina; the weight in kg is shown with it | Weeks |
| Body | ❤️ **Health** | The base; sets the chance of illness and how fast the hero recovers | Months |
| Body | 🪑 **Back & Eyes** | Posture, eyes and wrists; from the workplace, sitting hours, breaks and sport | Weeks |
| Mind | 😊 **Mood** | Cheerfulness, joy of life | Days |
| Mind | 🧘 **Calm** | The opposite of stress; deadlines, overtime, money worries and conflicts lower it | Days–weeks |
| Mind | ✨ **Spark** | Inspiration and curiosity; new things raise it, routine and a boring job lower it; it speeds up learning and side projects | Weeks |
| People | 🤝 **Friends** | The social circle; time with friends and answered invitations | Weeks |
| People | 💞 **Love** | The relationship with the partner (once there is one) | Weeks |
| People | 🧸 **Kids** | The bond with each child (one meter per child, the HUD shows the lowest) | Weeks |

The HUD shows a compact column of the icons with their bars; the People group shows only what exists (no partner, no 💞).

**Derived values** (shown in tooltips and reports, not as meters):

- 🎯 **Focus** = f(Energy, Rest, Calm, the workplace's Focus, the PC's speed, noise at home). Multiplies the output of work, learning and side projects.
- 🔥 **Burnout risk** — rises while Calm, Rest and Mood stay below 35 together; shown as a small flame on the HUD when it is above half. At full it brings the *Burnout* card (see "Illness and burnout").
- ⚖️ **Weight** in kg and a gentle band (*Fit*, *OK*, *A bit heavy*, *Heavy*; never a number like BMI on screen for children — the band and the kg only).

### How the meters move

Each game hour the routine's current activity adds its effects (table below) scaled by the difficulty's drift; then slow effects apply once a day (food, home comfort, money worries, the workplace) and once a week (relationships, Spark's routine decay). The routine screen sums them into the **weekly arrows** shown next to each meter.

| Activity | ⚡ | 😴 | 💪 | ❤️ | 🪑 | 😊 | 🧘 | ✨ | 🤝 | 💞 / 🧸 | Other |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 😴 Sleep | ++ | ++ (to need ≈ 7.5 h; below it a debt) | | + | + | | + | | | | |
| 💼 Work | −− | | (−) sitting | | − sitting | ± job's fit | − stress of the job, −− overtime | ± job's novelty | + colleagues | | money, job skills, performance |
| 🚌 Commute | − | | + if by bike / walking | | | − long | − long | | | | |
| 📚 Learning | − | | | | − sitting | + | | ++ new, − if forced | | | skill XP |
| 🛠️ Side project | − | | | | − sitting | ++ | ± | +++ | | | portfolio, reputation, maybe money |
| 🏃 Sport | − now, + max | + (sleeps better) | +++ | ++ | ++ | + | ++ | | + team sport | | weight − |
| 👨‍👩‍👧 Family | − with small kids | | + walks, play | | | ++ | + | | | +++ | |
| 🍻 Friends | − | − late nights | | | | ++ | ++ | + | +++ | | money − |
| 🎮 Hobby & rest | + | | | | − if at a screen | ++ | ++ | + | | | |
| 🧹 Chores & meals | − | | | | | − if too many | − if too many | | | + shared | |

Diminishing returns everywhere: the 5th hour of sport in a day gives little, the 13th hour of work gives almost nothing but stress. A meter above 90 needs effort to stay there; a meter below 20 recovers faster once the cause is gone ("the body wants to heal").

## The routine

Two plans, **Weekday** and **Weekend**, each a 24-hour day. The screen shows the day as a **24-hour ring** (a clock face with coloured arcs) on a desktop and as a **list of sliders** (± 0.5 h steps) on a phone; dragging a border between two arcs moves an hour from one activity to the other.

- **Fixed by the situation** (grey, not draggable but explained): the job's **core hours** (a contract of 8 h; less is *slacking*, a performance risk; more is *overtime*, paid or not by the job), **commute** (from the job's place and the home; zero when remote), **chores & meals** (a minimum from the household: 1.5 h alone, 2.5 h with a partner, 4 h with a baby; lowered by what money buys, see "Money buys time").
- **Free hours** are split by the player between sleep, learning, side project, sport, family, friends and hobby & rest.
- **Choices inside an activity:** Learning — *which skill* and *how* (see [career.md › Learning](career.md#learning)); Sport — *running*, *gym*, *cycling*, *swimming*, *yoga*, *football with friends* (each with its cost, equipment and its mix of Fitness, Back & Eyes, Calm, Friends); Hobby — *games* (needs the PC, Mood more with a better GPU), *series*, *reading*, *music*, *drawing*, *board games*; Side project — *open source*, *own app*, *freelance gig*, *blog / videos*.
- **Live preview:** while a slider moves, the weekly arrows next to each meter, the month's money and the skills' speed update at once — the core of "understanding how it acts on the hero".
- **Presets:** *Balanced*, *Crunch* (work 11 h, sleep 6 h), *Study sprint*, *Family first*, *Recovery* (sleep 9 h, sport, hobby, no overtime). The player can save two own presets.
- **Special days:** vacation (the routine is replaced by the trip's), sick days (bed), the exam session (chapter 1), a newborn's first months (sleep is broken: Rest's need is met at 60 % whatever the slider says).

## Body

### Food

A monthly choice (the Home tab), mixing allowed by sliders of shares:

| Food | Money/month (2010, alone) | Time | Effect |
|---|---|---|---|
| 🍜 Instant & fast food | 120 | 0.5 h/day | Fitness −, Health −, weight + |
| 🍳 Cooking at home | 180 | 1.5 h/day | Fitness +, Health +, Mood + if *cooking* is liked, Love + if together |
| 🥗 Healthy delivery | 450 | 0.2 h/day | Fitness +, Health + |
| 🍽️ The job's canteen | — (perk) | — | Health + on workdays |

Coffee is its own small line: none, instant, a coffee machine (bought once, Energy + in the mornings, Rest − if after 16:00 in the routine).

### Weight

The hero starts at 18, 180 cm and 70 kg (the dorm's fast food and the canteen are the first test). Each day: weight changes by (food's calorie level − the day's activity − the base) × a small factor; ±0.1 kg on a bad or good day at most. Age slows the base by a little each decade. The puppet's waist follows the weight. The band and the kg are shown in the Body tooltip and in the birthday report's chart; Fitness is the meter.

### Illness and burnout

Illness is never deadly and never long; it costs days and money, and it teaches.

| Card | When | What it does | Choices |
|---|---|---|---|
| 🤧 **A cold** | Random, more likely with low Health, low Rest, winter, small kids at kindergarten | 3–7 days of low Energy | *Work through it* (Calm −, longer illness), *Sick days* (performance a little −, faster), *See a doctor* (money, fastest) |
| 🤒 **The flu** | Rarer, winter, low Health | A week in bed (the routine replaced) | *Rest and fluids*, *See a doctor* |
| 😣 **Back pain** | Back & Eyes < 30 for weeks | Focus −, sport limited | *Physio* (money, a few weeks), *Better chair* (opens the shop), *Ignore* (it comes back) |
| 👓 **Tired eyes** | Back & Eyes low, many screen hours, age | Focus − in the evenings | *Glasses* (money once; the puppet wears them from then on), *Breaks every hour* (the routine's 20-20-20 rule: −0.3 h of work, Back & Eyes +) |
| 🩺 **Check-up** | Every 2 years, or after 40 every year | Shows Health's causes in plain words | *Go* (money, half a day, a hint of what to change, Health +) / *Skip* |
| 🦠 **COVID** | 2020–2022, chance by contact | 1–2 weeks | as the flu |
| 🔥 **Burnout** | Burnout risk full | The hero cannot work well: 2–4 weeks of *Recovery* routine forced, Spark falls | *Talk to a doctor* (sick leave, the job keeps the place), *Take a vacation* (money), *Quit and rest* (no salary, full recovery, then a job search) — after it, Burnout risk stays lower for a year ("lesson learned") |

## Money

One currency in the whole game (see SPEC "Open questions"); salaries and prices follow the year (inflation at the difficulty's rate), so a 2040 coffee costs more than a 2010 one and the reports show both the nominal number and "in 2010 money".

- **Student income** (chapter 1): the stipend by the last session's grades, the parents' monthly help, a student job's pay — see [university.md › Money](university.md#money).
- **Income:** salary (monthly, after taxes — the game shows net only, one rate per country of residence), overtime pay where the job pays it, bonuses after a good review, freelance and side-project income, the partner's salary (shared household money once living together, a setting *Shared / Separate*), interest and dividends, a one-time gift from parents in a hard month.
- **Expenses:** home (rent or mortgage, utilities), food, transport, subscriptions (gym, courses, streaming, the internet line), kids (kindergarten, school, hobbies, clothes), insurance (later), and the purchases.
- **Savings:** a *savings account* (safe, small interest), an *index fund* (average 7 %/year with the real dips of 2011, 2018, 2020, 2022 and invented ones after 2026; the game explains "time in the market"), an *emergency fund* goal (*3 months of expenses* is marked on the chart). No speculation, no crypto trading — crypto exists as a news event and a mining choice (see [computer.md › Mining](computer.md#mining-20172018)).
- **Debt:** only a **mortgage** (for a home) and a small **0 % installment** for a big purchase; no credit cards, no payday loans. If the account would go below zero, the purchase is refused and the cheapest life switches in ("Money is tight": food → cooking, subscriptions paused) until it is positive again; parents help once per chapter.
- **Lifestyle creep:** a new comfort gives Mood for a few months, then becomes the new normal (the daily Mood effect fades to a quarter) — shown in the tooltip ("The new sofa: you got used to it"). Cutting it back later costs Mood for a while. This is the lesson of "saving ↔ spending".
- **Money buys time:** dishwasher (−0.3 h chores), robot vacuum (−0.2 h), a cleaner every two weeks (−0.5 h, monthly cost), delivery food (see above), a home close to work (less commute), a home robot after 2033 (−1 h, expensive), a car (commute faster but Fitness −, money).

The 💰 Money tab: the month's line (in, out, saved), a 12-month chart, the net worth over the whole life, the accounts with **Move money**, the fixed costs list with what each one gives.

## Home

| Home | Years open | Cost (2010 money/month) | Space for the workplace | Notes |
|---|---|---|---|---|
| Dorm room (shared with Max) | start, while studying | 80 | A corner of a small desk | Noise (Max), Friends +, Calm −; the canteen next door |
| Shared flat with friends | 3rd year+ | 160 | A small desk | More comfort, chores shared |
| Parents' place | any time (a fallback) | 0 | A kitchen table | Calm ±, Mood −, Love − (a partner far away), Friends − |
| Rented room in a flat | 2010+ | 250 | A small desk | Flatmates |
| Rented studio | 2011+ | 450 | A desk by the window | Alone: Calm +, chores all yours |
| Rented 2-room flat | 2013+ | 700 | A real desk in the bedroom | |
| Own flat (mortgage) | 2016+ | mortgage ≈ rent, a down payment of 15 % | A study if 3 rooms | Home + in the wheel, renovation choices |
| House with a garden | 2022+ | bigger | A home office with a door | Kids' Mood +, chores +, commute + |
| Abroad (a relocation offer) | 2017+ | as the city | as the home there | Salary +, Friends reset low, Spark ++, a language to learn |

- **The commute** comes from the home's distance to the job: centre, inner city, suburb, out of town; and the means: walk, bike, transit, car.
- **Space matters:** a 1-room home with a baby gives Focus −− to work from home; a door to a study removes it. A home office is the big upgrade of chapter 4.
- **Renovation and furniture** (sofa, bed, mattress, kitchen) give Home comfort (a slow Mood and Calm effect) and Rest (the mattress).
- **Moving** is a card with the choices of available homes (more in the Home tab), costs a weekend and money, and changes the commute, the neighbours and the window's view.

## People

### Friends

Friends is one meter for the circle, plus named friends who send cards: **Max** (from university), a friend from the first job, a neighbour, the partner's friends later. The circle shrinks slowly without time together (the meter decays), grows with time together, invitations answered and team sports. A move abroad or to another city halves it; it rebuilds.

### Partner

- **Meeting** — possible from chapter 1 when the hero has free evenings; through a card from one of: a classmate or a club's member at the university, a friend's party (needs Friends ≥ 40), a hobby club or team sport, a conference, a dating app (a setting in the Life tab: *Looking* / *Not looking*), a colleague (only from another team). The player names the partner and picks a look; the partner has an own job (a random field, their own salary and hours).
- **Stages:** dating → together → moving in (a card, a home choice) → engaged → wedding (a card: small / big, the money and the Friends effect) → kids (a joint decision, "Are we ready?", shows the time and money it will take). Each stage needs Love above a threshold for some months; a student relationship that has not moved in may end kindly at graduation; nothing goes back past *together* except *a pause* before moving in ("We want different things" — the relationship ends kindly and the hero may meet someone again). After moving in there is no breakup: a low Love brings *A rough patch* cards (*Talk*, *A weekend away*, *Couples' counselling*), and Love always recovers with time together.
- **The partner's life:** their promotion, their own overtime, a relocation offer for them (the hero's choice), their wish for a holiday, their help when the hero is ill. Their work hours reduce the family hours available together.

### Kids

- **Up to three**, each a joint decision; the player names them.
- **Ages and needs:** baby (0–1: Rest −−, chores ++, a parental leave choice of 0–12 months: salary lower, Love and Kids ++, career pause), toddler (1–3: kindergarten costs, colds), school (7–15: homework help, school plays, hobbies that cost), teen (16–18: their own views; "teach me to code?"), adult (they leave home; visits).
- **The bond** grows with family hours and their events answered; a low bond is never punished, it shows as the kid's mood in the picture and their lines.
- **Bookend:** from 2035, when the oldest is 12 or older, the child asks to build their first PC together — the assembly mini-game with the hero as the teacher (the player explains each part with the Codex's cards as quiz answers). Without kids the same card comes from a niece or nephew, a neighbour's kid or a mentee.

### Parents

Send a monthly help in the student years ([university.md › Money](university.md#money)) and visit at the graduation; after it help once per chapter in a money-tight month; from chapter 6 they need help sometimes (a weekend, money, a hospital visit card). Never die in the game; they age in the photos.

### Pet

**Byte the cat** (or a dog) from a card or the Life tab: Mood +, Calm +, chores +0.2 h, a vet's cost; cards of its own (walking over the keyboard in a call, sleeping on the warm PC, knocking a glass onto the desk).

## Events

Event cards come from `data/events.js`: a title, a small drawing, a few lines, two or three choices, **each choice with its effects shown** (known numbers as ▲▼ on the meters and money; uncertain outcomes as "?" with the chance in words — *likely*, *maybe*, *a long shot*). A card that pauses waits; a card that does not (small ones) waits in the feed for a few game days and then the autopilot or *ignore* answers it.

### Kinds

| Kind | Examples | Comes from |
|---|---|---|
| **History** | the smartphone boom, the pandemic, ChatGPT | The year's list in [timeline.md](timeline.md) |
| **Market** | demand for a skill rises or falls, a hiring freeze, layoffs at the hero's company | [career.md › The market](career.md#the-market) |
| **Invitations** | an old friend's birthday, a wedding, a conference, a hackathon, a meetup, a trip with friends, a family dinner | Weighted by Friends, the year, the job |
| **Opportunities** | a freelance gig, a mentor offer, a talk at a meetup, an open-source project noticed, a recruiter's call, a friend's startup | Reputation, skills, Spark |
| **Mishaps** | coffee on the keyboard, the hard disk dies, a power cut in a deploy, a phishing e-mail, a stolen bike, a landlord who sells, a broken washing machine | Random, weighted by the state (no backup → the disk card teaches backups; no UPS → the power cut) |
| **Health** | the cold, the back, the check-up, burnout | Above |
| **Family** | the first word, the school play, the partner's promotion, parents' anniversary | The people's state |

### Examples with their outcomes

- **Max's birthday (Saturday evening).** *Go* — Friends ++, Mood +, money −, Rest − on Sunday; *maybe* he mentions a job at his company (an offer card later). *Send a gift* — money −, Friends +. *Skip* — nothing now, Friends − a little.
- **A conference in another city (2 days, Thursday–Friday).** *Go on the job's budget* (if the job has one) — Spark +++, a skill's XP, Reputation +; *likely* two new contacts (offers more likely for a year), *maybe* a partner met there. *Go on your own money* — the same, money −−. *Watch the videos later* — Spark + only.
- **A hackathon weekend.** *Join* — Rest −−, Spark +++, portfolio +, *a long shot* of a prize and a startup idea. *Pass*.
- **Coffee on the keyboard.** *Buy a new keyboard now* (opens the shop with keyboards). *Dry it for a day* — *maybe* it works again. *Use the laptop's own* — Back & Eyes − until a keyboard is bought.
- **The hard disk clicks.** If a backup exists — *Restore* (a day; *Backed up before the disk died* achievement). If not — *A data recovery service* (money −−) or *Lose the side project's last month* (portfolio −); either way the shop opens with an SSD and an external drive, and the Codex card *Backups: the 3-2-1 rule* opens.
- **A phishing e-mail ("Your account is locked").** *Check the sender and report it* — Reputation + at work, the Codex's *Security* card; *Click* — a day of resetting passwords, Calm −; Security skill shows the right answer as likely.

### Never lost

The rules that make sliding down possible and losing impossible:

- No meter ends the game. At < 20 a meter brings help: a card with a cheap way back (a friend calls, a doctor's advice, the partner suggests a weekend, the parents invite).
- Nobody is expelled from the university: a failed exam has retakes, the worst is a repeated year (on Hard); dropping out is the player's own choice and the diploma can be finished later.
- Losing a job is a card with severance (two months' salary), the job search opened automatically, offers more frequent for a while, and unemployment money (half of the last net salary for six months).
- Money never goes below zero (see "Money"); a mortgage that cannot be paid is moved to a cheaper home by a card (*sell and rent*), never a foreclosure drama.
- Skills rust but never go below half of their best level ("you remember how").
- Every chapter goal missed is shown as "not this time", with what would have helped.
