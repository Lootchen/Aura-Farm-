import { loadGameChart } from "./chart.js?v=0.24";

const app = document.querySelector(".app");
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startPanel = document.querySelector("#startPanel");
const startButton = document.querySelector("#startButton");
const dailyButton = document.querySelector("#dailyButton");
const rerunButton = document.querySelector("#rerunButton");
const summaryDailyButton = document.querySelector("#summaryDailyButton");
const leftButton = document.querySelector("#leftButton");
const rightButton = document.querySelector("#rightButton");
const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const actEl = document.querySelector("#act");
const lastHitEl = document.querySelector("#lastHit");
const upgradePanel = document.querySelector("#upgradePanel");
const upgradeTitle = document.querySelector("#upgradeTitle");
const upgradeCards = document.querySelector("#upgradeCards");
const summaryPanel = document.querySelector("#summaryPanel");
const summaryTitle = document.querySelector("#summaryTitle");
const summaryScore = document.querySelector("#summaryScore");
const summaryHits = document.querySelector("#summaryHits");
const summaryChains = document.querySelector("#summaryChains");
const summaryMisses = document.querySelector("#summaryMisses");
const summaryBoss = document.querySelector("#summaryBoss");
const summaryBuild = document.querySelector("#summaryBuild");
const summaryUnlock = document.querySelector("#summaryUnlock");
const calibrationMinus = document.querySelector("#calibrationMinus");
const calibrationPlus = document.querySelector("#calibrationPlus");
const calibrationValue = document.querySelector("#calibrationValue");
const machineOptions =
  [...document.querySelectorAll(".machine-option")];

const DESIGN = { width: 540, height: 960 };

let BPM = 110;
let LOOP_BEATS = 24;
let COUNT_IN_BEATS = 4;
let CHART = [];
let chartName = "cargando…";
let chartLoaded = false;

const NOTE_SPEED = 275;
const NOTE_RADIUS = 20;
const PATH_SAMPLES = 160;
const POST_HIT_SPEED = 455;

const TAP_MISS_WINDOW = 0.160;

const JUDGEMENTS = {
  perfect: { label: "PERFECT", points: 300, color: "#ffe47a" }
};

const FLIPPER = {
  length: 74,
  width: 17,
  attack: 0.045,
  hold: 0.012,
  return: 0.095
};
FLIPPER.cycle = FLIPPER.attack + FLIPPER.hold + FLIPPER.return;

const SLIDE = {
  leadSeconds: 2.45,
  startEarly: 0.28,
  startLate: 0.28,
  scrollSpeed: 145,
  railTolerance: 25,
  disconnectGrace: 0.15,
  minCoverage: 0.68,
  joystickRadius: 40,
  inputRadius: 62,
  reachMin: 0.88,
  reachMax: 1.15,
  nodeBeats: 0.5,
  followSpeed: 2.25,
  traceGrabRadius: 48
};

const POWER_ORB_BASE_SCALE = 1.55;

const BUMPER_LAYOUT = [
  { x: 270, y: 535, radius: 31 },
  { x: 185, y: 430, radius: 27 },
  { x: 355, y: 430, radius: 27 }
];

const RUN_ACTS = 7;
const FINAL_ACT = RUN_ACTS;
const BOSS_MAX_HEALTH = 18;
const PROFILE_KEY = "aura-farm-profile-v1";
const METRICS_KEY = "aura-farm-metrics-v1";

const MACHINES = {
  forge: {
    name: "FORGE",
    unlockRuns: 0,
    accent: [255, 196, 92],
    secondary: [110, 215, 255]
  },
  prism: {
    name: "PRISM",
    unlockRuns: 1,
    accent: [211, 139, 255],
    secondary: [94, 226, 215]
  },
  pulse: {
    name: "PULSE",
    unlockRuns: 3,
    accent: [255, 105, 148],
    secondary: [255, 226, 104]
  }
};

function loadLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw
      ? { ...fallback, ...JSON.parse(raw) }
      : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function saveLocalJson(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch {
    // Storage is optional; gameplay must never depend on it.
  }
}

const profile = loadLocalJson(
  PROFILE_KEY,
  {
    runsCompleted: 0,
    bestScore: 0,
    selectedMachine: "forge",
    calibrationOffsetMs: 0
  }
);

const lifetimeMetrics = loadLocalJson(
  METRICS_KEY,
  {
    sessions: 0,
    runsStarted: 0,
    runsCompleted: 0,
    totalChains: 0,
    traceAttempts: 0,
    traceSuccess: 0,
    followAttempts: 0,
    followSuccess: 0
  }
);

lifetimeMetrics.sessions += 1;
saveLocalJson(METRICS_KEY, lifetimeMetrics);

let selectedMachine =
  MACHINES[profile.selectedMachine]
    ? profile.selectedMachine
    : "forge";
let runMode = "standard";
let runSeed = 1;
let rngState = 1;
let buildHistory = [];
let runStartedAt = 0;
let maxCombo = 0;
let runStats = null;
let bossState = {
  active: false,
  health: BOSS_MAX_HEALTH,
  maxHealth: BOSS_MAX_HEALTH,
  broken: false,
  damage: 0,
  hitFlash: 0
};

function machinePalette() {
  return MACHINES[selectedMachine] ??
    MACHINES.forge;
}

function machineUnlocked(id) {
  return (
    profile.runsCompleted >=
    (MACHINES[id]?.unlockRuns ?? Infinity)
  );
}

function applyMachineSelection(id) {
  if (!MACHINES[id] || !machineUnlocked(id)) {
    return false;
  }

  selectedMachine = id;
  profile.selectedMachine = id;
  saveLocalJson(PROFILE_KEY, profile);
  app.dataset.machine = id;

  for (const option of machineOptions) {
    option.classList.toggle(
      "is-selected",
      option.dataset.machine === id
    );
  }

  return true;
}

function refreshMachineOptions() {
  for (const option of machineOptions) {
    const id = option.dataset.machine;
    const unlocked = machineUnlocked(id);

    option.classList.toggle(
      "is-locked",
      !unlocked
    );
    option.disabled = !unlocked;

    if (unlocked && id !== "forge") {
      const small = option.querySelector("small");
      if (small) small.textContent = "Desbloqueada";
    }
  }

  applyMachineSelection(
    machineUnlocked(selectedMachine)
      ? selectedMachine
      : "forge"
  );
}

function hashString(value) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function localDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month =
    String(date.getMonth() + 1).padStart(2, "0");
  const day =
    String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function seedRunRng(seed) {
  runSeed = (seed >>> 0) || 1;
  rngState = runSeed;
}

function runRandom() {
  if (runMode !== "daily") {
    return Math.random();
  }

  let x = rngState >>> 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  rngState = x >>> 0;

  return rngState / 4294967296;
}

function recordLifetimeMetric(key, amount = 1) {
  lifetimeMetrics[key] =
    Number(lifetimeMetrics[key] || 0) +
    amount;
  saveLocalJson(
    METRICS_KEY,
    lifetimeMetrics
  );
}

function newRunStats() {
  return {
    startedAt: performance.now(),
    traceAttempts: 0,
    traceSuccess: 0,
    followAttempts: 0,
    followSuccess: 0,
    chosenUpgrades: [],
    firstChainMs: null
  };
}

class RhythmClock {
  constructor() {
    this.context = null;
    this.startAt = 0;
    this.nextStep = 0;
    this.timer = null;
    this.noiseBuffer = null;
  }

  async start() {
    this.context ??= new AudioContext();
    await this.context.resume();

    if (!this.noiseBuffer) {
      const length = Math.floor(this.context.sampleRate * 0.12);
      this.noiseBuffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);

      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    const beatDuration = 60 / BPM;
    this.startAt =
      this.context.currentTime +
      0.10 +
      COUNT_IN_BEATS * beatDuration;

    this.nextStep = -COUNT_IN_BEATS * 2;

    this.stopScheduler();
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stopScheduler() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  get songTime() {
    if (!this.context) return -COUNT_IN_BEATS * (60 / BPM);
    return this.context.currentTime - this.startAt;
  }

  get beat() {
    return this.songTime / (60 / BPM);
  }

  schedule() {
    if (!this.context) return;

    const beatDuration = 60 / BPM;
    const horizon = this.context.currentTime + 0.14;

    while (
      this.startAt + (this.nextStep / 2) * beatDuration <
      horizon
    ) {
      const beat = this.nextStep / 2;
      const time = this.startAt + beat * beatDuration;

      if (time >= this.context.currentTime) {
        if (beat < 0) {
          if (Number.isInteger(beat)) this.scheduleCountIn(time, beat);
        } else {
          this.scheduleGroove(time, beat);
        }
      }

      this.nextStep += 1;
    }
  }

  scheduleCountIn(time, beat) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.frequency.value = beat === -1 ? 880 : 620;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.065, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.055);
  }

  scheduleGroove(time, beat) {
    const barBeat =
      ((beat % 4) + 4) % 4;
    const actEnergy =
      clamp(
        (wave - 1) /
          Math.max(1, RUN_ACTS - 1),
        0,
        1
      );
    const buildEnergy =
      Math.min(
        1,
        buildHistory.length / 6
      );

    this.scheduleHat(
      time,
      0.016 +
        actEnergy * 0.008 +
        buildEnergy * 0.004
    );

    if (
      Math.abs(barBeat - 0) < 0.001 ||
      Math.abs(barBeat - 2) < 0.001
    ) {
      this.scheduleKick(time);
    }

    if (
      Math.abs(barBeat - 1) < 0.001 ||
      Math.abs(barBeat - 3) < 0.001
    ) {
      this.scheduleSnare(time);
    }

    if (Number.isInteger(beat)) {
      this.scheduleBass(time, beat);

      if (
        runMods.slideNova > 0 ||
        runMods.slideMirror > 0
      ) {
        this.scheduleLead(
          time,
          beat,
          0.012 +
            0.006 *
              Math.min(
                3,
                runMods.slideNova +
                  runMods.slideMirror
              )
        );
      }

      if (
        (
          runMods.shockwave +
          runMods.fusionBlast +
          runMods.wallCharge
        ) > 0 &&
        Math.abs(barBeat) < 0.001
      ) {
        this.scheduleAuraPulse(
          time,
          0.018 +
            0.006 *
              Math.min(
                3,
                runMods.shockwave +
                  runMods.fusionBlast +
                  runMods.wallCharge
              )
        );
      }

      if (wave === FINAL_ACT) {
        this.scheduleBossDrone(
          time,
          beat
        );
      }
    }

    if (
      Math.abs(barBeat % 1 - 0.5) <
        0.001 &&
      (
        runMods.twinShots > 0 ||
        runMods.chainRelay > 0 ||
        runMods.bumperSplit > 0
      )
    ) {
      this.scheduleBuildClick(
        time,
        0.010 +
          0.004 *
            Math.min(
              3,
              runMods.twinShots +
                runMods.chainRelay +
                runMods.bumperSplit
            )
      );
    }
  }

  scheduleHat(time, volume) {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = 5200;

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    source.start(time);
    source.stop(time + 0.045);
  }

  scheduleSnare(time) {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = 1700;
    filter.Q.value = 0.8;

    gain.gain.setValueAtTime(0.045, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.085);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    source.start(time);
    source.stop(time + 0.09);
  }

  scheduleKick(time) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(125, time);
    oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.10);

    gain.gain.setValueAtTime(0.085, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.13);
  }

  scheduleBass(time, beat) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const pattern = [110, 110, 123.47, 98];
    const frequency = pattern[Math.floor(beat) % pattern.length];

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.025, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start(time);
    oscillator.stop(time + 0.18);
  }

  scheduleLead(time, beat, volume) {
    const oscillator =
      this.context.createOscillator();
    const gain =
      this.context.createGain();
    const filter =
      this.context.createBiquadFilter();
    const pattern =
      [440, 493.88, 587.33, 659.25];
    const frequency =
      pattern[Math.floor(beat) % pattern.length];

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(
      frequency,
      time
    );

    filter.type = "lowpass";
    filter.frequency.value = 1800;

    gain.gain.setValueAtTime(
      0.0001,
      time
    );
    gain.gain.exponentialRampToValueAtTime(
      volume,
      time + 0.008
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.12
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.14);
  }

  scheduleBuildClick(time, volume) {
    const source =
      this.context.createBufferSource();
    const filter =
      this.context.createBiquadFilter();
    const gain =
      this.context.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = 3300;
    filter.Q.value = 2.4;

    gain.gain.setValueAtTime(
      volume,
      time
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.025
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    source.start(time);
    source.stop(time + 0.03);
  }

  scheduleAuraPulse(time, volume) {
    const oscillator =
      this.context.createOscillator();
    const gain =
      this.context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      220,
      time
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      110,
      time + 0.22
    );

    gain.gain.setValueAtTime(
      volume,
      time
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.24
    );

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.25);
  }

  scheduleBossDrone(time, beat) {
    const oscillator =
      this.context.createOscillator();
    const gain =
      this.context.createGain();

    oscillator.type = "square";
    oscillator.frequency.value =
      beat % 2 === 0 ? 55 : 61.74;

    gain.gain.setValueAtTime(
      0.0001,
      time
    );
    gain.gain.exponentialRampToValueAtTime(
      0.012,
      time + 0.012
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.34
    );

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.36);
  }
}

const clock = new RhythmClock();

let viewport = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  dpr: 1,
  cssWidth: DESIGN.width,
  cssHeight: DESIGN.height
};

