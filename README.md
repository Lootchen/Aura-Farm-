# Aura Farm — Vertical Slice v0.34

**BUILD THE BEAT.**

Aura Farm is a mobile-first rhythm-action roguelite built around one physical transformation:

> rhythm object → claw contact → projectile → persistent interaction → build mutation

v0.32 consolidates the prototype around a single Slide language, a more game-like front menu, tighter four-slot build scaling, and a cleaner prototype audio mix while preserving the music-driven chart work from v0.31.

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
