# Kavyasree Nunna — portfolio

A static, no-build site: plain HTML/CSS/JS, with Three.js loaded from a CDN.

## Run locally (phase 1)
```bash
python3 -m http.server 8000     # Windows: py -m http.server 8000
```
Then open http://localhost:8000. Any static server works; the page needs to be served over http(s) rather than opened as a file, because it uses ES modules.

## Editing content
**`js/content.js` holds every section as a list of blocks.** To add a paper, project, award or card, copy an existing entry in that list and edit it. The section grows on its own, and its animation re-lays itself to fit:
- Research: each paper's `memory` list becomes nodes in the memory graph beside its card
- Projects: the agents' patrol stretches with the section
- VAKAN: more plastic appears to collect as the section gets longer

Links (LinkedIn, repos, email, résumé) are in `js/config.js`; blocks refer to them by key.

## Where things live
- `index.html`: the sidebar plus empty section shells (`data-render="…"` slots)
- `js/render.js`: turns `content.js` into page blocks (one template per block type)
- `js/worlds.js`: Research memory graph and Projects agents (scroll-driven, like VAKAN)
- `js/ocean.js`: VAKAN robot and debris
- `js/particles.js`: `WORLDS` (colours and camera per world) and `SHAPES` (what the particles form)
- `js/main.js`: scroll blending, sidebar and pane button, re-layout on resize, count-ups, demos
- `css/style.css`: styling (clean sections, the immersive worlds, VAKAN)

## Deploy (phase 2)
See **DEPLOY.md** for step-by-step GitHub Pages instructions.
