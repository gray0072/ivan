# Dev Life — the career

Part of [SPEC.md](../SPEC.md). Skills, learning, the market, jobs, offers, interviews, reviews, the ladder, freelance, side projects and a startup. The student years before the first job — the subjects that feed the skills, student jobs, the internship, the diploma — are in [university.md](university.md); the skills start there from 0 (Fundamentals 1, English 2 from school).

## Skills

Each skill has a **level 0–10** (with XP inside a level) and a **best level** (rust never takes it below half of the best). Levels have names the player reads: 0 *none*, 1–2 *beginner*, 3–4 *junior*, 5–6 *middle*, 7–8 *senior*, 9 *expert*, 10 *guru*.

| Group | Skill | Notes |
|---|---|---|
| Base | 🧮 **Fundamentals** | Algorithms, data structures, how computers work. Never rusts. Speeds up every other tech skill a little and helps in interviews |
| Tech | 🌐 **Web frontend** | jQuery → Angular → React → whatever 2030 brings; the stack's name follows the year in texts |
| Tech | 🗄️ **Backend** | PHP/Java/.NET → Node/Go → … |
| Tech | 📱 **Mobile** | Android/iOS from 2010; iOS needs a Mac (see [computer.md](computer.md)) |
| Tech | 🧾 **Databases** | SQL, then NoSQL, then vector databases |
| Tech | ☁️ **DevOps & Cloud** | Servers → cloud (2012+) → containers (2014+) → Kubernetes (2017+) |
| Tech | 📊 **Data & AI** | Statistics → ML (2014+) → deep learning (2016+, wants a GPU) → LLMs (2023+) |
| Tech | 🎮 **Game dev** | Engines; a passion field, low pay, high Spark |
| Tech | 🔐 **Security** | Rises in demand all along |
| Tech | 🔧 **Hardware** | Learned mainly from building PCs and reading the Codex (see [computer.md](computer.md)); opens embedded and IoT jobs, saves money on repairs |
| Tech | 🤖 **AI tools** | From 2022-11: working with assistants and, from 2025, agents; multiplies the output of every tech skill at work (×1.0 → ×1.6 at level 10) |
| Soft | 🗣️ **English** | Most docs, courses and conferences are in English: it speeds learning, opens international and remote jobs |
| Soft | 💬 **Communication** | Interviews, reviews, the partner's Love a little |
| Soft | 🧭 **Leadership** | Leads, managers, mentoring; needs people to lead (a lead role, mentoring) to grow past 4 |
| Soft | 📈 **Product & business** | Freelance prices, own product, startup, CTO |

### Learning

The routine's 📚 hours go to **one skill at a time** (the Learning plan in the 📚 tab: a queue of skills, the next starts when the current reaches its target level) by **a method**:

| Method | Cost | Speed | Notes |
|---|---|---|---|
| Free tutorials & docs | 0 | ×1 | ×1.3 with English ≥ 5 |
| Books | small, once per level | ×1.2 | Fundamentals ×1.5 |
| Online course | monthly | ×1.6 | A certificate counts as portfolio for a junior |
| Mentor (Dana, later others) | time of theirs: a favour or money | ×1.8 | Needs a card first; Leadership + for the mentor's side when the hero mentors others later |
| Bootcamp | big, 3 months full time | ×3 | Replaces work: unpaid leave or between jobs |
| Master's degree (after the bachelor's) / evening university (to finish a dropped degree) | full time with a stipend, or part time with fees; 2 years | ×1.4 on four skills at once, Fundamentals ×2 | Opens research and AI-lab jobs; the evening study gives the missing diploma |
| Conference / meetup | an event | burst of XP | Plus Spark and contacts |

**Learning speed** = hours × method × Focus × Spark × (1 + Fundamentals/20) × the PC's fit (Data & AI wants a GPU from 2016, Mobile iOS wants a Mac, DevOps wants RAM for containers; a weak PC halves the speed and the tooltip says which part is missing).

**On the job** the hero learns the job's stack slowly (≈ a quarter of the speed of the same hours of study) and keeps it from rusting.

