# Aura Farm — Product Roadmap / Market Thesis Execution

Status owner: prototype branch `main`  
Current baseline: v0.52  
North star: **every correct beat becomes physical matter; the build changes the laws of that matter; the song changes the problem those laws must solve.**

This roadmap exists to protect the product thesis from feature creep. A box is only checked when the mechanic is implemented and can be evaluated in play, not when it merely exists in documentation.

## Product success questions

A build is moving in the right direction when players can answer:

1. **Why did that CHAIN happen?** — causality is legible.
2. **What did you deliberately do differently to cause it?** — physics has agency.
3. **What was your build?** — modules are memorable as rules, not stats.
4. **Did the run feel like one song-level?** — musical flow survives the roguelite layer.
5. **What mechanical experiment do you want to try next run?** — replay motivation comes from hypotheses, not grind.

## P0 — Prove the core identity

These tasks are the highest priority. Do not expand content volume until these are stable.

- [x] Song package drives notes, music, world events and level phases.
- [x] Immediate physical SFX separated from quantized musical responses.
- [x] TRACE has setup / occupancy / recovery rules and semantic melodic contour.
- [x] Shield creates causal loop: projectile prepares a later rhythmic obligation.
- [x] Module cards are fast to compare and show state separately from synergy.
- [x] BLOOM is grouped into longer musical chapters so Module Bay no longer interrupts every phase.
- [x] Tap input has micro-direction without joystick or projectile speed changes.
- [x] Timing mastery records calibrated input error instead of treating every valid hit as information-equivalent.
- [x] **Resonance soft stake:** mastery changes the state of the machine without stopping the song.
- [x] **Causality instrumentation (initial):** CHAIN source, aimed-CHAIN count and Core damage source are recorded from projectile metadata.
- [ ] **Readability budget:** reduce non-critical trails / flashes / impact voices as physical density rises.
- [ ] Playtest gate: majority of testers can explain the cause of their best CHAIN.
- [ ] Playtest gate: players notice and intentionally use micro-direction.

### P0 acceptance gate

Do not add a large song/content batch until:
- players can predict at least some projectile outcomes;
- deliberate aim produces measurable differences;
- timing mastery is understandable without turning the game into a strict hardcore rhythm title;
- the 4-chapter BLOOM structure feels more continuous than the old 7-stop structure.

## P1 — Make builds change laws, not just quantities

### Module audit
- [x] Classify every module as **rule mutation**, **topology**, **conversion**, **multiplication**, **defense**, or **pure quantity**.
- [x] Preserve simple level-1 mutations; current v0.52 audit keeps existing rule-changing level-1 modules intact.
- [ ] Redesign weak higher levels so level 2/3 add a new interaction where practical instead of only `+1`.
- [x] Make card text describe the next actual outcome through `moduleLevelEffect`; future mutation pass must keep this contract.

### Draft quality
- [x] Offer logic includes synergy finisher, build continuation and new-family discovery.
- [x] Add explicit offer-role telemetry so playtests can show which type players pick.
- [ ] Ensure no run is forced into a designer-authored recipe.
- [ ] Synergy names should recognize emergent systems after they work, not be the only way to discover them.

### Chassis / machines
- [ ] FORGE / PRISM / PULSE become mechanical chassis with explicit tradeoffs.
- [ ] Chassis must alter how a player approaches the same song, not only colors/numbers.
- [ ] Menu descriptions communicate the tradeoff before selection.
- [ ] If chassis differentiation is not fun, demote the selector instead of adding more cosmetic machines.

## P2 — Make the song alter the physical problem

- [ ] Prototype one phase-specific physical topology change in BLOOM.
- [ ] Keep incoming note / TRACE readability isolated from environmental transformation.
- [ ] FRACTURE should alter the physical arena in a way that changes build value.
- [ ] SURGE should recombine / reactivate the arena rather than only increase density.
- [ ] Extend sparse `songEvents` to physical world state only where the musical event deserves it.
- [ ] TRACE completions can charge / redirect / rewrite one physical subsystem for the following phrase.
- [ ] Shield-like mechanics expand the pattern “past physical action changes a future rhythmic obligation”.

## P3 — Boss as build exam

- [ ] AURA CORE should test routing and build rules rather than only projectile throughput.
- [ ] At least three build families must have visibly different effective approaches.
- [ ] Boss geometry exposes windows that reward deliberate micro-direction.
- [x] Precision / Resonance can improve boss efficiency without making misses end the song.
- [x] Track Core damage source from projectile provenance (direct/twin/TRACE/chain/wall/fusion/fragment/bumper).
- [x] End screen explains the dominant Core damage path so players understand what their build actually did.

