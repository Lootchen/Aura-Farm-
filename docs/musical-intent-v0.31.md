# Aura Farm — Musical Intent System v0.31

## Principle

Gameplay figures should explain the music.

A note does not exist only because a beat exists. Every chart object states:

- which stem it represents;
- what musical function it serves;
- how important it is;
- which phrase it belongs to;
- whether continuous geometry should follow pitch.

## Required event metadata

```json
"music": {
  "stem": "lead",
  "intent": "phrase",
  "energy": 0.82,
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

Supported intents:

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

## Current chart

v0.31 contains 51 events.

All 51 events pass semantic validation and their declared stem is audible at the authored beat.

## Tap pattern language

### pulse / backbeat

Use a direct route.

This creates a stable physical rhythm foundation.

### response / pickup / resolve

Use the middle approach route.

These feel like movement toward/away from a phrase without becoming visually dramatic.

### fill / climax

Use the wide route.

These notes cross more of the arena because the music itself is structurally more active.

### syncopation

Uses middle or wide route according to authored energy.

### lead / aura register

When the intent does not already force a route, pitch register contributes:

- lower notes → direct
- middle register → middle
- high register → wide

This does not change timing or judgement.

## CHAIN

CHAIN groups are phrase IDs.

The visual group and the musical group are therefore the same concept.

Intro pulse events intentionally have no CHAIN group.

## Slide

A Slide with `contour: true` samples the authored lead/Aura pitch from `music.js`.

Pitch contour is converted to physical claw vectors.

Different melodies therefore create different physical rails.

## Energy

`energy 0..1` influences:

- visible/physical note radius
- haptic strength
- hit feedback strength
- AURI reaction intensity
- hit sound duration/volume

The same radius is used for drawing and collision.

## World response

A subtle environment envelope is derived from the closest half-beat.

- kick → chassis/glow pulse
- snare → secondary structural pulse
- lead → internal circuitry brightness
- aura → growth conduit/leaf brightness

The background responds; gameplay objects remain minimal.

## v0.31 phrasing changes

The chart gained 10 musically motivated events.

### GERMINATE

A second kick/snare bar establishes the core pulse before the lead enters.

### Transition fills

Additional events occur at authored fill positions:

- beat 15.5
- beat 31.5
- beat 47.5
- beat 63.5

These only appear at later acts where appropriate.

### AURA CORE

Two events at beats 66 and 67 complete the final boss phrase rather than ending the gameplay pattern halfway through the ROOT bar.

## Authoring checklist

Before adding an event:

1. Which stem is audible?
2. What function does this event have?
3. Which phrase owns it?
4. How much energy does it carry?
5. Does Tap or Slide best express that musical function?
6. If Tap: should its approach be direct, middle or wide?
7. If Slide: does the music contain enough continuity to justify the gesture?

If the author cannot answer those questions, the event should probably not exist.
