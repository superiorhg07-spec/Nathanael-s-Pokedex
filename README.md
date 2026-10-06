# PokéDex NEXUS

PokéDex NEXUS is a React + Vite Pokémon project built for a university HCI/web assignment. I started from a smaller Pokédex and kept the useful parts: search, favorites, detailed profiles, stats, moves, evolution chains, light/dark mode, and GitHub Pages-friendly routing. The upgrade turns it into an interactive field system rather than a simple catalogue.

## What the site does

- Browse the indexed Pokémon catalogue up to the current PokéAPI generation range (Gen I–IX).
- Search by name or Pokédex number and combine search with generation/type filters.
- Open a full Pokémon profile with species information, flavor text, abilities, stats, moves, and evolution data.
- Switch between official artwork, animated sprites, and an interactive 3D model when a model is available.
- Play the Pokémon cry supplied by the Pokémon data/asset ecosystem. No AI-generated voices are used.
- Save favorites locally.
- Compare two Pokémon side-by-side.
- Use the type-effectiveness lab to test attacking and defending type combinations.
- Build a three-Pokémon team and save it in the browser.
- Enter a round-based 3v3 battle with four moves per Pokémon, energy costs, priority, Speed order, STAB, type effectiveness, accuracy, critical hits, simple status effects, switching, HP, and energy regeneration.
- Includes a few small Easter eggs. They are intentionally kept limited so they do not get in the way of the core project.

## Data and assets

### PokéAPI
Main source for Pokémon, species, moves, types, generations, abilities, evolution references, sprites and cries:

https://pokeapi.co/

https://pokeapi.co/docs/v2

### Pokémon sprite repository
Used for official artwork, animated/showdown sprites and other sprite variants:

https://github.com/PokeAPI/sprites

### Pokémon cries
The UI uses the cry URLs exposed by the Pokémon data when available, with the public PokéAPI cry repository as a fallback:

https://github.com/PokeAPI/cries

### 3D Pokémon API
The 3D viewer uses the community Pokémon 3D API when a model is available. Models are loaded on demand instead of bundling a huge model collection into this repository.

https://github.com/Pokemon-3D-api

https://pokemon-3d-api.onrender.com/v1/pokemon

This is an unofficial fan-made resource and is not affiliated with Nintendo, Game Freak, or The Pokémon Company.

### Battle logic
The battle mode in this project is a lightweight custom battle system for the assignment. It is not a full implementation of the official Pokémon game rules. The goal is to demonstrate interactive HCI, state changes, feedback, type logic, resource management, and a playable turn cycle without requiring a server.

## Why the project uses a custom browser battle

The official Pokémon Showdown simulator is a strong reference for battle mechanics, but its simulator package currently targets Node.js rather than directly running in a browser. For a GitHub Pages project, the battle here is therefore implemented locally in React so the assignment remains a static site with no backend requirement.

## Pages

- `/` — Discover / main Pokédex
- `/favorites` — Saved Pokémon
- `/pokemon/:name` — Full Pokémon profile
- `/compare` — Side-by-side comparison
- `/team` — 3v3 Team Builder
- `/battle` — 3v3 Battle Lab
- `/types` — Type Effectiveness Lab

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

The app uses `HashRouter` and `base: './'`, so the generated site can be hosted on GitHub Pages without server-side route rewriting.

For deployment, build the project and publish the generated `dist` folder through GitHub Pages (or use a GitHub Pages workflow from the repository).

## Project structure

```text
src/
├── api/              API access and caching
├── battle/           Local battle state and damage logic
├── components/       Reusable UI components
├── data/             Type-effectiveness data
├── hooks/            Local React hooks
├── pages/            Main application screens
├── App.jsx           Route definitions
├── config.js         API and app constants
├── utils.js          Formatting, storage and search helpers
├── main.jsx          React entry point
└── index.css         Global visual system
```

## API research

A more detailed record of the external sources I checked and why each one was selected or rejected is in `docs/API_RESEARCH.md`.

## Revision / reliability pass

The second revision focuses on the parts of the demo that are easiest to break during a live presentation. Search fields now provide keyboard-accessible Pokémon suggestions. Compare uses the same suggestion system, so both subjects can be selected without memorising exact names. The Battle page can now build a three-Pokémon team directly, rather than requiring the Team Builder as a separate prerequisite.

Several battle-state issues were also corrected. Battle Pokémon are now copied before a turn is resolved so HP, energy, status and fainted state reliably trigger React updates. A guaranteed Focus action prevents an energy deadlock, damage with a type multiplier of 0 correctly deals no damage, and the rival chooses moves with basic type-aware scoring. The battle setup also validates duplicate teams and incomplete opponent data before entering the arena.

The profile visual system now falls back to artwork when a 3D model cannot be loaded, while cry playback resets cleanly when the viewed Pokémon changes. API requests use shared in-memory caching without sharing an abortable fetch between unrelated pages, which prevents one screen cancelling a request needed by another.

## Notes for the lecturer

The project intentionally uses several data sources because the assignment allows APIs beyond a single Pokémon API. The main design goal was to make each interaction explain itself: a Pokémon card leads to a field profile, the profile leads to comparison or battle, the type lab explains a battle result, and the team builder becomes the bridge into the 3v3 arena.

The site stores favorites and the selected team in `localStorage`, so the demo works without a database. API calls are cached in memory and only made for the information needed by a given screen.


### Reliability repair
The API layer uses a shared cache for Pokémon, move, species, and model-index requests. Shared network requests are not cancelled when an individual React view unmounts; each caller can still cancel its own wait. This avoids the React development-mode mount/unmount cycle leaving the next screen with an aborted cached request. The catalogue request also leaves room for all current PokéAPI form entries so alternate forms can be searched.
