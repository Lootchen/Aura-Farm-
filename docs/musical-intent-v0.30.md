# Aura Farm — Musical Intent System v0.30

## Goal

The chart must explain the music through physical gestures.

A note should not exist only because a beat exists. Each gameplay object declares which musical layer it represents, what musical function it serves, how important it is, and which phrase it belongs to.

## Research principles applied

### Rotaeno

Rotaeno's level-design team describes chart design as a process of guiding the player into the physical motion the song needs at the appropriate musical moment. Their charts are repeatedly rewritten as the control language evolves.

Aura Farm translation:

- do not use Slide because "the chart needs a Slide";
- use Slide when a sustained melodic phrase justifies continuous physical motion;
- physical movement should teach musical structure.

### osu! timing / beatmapping

osu!'s official beatmapping documentation treats timing, musical sections, beat subdivisions and hitsounds as part of matching gameplay feedback to the structure of a song.

Aura Farm translation:

- every event belongs to a phrase;
- downbeats, backbeats, fills and syncopations should not all feel identical;
- hit feedback should reinforce the represented stem.

### Patterning research

Research on rhythm-game chart generation repeatedly identifies human-like patterning and beat-aligned musical structure as essential to chart quality.

Aura Farm translation:

- event-to-event relationships matter more than isolated note accuracy;
- CHAIN groups should represent musical phrases/fills;
- repeated patterns should have an audible reason.

## Chart schema

Every event now requires:

```json
"music": {
  "stem": "lead",
  "intent": "phrase",
  "energy": 0.78,
  "phrase": "ascent-line",
  "contour": true
}
```

### stem

Supported:

- `drums`
- `bass`
- `harmony`
- `lead`
- `aura`
- `boss`

The selected stem must actually contain audible material at that event's beat.

### intent

Supported:

- `pulse`
- `backbeat`
- `accent`
- `syncopation`
- `phrase`
- `fill`
- `response`
- `pickup`
- `resolve`
- `climax`

Intent is semantic authoring data. It is not extra decoration.

### energy

Range: `0..1`.

Energy currently affects:

- physical note radius;
- hit feedback strength;
- haptic strength;
- hit-sound duration/volume;
- AURI reaction intensity.

Because radius affects the actual hitbox as well as drawing, the rule remains "what you see is what is judged."

### phrase

A stable human-readable phrase ID.

Examples:

- `germinate-pulse`
- `spark-a`
- `current-release`
- `fracture-arc`
- `ascent-line`
- `core-fan`

Phrase IDs allow future systems to coordinate:

- CHAIN;
- background response;
- camera language;
- authored difficulty;
- analytics.

## Tap language

Tap represents discrete events:

- drum hits;
- bass attacks;
- short lead/aura accents;
- pickups;
- resolves.

Tap remains visually minimal.

The represented stem changes the hit sound:

- drums: percussive/side response;
- bass: pitch derived from the actual bass note;
- lead: pitch derived from the actual lead note;
- aura: pitch derived from the actual Aura note;
- boss: pitch derived from the boss stem.

## Slide language

Slide represents continuity.

A Slide should normally follow:

- lead;
- Aura;
- another sustained melodic voice.

### Musical contour

A Slide with:

```json
"contour": true
```

does not blindly use its fallback authored anchor shape.

At chart load, Aura Farm samples the real MIDI-like pitch values already authored in `music.js`.

The sampled pitch contour is converted to physical claw vectors.

For example:

- Track beat 8 Slide: lead contour `60 → 63 → 67 → 65 → 62`.
- Track beat 20 Slide: lead contour `67 → 65 → 60 → 58 → 53 → 56 → 60`.

These become different physical rails because the melodies are different.

Low/high pitch is mapped consistently to the claw's outer/inner arc so the gesture remains learnable rather than arbitrary.

## Glasshouse Circuit v0.30 chart pass

The current chart has 41 events.

All 41 events now have explicit musical intent metadata.

The first Slide was moved:

- old start: beat 6;
- new start: beat 8.

Reason:

At beat 6 the composition contains drums/bass but no lead. The first authored lead phrase begins at beat 8.

Therefore the old chart asked the player for a melodic continuous gesture before the composition supplied a melody.

The new Slide starts exactly at the lead entrance.

## Pattern hierarchy

### Pulses / backbeats

Use simple alternating Tap patterns.

### Melodic accents

Use Tap when the melodic event is short.

### Sustained phrases

Use Slide when continuity is audible and meaningful.

### Fills

Use denser CHAIN-capable groups.

### Climaxes

Use high-energy events, boss interactions and stronger feedback — not additional permanent visual detail.

## Authoring rule

Before adding any future event, answer:

1. Which stem is this?
2. What does it do musically?
3. Which phrase does it belong to?
4. How important is it?
5. Does its physical gesture express that function?

If those questions have no answer, the event probably should not be in the chart.

## Validation

`src/chart.js` rejects events without valid musical semantics.

For Slides, `music.contour` is only legal on `lead` or `aura`.

The game also keeps the existing 110 BPM / 68 beat song-chart contract.
