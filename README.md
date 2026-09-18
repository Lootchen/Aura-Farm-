# Aura Farm — Vertical Slice v0.43

**BUILD THE BEAT.**

Aura Farm is a mobile-first rhythm-action roguelite built around one physical transformation:

> rhythm object → claw contact → projectile → persistent interaction → build mutation

v0.32 consolidates the prototype around a single Slide language, a more game-like front menu, tighter four-slot build scaling, and a cleaner prototype audio mix while preserving the music-driven chart work from v0.31.

## v0.43 — Modular Song Package / Chart Sync Contract

Aura Farm no longer loads one hardcoded mechanics JSON beside a separately hardcoded composition.

The first real content package now lives at:

- `songs/index.json`
- `songs/glasshouse-circuit.json`

### One song package owns the timing contract

`glasshouse-circuit.json` contains:

- identity / title / artist;
- BPM and total beats;
- beats-per-bar and authoring resolution;
- count-in;
- semantic stems;
- procedural composition patterns and bars;
- one or more gameplay charts;
- all Tap / TRACE / Shield / CHAIN event data.

The old `charts/tap-lab.json` remains in the repository as a legacy snapshot but the runtime no longer loads it.

### Automatic song/chart validation

`src/song.js` validates a package before play:

- chart events must land on the song's declared rhythmic grid;
- Slides must fit inside the song and their anchor geometry must remain valid;
- event stems must exist in the song;
- composition patterns must match the declared bar resolution;
- bar count must exactly equal total song beats;
- every event's declared `music.stem` must actually be audible on that beat.

GLASSHOUSE CIRCUIT currently passes **51 / 51** alignment checks.

A bad package now fails before the run begins instead of silently drifting out of sync.

### Scheduler is song-driven

The Web Audio scheduler no longer assumes half-beats in code.

It now reads `stepsPerBeat` from the active song package, so future songs can choose a finer legal chart grid without rewriting the scheduler.

### Catalog

`songs/index.json` is now the content registry and future song-selector entry point.

Adding another supported procedural song is:

1. create its song JSON;
2. add it to `songs/index.json`;
3. pass loader validation.

No gameplay source edit should be required for the song's BPM, duration, patterns or chart timestamps.

See `docs/song-format-v1.md`.

## v0.42 — TRACE input hotfix / Reward Cards / Ambient polish

v0.42 fixes the remaining real-device TRACE capture failure and raises presentation without adding gameplay clutter.

### TRACE input hotfix

The invisible claw buttons sit above the canvas on mobile. Previous TRACE input listened only on the canvas, so a visually correct touch near the claw could be intercepted by the control overlay and never reach TRACE.

TRACE now listens at the app level in capture phase.

- direct touches on the moving TRACE head work even when the control overlay is under the finger;
- pressing the matching claw during the receive window also catches TRACE;
- claw catch is available from 0.40 s early through 0.52 s late;
- the captured pointer is reused for drag, with no second tap;
- the rail still begins on the authored beat when caught early;
- pickup radius increases to 112 px;
- rail tolerance increases to 40 px;
- disconnect grace increases to 0.28 s;
- required coverage decreases to 54%;
- capture and actual TRACE start now have separate feedback: `TRACE CAPTURADO · MANTÉN` then `TRACE ACTIVO · ARRASTRA`.

### Upgrade cards v2

The card layout keeps the large module emblem but gives gameplay proof substantially more room.

- cards are taller instead of leaving unused screen below them;
- the animated preview grows to 128–136 px;
- preview render resolution grows to 420×150;
- preview brightness/saturation are raised slightly;
- effect pills, titles and descriptions are larger;
- choosing a card dims competing choices and gives the installed module a short claim animation.

### Ambient presentation

- a broad stage arch and low cockpit reflection add depth behind gameplay without placing decoration in the central note lane;
- the main-menu reactor gains six slow ambient motes;
- the primary RUN card receives a slow restrained sheen;
- selected chassis gets a subtle premium glow;
- a light edge vignette focuses attention toward the playfield center.

## v0.41 — Presentation / Module Cards / Flowing TRACE

v0.41 applies a presentation pass informed by current mobile roguelite upgrade-selection patterns while preserving Aura Farm's own Living Circuit identity.

### Module cards

The animated gameplay preview is no longer the main visual hierarchy.

Each choice now presents:

1. a clear state badge (`NUEVO`, `MEJORA`, `SINERGIA` or `RESERVA`);
2. a large family-colored module emblem;
3. visible level pips;
4. family + module name;
5. one short effect promise;
6. supporting description;
7. a small animated `EN JUEGO` strip.

