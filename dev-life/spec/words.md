# Dev Life — plain words and hints

Part of [SPEC.md](../SPEC.md). How every text of the game is written so a **schoolkid of 10–12** understands it, and how the real words of the trade are still taught: the term marks, the bubbles, the 📖 Dictionary, the "Why?" taps, the rules for writers and translators. **Read it in full before writing or translating any text the player sees.** The data lives in `data/glossary.js` (with its RU and SV texts), the bubble and the Dictionary in `ui/glossary.js`, the checker in `tools/terms-check.js`.

## The idea

The game is about a real trade, so it uses real words — *stipend*, *junior*, *backend*, *mortgage*, *RAM*, *burnout* — because the player will meet them in life. But **no word is ever left unexplained**:

1. **Plain first.** A text says the thing in plain words, and the real word stands next to it: *"Money from the university for good grades — the **stipend**."* The plain words alone are enough to play.
2. **Every real word is a term** with a dotted underline; a tap (or a hover on a desktop) opens a **bubble** with one line of explanation, an example and **More** into the Dictionary.
3. **New words are noticed.** The first time a term appears, it sparkles ✨; with *New-word bubbles* on, the bubble opens by itself once.
4. **Every number can answer "Why?".** A meter, a money line, a chance, a part's number — a tap shows what it is made of and what it means for the hero.
5. **The words are a collection.** The 📖 Dictionary counts the words met and opened (*Words learned: 48 / 160*), like the Hardware Codex counts the parts.

## The bubble

```
 ┌────────────────────────────────────────────┐
 │ 🎓 Stipend                                  │
 │ Money the university pays you every month   │
 │ for studying well.                          │
 │ Example: all exams "Good" → 60 a month;     │
 │ a retake → nothing next semester.           │
 │                                   More ›    │
 └────────────────────────────────────────────┘
```

- **Opens** on a tap on the term (phones) or on hover after 400 ms and on a click (desktop); closes on a tap anywhere, on **Esc**, or when the card closes. Never covers the card's buttons: it opens above or below the term, whichever has room.
- **Holds:** the icon of the term's group, the term's name, the **short** text (one sentence, ≤ 15 words), an **example** or an **analogy** where it helps (≤ 25 words), **More ›** (opens the Dictionary at the term). The hardware terms' *More* opens their Hardware Codex card ([computer.md › The Hardware Codex](computer.md#the-hardware-codex)).
- **Never in buttons.** A button's label is always plain (*Take the job*, *Sit the exam*, *Save money*); its effects line under it explains what happens. Terms are marked in the card's text above the buttons.
- **Auto-open:** with *New-word bubbles* on, a term seen for the first time opens its bubble once, when its card or tab opens — at most **one** auto-bubble per card (the others only sparkle), never while the game runs at a speed (only on a paused card or an open tab).

## The 📖 Dictionary

Opened from the top bar's **📖** button, from **More ›** in a bubble and from the pause menu.

- **Groups:** 🎓 University · 💼 Work · 💰 Money · 💻 Programming · 🔧 Computer (links to the Hardware Codex) · ❤️ Health & mind · 🏠 Life.
- **Each entry:** the name (and the real word in English in RU and SV, where developers use it — *«Джуниор (junior)»*), the short text, the **long** text (≤ 60 words, plain), the example or analogy, **related** terms as links, and *where you met it* (the card or the tab, the date).
- **Era-aware:** a term enters the Dictionary when the game's year reaches it (*AI agent* not before 2025, *container* not before 2013); the Dictionary never spoils the future.
- **Search** by any language's name; **Words learned** counts the entries opened at least once; it is kept across lives with the Codex (`devLife.dictionary`).

## Why? everywhere

Every number with an arrow is a tap target that explains itself:

- **A meter** → its causes, biggest first, in plain words with their weekly size: *"Back & Eyes ▼: sitting 10 h a day (−6 a week), a stool instead of a chair (−4), no sport (−2). A chair would fix most of it."*
- **Money** → *"Spent more than earned this month: −120. Rent 450, food 180, the new keyboard 90…"*; big sums are compared with something known: *"≈ 2 months of rent"*, *"≈ 4 months of your stipend"*.
- **Percents** become amounts: *"+15 % salary = +450 a month"*.
- **Chances** are words with a bar: *likely* (≥ 70 %), *maybe* (35–69 %), *a long shot* (< 35 %); the exact number only in the tooltip on Medium and Hard.
- **A part's number** gets a "what it means for you" line: *"8 GB of memory (RAM): the code editor, a browser and a chat at once — tight once you start containers."*; *"An SSD: the computer starts in 15 seconds instead of 2 minutes."*
- **A skill level** gets its name and what it opens: *"Backend 5 — middle: you can build a shop's server by yourself; most junior jobs want 3."*

