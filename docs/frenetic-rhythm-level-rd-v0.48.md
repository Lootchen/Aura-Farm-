# Aura Farm — Frenetic Rhythm Level R&D v0.48

This document records the external research and implementation rules used to establish BLOOM OVERDRIVE as Aura Farm's benchmark song-level.

## Product question

The goal was not simply to make the soundtrack faster.

The production problem was:

> How can Aura Farm feel frenetic while continuous TRACE gestures, physics, incoming notes, visual effects and roguelite transitions remain readable and musically intentional?

## Research conclusions

### 1. The song can be the level

Rhythm Doctor's lead designer/composer describes a music-game song as the level itself: the track must introduce the gameplay-musical concept clearly and evolve it through variations. The team moves repeatedly between its music tools and level editor and plans an intensity graph for the full song.

Source:
https://www.gamedeveloper.com/design/using-medical-stories-and-heart-conditions-to-create-musical-challenges-in-rhythm-doctor

Aura Farm response:

- one flagship song contains seven authored level phases;
- chart difficulty follows the song's intensity graph;
- FRACTURE deliberately reduces density before SURGE/BLOOMCORE;
- Module Bay happens between composed phase cadences rather than after seven identical loops.

### 2. High BPM is useful only when the whole system is designed for it

Hi-Fi RUSH describes extensive iteration around input/hit synchronization and feeding beat information to world objects. The team also designed transitions in musical time, often starting/ending events at measure boundaries.

Sources:
https://www.unrealengine.com/developer-interviews/hi-fi-rush-was-inspired-by-shaun-of-the-dead-and-futurama
https://www2.unrealengine.com/developer-interviews/hi-fi-rush-was-inspired-by-shaun-of-the-dead-and-futurama

Aura Farm response:

- BLOOM OVERDRIVE uses 154 BPM;
- world effects consume absolute song beat data;
- structural visual moments use authored `songEvents`;
- phases use exact beat ranges;
- notes retain explicit setup/recovery rules even as density increases.

### 3. Intensity should be layered and smoothed

Metal: Hellsinger's composers authored multiple instrumentation gradations around the Fury system. The game adds/removes layers with smoothing so increased intensity does not sound discontinuous; higher tempo also makes the gameplay itself faster.

Source:
https://www.gamedeveloper.com/design/shredding-for-satan-how-i-metal-hellsinger-i-designed-fps-harmonies-in-hell

Aura Farm response:

- seven `actArrangements` progressively expose/boost stems;
- build choices still influence stem balance;
- Music Bus ducking creates impact space instead of constant loudness escalation;
- SURGE/BLOOMCORE increase chart density after a lower-density FRACTURE section.

### 4. Notes and song events are different authoring objects

The official Friday Night Funkin codebase exposes separate SongNoteData and SongEventData in its chart editor and song-load scripting. Song events can fire independently from notes.

Sources:
https://github.com/FunkinCrew/Funkin/blob/main/source/funkin/ui/debug/charting/ChartEditorState.hx
https://github.com/FunkinCrew/Funkin/blob/main/source/funkin/modding/events/ScriptEvent.hx

Aura Farm response:

- gameplay notes remain Tap/TRACE;
- `songEvents` independently direct sparse world/AURI/core moments;
- Chart Lab visualizes both systems;
- level-specific effects no longer need to be hardcoded against one song name.

### 5. Continuous gestures need setup and escape

Beat Saber mapping guidance emphasizes flow across sequences, enough preparation for larger movement changes and enough time to recover/reset; at high BPM there is less timing leeway.

Reference:
https://bsmg.wiki/mapping/intermediate-mapping.html

Aura Farm response:

- TRACE is treated as an occupied continuous gesture window;
- standard post-TRACE recovery defaults to 1 beat;
- BLOOM requires 0.75 beat pre-TRACE and 1 beat post-TRACE;
- exact-end Tap requirements are considered uncomfortable and flagged;
- deliberate multitouch remains possible only through an explicit authoring override.

## Benchmark target — BLOOM OVERDRIVE

### Musical form

- 154 BPM;
- 4/4;
- 16th-note authoring grid;
- 224 beats / 56 bars;
- ~87.27 seconds;
- bio-industrial breakbeat/electro;
- crystalline lead + airy Aura layer + mechanical drums + phone-readable harmonic bass.

### Seven phases

1. IGNITION — establish pulse.
2. PRESSURE — strengthen breakbeat.
3. GERMINATE — make melodic TRACE central.
4. CIRCUIT — connect rhythm and call/response.
5. FRACTURE — deliberate breakdown/recovery.
6. SURGE — high-density acceleration.
7. BLOOMCORE — boss/climax.

### Current gameplay density

- IGNITION: 17 events / ~1.36 events/s.
- PRESSURE: 17 / ~1.36.
- GERMINATE: 18 / ~1.44.
- CIRCUIT: 20 / ~1.60.
- FRACTURE: 15 / ~1.20.
- SURGE: 28 / ~2.25.
- BLOOMCORE: 32 / ~2.57.

Total: 147 authored events.

The point is not a monotonically rising number. FRACTURE creates contrast so the last two phases feel faster without requiring an extreme BPM.

## Readability engineering

Current Tap routes take roughly 2.46–2.52 seconds to travel at 275 px/s.

At 154 BPM, two beats last only about 0.78 seconds.

Therefore v0.48 separates:

- silent/visual pre-roll, calculated from actual route/TRACE lead needs;
- short audible count-in during only the last configured beats.

For BLOOM, the current required visual pre-roll is roughly 2.64 seconds.

## Acceptance criteria for future flagship songs

A standard song-level should not be promoted as production-ready unless:

- semantic sync validator passes;
- no accidental TRACE occupancy warning exists;
- TRACE setup/escape audit passes;
- density warnings are reviewed;
- section recovery is deliberate;
- each phase has a clear intensity role;
- structural VFX are song events rather than arbitrary timers;
- first obligations have enough physical travel time;
- important authored stems are actually audible in the runtime mix;
- mobile speaker translation is tested as well as headphones.

BLOOM OVERDRIVE is the first song intended to establish this contract.
