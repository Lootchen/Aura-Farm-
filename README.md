# Aura Farm — Vertical Slice v0.29

**BUILD THE BEAT.**

Aura Farm is a mobile-first **rhythm-action roguelite / hybrid arcade** built around a physical transformation:

> rhythm object → claw contact → projectile → persistent interaction → build mutation.

v0.29 is the first strict **Art Bible pass**. No new core mechanic was added. The goal is to reduce visual noise in gameplay and move identity/detail into the world around it.

## Art direction

The current visual rule is:

> **Primary gameplay stays minimal. Environmental identity lives behind it.**

The full guide is stored in:

`docs/art-bible-v1.md`

Core tone:

**functional minimalism + bio-industrial music machine**

The target is clean, tactile, musical, kinetic, cultivated, strange and elegant — not generic neon sci-fi.

## Tap notes v0.29

Incoming Tap notes have been simplified to three readable layers:

- outer functional ring;
- dark body;
- bright core.

Removed from incoming notes:

- internal casing;
- decorative highlight;
- stacked inner rings;
- unnecessary glow.

After a successful claw contact, the note becomes a filled bright projectile. This makes the core rule readable without explanation:

**note → projectile**

Special projectile rules remain compact:

- Rebote: turquoise arc;
- Perfora: pink axis;
- Power: gold/white halo.

## Slide v0.29

Slide has been stripped back into one continuous musical object.

It now uses:

- dark physical rail;
- single colored edge;
- thin center line;
- full-beat fret bars;
- tiny half-beat dots;
- one catcher;
- visible judgement corridor.

Removed/reduced:

- large anchor circles;
- repeated direction arrows;
- multi-ring beat markers;
- redundant glow;
- active-mode badge after the Slide has begun.

POWER RETURN is unchanged:

- launches upward/back into the field;
- constant speed;
- one guaranteed ricochet;
- additional Rebote stacks apply.

## Claws and joysticks

Both input objects were simplified.

They retain physical silhouettes but use:

- one dark material;
- one functional accent;
- one restrained highlight;
- stronger light only while active.

The claws no longer rely on multiple overlapping mechanical ornaments to feel physical.

## Background layering

World detail is moving behind gameplay instead of being painted onto notes.

New original assets:

- `assets/world/glasshouse-far.svg`
- `assets/world/growth-bays.svg`

These provide:

- distant glasshouse architecture;
- side cultivation/growth bays;
- low-contrast machine silhouettes;
- subtle botanical geometry.

The Canvas layers them behind active gameplay.

Redundant procedural grid/dust/rib detail was reduced so the environment reads as structure rather than texture noise.

## “Farm”

Farm is not literal agriculture.

The current interpretation is:

- cultivate energy;
- cultivate builds;
- cultivate music;
- wake/grow a living machine.

The world uses sprouts, leaves, glasshouse architecture and growth conduits as recurring motifs.

## Aura Modules v0.29

The Module Bay has been simplified around one question:

> **Can I understand what this module does by watching it?**

Every option now prioritizes:

1. small family/route state;
2. large animated behavior preview;
3. module name;
4. short effect;
5. one-sentence description.

Removed from the visible hierarchy:

- serial numbers;
- decorative pseudo-technical text;
- extra synergy text block;
- heavy family-colored card surfaces;
- stripe/connector clutter.

Cards are now mostly neutral/dark. Family color is used as a small accent instead of saturating the full module.

Current choice states remain:

- SINERGIA · <name>
- TU RUTA
- NUEVA RUTA

The offer logic still attempts to provide a synergy finisher, build continuation and new route when possible.

## Stem letters

The small `D/B/H/L/A/X` meter was a development visualization for the six audio stems.

It is no longer shown during normal gameplay.

It remains available only in debug mode.

## AURI

AURI remains in the lower central cockpit between both thumb controls.

She continues to react to:

- left/right physical hits;
- FLOW;
- CHAIN;
- MISS;
- Slide;
- Shield;
- boss;
- victory.

Her sprout grows with the build and completed synergies.

## Track 01 — GLASSHOUSE CIRCUIT

The authored 68-beat / 110 BPM composition remains unchanged in structure.

Six stems:

1. drums;
2. bass;
3. harmony;
4. lead;
5. Aura;
6. boss.

The Web Audio mix uses:

- independent buses;
- light stereo placement;
- selective delay;
- master compression;
- smooth build/act crossfades;
- authored transition fills.

## HUD / mobile systems

v0.29 keeps:

- rhythm-first HUD hierarchy;
- build dock;
- manual pause;
- build diagnostic bay;
- safe background pause/resume;
- interactive 8-pulse Latency Lab;
- manual latency adjustment;
- Practice;
- Daily seed;
- Flow Rank;
- local metrics.

## Core run

A standard run still contains 7 acts:

1. IGNITION
2. CURRENT
3. RELAY
4. OVERDRIVE
5. FRACTURE
6. ASCENT
7. AURA CORE

AURA CORE still has:

- physical orbiting armor;
- protected-Core projectile reflection;
- Phase 2 armor reboot;
- final CORE BREAK.

## Physics

Non-negotiable:

**notes and projectiles move at constant velocity between collisions.**

No gameplay gravity, acceleration or easing is introduced by the visual pass.

## What to test in v0.29

The important questions are visual, not feature-count questions:

1. Are Tap notes immediately cleaner than v0.28?
2. Is note → projectile transformation easier to read?
3. Does Slide feel like one musical rail instead of many stacked widgets?
4. Do the claws/joysticks still feel physical after simplification?
5. Do the new background layers add identity without competing with gameplay?
6. Are Aura Modules easier to scan?
7. Does the animated preview teach the upgrade faster than text?
8. Does removing the stem letters reduce unexplained clutter?
9. Is the screen closer to “minimal but polished” than “busy sci-fi”?

## Direction documents

- `docs/art-bible-v1.md`
- `docs/product-direction-v0.28.md`

## GitHub Pages

Source of truth: `main`.

https://lootchen.github.io/Aura-Farm-/
