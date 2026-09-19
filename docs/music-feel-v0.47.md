# Music Feel R&D — v0.47

This document records the production conclusions behind Aura Farm's Music Feel System.

## Core principle

Aura Farm should not treat music, notes, VFX and rewards as independent layers that happen to share a BPM.

The target is one musical machine:

```text
SONG FORM
  ↓
CHART PHRASE
  ↓
PLAYER ACTION
  ↓
IMMEDIATE FEEDBACK
  ↓
QUANTIZED MUSICAL RESPONSE
  ↓
WORLD / BUILD RESPONSE
```

## 1. Immediate judgement must remain immediate

Rhythm accuracy requires an immediate transient so the player can perceive early/late timing.

Aura Farm therefore does **not** delay the primary Tap/TRACE response to force it onto a future grid point.

Instead:

- primary feedback: immediate;
- optional resonance/stinger: quantized.

This preserves control while gaining musical integration.

## 2. Author phrases, not every transient

A soundtrack may contain more audible notes than should become gameplay.

Mapping every sound creates density without meaningful flow.

Aura Farm treats:

- Tap as a discrete accent/pulse;
- TRACE as a continuous melodic phrase;
- CHAIN as call/response or phrase continuation;
- Shield as a protected accent;
- empty space as deliberate recovery.

## 3. TRACE owns its gesture window

A standard chart should not place accidental Tap requirements inside an active TRACE.

Intentional multitouch must be marked explicitly with `allowDuringTrace`.

## 4. Repetition needs arrangement variation

One short composition repeated through seven acts fatigues quickly even if chart density changes.

The first solution is vertical reorchestration:

- early acts: reduced lead/Aura, softer brightness;
- middle acts: more harmonic/lead presence;
- late acts: full arrangement;
- boss: dedicated boss layer/cues.

Future versions can add alternate bars/segments for horizontal resequencing.

## 5. Use a recognizable motif

A short interval motif should survive transformations across:

- lead;
- Aura layer;
- CHAIN;
- module install;
- section cue;
- boss;
- menu/result feedback.

This creates identity without replaying a full melody every time.

## 6. Mobile mix translation

Sub-only bass is unreliable on small phone speakers.

Aura Farm keeps the sub but adds a controlled upper harmonic so bass rhythm remains audible on small playback systems.

The same principle applies to impact SFX: clarity/transient before raw loudness.

## 7. Ducking is preferable to loudness escalation

Important impacts should briefly make space in the music rather than simply becoming louder.

The Music Bus is ducked independently from the SFX Bus for Shield/CHAIN/boss cues.

## 8. Section changes are authored data

Gameplay code must never contain a list of one song's section names.

Each Song Package owns:

- section names;
- presentation state;
- section cue;
- motif;
- act arrangement;
- interactive cues.

## 9. Validation levels

A chart can be:

- schema-valid;
- rhythm/grid-valid;
- semantically synced;
- flow-safe.

These are different properties and the tools should display them separately.

## Reference directions used in the R&D

- Audiokinetic Wwise interactive-music documentation: vertical reorchestration, playlists, transitions and stingers.
- FMOD/Audiokinetic transition concepts: quantized transition points.
- Rez / Tetris Effect / Lumines design analyses: player action as a musical layer.
- osu! hitsound guidance: immediate attack for timing perception.
- Beat Saber mapping guidance: flow, sequence readability, density and avoiding overmapping.
- Web Audio scheduling documentation: `AudioContext.currentTime` and look-ahead scheduling.

These references inform system design principles only; Aura Farm does not copy their music, assets or charts.
