# Dev Life — the computer and the workplace

Part of [SPEC.md](../SPEC.md). The hero's computers, their parts, the shop, the assembly, the Hardware Codex, the company's equipment and the desk.

The computer is the game's teaching thread: over 30 years the player buys, upgrades and assembles PCs part by part and learns, without a lesson, what a socket, a DDR generation, an NVMe drive or a power supply's watts are — because a wrong choice does not fit or does not boot, and a right one makes the hero's life visibly faster.

## What the computer does in the game

A computer has five **performance numbers** computed from its parts (shown as bars with the part that limits each one):

| Number | From | Used for |
|---|---|---|
| ⚙️ **Build speed** | CPU (cores × speed by generation), storage speed | Work and side-project output at home, Focus (waiting for builds is Calm −) |
| 🧠 **Multitasking** | RAM size and speed | The IDE + browser + containers; below the year's need, Focus − and the DevOps learning speed halves |
| 💾 **Load speed** | Storage kind (HDD → SATA SSD → NVMe) | Start-up and project loads: a felt Mood and Focus effect, the most dramatic upgrade of the 2010s |
| 🎨 **Graphics** | GPU (and its VRAM) | Games (the hobby's Mood), multiple monitors, Data & AI learning from 2016, local AI from 2023, game dev |
| 🔇 **Quiet & cool** | Cooler, case airflow, PSU efficiency, fans | Calm (a loud PC is noise), the part's lifetime |

And **reliability**: every part ages; an old HDD can fail (the mishap card in [life.md](life.md#events)), an overloaded PSU can shut the PC down under load, a cheap PSU can take a part with it. A backup, a UPS and a good PSU make these cards harmless.

**The year's need** rises over time (`data/parts.js` has a *typical developer PC* per year): the same PC that was great in 2012 is slow in 2018 — the bars are drawn against the year's need, so "good" means good for now. Upgrading is never forced: a slow PC only costs Focus at home, learning speed and some job offers.

## Kinds of computer

- **The old laptop** (start, 2006): 2 cores, 2 GB DDR2, 160 GB HDD, built-in screen. Upgradable: RAM (to 4 GB), the HDD to an SSD (2011+, the first lesson — a huge felt jump).
- **A desktop PC** — the main path: bought ready (a shop's build: one price, a little more expensive, no assembly, less Hardware XP) or **assembled from parts** (cheaper, Hardware ++, the Codex fills, the hero is proud: Mood +).
- **A laptop** — portable (works at a café, on a trip, at the office on BYOD jobs), little upgradable (RAM and SSD in some models, nothing in later thin ones — the Codex explains "soldered RAM").
- **A Mac** — needed for iOS (Mobile) jobs and learning; a laptop or a desktop, not assembled; Apple Silicon from 2020 (a Codex card on ARM vs x86).
- **Company equipment** — a laptop or an office desktop by the job ([career.md › Jobs](career.md#jobs)); used for work hours only. A company laptop at home still needs the hero's desk, monitor and chair.
- **Later (invented, 2030+)**: compact AI workstations, a home server for the family, AR glasses as a monitor — marked *forecast*.

## The parts

Each part in `data/parts.js` has a name (see SPEC "Open questions" on real model names), a year from and a year to in the shop, a price curve (falls with age; spikes for GPUs in 2017–2018 and 2020–2021, for RAM in 2017 and in the AI era), the compatibility fields and the performance fields.

| Part | Compatibility fields | Teaches |
|---|---|---|
| **CPU** | Socket, generation, TDP (W), integrated graphics yes/no | Cores vs speed; a socket fits only its generations; "K" means unlockable; TDP sets the cooler |
| **Motherboard** | Socket, chipset, RAM kind and slots, max RAM, M.2 slots and their PCIe gen, PCIe x16 slots, form factor (ATX / mATX / ITX), BIOS version | The board connects everything; a newer CPU on an older board may need a BIOS update |
| **RAM** | Kind (DDR2/3/4/5), size per stick, speed, number of sticks | Dual channel (two sticks in the right slots, A2/B2), XMP/EXPO in the BIOS; more GB vs faster |
| **Storage** | HDD (SATA), SATA SSD, NVMe (M.2, PCIe gen), size | Spinning disk vs flash; the M.2 slot's gen; a system disk and a data disk |
| **GPU** | Length (mm), slot width, power (W), power connectors (6/8-pin, 12-pin later), VRAM | Many small cores; VRAM for AI; the GPU needs its own power cables |
| **PSU** | Watts, efficiency (80 Plus), connectors, modular | Total power + headroom; efficiency is heat and the electricity bill; a cheap PSU is a risk |
| **Case** | Form factor, max GPU length, max cooler height, fans, front panel ports | Airflow; does it all fit |
| **Cooler** | Socket brackets, TDP it handles, height; air or liquid | Thermal paste, heat, noise |
| **Fans** | Size, quiet | Air in at the front, out at the back |
| **Monitor(s)** | Size, resolution, refresh, panel, an arm mount | Pixels and eyes; two monitors for code; a monitor arm for posture |
| **Keyboard, mouse** | Kind (membrane, mechanical, ergonomic, vertical mouse) | Wrists and comfort (Back & Eyes) |
| **Headset, webcam, microphone** | — | Calls in the remote era: the job's impression |
| **UPS** | Watts, minutes | A power cut card made harmless |
| **External drive / NAS / cloud backup** | Size | Backups, the 3-2-1 rule |
| **Router / internet line** | Speed by year | Remote work, downloads; Wi-Fi vs a cable |

### Examples by year (the shop's typical choices)

| Year | A sensible developer's build | The big upgrade of the time |
|---|---|---|
| 2011 | 4-core CPU (2nd gen, the famous unlockable one), 8 GB DDR3, a 120 GB SATA SSD + 1 TB HDD, a mid GPU, 500 W | The first SSD |
| 2014 | 4-core, 16 GB DDR3, 256 GB SSD | 16 GB for VMs and containers |
| 2017 | 8-core (the new competitor's first gen), 16 GB DDR4, NVMe 500 GB | Many cores cheap; GPUs expensive (mining) |
| 2020 | 8–12 cores, 32 GB DDR4, NVMe 1 TB PCIe 4 | Shortage: GPUs out of stock, a waiting list card |
| 2023 | 12–16 cores, 32–64 GB DDR5, NVMe 2 TB, GPU with 12–16 GB VRAM | VRAM for local AI |
| 2026 | 64 GB, a GPU with 24 GB for AI work | Memory prices in the AI era |
| 2030+ | *forecast*: many-core CPUs with AI units, 128 GB+, compact AI boxes | Invented and labelled so |

## The shop

The 🖥️ PC & Desk tab: the hero's current machines with their bars, **Upgrade** (part by part) and **Build new** (a full build with a budget slider), plus the desk.

- Parts are shown in a list filtered by the slot, each with its price, its numbers, a **fit mark** (✔ fits / ⚠ fits with a condition: "needs a BIOS update", "needs a bigger PSU" / ✘ does not fit: "socket AM4, your board is LGA1151") and the **effect** on the bars as ▲▼ against the current part.
- **Hints:** *Recommended for my budget* — a sensible choice (the player may follow it and learn from the explanation), *Why?* opens the Codex card.
- **Quiz moments** — sometimes the shopkeeper asks a question before the checkout ("Which RAM fits this board? DDR3 / DDR4 / DDR5"): a right answer gives a 5 % discount and Hardware XP, a wrong one shows the answer kindly. Never on Easy unless switched on.
- **Used parts** (from 2013): cheaper, a little risk on reliability; selling old parts gives back a little money and a Codex line about reuse.
- **Delivery** takes 1–5 game days (longer in the 2020–2021 shortage); the box arrives as a small event in the scene.

## The assembly

When parts arrive for a new build (or a big upgrade), the **assembly view** opens (it can be postponed: the box waits in the room). It is a drag-and-drop mini-game on the open case seen from the side, with big snap zones for touch; each step has a one-line instruction and a 💡 that shows the step's Codex card.

1. **CPU into the socket** — match the golden triangle with the socket's mark; close the lever. (A wrong rotation does not snap.)
2. **Thermal paste** — a pea-sized dot (drag the tube; too little or too much shows a gentle warning, the temperatures will be worse).
3. **The cooler** on top; plug its fan into **CPU_FAN**.
4. **RAM** into the slots — with two sticks the board's slots A2 and B2 glow when the hero has read the manual (the *Manual* button), otherwise any two slots work but the *Dual channel* check in the BIOS says "single channel" and offers to move them.
5. **M.2 drive** into its slot, the screw (or a SATA drive into a bay with two cables).
6. **The motherboard** into the case (the stand-offs) — for a new build only.
7. **PSU** into its place; **the cables:** 24-pin to the board, 8-pin CPU power at the top, PCIe power to the GPU, SATA power to the SATA drives. A cable dragged to the wrong place does not snap.
8. **GPU** into the top PCIe x16 slot, the screws, its power.
9. **Front panel** pins (power switch, reset, LEDs) — the tiny fiddly step with a diagram; the 💡 calls it "the step everyone gets wrong".
10. **The first boot.** If something is missing, the PC does not start or beeps, and the game shows the **POST** result like a real board's debug LEDs (*CPU* / *DRAM* / *VGA* / *BOOT*) with a hint; the player fixes it and tries again — no part is ever damaged.
11. **The BIOS** — a simplified screen: check the temperatures, turn on **XMP/EXPO** (RAM speed ▲), set the boot drive; then the OS installs (a progress bar, faster with an NVMe).
12. **Done** — the new PC on the desk with its first-boot glow; the bars before and after; Hardware XP; *Built a PC with no hint* if no 💡 was opened.

Small upgrades (RAM, a drive, a GPU) use only their steps. On Easy the hints show from the start; on Hard only after a failed boot.

## The Hardware Codex

A collection of **cards** (`data/codex.js`), opened by buying, installing, a quiz or a mishap, kept across lives (`devLife.codex`). The computer's terms in the 📖 Dictionary ([words.md](words.md)) link here with **More ›**; the cards are written by the same plain-words rules. Each card: a drawing of the part, **what it does** in one sentence, **an analogy** a child understands, **the numbers** and what they mean, **a bit of history** (what changed from 2010 to now), **a tip**. Examples of analogies:

- **CPU** — the chef in a kitchen: GHz is how fast the chef works, cores are how many chefs.
- **RAM** — the kitchen table: the bigger it is, the more dishes can be prepared at once; when the power is off, the table is cleared.
- **Storage** — the pantry: an HDD is a pantry where a robot arm walks to each shelf, an SSD one where everything is at arm's reach.
- **GPU** — a thousand painters who each colour one pixel at the same time.
- **Motherboard** — the town's streets and the town hall: everything travels along it.
- **PSU** — the heart: pumps power to every part, and it should be a little stronger than needed.
- **Cooler and thermal paste** — the radiator and the thin layer that lets the heat flow out.
- **BIOS** — the switchboard that wakes everything up and checks it before the operating system takes over.

Topic cards beyond the parts: *Backups: the 3-2-1 rule*, *Passwords and two-factor login*, *Phishing*, *What a compiler does*, *Why my PC slows down over the years*, *ARM vs x86*, *Electricity: watts and your bill*, *Ergonomics: 20-20-20 and the monitor's height*, *How an AI model runs on a GPU*.

## Mining (2017–2018)

A history card in 2017: *"Your GPU could mine crypto while you sleep."* Choices: *Try it* — a small income for months, the GPU's life −, the electricity bill +, noise at night (Rest −), then the 2018 crash ends the income (a Codex card on the cost of electricity and what happened to GPU prices); *No thanks*. Nothing more speculative than that.

## The desk and the workplace

The workplace is drawn in the scene and in the **desk close-up**; it is the hero's daily environment, and its items act every hour at the desk:

| Item | Levels (by price and year) | Effect |
|---|---|---|
| **Desk** | Kitchen table → small desk → large desk → standing desk (2015+) | Back & Eyes; space for monitors; standing desk: Fitness + if used (the routine has *Stand* time) |
| **Chair** | Stool → cheap office chair → ergonomic chair → top ergonomic chair | Back & Eyes ++ — the best value item in the game, and the game lets the player find that out |
| **Monitor** | The laptop's screen → 22″ → 27″ → two monitors → ultrawide → AR glasses (*forecast*) | Focus, Back & Eyes (height, arm) |
| **Monitor arm / stand** | — | Back & Eyes + |
| **Keyboard & mouse** | Membrane → mechanical → ergonomic / split, vertical mouse | Back & Eyes (wrists), Mood (a mechanical keyboard's sound) |
| **Lamp & light** | Ceiling light → desk lamp → bias light → a window place | Eyes, Mood in winter |
| **Headphones** | Earbuds → closed → noise-cancelling | Focus in a noisy home and an open-space office |
| **Webcam & mic** (2020+) | Laptop's → good | The job's impression on calls |
| **Plants** | 0–3 | Mood +, Calm + |
| **Shelf with books** | — | Learning ×1.05 for the Books method, a decoration |
| **Whiteboard** | — | Side project Spark + |
| **Acoustic panels, rug** | — | Calm + in a loud home |
| **A door** | Only in a home with a study | Focus with kids at home |
| **Decor** | Posters, figures, RGB strips, a photo of the family, the cat's bed | Mood +; the family photo updates every year |

- **The workplace score** (a small number in the 🖥️ tab, *Comfort* and *Focus* stars) sums them; the bars say what would help most for the money ("A chair would help your back most: ▲▲ Back & Eyes for 250").
- **At the office** the company's desk is used during work hours (its quality is a field of the job); at home, the hero's own.
- **The look:** every item is drawn and placed on the desk in the scene, so the room visibly changes from a dorm corner with a laptop on books to a full home office with two monitors, a plant and a cat on the warm PC.
