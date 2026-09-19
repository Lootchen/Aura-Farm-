# Aura Farm — Product Roadmap / Market Thesis Execution

Status owner: prototype branch `main`  
Current baseline: v0.56  
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
- [x] **Readability budget:** adaptive pressure reduces non-critical trails, explosion particles and non-semantic impact voices while note/TRACE rendering keeps priority.
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
- [x] First higher-level mutation pass: Astillas LV2 gains ricochet / LV3 turns resonant fragments into Power; Relevo LV2 gains ricochet / LV3 turns Bloom relays into Power. Continue auditing the remaining modules.
- [x] Make card text describe the next actual outcome through `moduleLevelEffect`; future mutation pass must keep this contract.

### Draft quality
- [x] Offer logic includes synergy finisher, build continuation and new-family discovery.
- [x] Add explicit offer-role telemetry so playtests can show which type players pick.
- [ ] Ensure no run is forced into a designer-authored recipe.
- [ ] Synergy names should recognize emergent systems after they work, not be the only way to discover them.

### Chassis / machines
- [x] FORGE / PRISM / PULSE now have first-pass mechanical chassis tradeoffs.
- [x] Chassis alter play approach: FORGE rewards resonant wall termination with reduced aim range; PRISM rewards deliberate strong aim with wider steering + ricochet; PULSE shifts Resonance generation toward CHAIN/TRACE and reaches Bloom earlier.
- [x] Menu descriptions communicate the current chassis mechanic before selection.
- [ ] If chassis differentiation is not fun, demote the selector instead of adding more cosmetic machines.

## P2 — Make the song alter the physical problem

- [x] Prototype phase-specific physical topology in BLOOM: FRACTURE split membrane and SURGE conduit.
- [x] Incoming note / TRACE paths stay outside world collision logic; only launched projectiles interact with phase topology.
- [x] FRACTURE adds a central reflective membrane that changes routing and ricochet value.
- [x] SURGE replaces the blocker with a crossing conduit that adds projectile persistence; TRACE overcharges it.
- [x] BLOOM now authors `phase-world` events at FRACTURE beat 128 and SURGE beat 160 alongside phase world metadata.
- [x] TRACE rewrites phase topology for 8 beats: opens FRACTURE membrane or overcharges SURGE conduit.
- [ ] Shield-like mechanics expand the pattern “past physical action changes a future rhythmic obligation”.

## P3 — Boss as build exam

- [x] AURA CORE now adds a rotating route aperture: non-Power matter can earn route damage while Power and Resonance remain alternate efficiency paths.
- [ ] At least three build families must have visibly different effective approaches.
- [x] Boss geometry exposes a visible route aperture rotating every 4 beats; non-Power impacts through it gain +1 route damage.
- [x] Precision / Resonance can improve boss efficiency without making misses end the song.
- [x] Track Core damage source from projectile provenance (direct/twin/TRACE/chain/wall/fusion/fragment/bumper).
- [x] End screen explains the dominant Core damage path so players understand what their build actually did.

## P4 — Mastery, calibration and accessibility

- [x] Raw calibrated Tap timing error is recorded.
- [x] Run summary exposes center-rate / average timing bias.
- [x] Detect persistent early/late bias after 20+ taps and suggest a compensating calibration offset when |mean bias| >= 25 ms.
- [x] Keep valid-hit accessibility independent from Sync mastery: the ±160 ms Tap window is unchanged while ±45 ms center / timing diagnostics affect mastery feedback and Resonance, not hit validity.
- [x] Add opt-in SYNC AVANZADO summary: EARLY/CENTER/LATE, timing p95, frame p05 FPS, slow-frame rate and browser event-dispatch p95.
- [ ] Validate Bluetooth / speaker / wired audio paths on representative mobile devices.
- [ ] TRACE finger-occlusion test on small screens.
- [x] Haptics are fully optional via a persistent setting; gameplay logic never depends on vibration support.

