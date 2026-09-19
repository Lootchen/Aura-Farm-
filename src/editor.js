import {
  auditChartAlignment,
  auditChartFlow,
  loadGameSong,
  loadSongRegistry,
  songFrameFromData,
  validateGameChart,
  validateGameSong
} from "./song.js?v=0.48";
import {
  midiToHz
} from "./music.js?v=0.48";
import {
  analyzeAudioSteps,
  buildWaveformPeaks,
  loadAudioBuffer,
  resolveSongAssetUrl,
  validateDecodedAudioDuration
} from "./audio-file.js?v=0.48";

const $ = (selector) =>
  document.querySelector(selector);

const canvas = $("#timelineCanvas");
const ctx = canvas.getContext("2d");
const viewport = $("#timelineViewport");
const songSelect = $("#songSelect");
const chartSelect = $("#chartSelect");
const snapSelect = $("#snapSelect");
const zoomRange = $("#zoomRange");
const playButton = $("#playButton");
const stopButton = $("#stopButton");
const undoButton = $("#undoButton");
const redoButton = $("#redoButton");
const importButton = $("#importButton");
const importInput = $("#importInput");
const exportButton = $("#exportButton");
const newChartButton = $("#newChartButton");
const beatReadout = $("#beatReadout");
const timeReadout = $("#timeReadout");
const songMeta = $("#songMeta");
const songTitle = $("#songTitle");
const eventCount = $("#eventCount");
const syncCount = $("#syncCount");
const gridReadout = $("#gridReadout");
const validationBadge = $("#validationBadge");
const validationTitle = $("#validationTitle");
const validationList = $("#validationList");
const selectionTitle = $("#selectionTitle");
const emptyInspector = $("#emptyInspector");
const eventInspector = $("#eventInspector");
const duplicateButton = $("#duplicateButton");
const deleteButton = $("#deleteButton");
const autoMusicButton = $("#autoMusicButton");
const toast = $("#toast");

const songTitleInput = $("#songTitleInput");
const songArtistInput = $("#songArtistInput");
const songBpmInput = $("#songBpmInput");
const countInInput = $("#countInInput");
const difficultyInput = $("#difficultyInput");
const songDescriptionInput = $("#songDescriptionInput");
const audioModeInput = $("#audioModeInput");
const offsetInput = $("#offsetInput");
const audioSrcInput = $("#audioSrcInput");
const audioGainInput = $("#audioGainInput");
const audioSrcField = $("#audioSrcField");
const audioGainField = $("#audioGainField");
const audioToolsField = $("#audioToolsField");
const analyzeAudioButton = $("#analyzeAudioButton");
const localAudioButton = $("#localAudioButton");
const localAudioInput = $("#localAudioInput");
const audioAnalysisStatus = $("#audioAnalysisStatus");

const eventBeatInput = $("#eventBeatInput");
const eventTypeInput = $("#eventTypeInput");
const eventSideInput = $("#eventSideInput");
const eventRouteInput = $("#eventRouteInput");
const eventShieldInput = $("#eventShieldInput");
const eventDurationInput = $("#eventDurationInput");
const eventMinActInput = $("#eventMinActInput");
const eventChainInput = $("#eventChainInput");
const eventStemInput = $("#eventStemInput");
const eventIntentInput = $("#eventIntentInput");
const eventEnergyInput = $("#eventEnergyInput");
const eventPhraseInput = $("#eventPhraseInput");
const eventContourInput = $("#eventContourInput");
const eventAnchorsInput = $("#eventAnchorsInput");
const shieldField = $("#shieldField");
const durationField = $("#durationField");
const contourField = $("#contourField");
const anchorsField = $("#anchorsField");

const LAYOUT = {
  ruler: 42,
  music: 54,
  tap: 72,
  trace: 90
};

const Y = {
  ruler: 0,
  music: 42,
  left: 96,
  right: 168,
  trace: 240,
  end: 330
};

const COLORS = {
  left: "#6ed7ff",
  right: "#d88bff",
  drums: "#b8c8da",
  bass: "#5ee2d7",
  harmony: "#ffc45c",
  lead: "#6ed7ff",
  aura: "#d88bff",
  boss: "#ffe56d",
  danger: "#ff6984"
};

let registry = null;
let song = null;
let chart = null;
let selectedEvent = null;
let tool = "select";
let pxPerBeat = 72;
let snapStep = 0.5;
let invalidEventIndexes = new Set();
let flowWarningIndexes = new Set();
let validationErrors = [];
let flowWarnings = [];
let playheadBeat = 0;
let audioContext = null;
let playbackTimer = null;
let animationFrame = null;
let playing = false;
let playbackStartBeat = 0;
let playbackStartTime = 0;
let nextScheduleStep = 0;
let noiseBuffer = null;
let fileAudioBuffer = null;
let waveformPeaks = null;
let filePlaybackSource = null;
let songSourceUrl = null;
let localAudioFileName = null;
let toastTimer = null;

let history = [];
let historyIndex = -1;
let restoringHistory = false;

function ensureAudioContext() {
  audioContext ??=
    new AudioContext();

  return audioContext;
}

function clearFileAudioState() {
  if (filePlaybackSource) {
    try {
      filePlaybackSource.stop();
    } catch {
      // Already ended.
    }
    filePlaybackSource = null;
  }

  fileAudioBuffer = null;
  waveformPeaks = null;
  localAudioFileName = null;
}

async function decodeLocalAudioFile(
  file
) {
  const context =
    ensureAudioContext();
  const bytes =
    await file.arrayBuffer();

  return await context
    .decodeAudioData(
      bytes.slice(0)
    );
}

async function prepareFileAudio({
  useLocalBuffer = null,
  analyze = false
} = {}) {
  if (
    song?.audio?.mode !==
      "file"
  ) {
    clearFileAudioState();
    return null;
  }

  const context =
    ensureAudioContext();

  let buffer =
    useLocalBuffer;

  if (!buffer) {
    const resolved =
      resolveSongAssetUrl(
        songSourceUrl,
        song.audio.src
      );

    if (!resolved) {
      throw new Error(
        "Define audio.src o carga un archivo local."
      );
    }

    buffer =
      await loadAudioBuffer(
        context,
        resolved
      );
  }

  validateDecodedAudioDuration(
    song,
    buffer
  );

  fileAudioBuffer =
    buffer;
  waveformPeaks =
    buildWaveformPeaks(
      buffer,
      2400
    );

  if (analyze) {
    song.audio.analysis =
      analyzeAudioSteps(
        buffer,
        song.timing
      );
  }

  resizeTimeline();

  return buffer;
}

function audioStepEnergyAtBeat(
  beat
) {
  const analysis =
    song?.audio?.analysis;

  if (
    !analysis?.stepEnergy
  ) {
    return null;
  }

  const step =
    Math.round(
      beat *
      activeTiming()
        .stepsPerBeat
    );

  return Number(
    analysis.stepEnergy[
      step
    ] ?? 0
  );
}

