# Aura Farm Song Package v1

Aura Farm treats a song and its gameplay chart as one validated content package.

## Why

A rhythm chart must not silently drift away from the music. The loader therefore owns:

- song identity and metadata;
- constant timing;
- procedural composition data;
- semantic stems;
- one or more gameplay charts;
- chart-to-music alignment validation.

The current implementation deliberately rejects unsupported timing/audio modes instead of guessing.

## Registry

`songs/index.json` selects the default package and is the future entry point for a song selector.

```json
{
  "schemaVersion": 1,
  "defaultSong": "glasshouse-circuit",
  "songs": [
    {
      "id": "glasshouse-circuit",
      "file": "glasshouse-circuit.json"
    }
  ]
}
```

Adding a song should not require editing gameplay code: add the package and register it here.

## Package shape

Each file under `songs/` contains:

- `schemaVersion`
- `id`, `title`, `artist`
- `timing`
- `audio`
- `composition`
- `defaultChart`
- `charts[]`

### Timing

v1 supports constant BPM only.

```json
"timing": {
  "mode": "constant",
  "bpm": 110,
  "beats": 68,
  "beatsPerBar": 4,
  "stepsPerBeat": 2,
  "countInBeats": 4,
  "offsetMs": 0
}
```

`stepsPerBeat` defines the legal authoring grid. With value 2, gameplay events may land on half-beats. A future song can choose a finer grid without changing the gameplay engine.

### Audio

v1 supports Aura Farm's procedural six-bus engine.

```json
"audio": {
  "mode": "procedural",
  "engine": "aura-procedural-v1",
  "stems": [
    "drums",
    "bass",
    "harmony",
    "lead",
    "aura",
    "boss"
  ]
}
```

Produced audio/stem files should be added as a later schema/audio mode rather than pretending the current engine already supports them.

### Composition

Patterns and bars previously hardcoded in `src/music.js` now live in the song JSON.

The loader verifies:

- every pattern has the expected number of steps;
- every bar references existing patterns;
- bar count × beats per bar equals `timing.beats`.

### Charts

A song may contain multiple charts.

```json
{
  "id": "standard",
  "name": "Vertical Slice 01",
  "difficulty": "standard",
  "mechanicsVersion": "aura-chart-v1",
  "events": []
}
```

Aura Farm v1 supports:

- `tap`
- `slide` with `mode: "trace"`

Future mechanics must advance the mechanics/schema contract instead of being smuggled into an existing event type.

## Music semantics

Every gameplay event declares:

- `music.stem`
- `music.intent`
- `music.energy`
- `music.phrase`

The loader reconstructs the actual musical frame at that beat and rejects the package if the declared stem is silent there.

Example failure:

> beat 24: stem lead no suena en ese paso

This makes song/chart sync a build-time/content-load rule rather than a manual convention.

## Authoring rule

For each new song:

1. author timing and composition first;
2. choose `stepsPerBeat` fine enough for the intended rhythm;
3. place gameplay events on that grid;
4. tag every event with the audible stem/phrase it follows;
5. load the package and resolve every alignment error;
6. only then tune routes, Shield, CHAIN and visual intensity.

This follows the same broad separation used by established rhythm-game formats: song timing/metadata is explicit and charts are structured data rather than timing hidden in gameplay code.
