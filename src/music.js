import {
  songFrameFromData
} from "./song.js?v=0.43";

let ACTIVE_SONG = null;

const EMPTY_FRAME = {
  barIndex: 0,
  step: 0,
  section: "LOADING",
  kick: false,
  snare: false,
  hat: false,
  hatAccent: 1,
  bassMidi: null,
  chordMidi: null,
  leadMidi: null,
  auraMidi: null,
  fill: false,
  bossMidi: null
};

export function configureSong(
  song
) {
  ACTIVE_SONG = song;
}

export function getActiveSong() {
  return ACTIVE_SONG;
}

export function midiToHz(midi) {
  return 440 * Math.pow(
    2,
    (midi - 69) / 12
  );
}

export function songFrameAtBeat(
  beat
) {
  if (!ACTIVE_SONG) {
    return {
      ...EMPTY_FRAME
    };
  }

  return songFrameFromData(
    ACTIVE_SONG,
    beat
  );
}

export function songSectionAtBeat(
  beat
) {
  return songFrameAtBeat(
    beat
  ).section;
}