let routes = null;
let running = false;
let active = new Map();
let resolved = new Set();
let explosions = [];
let impactFlashes = [];
let score = 0;
let combo = 0;
let hitCount = 0;
let missCount = 0;
let chainCount = 0;
let collisionCount = 0;
let wallExplosionCount = 0;
let lastDeltaMs = null;
let lastJudgement = "—";
let lastFrame = performance.now();
let fps = 60;
let message = "";
let messageColor = "#ffffff";
let messageUntil = 0;
let calibrationOffsetMs = Number(profile.calibrationOffsetMs || 0);
let lastInputType = "—";
let showDebug = false;
let wave = 1;
let awaitingUpgrade = false;

const runMods = {
  twinShots: 0,
  ricochetBounces: 0,
  pierceHits: 0,
  fragmentCount: 0,
  bumperCount: 0,
  slideNova: 0,
  slideMirror: 0,
  chainRelay: 0,
  shockwave: 0,
  fusionBlast: 0,
  wallCharge: 0,
  bumperSplit: 0,
  comboShieldCharges: 0
};

const UPGRADES = [
  {
    id: "twin-shot",
    family: "shot",
    icon: "Ⅱ",
    title: "Gemela",
    effect: "+1 ORB",
    desc: "Cada PERFECT dispara una bola extra.",
    apply: () => {
      runMods.twinShots += 1;
    }
  },
  {
    id: "ricochet",
    family: "collision",
    icon: "↗",
    title: "Rebote",
    effect: "+1 REBOTE",
    desc: "Tus proyectiles sobreviven a otra pared.",
    apply: () => {
      runMods.ricochetBounces += 1;
    }
  },
  {
    id: "pierce",
    family: "collision",
    icon: "➞",
    title: "Perfora",
    effect: "+1 BLANCO",
    desc: "Atraviesa una nota y sigue volando.",
    apply: () => {
      runMods.pierceHits += 1;
    }
  },
  {
    id: "fragments",
    family: "explosion",
    icon: "✣",
    title: "Astillas",
    effect: "+FRAGMENTOS",
    desc: "Las explosiones escupen nuevas bolas.",
    apply: () => {
      runMods.fragmentCount += runMods.fragmentCount === 0 ? 3 : 2;
    }
  },
  {
    id: "bumper",
    family: "arena",
    icon: "◉",
    title: "Bumper",
    effect: "+OBSTÁCULO",
    desc: "Añade un reflector físico al tablero.",
    available: () => runMods.bumperCount < BUMPER_LAYOUT.length,
    apply: () => {
      runMods.bumperCount = Math.min(
        BUMPER_LAYOUT.length,
        runMods.bumperCount + 1
      );
    }
  },
  {
    id: "nova",
    family: "slide",
    icon: "✹",
    title: "Nova",
    effect: "+2 POWER",
    desc: "Cada Slide termina en una salva mayor.",
    apply: () => {
      runMods.slideNova += 1;
    }
  },
  {
    id: "mirror-slide",
    family: "slide",
    icon: "◇",
    title: "Espejo",
    effect: "DOBLE GARRA",
    desc: "Un Slide también dispara desde la otra garra.",
    apply: () => {
      runMods.slideMirror += 1;
    }
  },
  {
    id: "chain-relay",
    family: "chain",
    icon: "↯",
    title: "Relevo",
    effect: "CHAIN → ORB",
    desc: "Cada CHAIN continúa con un nuevo proyectil.",
    apply: () => {
      runMods.chainRelay += 1;
    }
  },
  {
    id: "shockwave",
    family: "explosion",
    icon: "◎",
    title: "Shock",
    effect: "POWER AOE",
    desc: "Las explosiones Power barren notas cercanas.",
    apply: () => {
      runMods.shockwave += 1;
    }
  },
  {
    id: "fusion",
    family: "collision",
    icon: "✦",
    title: "Fusión",
    effect: "ORB × ORB",
    desc: "Choques entre proyectiles detonan como Power.",
    apply: () => {
      runMods.fusionBlast += 1;
    }
  },
  {
    id: "wall-charge",
    family: "wall",
    icon: "⬡",
    title: "Carga",
    effect: "PARED → POWER",
    desc: "Los impactos de pared detonan como Power.",
    available: () => runMods.wallCharge === 0,
    apply: () => {
      runMods.wallCharge = 1;
    }
  },
  {
    id: "bumper-split",
    family: "arena",
    icon: "⋔",
    title: "Duplicador",
    effect: "BUMPER ×2",
    desc: "El primer rebote en bumper duplica la bola.",
    available: () =>
      runMods.bumperCount > 0 &&
      runMods.bumperSplit === 0,
    apply: () => {
      runMods.bumperSplit = 1;
    }
  },
  {
    id: "combo-shield",
    family: "defense",
    icon: "▱",
    title: "Shield",
    effect: "SALVA 1",
    desc: "El próximo MISS no rompe tu combo.",
    apply: () => {
      runMods.comboShieldCharges += 1;
    }
  }
]

const slideControl = {
  left: {
    held: false,
    pointerId: null,
    x: 0,
    y: 0,
    releasedAt: -Infinity
  },
  right: {
    held: false,
    pointerId: null,
    x: 0,
    y: 0,
    releasedAt: -Infinity
  }
};

const flippers = {
  left: { startTime: -Infinity, hitThisSwing: false },
  right: { startTime: -Infinity, hitThisSwing: false }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

function normalizeAngle(angle) {
  let value = angle;

  while (value <= -Math.PI) value += Math.PI * 2;
  while (value > Math.PI) value -= Math.PI * 2;

  return value;
}

function awardScore(points) {
  score += Math.round(points);
}

function noteRadius(note) {
  return NOTE_RADIUS * (note.radiusScale || 1);
}

function slideTolerance() {
  return SLIDE.railTolerance;
}

function slideGrace() {
  return SLIDE.disconnectGrace;
}

function beatToSeconds(beat) {
  return beat * (60 / BPM);
}

function loopDuration() {
  return beatToSeconds(LOOP_BEATS);
}

async function ensureChartLoaded() {
  if (chartLoaded) return;

  const chartUrl = new URL("../charts/tap-lab.json?v=0.24", import.meta.url);
  const chart = await loadGameChart(chartUrl);

  BPM = chart.bpm;
  LOOP_BEATS = chart.loopBeats;
  COUNT_IN_BEATS = chart.countInBeats;
  CHART = chart.events;
  chartName = chart.name || "Mechanics chart";
  chartLoaded = true;
}

function comboMultiplier(value = combo) {
  return Math.min(4, 1 + Math.floor(Math.max(0, value) / 10));
}

function view() {
  const leftPivot = { x: 145, y: 805 };
  const rightPivot = { x: 395, y: 805 };

  const leftRest = -0.24;
  const leftStrike = -1.12;
  const rightRest = Math.PI + 0.24;
  const rightStrike = Math.PI + 1.12;

  const leftImpactAngle = (leftRest + leftStrike) / 2;
  const rightImpactAngle = (rightRest + rightStrike) / 2;

  return {
    pivot: { left: leftPivot, right: rightPivot },
    restAngle: { left: leftRest, right: rightRest },
    strikeAngle: { left: leftStrike, right: rightStrike },
    impact: {
      left: {
        x: leftPivot.x + Math.cos(leftImpactAngle) * FLIPPER.length,
        y: leftPivot.y + Math.sin(leftImpactAngle) * FLIPPER.length
      },
      right: {
        x: rightPivot.x + Math.cos(rightImpactAngle) * FLIPPER.length,
        y: rightPivot.y + Math.sin(rightImpactAngle) * FLIPPER.length
      }
    }
  };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  const scale = Math.min(rect.width / DESIGN.width, rect.height / DESIGN.height);

  viewport = {
    scale,
    offsetX: (rect.width - DESIGN.width * scale) / 2,
    offsetY: (rect.height - DESIGN.height * scale) / 2,
    dpr,
    cssWidth: rect.width,
    cssHeight: rect.height
  };
}

function setDesignTransform() {
  const { dpr, scale, offsetX, offsetY } = viewport;

  ctx.setTransform(
    dpr * scale,
    0,
    0,
    dpr * scale,
    dpr * offsetX,
    dpr * offsetY
  );
}

function clearCanvas() {
  const { dpr, cssWidth, cssHeight } = viewport;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#080b12";
  ctx.fillRect(0, 0, cssWidth, cssHeight);
  setDesignTransform();
}

function eventToDesign(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left - viewport.offsetX) / viewport.scale,
    y: (event.clientY - rect.top - viewport.offsetY) / viewport.scale
  };
}

function cubicPoint(a, b, c, d, t) {
  const u = 1 - t;

  return {
    x:
      u * u * u * a.x +
      3 * u * u * t * b.x +
      3 * u * t * t * c.x +
      t * t * t * d.x,
    y:
      u * u * u * a.y +
      3 * u * u * t * b.y +
      3 * u * t * t * c.y +
      t * t * t * d.y
  };
}

function makePath(start, c1, c2, end) {
  const points = [];
  let length = 0;
  let previous = null;

  for (let i = 0; i <= PATH_SAMPLES; i += 1) {
    const t = i / PATH_SAMPLES;
    const point = cubicPoint(start, c1, c2, end, t);

    if (previous) {
      length += Math.hypot(point.x - previous.x, point.y - previous.y);
    }

    points.push({ x: point.x, y: point.y, distance: length });
    previous = point;
  }

  const last = points.at(-1);
  const beforeLast = points.at(-2);
  const tangentLength =
    Math.hypot(last.x - beforeLast.x, last.y - beforeLast.y) || 1;

  return {
    points,
    length,
    tangent: {
      x: (last.x - beforeLast.x) / tangentLength,
      y: (last.y - beforeLast.y) / tangentLength
    }
  };
}

function buildPaths() {
  const m = view();
  const mirror = (point) => ({ x: DESIGN.width - point.x, y: point.y });

  const leftDefs = [
    [
      { x: 62, y: 88 },
      { x: 56, y: 285 },
      { x: 84, y: 520 },
      m.impact.left
    ],
    [
      { x: 240, y: 72 },
      { x: 222, y: 255 },
      { x: 172, y: 520 },
      m.impact.left
    ],
    [
      { x: 410, y: 116 },
      { x: 330, y: 292 },
      { x: 236, y: 540 },
      m.impact.left
    ]
  ];

  const left = leftDefs.map((definition) => makePath(...definition));
  const right = leftDefs.map((definition) => {
    const mirrored = definition.map(mirror);
    mirrored[3] = m.impact.right;
    return makePath(...mirrored);
  });

  routes = { left, right };

}

function routeFor(side, routeIndex) {
  return routes[side][routeIndex % routes[side].length];
}

function pointAtDistance(path, distance) {
  if (distance <= 0) return { ...path.points[0] };

  if (distance >= path.length) {
    const end = path.points.at(-1);
    const extra = distance - path.length;

    return {
      x: end.x + path.tangent.x * extra,
      y: end.y + path.tangent.y * extra
    };
  }

  let low = 0;
  let high = path.points.length - 1;

  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2);

    if (path.points[mid].distance < distance) low = mid;
    else high = mid;
  }

  const a = path.points[low];
  const b = path.points[high];
  const span = Math.max(0.0001, b.distance - a.distance);
  const t = (distance - a.distance) / span;

  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t)
  };
}

function eventSongTime(eventTimestamp) {
  const timestamp = Number(eventTimestamp);
  const processingDelayMs = Number.isFinite(timestamp)
    ? clamp(performance.now() - timestamp, 0, 100)
    : 0;

  return clock.songTime - processingDelayMs / 1000 + calibrationOffsetMs / 1000;
}

function spawnReady(songTime) {
  const duration = loopDuration();
  const currentLoop = songTime < 0 ? 0 : Math.floor(songTime / duration);
  if (currentLoop > 0) return;
  const loops = [0];

  for (const loop of loops) {
    CHART.forEach((event, index) => {
      if (
        Number(event.minAct || 1) >
        wave
      ) {
        return;
      }

      const key = `${loop}:${index}`;

      if (active.has(key) || resolved.has(key)) return;

      const targetTime = loop * duration + beatToSeconds(event.beat);
      let lead = 0;
      let expireAt = targetTime + 1;

      if (event.type === "tap") {
        const path = routeFor(event.side, event.route);
        lead = path.length / NOTE_SPEED;
        expireAt = targetTime + TAP_MISS_WINDOW + 0.22;
      } else if (event.type === "slide") {
        lead = SLIDE.leadSeconds;
        expireAt = targetTime + beatToSeconds(event.durationBeats) + 0.35;
      }

      if (songTime > expireAt) return;
      if (targetTime - songTime > lead + 0.04) return;

      if (event.type === "tap") {
        const path = routeFor(event.side, event.route);

        active.set(key, {
          key,
          loop,
          ...event,
          targetTime,
          path,
          pathDistance: 0,
          launched: false,
          x: path.points[0].x,
          y: path.points[0].y,
          prevX: path.points[0].x,
          prevY: path.points[0].y,
          vx: 0,
          vy: 0
        });
      }

      if (event.type === "slide") {
        const path = routeFor(event.side, event.route);

        active.set(key, {
          key,
          loop,
          ...event,
          targetTime,
          endTime: targetTime + beatToSeconds(event.durationBeats),
          path,
          mode:
            event.mode === "trace"
              ? "trace"
              : "follow",
          started: false,
          goodTime: 0,
          trackingTime: 0,
          lastGoodTime: -Infinity,
          startDelta: null,
          lastErrorPx: Infinity,
          playerVector: null,
          traceHeld: false,
          tracePointerId: null
        });
      }

    });
  }

  for (const key of [...resolved]) {
    const loop = Number(key.split(":")[0]);

    if (loop < currentLoop - 1) {
      resolved.delete(key);
    }
  }
}