This keeps the useful preview but makes the upgrade understandable before the animation is interpreted.

### Main menu

The front menu now acts more like key art:

- larger hero area;
- animated Living Circuit reactor made from glass rings, petals and the Aura mark;
- stronger depth, lighting and material separation;
- more premium primary and secondary mode cards.

### Playfield background

A distant five-petal glasshouse canopy and reactor core now sit behind gameplay. Soft shafts and slow pollen motes add depth while staying behind note silhouettes.

### TRACE correction

The v0.39 pre-catch idea no longer parks the head at the claw.

- the incoming TRACE head moves continuously to the claw and reaches it on the authored beat;
- the input window still opens 1.05 s early;
- touching the moving head can arm the same pointer in advance;
- no second touch is required at the beat;
- pickup radius is 104 px, rail tolerance 38 px, disconnect grace 0.26 s and required coverage 56%;
- a subtle capture halo appears during the early-grab window but never stops the head.

## v0.40 — Living Circuit visual identity pass

v0.40 establishes a stronger shared material language without changing gameplay geometry.

The visual rule is now **dark ceramic + glass + bioluminescent living circuit**.

### World / build

- equipped modules feed low-contrast colored conduits from AURI into the glasshouse chassis;
- energy packets travel through those conduits on the beat;
- module cards, loadout slots and build chips share the same luminous family material;
- module-family colors now read as installed technologies instead of isolated UI accents.

### Gameplay assets

- launched projectiles gain paired luminous filaments, making them feel like energized seeds rather than plain balls;
- incoming Tap notes receive a restrained seed/sprout inner motif while preserving the standard circle silhouette;
- TRACE rails gain sparse moving light nodes that communicate current/flow without changing judged geometry;
- claws gain a bioluminescent internal vein and beat-reactive nodes;
- thumb controls gain a glass iris detail;
- bumpers are rebuilt visually as six-petal reactor flowers with an illuminated seed core.

### Principle

The foreground gameplay silhouettes remain unchanged. The thematic pass is expressed through material, internal energy and secondary motion so readability remains stronger than decoration.

## v0.39.1 — TRACE armed-state hotfix

v0.39 mixed pre-catch and active tracking into the same `started` state. That made early grabs visually convenient but input behavior fragile.

TRACE now has an explicit pre-start state:

- `incoming` — the head approaches the claw;
- `armed` — touching/holding the visible head before the beat reserves the same pointer without starting judgement;
- `tracing` — at the authored target beat, an armed held pointer automatically starts the rail.

Additional fixes:

- pre-start hit testing now follows the actual visible incoming head instead of always testing the future rail origin;
- releasing before the beat cleanly disarms the TRACE;
- holding through the beat requires no second tap;
- moving before the beat cannot pull the judged vector away from the rail origin;
- late pickup after the beat still starts TRACE directly.

The musical target time and rail geometry are unchanged.

## v0.39 — Visible Build / TRACE Pre-Catch

v0.39 addresses two real-device usability problems.

### Upgrades are now physically visible

Active modules are no longer represented only by tiny icon/level pills.

- the HUD build dock shows icon + short module name + level;
- the dock can scroll horizontally on narrow phones instead of hiding active information;
- four physical module sockets now live around AURI in the lower chassis;
- active sockets use each module family's color, icon and level dots;
- empty sockets remain visible so the four-slot build structure is obvious;
- installing or levelling a module now announces its actual gameplay effect, not only `ACTIVO`.

The gameplay-specific projectile effects remain unchanged, but the player can now always answer “what is installed?” without opening the manager.

### TRACE pre-catch

The previous visual timing was misleading: the incoming TRACE head reached the claw at the exact moment tracking began.

v0.39 separates arrival from execution:

- the TRACE head reaches the claw 0.65 s before its target beat;
- it stays docked there and pulses gold with a `MANTÉN` cue;
- the input window opens 0.86 s early and remains 0.50 s late;
- initial pickup radius grows to 92 px;
- rail tolerance grows to 36 px;
- disconnect grace grows to 0.24 s;
- required coverage drops to 58%;
- grabbing before the beat displays `TRACE ARMADO · MANTÉN Y PREPÁRATE`;
- actual rail scoring still starts on the authored target beat.

This changes reaction time and presentation, not the musical timing of the TRACE phrase.

## v0.38.1 — Compact Shield visual

The v0.38 hex cell proved readable but visually too dominant.

v0.38.1 keeps the full Shield mechanic and replaces only its visual shell:

- the large six-sided cell is removed;
- intact Shield uses a compact filled halo close to the Tap;
- three separated bright armor arcs communicate protection without changing the Tap silhouette;
- three small studs give the state a non-color cue;
- the inner Tap remains the dominant object;
- Shield Break uses three short fracture rays and brief warm exposed brackets;
- the break echo is shortened from 760 ms to 420 ms.

All v0.38 mechanics remain unchanged: one-hit protection, late-break grace, claw catch assist, projectile rules, tutorial and 15-note cadence.

## v0.38 — Shield System / Encapsulated Beat

v0.38 rebuilds Shield as a gameplay state instead of a decorative ring.

### Three readable states

1. **Encapsulated** — a large six-node glass cell surrounds the normal Tap.
2. **Break** — projectile contact fractures the cell outward without playing the generic destruction explosion.
3. **Exposed** — warm open brackets remain briefly around the intact Tap so the player reads “shield gone, beat still alive”.

The Tap body never disappears during Shield Break.

### Mechanical polish

- a Shield still absorbs exactly one projectile-derived hit;
- non-piercing projectiles are consumed on the Shield;
- Perfora spends one pierce and continues;
- Shock can break the capsule but cannot delete the authored Shield beat;
- subsequent projectiles pass through the already exposed beat until the player hits it;
- if a Shield breaks within 0.42 s of its target beat, the note receives 110 ms of extra miss grace and a 12 px claw catch assist;
- this late-break assist does not auto-hit the note and does not move the beat.

### Cadence

Blanket Shield authoring from v0.36.2 was too dense. The chart now uses 15 deliberate Shields instead of 21, clustered in learnable 2–3 note phrases while preserving ordinary targets for destructive projectile play.

### Teaching

The first Shield encounter now teaches the state in three steps:

- `ESCUDO = BEAT ENCAPSULADO`
- `TU BOLA ROMPE LA CÁPSULA · NO EL BEAT`
- `EXPUESTO = AHORA GOLPÉALO CON LA PINZA`

The first authored Shield also carries a temporary `ESCUDO` pointer during onboarding.

## v0.37 — Mobile playability / HUD / Module Bay

v0.37 is a mobile usability pass focused on the friction visible in real-device play.

### TRACE forgiveness

- start pickup radius grows from 58 to 82 design px;
- the start window grows from ±0.28 s to 0.42 s early / 0.38 s late;
- rail tolerance grows from 25 to 34 px;
- disconnect grace grows from 0.15 to 0.22 s;
- minimum successful coverage drops from 68% to 60%;
- the first accepted touch snaps to the authored rail head so grabbing TRACE feels intentional instead of pixel-perfect;
- the incoming TRACE head is larger and gets a pulsing pickup ring.

### Mobile HUD

The top HUD and build dock now prioritize phone readability over micro-technical styling:

- larger score, combo, act and status values;
- labels use the normal UI sans at readable sizes instead of tiny monospace;
- the pause control and build chips have larger touch/read areas;
- narrow-screen rules no longer shrink the important values below comfortable reading size.

### Module Bay on phones

Three narrow cards no longer compete in one row. On mobile, Module Bay becomes a horizontal snap carousel:

- each card uses roughly 82% of the screen width;
- previews grow to a 360×210 render surface and ~190 px displayed height;
- title, state badge and description are larger;
- cards snap one at a time while leaving a glimpse of the next choice.

### Gameplay previews

Preview loops run more slowly and communicate input causality more explicitly:

- Tap previews label the moment as `TAP · PERFECT → SHOT`;
- Slide previews use `TRACE · ARRASTRA` and a visible moving trace cursor;
- the goal is to make each card read as miniature gameplay rather than an abstract GIF.

## v0.36.2 — Shield readability hotfix

v0.36.2 fixes a rendering mistake in the previous membrane pass and increases Shield repetition so the rule can actually be learned during play.

- the Shield membrane now renders before the Tap body instead of using `destination-over` on an already opaque canvas;
- the membrane is larger, more filled, more luminous and has four bright structural nodes;
- the normal Tap remains crisp on top of the membrane;
- base CHAIN phrase notes now consistently use Shield while later `minAct` inserts remain available as ordinary destructive targets;
- authored Shield count rises from 11 to 21 of 47 Tap notes;
- opening GERMINATE remains entirely unshielded.

This is intentionally a stronger visual signal than v0.34. Shield changes the expected projectile outcome, so it must be unmistakable before collision.

## v0.36.1 — Visible build version

The lobby now exposes the current build number beside Settings.

