# Aura Farm — Vertical Slice v0.32

**BUILD THE BEAT.**

Aura Farm is a mobile-first rhythm-action roguelite built around one physical transformation:

> rhythm object → claw contact → projectile → persistent interaction → build mutation

v0.32 consolidates the prototype around a single Slide language, a more game-like front menu, tighter four-slot build scaling, and a cleaner prototype audio mix while preserving the music-driven chart work from v0.31.

## v0.32 — lobby, TRACE and balance

### Game-like front menu

The old configuration-heavy start screen has been rebuilt as a real game lobby:

- AURI/track hero area
- dominant **INICIAR RUN** card
- Daily and Practice as secondary modes
- compact machine garage
- profile readout for BEST / RUNS / SLIDE
- latency and control explanations moved into **Ajustes**
- run summary now has a real **MENÚ** return action

The goal is hierarchy: start playing first, configure only when needed.

### TRACE is now the only Slide input

FOLLOW has been removed from the chart contract and active input path.

Slide now means:

> touch the rail head → drag directly along the rail → physical claw follows the traced position

All four authored Slides use `mode: "trace"`.

The bottom left/right touch zones remain Tap controls; they no longer steer Slide.

This removes the indirect/inverted joystick interpretation that made leftward movement feel unintuitive.

### Four-slot build balance pass

The 4 active / 4 reserve / LV3 structure remains, but explosive scaling is more controlled:

- Nova: **2 / 3 / 4** Power Orbs at LV1–3
- Astillas: **3 / 4 / 5** fragments at LV1–3
- Shock radius grows more gradually
- module gameplay previews now read the actual offered/current level

This keeps specialization powerful without making the arena unreadable too early.

### Prototype audio polish

The Web Audio version now includes:

- gentle master saturation before compression
- restrained reactive build percussion
- slightly clearer authored fills
- subtle harmonic section stingers at major transitions

This is still prototype audio. The next large audio jump should come from produced stems in a DAW while keeping the same six-bus contract.

## Module Bay 3.0

Upgrade cards now prioritize exactly three things:

1. **mini gameplay loop**
2. **module name**
3. **one-sentence description**

Normal cards no longer show family labels, serials or route jargon above the preview.

Only meaningful state badges remain:

- `LV2 / LV3`
- `SINERGIA · ...`
- `RESERVA`

### Real gameplay previews

The old abstract dots/lines have been replaced with miniature gameplay scenes rendered in Canvas.

The previews reuse Aura Farm's visual grammar:

- glasshouse arena
- real claw silhouette
- incoming Tap note
- PERFECT feedback
- launched projectiles
- walls
- bumpers
- CHAIN
- Slide rail
- Power Return
- shield response

Examples:

- Gemela: note → claw PERFECT → two projectiles.
- Rebote: PERFECT → projectile → wall → visible ricochet.
- Perfora: projectile crosses incoming targets with CHAIN · PERFORA.
- Astillas: projectile collision → explosion → fragments.
- Bumper: projectile physically reflects from a bumper.
- Nova: miniature Slide → POWER RETURN salvo.
- Espejo: Slide reward appears from both sides.
- Relevo: projectile moves through a linked CHAIN sequence.
- Shock: Power impact produces an AOE that removes nearby notes.
- Fusión: two real projectiles converge and detonate.
- Carga: Power projectile hits a wall and detonates.
- Duplicador: bumper contact creates the second projectile.
- Shield: a missed note is absorbed while the combo remains.

The goal is that a player can hide the title/description and still understand most of the module by watching the loop.

## Build system

v0.32 keeps:

- 4 active module slots
- 4 reserve slots
- module levels up to LV3
- duplicate modules upgrade existing modules
- fifth/new modules enter reserve when active slots are full
- swapping is allowed only between acts

Only active modules affect physics, synergies and music.

### Inspectable build

`BUILD · VER` opens **AURI · LOADOUT**.

The selected module now shows:

- the same animated gameplay preview used in Module Bay
- current level
- current level effect
- description
- active/reserve state
- available action between acts

Mid-song inspection remains read-only.

## Musical phrasing pass

