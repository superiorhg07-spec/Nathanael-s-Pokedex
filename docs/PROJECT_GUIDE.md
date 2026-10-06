# Project Guide

## Main idea

This version keeps the original Pokédex structure but expands it into a set of connected interaction labs.

### Discover
The home screen loads the Pokémon catalogue, supports search, generation/type filters, sorting, pagination, featured entries and random discovery.

### Pokémon profile
`DetailPage.jsx` loads the Pokémon and species resources, evolution data, a set of move details and, when available, a 3D model URL. The user can move between artwork, animated sprites and 3D.

### Compare
`ComparePage.jsx` uses live autocomplete suggestions backed by the same National Dex catalogue as Discover. Each subject is resolved through PokéAPI and rendered with side-by-side stats and visuals.

### Team Builder
`TeamBuilderPage.jsx` saves three selected Pokémon to localStorage. The same team is loaded by the battle arena.

### Battle Lab
`BattlePage.jsx` can build a 3-Pokémon squad directly, then runs the battle entirely in the browser. Each active Pokémon has HP and an energy resource. A round resolves move priority, Speed, accuracy, damage, STAB, type effectiveness, critical hits, drain/recoil and a small set of status effects. Focus provides an emergency energy action, and a fainted active Pokémon is replaced automatically. State is copied before mutation so React always reflects the current battle state.

### Type Lab
`TypeLabPage.jsx` contains the defensive multiplier logic used by the battle system, presented as a separate teaching/analysis tool.

## Important files

- `src/api/pokeApi.js` — all network requests and the lightweight in-memory cache.
- `src/battle/engine.js` — battle state rules and damage resolution.
- `src/data/typeChart.js` — type matchup matrix used by Type Lab and Battle Lab.
- `src/components/PokemonVisual.jsx` — 3D / animated / artwork presentation switcher.
- `src/pages/DetailPage.jsx` — the most complete single-Pokémon screen.
- `src/pages/BattlePage.jsx` — the interactive 3v3 arena.
- `src/pages/TeamBuilderPage.jsx` — local team composition and analysis.
- `src/index.css` — the visual system and responsive layout.

## GitHub Pages consideration

`HashRouter` is used because GitHub Pages is static hosting and does not provide server-side route rewrites for client-side paths.

## Error handling

The API layer checks HTTP response status. Pages show readable error states instead of failing silently. The 3D viewer has a fallback model URL and the profile can still be viewed when the 3D service is unavailable.

## No AI-generated Pokémon voices

The project intentionally uses real Pokémon cry assets exposed by the API/asset repositories instead of generated voices. The AI component here is the interaction design and software logic, not synthetic Pokémon dialogue.

## Easter eggs

A few are intentionally subtle:

1. The Discover page highlights Deoxys and Giratina among its featured starting points.
2. Keyboard `/` focuses the main search field.
3. The random discovery button is a quick way to surface entries without using search.

They are kept small so the educational/demo features remain the center of the project.