## P4 — Mastery, calibration and accessibility

- [x] Raw calibrated Tap timing error is recorded.
- [x] Run summary exposes center-rate / average timing bias.
- [ ] Detect persistent early/late bias and suggest calibration changes after enough samples.
- [ ] Separate “valid hit” accessibility window from advanced Sync mastery.
- [ ] Add optional advanced timing breakdown, not permanent judgement clutter.
- [ ] Validate Bluetooth / speaker / wired audio paths on representative mobile devices.
- [ ] TRACE finger-occlusion test on small screens.
- [ ] Haptics remain informative, never mandatory.

## P5 — Readability / audio density budget

- [ ] Count active projectiles, fragments, explosions and simultaneous impact voices.
- [ ] Define density thresholds.
- [ ] At high density, fade secondary trails before notes / TRACE lose contrast.
- [ ] Limit physical impact voice rate while preserving semantic cues.
- [ ] Keep note silhouettes, receivers and TRACE rails highest-priority.
- [ ] Profile FPS and input latency during worst-case build combinations.
- [ ] Add Chart Lab perceptual-load lane: event density + TRACE occupancy + Shield load + VFX load.

## P6 — Meta progression and replay

- [ ] Progression is horizontal: new chassis / rule families / mutators / song-levels, not permanent damage inflation.
- [ ] Daily remains deterministic and fair: same song, seed and offers.
- [ ] Create compact shareable Daily result: rank, Sync, CHAIN, build, Core result.
- [ ] Track “next-run intent” during playtests: players should want to try another mechanical hypothesis.
- [ ] Avoid currencies / trees unless they unlock decisions, not stat grind.

## P7 — Mobile market / commercial shape

Design assumptions to validate rather than blindly copy:
- [x] Portrait-first; phone is the instrument, not a port target.
- [ ] Test true one-hand / two-thumb comfort on representative phones.
- [ ] First 5 seconds of trailer can communicate beat -> projectile -> build mutation -> cascade.
- [ ] Validate premium/demo-first positioning before designing ad loops.
- [ ] Never interrupt a musical climax with interstitial monetization.
- [ ] Keep PC/Steam as a possible discovery / creator channel without compromising mobile-native controls.

## P8 — Production expansion gate

Only after P0–P5 are validated:
- [ ] Produce additional flagship songs using the proven physical grammar.
- [ ] Add new boss only after AURA CORE proves build-exam design.
- [ ] Add new chassis only after existing three are mechanically distinct.
- [ ] Expand cosmetics / visual production after readability budgets are measured.
- [ ] Add online leaderboards only when Daily scoring and calibration are trustworthy.

## Immediate implementation sequence

### v0.51 — completed thesis tests
- [x] Micro-direction from Tap position.
- [x] Calibrated Sync telemetry.
- [x] Four BLOOM chapters / three Module Bay drafts.
- [x] Preserve seven-phase musical progression underneath four gameplay chapters.

### v0.52 — current
- [x] Resonance state + HUD.
- [x] Precision Tap, TRACE, CHAIN and MISS feed Resonance.
- [x] Resonance changes a concrete physical outcome at AURA CORE.
- [x] End-of-run reports Resonance alongside Sync.
- [x] Add source metadata to spawned projectiles so future boss / causality telemetry can attribute outcomes.
- [x] First boss damage-source counters.

### v0.52 — current validation notes
- Resonance starts at 50 and never ends the song.
- centered Tap (±45 ms) gives the strongest Tap gain; valid off-center hits still gain less.
- TRACE and CHAIN recover Resonance; MISS drains it and Shield softens the loss.
- at Resonance 75+, centered/resonant matter deals +1 Core damage.
- the runtime records projectile provenance and exposes the dominant Core path in the run summary.
- next tuning question: does Resonance create useful tension without encouraging players to stare at the meter?

### v0.53 — next
- [x] Module role classification + draft-role telemetry landed early in v0.52.
- [ ] Readability budget / projectile and audio voice pressure.
- [ ] First level-2/3 module mutation pass.
- [ ] Offer-role telemetry.
- [ ] First chassis mechanics.

### v0.54 — next
- [ ] BLOOM phase-specific arena mutation.
- [ ] TRACE-to-world consequence prototype.
- [ ] Boss routing windows / family-specific effectiveness.

## Kill criteria

Remove or redesign a feature if:
- it adds UI explanation without adding a decision;
- it makes physical outcomes less predictable;
- it makes the beat harder to read for spectacle;
- it interrupts musical flow more than the decision is worth;
- it exists mainly to lengthen progression;
- testers cannot tell whether their action or RNG caused the result.

