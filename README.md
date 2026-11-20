# Leonida Trophy Guide

[![make.fun — gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/diablosan19/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/diablosan19/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline trophy guide and tracker for **Grand Theft Auto VI** on PlayStation 5, built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/c/gta6-trophy-guide-01).

## What it does

- **All 55 official trophies** — the full PlayStation list (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden) with each trophy's official name, description and grade, exactly as PlayStation publishes them and as listed by Exophase and PSNProfiles.
- **A guide for every trophy, in this entry's own words**, built from the official descriptions: what to do, where the counters live, and how long each grind really is. Every guide names its sources beside it — PSNProfiles, Exophase and PowerPyx's roadmap — because a cited guide beats an uncited one.
- **A ten-stage roadmap to the platinum** (`app/data/roadmap.json`): story chapters first, partner trophies while the duo travels together, a missable sweep before the point of no return, then the 100% grind, collectibles and crime cleanup in an order where nothing can lock you out.
- **Every missable flagged.** Twelve trophies are marked missable with the reason — the six stranger finales, the two partner trophies, and the one-off moments — and the roadmap gives them their own stage before the final mission.
- **A working tracker.** Tick trophies off as you earn them; progress persists in `localStorage`, the header meter tracks your percentage and per-grade counts, and progress can be **exported to a JSON file and imported back** on another browser.
- **Filters and search** by kind — story, missable, collectibles, activities, online & co-op, misc — plus earned/remaining views, and a **spoiler-protection setting** that hides the names and descriptions of story trophies until you earn them.

## Layout

- `app/` — the guide itself: static HTML, CSS and ES modules, no build step. Serve `app/` with any static file server and open `index.html`; it works fully offline and loads nothing from the network.
  - `app/data/trophies.json` — the 55 trophies with their guides, kinds, missable flags, counters and sources.
  - `app/data/roadmap.json` — the ten-stage roadmap.
  - `app/src/` — `guide-data.js` (data loading and shared predicates), `progress.js` (localStorage tracker, export/import), `render.js` (meter, list, detail panel, roadmap), `main.js` (bootstrap and wiring).
- `screenshots/` — four screenshots of the guide, described in `shots.json`; `shoot.mjs` re-takes them by serving `app/` locally and driving headless Chromium.
- `main.ts` — the hand-in program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored library in `vendor/` (left byte-for-byte as the kit ships it). Run it with `MAKEFUN_OUTPUT_DIR=out node main.ts`.
- `serve.ts` — a tiny local server for trying the guide in a browser.

## Notes on accuracy

Trophy names, descriptions and grades are official; hidden flags follow the published list's 28 hidden trophies. Guides are written from the official descriptions and the cited sources — where a description is deliberately vague (several hidden trophies are jokes), the guide says what can honestly be derived from it and flags the trophy "treat as missable" rather than inventing certainty.
