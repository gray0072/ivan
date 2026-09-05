# Browser Games Gallery

**Live: [gray0072.github.io/ivan](https://gray0072.github.io/ivan/)**

*[Читать на русском](README_RU.md)*

A small, growing gallery of self-contained browser games and experiments. Every project is a single static page — no build step, no framework, just open it and play.

## Projects

| Project | Description | Link |
|---|---|---|
| 1 - flight simulator | First-person arcade flight game: steer with the arrow keys, fire a twin-gun with Ctrl to pop balloons for points, and land on the highlighted airport's runway. | [Play](https://gray0072.github.io/ivan/1%20-%20flight%20simulator/) · [Source](1%20-%20flight%20simulator/) |

[![Flight simulator screenshot](1%20-%20flight%20simulator/screenshot.png)](1%20-%20flight%20simulator/)

## How it works

1. Open the [live gallery](https://gray0072.github.io/ivan/) or browse the folders in this repo.
2. Pick a project card.
3. Play directly in the browser — nothing to install.

## Tech stack

- HTML5 + CSS3
- Vanilla JavaScript (no frameworks, no bundler)
- Canvas 2D API for rendering
- Web Audio API for sound effects

## Getting started

```bash
git clone https://github.com/gray0072/ivan.git
cd ivan
```

Then just open any project's `index.html` directly in a browser, or serve the folder locally if you prefer:

```bash
npx serve .
```

## Build & deploy

There is no build step — every project is plain static HTML/CSS/JS. Deployment is GitHub Pages configured to serve directly from the `main` branch root:

**Settings → Pages → Deploy from a branch → `main` / `(root)`**

Pushing to `main` is the entire deploy process.

## Project structure

```
/
├── index.html                    # root gallery page
├── README.md
├── SPEC.md
├── 1 - flight simulator/
│   ├── index.html                # the game
│   ├── README.md                  # project docs (Russian)
│   └── screenshot.png
└── ... (more projects over time)
```

## Roadmap

- [ ] Add more mini-games/experiments
- [ ] Search/filter on the gallery page
- [ ] Light/dark toggle on the gallery page

## License

MIT
