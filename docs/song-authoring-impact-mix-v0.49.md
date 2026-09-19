# Aura Farm — Song Authoring + Impact Mix v0.49

This document turns the v0.49 audio findings into a production contract for future Aura Farm song-levels.

## 1. Two audio timescales

Aura Farm should treat physical feedback and musical response as two related but different layers.

### Immediate physical layer

The player must hear the hit/collision at the instant it happens.

Use:

- a short filtered-noise transient;
- very short decay;
- modest level;
- little or no tonal identity;
- optional low-gain resonance tuned to the current song harmony.

Do not quantize this layer. It exists to make the claw, projectile, shield and collision feel physically connected to the input and simulation.

### Quantized musical layer

Semantic events can answer on the music grid:

- Shield Break;
- CHAIN;
- FLOW;
- module install;
- boss phase;
- boss break;
- song-level transitions.

This layer may use step / beat / bar quantization through the existing interactive cue system.

The result should feel like:

`action now -> physical transient now -> musical acknowledgement on the grid`

rather than:

`action now -> wait -> all feedback later`.

## 2. Why the old collision mix could sound detached

Before v0.49 several secondary gameplay sounds were strongly tonal and fixed in absolute frequency:

- explosions used fixed low pitches;
- shield breaks used fixed high pitches;
- bumpers used a fixed pitch;
- some Tap fallbacks used fixed left/right pitches.

Those pitches did not know which harmonic frame the song was currently playing. A collision could therefore introduce a conspicuous pitch unrelated to the root, lead or bass at that moment.

v0.49 replaces the most frequent physical collision sounds with:

1. a mostly non-tonal transient, which preserves impact without creating accidental harmony;
2. an optional, quieter resonance derived from the current song root.

This lets the collision read as part of the same machine without turning every physics interaction into a melodic note.

## 3. Per-song impact profile

A song can now tune its physical response through:

```json
"musicFeel": {
  "impactProfile": {
    "transientHz": 2350,
    "transientQ": 1.15,
    "transientGain": 0.039,
    "resonanceGain": 0.009,
    "sfxGain": 0.78,
    "collisionInterval": 7,
    "shieldInterval": 10,
    "chainInterval": 12,
    "bumperInterval": 3,
    "tapInterval": 0,
    "explosionInterval": 0,
    "powerInterval": -12
  }
}
```

Guideline:

- transient character defines material / physical identity;
- intervals define harmonic relationship;
- resonance should remain clearly quieter than the transient;
- semantic musical rewards still belong to `interactiveCues`, not the collision tail.

## 4. How to author stronger Aura Farm songs

Do not begin by filling a piano roll with notes. Begin with a level form.

### Step A — intensity graph first

Write the full-song tension curve before the detailed chart.

Each phase needs a job, for example:

`teach -> pressure -> motif -> flow -> valley -> surge -> climax`

A high-BPM song still needs a deliberate valley. Contrast creates perceived speed more effectively than permanent saturation.

### Step B — phrase table

For every 4–8 bar phrase, author five things together:

| Layer | Question |
| --- | --- |
| Rhythm | What groove/cell identifies this phrase? |
| Harmony/bass | Where is the stable pulse and where is the answer? |
| Lead/motif | Which fragment of the song identity appears here? |
| Gameplay | Tap, TRACE, Shield, CHAIN or recovery? |
| World | Does this phrase deserve a songEvent, or should it remain quiet? |

This prevents charting from becoming a second unrelated composition.

### Step C — one recognizable motif, many functions

Reuse the same interval/melodic identity across:

- lead;
- TRACE contour;
- CHAIN cue;
- module install;
- boss response;
- section transition.

Variation is encouraged, but the player should gradually learn the musical vocabulary of the run.

### Step D — call and response

A useful Aura Farm pattern is:

`song call -> player gesture -> physics response -> song/world answer`.

Examples:

- percussion phrase -> Tap pattern -> projectile collision -> short tuned resonance;
- lead pickup -> TRACE contour -> completion -> Aura answer;
- boss motif -> Shield sequence -> CHAIN -> boss cue.

The player should feel that gameplay completes phrases rather than merely sitting on top of them.

### Step E — horizontal form + vertical layers

Use both:

- horizontal progression: `levelPhases`, structural cadences, breakdowns, drops and songEvents;
- vertical intensity: `actArrangements`, stem exposure, brightness and drive.