The displayed value and the in-run debug label share the same `GAME_VERSION` constant so future releases do not silently lose the visible version identifier.

## v0.36 — Visual Identity / Living Machine

v0.36 adds world depth behind the established gameplay grammar instead of decorating the notes.

- distant glasshouse ribs give the playfield architectural scale;
- a buried segmented reactor sits behind gameplay at deliberately low contrast;
- reactor activation grows with act intensity, installed module power, lead and Aura activity;
- sparse condensation motion stays near the side glass instead of crossing the central judgement field;
- AURI now has quiet physical tethers into both control arms, with small beat-reactive nodes;
- all new world layers render behind Tap, Shield, TRACE, claws and projectiles.

This pass follows the Art Bible rule: gameplay remains simple in front while identity and musical life accumulate behind it.

## v0.35 — Contact / Game Feel

v0.35 keeps the simulation rules intact and strengthens the physical read of existing actions.

- a successful Tap now leaves a short launch ring around the newly created projectile, making the note-to-ball transformation explicit;
- wall ricochets and bumper contacts get a restrained local impact pulse instead of relying only on trajectory change;
- recent ricochets leave a short directional turquoise arc on the projectile;
- Shield Break gives AURI a dedicated reaction instead of reusing the generic hit mood;
- Shield Break adds a light high-frequency glass tick above the existing impact tone;
- all additions are visual/audio feedback only: projectile speed, note speed, collision rules and timing are unchanged.

The target is tactile causality: finger → claw → contact → projectile → world response.

## v0.34 — Readability / Shield Telegraphing

v0.34 turns Shield from a thin secondary ring into a clearly readable material state.

- intact Shield Notes sit inside a pale translucent membrane/halo;
- the normal Tap body remains unchanged inside the membrane;
- the membrane keeps four structural breaks so the state is readable beyond hue alone;
- on break, four short fragments expand outward while the original Tap visibly continues;
- the Shield tutorial now teaches survival explicitly: the membrane breaks, the beat remains;
- TRACE start pickup is slightly larger on mobile;
- the active TRACE exposes a short look-ahead segment beyond the fingertip without changing judged geometry;
- the chart validator now rejects every Slide mode except `trace`;
- remaining joystick language has been removed from chart validation.

The goal is to make the rule legible before impact: a player should recognise an armored beat in peripheral vision and understand why it survives a projectile.

## v0.33 — Shield Notes / Rhythm Relay

v0.33 adds a new note state designed to solve a core rhythm-action conflict:

> projectile interactions should create gameplay without deleting the beats the player was about to perform.

### Shield Notes

Selected Tap notes can now be authored with:

```json
"shield": true
```

A Shield Note has one restrained segmented outer ring.

The ring protects the note from projectiles and projectile-derived shockwaves. It does **not** protect the note from the player's claw.

The intended sequence is:

**Tap → projectile → break future shield → future note keeps travelling → player still taps it → new projectile**

This preserves rhythmic input while rewarding physical projectile routing.

### Armor break rules

When a projectile hits an intact Shield Note:

- the outer ring breaks;
- the note remains active;
- its original target beat does not change;
- the player must still hit it normally;
- the projectile is consumed unless it has Perfora;
- Perfora spends one pierce and continues.

After the ring breaks, that authored Shield Note becomes transparent to further projectiles until the player hits it. Multiple projectiles therefore cannot accidentally erase the preserved beat.

### CHAIN · BREAK

If the projectile and Shield Note belong to the same authored `music.phrase`, the break is counted as:

**CHAIN · BREAK**

This links the physical interaction to the musical phrase rather than treating every projectile collision as an equivalent event.

A non-matching projectile produces a normal **ARMOR BREAK**.

### Shock

Shock now respects the same rhythm-preservation rule:

- ordinary notes inside the AOE can still be removed;
- an intact Shield Note loses its ring;
- a prepared Shield Note remains for the player's Tap.

Its Module Bay preview now shows armored neighboring notes surviving after their shields break.

### Current chart

The current 51-event chart contains **11 Shield Notes** across:

- `spark-a`
- `current-answer`
- `relay-a`
- `overdrive-a`
- `bloom-fan`
- `finale`
- `core-fan`

The opening GERMINATE pulse remains unshielded to keep onboarding clean.

### Teaching

New players learn the rule during the first CHAIN section:

> **ESCUDO: TU BOLA ROMPE EL ARO · TÚ AÚN GOLPEAS LA NOTA**

Returning players who already completed the previous tutorial receive one contextual AURI explanation the first time a new Shield Note appears.

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