**Rust:** a skill unused (no job use, no study, no side project) for more than a year loses XP slowly, never below half the best level. Fundamentals, English (if used at all) and Hardware (if a PC is built every few years) do not rust.

## The market

`data/market.js` has, for each skill and year from 2010 to 2050, a **demand** (0.5–2.0) — the multiplier of salaries and of the number of offers that need that skill. Real trends to 2026, invented after (labelled *forecast* in the Market chart):

- Mobile rises 2010–2014, settles; Web frontend rises with the SPA years, flattens; Backend steady; DevOps & Cloud rises from 2013; Data & AI rises from 2015, jumps in 2023; Security rises slowly all along; Game dev low and steady; juniors' demand overall drops in 2023–2025.
- **Shocks** (events in [timeline.md](timeline.md)): the 2020 pandemic (a dip for three months, then a remote-hiring boom 2021), the 2022–2023 layoffs (all demand −20 % for a year, the hero's company may lay off), the AI era (Data & AI ×1.8, AI tools required in many offers from 2024, plain Web frontend −15 %).
- **Difficulty** scales the shocks (Easy halves them, Hard adds random smaller ones).

The 📈 Market view (in the 💼 Career tab): a line per skill over the years so far, the hero's levels as dots, *Hot* and *Cooling* tags, and a one-line news for each change ("Companies want cloud skills: DevOps & Cloud demand +15 %").

## Jobs

A job (`data/jobs.js` holds the company kinds and the offer templates) has:

| Field | Values and meaning |
|---|---|
| **Company kind** | Outsourcing agency, product company, startup, bank / enterprise, big tech, game studio, government / university, AI lab (2023+), own business |
| **Title** | Intern → Junior → Middle → Senior → then a branch: **Lead** → **Architect** / **Staff**, or **Lead** → **Manager** → **Head** → **CTO**; outside the ladder: freelancer, founder, teacher |
| **Salary** | Net per month: base by title × the stack's demand × the company kind × the city × the difficulty |
| **Hours** | Core hours (6–9 h) and the **overtime culture** (none / sometimes / often / crunch), paid or not |
| **Where** | Office, hybrid (2 or 3 days), remote (mostly from 2020; a few before); office's place for the commute |
| **Stack** | 1–3 skills required with minimum levels; ✨ "nice to have" skills |
| **Education** | Some offers want a **diploma** (enterprise, government, some jobs abroad) or a **master's** (research, AI labs); the comparison shows ✔ / ✘; *with honours* is a small plus |
| **Equipment** | **Own PC (BYOD)** with minimum specs, or **a company laptop** of a tier (*weak*, *good*, *top*), or **an office desktop** (only at the office); the company's equipment replaces the hero's PC for work hours, so a weak one is Focus − |
| **Stress** | Base Calm effect per work hour |
| **Growth** | Speed of on-the-job learning, a mentor in the team, a learning budget per year, a conference a year |
| **Novelty** | Spark effect: new tech and interesting problems vs maintenance of an old system |
| **Stability** | Chance of the company closing or laying off in a year (startups high, government low) |
| **Perks** | Gym (Fitness + without money), canteen, health insurance, parental leave top-up, a four-day week (2030+), equity (startups: a lottery ticket that pays big in a few cases) |
| **Team** | A short line about the people: friendly, tense, distributed; Friends + for a friendly team |

### The current job

- **Performance** (0–100) grows with output: work hours × Focus × skill fit (the stack's levels vs the title's expectation) × the AI-tools multiplier; drops with slacking, a long illness without sick leave, burnout.
- **Every six months a review card:** the performance in words, then a raise (0–15 %), a bonus, a promotion offer, or a *let's improve* note with a plan (no firing from a review on Easy and Medium; on Hard, two bad reviews in a row bring a warning, the third a calm *Let's part ways* with severance).
- **Promotions** need performance ≥ 70 at a review, the next title's skill levels and, for Lead and up, Leadership and Communication. A promotion card shows the new duties: Lead has fewer coding hours (Spark −, Leadership ++), Manager almost none.
- **Asking for a raise** is a button once a year: success by performance, the market's demand and an offer in hand (the counter-offer mechanic — taking a competing offer to the boss).
- **Quitting** is a button: with a notice period of a month; a gap between jobs is a free time for learning or rest (no salary).

