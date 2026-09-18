# Aura Farm Chart Lab v0.45

Chart Lab is the internal authoring surface for Aura Farm song packages.

Open `editor.html` directly or use **Ajustes → CHART LAB** from the game menu.

## Design goals

The editor follows four production rules:

1. author against an explicit rhythmic grid;
2. hear the song while placing gameplay;
3. keep song metadata, timing and charts in the same package;
4. fail loudly when gameplay claims to follow music that is not actually audible.

Established rhythm editors use the same broad ideas: grid-based placement, snapping, playback, JSON import/export, and clear separation between song metadata/timing and chart data.

## Screen layout

### Transport

The top transport exposes PLAY/PAUSE, STOP, current beat and current time.

Click the BEAT ruler in the timeline to seek.

### Timeline lanes

- **MUSIC** shows procedural stem activity or the decoded waveform for file-backed songs.
- **TAP L** contains left Tap events.
- **TAP R** contains right Tap events.
- **TRACE** contains Slide/TRACE phrases.

Shield is rendered as an outer ring around a Tap.

CHAIN membership is rendered as a small gold marker.

Red means the event/package currently fails validation.

### Tools

- **SELECCIONAR**: inspect an existing event.
- **TAP L / TAP R**: place a Tap on the active snap.
- **TRACE L / TRACE R**: place a default four-beat TRACE phrase when Lead/Aura is audible.

The active song determines which snap values are legal.

## Automatic musical semantics

When an event is created, Chart Lab inspects the musical frame at that beat.

Tap prefers:

1. drums;
2. lead;
3. aura;
4. bass;
5. boss;
6. harmony.

TRACE requires Lead/Aura for procedural auto-contour. File-backed songs default to the semantic `mix` stem and keep authored TRACE anchors.

The editor proposes stem, intent, energy and phrase metadata. These remain editable in the inspector.

## Validation

The validation panel uses the same `src/song.js` contract as runtime.

It checks:

- package schema;
- timing;
- bar/pattern lengths;
- chart grid placement;
- supported mechanics;
- TRACE duration and anchors;
- stem existence;
- event-to-stem audibility.

A package can be exported while invalid for work-in-progress purposes, but the game runtime will reject an invalid default chart.

## Multiple charts

Use **+ CHART** to add another difficulty/chart to the current song package.

Charts share the song/composition timing contract in Song Package v1.

If Aura Farm later needs per-chart tempo/stops/warps, that should be introduced as a new timing/schema version rather than silently changing v1 semantics.

## Import / export

The editor reads and writes the complete song package JSON.

This means the intended workflow is:

1. edit in Chart Lab;
2. export `<song-id>.json`;
3. replace/add the file under `songs/`;
4. register new songs in `songs/index.json`;
5. run the game; the same validators run again before play.

## Keyboard

- Space — play/pause
- Ctrl/Cmd+S — export
- Ctrl/Cmd+O — import
- Ctrl/Cmd+Z — undo
- Ctrl/Cmd+Shift+Z — redo
- Delete/Backspace — delete selected event
- Left/Right — move selected event by one active snap

## File-backed audio in v0.45

Set `AUDIO MODE` to `FILE · OGG/WAV/MP3`, configure `AUDIO SRC`, BPM and offset, then use **ANALIZAR SRC**.

Chart Lab will decode the deployed asset, render its waveform and store per-grid-step energy analysis.

**ARCHIVO LOCAL** can analyze a file from your device without first deploying it. This does not upload or embed that file; it only powers local preview/analysis. The final package must still point at the licensed asset in `audio.src`.

Validation states:

- **SYNC VERIFIED** — procedural stem semantics checked;
- **AUDIO ANALYZED** — external mix energy checked;
- **GRID ONLY** — timing/chart structure valid but no decoded-audio analysis.

The remaining future step is true multi-stem produced audio analysis/mixing. A stereo mix can show waveform/onsets, but it cannot reliably prove that a specific event follows “lead” vs “drums”.
