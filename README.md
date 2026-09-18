# Aura Farm — Vertical Slice v0.30

**BUILD THE BEAT.**

Aura Farm is a mobile-first rhythm-action roguelite built around one physical transformation:

> rhythm object → claw contact → projectile → persistent interaction → build mutation

v0.30 focuses on two systems that were still underdeveloped: **loadout management** and **musical meaning in the chart**.

## Module Bay 2.0

Upgrade choices now follow a simpler hierarchy:

1. family / route state;
2. large animated gameplay preview;
3. module name;
4. one-sentence description.

The old CSS-only diagrams have been replaced by live Canvas micro-simulations.

Each visible preview demonstrates the mechanic itself:

- Gemela splits the shot;
- Rebote demonstrates a wall bounce;
- Perfora crosses targets;
- Astillas bursts into fragments;
- Bumper reflects a projectile;
- Nova expands a Power burst;
- Espejo shows symmetrical returns;
- Relevo travels through linked targets;
- Shock expands an AOE ring;
- Fusión collides two projectiles;
- Carga hits a wall and detonates;
- Duplicador splits after a bumper;
- Shield displays a protective field.

## Finite build

A run now has:

- **4 active module slots**
- **4 reserve slots**
- modules can reach **level 3** unless they are unique-rule modules.

Only active modules affect:

- projectile physics;
- arena objects;
- Slide rewards;
- synergies;
- music mix.

Reserve modules are owned but inactive.

### Duplicate modules

Choosing an already owned module upgrades it instead of consuming another slot.

Example:

`Rebote LV1 → Rebote LV2 → Rebote LV3`

The underlying physical rule stacks naturally.

### New fifth module

If all four active slots are occupied, a new module goes to reserve.

Before the next act, the Loadout Manager opens automatically so the player can decide whether to replace an active module.

## Build / Loadout Manager

The gameplay Build Dock now includes **VER**.

It opens:

**AURI · LOADOUT**

The player can inspect:

- 4 active slots;
- 4 reserve slots;
- module level;
- full description;
- active synergies.

During normal gameplay this view is read-only.

Changing modules is restricted to inter-act Module Bay decisions so pausing mid-song does not become optimal loadout micromanagement.

Between acts, reserve modules can:

- be equipped into an empty active slot;
- swap with an active module;
- receive future duplicate upgrades.

## Musical Intent System

Every chart event now states what part of the song it represents.

Required metadata:

```json
"music": {
  "stem": "lead",
  "intent": "phrase",
  "energy": 0.8,
  "phrase": "ascent-line",
  "contour": true
}
```

Supported stems:

- drums
- bass
- harmony
- lead
- aura
- boss

Supported musical intents:

- pulse
- backbeat
- accent
- syncopation
- phrase
- fill
- response
- pickup
- resolve
- climax

The full design is documented in:

`docs/musical-intent-v0.30.md`

## Musical geometry

Slide is no longer authored only as arbitrary joystick coordinates.

A Slide with `music.contour: true` samples the actual pitch sequence from `GLASSHOUSE CIRCUIT` and converts that contour into physical claw vectors.

Current examples:

- SPROUT Slide follows the lead phrase `60 → 63 → 67 → 65 → 62`.
- CURRENT Slide follows `67 → 65 → 60 → 58 → 53 → 56 → 60`.
- FRACTURE and ASCENT use their own authored melodic contours.

The fallback JSON anchors remain valid chart data, but the live geometry is rebuilt from the music for contour-enabled Slides.

## First Slide correction

The first Slide used to start at beat 6.

It now starts at **beat 8**.

Reason:

- beat 6 contains rhythm/bass;
- the authored lead enters at beat 8.

The game no longer asks for a melodic continuous gesture before the melody exists.

## Tap / musical semantics

Tap remains the discrete-event mechanic.

Its authored `energy` now affects:

- visible radius;
- real physical hitbox;
- hit feedback strength;
- haptic strength;
- AURI reaction;
- hit-sound volume/duration.

The represented stem affects the hit sound itself.

Lead/Aura/Bass/Boss events derive feedback pitch from the actual authored note at that beat.

Because visual radius and collision radius use the same value, the project principle remains:

**what you see is what is judged.**

## Chart validation

`src/chart.js` now rejects events with invalid or missing musical semantics.

All 41 current events have:

- a real stem;
- musical intent;
- energy;
- phrase identity.

An audit verifies that each event's declared stem actually contains material at that beat.

## Research direction

The charting approach follows principles observed in established rhythm-game production:

- physical gestures should be guided by musical structure;
- timing and sections are part of gameplay meaning, not just synchronization;
- human-like patterning matters as much as individual beat accuracy;
- sustained gestures should represent audible continuity.

Reference work included Rotaeno's official level-design discussion, osu!'s official beatmapping/timing documentation, and research on beat-aligned and pattern-focused chart generation.

The goal is to learn chart-design principles, not reproduce other games' proprietary layouts or assets.

## Existing v0.29 visual direction

The Art Bible remains active:

`docs/art-bible-v1.md`

Primary gameplay remains visually minimal:

- Tap = ring / body / core;
- projectiles = simple bright balls;
- Slide = clean rail / frets / catcher;
- claws = strong silhouettes;
- environmental richness lives behind gameplay.

World assets:

- `assets/world/glasshouse-far.svg`
- `assets/world/growth-bays.svg`

## Core systems retained

v0.30 keeps:

- 7-act run;
- AURI;
- CHAIN;
- POWER RETURN;
- AURA CORE two-phase boss;
- Practice;
- Daily seed;
- latency calibration;
- manual/background pause;
- Flow Rank;
- six-stem `GLASSHOUSE CIRCUIT` mix;
- constant-speed projectile physics.

## Physics

Non-negotiable:

**notes and projectiles move at constant velocity between collisions.**

Loadout changes rebuild rules for future interactions; they do not introduce acceleration or hidden timing modifiers.

## What to test in v0.30

1. Do the animated module previews explain the mechanic faster than the old cards?
2. Does 4 active + reserve create a real build identity?
3. Does upgrading an existing module feel preferable to collecting everything?
4. Is swapping modules between acts understandable without explanation?
5. Does the first Slide finally feel justified by the music?
6. Do melodic rises/falls feel connected to the Slide shape?
7. Do stronger musical accents feel physically stronger without looking busier?
8. Does the build still remain readable while gameplay stays minimal?

## Direction documents

- `docs/art-bible-v1.md`
- `docs/product-direction-v0.28.md`
- `docs/musical-intent-v0.30.md`

## GitHub Pages

Source of truth: `main`.

https://lootchen.github.io/Aura-Farm-/
