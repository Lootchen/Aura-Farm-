# Aura Farm — Product Direction v0.28

## Goal

The current target is not content volume. It is to move the vertical slice from “interesting prototype” toward a product-quality core that can justify real art, music production and broader content investment.

The working bar for the next milestone is roughly:

- instantly readable on a phone;
- distinctive in a short gameplay clip;
- satisfying with sound on;
- understandable without developer explanation;
- a run creates at least one memorable build;
- the player wants to retry after the summary;
- no major mobile friction such as latency ambiguity, accidental background loss or unreadable HUD.

## Market context

Mobile is a mature market where retention and engagement matter more than raw novelty alone. Sensor Tower’s 2025/2026 reports emphasize slower download growth, stronger focus on retention/live services, and the importance of high-quality experiences that keep existing players engaged.

This does **not** mean Aura Farm should build monetization/live ops now. It means the core loop has to be strong enough to support retention before adding those systems.

## Reference principles

### Arcaea

What matters:

- the playfield itself is part of the game’s identity;
- continuous arcs are visually unmistakable;
- gameplay, sound and story/world presentation reinforce each other.

Aura Farm translation:

- Slide must be readable as a physical musical object;
- the arena should be recognizable even with UI removed;
- AURI and the machine should feel like the same world as the mechanics.

Do not copy:

- lane/arc geometry;
- visual assets;
- story structure.

### Phigros

What matters:

- a laneless rhythm game can remain readable if its judgement language is strong;
- motion of the playfield can be identity rather than decoration;
- illustration/art direction strongly changes perceived product quality.

Aura Farm translation:

- preserve the unusual physical claw/projectile field instead of collapsing into standard lanes;
- keep judgement rules visible and geometric;
- make scene movement react to music without moving gameplay hitboxes deceptively.

### Rotaeno

What matters:

- “smartphone-first” input is marketable when the control method is native to the device;
- the physical action can become the product hook.

Aura Farm translation:

- thumb controls, Pointer Events, haptics and physical claws should feel intentionally mobile;
- TRACE/FOLLOW must eventually resolve into one control language that disappears from conscious thought.

### Cytus II

What matters:

- characters can organize music/content/world instead of being decorative mascots;
- strong character identity increases attachment to songs and progression.

Aura Farm translation:

- AURI should be an operator/field-tech tied to machine systems, modules and music;
- character reactions should communicate gameplay state;
- future characters/machines could represent musical/build identities.

### Muse Dash

What matters:

- character action can make rhythm feedback feel playful and physical;
- the game remains visually characterful while controls stay simple.

Aura Farm translation:

- AURI should visibly react to left/right input, FLOW, CHAIN, MISS and boss states;
- feedback should be expressive without covering the playfield.

### Vampire Survivors

What matters:

- repeated upgrade choices are easy to parse;
- committing to a smaller set of evolving tools creates build identity;
- experimentation and focused upgrade paths support replay.

Aura Farm translation:

- module offers should support continuation, discovery and synergy;
- avoid flat invisible percentages;
- duplicate modules should produce obvious stacking behavior.

### Balatro

What matters:

- run-changing items are the stars of the product;
- synergies are discoverable and memorable;
- physical presentation of objects gives abstract rules personality;
- the mobile version remaps interaction for touch instead of merely shrinking desktop UI.

Aura Farm translation:

- AURA MODULES should feel like hardware that changes rules;
- a module must communicate effect visually before requiring detailed reading;
- synergy completion should be visible before selection;
- build inspection must work on touch devices.

## v0.28 implementation principles

### HUD hierarchy

Priority:

1. combo / flow;
2. current musical section;
3. track progress;
4. act state / judgement;
5. score.

Score is important for mastery but should not occupy the same visual weight as information used during play.

### Bio-industrial glasshouse

The arena direction is:

- industrial arcade machine;
- synthesizer / reactor;
- glasshouse ribs;
- energy conduits that resemble growth;
- Aura as living musical energy;
- small botanical motifs rather than literal farming scenery.

The word “Farm” should mean cultivating systems/builds/music.

### Notes

Incoming Tap notes are energy seeds/capsules.

After physical claw contact they become projectiles.

This reinforces the core transformation:

**rhythm object → physical impact → persistent gameplay object**

### Slide

Slide remains experimental, but its presentation should be rhythm-readable:

- physical rail;
- frets on full beats;
- lighter half-beat markers;
- current catcher/gate;
- visible playable tolerance;
- Power Return reward always re-enters the field and has a guaranteed bounce.

### AURI

AURI is a field-tech living in the central cockpit.

Rules:

- never cover the primary playfield;
- react physically to left/right input;
- visor communicates emotion/state;
- sprout grows with installed modules/synergies;
- future art can replace the current vector rendering without rewriting state logic.

### AURA MODULES

Every module should communicate:

- family;
- behavior;
- current stack;
- synergy potential.

Offer logic should provide:

- one synergy finisher when available;
- one continuation of an existing family;
- one new route when possible.

Randomness remains, but the player can steer a build.

### Music

Track 01: **GLASSHOUSE CIRCUIT**

Architecture:

- authored 68-beat arrangement;
- six stems: drums, bass, harmony, lead, aura, boss;
- individual buses;
- light stereo placement;
- selective delay sends;
- master compression;
- smooth stem crossfades based on act/build;
- boss Phase 2 changes boss timbre;
- authored drum fills at musical transitions.

Future real audio stems can replace synthesizers without changing the run logic.

### Mobile quality

Required:

- interactive latency calibration;
- manual offset adjustment;
- safe background pause/resume;
- manual pause;
- inspectable build while paused;
- abandon run safely;
- safe-area-aware UI;
- controls outside important visual information.

## What not to build yet

Do not invest heavily in:

- gacha;
- battle passes;
- ad economy;
- premium currencies;
- backend leaderboards;
- large song library;
- multiple final characters;
- cosmetics store;
- heavy narrative production;
- user-generated content.

Those systems only become sensible after the vertical slice consistently creates replay desire.

## Gate to “6/10 viable”

The slice should pass these checks in repeated playtests:

### Feel

- Tap contact feels immediate.
- Power Return feels rewarding.
- explosions and CHAIN have clear impact hierarchy.
- no common action feels visually dead.

### Readability

- player can distinguish Tap, incoming seed, projectile, Power Orb, CHAIN opportunity and Slide at a glance.
- HUD can be understood peripherally.
- fingers do not cover essential information.

### Slide

- one Slide model clearly feels more intuitive than the other.
- rail/frets communicate motion without explanatory text.
- reward justifies the sustained input.

### Build

- player remembers at least one build after the run.
- module effects are visible.
- choices feel steerable rather than arbitrary.
- at least one synergy creates a “that was my build” moment.

### Music

- GLASSHOUSE CIRCUIT feels like a piece of music, not a metronome.
- the player notices that the mix changes over the run.
- SFX remain readable over dense stems.
- boss phase feels musically different.

### Identity

A short muted clip should still be recognizable as:

- physical claws;
- bio-industrial glasshouse;
- energy seeds/projectiles;
- AURI cockpit;
- module-based machine.

A short audio-only clip should have an identifiable melodic/rhythmic motif.

### Replay

After a completed run, the player should have a concrete reason to start again:

- improve Flow Rank;
- try a different module route;
- chase a synergy;
- improve Core break;
- test Daily seed;
- improve TRACE/FOLLOW.

## Next decisions after v0.28

1. Playtest on several real phones with headphones and speaker.
2. Compare TRACE vs FOLLOW using feel + local success data.
3. Choose one Slide direction.
4. Produce final AURI concept art/animation language.
5. Produce one professional audio version of GLASSHOUSE CIRCUIT using the existing six-stem contract.
6. Redraw the machine/arena with production assets while preserving hit geometry.
7. Expand the module pool only after current modules create distinct builds.
8. Only then prototype online Daily leaderboard / live content cadence.

## Sources used for market/reference review

- Sensor Tower — State of Mobile Gaming 2025 / State of Gaming 2026.
- Apple App Store listings for Arcaea, Cytus II, Rotaeno, Phigros, Muse Dash, Vampire Survivors and Balatro.
- Official Balatro press kit for current visual reference.

The goal is to extract product principles, not reproduce copyrighted assets or proprietary designs.
