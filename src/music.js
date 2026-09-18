// Aura Farm — Track 01: GLASSHOUSE CIRCUIT
// Original prototype composition. 110 BPM · 68 beats · 17 bars.
// Half-beat resolution keeps scheduling deterministic with the current master clock.

export const AURA_SONG = {
  id: "glasshouse-circuit",
  title: "GLASSHOUSE CIRCUIT",
  bpm: 110,
  beats: 68,
  stepsPerBeat: 2,
  stems: [
    "drums",
    "bass",
    "harmony",
    "lead",
    "aura",
    "boss"
  ]
};

const DRUM_PATTERNS = {
  seed: {
    kick: [0, 4],
    snare: [2, 6],
    hat: [0, 2, 4, 6]
  },
  flow: {
    kick: [0, 3, 4, 7],
    snare: [2, 6],
    hat: [0, 1, 2, 3, 4, 5, 6, 7]
  },
  relay: {
    kick: [0, 4, 5],
    snare: [2, 6],
    hat: [0, 1, 2, 3, 4, 5, 6, 7]
  },
  fracture: {
    kick: [0, 2, 4, 7],
    snare: [2, 5, 6],
    hat: [0, 1, 2, 3, 4, 5, 6, 7]
  },
  ascent: {
    kick: [0, 2, 4, 6, 7],
    snare: [2, 6],
    hat: [0, 1, 2, 3, 4, 5, 6, 7]
  },
  boss: {
    kick: [0, 1, 4, 6],
    snare: [2, 5, 6],
    hat: [0, 1, 2, 3, 4, 5, 6, 7]
  }
};

const BASS_PATTERNS = {
  pulse: [0, null, 0, 7, 0, null, 5, 7],
  walk: [0, null, 7, null, 5, null, 7, 10],
  drive: [0, 0, 7, null, 5, 5, 7, 10],
  climb: [0, null, 3, 5, 7, null, 10, 12],
  boss: [0, 0, 1, null, 7, 6, 5, 1]
};

const LEAD_PATTERNS = {
  rest: [null, null, null, null, null, null, null, null],
  seed: [12, null, 15, null, 19, null, 17, null],
  answer: [19, null, 17, 15, 12, null, 10, null],
  relay: [12, 15, null, 17, 19, null, 22, 19],
  lift: [19, null, 22, null, 24, 22, 19, 17],
  fracture: [24, 22, 19, null, 20, 17, 15, null],
  boss: [12, 13, 19, null, 18, 13, 12, 7]
};

const AURA_PATTERNS = {
  rest: [null, null, null, null, null, null, null, null],
  spark: [null, null, 24, null, null, null, 27, null],
  bloom: [24, null, null, 27, null, 31, null, 29],
  pulse: [24, null, 31, null, 27, null, 34, null],
  boss: [24, 25, null, 31, null, 30, 29, null]
};

const BARS = [
  // 0–3: germination / intro
  { root: 45, chord: [0,3,7], bass: "pulse", lead: "rest",    aura: "rest",  drums: "seed",     section: "GERMINATE" },
  { root: 41, chord: [0,4,7], bass: "pulse", lead: "rest",    aura: "rest",  drums: "seed",     section: "GERMINATE" },
  { root: 48, chord: [0,4,7], bass: "walk",  lead: "seed",    aura: "rest",  drums: "flow",     section: "SPROUT" },
  { root: 43, chord: [0,4,7], bass: "walk",  lead: "answer",  aura: "spark", drums: "flow",     section: "SPROUT" },

  // 4–7: machine flow
  { root: 45, chord: [0,3,7], bass: "drive", lead: "relay",   aura: "spark", drums: "flow",     section: "CURRENT" },
  { root: 48, chord: [0,4,7], bass: "drive", lead: "answer",  aura: "spark", drums: "relay",    section: "CURRENT" },
  { root: 41, chord: [0,4,7], bass: "drive", lead: "relay",   aura: "bloom", drums: "relay",    section: "RELAY" },
  { root: 44, chord: [0,4,7], bass: "walk",  lead: "lift",    aura: "bloom", drums: "relay",    section: "RELAY" },

  // 8–11: fracture / expansion
  { root: 50, chord: [0,3,7], bass: "drive", lead: "fracture",aura: "pulse", drums: "fracture", section: "FRACTURE" },
  { root: 41, chord: [0,4,7], bass: "climb", lead: "relay",   aura: "pulse", drums: "fracture", section: "FRACTURE" },
  { root: 45, chord: [0,3,7], bass: "climb", lead: "lift",    aura: "bloom", drums: "fracture", section: "OVERDRIVE" },
  { root: 44, chord: [0,4,7], bass: "drive", lead: "answer",  aura: "pulse", drums: "flow",     section: "OVERDRIVE" },

  // 12–15: ascent
  { root: 45, chord: [0,3,7], bass: "climb", lead: "lift",    aura: "pulse", drums: "ascent",   section: "ASCENT" },
  { root: 43, chord: [0,4,7], bass: "climb", lead: "fracture",aura: "pulse", drums: "ascent",   section: "ASCENT" },
  { root: 41, chord: [0,4,7], bass: "drive", lead: "lift",    aura: "bloom", drums: "ascent",   section: "BLOOM" },
  { root: 44, chord: [0,4,7], bass: "drive", lead: "answer",  aura: "pulse", drums: "ascent",   section: "BLOOM" },

  // 16: turnaround / Core bar
  { root: 45, chord: [0,3,7], bass: "boss",  lead: "boss",    aura: "boss",  drums: "boss",     section: "CORE" }
];

const includes = (array, step) => array.includes(step);

export function midiToHz(midi) {
  return 440 * Math.pow(
    2,
    (midi - 69) / 12
  );
}

export function songFrameAtBeat(beat) {
  const rawStep =
    Math.max(
      0,
      Math.round(
        beat *
        AURA_SONG.stepsPerBeat
      )
    );
  const stepsPerBar =
    4 *
    AURA_SONG.stepsPerBeat;
  const barIndex =
    Math.floor(
      rawStep /
      stepsPerBar
    ) %
    BARS.length;
  const step =
    rawStep %
    stepsPerBar;
  const bar =
    BARS[barIndex];
  const drums =
    DRUM_PATTERNS[
      bar.drums
    ];
  const bassOffset =
    BASS_PATTERNS[
      bar.bass
    ][step];
  const leadOffset =
    LEAD_PATTERNS[
      bar.lead
    ][step];
  const auraOffset =
    AURA_PATTERNS[
      bar.aura
    ][step];

  return {
    barIndex,
    step,
    section: bar.section,
    kick: includes(
      drums.kick,
      step
    ),
    snare: includes(
      drums.snare,
      step
    ),
    hat: includes(
      drums.hat,
      step
    ),
    hatAccent:
      step % 2 === 0
        ? 1
        : 0.62,
    bassMidi:
      bassOffset === null
        ? null
        : bar.root +
          bassOffset,
    chordMidi:
      step === 0
        ? bar.chord.map(
            (offset) =>
              bar.root +
              12 +
              offset
          )
        : null,
    leadMidi:
      leadOffset === null
        ? null
        : bar.root +
          leadOffset,
    auraMidi:
      auraOffset === null
        ? null
        : bar.root +
          auraOffset,
    bossMidi:
      bar.section === "CORE"
        ? bar.root -
          12 +
          (
            step % 2 === 0
              ? 0
              : 1
          )
        : null
  };
}

export function songSectionAtBeat(beat) {
  return songFrameAtBeat(
    beat
  ).section;
}