function flipperPhase(side, songTime) {
  const state = flippers[side];
  const elapsed = songTime - state.startTime;
  const m = view();

  if (elapsed < 0 || elapsed >= FLIPPER.cycle) {
    return {
      active: false,
      attack: false,
      angle: m.restAngle[side]
    };
  }

  const rest = m.restAngle[side];
  const strike = m.strikeAngle[side];

  if (elapsed < FLIPPER.attack) {
    return {
      active: true,
      attack: true,
      angle: lerp(rest, strike, elapsed / FLIPPER.attack)
    };
  }

  if (elapsed < FLIPPER.attack + FLIPPER.hold) {
    return {
      active: true,
      attack: true,
      angle: strike
    };
  }

  const returnElapsed = elapsed - FLIPPER.attack - FLIPPER.hold;

  return {
    active: true,
    attack: false,
    angle: lerp(strike, rest, returnElapsed / FLIPPER.return)
  };
}

function flipperSegment(side, songTime) {
  const m = view();
  const pivot = m.pivot[side];
  const phase = flipperPhase(side, songTime);
  const slide =
    activeSlideAt(songTime, side);

  if (slide?.started) {
    const segment =
      slideSegmentFromVector(
        side,
        slidePlayerVector(slide)
      );

    return {
      pivot,
      tip: segment.tip,
      phase: {
        ...phase,
        slide: true,
        angle: segment.angle
      }
    };
  }

  const angle = phase.angle;

  return {
    pivot,
    tip: {
      x: pivot.x + Math.cos(angle) * FLIPPER.length,
      y: pivot.y + Math.sin(angle) * FLIPPER.length
    },
    phase: {
      ...phase,
      slide: false,
      angle
    }
  };
}
function distancePointToSegment(point, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const lengthSq = abx * abx + aby * aby;

  if (lengthSq <= 0.0001) return Math.hypot(apx, apy);

  const t = clamp((apx * abx + apy * aby) / lengthSq, 0, 1);
  const closestX = a.x + abx * t;
  const closestY = a.y + aby * t;

  return Math.hypot(point.x - closestX, point.y - closestY);
}

function playTone(frequency, duration = 0.045, volume = 0.05, type = "sine") {
  if (!clock.context) return;

  const oscillator = clock.context.createOscillator();
  const gain = clock.context.createGain();
  const now = clock.context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(clock.context.destination);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.01);
}

function hitSound(side, judgement) {
  const base = side === "left" ? 330 : 405;
  playTone(
    base + (judgement === JUDGEMENTS.perfect ? 150 : 0),
    0.055,
    0.075,
    "triangle"
  );
}

function successTone(frequency = 700) {
  playTone(frequency, 0.07, 0.055, "triangle");
}

function explosionSound() {
  playTone(180, 0.05, 0.04, "square");
  playTone(260, 0.04, 0.025, "triangle");
}

function chainSound(value = 1) {
  const scale =
    [523.25, 587.33, 659.25, 783.99, 880];
  const frequency =
    scale[
      Math.min(
        scale.length - 1,
        Math.max(0, value - 1)
      )
    ];

  playTone(
    frequency,
    0.075,
    0.045,
    "triangle"
  );
}

function showMessage(text, color, milliseconds = 420) {
  message = text;
  messageColor = color;
  messageUntil = performance.now() + milliseconds;
}

function triggerFlipper(side, eventTimestamp = null, inputType = "unknown") {
  if (!running) return;

  const inputTime = eventSongTime(eventTimestamp);
  const currentPhase = flipperPhase(side, inputTime);

  lastInputType = inputType;

  if (currentPhase.active) return;

  flippers[side].startTime = inputTime;
  flippers[side].hitThisSwing = false;
}

function createImpactFlash(x, y, judgement) {
  impactFlashes.push({
    x,
    y,
    life: 0,
    duration: 0.16,
    color: judgement.color
  });

  if (impactFlashes.length > 10) impactFlashes.shift();
}

function fanAngles(baseAngle, count, spread = 0.22) {
  if (count <= 1) return [baseAngle];

  const center = (count - 1) / 2;
  return Array.from(
    { length: count },
    (_, index) => baseAngle + (index - center) * spread
  );
}

function configureLaunchedProjectile(
  note,
  angle,
  {
    speed = POST_HIT_SPEED,
    power = false,
    radiusScale = 1,
    fragment = false,
    inheritMods = true
  } = {}
) {
  note.launched = true;
  note.prevX = note.x;
  note.prevY = note.y;
  note.vx = Math.cos(angle) * speed;
  note.vy = Math.sin(angle) * speed;
  note.power = power;
  note.radiusScale = radiusScale;
  note.fragment = fragment;
  note.ricochetsLeft =
    inheritMods ? runMods.ricochetBounces : 0;
  note.piercesLeft =
    inheritMods ? runMods.pierceHits : 0;
}

function spawnLaunchedProjectile({
  x,
  y,
  angle,
  side = "neutral",
  symbol = "•",
  power = false,
  radiusScale = 1,
  fragment = false,
  speed = POST_HIT_SPEED,
  inheritMods = true
}) {
  const key =
    `fx:${performance.now().toFixed(3)}:${Math.random().toString(36).slice(2)}`;

  const projectile = {
    key,
    type: "tap",
    side,
    symbol,
    launched: true,
    x,
    y,
    prevX: x,
    prevY: y,
    vx: 0,
    vy: 0,
    power,
    radiusScale,
    fragment
  };

  configureLaunchedProjectile(
    projectile,
    angle,
    {
      speed,
      power,
      radiusScale,
      fragment,
      inheritMods
    }
  );

  active.set(key, projectile);
  return projectile;
}

function resolveTapHit(note, side, songTime) {
  combo += 1;
  const multiplier = comboMultiplier(combo);

  awardScore(JUDGEMENTS.perfect.points * multiplier);
  hitCount += 1;

  lastDeltaMs = null;
  lastJudgement = "PERFECT";

  const segment = flipperSegment(side, songTime);
  const baseAngle = Math.atan2(
    segment.tip.y - segment.pivot.y,
    segment.tip.x - segment.pivot.x
  );

  const shotCount = 1 + runMods.twinShots;
  const angles = fanAngles(baseAngle, shotCount, 0.20);

  configureLaunchedProjectile(
    note,
    angles[0],
    { inheritMods: true }
  );

  for (let index = 1; index < angles.length; index += 1) {
    spawnLaunchedProjectile({
      x: note.x,
      y: note.y,
      angle: angles[index],
      side,
      symbol: "•",
      inheritMods: true
    });
  }

  resolved.add(note.key);
  flippers[side].hitThisSwing = true;

  createImpactFlash(
    segment.tip.x,
    segment.tip.y,
    JUDGEMENTS.perfect
  );

  showMessage(
    shotCount > 1 ? `PERFECT · ×${shotCount}` : "PERFECT",
    JUDGEMENTS.perfect.color,
    shotCount > 1 ? 480 : 360
  );
  hitSound(side, JUDGEMENTS.perfect);

  if (navigator.vibrate) {
    navigator.vibrate(8);
  }

  updateHud();
  return true;
}

function failEvent(event, label = "MISS") {
  const protectedCombo =
    combo > 0 && runMods.comboShieldCharges > 0;

  if (protectedCombo) {
    runMods.comboShieldCharges -= 1;
  } else {
    combo = 0;
  }

  missCount += 1;
  lastDeltaMs = null;
  lastJudgement = label;

  active.delete(event.key);
  resolved.add(event.key);

  showMessage(
    protectedCombo
      ? `${label} · ESCUDO`
      : label,
    protectedCombo ? "#9edcff" : "#ff7184",
    protectedCombo ? 480 : 360
  );

  if (navigator.vibrate) navigator.vibrate(12);

  updateHud();
}

function resolveFlipperCollisions(songTime) {
  for (const side of ["left", "right"]) {
    const state = flippers[side];
    const segment = flipperSegment(side, songTime);

    if (!segment.phase.active || state.hitThisSwing) continue;

    const candidates = [...active.values()]
      .filter(
        (event) =>
          event.type === "tap" &&
          !event.launched &&
          event.side === side
      )
      .sort(
        (a, b) =>
          Math.abs(a.targetTime - songTime) -
          Math.abs(b.targetTime - songTime)
      );

    for (const note of candidates) {
      const distance = distancePointToSegment(
        note,
        segment.pivot,
        segment.tip
      );

      const collisionDistance =
        noteRadius(note) +
        FLIPPER.width * 0.5;

      if (
        distance <= collisionDistance &&
        resolveTapHit(note, side, songTime)
      ) {
        break;
      }
    }
  }
}

function createExplosion(
  x,
  y,
  scale = 1,
  {
    emitFragments = true,
    side = "neutral"
  } = {}
) {
  explosions.push({
    x,
    y,
    scale,
    life: 0,
    duration: 0.28 + 0.05 * Math.max(0, scale - 1),
    particles: Array.from({ length: 7 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 7;

      return {
        angle,
        speed: (70 + index * 8) * scale
      };
    })
  });

  if (explosions.length > 12) explosions.shift();

  explosionSound();

  if (scale > 1.2) {
    playTone(105, 0.09, 0.045, "sine");
  }

  if (scale > 1.2 && runMods.shockwave > 0) {
    const shockRadius =
      68 + runMods.shockwave * 24;

    for (const target of [...active.values()]) {
      if (
        target.type !== "tap" ||
        target.launched
      ) {
        continue;
      }

      const distance =
        Math.hypot(
          target.x - x,
          target.y - y
        );

      if (distance > shockRadius) continue;

      active.delete(target.key);
      resolved.add(target.key);
      chainCount += 1;
      awardScore(75 * comboMultiplier(combo));

      createImpactFlash(
        target.x,
        target.y,
        JUDGEMENTS.perfect
      );
    }
  }

  if (emitFragments && runMods.fragmentCount > 0) {
    for (let index = 0; index < runMods.fragmentCount; index += 1) {
      const angle =
        (Math.PI * 2 * index) /
        runMods.fragmentCount;

      spawnLaunchedProjectile({
        x,
        y,
        angle,
        side,
        symbol: "·",
        radiusScale: 0.48,
        fragment: true,
        speed: POST_HIT_SPEED * 0.72,
        inheritMods: false
      });
    }
  }
}

function sweptProjectileHit(a, b) {
  const ax0 = Number.isFinite(a.prevX) ? a.prevX : a.x;
  const ay0 = Number.isFinite(a.prevY) ? a.prevY : a.y;
  const bx0 = Number.isFinite(b.prevX) ? b.prevX : b.x;
  const by0 = Number.isFinite(b.prevY) ? b.prevY : b.y;

  const relativeStartX = ax0 - bx0;
  const relativeStartY = ay0 - by0;

  const relativeStepX =
    (a.x - ax0) - (b.x - bx0);
  const relativeStepY =
    (a.y - ay0) - (b.y - by0);

  const relativeSpeedSq =
    relativeStepX * relativeStepX +
    relativeStepY * relativeStepY;

  let t = 0;

  if (relativeSpeedSq > 0.000001) {
    t = clamp(
      -(
        relativeStartX * relativeStepX +
        relativeStartY * relativeStepY
      ) / relativeSpeedSq,
      0,
      1
    );
  }

  const separationX = relativeStartX + relativeStepX * t;
  const separationY = relativeStartY + relativeStepY * t;
  const collisionRadius =
    noteRadius(a) + noteRadius(b) + 3;

  if (
    separationX * separationX +
    separationY * separationY >
    collisionRadius * collisionRadius
  ) {
    return null;
  }

  const ax = lerp(ax0, a.x, t);
  const ay = lerp(ay0, a.y, t);
  const bx = lerp(bx0, b.x, t);
  const by = lerp(by0, b.y, t);

  return {
    x: (ax + bx) / 2,
    y: (ay + by) / 2
  };
}

function resolveProjectileCollisions() {
  const projectiles = [...active.values()].filter(
    (event) => event.type === "tap" && event.launched
  );

  const checked = new Set();

  for (const projectile of projectiles) {
    if (!active.has(projectile.key)) continue;

    for (const other of [...active.values()]) {
      if (
        other.type !== "tap" ||
        other.key === projectile.key ||
        !active.has(other.key)
      ) {
        continue;
      }

      const pairKey =
        projectile.key < other.key
          ? `${projectile.key}|${other.key}`
          : `${other.key}|${projectile.key}`;

      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      const collision = sweptProjectileHit(projectile, other);
      if (!collision) continue;

      const chain = !other.launched;
      const pierces =
        chain &&
        Number(projectile.piercesLeft || 0) > 0;

      active.delete(other.key);

      if (chain) {
        resolved.add(other.key);
        chainCount += 1;
        recordLifetimeMetric("totalChains", 1);

        if (
          runStats &&
          runStats.firstChainMs === null
        ) {
          runStats.firstChainMs =
            performance.now() -
            runStats.startedAt;
        }

        awardScore(
          100 * comboMultiplier(combo)
        );
        showMessage(
          pierces
            ? "CHAIN · PERFORA"
            : `CHAIN ×${chainCount}`,
          "#ffe985",
          360
        );
        chainSound(
          Math.min(5, chainCount)
        );

        if (navigator.vibrate) {
          navigator.vibrate(
            chainCount >= 3
              ? [7, 12, 10]
              : 8
          );
        }
      } else {
        collisionCount += 1;
        awardScore(50 * comboMultiplier(combo));
        showMessage("COLISIÓN +50", "#ffffff", 260);
      }

      if (pierces) {
        projectile.piercesLeft -= 1;
      } else {
        active.delete(projectile.key);
      }

      const projectileCollision =
        projectile.launched &&
        other.launched;
      const fusion =
        projectileCollision &&
        runMods.fusionBlast > 0;
      const powerScale =
        projectile.power ||
        other.power ||
        fusion
          ? 1.65 + (fusion ? 0.18 * runMods.fusionBlast : 0)
          : 1;

      createExplosion(
        collision.x,
        collision.y,
        powerScale,
        {
          emitFragments:
            !projectile.fragment &&
            !other.fragment,
          side: projectile.side
        }
      );

      if (chain && runMods.chainRelay > 0) {
        const relayAngle =
          Math.atan2(
            projectile.vy,
            projectile.vx
          );
        const relayCount =
          Math.min(3, runMods.chainRelay);

        for (const angle of fanAngles(
          relayAngle,
          relayCount,
          0.16
        )) {
          spawnLaunchedProjectile({
            x: collision.x,
            y: collision.y,
            angle,
            side: projectile.side,
            symbol: "↯",
            radiusScale: 0.72,
            speed: POST_HIT_SPEED * 0.86,
            inheritMods: false
          });
        }
      }

      updateHud();

      if (!active.has(projectile.key)) break;
    }
  }
}