function refreshAudioFields() {
  const fileMode =
    song?.audio?.mode ===
      "file";

  audioModeInput.value =
    fileMode
      ? "file"
      : "procedural";
  offsetInput.value =
    String(
      song?.timing
        ?.offsetMs ??
      0
    );
  audioSrcInput.value =
    fileMode
      ? song.audio.src ?? ""
      : "";
  audioGainInput.value =
    fileMode
      ? String(
          song.audio.gain ??
          1
        )
      : "1";

  audioSrcField.hidden =
    !fileMode;
  audioGainField.hidden =
    !fileMode;
  audioToolsField.hidden =
    !fileMode;

  if (!fileMode) {
    audioAnalysisStatus.dataset
      .state = "ok";
    audioAnalysisStatus.textContent =
      "PROCEDURAL · sync semántico por stem";
    return;
  }

  const analysis =
    song.audio.analysis;

  if (
    analysis?.stepEnergy
  ) {
    audioAnalysisStatus.dataset
      .state = "ok";
    audioAnalysisStatus.textContent =
      `AUDIO ANALYZED · ${analysis.stepEnergy.length} pasos · ${Number(analysis.durationSeconds).toFixed(2)}s${localAudioFileName ? ` · local: ${localAudioFileName}` : ""}`;
  } else {
    audioAnalysisStatus.dataset
      .state = "warning";
    audioAnalysisStatus.textContent =
      `GRID ONLY · falta analizar el mix${localAudioFileName ? ` · local: ${localAudioFileName}` : ""}`;
  }
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function currentChart() {
  return chart;
}

function chartIndex() {
  return song?.charts
    ?.indexOf(chart) ?? -1;
}

function selectedIndex() {
  return chart?.events
    ?.indexOf(selectedEvent) ?? -1;
}

function activeTiming() {
  return song?.timing ?? {
    bpm: 120,
    beats: 64,
    beatsPerBar: 4,
    stepsPerBeat: 2,
    countInBeats: 4
  };
}

function legalSnapOptions() {
  const steps =
    activeTiming()
      .stepsPerBeat;
  const options = [];

  for (
    let divisor = 1;
    divisor <= steps;
    divisor += 1
  ) {
    if (
      steps % divisor === 0
    ) {
      options.push(
        1 / divisor
      );
    }
  }

  return options
    .sort((a, b) => b - a);
}

function populateSnapSelect() {
  const options =
    legalSnapOptions();

  snapSelect.innerHTML = "";

  for (const step of options) {
    const option =
      document.createElement("option");
    option.value =
      String(step);
    option.textContent =
      step === 1
        ? "1 beat"
        : `1/${Math.round(1 / step)} beat`;
    snapSelect.append(option);
  }

  if (
    !options.includes(
      snapStep
    )
  ) {
    snapStep =
      options.at(-1) ?? 1;
  }

  snapSelect.value =
    String(snapStep);
}

function snapBeat(value) {
  const timing =
    activeTiming();
  const snapped =
    Math.round(
      value / snapStep
    ) *
    snapStep;

  return Math.max(
    0,
    Math.min(
      timing.beats -
        1 /
          timing.stepsPerBeat,
      Number(
        snapped.toFixed(6)
      )
    )
  );
}

function formatTime(seconds) {
  const safe =
    Math.max(0, seconds);
  const mins =
    Math.floor(
      safe / 60
    );
  const secs =
    Math.floor(
      safe % 60
    );
  const ms =
    Math.floor(
      (safe -
        Math.floor(safe)) *
        1000
    );

  return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

function beatToSeconds(beat) {
  return (
    beat *
    60 /
    activeTiming().bpm
  );
}

function showToast(message) {
  toast.hidden = false;
  toast.textContent = message;
  window.clearTimeout(
    toastTimer
  );
  toastTimer =
    window.setTimeout(
      () => {
        toast.hidden = true;
      },
      1900
    );
}

function setTool(next) {
  tool = next;
  document
    .querySelectorAll(".tool")
    .forEach(
      (button) => {
        button.classList.toggle(
          "is-active",
          button.dataset.tool ===
            next
        );
      }
    );
}

function setPlayhead(
  beat,
  {
    center = false
  } = {}
) {
  playheadBeat =
    Math.max(
      0,
      Math.min(
        activeTiming().beats,
        beat
      )
    );

  beatReadout.textContent =
    playheadBeat.toFixed(2);
  timeReadout.textContent =
    formatTime(
      beatToSeconds(
        playheadBeat
      )
    );

  if (center) {
    const x =
      playheadBeat *
      pxPerBeat;
    const target =
      x -
      viewport.clientWidth *
        0.42;
    viewport.scrollLeft =
      Math.max(
        0,
        target
      );
  }

  renderTimeline();
}

function pushHistory() {
  if (
    restoringHistory ||
    !song
  ) {
    return;
  }

  const snapshot =
    JSON.stringify(song);

  if (
    history[historyIndex] ===
    snapshot
  ) {
    return;
  }

  history =
    history.slice(
      0,
      historyIndex + 1
    );
  history.push(snapshot);

  if (history.length > 60) {
    history.shift();
  }

  historyIndex =
    history.length - 1;
  updateHistoryButtons();
}

function resetHistory() {
  history =
    song
      ? [JSON.stringify(song)]
      : [];
  historyIndex =
    history.length - 1;
  updateHistoryButtons();
}

function updateHistoryButtons() {
  undoButton.disabled =
    historyIndex <= 0;
  redoButton.disabled =
    historyIndex < 0 ||
    historyIndex >=
      history.length - 1;
}

function restoreSnapshot(index) {
  if (
    index < 0 ||
    index >= history.length
  ) {
    return;
  }

  restoringHistory = true;
  const previousChartId =
    chart?.id;
  song =
    JSON.parse(
      history[index]
    );
  chart =
    song.charts.find(
      (item) =>
        item.id === previousChartId
    ) ??
    song.charts.find(
      (item) =>
        item.id ===
        song.defaultChart
    ) ??
    song.charts[0];
  selectedEvent = null;
  historyIndex = index;
  restoringHistory = false;
  populateAllUi();
  updateHistoryButtons();
}

function commitChange(
  mutate,
  {
    keepSelection = true
  } = {}
) {
  if (!song || !chart) return;

  const before =
    JSON.stringify(song);
  const previousSelection =
    selectedEvent;

  try {
    mutate();

    chart.events.sort(
      (a, b) =>
        a.beat - b.beat
    );

    if (
      keepSelection &&
      previousSelection &&
      chart.events.includes(
        previousSelection
      )
    ) {
      selectedEvent =
        previousSelection;
    }
  } catch (error) {
    showToast(
      error.message
    );
    return;
  }

  if (
    JSON.stringify(song) !==
    before
  ) {
    pushHistory();
  }

  populateAllUi();
}

function populateSongSelect() {
  songSelect.innerHTML = "";

  for (
    const entry of
    registry?.songs ?? []
  ) {
    const option =
      document.createElement("option");
    option.value = entry.id;
    option.textContent =
      entry.id;
    songSelect.append(option);
  }

  if (song) {
    songSelect.value =
      song.id;
  }
}

function populateChartSelect() {
  chartSelect.innerHTML = "";

  for (const item of song.charts) {
    const option =
      document.createElement("option");
    option.value = item.id;
    option.textContent =
      `${item.name ?? item.id} · ${item.difficulty ?? "standard"}`;
    chartSelect.append(option);
  }

  chartSelect.value =
    chart.id;
}

function populateMetadata() {
  const timing =
    activeTiming();

  const phaseCount =
    Array.isArray(
      song.levelPhases
    )
      ? song.levelPhases.length
      : 0;

  songMeta.textContent =
    `${song.artist ?? "AURA FARM"} · ${timing.bpm} BPM · ${timing.beats} BEATS${phaseCount > 0 ? ` · ${phaseCount} PHASES` : ""}`;
  songTitle.textContent =
    song.title;
  eventCount.textContent =
    String(
      chart.events.length
    );
  gridReadout.textContent =
    `1/${timing.stepsPerBeat}`;

  songTitleInput.value =
    song.title ?? "";
  songArtistInput.value =
    song.artist ?? "";
  songBpmInput.value =
    String(timing.bpm);
  countInInput.value =
    String(
      timing.countInBeats
    );
  difficultyInput.value =
    chart.difficulty ?? "";
  songDescriptionInput.value =
    song.description ?? "";

  refreshAudioFields();
}

function populateInspector() {
  const event =
    selectedEvent;
  const hasEvent =
    Boolean(event);

  emptyInspector.hidden =
    hasEvent;
  eventInspector.hidden =
    !hasEvent;
  duplicateButton.disabled =
    !hasEvent;
  deleteButton.disabled =
    !hasEvent;

  if (!event) {
    selectionTitle.textContent =
      "Nada seleccionado";
    return;
  }

  const index =
    selectedIndex();

  selectionTitle.textContent =
    `#${index + 1} · ${event.type.toUpperCase()} · BEAT ${event.beat}`;

  eventBeatInput.step =
    String(snapStep);
  eventBeatInput.value =
    String(event.beat);
  eventTypeInput.value =
    event.type;
  eventSideInput.value =
    event.side;
  eventRouteInput.value =
    String(event.route ?? 1);
  eventShieldInput.checked =
    Boolean(event.shield);
  eventDurationInput.value =
    event.type === "slide"
      ? String(
          event.durationBeats
        )
      : "";
  eventMinActInput.value =
    event.minAct ?? "";
  eventChainInput.value =
    event.chainGroup ?? "";
  eventStemInput.innerHTML =
    (song.audio?.stems ?? ["mix"])
      .map(
        (stem) =>
          `<option value="${stem}">${stem}</option>`
      )
      .join("");
  eventStemInput.value =
    event.music?.stem ??
    song.audio?.stems?.[0] ??
    "mix";
  eventIntentInput.value =
    event.music?.intent ??
    "pulse";
  eventEnergyInput.value =
    String(
      event.music?.energy ??
      0.6
    );
  eventPhraseInput.value =
    event.music?.phrase ??
    "";
  eventContourInput.checked =
    Boolean(
      event.music?.contour
    );
  eventAnchorsInput.value =
    event.type === "slide"
      ? JSON.stringify(
          event.anchors,
          null,
          2
        )
      : "";

  const isSlide =
    event.type === "slide";
  shieldField.hidden =
    isSlide;
  durationField.hidden =
    !isSlide;
  contourField.hidden =
    !isSlide;
  anchorsField.hidden =
    !isSlide;
}

function populateAllUi() {
  if (!song || !chart) return;

  populateSongSelect();
  populateChartSelect();
  populateSnapSelect();
  populateMetadata();
  populateInspector();
  validateNow();
  resizeTimeline();
}

function autoMusicForBeat(
  beat,
  type
) {
  if (
    song.audio?.mode ===
      "file"
  ) {
    const energy =
      audioStepEnergyAtBeat(
        beat
      );
    const safeEnergy =
      energy === null
        ? 0.58
        : Math.max(
            0.18,
            Math.min(
              1,
              energy
            )
          );
    const stem =
      song.audio.stems?.includes(
        "mix"
      )
        ? "mix"
        : song.audio.stems?.[0] ??
          "mix";
    const bar =
      Math.floor(
        beat /
        activeTiming()
          .beatsPerBar
      );

    return {
      stem,
      intent:
        type === "slide"
          ? "phrase"
          : safeEnergy >= 0.72
            ? "accent"
            : "pulse",
      energy:
        Number(
          safeEnergy.toFixed(2)
        ),
      phrase:
        `audio-bar-${bar + 1}`,
      contour: false
    };
  }

  const frame =
    songFrameFromData(
      song,
      beat
    );

  const audible = {
    drums:
      frame.kick ||
      frame.snare ||
      frame.hat,
    bass:
      Number.isFinite(
        frame.bassMidi
      ),
    harmony:
      Array.isArray(
        frame.chordMidi
      ),
    lead:
      Number.isFinite(
        frame.leadMidi
      ),
    aura:
      Number.isFinite(
        frame.auraMidi
      ),
    boss:
      Number.isFinite(
        frame.bossMidi
      )
  };

  const order =
    type === "slide"
      ? ["lead", "aura"]
      : [
          "drums",
          "lead",
          "aura",
          "bass",
          "boss",
          "harmony"
        ];
  const stem =
    order.find(
      (candidate) =>
        audible[candidate]
    );

  if (!stem) {
    throw new Error(
      type === "slide"
        ? "No hay LEAD/AURA audible aquí para un TRACE. Mueve el beat o cambia el chart manualmente."
        : "No hay stem audible en este paso."
    );
  }

  let intent = "accent";

  if (stem === "drums") {
    intent =
      frame.snare
        ? "backbeat"
        : "pulse";
  } else if (stem === "lead") {
    intent =
      type === "slide"
        ? "phrase"
        : "response";
  } else if (stem === "aura") {
    intent =
      type === "slide"
        ? "phrase"
        : "accent";
  } else if (stem === "bass") {
    intent = "pulse";
  } else if (stem === "boss") {
    intent = "climax";
  }

  return {
    stem,
    intent,
    energy:
      stem === "boss"
        ? 0.88
        : stem === "aura"
          ? 0.72
          : 0.64,
    phrase:
      `${String(frame.section ?? "phrase").toLowerCase()}-${stem}`,
    contour:
      type === "slide" &&
      ["lead", "aura"]
        .includes(stem)
  };
}

function defaultTap(
  beat,
  side
) {
  return {
    type: "tap",
    beat,
    side,
    route: 1,
    symbol:
      side === "left"
        ? "♪"
        : "♩",
    music:
      autoMusicForBeat(
        beat,
        "tap"
      )
  };
}

function defaultTrace(
  beat,
  side
) {
  const timing =
    activeTiming();
  const duration =
    Math.max(
      snapStep,
      Math.min(
        4,
        timing.beats - beat
      )
    );

  if (
    beat + duration >
    timing.beats
  ) {
    throw new Error(
      "No queda espacio suficiente para TRACE."
    );
  }

  const music =
    autoMusicForBeat(
      beat,
      "slide"
    );

  const sign =
    side === "left"
      ? 1
      : -1;

  return {
    type: "slide",
    mode: "trace",
    beat,
    side,
    route: 1,
    durationBeats:
      Number(
        duration.toFixed(6)
      ),
    anchors: [
      {
        beat: 0,
        x: -0.62 * sign,
        y: -0.68
      },
      {
        beat:
          Number(
            (
              duration / 2
            ).toFixed(6)
          ),
        x: 0,
        y: -0.96
      },
      {
        beat:
          Number(
            duration.toFixed(6)
          ),
        x: 0.62 * sign,
        y: -0.68
      }
    ],
    music
  };
}

function validateNow() {
  invalidEventIndexes =
    new Set();
  flowWarningIndexes =
    new Set();
  validationErrors = [];
  flowWarnings = [];

  try {
    validateGameSong(song);
    validateGameChart(
      chart,
      song
    );

    const report =
      auditChartAlignment(
        song,
        chart
      );
    const flow =
      auditChartFlow(
        song,
        chart
      );

    flowWarnings =
      flow.warnings;

    for (
      const warning of
      flowWarnings
    ) {
      if (
        Number.isInteger(
          warning.index
        )
      ) {
        flowWarningIndexes.add(
          warning.index
        );
      }
    }

    for (
      const error of
      report.errors
    ) {
      invalidEventIndexes.add(
        error.index
      );
      validationErrors.push(
        `#${error.index + 1} · beat ${error.beat} · ${error.reason}`
      );
    }

    syncCount.textContent =
      `${report.checked - report.errors.length}/${report.checked}`;

    if (!report.ok) {
      throw new Error(
        `${report.errors.length} eventos no coinciden con el stem declarado.`
      );
    }

    if (
      report.mode ===
        "grid-only"
    ) {
      validationBadge.dataset.state =
        "warning";
      validationBadge.textContent =
        "GRID ONLY";
      validationTitle.textContent =
        `${report.checked} eventos válidos · audio aún no analizado`;
      validationList.innerHTML =
        [
          ...report.warnings.map(
            (item) =>
              `<div class="validation-item">${escapeHtml(item)}</div>`
          ),
          ...flowWarnings.map(
            (item) =>
              `<div class="validation-item flow-warning">FLOW · ${escapeHtml(item.reason)}</div>`
          )
        ].join("");
    } else if (
      report.mode ===
        "mix-energy"
    ) {
      validationBadge.dataset.state =
        "ok";
      validationBadge.textContent =
        "AUDIO ANALYZED";
      validationTitle.textContent =
        `${report.verified}/${report.checked} eventos sobre audio detectable`;
      validationList.innerHTML =
        [
          '<div class="validation-item ok">Timing/grid y energía temporal del mix verificados.</div>',
          ...report.warnings.map(
            (item) =>
              `<div class="validation-item">${escapeHtml(item)}</div>`
          ),
          ...flowWarnings.map(
            (item) =>
              `<div class="validation-item flow-warning">FLOW · ${escapeHtml(item.reason)}</div>`
          )
        ].join("");
    } else {
      validationBadge.dataset.state =
        "ok";
      validationBadge.textContent =
        "SYNC VERIFIED";
      validationTitle.textContent =
        `${report.checked}/${report.checked} eventos alineados por stem`;
      validationList.innerHTML =
        [
          '<div class="validation-item ok">Paquete válido · timing, grid, eventos y stems coinciden.</div>',
          ...flowWarnings.map(
            (item) =>
              `<div class="validation-item flow-warning">FLOW · ${escapeHtml(item.reason)}</div>`
          )
        ].join("");

      if (
        flowWarnings.length > 0
      ) {
        validationTitle.textContent =
          `${report.checked}/${report.checked} sync · ${flowWarnings.length} flow warning${flowWarnings.length === 1 ? "" : "s"}`;
      }
    }
  } catch (error) {
    validationBadge.dataset.state =
      "error";
    validationBadge.textContent =
      "REVISAR";
    validationTitle.textContent =
      "El paquete no puede publicarse así";

    if (
      validationErrors.length === 0
    ) {
      validationErrors.push(
        error.message
      );
    }

    validationList.innerHTML =
      validationErrors
        .slice(0, 12)
        .map(
          (item) =>
            `<div class="validation-item error">${escapeHtml(item)}</div>`
        )
        .join("");

    syncCount.textContent =
      `—/${chart.events.length}`;
  }

  eventCount.textContent =
    String(
      chart.events.length
    );
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function laneForEvent(event) {
  if (event.type === "slide") {
    return {
      y: Y.trace,
      h: LAYOUT.trace
    };
  }

  return event.side === "left"
    ? {
        y: Y.left,
        h: LAYOUT.tap
      }
    : {
        y: Y.right,
        h: LAYOUT.tap
      };
}

function resizeTimeline() {
  if (!song) return;

  const cssWidth =
    Math.max(
      viewport.clientWidth,
      activeTiming().beats *
        pxPerBeat +
        36
    );
  const dpr =
    Math.min(
      window.devicePixelRatio ||
        1,
      2
    );

  canvas.style.width =
    `${cssWidth}px`;
  canvas.style.height =
    `${Y.end}px`;
  canvas.width =
    Math.round(
      cssWidth * dpr
    );
  canvas.height =
    Math.round(
      Y.end * dpr
    );

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  renderTimeline();
}

function drawGrid() {
  const timing =
    activeTiming();
  const width =
    parseFloat(
      canvas.style.width
    ) ||
    canvas.clientWidth;

  ctx.fillStyle = "#080d14";
  ctx.fillRect(
    0,
    0,
    width,
    Y.end
  );

  if (
    Array.isArray(
      song.levelPhases
    )
  ) {
    song.levelPhases.forEach(
      (
        phase,
        index
      ) => {
        const x =
          phase.startBeat *
          pxPerBeat;
        const w =
          (
            phase.endBeat -
            phase.startBeat
          ) *
          pxPerBeat;

        ctx.fillStyle =
          index % 2 === 0
            ? "rgba(110,215,255,.018)"
            : "rgba(216,139,255,.018)";
        ctx.fillRect(
          x,
          Y.ruler,
          w,
          Y.end -
          Y.ruler
        );

        ctx.strokeStyle =
          "rgba(255,229,109,.34)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(
          x,
          Y.ruler
        );
        ctx.lineTo(
          x,
          Y.end
        );
        ctx.stroke();

        ctx.fillStyle =
          "rgba(255,229,109,.78)";
        ctx.font =
          "900 9px ui-monospace, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(
          `${index + 1} · ${phase.name ?? phase.id ?? "PHASE"}`,
          x + 5,
          Y.music - 5
        );
      }
    );
  }

  const bands = [
    [Y.ruler, LAYOUT.ruler, "rgba(255,255,255,.018)"],
    [Y.music, LAYOUT.music, "rgba(255,255,255,.010)"],
    [Y.left, LAYOUT.tap, "rgba(110,215,255,.020)"],
    [Y.right, LAYOUT.tap, "rgba(216,139,255,.020)"],
    [Y.trace, LAYOUT.trace, "rgba(255,255,255,.012)"]
  ];

  for (
    const [y, h, color] of bands
  ) {
    ctx.fillStyle = color;
    ctx.fillRect(
      0,
      y,
      width,
      h
    );
    ctx.strokeStyle =
      "rgba(255,255,255,.05)";
    ctx.beginPath();
    ctx.moveTo(0, y + h);
    ctx.lineTo(
      width,
      y + h
    );
    ctx.stroke();
  }

  const smallest =
    1 /
    timing.stepsPerBeat;

  for (
    let beat = 0;
    beat <= timing.beats +
      0.000001;
    beat += smallest
  ) {
    const x =
      beat * pxPerBeat;
    const isBeat =
      Math.abs(
        beat -
        Math.round(beat)
      ) <
      0.000001;
    const isBar =
      isBeat &&
      Math.round(beat) %
        timing.beatsPerBar ===
        0;

    ctx.strokeStyle =
      isBar
        ? "rgba(255,255,255,.20)"
        : isBeat
          ? "rgba(255,255,255,.095)"
          : "rgba(255,255,255,.035)";
    ctx.lineWidth =
      isBar
        ? 1.5
        : 1;
    ctx.beginPath();
    ctx.moveTo(
      x,
      Y.ruler
    );
    ctx.lineTo(
      x,
      Y.end
    );
    ctx.stroke();

    if (isBeat) {
      ctx.fillStyle =
        isBar
          ? "rgba(255,229,109,.78)"
          : "rgba(255,255,255,.42)";
      ctx.font =
        "800 10px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(
        String(
          Math.round(beat)
        ),
        x + 4,
        8
      );
    }
  }
}

