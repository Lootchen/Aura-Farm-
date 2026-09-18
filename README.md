# Aura Farm — Vertical Slice v0.28

**BUILD THE BEAT.**

Aura Farm is a mobile-first **rhythm-action roguelite / hybrid arcade** built around a physical rule:

> Rhythm object → claw contact → projectile → persistent interaction → build mutation.

v0.28 is a product-polish pass focused on readability, music, HUD, mobile feel, upgrades and identity.

## Current run

A full run has **7 acts**:

1. IGNITION
2. CURRENT
3. RELAY
4. OVERDRIVE
5. FRACTURE
6. ASCENT
7. AURA CORE

The chart grows from 26 base events to 41 in the final act while projectile speed and incoming-note speed remain constant.

Between acts 1–6 the player installs one **AURA MODULE**.

Act 7 is the two-phase AURA CORE encounter.

## Core gameplay

### Tap

- Tap is judged by physical claw contact.
- Contact = PERFECT.
- Missed physical contact = MISS.
- Successful notes remain in the arena as constant-speed projectiles.
- Projectiles interact with walls, bumpers, notes, other projectiles and AURA CORE.

### CHAIN

Groups marked by `chainGroup` communicate intended projectile interactions with:

- dashed connections;
- direction chevrons;
- a pulsing lead target;
- `CHAIN ×N` labels for larger opportunities.

CHAIN has escalating sound, haptics and impact feedback.

### Slide

Slide still compares two input models:

- **TRACE** — directly follow the rail with the fingertip.
- **FOLLOW** — move the claw with a free 2D virtual stick.

The visual language now includes:

- a physical rail;
- exact visible tolerance corridor;
- full-beat frets;
- lighter half-beat markers;
- a moving catcher/gate;
- direction indicators.

The final Slide direction no longer determines the reward trajectory.

### POWER RETURN

A successful Slide fires a Power Orb:

- upward and back into the active field;
- at constant speed;
- with **one guaranteed wall ricochet**;
- plus any additional Rebote stacks;
- Nova adds a wider Power fan;
- Espejo mirrors the return from the opposite claw.

The goal is for every Slide PERFECT to continue creating gameplay instead of dying against the nearest wall.

## AURI

AURI is the first character direction for Aura Farm.

She is a **field-tech/operator** integrated into the central cockpit between the two thumb controls.

Visual language:

- hood/helmet;
- expressive visor;
- side headset pods;
- suit core;
- sprout antenna.

AURI reacts to:

- left/right claw hits;
- FLOW;
- CHAIN;
- MISS;
- Slide;
- Shield;
- boss damage;
- victory.

Her cockpit physically leans toward the active side.

The sprout grows as the build grows and gains additional leaves from completed synergies.

The character remains outside the primary playfield so notes, Slide and boss geometry stay readable.

## Bio-industrial Glasshouse

The arena direction is now a **bio-industrial music machine**:

- mechanical chassis rails;
- glasshouse ribs;
- glass seams/reflections;
- growth conduits that wake with each act;
- machine cells;
- physical claws and actuators;
- energy-seed notes.

“Farm” is being interpreted as cultivating builds, energy and music rather than literal farming scenery.

## AURA MODULES

Upgrade choices are physical cartridges rather than generic cards.

Each module shows:

- serial number `AF-XX`;
- gameplay family;
- animated behavior preview;
- module name;
- effect;
- short description;
- stack state;
- synergy hint.

Current modules:

- Gemela
- Rebote
- Perfora
- Astillas
- Bumper
- Nova
- Espejo
- Relevo
- Shock
- Fusión
- Carga
- Duplicador
- Shield

### Build steering

Offers are no longer pure shuffle.

When possible, a set contains:

1. one module that completes a known synergy;
2. one continuation of an existing build family;
3. one new route.

Randomness remains, but the player can intentionally pursue a build.

### Current synergies

- PINBALL
- WALLSTORM
- CHAIN REACTOR
- TWIN NOVA
- NEEDLE STORM
- CORE BREAKER

Completing a synergy produces audiovisual feedback and can affect the music mix, but does not secretly add unrelated statistics.

## Build visibility

During gameplay a persistent Build Dock shows installed modules and stacks.

During module selection the full current build and descriptions are visible.

The end-of-run summary groups stacks and completed synergies.

A manual pause button opens **AURI · DIAGNOSTIC BAY**, where the full build can be inspected during a run.

## HUD v0.28

Gameplay HUD priority is now:

1. combo / FLOW;
2. current musical section;
3. song progress;
4. act and last judgement;
5. score.

The goal is to keep information used for playing visually stronger than information that only records results.

## Track 01 — GLASSHOUSE CIRCUIT

The vertical slice includes an authored composition in `src/music.js`.

- 110 BPM
- 68 beats
- 17 bars
- half-beat arrangement resolution

Musical sections:

**GERMINATE → SPROUT → CURRENT → RELAY → FRACTURE → OVERDRIVE → ASCENT → BLOOM → ROOT**