function bossCenter() {
  return {
    x: DESIGN.width / 2,
    y: 182
  };
}

function resolveBossCollisions() {
  if (
    !bossState.active ||
    bossState.broken
  ) {
    return;
  }

  const center = bossCenter();
  const radius = 58;

  for (const projectile of [...active.values()]) {
    if (
      projectile.type !== "tap" ||
      !projectile.launched
    ) {
      continue;
    }

    const distance =
      Math.hypot(
        projectile.x - center.x,
        projectile.y - center.y
      );

    if (
      distance >
      radius + noteRadius(projectile)
    ) {
      continue;
    }

    const damage =
      projectile.power ? 3 : 1;

    active.delete(projectile.key);
    bossState.health =
      Math.max(
        0,
        bossState.health - damage
      );
    bossState.damage += damage;
    bossState.hitFlash = 0.18;

    awardScore(
      125 *
      damage *
      comboMultiplier(combo)
    );

    createExplosion(
      projectile.x,
      projectile.y,
      projectile.power ? 1.75 : 1.2,
      {
        emitFragments:
          !projectile.fragment,
        side: projectile.side
      }
    );

    showMessage(
      `CORE -${damage}`,
      "#ffdf85",
      320
    );

    if (navigator.vibrate) {
      navigator.vibrate(
        projectile.power
          ? [10, 18, 14]
          : 7
      );
    }

    if (bossState.health <= 0) {
      bossState.broken = true;
      createExplosion(
        center.x,
        center.y,
        2.7,
        {
          emitFragments: true,
          side: "neutral"
        }
      );
      awardScore(2500);
      showMessage(
        "CORE BREAK +2500",
        "#fff1a9",
        1000
      );
      successTone(1046.5);

      if (navigator.vibrate) {
        navigator.vibrate(
          [14, 28, 18, 28, 24]
        );
      }
    }

    break;
  }
}

function activeBumpers() {
  return BUMPER_LAYOUT.slice(
    0,
    Math.min(runMods.bumperCount, BUMPER_LAYOUT.length)
  );
}

function resolveBumperCollisions() {
  const bumpers = activeBumpers();
  if (bumpers.length === 0) return;

  for (const projectile of [...active.values()]) {
    if (
      projectile.type !== "tap" ||
      !projectile.launched
    ) {
      continue;
    }

    for (const bumper of bumpers) {
      const dx = projectile.x - bumper.x;
      const dy = projectile.y - bumper.y;
      const distance = Math.hypot(dx, dy);
      const limit = bumper.radius + noteRadius(projectile);

      if (
        distance <= 0.001 ||
        distance > limit
      ) {
        continue;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const toward =
        projectile.vx * nx +
        projectile.vy * ny;

      if (toward >= 0) continue;

      projectile.vx -= 2 * toward * nx;
      projectile.vy -= 2 * toward * ny;

      projectile.x =
        bumper.x + nx * (limit + 1);
      projectile.y =
        bumper.y + ny * (limit + 1);
      projectile.prevX = projectile.x;
      projectile.prevY = projectile.y;

      createImpactFlash(
        projectile.x,
        projectile.y,
        JUDGEMENTS.perfect
      );

      if (
        runMods.bumperSplit > 0 &&
        !projectile.bumperSplitUsed
      ) {
        projectile.bumperSplitUsed = true;

        const angle =
          Math.atan2(
            projectile.vy,
            projectile.vx
          );
        const child =
          spawnLaunchedProjectile({
            x: projectile.x,
            y: projectile.y,
            angle: angle + 0.28,
            side: projectile.side,
            symbol: "⋔",
            power: Boolean(projectile.power),
            radiusScale:
              projectile.power
                ? POWER_ORB_BASE_SCALE * 0.78
                : 0.78,
            speed:
              Math.hypot(
                projectile.vx,
                projectile.vy
              ),
            inheritMods: false
          });

        child.bumperSplitUsed = true;
      }

      playTone(245, 0.04, 0.045, "triangle");
      break;
    }
  }
}

function drawBumpers() {
  const bumpers = activeBumpers();

  for (const bumper of bumpers) {
    ctx.save();

    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255,241,169,.38)";
    ctx.fillStyle = "#1b2634";
    ctx.strokeStyle = "#fff1a9";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.arc(
      bumper.x,
      bumper.y,
      bumper.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.42)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      bumper.x - bumper.radius * 0.18,
      bumper.y - bumper.radius * 0.18,
      bumper.radius * 0.52,
      Math.PI * 1.05,
      Math.PI * 1.65
    );
    ctx.stroke();

    ctx.restore();
  }
}

function updateTap(note, dt, songTime) {
  if (note.launched) {
    note.prevX = note.x;
    note.prevY = note.y;

    note.x += note.vx * dt;
    note.y += note.vy * dt;

    const radius = noteRadius(note);

    const hitX =
      note.x <= radius ||
      note.x >= DESIGN.width - radius;
    const hitY =
      note.y <= 72 ||
      note.y >= DESIGN.height - radius;
    const hitWall = hitX || hitY;

    if (hitWall) {
      if (Number(note.ricochetsLeft || 0) > 0) {
        if (hitX) note.vx *= -1;
        if (hitY) note.vy *= -1;

        note.ricochetsLeft -= 1;
        note.x = clamp(
          note.x,
          radius + 1,
          DESIGN.width - radius - 1
        );
        note.y = clamp(
          note.y,
          73,
          DESIGN.height - radius - 1
        );
        note.prevX = note.x;
        note.prevY = note.y;

        createImpactFlash(
          note.x,
          note.y,
          JUDGEMENTS.perfect
        );
        playTone(190, 0.035, 0.035, "triangle");
        return;
      }

      active.delete(note.key);
      wallExplosionCount += 1;

      createExplosion(
        clamp(note.x, radius, DESIGN.width - radius),
        clamp(note.y, 72, DESIGN.height - radius),
        note.power || runMods.wallCharge > 0
          ? 1.65
          : 1,
        {
          emitFragments: !note.fragment,
          side: note.side
        }
      );
    }

    return;
  }

  note.prevX = note.x;
  note.prevY = note.y;

  note.pathDistance =
    note.path.length - NOTE_SPEED * (note.targetTime - songTime);

  const point = pointAtDistance(note.path, note.pathDistance);
  note.x = point.x;
  note.y = point.y;

  if (songTime - note.targetTime > TAP_MISS_WINDOW) {
    failEvent(note, "MISS");
  }
}

function defaultSlideVector(side) {
  return side === "left"
    ? { x: 0.78, y: -0.62 }
    : { x: -0.78, y: -0.62 };
}

function clampSlideVector(vector) {
  const length =
    Math.hypot(vector.x, vector.y);

  if (length <= 1) {
    return {
      x: vector.x,
      y: vector.y
    };
  }

  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

function slideVectorAtBeat(event, beatOffset) {
  const anchors = event.anchors;

  if (beatOffset <= anchors[0].beat) {
    return clampSlideVector(anchors[0]);
  }

  for (let i = 1; i < anchors.length; i += 1) {
    const a = anchors[i - 1];
    const b = anchors[i];

    if (beatOffset <= b.beat) {
      const span =
        Math.max(0.0001, b.beat - a.beat);
      const t =
        (beatOffset - a.beat) / span;

      return clampSlideVector({
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t)
      });
    }
  }

  return clampSlideVector(anchors.at(-1));
}

function slideVectorAtTime(event, songTime) {
  return slideVectorAtBeat(
    event,
    clamp(
      (songTime - event.targetTime) / beatToSeconds(1),
      0,
      event.durationBeats
    )
  );
}

function slideAngleFromVector(side, vector) {
  const length =
    Math.hypot(vector.x, vector.y);

  const safe =
    length < 0.08
      ? defaultSlideVector(side)
      : vector;

  return Math.atan2(
    safe.y,
    safe.x
  );
}

function slideLengthFromVector(vector) {
  const magnitude = clamp(
    Math.hypot(vector.x, vector.y),
    0,
    1
  );

  return (
    FLIPPER.length *
    lerp(
      SLIDE.reachMin,
      SLIDE.reachMax,
      magnitude
    )
  );
}

function slideSegmentFromVector(side, vector) {
  const m = view();
  const pivot = m.pivot[side];
  const angle =
    slideAngleFromVector(side, vector);
  const length =
    slideLengthFromVector(vector);

  return {
    pivot,
    angle,
    length,
    tip: {
      x: pivot.x + Math.cos(angle) * length,
      y: pivot.y + Math.sin(angle) * length
    }
  };
}
function slideMode(event) {
  return event?.mode === "trace"
    ? "trace"
    : "follow";
}

function slidePlayerVector(event) {
  return clampSlideVector(
    event?.playerVector ??
    slideVectorAtBeat(event, 0)
  );
}

function pointToSlideVector(side, point) {
  const pivot =
    view().pivot[side];
  const dx =
    point.x - pivot.x;
  const dy =
    point.y - pivot.y;
  const radius =
    Math.hypot(dx, dy);
  const angle =
    Math.atan2(dy, dx);
  const reach =
    clamp(
      radius / FLIPPER.length,
      SLIDE.reachMin,
      SLIDE.reachMax
    );
  const magnitude =
    clamp(
      (
        reach -
        SLIDE.reachMin
      ) /
      Math.max(
        0.001,
        SLIDE.reachMax -
        SLIDE.reachMin
      ),
      0,
      1
    );

  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude
  };
}

function slideInputHeld(event) {
  if (slideMode(event) === "trace") {
    return Boolean(event.traceHeld);
  }

  return Boolean(
    slideControl[event.side].held
  );
}

function activeSlideAt(songTime, side = null) {
  return [...active.values()]
    .filter((event) => event.type === "slide")
    .filter((event) => !side || event.side === side)
    .filter(
      (event) =>
        songTime >= event.targetTime - SLIDE.leadSeconds &&
        songTime <= event.endTime + 0.35
    )
    .sort(
      (a, b) =>
        Math.abs(a.targetTime - songTime) -
        Math.abs(b.targetTime - songTime)
    )[0] ?? null;
}

function slidePressReserved(event, side, songTime) {
  if (
    !event ||
    event.side !== side ||
    slideMode(event) !== "follow"
  ) {
    return false;
  }

  if (event.started) {
    return songTime <= event.endTime;
  }

  const delta = songTime - event.targetTime;

  return (
    delta >= -SLIDE.startEarly &&
    delta <= SLIDE.startLate
  );
}

function updateSlidePadPosition(side, event) {
  if (!event) return;

  const point = eventToDesign(event);
  const center = controlButtonCenter(side);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const length = Math.hypot(dx, dy);
  const control = slideControl[side];

  if (length < 2) {
    control.x = 0;
    control.y = 0;
    return;
  }

  const clamped =
    Math.min(length, SLIDE.inputRadius);

  control.x =
    (dx / length) *
    (clamped / SLIDE.inputRadius);

  control.y =
    (dy / length) *
    (clamped / SLIDE.inputRadius);
}
function beginSlide(event, side, songTime) {
  if (event.started) return;

  event.started = true;
  event.startDelta =
    songTime - event.targetTime;
  event.lastGoodTime = songTime;

  const mode =
    slideMode(event);

  if (runStats) {
    if (mode === "trace") {
      runStats.traceAttempts += 1;
    } else {
      runStats.followAttempts += 1;
    }
  }

  recordLifetimeMetric(
    mode === "trace"
      ? "traceAttempts"
      : "followAttempts",
    1
  );

  if (!event.playerVector) {
    event.playerVector =
      slideVectorAtBeat(event, 0);
  }

  const receiver =
    slideTipPoint(
      side,
      slideVectorAtBeat(event, 0)
    );

  createImpactFlash(
    receiver.x,
    receiver.y,
    JUDGEMENTS.perfect
  );

  showMessage(
    slideMode(event) === "trace"
      ? "TRACE · SIGUE LA CUERDA"
      : "FOLLOW · MUEVE EL STICK",
    "#fff1a9",
    620
  );

  successTone(620);

  if (navigator.vibrate) {
    navigator.vibrate(6);
  }
}

function slideTipPoint(side, vector) {
  return slideSegmentFromVector(
    side,
    vector
  ).tip;
}

function slideTipErrorPx(event, songTime) {
  const target =
    slideTipPoint(
      event.side,
      slideVectorAtTime(event, songTime)
    );

  const actual =
    slideSegmentFromVector(
      event.side,
      slidePlayerVector(event)
    ).tip;

  return Math.hypot(
    actual.x - target.x,
    actual.y - target.y
  );
}

