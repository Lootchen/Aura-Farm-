# Aura Farm audio assets

Place licensed/owned produced audio files in this directory.

Song packages reference them relative to the song JSON, for example:

```json
"audio": {
  "mode": "file",
  "src": "../assets/audio/my-track.ogg",
  "gain": 0.9,
  "stems": ["mix"]
}
```

Recommended delivery format: OGG Vorbis for web builds, with WAV kept as the production master outside or alongside the deployment as appropriate.

MP3/WAV/OGG playback depends on browser codec support. Chart Lab uses Web Audio `decodeAudioData`, so test the exact deployed asset on target browsers.

## Licensing rule

Do not commit an internet track merely because it is described as “free”.

For every external asset, record:

- title;
- creator;
- source URL;
- license;
- date obtained;
- attribution text if required;
- whether commercial redistribution in a game is permitted.

Prefer owned/original music or CC0 when possible.