function drawMusicLane() {
  const timing =
    activeTiming();

  if (
    song.audio?.mode ===
      "file"
  ) {
    const centerY =
      Y.music +
      LAYOUT.music / 2;

    ctx.save();
    ctx.strokeStyle =
      "rgba(110,215,255,.72)";
    ctx.lineWidth = 1;

    if (
      waveformPeaks &&
      fileAudioBuffer
    ) {
      const width =
        timing.beats *
        pxPerBeat;
      const offsetSeconds =
        Number(
          timing.offsetMs ??
          0
        ) /
        1000;

      ctx.beginPath();

      for (
        let x = 0;
        x <= width;
        x += 2
      ) {
        const beat =
          x /
          pxPerBeat;
        const audioTime =
          offsetSeconds +
          beat *
            60 /
            timing.bpm;

        if (
          audioTime < 0 ||
          audioTime >
            fileAudioBuffer
              .duration
        ) {
          continue;
        }

        const point =
          Math.min(
            waveformPeaks.length -
              1,
            Math.max(
              0,
              Math.floor(
                audioTime /
                fileAudioBuffer
                  .duration *
                waveformPeaks.length
              )
            )
          );
        const amp =
          waveformPeaks[
            point
          ] ?? 0;
        const h =
          Math.max(
            1,
            amp *
              (LAYOUT.music *
                0.42)
          );

        ctx.moveTo(
          x,
          centerY - h
        );
        ctx.lineTo(
          x,
          centerY + h
        );
      }

      ctx.stroke();
    } else {
      ctx.fillStyle =
        "rgba(255,255,255,.28)";
      ctx.font =
        "800 10px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "AUDIO FILE · usa ANALIZAR SRC o ARCHIVO LOCAL para waveform",
        12,
        centerY
      );
    }

    ctx.restore();
    return;
  }

  const step =
    1 /
    timing.stepsPerBeat;
  const stems = [
    "drums",
    "bass",
    "lead",
    "aura",
    "boss"
  ];

  for (
    let beat = 0;
    beat <
      timing.beats -
        0.000001;
    beat += step
  ) {
    const frame =
      songFrameFromData(
        song,
        beat
      );
    const audible = {
      drums:
        frame.kick ||
        frame.snare ||
        frame.hat,
      bass:
        Number.isFinite(
          frame.bassMidi
        ),
      lead:
        Number.isFinite(
          frame.leadMidi
        ),
      aura:
        Number.isFinite(
          frame.auraMidi
        ),
      boss:
        Number.isFinite(
          frame.bossMidi
        )
    };
    const x =
      beat * pxPerBeat +
      2;
    let row = 0;

    for (const stem of stems) {
      if (!audible[stem]) {
        row += 1;
        continue;
      }

      ctx.fillStyle =
        COLORS[stem];
      ctx.globalAlpha =
        stem === "boss"
          ? 0.24
          : 0.58;
      ctx.fillRect(
        x,
        Y.music +
          7 +
          row * 8,
        Math.max(
          2,
          pxPerBeat *
            step -
            4
        ),
        4
      );
      row += 1;
    }
  }

  ctx.globalAlpha = 1;
}