The chart now contains **51 authored events**.

The 10 new events are not arbitrary density:

- four reinforce the initial kick/snare pulse before the first melodic Slide;
- four land exactly on written transition fills;
- two complete the final AURA CORE resolution bar.

## Phrase-aligned CHAIN

CHAIN groups now follow the same `music.phrase` IDs used by the song semantics.

Examples include:

- `spark-a`
- `current-answer`
- `relay-a`
- `overdrive-a`
- `finale`
- `core-fan`

A CHAIN should therefore represent an audible phrase/fill rather than a visually convenient cluster.

The introductory pulse is intentionally not treated as a CHAIN so the first bars remain easy to read.

## Music-driven Tap routes

Tap approach paths are selected from musical semantics.

### Direct route

Used mainly for:

- pulse
- backbeat
- low-energy bass

### Middle route

Used for:

- response
- pickup
- resolve
- medium melodic register

### Wide/cross-field route

Used for:

- fill
- climax
- strong syncopation
- high melodic register
- boss material

Current route distribution:

- 13 direct
- 20 middle
- 14 wide

The route changes how the note enters the arena, not its judgement rule.

## Slide musical contour

The four contour-enabled Slides still derive their physical rail from the actual lead/Aura pitch contour in `music.js`.

The first Slide begins at beat 8 because that is where the authored lead phrase actually begins.

## Music-driven world response

The environment now reacts to stems without making gameplay objects busier:

- kick lightly pulses chassis rails/glow;
- snare adds a smaller structural accent;
- lead opens the internal circuitry;
- Aura brightens growth conduits/leaves.

This follows the Art Bible rule:

> music moves the world, not the readability of the notes.

## Musical intent

Every chart event still requires:

- `stem`
- `intent`
- `energy`
- `phrase`

All 51 events currently declare a stem that is actually audible at that beat.

Supported intents remain:

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

## Existing visual direction

The Art Bible remains active:

`docs/art-bible-v1.md`

Primary gameplay remains minimal:

- Tap = ring / body / core
- projectile = simple bright ball
- Slide = clean rail / frets / catcher
- claw = strong silhouette
- environmental richness stays behind gameplay

## Existing run systems

v0.32 keeps:

- 7-act run
- AURI
- CHAIN
- POWER RETURN
- AURA CORE two-phase boss
- Practice
- Daily seed
- latency calibration
- safe manual/background pause
- Flow Rank
- six-stem GLASSHOUSE CIRCUIT mix
- active/reserve loadout
- constant-speed projectile physics

## Physics

Non-negotiable:

**notes and projectiles move at constant velocity between collisions.**

Music semantics can change approach path, radius and feedback strength, but do not introduce hidden acceleration or timing windows.

## What to test in v0.32

1. Do module previews finally look like Aura Farm gameplay instead of animated icons?
2. Can Gemela/Rebote/Perfora/Nova be understood without reading the description?
3. Is the simplified card layout easier to scan?
4. Is BUILD · VER useful during a real run?
5. Do fills and climax groups feel musically justified?
6. Does the first eight-beat pulse make the opening easier to understand?
7. Do direct/middle/wide note routes feel related to musical function?
8. Do kick/lead/Aura environmental reactions add cohesion without visual noise?
9. Does the chart feel less arbitrary than v0.30?

## Direction documents

- `docs/art-bible-v1.md`
- `docs/product-direction-v0.28.md`
- `docs/musical-intent-v0.32.md`

## Next production order

After v0.32 the next high-value work should be:

1. playtest and tune the now TRACE-only Slide for finger occlusion, grab radius and rail readability;
2. playtest the rebalanced 4-slot build economy and identify dominant/weak module combinations;
3. produce a professional audio/stem version of GLASSHOUSE CIRCUIT using the current six-bus contract;
4. create final AURI concept/animation language;
5. replace prototype arena vectors with production environmental assets while preserving geometry;
6. tune boss/CHAIN opportunities around the final produced music;
7. only then expand song/content volume or online systems.

## GitHub Pages

Source of truth: `main`.

https://lootchen.github.io/Aura-Farm-/
