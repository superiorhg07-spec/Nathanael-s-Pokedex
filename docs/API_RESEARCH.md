# API & Asset Research Notes

I checked several practical public/community sources before choosing the stack for this project. The selection below is intentionally small enough to keep the app understandable and reliable on GitHub Pages.

## 1. PokéAPI — primary data source

https://pokeapi.co/

Use:
- Pokémon resources for names, IDs, stats, types, abilities, sprites, moves, and cries.
- Pokémon Species for flavor text, genus, habitat, generation, and evolution references.
- Move resources for power, accuracy, priority, damage class and metadata.
- Type resources for type relationships.
- Generation resources for generation filtering.

Reason for keeping it as the main source: it is open, requires no authentication, and the documentation specifically recommends local caching and limiting request frequency. The app therefore uses an in-memory cache rather than repeatedly requesting the same resource.

## 2. PokeAPI/Sprites — visual assets

https://github.com/PokeAPI/sprites

Used for:
- official artwork
- sprites from multiple game generations
- animated assets where provided
- Pokémon Showdown-style animated GIFs in the `other/showdown` collection

The interface prefers an animated sprite first for cards and lets the user switch the main profile view between animated, artwork, and 3D.

## 3. PokeAPI/Cries — real Pokémon audio

https://github.com/PokeAPI/cries

Used for the profile cry button. The current Pokémon resource exposes `cries.latest` and `cries.legacy`, so the UI uses the API-provided latest cry and falls back to the public cry repository path when necessary.

No synthetic or AI-generated Pokémon voices are used in this project.

## 4. Pokémon 3D API — interactive 3D view

https://github.com/Pokemon-3D-api

https://pokemon-3d-api.onrender.com/v1/pokemon

This community project provides optimized GLB Pokémon models and a metadata API. The project documents support for generations 1–9 and form variants, and it is designed to work with Google's `<model-viewer>`.

The site requests models only when a Pokémon profile is opened. It does not bundle 1,300+ models into the repository. A GitHub raw-file URL is also kept as a fallback when the API index is unavailable.

This is an unofficial fan resource. It is not affiliated with Nintendo, Game Freak, or The Pokémon Company.

## 5. Pokémon Showdown — battle reference

https://github.com/smogon/pokemon-showdown

I reviewed the simulator documentation because it is a useful reference for turn resolution, move choices, switching and battle protocol. Its current simulator package is a Node.js API and is not intended to run directly in the browser, so it was not made a hard dependency of this GitHub Pages app.

## 6. Smogon Damage Calculator — mechanics reference

https://github.com/smogon/damage-calc

`@smogon/calc` can calculate Pokémon damage and has browser support through a bundled data layer. I treated it as a reference option rather than a required dependency here because the assignment is better served by keeping the demo self-contained and understandable. The battle system therefore uses a smaller local formula with STAB, type effectiveness, accuracy, critical hits, Speed/priority ordering, energy and status effects.

## 7. Pokémon TCG API — reviewed but not selected

https://docs.pokemontcg.io/

This was reviewed as another possible external source, but its documentation says the API is deprecated and new registrations are no longer available. It is therefore not part of the core app.

## Architecture decision

The final project uses:

`PokéAPI → core Pokémon data`

`PokeAPI/Sprites → animated + artwork assets`

`PokeAPI/Cries → Pokémon sounds`

`Pokémon 3D API → optional 3D models`

`Local React battle engine → GitHub Pages-compatible 3v3 gameplay`

The goal is to avoid turning a static university project into a multi-service backend application while still demonstrating multiple APIs, visual systems, data-driven UI, and interactive state changes.