Do not use extra notes as the only intensity control.

### Step F — TRACE owns time

TRACE is a continuous melodic gesture. Author the surrounding phrase around its occupied window.

For Standard:

- visible/capturable setup must be generous;
- no accidental mandatory Tap inside;
- preserve the configured pre-recovery;
- preserve at least the configured post-recovery;
- use the rail contour to describe an audible melodic gesture.

A faster song is not permission to remove the player's physical recovery.

## 5. Perceptual density, not BPM alone

Track at least:

- authored events per bar;
- events per second;
- TRACE occupied time;
- Shield cognitive load;
- left/right alternation;
- simultaneous visual effects;
- post-gesture recovery;
- phrase-level silence.

Two phrases with the same number of events can feel very different if one also contains a long TRACE, Shield reading and heavy VFX.

Future Chart Lab work should therefore add a perceptual-load lane instead of treating event count as the complete difficulty metric.

## 6. Song events

Keep notes and song events separate.

Notes answer:

> What must the player do?

Song events answer:

> What should the level/world do because the song reached this authored moment?

Good songEvent candidates:

- drop;
- re-entry;
- bloom;
- reactor burst;
- world pulse;
- AURI cue;
- boss warning;
- boss phase;
- core open;
- lighting or biome transition.

Song events should remain sparse enough that their arrival means something.

## 7. Mobile mix contract

The benchmark must work on phone speakers, not just headphones.

Rules:

- do not depend on sub-bass alone;
- bass needs an audible harmonic;
- transient definition should live in a phone-readable mid/high band;
- keep collision tails short;
- avoid stacking many fixed tonal SFX over lead phrases;
- micro-duck only when the event deserves foreground priority;
- test dense phases and quiet phases separately.

## 8. Upgrade/music integration

Cards should communicate three independent ideas instead of collapsing them into one badge:

1. acquisition state — NEW / UPGRADE / RESERVE;
2. family;
3. synergy opportunity.

The selected build should change the sound of the machine without muting the authored identity of the song.

Good future extensions:

- family-specific but song-tuned collision coloration;
- synergy-specific quantized responses;
- stronger audiovisual installation motif reuse;
- offer logic that weighs build coherence without making every roll deterministic.

## 9. Start-menu role

The menu should preview the run's musical structure rather than behave like a generic game launcher.

v0.49 adds a compact phase/intensity strip for songs with `levelPhases`.

Future menu polish should prefer:

- one strong song identity;
- visible BPM / style / phase curve;
- one dominant Run CTA;
- machine/build identity;
- restrained ambient animation.

Avoid adding more decorative panels unless they communicate gameplay or musical structure.

## 10. Production checklist for a benchmark song

A flagship song is not ready until:

- song schema passes;
- every chart passes semantic alignment;
- flow audit has zero unintended warnings;
- TRACE setup/escape is intentionally authored;
- phase-level density curve is reviewed;
- one recognizable motif connects music/gameplay/world;
- songEvents mark structural moments rather than arbitrary timers;
- impactProfile has been auditioned against dense and quiet sections;
- collision SFX do not form an accidental competing melody;
- phone-speaker translation is checked;
- the final two phases feel more intense because of composition, layering and gameplay, not only because there are more notes.

## Research references

- Rhythm Doctor — song/level composition and intensity planning:
  https://www.gamedeveloper.com/design/using-medical-stories-and-heart-conditions-to-create-musical-challenges-in-rhythm-doctor
- Hi-Fi RUSH — beat information distributed to gameplay/world objects:
  https://www.unrealengine.com/developer-interviews/hi-fi-rush-was-inspired-by-shaun-of-the-dead-and-futurama
- Metal: Hellsinger — intensity layers and smoothed musical escalation:
  https://www.gamedeveloper.com/design/shredding-for-satan-how-i-metal-hellsinger-i-designed-fps-harmonies-in-hell
- Friday Night Funkin official source — notes and events as separate chart objects:
  https://github.com/FunkinCrew/Funkin
- Audiokinetic Wwise — interactive music, transitions, ducking and transient/envelope concepts:
  https://www.audiokinetic.com/en/public-library/
- FMOD — rhythm-synchronized game audio / quantized music-event workflows:
  https://qa.fmod.com/
- MDN Web Audio API — filters, gain staging and dynamics primitives:
  https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
