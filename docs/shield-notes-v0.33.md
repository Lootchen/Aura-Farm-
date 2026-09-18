# Aura Farm — Shield Notes v0.33

## Problem

The original projectile-vs-note rule could reward a strong build by deleting future notes before the player got to hit them.

That creates a conflict:

- the rhythm game asks the player to keep pressing to the music;
- the action system rewards projectiles for removing those same inputs.

Shield Notes resolve that conflict.

## Rule

A Tap event may include:

```json
"shield": true
```

This marks the event as a rhythm-preserving projectile target.

### Before break

- the note travels normally;
- a segmented outer ring communicates the shield;
- the claw can still hit it normally;
- the first projectile/shock interaction breaks the ring.

### After break

- the note keeps travelling toward exactly the same target beat;
- the player must still perform the Tap;
- further projectiles pass through it;
- projectile shockwaves do not delete it.

Once the player hits the note, it converts into a normal launched projectile and participates in physics like any other successful Tap.

## Projectile behavior

### Normal projectile

Breaks one shield and is consumed.

### Perfora

Breaks the shield, spends one pierce charge, and continues.

It remembers that it already passed that Shield Note so overlap on the next simulation frame cannot delete the preserved note.

### Shock

Breaks intact shields inside the AOE but never deletes a shield-authored note before its beat.

## Phrase logic

If:

```
projectile.chainGroup === target.chainGroup
```

the shield interaction is scored as **CHAIN · BREAK**.

Otherwise it is **ARMOR BREAK**.

This makes authored musical phrases and physical projectile routing part of the same rule.

## Visual language

Shield Notes deliberately preserve the normal Tap body but now add a readable material state behind it:

- a pale translucent membrane/halo larger than the Tap;
- four structural breaks in the membrane so the state is not communicated by hue alone;
- a restrained pulse that improves peripheral recognition without changing the judged object.

On break, the membrane fragments expand briefly while the normal Tap remains visibly intact and continues toward the same beat. The break animation is feedback only; the note trajectory and timing do not change.

## Current authoring

11 Shield Notes are used in the v0.33 chart.

They are placed in later parts of musical phrases and after several Slide/Power Return opportunities so projectiles can prepare subsequent beats.

The opening pulse remains plain.

## Design target

The desired loop is:

> keep tapping to the music while the projectiles you created prepare later beats instead of removing them.

If playtests confirm this feels better, Shield Notes should become the default target type for authored CHAIN opportunities while ordinary unshielded notes remain available for destructive projectile interactions and build spectacle.


## v0.36.2 readability correction

The first membrane implementation used `destination-over` after the opaque world had already been rendered. That could place most of the halo behind the existing canvas content and make it effectively invisible.

The corrected order is:

1. Shield membrane;
2. normal Tap body/core;
3. CHAIN markings and transient break feedback.

Base CHAIN phrase notes are now Shield-authored by default unless they are later-act `minAct` inserts. This increases repetition without removing all destructive projectile targets.


## v0.38 — Encapsulated Beat redesign

Shield is now treated as a three-state gameplay object rather than a ring modifier.

### Encapsulated

The intact state uses a filled six-node glass cell behind the standard Tap. The normal Tap remains visible and is still the player's claw target.

### Break

Projectile contact removes only the cell. The generic explosion effect was removed from Shield Break because it incorrectly communicated that the note had been destroyed.

The break instead uses six outward fracture rays, dedicated tones, haptics and a short screen veil.

### Exposed

After break, two warm open brackets briefly remain around the Tap. This state communicates that protection is gone while the beat remains active.

### Late-break fairness

A capsule broken within 0.42 s of its target beat receives:

- +110 ms miss grace;
- +12 px temporary claw collision assist.

This is a reaction buffer, not an auto-hit and not a timing shift.

### v0.38 chart cadence

Shield authoring is deliberately reduced from 21 to 15 Tap notes:

`14, 15, 17, 28, 29, 30, 42, 43, 44, 57, 59, 60, 62, 64.5, 66`.

The intent is repetition without blanket protection.


## v0.38.1 — compact visual shell

The six-sided v0.38 cell solved recognition but occupied too much visual space and competed with the Tap.

The intact state now uses:

- a compact translucent fill close to the Tap;
- three bright segmented armor arcs;
- three small anchor studs;
- one subtle inner support ring.

The exposed state keeps only a short three-ray fracture and two warm brackets for 420 ms.

No Shield mechanics changed in this patch.
