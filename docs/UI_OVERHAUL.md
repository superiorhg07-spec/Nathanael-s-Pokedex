# UI Overhaul Notes

The Nexus interface was redesigned around three ideas: clearer hierarchy, stronger game feedback, and a more coherent visual language across discovery, detail, analysis, team building, and battle.

## What changed

- Floating glass navigation with live field-link status.
- New grid/noise background treatment and stronger surface hierarchy.
- Larger, more editorial page headings and bento-style panels.
- More expressive Pokémon cards with better hover depth and spacing.
- Redesigned detail presentation with stronger visual stage treatment.
- Mobile bottom navigation for the main tools.
- Battle arena upgraded with a stadium-like sky, holographic floor, particles, type-reactive attack FX, and a more prominent command deck.
- Battle Pokémon now try to use a semantic 3D GLB animation when one is present. If the GLB has no relevant action animation, CSS choreography and animated 2D sprites still provide the attack/hit motion instead of leaving the model visually static.
- Search, compare, team, and battle controls retain the existing API-driven logic.

## Animation approach

`model-viewer` exposes the animations contained in a GLB through `availableAnimations`, and allows the application to select an animation by name with `animation-name` / the `animationName` property before calling `play()`. The application therefore inspects the loaded model and chooses an action-like animation when one exists. The fallback layer is intentionally independent of the model so the battle remains animated even when a model has only an idle animation or no embedded animation at all.

## Asset policy

PokéAPI remains the source of Pokémon data. PokeAPI's sprite repository provides official artwork and community animated Showdown GIF assets. 3D assets remain optional: a missing or non-animated 3D asset should never make the interface lose the 2D animated Pokémon visual.