## P5 — Readability / audio density budget

- [x] Count active projectiles, fragments, explosions and recent simultaneous impact voices; persist per-run peaks.
- [x] Define initial weighted density thresholds: visual pressure starts above weighted load 9 and reaches full pressure across +24 load; physical impact voice cap steps 5 -> 3 -> 2.
- [x] At high density, fade secondary trails and explosion particles before touching incoming notes / TRACE.
- [x] Limit non-semantic physical impact voice rate while Tap / Shield / CHAIN / Power cues bypass the drop budget.
- [x] Keep note silhouettes, receivers and TRACE rails outside the adaptive visual degradation path.
- [x] Instrument real frame-time/FPS under runtime density and browser event-dispatch delay for Tap/TRACE; correlate slow frames with high physical load.
- [ ] Run worst-case-build benchmarks on representative mobile hardware; browser dispatch is a proxy and does not replace end-to-end touch/audio latency measurement.
- [x] Add Chart Lab perceptual-load lane: per-bar score combines event density, TRACE occupancy, Shield pressure, CHAIN/physical potential and BPM.

## P6 — Meta progression and replay

- [ ] Progression is horizontal: new chassis / rule families / mutators / song-levels, not permanent damage inflation.
- [x] Daily is deterministic at the product level: fixed BLOOM song + date seed; offer shuffles use the seeded RNG while player choices can intentionally branch later drafts.
- [x] Create compact shareable result with native Web Share / clipboard fallback: date, song, Flow Rank, Sync, CHAIN, Resonance, Core, build and seed.
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

### v0.53 — current
- [x] Module role classification + draft-role telemetry landed early in v0.52.
- [x] Readability budget / projectile and audio voice pressure.
- [x] First level-2/3 module mutation pass (Astillas + Relevo).
- [x] Offer-role telemetry.
- [x] First chassis mechanics.
- [x] Persistent timing bias can suggest calibration offset.
- [ ] Playtest / tune density thresholds on worst-case builds.
- [ ] Continue mutation pass only where an added rule remains legible.

### v0.54 — completed implementation pass
- [x] BLOOM phase-specific arena mutation.
- [x] FRACTURE reflective split / SURGE conductive recombination.
- [x] TRACE-to-world consequence prototype (8-beat rewrite).
- [x] Boss route aperture rewards deliberate routing.
- [x] Core now supports three efficiency paths: Power, Resonance and Route.
- [ ] Playtest whether the membrane is perceived as a strategic obstacle instead of visual noise.
- [ ] Tune route aperture width after mobile playtest.

### v0.55 — completed implementation pass
- [x] Chart Lab perceptual LOAD audit.
- [x] LOAD lane visualizes per-bar pressure without turning estimated load into schema failure.
- [x] Validation panel reports LOAD average/peak and only warns at very high estimated pressure.
- [x] Daily share card / native share fallback.
- [x] Deterministic Daily now forces BLOOM without overwriting the player's normal selected-song preference.

### v0.56 — current
- [x] Haptics can be disabled persistently.
- [x] SYNC AVANZADO is opt-in and leaves the normal HUD clean.
- [x] Run diagnostics expose EARLY/CENTER/LATE and p95 timing error.
- [x] Raw frame-time telemetry preserves the existing physics delta clamp.
- [x] Slow frames are correlated with physical-density pressure.
- [x] Tap and TRACE record browser event-dispatch delay as a diagnostic proxy.
- [x] Share fallback only reports success after an actual copy path succeeds.
- [ ] Validate frame/input metrics on representative phones and Bluetooth/audio paths.

## Kill criteria

Remove or redesign a feature if:
- it adds UI explanation without adding a decision;
- it makes physical outcomes less predictable;
- it makes the beat harder to read for spectacle;
- it interrupts musical flow more than the decision is worth;
- it exists mainly to lengthen progression;
- testers cannot tell whether their action or RNG caused the result.