function slideConnected(event, songTime) {
  if (!event.started) return false;

  const error =
    slideTipErrorPx(event, songTime);
  event.lastErrorPx = error;

  if (
    slideInputHeld(event) &&
    error <= slideTolerance()
  ) {
    event.lastGoodTime = songTime;
    return true;
  }

  return (
    songTime - event.lastGoodTime <=
    slideGrace()
  );
}

function updateSlide(event, dt, songTime) {
  if (!event.started) {
    if (
      songTime >
      event.targetTime + SLIDE.startLate
    ) {
      failEvent(event, "SLIDE MISS");
    }

    return;
  }

  if (
    slideMode(event) === "follow" &&
    slideControl[event.side].held
  ) {
    const control =
      slideControl[event.side];
    const player =
      slidePlayerVector(event);

    event.playerVector =
      clampSlideVector({
        x:
          player.x +
          control.x *
          SLIDE.followSpeed *
          dt,
        y:
          player.y +
          control.y *
          SLIDE.followSpeed *
          dt
      });
  }

  if (
    songTime >= event.targetTime &&
    songTime <= event.endTime
  ) {
    event.trackingTime += dt;

    if (slideConnected(event, songTime)) {
      event.goodTime += dt;
    }
  }

  if (songTime >= event.endTime) {
    finishSlide(event);
  }
}

function spawnSlideProjectile(event) {
  const finalVector =
    slideVectorAtBeat(
      event,
      event.durationBeats
    );
  const segment =
    slideSegmentFromVector(
      event.side,
      finalVector
    );
  const point = segment.tip;
  const shotCount =
    1 + runMods.slideNova * 2;
  const angles =
    fanAngles(segment.angle, shotCount, 0.18);

  for (const angle of angles) {
    spawnLaunchedProjectile({
      x: point.x,
      y: point.y,
      angle,
      side: event.side,
      symbol: "★",
      power: true,
      radiusScale: POWER_ORB_BASE_SCALE,
      inheritMods: true
    });
  }

  if (runMods.slideMirror > 0) {
    const mirrorSide =
      event.side === "left"
        ? "right"
        : "left";
    const mirrorVector = {
      x: -finalVector.x,
      y: finalVector.y
    };
    const mirrorSegment =
      slideSegmentFromVector(
        mirrorSide,
        mirrorVector
      );
    const mirrorCount =
      Math.min(3, runMods.slideMirror);

    for (const angle of fanAngles(
      mirrorSegment.angle,
      mirrorCount,
      0.15
    )) {
      spawnLaunchedProjectile({
        x: mirrorSegment.tip.x,
        y: mirrorSegment.tip.y,
        angle,
        side: mirrorSide,
        symbol: "◇",
        power: true,
        radiusScale: POWER_ORB_BASE_SCALE * 0.88,
        inheritMods: true
      });
    }
  }
}

function finishSlide(event) {
  if (!active.has(event.key)) return;

  const duration =
    Math.max(
      0.001,
      event.endTime - event.targetTime
    );

  const coverage =
    event.goodTime / duration;

  const connectedAtEnd =
    event.endTime - event.lastGoodTime <=
    slideGrace();

  if (
    coverage < SLIDE.minCoverage ||
    !connectedAtEnd
  ) {
    failEvent(event, "SLIDE MISS");
    return;
  }

  const mode =
    slideMode(event);

  if (runStats) {
    if (mode === "trace") {
      runStats.traceSuccess += 1;
    } else {
      runStats.followSuccess += 1;
    }
  }

  recordLifetimeMetric(
    mode === "trace"
      ? "traceSuccess"
      : "followSuccess",
    1
  );

  combo += 1;
  awardScore(
    450 * comboMultiplier(combo)
  );

  lastDeltaMs = null;
  lastJudgement = "SLIDE PERFECT";

  active.delete(event.key);
  resolved.add(event.key);

  const finalPoint =
    slideTipPoint(
      event.side,
      slideVectorAtBeat(
        event,
        event.durationBeats
      )
    );

  createImpactFlash(
    finalPoint.x,
    finalPoint.y,
    JUDGEMENTS.perfect
  );

  spawnSlideProjectile(event);

  showMessage(
    "SLIDE PERFECT · POWER ORB",
    JUDGEMENTS.perfect.color,
    620
  );

  successTone(820);

  if (navigator.vibrate) {
    navigator.vibrate([6, 20, 7]);
  }

  const control = slideControl[event.side];
  control.x = 0;
  control.y = 0;
  event.traceHeld = false;
  event.tracePointerId = null;

  updateHud();
}