## Offers

- **Open to offers** — a switch in the 💼 tab (and on the profile): off — rare recruiter calls only when Reputation is high; on — **an offer every 2–6 game weeks**, more with Reputation, contacts from conferences and the market's demand for the hero's skills. A job search costs time: each interview takes the evening or a day off.
- An offer comes as a card that does not pause on *Important only* unless it beats the current job in money by > 20 % or matches a Life Dream (*Live abroad*, *Lead by 35*).
- **The comparison card** — two columns, the current job and the offer, row by row with ▲▼ coloured on the offer's side: salary (and *in a year* with the expected raise), hours and overtime, commute (hours per week), where, stack (with the hero's levels ✔ / ✘), equipment (with what it means for the hero's own PC), stress, growth, novelty, stability, perks, team; and below, the **effect on the week** — the routine's arrows recomputed for the new job, money per month. The requirements the hero does not meet are listed with what is missing ("Backend 6 — you have 5"; "Own PC with 16 GB RAM — you have 8"; "Mac for iOS").
- **Choices:** *Apply* (starts the interview), *Ask for more* (a counter on salary or remote days, may lose the offer), *Decline*, *Keep for a week* (the offer waits 7 days in the 💼 tab, the comparison open there).
- **Offer shapes that make choices interesting:** a well-paid enterprise job with a top laptop, a legacy stack and a long commute; a startup with equity, crunch and new tech that wants the hero's own strong PC; a remote job abroad that needs English 6; a game studio that pays less with Spark +++; an AI lab that wants Data & AI 6 and a GPU with 16 GB.

### Interviews

An interview is a small card sequence (1 round on Easy, 2 on Medium, 3 on Hard):

1. **A chat** — Communication and Calm decide the impression (shown as a bar).
2. **Questions** (Medium and Hard) — 2–3 short multiple-choice questions from `data/questions.js`, by the job's stack and the year, simple and friendly ("Which is faster to find a name in a sorted list of a million: reading from the start, or halving the list each time?"; "What does RAM hold when the computer is switched off?"). The hero's level of the skill **highlights the likely answer** at higher levels (a senior "knows"); a wrong answer lowers the chance, never ends it.
3. **The result** — the chance is shown before the start (*likely*, *maybe*, *a long shot*); preparation (a weekend of study before, a book) raises it. A refusal is a kind card with what would help ("They wanted more Backend").

## Side projects, freelance and an own product

- **Open source** — Reputation and portfolio, Spark; *maybe* a star moment (a card: the project gets popular, offers more likely, a conference talk invitation).
- **Own app** — portfolio; after enough hours a **launch** card: users grow by the app's quality (the skills used), Product, the market of its year; small monthly income, sometimes larger; it can be sold, closed or grown into a startup.
- **Freelance gigs** — cards with a client, a fee, a deadline in hours and a needed skill; done in side-project hours; money and portfolio; a late gig is Calm − and Reputation −. Full-time **freelancer** is a career choice from chapter 2 (income varies, no paid holidays, the hero sets the hours).
- **Blog / videos** — Reputation, Communication; slow money from chapter 3.
- **Startup** — from Max's card (chapter 3 or 5) or the own app's growth: the hero leaves the job (or goes part-time), sets the hours (crunch likely), money from savings and investors' cards; three years of yearly cards — growth, a pivot, an acquisition offer, a closure. A closure is never a loss: the hero gets Product +, Leadership +, Reputation + and goes back to the market with a Founder title that some offers love.

## Reputation

A hidden 0–100 number shown as stars in the profile: grows with good reviews, conference talks, open source, blog, a startup; makes offers come more often and better; makes interviews easier. The **profile** (a page like a CV in the 💼 tab) lists the jobs, the skills, the portfolio and the talks — a nice thing to read in the Memoir.