The arrangement has authored fills at major transitions.

### Six stems

1. DRUMS
2. BASS
3. HARMONY
4. LEAD
5. AURA
6. BOSS

Each stem has its own Web Audio bus.

The mix includes:

- light stereo placement;
- selective delay sends;
- master compression;
- smooth bus crossfades;
- build-sensitive lead/Aura intensity;
- boss stem activation;
- Phase 2 boss timbre.

The run changes the **mix of one composition** rather than transposing a generic loop.

A six-channel stem meter next to AURI visualizes the active mix.

The chart is validated against the music contract: **110 BPM / 68 beats**.

## AURA CORE

The final act has a physical two-phase boss.

### Phase 1

- three orbiting armor nodes;
- armor nodes are real collision targets;
- Core is shielded while any armor remains;
- projectiles hitting the protected Core physically reflect while preserving speed.

### Phase 2

At 50% Core health:

- armor reboots;
- orbital speed increases;
- boss stem/timbre changes;
- audiovisual feedback escalates.

Breaking the Core ends the encounter with a dedicated climax.

## Game feel

Impact has a hierarchy rather than one generic flash:

- Tap PERFECT
- high-combo PERFECT
- Slide PERFECT
- CHAIN
- Power explosion
- armor break
- Phase 2
- CORE BREAK

The game uses shake, flash, haptics, sound and AURI reaction while keeping simulation and music timing deterministic.

## Mobile-first systems

### Manual pause

The HUD contains a pause control.

Pausing:

- freezes the Web Audio master clock;
- preserves the current beat;
- opens build diagnostics;
- allows resume or safe run abandonment.

Backgrounding the app uses the same pause logic.

### Latency Lab

The start screen includes interactive latency calibration.

- 8 scheduled audio pulses;
- player taps to the **heard** clicks;
- nearest valid pulses are measured;
- median tap offset is calculated;
- the corrective offset is applied automatically;
- manual ±15 ms controls remain available.

Calibration is stored locally.

### Practice

`PRACTICE · 1 ACTO` provides a short test environment for Tap, TRACE and FOLLOW.

Practice:

- does not affect run unlocks;
- does not affect best score or Daily;
- records TRACE/FOLLOW attempts and successes;
- reports both ratios in the summary.

## First-run onboarding

AURI provides three short contextual prompts during the first session:

- physical Tap contact;
- Slide fret/rail rule;
- using Power Return to attack CHAIN groups.

After the guide is completed, it is stored locally and no longer shown automatically.

## Machines / cosmetic progression

- FORGE — initial
- PRISM — complete 1 run
- PULSE — complete 3 runs

Machines alter visual identity, not gameplay power.

The machine picker now shows physical mini-silhouettes rather than text-only choices.

## Run summary

The end screen includes:

- FLOW RANK;
- machine;
- track;
- score;
- PERFECT;
- CHAIN;
- MISS;
- Core damage;
- final build;
- synergies;
- unlocks.

FLOW RANK evaluates run execution from accuracy, max combo, CHAIN and Core damage. Practice uses TRACE/FOLLOW success instead.

## Daily

Daily Seed remains deterministic from the local date.

It stores a local Daily best and uses the same build/run systems.

No online leaderboard/backend exists yet.

## Local metrics

No analytics are sent to a server.

Local storage currently tracks:

- sessions;
- runs started/completed;
- Practice sessions;
- total CHAIN;
- TRACE attempts/success;
- FOLLOW attempts/success;
- best score;
- Daily best;
- calibration;
- selected machine;
- unlock progress;
- first-run tutorial completion.

## Physics rule

**Notes and projectiles move at constant velocity between collisions.**

No gameplay gravity, acceleration or easing is introduced by upgrades, Power Return or boss reflection.

## Brand asset

`assets/ui/aura-mark.svg` is an original Aura Farm mark combining:

- central Aura Core;
- two claw shapes;
- a sprout.

It is used on the boot screen and as the page icon.

## Product direction

The market/reference analysis and viability gate are documented in:

`docs/product-direction-v0.28.md`

Current reference principles were extracted from mobile rhythm and roguelite titles including Arcaea, Phigros, Rotaeno, Cytus II, Muse Dash, Vampire Survivors and Balatro. The goal is to learn product principles, not reproduce their copyrighted assets or proprietary designs.

## What v0.28 should validate

1. Does Tap feel immediate and physical?
2. Does POWER RETURN make Slide completion worth the sustained input?
3. Does TRACE or FOLLOW clearly feel more intuitive?
4. Can the player understand modules from previews without reading paragraphs?
5. Do module offers feel steerable?
6. Does the build remain readable during gameplay?
7. Does AURI add identity without obscuring gameplay?
8. Does GLASSHOUSE CIRCUIT feel like a song rather than a decorated metronome?
9. Is the changing stem mix noticeable?
10. Does the run ending create a concrete reason to replay?

## GitHub Pages

Source of truth: `main`.

https://lootchen.github.io/Aura-Farm-/