## Writing rules

For every text the player sees, in all three languages (`docs/languages.md` still applies):

- **Short.** A card's body is at most 3 sentences of at most ~15 words each. One idea per sentence. A tab's helper line is one sentence.
- **Plain first, then the term.** *"You can work from home (**remote**)."* Never a sentence that only makes sense if the term is known.
- **No abbreviation alone.** The first time on a card: *"graphics card (**GPU**)"*, *"a pay rise after a good **review**"*; later on the same card the short form is fine. The UI's tight places (a part's row in the shop) may use the abbreviation, always as a term.
- **Verbs on buttons**, the effects under them in icons and ▲▼; never *OK* where a real choice is made.
- **Concrete, not abstract.** *"You will get home at 19:30 instead of 18:00"* rather than *"The commute increases"*.
- **Kind and calm.** No sarcasm a child can take literally, no shaming (weight, grades, money), no fear words; bad news comes with what helps (*"Not passed this time. The retake is on 4 February — 6 more hours of study make it likely."*).
- **Adult topics simply.** A mortgage is *"a big loan from a bank to buy a home; you pay it back every month for many years, a little more than you borrowed"*; layoffs are *"the company lets many people go to save money; it is not about you"*.
- **Translations keep the plain style** and do not swap a plain word for jargon. In RU: *«предложение о работе»*, not *«оффер»*; *«младший разработчик»* with the term *«джуниор (junior)»*; *«стипендия»*, *«пересдача»*, *«сессия»* are plain Russian. In SV: *«studiebidrag»*-like everyday words, the English term in brackets only where Swedish developers use it.
- **Names of the trade's eras** (smartphones, the cloud, ChatGPT) are explained by what they did, not by what they are called: *"Chatbots that can write code arrived. Everyone is talking about them."*

## Term markup

Texts in `data/` and the UI mark terms explicitly, in every language's string, with the term's id:

- `[[stipend]]` — shows the term's name in the current language;
- `[[the stipend's|stipend]]` — shows the given words (for grammar: *«стипендию»*, *«стипендии»*), linked to the term `stipend`.

`ui/glossary.js` turns them into the underlined spans with the bubble; plain text with no markup is shown as it is. `tools/terms-check.js <folder>` (run with `tools/i18n-check.js` before committing) checks that:

- every `[[id]]` exists in `data/glossary.js` and has the name, the short and the long texts in EN, RU and SV;
- a translated string marks the same term ids as its English source;
- a short text is ≤ 15 words and a long one ≤ 60 (by the English);
- no term markup sits in a button's label;
- (a warning) a glossary term's English name appears unmarked in a card's text.

## The starting list of terms

About 160 terms; `data/glossary.js` is the source of truth. The groups and examples:

| Group | Terms |
|---|---|
| 🎓 University | semester, exam session, exam, retake, stipend (base, increased, named, social), average grade, elective, course project, lab, thesis, supervisor, defence, diploma, diploma with honours, bachelor's, master's, internship, academic leave, exchange semester, dorm, student job, programming contest, hackathon, club |
| 💼 Work | junior, middle, senior, lead, architect, manager, CTO, intern, job offer, interview, recruiter, stack, frontend, backend, full-stack, performance, review, raise, promotion, overtime, crunch, deadline, remote, hybrid, commute, notice period, severance, layoff, startup, founder, equity, freelance, portfolio, open source, own equipment (BYOD), company laptop, mentor, code review, bug, release, legacy code, team lead |
| 💰 Money | net salary (after taxes), budget, fixed costs, savings, savings account, interest, inflation, index fund, emergency fund, net worth, mortgage, down payment, installment, lifestyle creep, bonus |
| 💻 Programming | program, programming language, code, algorithm, data structure, framework, library, database, server, website, app, app store, API, cloud, container, DevOps, version control, machine learning, neural network, AI assistant, AI agent, open source, compiler, bug, test, security, password manager, two-factor login, phishing, backup |
| 🔧 Computer | CPU, core, GHz, RAM, GB, storage, HDD, SSD, NVMe, GPU, VRAM, motherboard, socket, PSU, watt, case, cooler, thermal paste, BIOS, XMP, dual channel, POST, monitor, refresh rate, laptop, UPS — each linked to its Hardware Codex card |
| ❤️ Health & mind | sleep debt, burnout, posture, ergonomics, the 20-20-20 rule, check-up, sick leave, physio, stress, inspiration (Spark) |
| 🏠 Life | rent, landlord, flatmate, parental leave, kindergarten, relocation, four-day week |

## Settings

- **New-word bubbles** On / Off (on by default on Easy and Medium, off on Hard; in the pause menu).
- **Simple mode** — hides the exact numbers behind the words everywhere (chances, percents, part numbers stay in the bubbles and *Why?* only) — on by default on Easy.