function slideNodePoint(
  event,
  beatOffset,
  songTime
) {
  const m = view();
  const pivot = m.pivot[event.side];
  const vector =
    slideVectorAtBeat(
      event,
      beatOffset
    );
  const angle =
    slideAngleFromVector(
      event.side,
      vector
    );
  const baseLength =
    slideLengthFromVector(vector);

  const nodeTime =
    event.targetTime + beatToSeconds(beatOffset);

  const radius =
    baseLength +
    SLIDE.scrollSpeed * (nodeTime - songTime);

  return {
    x: pivot.x + Math.cos(angle) * radius,
    y: pivot.y + Math.sin(angle) * radius,
    radius,
    vector,
    angle
  };
}
function drawSlideOrb(
  x,
  y,
  side,
  radius,
  alpha = 1,
  activeState = false
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = activeState ? 20 : 8;
  ctx.shadowColor =
    activeState
      ? "#fff1a9"
      : side === "left"
        ? "#6ed7ff"
        : "#d88bff";

  ctx.fillStyle =
    activeState
      ? "#fff1a9"
      : side === "left"
        ? "#6ed7ff"
        : "#d88bff";

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle =
    activeState ? "#171411" : "#08101d";
  ctx.font =
    `900 ${Math.max(11, radius - 1)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("◎", x, y + 1);
  ctx.restore();
}

function slideVisualConnected(event, songTime) {
  return (
    event.started &&
    slideInputHeld(event) &&
    slideTipErrorPx(event, songTime) <=
      slideTolerance()
  );
}

function slideRailPoint(event, beat) {
  const safeBeat =
    clamp(
      beat,
      0,
      event.durationBeats
    );
  const vector =
    slideVectorAtBeat(
      event,
      safeBeat
    );
  const segment =
    slideSegmentFromVector(
      event.side,
      vector
    );

  return {
    beat: safeBeat,
    x: segment.tip.x,
    y: segment.tip.y,
    angle: segment.angle,
    vector
  };
}

function buildSlideRail(
  event,
  startBeat = 0,
  endBeat = event.durationBeats,
  step = 0.055
) {
  const start =
    clamp(startBeat, 0, event.durationBeats);
  const end =
    clamp(endBeat, start, event.durationBeats);
  const points = [];

  for (
    let beat = start;
    beat < end - 0.0001;
    beat += step
  ) {
    points.push(
      slideRailPoint(event, beat)
    );
  }

  points.push(
    slideRailPoint(event, end)
  );

  return points;
}

function traceSlideRail(points) {
  if (points.length === 0) return;

  ctx.beginPath();

  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
}

function slideRailTangent(event, beat) {
  const before =
    slideRailPoint(
      event,
      beat - 0.04
    );
  const after =
    slideRailPoint(
      event,
      beat + 0.04
    );

  return Math.atan2(
    after.y - before.y,
    after.x - before.x
  );
}

function drawSlideRailBody(
  points,
  side,
  alpha = 1,
  connected = false
) {
  if (points.length < 2) return;

  const sideColor =
    side === "left"
      ? "110,215,255"
      : "216,139,255";

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Exact playable corridor.
  ctx.strokeStyle =
    connected
      ? "rgba(255,241,169,.20)"
      : `rgba(${sideColor},.14)`;
  ctx.lineWidth =
    slideTolerance() * 2;
  traceSlideRail(points);
  ctx.stroke();

  // Dark channel gives the slide the weight of a sustained note.
  ctx.strokeStyle =
    "rgba(7,10,18,.82)";
  ctx.lineWidth = 25;
  traceSlideRail(points);
  ctx.stroke();

  // Guitar-like luminous rope: continuous and clearly distinct from Tap paths.
  ctx.shadowBlur =
    connected ? 20 : 14;
  ctx.shadowColor =
    connected
      ? "#fff1a9"
      : "#a970ff";
  ctx.strokeStyle =
    connected
      ? "rgba(255,225,145,.92)"
      : "rgba(171,104,255,.88)";
  ctx.lineWidth = 13;
  traceSlideRail(points);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle =
    connected
      ? "rgba(255,255,224,.92)"
      : "rgba(238,218,255,.88)";
  ctx.lineWidth = 3;
  traceSlideRail(points);
  ctx.stroke();

  ctx.restore();
}

function drawSlideGem(
  event,
  beat,
  {
    radius = 8,
    alpha = 1,
    active = false,
    anchor = false
  } = {}
) {
  const point =
    slideRailPoint(event, beat);
  const sideColor =
    event.side === "left"
      ? "#6ed7ff"
      : "#d88bff";

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(point.x, point.y);

  ctx.shadowBlur =
    active ? 24 : anchor ? 14 : 8;
  ctx.shadowColor =
    active ? "#fff1a9" : "#a970ff";

  ctx.fillStyle =
    active
      ? "#fff1a9"
      : "rgba(31,18,50,.90)";
  ctx.strokeStyle =
    active
      ? "#ffffff"
      : sideColor;
  ctx.lineWidth =
    active ? 4 : anchor ? 3.5 : 2.5;

  ctx.beginPath();
  ctx.arc(
    0,
    0,
    radius,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle =
    active
      ? "#5e4618"
      : "rgba(236,213,255,.78)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    Math.max(2, radius * 0.42),
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.restore();
}

function drawSlideBeatGems(
  event,
  startBeat,
  endBeat,
  alpha = 1
) {
  const first =
    Math.ceil(startBeat / SLIDE.nodeBeats) *
    SLIDE.nodeBeats;

  for (
    let beat = first;
    beat <= endBeat + 0.001;
    beat += SLIDE.nodeBeats
  ) {
    const anchor =
      event.anchors.some(
        (item) =>
          Math.abs(item.beat - beat) < 0.02
      );

    drawSlideGem(
      event,
      beat,
      {
        radius: anchor ? 10 : 5.5,
        alpha:
          anchor
            ? alpha
            : alpha * 0.72,
        anchor
      }
    );
  }

  for (const anchor of event.anchors) {
    if (
      anchor.beat < startBeat - 0.001 ||
      anchor.beat > endBeat + 0.001
    ) {
      continue;
    }

    drawSlideGem(
      event,
      anchor.beat,
      {
        radius: 11.5,
        alpha,
        anchor: true
      }
    );
  }
}

function drawSlideDirectionMarkers(
  event,
  startBeat,
  endBeat,
  alpha = 1
) {
  const step = 1;
  const first =
    Math.ceil((startBeat + 0.22) / step) *
    step;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle =
    "rgba(255,255,255,.66)";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  for (
    let beat = first;
    beat < endBeat - 0.12;
    beat += step
  ) {
    const point =
      slideRailPoint(event, beat);
    const tangent =
      slideRailTangent(event, beat);

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(tangent);

    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(2, 0);
    ctx.lineTo(-5, 5);
    ctx.stroke();

    ctx.restore();
  }

  ctx.restore();
}

function drawSlideCatcher(
  event,
  beat,
  connected,
  alpha = 1
) {
  const point =
    slideRailPoint(event, beat);
  const tangent =
    slideRailTangent(event, beat);
  const pulse =
    1 +
    Math.sin(performance.now() / 110) *
    0.08;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(point.x, point.y);
  ctx.rotate(tangent);

  // The outer ring is the real physical hit corridor.
  ctx.strokeStyle =
    connected
      ? "rgba(255,241,169,.62)"
      : "rgba(255,126,148,.55)";
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    slideTolerance(),
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.setLineDash([]);

  // A note-catcher crossing the rope makes the current target unmistakable.
  ctx.shadowBlur = connected ? 24 : 16;
  ctx.shadowColor =
    connected ? "#fff1a9" : "#ff7e94";
  ctx.strokeStyle =
    connected ? "#fff1a9" : "#ff8ca0";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(0, -19);
  ctx.lineTo(0, 19);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(
    0,
    0,
    12 * pulse,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.restore();

  drawSlideGem(
    event,
    beat,
    {
      radius: 10,
      alpha,
      active: connected
    }
  );
}

function drawIncomingSlideHead(
  event,
  head
) {
  const sideColor =
    event.side === "left"
      ? "#6ed7ff"
      : "#d88bff";

  ctx.save();
  ctx.translate(head.x, head.y);
  ctx.shadowBlur = 22;
  ctx.shadowColor = "#a970ff";
  ctx.fillStyle = "rgba(18,13,29,.86)";
  ctx.strokeStyle = sideColor;
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(
    0,
    0,
    24,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#b27cff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    15,
    Math.PI * 0.08,
    Math.PI * 1.92
  );
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f2ddff";
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

function drawSlideModeBadge(event) {
  const trace =
    slideMode(event) === "trace";
  const label =
    trace
      ? "TRACE · DEDO"
      : "FOLLOW · STICK";

  ctx.save();

  ctx.font =
    "900 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const width =
    ctx.measureText(label).width + 28;
  const x = DESIGN.width / 2;
  const y = 680;

  ctx.fillStyle =
    "rgba(7,11,19,.78)";
  ctx.strokeStyle =
    trace
      ? "rgba(110,215,255,.78)"
      : "rgba(216,139,255,.78)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(
    x - width / 2,
    y - 15,
    width,
    30,
    15
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle =
    trace
      ? "#a9e9ff"
      : "#e1baff";
  ctx.fillText(
    label,
    x,
    y + 1
  );

  ctx.restore();
}

function drawSlide(event, songTime) {
  ctx.save();

  if (!event.started) {
    const distance =
      event.path.length -
      NOTE_SPEED * (event.targetTime - songTime);
    const head =
      pointAtDistance(event.path, distance);
    const behind =
      pointAtDistance(
        event.path,
        Math.max(0, distance - 86)
      );
    const rail =
      buildSlideRail(
        event,
        0,
        event.durationBeats
      );
    const startPoint = rail[0];

    // Lead-in tail for the first slider gem.
    ctx.lineCap = "round";
    ctx.strokeStyle =
      "rgba(169,112,255,.34)";
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(behind.x, behind.y);
    ctx.stroke();

    drawSlideRailBody(
      rail,
      event.side,
      0.66,
      false
    );
    drawSlideBeatGems(
      event,
      0,
      event.durationBeats,
      0.82
    );
    drawSlideDirectionMarkers(
      event,
      0,
      event.durationBeats,
      0.45
    );

    // When the head gets close, visually join it to the rope.
    const startDistance =
      Math.hypot(
        head.x - startPoint.x,
        head.y - startPoint.y
      );

    if (startDistance < 220) {
      ctx.strokeStyle =
        "rgba(181,124,255,.52)";
      ctx.lineWidth = 6;
      ctx.setLineDash([7, 8]);
      ctx.beginPath();
      ctx.moveTo(head.x, head.y);
      ctx.lineTo(
        startPoint.x,
        startPoint.y
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawIncomingSlideHead(
      event,
      head
    );
    drawSlideCatcher(
      event,
      0,
      false,
      0.72
    );
    drawSlideModeBadge(event);

    ctx.restore();
    return;
  }

  const beatLength =
    beatToSeconds(1);
  const currentBeat =
    clamp(
      (songTime - event.targetTime) /
        beatLength,
      0,
      event.durationBeats
    );
  const connected =
    slideVisualConnected(
      event,
      songTime
    );

  // Full phrase remains faintly visible, like a sustain highway.
  const fullRail =
    buildSlideRail(
      event,
      0,
      event.durationBeats
    );
  drawSlideRailBody(
    fullRail,
    event.side,
    0.18,
    false
  );

  // Remaining rope is the primary read.
  const remainingRail =
    buildSlideRail(
      event,
      currentBeat,
      event.durationBeats
    );
  drawSlideRailBody(
    remainingRail,
    event.side,
    1,
    connected
  );

  // Short golden wake communicates successful continuous contact.
  if (currentBeat > 0.02) {
    const wake =
      buildSlideRail(
        event,
        Math.max(0, currentBeat - 1.25),
        currentBeat
      );

    ctx.save();
    ctx.strokeStyle =
      connected
        ? "rgba(255,241,169,.74)"
        : "rgba(255,126,148,.28)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    traceSlideRail(wake);
    ctx.stroke();
    ctx.restore();
  }

  drawSlideBeatGems(
    event,
    currentBeat,
    event.durationBeats,
    connected ? 0.92 : 0.74
  );
  drawSlideDirectionMarkers(
    event,
    currentBeat,
    event.durationBeats,
    0.58
  );

  drawSlideCatcher(
    event,
    currentBeat,
    connected,
    1
  );
  drawSlideModeBadge(event);

  ctx.restore();
}

function updateEvents(dt, songTime) {
  for (const event of [...active.values()]) {
    if (event.type === "tap") {
      updateTap(event, dt, songTime);
      continue;
    }

    if (event.type === "slide") {
      updateSlide(event, dt, songTime);
    }
  }
}

function updateEffects(dt) {
  for (const explosion of explosions) {
    explosion.life += dt;
  }

  for (const flash of impactFlashes) {
    flash.life += dt;
  }

  bossState.hitFlash =
    Math.max(
      0,
      bossState.hitFlash - dt
    );

  explosions = explosions.filter(
    (explosion) => explosion.life < explosion.duration
  );

  impactFlashes = impactFlashes.filter(
    (flash) => flash.life < flash.duration
  );
}

function updateHud() {
  maxCombo =
    Math.max(maxCombo, combo);

  scoreEl.textContent = String(score);
  comboEl.textContent =
    combo ? `${combo} · x${comboMultiplier(combo)}` : "0";
  actEl.textContent =
    `${Math.min(wave, RUN_ACTS)}/${RUN_ACTS}`;

  lastHitEl.textContent =
    lastDeltaMs === null
      ? lastJudgement
      : `${lastJudgement} ${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`;
}

function drawBackground() {
  const palette =
    machinePalette();
  const [ar, ag, ab] =
    palette.accent;
  const [sr, sg, sb] =
    palette.secondary;
  const beatPhase =
    ((clock.beat % 1) + 1) % 1;
  const pulse =
    1 - Math.min(
      beatPhase,
      1 - beatPhase
    ) * 2;

  ctx.fillStyle = "#070b13";
  ctx.fillRect(
    0,
    0,
    DESIGN.width,
    DESIGN.height
  );

  const glow =
    ctx.createRadialGradient(
      DESIGN.width / 2,
      390,
      20,
      DESIGN.width / 2,
      390,
      390
    );
  glow.addColorStop(
    0,
    `rgba(${ar},${ag},${ab},${0.055 + pulse * 0.025})`
  );
  glow.addColorStop(
    0.52,
    `rgba(${sr},${sg},${sb},.025)`
  );
  glow.addColorStop(
    1,
    "rgba(4,7,13,0)"
  );
  ctx.fillStyle = glow;
  ctx.fillRect(
    0,
    70,
    DESIGN.width,
    720
  );

  // Chassis rails.
  ctx.strokeStyle =
    `rgba(${ar},${ag},${ab},.13)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 105);
  ctx.lineTo(28, 820);
  ctx.lineTo(105, 905);
  ctx.moveTo(512, 105);
  ctx.lineTo(512, 820);
  ctx.lineTo(435, 905);
  ctx.stroke();

  ctx.strokeStyle =
    "rgba(255,255,255,.035)";
  ctx.lineWidth = 1;

  for (let y = 130; y < 800; y += 72) {
    ctx.beginPath();
    ctx.moveTo(35, y);
    ctx.lineTo(505, y);
    ctx.stroke();
  }

  // Mechanical fasteners.
  for (const x of [42, 498]) {
    for (let y = 150; y < 770; y += 122) {
      ctx.fillStyle =
        `rgba(${sr},${sg},${sb},.18)`;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Dust/energy motes.
  for (let i = 0; i < 24; i += 1) {
    const x =
      (((i * 73) % 521) / 521) *
      DESIGN.width;
    const y =
      (((i * 113) % 601) / 601) *
      DESIGN.height *
      0.62;

    ctx.fillStyle =
      i % 4 === 0
        ? `rgba(${ar},${ag},${ab},.18)`
        : "rgba(255,255,255,.10)";
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  // Act energy meter embedded in the machine.
  const progress =
    clamp(
      (wave - 1) /
        Math.max(1, RUN_ACTS - 1),
      0,
      1
    );

  ctx.fillStyle =
    "rgba(255,255,255,.055)";
  ctx.fillRect(214, 84, 112, 4);
  ctx.fillStyle =
    `rgba(${ar},${ag},${ab},.72)`;
  ctx.fillRect(
    214,
    84,
    112 * progress,
    4
  );
}

function drawBossCore(songTime) {
  if (!bossState.active) return;

  const palette =
    machinePalette();
  const center =
    bossCenter();
  const healthRatio =
    bossState.health /
    bossState.maxHealth;
  const beatPulse =
    0.5 +
    0.5 *
      Math.sin(
        songTime *
        BPM /
        60 *
        Math.PI *
        2
      );
  const flash =
    bossState.hitFlash > 0
      ? 1
      : 0;

  ctx.save();
  ctx.translate(
    center.x,
    center.y
  );

  ctx.shadowBlur =
    bossState.broken
      ? 8
      : 26 + beatPulse * 14;
  ctx.shadowColor =
    bossState.broken
      ? "#ff637d"
      : `rgb(${palette.accent.join(",")})`;

  ctx.fillStyle =
    bossState.broken
      ? "rgba(45,17,24,.92)"
      : flash
        ? "#fff4d0"
        : "#111b27";
  ctx.strokeStyle =
    bossState.broken
      ? "#ff637d"
      : `rgb(${palette.accent.join(",")})`;
  ctx.lineWidth = 5;

  ctx.beginPath();
  ctx.arc(
    0,
    0,
    58,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;

  for (let i = 0; i < 6; i += 1) {
    const angle =
      (Math.PI * 2 * i) / 6 +
      songTime * 0.22;
    ctx.strokeStyle =
      "rgba(255,255,255,.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(
      Math.cos(angle) * 35,
      Math.sin(angle) * 35
    );
    ctx.lineTo(
      Math.cos(angle) * 49,
      Math.sin(angle) * 49
    );
    ctx.stroke();
  }

  ctx.fillStyle =
    bossState.broken
      ? "#ff637d"
      : `rgb(${palette.secondary.join(",")})`;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    bossState.broken
      ? 9
      : 18 + beatPulse * 3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();

  ctx.fillStyle =
    "rgba(5,8,14,.82)";
  ctx.fillRect(
    190,
    252,
    160,
    14
  );
  ctx.fillStyle =
    bossState.broken
      ? "#ff637d"
      : `rgb(${palette.accent.join(",")})`;
  ctx.fillRect(
    193,
    255,
    154 * healthRatio,
    8
  );

  ctx.fillStyle =
    "rgba(255,255,255,.62)";
  ctx.font =
    "900 10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    bossState.broken
      ? "CORE BREAK"
      : "AURA CORE",
    DESIGN.width / 2,
    278
  );
}


function drawTrail(note) {
  if (note.launched) {
    const speed = Math.hypot(note.vx, note.vy) || 1;
    const ux = note.vx / speed;
    const uy = note.vy / speed;

    ctx.strokeStyle =
      note.side === "left"
        ? "rgba(110,215,255,.20)"
        : "rgba(216,139,255,.20)";

    ctx.lineWidth = note.power ? 12 : 6;
    ctx.shadowBlur = note.power ? 18 : 0;
    ctx.shadowColor = note.power ? "#fff1a9" : "transparent";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(note.x, note.y);
    ctx.lineTo(
      note.x - ux * (note.power ? 48 : 30),
      note.y - uy * (note.power ? 48 : 30)
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    return;
  }

  const trailDistances = [16, 32];

  for (let i = 0; i < trailDistances.length; i += 1) {
    const point = pointAtDistance(
      note.path,
      Math.max(0, note.pathDistance - trailDistances[i])
    );

    const alpha = 0.12 - i * 0.045;

    ctx.fillStyle =
      note.side === "left"
        ? `rgba(110,215,255,${alpha})`
        : `rgba(216,139,255,${alpha})`;

    ctx.beginPath();
    ctx.arc(
      point.x,
      point.y,
      Math.max(4, NOTE_RADIUS - 9 - i * 2),
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function drawChainOpportunities() {
  const groups = new Map();

  for (const note of active.values()) {
    if (
      note.type !== "tap" ||
      note.launched ||
      !note.chainGroup
    ) {
      continue;
    }

    if (!groups.has(note.chainGroup)) {
      groups.set(
        note.chainGroup,
        []
      );
    }

    groups.get(note.chainGroup).push(note);
  }

  for (const notes of groups.values()) {
    if (notes.length < 2) continue;

    notes.sort(
      (a, b) =>
        a.targetTime - b.targetTime
    );

    ctx.save();
    ctx.strokeStyle =
      "rgba(255,229,109,.24)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 8]);
    ctx.beginPath();

    notes.forEach((note, index) => {
      if (index === 0) {
        ctx.moveTo(note.x, note.y);
      } else {
        ctx.lineTo(note.x, note.y);
      }
    });

    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function drawTap(note) {
  drawTrail(note);

  const radius = noteRadius(note);

  ctx.save();
  ctx.translate(note.x, note.y);

  if (note.launched) {
    ctx.rotate(Math.atan2(note.vy, note.vx) + Math.PI / 2);
  }

  if (note.power) {
    ctx.shadowBlur = 28;
    ctx.shadowColor = "#fff1a9";
    ctx.fillStyle = "#fff1a9";
  } else if (note.fragment) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = "#ffffff";
  } else {
    ctx.fillStyle =
      note.side === "left"
        ? "#6ed7ff"
        : note.side === "right"
          ? "#d88bff"
          : "#dfeaff";
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  if (
    note.chainGroup &&
    !note.launched
  ) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle =
      "rgba(255,229,109,.78)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      radius + 7,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (note.power) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.88)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#08101d";
  ctx.font =
    `900 ${Math.round(note.power ? 31 : 25)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    note.power ? "✦" : (note.symbol || "♪"),
    0,
    1
  );

  ctx.restore();
}
function controlButtonCenter(side) {
  return side === "left"
    ? { x: 60, y: 892 }
    : { x: 480, y: 892 };
}

function drawControlButton(side, songTime) {
  const center = controlButtonCenter(side);
  const m = view();
  const pivot = m.pivot[side];
  const phase = flipperPhase(side, songTime);
  const slide = activeSlideAt(songTime, side);
  const control = slideControl[side];
  const left = side === "left";
  const slideActive =
    Boolean(
      slide?.started &&
      slideMode(slide) === "follow"
    );
  const connected =
    slideActive &&
    slideVisualConnected(slide, songTime);

  const displacement =
    slideActive || control.held
      ? {
          x: control.x * 30,
          y: control.y * 30
        }
      : { x: 0, y: 0 };

  const pressDepth =
    !slideActive && phase.active ? 5 : 0;

  const cap = {
    x: center.x + displacement.x,
    y: center.y + displacement.y + pressDepth
  };

  ctx.save();

  const palette =
    machinePalette();
  const cableRgb =
    left
      ? palette.secondary
      : palette.accent;

  ctx.strokeStyle =
    `rgba(${cableRgb.join(",")},.22)`;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(
    center.x + (left ? 24 : -24),
    center.y - 18
  );
  ctx.quadraticCurveTo(
    left ? 106 : 434,
    846,
    pivot.x,
    pivot.y + 5
  );
  ctx.stroke();

  ctx.shadowBlur = 18;
  ctx.shadowColor =
    left
      ? "rgba(92,204,255,.34)"
      : "rgba(204,139,255,.32)";
  ctx.fillStyle = "#0c1420";
  ctx.strokeStyle =
    slideActive
      ? connected
        ? "#fff1a9"
        : "rgba(255,113,132,.76)"
      : left
        ? "rgba(142,222,255,.64)"
        : "rgba(224,188,255,.62)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(
    center.x,
    center.y,
    38,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(
    center.x,
    center.y,
    29,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.strokeStyle = "#435264";
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(center.x, center.y + 2);
  ctx.lineTo(cap.x, cap.y + 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(center.x - 2, center.y - 1);
  ctx.lineTo(cap.x - 2, cap.y - 1);
  ctx.stroke();

  ctx.shadowBlur =
    slideActive || phase.active ? 24 : 12;
  ctx.shadowColor =
    connected
      ? "#fff1a9"
      : left
        ? "rgba(92,204,255,.52)"
        : "rgba(204,139,255,.50)";

  const capGradient =
    ctx.createRadialGradient(
      cap.x - 8,
      cap.y - 10,
      3,
      cap.x,
      cap.y,
      31
    );
  capGradient.addColorStop(0, "#526174");
  capGradient.addColorStop(0.45, "#2d3948");
  capGradient.addColorStop(1, "#111924");

  ctx.fillStyle = capGradient;
  ctx.strokeStyle =
    slideActive
      ? connected
        ? "#fff1a9"
        : "#ff8c9b"
      : left
        ? "#7fdcff"
        : "#d9a9ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(
    cap.x,
    cap.y,
    29,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,.42)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    cap.x - 5,
    cap.y - 6,
    16,
    Math.PI * 1.12,
    Math.PI * 1.72
  );
  ctx.stroke();

  ctx.restore();
}

function drawFlipper(side, songTime) {
  const segment =
    flipperSegment(side, songTime);
  const phase = segment.phase;
  const slide =
    activeSlideAt(songTime, side);
  const slideActive =
    Boolean(slide?.started);
  const palette =
    machinePalette();
  const sideRgb =
    side === "left"
      ? palette.secondary
      : palette.accent;
  const sideColor =
    `rgb(${sideRgb.join(",")})`;
  const hot =
    phase.attack || slideActive;
  const angle =
    Math.atan2(
      segment.tip.y - segment.pivot.y,
      segment.tip.x - segment.pivot.x
    );
  const mid = {
    x:
      lerp(
        segment.pivot.x,
        segment.tip.x,
        0.55
      ),
    y:
      lerp(
        segment.pivot.y,
        segment.tip.y,
        0.55
      )
  };

  drawControlButton(side, songTime);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Heavy chassis: the claw should read as a machine, not a neon line.
  ctx.shadowBlur =
    hot ? 22 : 8;
  ctx.shadowColor =
    hot
      ? "#fff1a9"
      : sideColor;

  ctx.strokeStyle = "#101824";
  ctx.lineWidth =
    FLIPPER.width + 13;
  ctx.beginPath();
  ctx.moveTo(
    segment.pivot.x,
    segment.pivot.y
  );
  ctx.lineTo(
    segment.tip.x,
    segment.tip.y
  );
  ctx.stroke();

  ctx.strokeStyle =
    hot
      ? "#f3e5a4"
      : "#344252";
  ctx.lineWidth =
    FLIPPER.width + 3;
  ctx.beginPath();
  ctx.moveTo(
    segment.pivot.x,
    segment.pivot.y
  );
  ctx.lineTo(
    segment.tip.x,
    segment.tip.y
  );
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = sideColor;
  ctx.globalAlpha =
    hot ? 0.94 : 0.58;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(
    segment.pivot.x,
    segment.pivot.y
  );
  ctx.lineTo(
    segment.tip.x,
    segment.tip.y
  );
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Hydraulic collar midway along the arm.
  ctx.save();
  ctx.translate(mid.x, mid.y);
  ctx.rotate(angle);
  ctx.fillStyle = "#0c121c";
  ctx.strokeStyle =
    "rgba(255,255,255,.24)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(
    -10,
    -12,
    20,
    24,
    5
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = sideColor;
  ctx.globalAlpha = 0.62;
  ctx.fillRect(
    -4,
    -9,
    8,
    18
  );
  ctx.restore();

  // Pivot joint.
  ctx.fillStyle = "#101824";
  ctx.strokeStyle = sideColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(
    segment.pivot.x,
    segment.pivot.y,
    14,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle =
    hot ? "#fff1a9" : "#516273";
  ctx.beginPath();
  ctx.arc(
    segment.pivot.x,
    segment.pivot.y,
    5,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Pincer assembly at the tip.
  ctx.save();
  ctx.translate(
    segment.tip.x,
    segment.tip.y
  );
  ctx.rotate(angle);

  ctx.shadowBlur =
    hot ? 22 : 10;
  ctx.shadowColor =
    hot ? "#fff1a9" : sideColor;

  ctx.fillStyle = "#121b28";
  ctx.strokeStyle =
    hot ? "#fff1a9" : sideColor;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    10,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  const jawSpread =
    phase.attack
      ? 0.18
      : slideActive
        ? 0.30
        : 0.48;
  const jawLength =
    hot ? 22 : 19;

  ctx.lineWidth = 6;
  ctx.lineCap = "round";

  for (const sign of [-1, 1]) {
    const a =
      sign * jawSpread;
    const elbowX =
      Math.cos(a) * 11;
    const elbowY =
      Math.sin(a) * 11;
    const tipX =
      Math.cos(a * 1.45) *
      jawLength;
    const tipY =
      Math.sin(a * 1.45) *
      jawLength;

    ctx.strokeStyle = "#121b28";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(3, sign * 4);
    ctx.quadraticCurveTo(
      elbowX,
      elbowY,
      tipX,
      tipY
    );
    ctx.stroke();

    ctx.strokeStyle =
      hot ? "#fff1a9" : sideColor;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(3, sign * 4);
    ctx.quadraticCurveTo(
      elbowX,
      elbowY,
      tipX,
      tipY
    );
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.restore();
}
function drawImpactFlashes() {
  for (const flash of impactFlashes) {
    const t = clamp(flash.life / flash.duration, 0, 1);
    const alpha = 1 - t;

    ctx.strokeStyle = flash.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(flash.x, flash.y, 8 + t * 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawExplosions() {
  for (const explosion of explosions) {
    const t = clamp(explosion.life / explosion.duration, 0, 1);
    const alpha = 1 - t;

    ctx.strokeStyle =
      `rgba(255,240,170,${alpha * 0.8})`;

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      explosion.x,
      explosion.y,
      (8 + t * 30) * explosion.scale,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    for (const particle of explosion.particles) {
      const distance = particle.speed * explosion.life;
      const x =
        explosion.x +
        Math.cos(particle.angle) * distance;
      const y =
        explosion.y +
        Math.sin(particle.angle) * distance;

      ctx.fillStyle =
        `rgba(255,255,255,${alpha})`;

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMessage() {
  if (performance.now() > messageUntil) return;

  ctx.fillStyle = messageColor;
  ctx.font = "900 24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, DESIGN.width / 2, 510);
}

function drawCountIn(songTime) {
  if (songTime >= 0) return;

  const remaining =
    Math.max(1, Math.ceil(-clock.beat));

  ctx.fillStyle = "rgba(255,255,255,.86)";
  ctx.font = "900 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    String(remaining),
    DESIGN.width / 2,
    365
  );

  ctx.font = "700 12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.48)";
  ctx.fillText("PREPÁRATE", DESIGN.width / 2, 405);
}

function drawDebug(songTime) {
  const loopBeat =
    ((clock.beat % LOOP_BEATS) + LOOP_BEATS) %
    LOOP_BEATS;

  const lines = [
    `LAB v0.24 · ${chartName} · BPM ${BPM} · beat ${loopBeat.toFixed(2)}`,
    `tap ${NOTE_SPEED}px/s CONSTANTE · projectile ${POST_HIT_SPEED}px/s`,
    `tap contacto · slide TRACE/FOLLOW · wave ${wave} · upgrades físicos`,
    `hits ${hitCount} miss ${missCount} chain ${chainCount} choque ${collisionCount} pared ${wallExplosionCount}`,
    `stick L:${slideControl.left.x.toFixed(2)},${slideControl.left.y.toFixed(2)} R:${slideControl.right.x.toFixed(2)},${slideControl.right.y.toFixed(2)}`,
    `input ${lastInputType} · offset ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`,
    `FPS ${fps.toFixed(0)} · multi x${comboMultiplier(combo)}`,
    `mode ${runMode} seed ${runSeed} · T ${runStats?.traceSuccess ?? 0}/${runStats?.traceAttempts ?? 0} F ${runStats?.followSuccess ?? 0}/${runStats?.followAttempts ?? 0}`
  ];

  ctx.fillStyle = "rgba(0,0,0,.52)";
  ctx.fillRect(12, 92, 500, 117);

  ctx.fillStyle = "rgba(235,244,255,.78)";
  ctx.font =
    "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  lines.forEach((line, index) => {
    ctx.fillText(line, 18, 100 + index * 15);
  });
}

function render(songTime) {
  clearCanvas();
  drawBackground();
  drawBossCore(songTime);
  drawBumpers();

  for (const event of active.values()) {
    if (event.type === "slide") {
      drawSlide(event, songTime);
    }
  }

  drawChainOpportunities();

  for (const event of active.values()) {
    if (event.type === "tap") {
      drawTap(event);
    }
  }

  drawFlipper("left", songTime);
  drawFlipper("right", songTime);

  drawImpactFlashes();
  drawExplosions();
  drawMessage();
  drawCountIn(songTime);

  if (showDebug) drawDebug(songTime);
}

function resetRunMods() {
  runMods.twinShots = 0;
  runMods.ricochetBounces = 0;
  runMods.pierceHits = 0;
  runMods.fragmentCount = 0;
  runMods.bumperCount = 0;
  runMods.slideNova = 0;
  runMods.slideMirror = 0;
  runMods.chainRelay = 0;
  runMods.shockwave = 0;
  runMods.fusionBlast = 0;
  runMods.wallCharge = 0;
  runMods.bumperSplit = 0;
  runMods.comboShieldCharges = 0;
}

function resetWaveState() {
  active.clear();
  resolved.clear();
  explosions = [];
  impactFlashes = [];
  for (const side of ["left", "right"]) {
    slideControl[side].held = false;
    slideControl[side].pointerId = null;
    slideControl[side].x = 0;
    slideControl[side].y = 0;
    slideControl[side].releasedAt = -Infinity;
  }

  flippers.left.startTime = -Infinity;
  flippers.left.hitThisSwing = false;
  flippers.right.startTime = -Infinity;
  flippers.right.hitThisSwing = false;
}

function pickUpgradeChoices() {
  const pool =
    UPGRADES.filter(
      (upgrade) =>
        !upgrade.available ||
        upgrade.available()
    );

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j =
      Math.floor(runRandom() * (i + 1));
    [pool[i], pool[j]] =
      [pool[j], pool[i]];
  }

  const choices = [];
  const families = new Set();

  for (const upgrade of pool) {
    if (families.has(upgrade.family)) continue;

    choices.push(upgrade);
    families.add(upgrade.family);

    if (choices.length === 3) {
      return choices;
    }
  }

  for (const upgrade of pool) {
    if (choices.includes(upgrade)) continue;
    choices.push(upgrade);
    if (choices.length === 3) break;
  }

  return choices;
}

function renderUpgradeChoices() {
  const choices =
    pickUpgradeChoices();

  upgradeCards.innerHTML = "";

  for (const upgrade of choices) {
    const button =
      document.createElement("button");
    button.type = "button";
    button.className =
      `upgrade-card family-${upgrade.family}`;
    button.innerHTML =
      `<span class="upgrade-icon" aria-hidden="true">${upgrade.icon}</span><strong>${upgrade.title}</strong><span class="upgrade-effect">${upgrade.effect}</span><span class="upgrade-desc">${upgrade.desc}</span>`;

    button.addEventListener(
      "click",
      async () => {
        if (!awaitingUpgrade) return;

        awaitingUpgrade = false;
        upgrade.apply();

        buildHistory.push({
          id: upgrade.id,
          title: upgrade.title,
          family: upgrade.family
        });

        if (runStats) {
          runStats.chosenUpgrades.push(
            upgrade.id
          );
        }

        wave += 1;

        upgradePanel.hidden = true;

        await beginAct();
      }
    );

    upgradeCards.append(button);
  }
}

async function beginAct() {
  resetWaveState();

  bossState = {
    active: wave === FINAL_ACT,
    health: BOSS_MAX_HEALTH,
    maxHealth: BOSS_MAX_HEALTH,
    broken: false,
    damage: 0,
    hitFlash: 0
  };

  updateHud();

  showMessage(
    wave === FINAL_ACT
      ? "ACTO 7 · AURA CORE"
      : `ACTO ${wave} · BUILD THE BEAT`,
    wave === FINAL_ACT
      ? "#ffdf85"
      : "#fff1a9",
    wave === FINAL_ACT
      ? 1100
      : 700
  );

  await clock.start();

  running = true;
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

function openUpgradePanel() {
  if (awaitingUpgrade) return;

  awaitingUpgrade = true;
  running = false;
  clock.stopScheduler();

  active.clear();
  explosions = [];
  impactFlashes = [];

  upgradeTitle.textContent =
    runMode === "daily"
      ? `DAILY · ACTO ${wave}/${RUN_ACTS}`
      : `ACTO ${wave}/${RUN_ACTS} · ELIGE 1`;

  render(clock.songTime);
  renderUpgradeChoices();
  upgradePanel.hidden = false;
}

function bossDamagePercent() {
  return Math.round(
    clamp(
      bossState.damage /
        bossState.maxHealth,
      0,
      1
    ) * 100
  );
}

function completeRun() {
  if (!running) return;

  running = false;
  awaitingUpgrade = false;
  clock.stopScheduler();

  const completedBossDamage =
    bossDamagePercent();
  const previousRuns =
    profile.runsCompleted;

  profile.runsCompleted += 1;
  profile.bestScore =
    Math.max(
      Number(profile.bestScore || 0),
      score
    );
  profile.calibrationOffsetMs =
    calibrationOffsetMs;

  saveLocalJson(
    PROFILE_KEY,
    profile
  );

  recordLifetimeMetric(
    "runsCompleted",
    1
  );

  const elapsedMs =
    performance.now() -
    runStartedAt;

  if (runStats) {
    runStats.completedAt =
      performance.now();
    runStats.durationMs = elapsedMs;
    runStats.score = score;
    runStats.maxCombo = maxCombo;
    runStats.chainCount = chainCount;
    runStats.bossDamage =
      completedBossDamage;
  }

  summaryScore.textContent =
    String(score);
  summaryHits.textContent =
    String(hitCount);
  summaryChains.textContent =
    String(chainCount);
  summaryMisses.textContent =
    String(missCount);
  summaryBoss.textContent =
    `${completedBossDamage}%`;

  summaryTitle.textContent =
    bossState.broken
      ? "AURA CORE ROTO"
      : "MÁQUINA ESTABLE";

  summaryBuild.innerHTML = "";

  if (buildHistory.length === 0) {
    const empty =
      document.createElement("span");
    empty.textContent = "SIN MODS";
    summaryBuild.append(empty);
  } else {
    for (const upgrade of buildHistory) {
      const chip =
        document.createElement("span");
      chip.textContent = upgrade.title;
      chip.className =
        `family-${upgrade.family}`;
      summaryBuild.append(chip);
    }
  }

  const unlocked =
    Object.entries(MACHINES)
      .filter(
        ([, machine]) =>
          machine.unlockRuns >
            previousRuns &&
          machine.unlockRuns <=
            profile.runsCompleted
      )
      .map(
        ([, machine]) =>
          machine.name
      );

  summaryUnlock.textContent =
    unlocked.length
      ? `NUEVA MÁQUINA: ${unlocked.join(" · ")}`
      : score >= profile.bestScore
        ? "NUEVO MEJOR REGISTRO"
        : "";

  refreshMachineOptions();

  active.clear();
  explosions = [];
  impactFlashes = [];
  render(clock.songTime);

  summaryPanel.hidden = false;
}

function frame(now) {
  if (!running) return;

  const dt =
    Math.min(
      0.033,
      (now - lastFrame) / 1000 || 0
    );

  lastFrame = now;

  if (dt > 0) {
    fps +=
      ((1 / dt) - fps) * 0.08;
  }

  const songTime =
    clock.songTime;

  spawnReady(songTime);
  updateEvents(dt, songTime);
  resolveFlipperCollisions(songTime);
  resolveBumperCollisions();
  resolveBossCollisions();
  resolveProjectileCollisions();
  updateEffects(dt);
  render(songTime);

  if (clock.beat >= LOOP_BEATS) {
    if (wave >= RUN_ACTS) {
      completeRun();
    } else {
      openUpgradePanel();
    }
    return;
  }

  requestAnimationFrame(frame);
}

function pressVisual(button, state) {
  button.classList.toggle("active", state);
}

function handleSidePress(
  side,
  eventTimestamp,
  inputType = "unknown",
  pointerEvent = null
) {
  if (!running) return;

  const songTime =
    eventSongTime(eventTimestamp);

  const slide =
    activeSlideAt(songTime, side);

  if (
    slide &&
    slidePressReserved(
      slide,
      side,
      songTime
    )
  ) {
    slideControl[side].held = true;

    if (pointerEvent) {
      slideControl[side].pointerId =
        pointerEvent.pointerId;
    }

    if (pointerEvent) {
      updateSlidePadPosition(
        side,
        pointerEvent
      );
    }

    if (!slide.started) {
      beginSlide(
        slide,
        side,
        songTime
      );
    }

    lastInputType = "slide";
    return;
  }

  triggerFlipper(
    side,
    eventTimestamp,
    inputType
  );
}

function handleSideMove(
  side,
  event
) {
  const control =
    slideControl[side];

  if (
    control.pointerId !== event.pointerId
  ) {
    return;
  }

  const slide =
    activeSlideAt(
      eventSongTime(event.timeStamp),
      side
    );

  if (!slide?.started) return;

  updateSlidePadPosition(
    side,
    event
  );
}

function handleSideRelease(
  side,
  eventTimestamp,
  pointerId = null
) {
  const songTime =
    eventSongTime(eventTimestamp);

  const control =
    slideControl[side];

  if (
    pointerId !== null &&
    control.pointerId !== null &&
    pointerId !== control.pointerId
  ) {
    return;
  }

  control.held = false;
  control.pointerId = null;
  control.x = 0;
  control.y = 0;
  control.releasedAt = songTime;
}

function bindButton(button, side) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    pressVisual(button, true);

    handleSidePress(
      side,
      event.timeStamp,
      event.pointerType || "touch",
      event
    );
  });

  button.addEventListener("pointermove", (event) => {
    event.preventDefault();
    handleSideMove(
      side,
      event
    );
  });

  const release = (event) => {
    event?.preventDefault?.();
    pressVisual(button, false);

    handleSideRelease(
      side,
      event?.timeStamp,
      event?.pointerId ?? null
    );
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

bindButton(leftButton, "left");
bindButton(rightButton, "right");

function activeTraceSlideCandidate(songTime) {
  return [...active.values()]
    .filter(
      (event) =>
        event.type === "slide" &&
        slideMode(event) === "trace"
    )
    .filter((event) => {
      if (event.started) {
        return songTime <= event.endTime;
      }

      const delta =
        songTime - event.targetTime;

      return (
        delta >= -SLIDE.startEarly &&
        delta <= SLIDE.startLate
      );
    })
    .sort(
      (a, b) =>
        Math.abs(a.targetTime - songTime) -
        Math.abs(b.targetTime - songTime)
    )[0] ?? null;
}

function traceTargetPoint(event, songTime) {
  return slideTipPoint(
    event.side,
    event.started
      ? slideVectorAtTime(event, songTime)
      : slideVectorAtBeat(event, 0)
  );
}

canvas.addEventListener(
  "pointerdown",
  (pointerEvent) => {
    if (!running) return;

    const songTime =
      eventSongTime(pointerEvent.timeStamp);
    const slide =
      activeTraceSlideCandidate(songTime);

    if (!slide) return;

    const point =
      eventToDesign(pointerEvent);
    const target =
      traceTargetPoint(slide, songTime);
    const grabRadius =
      slide.started
        ? SLIDE.traceGrabRadius * 1.35
        : SLIDE.traceGrabRadius;

    if (
      Math.hypot(
        point.x - target.x,
        point.y - target.y
      ) > grabRadius
    ) {
      return;
    }

    pointerEvent.preventDefault();
    canvas.setPointerCapture?.(
      pointerEvent.pointerId
    );

    slide.traceHeld = true;
    slide.tracePointerId =
      pointerEvent.pointerId;
    slide.playerVector =
      pointToSlideVector(
        slide.side,
        point
      );

    if (!slide.started) {
      beginSlide(
        slide,
        slide.side,
        songTime
      );
    }

    lastInputType = "trace";
  },
  { passive: false }
);

canvas.addEventListener(
  "pointermove",
  (pointerEvent) => {
    const slide =
      [...active.values()]
        .find(
          (event) =>
            event.type === "slide" &&
            slideMode(event) === "trace" &&
            event.traceHeld &&
            event.tracePointerId ===
              pointerEvent.pointerId
        );

    if (!slide) return;

    pointerEvent.preventDefault();

    slide.playerVector =
      pointToSlideVector(
        slide.side,
        eventToDesign(pointerEvent)
      );
  },
  { passive: false }
);

function releaseTracePointer(pointerEvent) {
  const slide =
    [...active.values()]
      .find(
        (event) =>
          event.type === "slide" &&
          slideMode(event) === "trace" &&
          event.tracePointerId ===
            pointerEvent.pointerId
      );

  if (!slide) return;

  pointerEvent.preventDefault();
  slide.traceHeld = false;
  slide.tracePointerId = null;
}

canvas.addEventListener(
  "pointerup",
  releaseTracePointer,
  { passive: false }
);
canvas.addEventListener(
  "pointercancel",
  releaseTracePointer,
  { passive: false }
);
canvas.addEventListener(
  "lostpointercapture",
  releaseTracePointer,
  { passive: false }
);

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  const key = event.key.toLowerCase();

  if (key === "h") {
    showDebug = !showDebug;
    return;
  }

  if (key === "[") {
    setCalibration(
      calibrationOffsetMs - 5
    );

    showMessage(
      `OFFSET ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`,
      "#79d8ff",
      500
    );

    return;
  }

  if (key === "]") {
    setCalibration(
      calibrationOffsetMs + 5
    );

    showMessage(
      `OFFSET ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`,
      "#79d8ff",
      500
    );

    return;
  }

  if (key === "a" || event.key === "ArrowLeft") {
    pressVisual(leftButton, true);
    handleSidePress(
      "left",
      event.timeStamp,
      "keyboard",
      null
    );
  }

  if (key === "d" || event.key === "ArrowRight") {
    pressVisual(rightButton, true);
    handleSidePress(
      "right",
      event.timeStamp,
      "keyboard",
      null
    );
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();

  if (key === "a" || event.key === "ArrowLeft") {
    pressVisual(leftButton, false);
    handleSideRelease(
      "left",
      event.timeStamp
    );
  }

  if (key === "d" || event.key === "ArrowRight") {
    pressVisual(rightButton, false);
    handleSideRelease(
      "right",
      event.timeStamp
    );
  }
});

async function startRun(mode = "standard") {
  runMode = mode;
  seedRunRng(
    mode === "daily"
      ? hashString(
          `aura-farm-daily:${localDateKey()}`
        )
      : Date.now()
  );

  score = 0;
  combo = 0;
  maxCombo = 0;
  hitCount = 0;
  missCount = 0;
  chainCount = 0;
  collisionCount = 0;
  wallExplosionCount = 0;
  wave = 1;
  awaitingUpgrade = false;
  buildHistory = [];
  runStats = newRunStats();
  runStartedAt = performance.now();

  lastDeltaMs = null;
  lastJudgement = "—";
  lastInputType = "—";
  message = "";

  resetRunMods();
  resetWaveState();

  bossState = {
    active: false,
    health: BOSS_MAX_HEALTH,
    maxHealth: BOSS_MAX_HEALTH,
    broken: false,
    damage: 0,
    hitFlash: 0
  };

  updateHud();

  startButton.disabled = true;
  dailyButton.disabled = true;
  startButton.textContent =
    "INICIANDO…";

  upgradePanel.hidden = true;
  summaryPanel.hidden = true;

  await ensureChartLoaded();
  buildPaths();

  recordLifetimeMetric(
    "runsStarted",
    1
  );

  startPanel.hidden = true;

  await beginAct();

  startButton.disabled = false;
  dailyButton.disabled = false;
  startButton.textContent =
    "RUN · 7 ACTOS";
}

startButton.addEventListener(
  "click",
  () => startRun("standard")
);

dailyButton.addEventListener(
  "click",
  () => startRun("daily")
);

rerunButton.addEventListener(
  "click",
  () => startRun("standard")
);

summaryDailyButton.addEventListener(
  "click",
  () => startRun("daily")
);

for (const option of machineOptions) {
  option.addEventListener(
    "click",
    () => {
      applyMachineSelection(
        option.dataset.machine
      );
      render(clock.songTime);
    }
  );
}

function setCalibration(value) {
  calibrationOffsetMs =
    clamp(
      value,
      -250,
      250
    );
  profile.calibrationOffsetMs =
    calibrationOffsetMs;
  saveLocalJson(
    PROFILE_KEY,
    profile
  );
  calibrationValue.textContent =
    `${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`;
}

calibrationMinus.addEventListener(
  "click",
  () =>
    setCalibration(
      calibrationOffsetMs - 15
    )
);

calibrationPlus.addEventListener(
  "click",
  () =>
    setCalibration(
      calibrationOffsetMs + 15
    )
);

window.addEventListener("resize", () => {
  resizeCanvas();

  if (routes) {
    buildPaths();
  }

  render(clock.songTime);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden || !running) return;

  running = false;
  clock.stopScheduler();

  startPanel.hidden = false;
  startButton.disabled = false;
  startButton.textContent = "REINICIAR PRUEBA";
});

refreshMachineOptions();
setCalibration(
  calibrationOffsetMs
);
resizeCanvas();
buildPaths();
updateHud();
render(clock.songTime);
