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

Shield Notes deliberately add only one visual layer:

- four thin pale-cyan outer arc segments.

No extra body detail, icon, text, or permanent glow is added.

After break the ring disappears and the note returns to the normal minimal Tap appearance.

## Current authoring

11 Shield Notes are used in the v0.33 chart.

They are placed in later parts of musical phrases and after several Slide/Power Return opportunities so projectiles can prepare subsequent beats.

The opening pulse remains plain.

## Design target

The desired loop is:

> keep tapping to the music while the projectiles you created prepare later beats instead of removing them.

If playtests confirm this feels better, Shield Notes should become the default target type for authored CHAIN opportunities while ordinary unshielded notes remain available for destructive projectile interactions and build spectacle.
