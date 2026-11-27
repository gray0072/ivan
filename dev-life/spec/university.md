# Dev Life — the university

Part of [SPEC.md](../SPEC.md). Chapter 1, *Hello, World*: four years of a bachelor's degree in computer science, September 2010 → June 2014, age 18–22 — classes, exams, the stipend, student jobs, the dorm, the internship, the thesis. The data lives in `data/university.js` (the subjects, the timetable, the stipend's rules, the student jobs), the rules in `sim/university.js`; the numbers in `constants.js`.

The university is the tutorial of the whole game: the routine with a fixed part (classes instead of a job's core hours), money that depends on how well the hero does (the stipend instead of a salary), the first trade-offs (study, a part-time job, friends, sleep), the first PC — at a gentler pace than the career, and with a clear rhythm of semesters and exam sessions.

## The calendar

| Months | What happens |
|---|---|
| September → December | The autumn semester: classes, labs, homework, a course project in the 2nd and 3rd years |
| January | The **exam session** (3–4 exams, about three weeks), then two weeks of winter holidays |
| February → May | The spring semester |
| June | The exam session (4–5 exams); in the 4th year the thesis defence instead |
| July → August | Summer: free time, a summer job, the internship (after the 3rd year), a trip with friends |

The 1st of September 2010 opens the game: the welcome card at the university's gate, the dorm room, the roommate.

## In the routine

- **Classes** are the fixed grey part of the weekday (like a job's core hours): 4–7 h by the timetable of the year (1st year the most, 4th the least). They can be **skipped** — the slider goes below the timetable: *attendance* falls, and with it the subjects' progress and, at some teachers, the right to sit the exam without a retake.
- **📚 Study hours** during a semester go to the semester's subjects — homework, labs, the course project, exam preparation. A slider *Uni ↔ own learning* splits them: the hero may spend part of them on a skill of their own choice ([career.md › Learning](career.md#learning)), at the cost of the grades.
- **The exam session** replaces classes with *exam preparation*: the routine suggests the *Session* preset (sleep 8 h, study 8 h, a walk, little else) and shows each exam's chance live as the sliders move.
- **Summer** has no classes: the free hours are all the player's.

## Subjects

Each semester has 4–6 subjects from `data/university.js`; each has a **progress** 0–100 that grows with attendance and study hours × Focus × Spark, and gives **skill XP** as it grows. The subjects are fixed by the year, the electives are chosen at the start of the 3rd and 4th years.

| Year | Subjects | Skills they feed |
|---|---|---|
| 1st | Programming basics, Calculus, Discrete maths, Computer architecture, English | Fundamentals, Hardware, English |
| 2nd | Algorithms & data structures, Operating systems, Databases, Object-oriented programming, Probability & statistics; **course project**: a small game or a database app | Fundamentals, Backend, Databases, Data & AI |
| 3rd | Networks, Software engineering, Web development, Security basics, **two electives** (Mobile, Machine learning, Computer graphics, Embedded systems, Game development); **team course project**: a web or mobile app with two classmates | Web frontend, Backend, Security, the electives' skill, Communication |
| 4th | Distributed systems, Project management, **two electives**, the **thesis** | DevOps & Cloud, Product & business, the thesis's skill |

The course projects and the thesis go into the hero's **portfolio** — what the first employers look at.

## Exams and grades

- An **exam** is a card in the session: the subject, its progress, the hero's Rest and Calm that day, and the chance of each grade in words (*Excellent likely*, *Good maybe*…). The player may choose to **sit it now** or **postpone it to the retake** (a week later, more preparation time, the stipend lost for the next semester).
- **Grades:** *Excellent* (5), *Good* (4), *Pass* (3), *Not passed*. The **average grade** (out of 5) is shown in the 🎓 tab and the birthday report.
- **A retake** comes two weeks later (in the holidays: the holidays are shorter); a second retake before the next semester's end. A subject still not passed after that is carried into the next year as a debt (it takes study hours); on **Hard** two such debts mean *repeat the year* (one more year, no stipend that year). Nobody is ever expelled: the worst outcome is a lost year.
- **The all-nighter** — a card the night before an exam when the subject's progress is low: *Stay up and cram* (the subject +10, Rest −−, the exam's chance −5 from tiredness — the card says it plainly: sleep helps memory) or *Sleep* (Rest +, the chance as it is). The player learns which works.
- **Cheat sheets** are not in the game.

## Money

The student's money has three sources and the game shows them as separate lines in 💰:

| Source | 2010 money / month | Rule |
|---|---|---|
| 🎓 **The stipend** | 60 base, 90 increased, 180 named | Paid every month of the semester that follows a session. **No stipend** after a session with a retake. **Base** after a session with Good and Pass. **Increased** (×1.5) after a session with all Excellent. **A named stipend** (×3) for a year, for an average of 4.8+ with a contest win, a published student paper or the department's research work |
| 🏠 **Parents' help** | 150 in the 1st year, −25 each year, none after graduation | Chosen at the start with the family's background (*Generous*: 250, *Modest*: 150 by default, *None*: 0, with the **social stipend** 60 regardless of grades and a dorm discount) |
| 💼 **A student job** | by the job (below) | Paid by the hours worked |

Expenses: the dorm (80), food (canteen 100 / cooking 80 / fast food 120), the phone, the student transport pass (half price), textbooks once a semester, going out. The first PC (about 600 for a sensible build in 2011–2012) is a big goal: about a year of saving from a student job — or less with a named stipend.

**Student discounts** are a small lesson: half-price transport, cheaper software (the free student licences of developer tools, a Codex card), a discount at the computer shop with the student card.

## Student jobs

A student job is a part-time job with its own hours in the routine (weekdays, evenings, weekends or summer only). Hours taken from study show at once as the grades' chances falling.

| Job | From | Pay (2010) | Hours | Gives |
|---|---|---|---|---|
| ☕ Café / waiter | 1st year | 300 for 15 h/week | Evenings, weekends | Communication +, Friends +, Energy − |
| 🚲 Courier on a bike | 1st year | 250 for 12 h/week, flexible | Any | Fitness ++, Rest − in winter |
| 📖 Tutoring school kids in maths | 1st year | 200 for 6 h/week | Evenings | Fundamentals +, Communication + |
| 🛠️ The university's IT help desk | 2nd year | 220 for 10 h/week | Between classes | Hardware ++ (fixing PCs; the Codex fills), a reference |
| 🌐 Small websites for local shops | 2nd year, Web 2+ | per gig, 100–400 | Side-project hours | Web frontend ++, portfolio, the first freelance cards |
| 🎮 Game tester | 2nd year | 180 for 10 h/week | Evenings | Spark ++, little else |
| 🔬 Lab assistant at the department | 3rd year, average 4.3+ | 150 + the named stipend's chance | 8 h/week | Data & AI or the elective's skill +, a published student paper *maybe* |
| ☀️ Summer job (any of the above full time) | summers | ×3 of the part-time pay | July–August | Money for the PC |

## Student life

Cards and choices of the four years (`data/events.js`, tagged *student*):

- **The dorm and Max.** The roommate is **Max**, the friend for life: shared dinners, his snoring (Rest − until earplugs), his parties (*Join* / *Sleep at a friend's* / *Ask him to stop*), his idea of a startup on the 4th year's spring (a small card; the real offer comes in a later chapter).
- **The first year's welcome week** — the student club's fair: pick up to two **clubs** (the **IT club** — talks, a first hackathon, Spark +; **sports** — free gym, football or running, Fitness +; **music / drama** — Mood +, Friends +; **the debate club** — Communication +). A club takes a fixed evening in the routine.
- **Programming contests** — a team of three (Max and a classmate) for the autumn regional round, from the 1st year: training hours in the routine, a contest weekend card; a good result gives Fundamentals ++, Reputation +, the named stipend's chance, and early internship offers. A win in the 3rd or 4th year sends the team to a final abroad (a trip card, the photo of the year).
- **Hackathons** — a weekend from the 2nd year: Rest −−, Spark +++, portfolio +, *a long shot* of a prize.
- **The student conference** — a talk about the course project (Communication ++, the first line in the profile's *Talks*).
- **The exchange semester abroad** — in the 3rd year, needs English 4 and an average of 4+: a semester in another country (the timetable there, a small exchange stipend, Spark +++, English ++, Friends here − and a new circle there); the semester's grades count at home.
- **The first love** — a classmate, a club's member or a friend of Max: the partner's meeting cards of [life.md › Partner](life.md#partner) can start here; a student relationship may end kindly (*we want different things* after graduation) or carry on.
- **Parties, trips and the student life's balance** — the dorm's parties, a summer trip with friends (money, Friends +++, the photo), a birthday in the dorm, the New Year after the winter session.
- **Moving out of the dorm** — from the 3rd year: a rented room with friends (more comfort, more money) is a choice.
- **Academic leave** — after a burnout, a long illness or a family reason: one semester paused (no classes, no stipend), the subjects wait.
- **Dropping out** — a button in the 🎓 tab with a confirmation: the hero leaves the university and starts working full time at once (offers by the skills, as in the career). Some offers want a diploma (enterprise, government, abroad, the AI labs): the comparison card shows *Diploma ✘*. The hero may come back any time to finish by **evening study** (two years, alongside a job). Not a loss, a different path.

## The internship

- In the **3rd year's spring** (2013), internship offers arrive as cards (two or three by the grades, the portfolio, the contests and the IT help desk's reference) — the first comparison card of the game: a big company's internship (paid well, strict, a good name in the profile), a startup's (paid less, more to learn, Spark +), the department's research project (unpaid but the named stipend and a paper).
- **The internship** runs over the **summer** (July–August, full time) with its own small *Intern* performance; a good one brings a card in September: **a part-time junior job** for the 4th year (16–20 h a week, a real salary, a company laptop) — and, at graduation, a **full-time offer**. A weak one ends with a kind reference.

## The thesis and the graduation

- **The topic** is chosen at the start of the 4th year by the direction (web, mobile, data, games, systems, hardware & embedded) — it feeds that skill and becomes the main item of the portfolio; **the supervisor** is a choice of two (*strict and helpful*: more hours asked, better result; *relaxed and busy*: less pressure, a weaker result).
- The thesis takes study hours from October to May; its **progress** sets the defence's chance.
- **The defence** (June 2014) is a card with a short presentation: the result by the progress and Communication; *Excellent*, *Good* or *Pass*.
- **The diploma:** an average of 4.75+ with an Excellent defence gives the **diploma with honours** (a line in the profile, a little more interest from some employers). The graduation party card (Friends, the photo of the year with the cap), the parents' visit.
- **After the diploma:** the career begins — the internship's full-time offer, or the job search with *Open to offers* switched on automatically. A **master's degree** (two years, 2014–2016, full time with a stipend or part time with a job) is a card at graduation: it opens research, the AI labs and some jobs abroad, and gives Fundamentals and the chosen skill a big push.

## Goals of the chapter

*Career:* **Graduate with a job offer in hand** · *Health:* **Keep Rest above 50 through every exam session** · *Life:* **Build your first PC** (from parts, with the stipend and a student job's money).

## The 🎓 tab

While the hero studies, the 💼 Career tab is the **🎓 University** tab: the semester's subjects with progress and attendance, the next exams with their chances, the average grade, the stipend's level now and what it will be after the session at the current pace, the student job, the clubs, the course project and the thesis, the internship offers; *Drop out* at the bottom. A part-time junior job in the 4th year adds its card above the subjects. After graduation the tab becomes 💼 Career; the university's record stays in the profile.