function drawTapEvent(
  event,
  index
) {
  const lane =
    laneForEvent(event);
  const x =
    event.beat *
    pxPerBeat;
  const y =
    lane.y +
    lane.h / 2;
  const color =
    event.side === "left"
      ? COLORS.left
      : COLORS.right;
  const invalid =
    invalidEventIndexes.has(
      index
    );
  const flowWarning =
    flowWarningIndexes.has(
      index
    );
  const selected =
    event ===
    selectedEvent;

  ctx.save();

  if (event.shield) {
    ctx.strokeStyle =
      invalid
        ? COLORS.danger
        : flowWarning
          ? "#ffc45c"
          : "rgba(220,249,255,.72)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      16,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  ctx.shadowBlur =
    selected
      ? 16
      : 7;
  ctx.shadowColor =
    invalid
      ? COLORS.danger
      : flowWarning
        ? "#ffc45c"
        : color;
  ctx.fillStyle = "#08111a";
  ctx.strokeStyle =
    invalid
      ? COLORS.danger
      : flowWarning
        ? "#ffc45c"
        : color;
  ctx.lineWidth =
    selected
      ? 3.5
      : 2.3;
  ctx.beginPath();
  ctx.arc(
    x,
    y,
    selected
      ? 11
      : 9,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle =
    invalid
      ? COLORS.danger
      : flowWarning
        ? "#ffc45c"
        : color;
  ctx.font =
    "900 9px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    String(
      event.route ?? 1
    ),
    x,
    y + 1
  );

  if (event.chainGroup) {
    ctx.fillStyle =
      "rgba(255,229,109,.76)";
    ctx.beginPath();
    ctx.arc(
      x + 12,
      y - 12,
      2.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawTraceEvent(
  event,
  index
) {
  const x =
    event.beat *
    pxPerBeat;
  const width =
    Math.max(
      12,
      event.durationBeats *
        pxPerBeat
    );
  const y =
    Y.trace + 20;
  const h = 48;
  const color =
    event.side === "left"
      ? COLORS.left
      : COLORS.right;
  const invalid =
    invalidEventIndexes.has(
      index
    );
  const selected =
    event ===
    selectedEvent;

  ctx.save();
  ctx.fillStyle =
    invalid
      ? "rgba(255,105,132,.12)"
      : event.side === "left"
        ? "rgba(110,215,255,.10)"
        : "rgba(216,139,255,.10)";
  ctx.strokeStyle =
    invalid
      ? COLORS.danger
      : color;
  ctx.lineWidth =
    selected
      ? 3
      : 2;

  roundRect(
    ctx,
    x + 2,
    y,
    width - 4,
    h,
    10
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle =
    invalid
      ? COLORS.danger
      : color;
  ctx.font =
    "900 9px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(
    `TRACE ${event.side === "left" ? "L" : "R"} · ${event.durationBeats}b`,
    x + 9,
    y + 8
  );

  ctx.strokeStyle =
    invalid
      ? COLORS.danger
      : "rgba(255,255,255,.40)";
  ctx.lineWidth = 1.5;
  const anchors =
    event.anchors ?? [];

  for (
    const anchor of anchors
  ) {
    const ax =
      x +
      (
        anchor.beat /
        Math.max(
          0.0001,
          event.durationBeats
        )
      ) *
        width;
    const ay =
      y +
      h -
      10 -
      (
        (anchor.y + 1) /
        2
      ) *
        18;

    ctx.beginPath();
    ctx.arc(
      ax,
      ay,
      3,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  ctx.restore();
}

function roundRect(
  context,
  x,
  y,
  width,
  height,
  radius
) {
  const r =
    Math.min(
      radius,
      width / 2,
      height / 2
    );
  context.beginPath();
  context.roundRect(
    x,
    y,
    width,
    height,
    r
  );
}

function drawPlayhead() {
  const x =
    playheadBeat *
    pxPerBeat;

  ctx.save();
  ctx.strokeStyle =
    "#ffe56d";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor =
    "rgba(255,229,109,.34)";
  ctx.beginPath();
  ctx.moveTo(
    x,
    0
  );
  ctx.lineTo(
    x,
    Y.end
  );
  ctx.stroke();

  ctx.fillStyle =
    "#ffe56d";
  ctx.beginPath();
  ctx.moveTo(
    x - 6,
    0
  );
  ctx.lineTo(
    x + 6,
    0
  );
  ctx.lineTo(
    x,
    8
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderTimeline() {
  if (!song || !chart) {
    return;
  }

  drawGrid();
  drawMusicLane();

  chart.events.forEach(
    (event, index) => {
      if (event.type === "tap") {
        drawTapEvent(
          event,
          index
        );
      } else {
        drawTraceEvent(
          event,
          index
        );
      }
    }
  );

  drawPlayhead();
}

function findEventAt(
  beat,
  y
) {
  if (!chart) return null;

  let best = null;
  let bestDistance =
    Infinity;

  chart.events.forEach(
    (event, index) => {
      const lane =
        laneForEvent(event);

      if (
        y <
          lane.y ||
        y >
          lane.y +
          lane.h
      ) {
        return;
      }

      if (event.type === "slide") {
        if (
          beat >=
            event.beat -
              0.08 &&
          beat <=
            event.beat +
              event.durationBeats +
              0.08
        ) {
          const distance =
            Math.abs(
              beat -
              event.beat
            );
          if (
            distance <
            bestDistance
          ) {
            best =
              event;
            bestDistance =
              distance;
          }
        }
        return;
      }

      const distance =
        Math.abs(
          beat -
          event.beat
        );

      if (
        distance <=
          14 /
          pxPerBeat &&
        distance <
          bestDistance
      ) {
        best = event;
        bestDistance =
          distance;
      }
    }
  );

  return best;
}

function canvasPoint(event) {
  const rect =
    canvas.getBoundingClientRect();
  return {
    x:
      event.clientX -
      rect.left,
    y:
      event.clientY -
      rect.top
  };
}

canvas.addEventListener(
  "pointerdown",
  (event) => {
    if (!song || !chart) return;

    const point =
      canvasPoint(event);
    const rawBeat =
      point.x /
      pxPerBeat;

    if (
      point.y <
      Y.music
    ) {
      setPlayhead(
        Math.max(
          0,
          Math.min(
            activeTiming()
              .beats,
            rawBeat
          )
        )
      );
      return;
    }

    const existing =
      findEventAt(
        rawBeat,
        point.y
      );

    if (
      tool === "select"
    ) {
      selectedEvent =
        existing;
      populateInspector();
      renderTimeline();
      return;
    }

    const beat =
      snapBeat(
        rawBeat
      );

    try {
      let created = null;

      if (
        tool === "tap-left" ||
        tool === "tap-right"
      ) {
        created =
          defaultTap(
            beat,
            tool === "tap-left"
              ? "left"
              : "right"
          );
      } else if (
        tool === "trace-left" ||
        tool === "trace-right"
      ) {
        created =
          defaultTrace(
            beat,
            tool === "trace-left"
              ? "left"
              : "right"
          );
      }

      if (!created) return;

      commitChange(
        () => {
          chart.events.push(
            created
          );
          selectedEvent =
            created;
        }
      );
    } catch (error) {
      showToast(
        error.message
      );
    }
  }
);

function bindField(
  element,
  apply
) {
  element.addEventListener(
    "change",
    () => {
      if (!selectedEvent) {
        return;
      }

      commitChange(
        () => {
          apply(
            selectedEvent,
            element
          );
        }
      );
    }
  );
}

bindField(
  eventBeatInput,
  (event, input) => {
    event.beat =
      snapBeat(
        Number(
          input.value
        )
      );
  }
);

bindField(
  eventSideInput,
  (event, input) => {
    event.side =
      input.value;
  }
);

bindField(
  eventRouteInput,
  (event, input) => {
    event.route =
      Number(
        input.value
      );
  }
);

bindField(
  eventShieldInput,
  (event, input) => {
    if (input.checked) {
      event.shield = true;
    } else {
      delete event.shield;
    }
  }
);

bindField(
  eventDurationInput,
  (event, input) => {
    if (
      event.type !== "slide"
    ) {
      return;
    }

    const duration =
      Math.max(
        snapStep,
        snapBeat(
          Number(
            input.value
          )
        )
      );

    event.durationBeats =
      duration;

    if (
      event.beat +
        duration >
      activeTiming().beats
    ) {
      event.durationBeats =
        activeTiming().beats -
        event.beat;
    }

    const anchors =
      event.anchors ?? [];

    if (anchors.length >= 2) {
      anchors[0].beat = 0;
      anchors.at(-1).beat =
        event.durationBeats;

      for (
        let index = 1;
        index <
          anchors.length - 1;
        index += 1
      ) {
        anchors[index].beat =
          Number(
            (
              event.durationBeats *
              index /
              (
                anchors.length -
                1
              )
            ).toFixed(6)
          );
      }
    }
  }
);

bindField(
  eventMinActInput,
  (event, input) => {
    const value =
      input.value.trim();

    if (!value) {
      delete event.minAct;
    } else {
      event.minAct =
        Number(value);
    }
  }
);

bindField(
  eventChainInput,
  (event, input) => {
    const value =
      input.value.trim();

    if (!value) {
      delete event.chainGroup;
    } else {
      event.chainGroup =
        value;
    }
  }
);

bindField(
  eventStemInput,
  (event, input) => {
    event.music ??= {};
    event.music.stem =
      input.value;
  }
);

bindField(
  eventIntentInput,
  (event, input) => {
    event.music ??= {};
    event.music.intent =
      input.value;
  }
);

bindField(
  eventEnergyInput,
  (event, input) => {
    event.music ??= {};
    event.music.energy =
      Number(
        input.value
      );
  }
);

bindField(
  eventPhraseInput,
  (event, input) => {
    event.music ??= {};
    event.music.phrase =
      input.value.trim();
  }
);

bindField(
  eventContourInput,
  (event, input) => {
    event.music ??= {};

    if (input.checked) {
      event.music.contour =
        true;
    } else {
      delete event.music.contour;
    }
  }
);

bindField(
  eventAnchorsInput,
  (event, input) => {
    if (
      event.type !== "slide"
    ) {
      return;
    }

    const parsed =
      JSON.parse(
        input.value
      );

    if (!Array.isArray(parsed)) {
      throw new Error(
        "anchors debe ser un array JSON."
      );
    }

    event.anchors =
      parsed;
  }
);

function bindSongField(
  element,
  apply
) {
  element.addEventListener(
    "change",
    () => {
      if (!song) return;

      commitChange(
        () => {
          apply(
            song,
            element
          );
        },
        {
          keepSelection: false
        }
      );
    }
  );
}

bindSongField(
  songTitleInput,
  (target, input) => {
    target.title =
      input.value.trim();
  }
);

bindSongField(
  songArtistInput,
  (target, input) => {
    target.artist =
      input.value.trim();
  }
);

bindSongField(
  songBpmInput,
  (target, input) => {
    target.timing.bpm =
      Number(
        input.value
      );

    if (
      target.audio?.mode ===
        "file"
    ) {
      delete target.audio.analysis;
    }
  }
);

bindSongField(
  countInInput,
  (target, input) => {
    target.timing.countInBeats =
      Number(
        input.value
      );
  }
);

bindSongField(
  songDescriptionInput,
  (target, input) => {
    target.description =
      input.value.trim();
  }
);

offsetInput.addEventListener(
  "change",
  () => {
    if (!song) return;

    commitChange(
      () => {
        song.timing.offsetMs =
          Number(
            offsetInput.value
          );

        if (
          song.audio?.mode ===
            "file"
        ) {
          delete song.audio.analysis;
        }
      },
      {
        keepSelection: false
      }
    );

    resizeTimeline();
  }
);

audioGainInput.addEventListener(
  "change",
  () => {
    if (
      song?.audio?.mode !==
        "file"
    ) {
      return;
    }

    commitChange(
      () => {
        song.audio.gain =
          Number(
            audioGainInput.value
          );
      },
      {
        keepSelection: false
      }
    );
  }
);

audioSrcInput.addEventListener(
  "change",
  async () => {
    if (
      song?.audio?.mode !==
        "file"
    ) {
      return;
    }

    clearFileAudioState();

    commitChange(
      () => {
        song.audio.src =
          audioSrcInput.value
            .trim();
        delete song.audio.analysis;
      },
      {
        keepSelection: false
      }
    );

    try {
      await prepareFileAudio();
      refreshAudioFields();
      renderTimeline();
      showToast(
        "Audio cargado · falta analizar para sync temporal fuerte."
      );
    } catch (error) {
      showToast(
        `Audio src: ${error.message}`
      );
    }
  }
);

audioModeInput.addEventListener(
  "change",
  () => {
    if (!song) return;

    const next =
      audioModeInput.value;

    if (
      next === "procedural" &&
      !song.composition
    ) {
      audioModeInput.value =
        "file";
      showToast(
        "Este package no tiene composition procedural."
      );
      return;
    }

    clearFileAudioState();

    commitChange(
      () => {
        if (next === "file") {
          song.audio = {
            mode: "file",
            src:
              "../assets/audio/replace-me.ogg",
            gain: 0.9,
            stems: ["mix"]
          };

          for (
            const item of
            song.charts.flatMap(
              (entry) =>
                entry.events
            )
          ) {
            item.music ??= {};
            item.music.stem =
              "mix";
            delete item.music.contour;
          }
        } else {
          song.audio = {
            mode: "procedural",
            engine:
              "aura-procedural-v1",
            stems: [
              "drums",
              "bass",
              "harmony",
              "lead",
              "aura",
              "boss"
            ]
          };
          song.timing.offsetMs = 0;
        }
      },
      {
        keepSelection: false
      }
    );
  }
);

analyzeAudioButton.addEventListener(
  "click",
  async () => {
    if (
      song?.audio?.mode !==
        "file"
    ) {
      return;
    }

    analyzeAudioButton.disabled =
      true;
    analyzeAudioButton.textContent =
      "ANALIZANDO…";

    try {
      const buffer =
        fileAudioBuffer ??
        await prepareFileAudio();

      const analysis =
        analyzeAudioSteps(
          buffer,
          song.timing
        );

      commitChange(
        () => {
          song.audio.analysis =
            analysis;
        },
        {
          keepSelection: false
        }
      );

      refreshAudioFields();
      showToast(
        "Waveform + energía por paso actualizadas."
      );
    } catch (error) {
      showToast(
        `Análisis falló: ${error.message}`
      );
    } finally {
      analyzeAudioButton.disabled =
        false;
      analyzeAudioButton.textContent =
        "ANALIZAR SRC";
    }
  }
);

localAudioButton.addEventListener(
  "click",
  () =>
    localAudioInput.click()
);

localAudioInput.addEventListener(
  "change",
  async () => {
    const file =
      localAudioInput.files?.[0];

    if (!file) return;

    try {
      if (
        song?.audio?.mode !==
          "file"
      ) {
        showToast(
          "Cambia AUDIO MODE a FILE primero."
        );
        return;
      }

      const buffer =
        await decodeLocalAudioFile(
          file
        );

      validateDecodedAudioDuration(
        song,
        buffer
      );

      fileAudioBuffer =
        buffer;
      waveformPeaks =
        buildWaveformPeaks(
          buffer,
          2400
        );
      localAudioFileName =
        file.name;

      const analysis =
        analyzeAudioSteps(
          buffer,
          song.timing
        );

      commitChange(
        () => {
          song.audio.analysis =
            analysis;
        },
        {
          keepSelection: false
        }
      );

      refreshAudioFields();
      resizeTimeline();
      showToast(
        `Local analizado: ${file.name}. Recuerda colocar el asset real en audio.src antes de publicar.`
      );
    } catch (error) {
      showToast(
        `Audio local: ${error.message}`
      );
    } finally {
      localAudioInput.value = "";
    }
  }
);

difficultyInput.addEventListener(
  "change",
  () => {
    if (!chart) return;
    commitChange(
      () => {
        chart.difficulty =
          difficultyInput.value
            .trim() ||
          "standard";
      },
      {
        keepSelection: false
      }
    );
  }
);

autoMusicButton.addEventListener(
  "click",
  () => {
    if (!selectedEvent) return;

    try {
      const next =
        autoMusicForBeat(
          selectedEvent.beat,
          selectedEvent.type
        );

      commitChange(
        () => {
          selectedEvent.music =
            next;
        }
      );
    } catch (error) {
      showToast(
        error.message
      );
    }
  }
);

deleteButton.addEventListener(
  "click",
  () =>
    deleteSelection()
);

duplicateButton.addEventListener(
  "click",
  () => {
    if (!selectedEvent) return;

    const copy =
      clone(
        selectedEvent
      );
    copy.beat =
      snapBeat(
        selectedEvent.beat +
          snapStep
      );

    commitChange(
      () => {
        chart.events.push(
          copy
        );
        selectedEvent =
          copy;
      }
    );
  }
);

function deleteSelection() {
  if (!selectedEvent) return;

  commitChange(
    () => {
      const index =
        chart.events.indexOf(
          selectedEvent
        );

      if (index >= 0) {
        chart.events.splice(
          index,
          1
        );
      }

      selectedEvent = null;
    },
    {
      keepSelection: false
    }
  );
}

document
  .querySelectorAll(".tool")
  .forEach(
    (button) => {
      button.addEventListener(
        "click",
        () =>
          setTool(
            button.dataset.tool
          )
      );
    }
  );

snapSelect.addEventListener(
  "change",
  () => {
    snapStep =
      Number(
        snapSelect.value
      );
    populateInspector();
  }
);

zoomRange.addEventListener(
  "input",
  () => {
    const centerBeat =
      (
        viewport.scrollLeft +
        viewport.clientWidth / 2
      ) /
      pxPerBeat;

    pxPerBeat =
      Number(
        zoomRange.value
      );
    resizeTimeline();

    viewport.scrollLeft =
      Math.max(
        0,
        centerBeat *
          pxPerBeat -
          viewport.clientWidth /
            2
      );
  }
);

chartSelect.addEventListener(
  "change",
  () => {
    chart =
      song.charts.find(
        (item) =>
          item.id ===
          chartSelect.value
      ) ??
      song.charts[0];
    selectedEvent = null;
    populateAllUi();
  }
);

songSelect.addEventListener(
  "change",
  async () => {
    await loadSongById(
      songSelect.value
    );
  }
);

newChartButton.addEventListener(
  "click",
  () => {
    if (!song) return;

    const rawName =
      window.prompt(
        "Nombre del nuevo chart",
        "New Chart"
      );

    if (!rawName) return;

    const id =
      rawName
        .toLowerCase()
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        ) ||
      `chart-${song.charts.length + 1}`;

    if (
      song.charts.some(
        (item) =>
          item.id === id
      )
    ) {
      showToast(
        "Ya existe un chart con ese id."
      );
      return;
    }

    commitChange(
      () => {
        const next = {
          id,
          name: rawName,
          difficulty: "standard",
          mechanicsVersion:
            "aura-chart-v1",
          events: []
        };
        song.charts.push(next);
        chart = next;
        selectedEvent = null;
      },
      {
        keepSelection: false
      }
    );
  }
);

undoButton.addEventListener(
  "click",
  () =>
    restoreSnapshot(
      historyIndex - 1
    )
);

redoButton.addEventListener(
  "click",
  () =>
    restoreSnapshot(
      historyIndex + 1
    )
);

importButton.addEventListener(
  "click",
  () =>
    importInput.click()
);

importInput.addEventListener(
  "change",
  async () => {
    const file =
      importInput.files?.[0];

    if (!file) return;

    try {
      const imported =
        JSON.parse(
          await file.text()
        );
      validateGameSong(
        imported
      );

      const importedChart =
        imported.charts.find(
          (item) =>
            item.id ===
            imported.defaultChart
        ) ??
        imported.charts[0];

      validateGameChart(
        importedChart,
        imported
      );

      clearFileAudioState();
      song = imported;
      chart =
        importedChart;
      songSourceUrl =
        new URL(
          `../songs/${song.id}.json`,
          import.meta.url
        ).href;
      selectedEvent = null;
      playheadBeat = 0;
      snapStep =
        1 /
        song.timing.stepsPerBeat;

      if (
        song.audio?.mode ===
          "file"
      ) {
        try {
          await prepareFileAudio();
        } catch (audioError) {
          showToast(
            `Package importado; waveform pendiente: ${audioError.message}`
          );
        }
      }

      resetHistory();
      populateAllUi();
      showToast(
        "Song package importado."
      );
    } catch (error) {
      showToast(
        `Import falló: ${error.message}`
      );
    } finally {
      importInput.value = "";
    }
  }
);

exportButton.addEventListener(
  "click",
  () => {
    if (!song) return;

    validateNow();

    if (
      validationBadge.dataset
        .state === "error"
    ) {
      const proceed =
        window.confirm(
          "El package tiene errores de validación. ¿Exportar igualmente para seguir trabajando?"
        );

      if (!proceed) return;
    } else if (
      validationBadge.dataset
        .state === "warning"
    ) {
      const proceed =
        window.confirm(
          "El chart es estructuralmente válido, pero el audio externo aún está en GRID ONLY. ¿Exportar sin análisis temporal fuerte?"
        );

      if (!proceed) return;
    }

    const blob =
      new Blob(
        [
          JSON.stringify(
            song,
            null,
            2
          ) + "\n"
        ],
        {
          type:
            "application/json"
        }
      );
    const url =
      URL.createObjectURL(
        blob
      );
    const anchor =
      document.createElement(
        "a"
      );
    anchor.href = url;
    anchor.download =
      `${song.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
);

function ensureAudio() {
  audioContext =
    ensureAudioContext();

  if (
    audioContext.state ===
    "suspended"
  ) {
    audioContext.resume();
  }

  if (!noiseBuffer) {
    noiseBuffer =
      audioContext.createBuffer(
        1,
        Math.floor(
          audioContext.sampleRate *
            0.12
        ),
        audioContext.sampleRate
      );
    const data =
      noiseBuffer.getChannelData(
        0
      );

    for (
      let i = 0;
      i < data.length;
      i += 1
    ) {
      data[i] =
        Math.random() *
          2 -
        1;
    }
  }
}

function scheduleTone(
  time,
  frequency,
  duration,
  gainValue,
  type = "sine"
) {
  const oscillator =
    audioContext
      .createOscillator();
  const gain =
    audioContext
      .createGain();

  oscillator.type = type;
  oscillator.frequency
    .setValueAtTime(
      frequency,
      time
    );
  gain.gain
    .setValueAtTime(
      0.0001,
      time
    );
  gain.gain
    .exponentialRampToValueAtTime(
      gainValue,
      time + 0.004
    );
  gain.gain
    .exponentialRampToValueAtTime(
      0.0001,
      time + duration
    );
  oscillator.connect(gain);
  gain.connect(
    audioContext.destination
  );
  oscillator.start(time);
  oscillator.stop(
    time + duration + 0.02
  );
}

function scheduleNoise(
  time,
  duration,
  gainValue
) {
  const source =
    audioContext
      .createBufferSource();
  const filter =
    audioContext
      .createBiquadFilter();
  const gain =
    audioContext
      .createGain();

  source.buffer =
    noiseBuffer;
  filter.type =
    "highpass";
  filter.frequency.value =
    2800;
  gain.gain
    .setValueAtTime(
      gainValue,
      time
    );
  gain.gain
    .exponentialRampToValueAtTime(
      0.0001,
      time + duration
    );
  source.connect(filter);
  filter.connect(gain);
  gain.connect(
    audioContext.destination
  );
  source.start(time);
  source.stop(
    time + duration
  );
}

function scheduleFrame(
  beat,
  time
) {
  const frame =
    songFrameFromData(
      song,
      beat
    );

  if (frame.kick) {
    scheduleTone(
      time,
      72,
      0.10,
      0.065,
      "sine"
    );
  }

  if (frame.snare) {
    scheduleNoise(
      time,
      0.055,
      0.032
    );
  }

  if (frame.hat) {
    scheduleNoise(
      time,
      0.025,
      0.010 *
        frame.hatAccent
    );
  }

  if (
    Number.isFinite(
      frame.bassMidi
    )
  ) {
    scheduleTone(
      time,
      midiToHz(
        frame.bassMidi
      ),
      0.16,
      0.022,
      "sine"
    );
  }

  if (
    Array.isArray(
      frame.chordMidi
    )
  ) {
    for (
      const midi of
      frame.chordMidi
    ) {
      scheduleTone(
        time,
        midiToHz(midi),
        0.22,
        0.007,
        "triangle"
      );
    }
  }

  if (
    Number.isFinite(
      frame.leadMidi
    )
  ) {
    scheduleTone(
      time,
      midiToHz(
        frame.leadMidi
      ),
      0.14,
      0.013,
      "triangle"
    );
  }

  if (
    Number.isFinite(
      frame.auraMidi
    )
  ) {
    scheduleTone(
      time,
      midiToHz(
        frame.auraMidi
      ),
      0.18,
      0.010,
      "sine"
    );
  }
}

function schedulePlayback() {
  if (
    !playing ||
    !audioContext ||
    song?.audio?.mode ===
      "file"
  ) {
    return;
  }

  const timing =
    activeTiming();
  const stepDuration =
    60 /
    timing.bpm /
    timing.stepsPerBeat;
  const horizon =
    audioContext.currentTime +
    0.14;

  while (true) {
    const beat =
      nextScheduleStep /
      timing.stepsPerBeat;
    const time =
      playbackStartTime +
      (
        beat -
        playbackStartBeat
      ) *
        60 /
        timing.bpm;

    if (
      beat >=
      timing.beats
    ) {
      stopPlayback(
        false
      );
      return;
    }

    if (time >= horizon) {
      break;
    }

    if (
      time >=
      audioContext.currentTime
    ) {
      scheduleFrame(
        beat,
        time
      );
    }

    nextScheduleStep += 1;

    if (
      stepDuration <= 0
    ) {
      break;
    }
  }
}

function startFilePlayback() {
  if (
    !fileAudioBuffer ||
    !audioContext ||
    song?.audio?.mode !==
      "file"
  ) {
    return;
  }

  if (filePlaybackSource) {
    try {
      filePlaybackSource.stop();
    } catch {
      // Already ended.
    }
    filePlaybackSource = null;
  }

  const source =
    audioContext
      .createBufferSource();
  const gain =
    audioContext
      .createGain();
  const timing =
    activeTiming();
  const offsetSeconds =
    Number(
      timing.offsetMs ??
      0
    ) /
    1000;
  const audioTime =
    offsetSeconds +
    playbackStartBeat *
      60 /
      timing.bpm;

  source.buffer =
    fileAudioBuffer;
  gain.gain.value =
    Math.max(
      0,
      Math.min(
        2,
        Number(
          song.audio.gain ??
          1
        )
      )
    );
  source.connect(gain);
  gain.connect(
    audioContext.destination
  );

  if (audioTime >= 0) {
    source.start(
      playbackStartTime,
      Math.min(
        audioTime,
        Math.max(
          0,
          fileAudioBuffer.duration -
            0.001
        )
      )
    );
  } else {
    source.start(
      playbackStartTime -
        audioTime,
      0
    );
  }

  source.onended =
    () => {
      if (
        filePlaybackSource ===
          source
      ) {
        filePlaybackSource =
          null;
      }
    };

  filePlaybackSource =
    source;
}

function animatePlayback() {
  if (
    !playing ||
    !audioContext
  ) {
    return;
  }

  const timing =
    activeTiming();
  const beat =
    playbackStartBeat +
    (
      audioContext.currentTime -
      playbackStartTime
    ) *
      timing.bpm /
      60;

  if (
    beat >= timing.beats
  ) {
    stopPlayback(false);
    return;
  }

  setPlayhead(
    beat
  );

  const x =
    beat * pxPerBeat;
  const left =
    viewport.scrollLeft;
  const right =
    left +
    viewport.clientWidth;

  if (
    x > right - 90 ||
    x < left + 40
  ) {
    viewport.scrollLeft =
      Math.max(
        0,
        x -
          viewport.clientWidth *
            0.36
      );
  }

  animationFrame =
    requestAnimationFrame(
      animatePlayback
    );
}

async function startPlayback() {
  if (!song) return;

  if (playing) {
    stopPlayback(false);
    return;
  }

  ensureAudio();
  await audioContext.resume();

  if (
    song.audio?.mode ===
      "file" &&
    !fileAudioBuffer
  ) {
    try {
      await prepareFileAudio();
    } catch (error) {
      showToast(
        `No puedo reproducir audio: ${error.message}`
      );
      return;
    }
  }

  playing = true;
  playButton.textContent =
    "Ⅱ PAUSE";
  playbackStartBeat =
    Math.min(
      playheadBeat,
      activeTiming().beats -
        1 /
          activeTiming()
            .stepsPerBeat
    );
  playbackStartTime =
    audioContext.currentTime +
    0.06;
  nextScheduleStep =
    Math.ceil(
      playbackStartBeat *
      activeTiming()
        .stepsPerBeat
    );

  if (
    song.audio?.mode ===
      "file"
  ) {
    startFilePlayback();
  } else {
    schedulePlayback();
    playbackTimer =
      window.setInterval(
        schedulePlayback,
        25
      );
  }

  animatePlayback();
}

function stopPlayback(
  reset = true
) {
  playing = false;
  playButton.textContent =
    "▶ PLAY";
  window.clearInterval(
    playbackTimer
  );
  playbackTimer = null;

  if (filePlaybackSource) {
    try {
      filePlaybackSource.stop();
    } catch {
      // Already ended.
    }
    filePlaybackSource =
      null;
  }

  if (animationFrame) {
    cancelAnimationFrame(
      animationFrame
    );
    animationFrame = null;
  }

  if (reset) {
    setPlayhead(0);
  }
}

playButton.addEventListener(
  "click",
  () =>
    startPlayback()
);

stopButton.addEventListener(
  "click",
  () =>
    stopPlayback(true)
);

document.addEventListener(
  "keydown",
  (event) => {
    const target =
      event.target;

    if (
      target instanceof
        HTMLInputElement ||
      target instanceof
        HTMLTextAreaElement ||
      target instanceof
        HTMLSelectElement
    ) {
      return;
    }

    const command =
      event.metaKey ||
      event.ctrlKey;

    if (
      command &&
      event.key.toLowerCase() ===
        "s"
    ) {
      event.preventDefault();
      exportButton.click();
      return;
    }

    if (
      command &&
      event.key.toLowerCase() ===
        "o"
    ) {
      event.preventDefault();
      importButton.click();
      return;
    }

    if (
      command &&
      event.key.toLowerCase() ===
        "z"
    ) {
      event.preventDefault();

      if (event.shiftKey) {
        redoButton.click();
      } else {
        undoButton.click();
      }
      return;
    }

    if (
      event.key === " "
    ) {
      event.preventDefault();
      startPlayback();
      return;
    }

    if (
      event.key === "Delete" ||
      event.key ===
        "Backspace"
    ) {
      event.preventDefault();
      deleteSelection();
      return;
    }

    if (
      selectedEvent &&
      (
        event.key ===
          "ArrowLeft" ||
        event.key ===
          "ArrowRight"
      )
    ) {
      event.preventDefault();
      const direction =
        event.key ===
          "ArrowLeft"
          ? -1
          : 1;

      commitChange(
        () => {
          selectedEvent.beat =
            snapBeat(
              selectedEvent.beat +
                direction *
                  snapStep
            );
        }
      );
    }
  }
);

async function loadSongById(
  id
) {
  stopPlayback(false);

  const entry =
    registry.songs.find(
      (item) =>
        item.id === id
    );

  if (!entry) {
    showToast(
      "Song no registrada."
    );
    return;
  }

  try {
    const url =
      new URL(
        `../songs/${entry.file}?v=0.48`,
        import.meta.url
      );
    const loaded =
      await loadGameSong(
        url,
        {
          chartId:
            entry.chartId ??
            null
        }
      );

    clearFileAudioState();
    songSourceUrl =
      loaded.sourceUrl;
    song =
      clone(
        loaded.song
      );
    chart =
      song.charts.find(
        (item) =>
          item.id ===
          loaded.chart.id
      ) ??
      song.charts[0];
    selectedEvent = null;
    playheadBeat = 0;
    snapStep =
      1 /
      song.timing
        .stepsPerBeat;
    if (
      song.audio?.mode ===
        "file"
    ) {
      try {
        await prepareFileAudio();
      } catch (audioError) {
        showToast(
          `Song cargada; audio pendiente: ${audioError.message}`
        );
      }
    }

    resetHistory();
    populateAllUi();

    const label =
      loaded.alignment.mode ===
        "semantic-stem"
        ? `${loaded.alignment.checked}/${loaded.alignment.checked} sync verified`
        : loaded.alignment.mode ===
            "mix-energy"
          ? `${loaded.alignment.verified}/${loaded.alignment.checked} audio analyzed`
          : "grid only";

    showToast(
      `${song.title} · ${label}`
    );
  } catch (error) {
    validationBadge.dataset.state =
      "error";
    validationBadge.textContent =
      "LOAD ERROR";
    validationTitle.textContent =
      error.message;
    validationList.innerHTML =
      `<div class="validation-item error">${escapeHtml(error.message)}</div>`;
  }
}

async function boot() {
  try {
    const registryUrl =
      new URL(
        "../songs/index.json?v=0.48",
        import.meta.url
      );
    registry =
      await loadSongRegistry(
        registryUrl
      );
    populateSongSelect();
    await loadSongById(
      registry.defaultSong
    );
  } catch (error) {
    validationBadge.dataset.state =
      "error";
    validationBadge.textContent =
      "BOOT ERROR";
    validationTitle.textContent =
      error.message;
    validationList.innerHTML =
      `<div class="validation-item error">${escapeHtml(error.message)}</div>`;
  }
}

window.addEventListener(
  "resize",
  () =>
    resizeTimeline()
);

void boot();
