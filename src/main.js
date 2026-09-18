import { loadGameChart } from "./chart.js?v=0.32";
import {
  AURA_SONG,
  midiToHz,
  songFrameAtBeat
} from "./music.js?v=0.32";

const app = document.querySelector(".app");
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startPanel = document.querySelector("#startPanel");
const startButton = document.querySelector("#startButton");
const dailyButton = document.querySelector("#dailyButton");
const practiceButton = document.querySelector("#practiceButton");
const startButtonLabel = document.querySelector("#startButtonLabel");
const menuSettingsButton = document.querySelector("#menuSettingsButton");
const menuSettingsClose = document.querySelector("#menuSettingsClose");
const menuSettings = document.querySelector("#menuSettings");
const menuBestScore = document.querySelector("#menuBestScore");
const menuRuns = document.querySelector("#menuRuns");
const menuAuriLine = document.querySelector("#menuAuriLine");
const rerunButton = document.querySelector("#rerunButton");
const summaryDailyButton = document.querySelector("#summaryDailyButton");
const leftButton = document.querySelector("#leftButton");
const rightButton = document.querySelector("#rightButton");
const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const comboMultEl = document.querySelector("#comboMult");
const trackSectionEl = document.querySelector("#trackSection");
const trackProgressEl = document.querySelector("#trackProgress");
const topbarEl = document.querySelector(".topbar");
const actEl = document.querySelector("#act");
const lastHitEl = document.querySelector("#lastHit");
const upgradePanel = document.querySelector("#upgradePanel");
const upgradeTitle = document.querySelector("#upgradeTitle");
const upgradeCards = document.querySelector("#upgradeCards");
const buildDock = document.querySelector("#buildDock");
const buildDockItems = document.querySelector("#buildDockItems");
const synergyBadge = document.querySelector("#synergyBadge");
const buildButton = document.querySelector("#buildButton");
const moduleSlotStatus = document.querySelector("#moduleSlotStatus");
const upgradeManageButton = document.querySelector("#upgradeManageButton");
const currentSynergy = document.querySelector("#currentSynergy");
const buildPanel = document.querySelector("#buildPanel");
const activeSlotCount = document.querySelector("#activeSlotCount");
const reserveSlotCount = document.querySelector("#reserveSlotCount");
const activeModuleSlots = document.querySelector("#activeModuleSlots");
const reserveModuleSlots = document.querySelector("#reserveModuleSlots");
const buildManagerDetail = document.querySelector("#buildManagerDetail");
const buildManagerSynergy = document.querySelector("#buildManagerSynergy");
const buildCloseButton = document.querySelector("#buildCloseButton");
const pausePanel = document.querySelector("#pausePanel");
const pauseButton = document.querySelector("#pauseButton");
const pauseBuildList = document.querySelector("#pauseBuildList");
const pauseSynergy = document.querySelector("#pauseSynergy");
const abandonButton = document.querySelector("#abandonButton");
const resumeButton = document.querySelector("#resumeButton");
const summaryPanel = document.querySelector("#summaryPanel");
const summaryTitle = document.querySelector("#summaryTitle");
const summaryMachine = document.querySelector("#summaryMachine");
const summaryRankCard = document.querySelector("#summaryRankCard");
const summaryRank = document.querySelector("#summaryRank");
const summaryRankLabel = document.querySelector("#summaryRankLabel");
const summaryScore = document.querySelector("#summaryScore");
const summaryHits = document.querySelector("#summaryHits");
const summaryChains = document.querySelector("#summaryChains");
const summaryMisses = document.querySelector("#summaryMisses");
const summaryBoss = document.querySelector("#summaryBoss");
const summaryBuild = document.querySelector("#summaryBuild");
const summaryUnlock = document.querySelector("#summaryUnlock");
const calibrationMinus = document.querySelector("#calibrationMinus");
const calibrationPlus = document.querySelector("#calibrationPlus");
const autoCalibration = document.querySelector("#autoCalibration");
const calibrationPanel = document.querySelector("#calibrationPanel");
const calibrationTap = document.querySelector("#calibrationTap");
const calibrationStatus = document.querySelector("#calibrationStatus");
const calibrationClose = document.querySelector("#calibrationClose");
const calibrationValue = document.querySelector("#calibrationValue");
const machineOptions =
  [...document.querySelectorAll(".machine-option")];

const DESIGN = { width: 540, height: 960 };

const WORLD_ASSETS = {
  far: new Image(),
  mid: new Image()
};

WORLD_ASSETS.far.src =
  "./assets/world/glasshouse-far.svg?v=0.32";
WORLD_ASSETS.mid.src =
  "./assets/world/growth-bays.svg?v=0.32";

function drawWorldAsset(
  image,
  alpha
) {
  if (
    !image.complete ||
    image.naturalWidth === 0
  ) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    image,
    0,
    0,
    DESIGN.width,
    DESIGN.height
  );
  ctx.restore();
}

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
  reachMin: 0.88,
  reachMax: 1.15,
  nodeBeats: 0.5,
  traceGrabRadius: 48
};

const POWER_ORB_BASE_SCALE = 1.55;
const POWER_ORB_SPEED = 505;
const POWER_ORB_BONUS_RICOCHETS = 1;

const BUMPER_LAYOUT = [
  { x: 270, y: 535, radius: 31 },
  { x: 185, y: 430, radius: 27 },
  { x: 355, y: 430, radius: 27 }
];

const RUN_ACTS = 7;
const FINAL_ACT = RUN_ACTS;
const BOSS_MAX_HEALTH = 18;
const ACTIVE_MODULE_LIMIT = 4;
const RESERVE_MODULE_LIMIT = 4;
const MODULE_MAX_LEVEL = 3;

const ACTS = [
  null,
  { name: "IGNITION", cue: "ENCIENDE LA MÁQUINA", intensity: 0.14 },
  { name: "CURRENT", cue: "MANTÉN EL FLUJO", intensity: 0.24 },
  { name: "RELAY", cue: "BUSCA CHAIN", intensity: 0.36 },
  { name: "OVERDRIVE", cue: "CONSTRUYE MOMENTO", intensity: 0.50 },
  { name: "FRACTURE", cue: "ROMPE EL PATRÓN", intensity: 0.64 },
  { name: "ASCENT", cue: "PREPARA EL CORE", intensity: 0.80 },
  { name: "AURA CORE", cue: "ROMPE LA ARMADURA", intensity: 1 }
];

function currentActMeta() {
  return ACTS[
    clamp(
      Math.round(wave),
      1,
      RUN_ACTS
    )
  ] ?? ACTS[1];
}

function runTargetActs() {
  return runMode === "practice"
    ? 1
    : RUN_ACTS;
}
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
    calibrationOffsetMs: 0,
    dailyBest: {},
    tutorialSeen: false
  }
);

profile.dailyBest =
  profile.dailyBest &&
  typeof profile.dailyBest === "object"
    ? profile.dailyBest
    : {};

const lifetimeMetrics = loadLocalJson(
  METRICS_KEY,
  {
    sessions: 0,
    runsStarted: 0,
    runsCompleted: 0,
    totalChains: 0,
    traceAttempts: 0,
    traceSuccess: 0
  }
);

lifetimeMetrics.sessions += 1;
saveLocalJson(METRICS_KEY, lifetimeMetrics);

let selectedMachine =
  MACHINES[profile.selectedMachine]
    ? profile.selectedMachine
    : "forge";
let runMode = "standard";
let runPaused = false;
let runSeed = 1;
let rngState = 1;
let buildHistory = [];
let moduleInventory = new Map();
let activeModuleIds = [];
let reserveModuleIds = [];
let selectedBuildModule = null;
let buildPanelContext = "run";
let modulePreviewFrame = null;
const runConsumables = {
  comboShieldSpent: 0
};
let runStartedAt = 0;
let maxCombo = 0;
let runStats = null;
let bossState = {
  active: false,
  health: BOSS_MAX_HEALTH,
  maxHealth: BOSS_MAX_HEALTH,
  broken: false,
  damage: 0,
  hitFlash: 0,
  shieldFlash: 0,
  armor: [false, false, false],
  phase: 1,
  recharged: false
};

let screenShake = 0;
let impactVeil = 0;
let operatorPulse = 0;
let operatorMood = "idle";
let operatorLean = 0;
let calibrationSession = null;

function bumpFeedback(
  shake = 0,
  veil = 0
) {
  screenShake =
    Math.max(screenShake, shake);
  impactVeil =
    Math.max(impactVeil, veil);
}

function setOperatorMood(
  mood,
  pulse = 0.5
) {
  operatorMood = mood;
  operatorPulse =
    Math.max(operatorPulse, pulse);
}

function setOperatorLean(
  side,
  amount = 1
) {
  operatorLean =
    side === "left"
      ? -Math.abs(amount)
      : side === "right"
        ? Math.abs(amount)
        : 0;
}

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

function refreshStartMenu() {
  menuBestScore.textContent =
    Number(
      profile.bestScore || 0
    ).toLocaleString("es-CL");
  menuRuns.textContent =
    String(
      Number(
        profile.runsCompleted || 0
      )
    );

  const completed =
    Number(
      profile.runsCompleted || 0
    );

  menuAuriLine.textContent =
    completed === 0
      ? "La máquina está lista. Hazla crecer."
      : completed < 3
        ? "Ya conoces el pulso. Ahora construye una build con intención."
        : "El Core ya te conoce. Haz que esta run suene distinta.";
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
    this.masterBus = null;
    this.saturator = null;
    this.compressor = null;
    this.stemBuses = null;
    this.sfxBusNode = null;
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayWet = null;
  }

  ensureMixGraph() {
    if (
      !this.context ||
      this.masterBus
    ) {
      return;
    }

    const context =
      this.context;

    this.masterBus =
      context.createGain();
    this.masterBus.gain.value =
      0.82;

    this.saturator =
      context.createWaveShaper();
    this.saturator.oversample =
      "2x";

    const saturationCurve =
      new Float32Array(1024);

    for (
      let index = 0;
      index <
        saturationCurve.length;
      index += 1
    ) {
      const x =
        (
          index /
          (
            saturationCurve.length -
            1
          )
        ) *
          2 -
        1;

      saturationCurve[index] =
        Math.tanh(
          x * 1.45
        ) /
        Math.tanh(1.45);
    }

    this.saturator.curve =
      saturationCurve;

    this.compressor =
      context.createDynamicsCompressor();
    this.compressor.threshold.value =
      -19;
    this.compressor.knee.value =
      16;
    this.compressor.ratio.value =
      2.7;
    this.compressor.attack.value =
      0.007;
    this.compressor.release.value =
      0.22;

    this.masterBus.connect(
      this.saturator
    );
    this.saturator.connect(
      this.compressor
    );
    this.compressor.connect(
      context.destination
    );

    const stemSpec = {
      drums: { gain: 1.00, pan: 0.00, send: 0.00 },
      bass: { gain: 0.95, pan: 0.00, send: 0.00 },
      harmony: { gain: 0.82, pan: -0.10, send: 0.12 },
      lead: { gain: 0.82, pan: 0.12, send: 0.19 },
      aura: { gain: 0.78, pan: -0.16, send: 0.24 },
      boss: { gain: 0.90, pan: 0.00, send: 0.08 }
    };

    this.delayNode =
      context.createDelay(0.8);
    this.delayNode.delayTime.value =
      (60 / AURA_SONG.bpm) *
      0.75;

    this.delayFeedback =
      context.createGain();
    this.delayFeedback.gain.value =
      0.18;

    this.delayWet =
      context.createGain();
    this.delayWet.gain.value =
      0.16;

    this.delayNode.connect(
      this.delayFeedback
    );
    this.delayFeedback.connect(
      this.delayNode
    );
    this.delayNode.connect(
      this.delayWet
    );
    this.delayWet.connect(
      this.masterBus
    );

    this.stemBuses = {};

    for (
      const [
        name,
        spec
      ] of Object.entries(
        stemSpec
      )
    ) {
      const gain =
        context.createGain();
      const pan =
        context.createStereoPanner();
      const send =
        context.createGain();

      gain.gain.value =
        spec.gain;
      pan.pan.value =
        spec.pan;
      send.gain.value =
        spec.send;

      gain.connect(pan);
      pan.connect(
        this.masterBus
      );

      if (spec.send > 0) {
        pan.connect(send);
        send.connect(
          this.delayNode
        );
      }

      this.stemBuses[name] = gain;
    }

    this.sfxBusNode =
      context.createGain();
    this.sfxBusNode.gain.value =
      0.92;
    this.sfxBusNode.connect(
      this.masterBus
    );
  }

  setStemGain(
    name,
    value,
    ramp = 0.45
  ) {
    this.ensureMixGraph();

    const bus =
      this.stemBuses?.[name];

    if (!bus) return;

    const now =
      this.context.currentTime;
    const safe =
      clamp(
        value,
        0.0001,
        1.25
      );

    bus.gain.cancelScheduledValues(
      now
    );
    bus.gain.setTargetAtTime(
      safe,
      now,
      Math.max(
        0.03,
        ramp * 0.35
      )
    );
  }

  applyRunMix(
    ramp = 0.5
  ) {
    if (!this.context) return;

    this.ensureMixGraph();

    const actEnergy =
      clamp(
        (wave - 1) /
          Math.max(
            1,
            RUN_ACTS - 1
          ),
        0,
        1
      );
    const slideEnergy =
      clamp(
        (
          runMods.slideNova +
          runMods.slideMirror
        ) / 3,
        0,
        1
      );
    const auraEnergy =
      clamp(
        (
          runMods.shockwave +
          runMods.fusionBlast +
          runMods.wallCharge +
          runMods.fragmentCount *
            0.25
        ) / 4,
        0,
        1
      );
    const rhythmEnergy =
      clamp(
        (
          runMods.twinShots +
          runMods.chainRelay +
          runMods.bumperSplit
        ) / 3,
        0,
        1
      );
    const synergyEnergy =
      clamp(
        activeBuildSynergies()
          .length / 2,
        0,
        1
      );

    this.setStemGain(
      "drums",
      0.84 +
        actEnergy * 0.10 +
        rhythmEnergy * 0.08,
      ramp
    );
    this.setStemGain(
      "bass",
      0.82 +
        actEnergy * 0.10,
      ramp
    );
    this.setStemGain(
      "harmony",
      0.66 +
        actEnergy * 0.10 +
        synergyEnergy * 0.05,
      ramp
    );
    this.setStemGain(
      "lead",
      0.34 +
        actEnergy * 0.18 +
        slideEnergy * 0.30 +
        synergyEnergy * 0.08,
      ramp
    );
    this.setStemGain(
      "aura",
      0.24 +
        actEnergy * 0.12 +
        auraEnergy * 0.42 +
        synergyEnergy * 0.08,
      ramp
    );
    this.setStemGain(
      "boss",
      wave === FINAL_ACT
        ? (
            bossState.phase === 2
              ? 1.00
              : 0.82
          )
        : 0.0001,
      ramp
    );

    if (this.delayWet) {
      const now =
        this.context.currentTime;
      const target =
        0.09 +
        actEnergy * 0.04 +
        slideEnergy * 0.05 +
        synergyEnergy * 0.025;

      this.delayWet.gain.cancelScheduledValues(
        now
      );
      this.delayWet.gain.setTargetAtTime(
        target,
        now,
        0.18
      );
    }
  }

  stemBus(name) {
    this.ensureMixGraph();

    return (
      this.stemBuses?.[name] ??
      this.masterBus ??
      this.context.destination
    );
  }

  sfxBus() {
    this.ensureMixGraph();

    return (
      this.sfxBusNode ??
      this.masterBus ??
      this.context.destination
    );
  }

  async start() {
    this.context ??= new AudioContext();
    await this.context.resume();
    this.ensureMixGraph();
    this.applyRunMix(0.08);

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

  async pause() {
    this.stopScheduler();

    if (
      this.context &&
      this.context.state === "running"
    ) {
      await this.context.suspend();
    }
  }

  async resumePaused() {
    if (!this.context) return;

    await this.context.resume();
    this.schedule();

    this.stopScheduler();
    this.timer =
      window.setInterval(
        () => this.schedule(),
        25
      );
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
    gain.connect(
      this.sfxBus()
    );
    oscillator.start(time);
    oscillator.stop(time + 0.055);
  }

  scheduleGroove(time, beat) {
    const frame =
      songFrameAtBeat(beat);
    const actEnergy =
      clamp(
        (wave - 1) /
          Math.max(
            1,
            RUN_ACTS - 1
          ),
        0,
        1
      );
    const buildEnergy =
      Math.min(
        1,
        activeModulePower() /
          8
      );
    const slideBuild =
      Math.min(
        1,
        (
          runMods.slideNova +
          runMods.slideMirror
        ) /
          3
      );
    const auraBuild =
      Math.min(
        1,
        (
          runMods.shockwave +
          runMods.fusionBlast +
          runMods.wallCharge +
          runMods.fragmentCount *
            0.3
        ) /
          4
      );
    const rhythmBuild =
      Math.min(
        1,
        (
          runMods.twinShots +
          runMods.chainRelay +
          runMods.bumperSplit
        ) /
          3
      );
    const synergyMix =
      activeBuildSynergies()
        .length > 0
        ? 1
        : 0;

    // STEM 1 — DRUMS
    if (frame.hat) {
      this.scheduleHat(
        time,
        (
          0.011 +
          actEnergy * 0.006 +
          buildEnergy * 0.003
        ) *
          frame.hatAccent
      );
    }

    if (frame.kick) {
      this.scheduleKick(
        time,
        0.068 +
          actEnergy * 0.018
      );
    }

    if (frame.snare) {
      this.scheduleSnare(
        time,
        0.034 +
          actEnergy * 0.012
      );
    }

    if (frame.fill) {
      this.scheduleDrumFill(
        time,
        frame.step,
        0.024 +
          actEnergy * 0.013
      );
    }

    // STEM 2 — BASS
    if (frame.bassMidi !== null) {
      this.scheduleBassStem(
        time,
        midiToHz(
          frame.bassMidi
        ),
        0.017 +
          actEnergy * 0.009 +
          buildEnergy * 0.004
      );
    }

    // STEM 3 — HARMONY
    if (frame.chordMidi) {
      this.scheduleHarmonyStem(
        time,
        frame.chordMidi.map(
          midiToHz
        ),
        0.0045 +
          actEnergy * 0.0035
      );
    }

    // STEM 4 — LEAD
    if (frame.leadMidi !== null) {
      const leadMix =
        0.0015 +
        actEnergy * 0.006 +
        slideBuild * 0.010 +
        synergyMix * 0.0025;

      if (leadMix > 0.002) {
        this.scheduleLeadStem(
          time,
          midiToHz(
            frame.leadMidi
          ),
          leadMix
        );
      }
    }

    // STEM 5 — AURA
    if (frame.auraMidi !== null) {
      const auraMix =
        actEnergy * 0.003 +
        auraBuild * 0.012 +
        (
          chainCount > 0
            ? 0.0025
            : 0
        );

      if (auraMix > 0.002) {
        this.scheduleAuraStem(
          time,
          midiToHz(
            frame.auraMidi
          ),
          auraMix
        );
      }
    }

    // STEM 6 — BOSS
    if (
      wave === FINAL_ACT &&
      frame.bossMidi !== null
    ) {
      this.scheduleBossStem(
        time,
        midiToHz(
          frame.bossMidi
        ),
        bossState.phase === 2
          ? 0.018
          : 0.013
      );
    }

    const majorSectionBars =
      new Set([
        2,
        4,
        6,
        8,
        10,
        12,
        14,
        16
      ]);

    if (
      frame.step === 0 &&
      majorSectionBars.has(
        frame.barIndex
      )
    ) {
      this.scheduleSectionStinger(
        time,
        frame.section,
        0.006 +
          actEnergy * 0.004
      );
    }

    // Build percussion is reactive SFX layered over the six authored stems.
    if (
      frame.step % 2 === 1 &&
      rhythmBuild > 0
    ) {
      this.scheduleBuildClick(
        time,
        0.004 +
          rhythmBuild * 0.007
      );
    }
  }

  scheduleSectionStinger(
    time,
    section,
    volume = 0.008
  ) {
    const sectionRoot = {
      SPROUT: 72,
      CURRENT: 69,
      RELAY: 74,
      FRACTURE: 77,
      OVERDRIVE: 76,
      ASCENT: 79,
      BLOOM: 81,
      ROOT: 57
    }[section] ?? 72;

    const frequencies =
      section === "ROOT"
        ? [
            midiToHz(
              sectionRoot
            ),
            midiToHz(
              sectionRoot + 7
            )
          ]
        : [
            midiToHz(
              sectionRoot
            ),
            midiToHz(
              sectionRoot + 12
            )
          ];

    frequencies.forEach(
      (
        frequency,
        index
      ) => {
        const oscillator =
          this.context.createOscillator();
        const gain =
          this.context.createGain();
        const filter =
          this.context.createBiquadFilter();

        oscillator.type =
          section === "ROOT"
            ? "sawtooth"
            : index === 0
              ? "triangle"
              : "sine";
        oscillator.frequency.setValueAtTime(
          frequency,
          time
        );

        filter.type =
          "lowpass";
        filter.frequency.setValueAtTime(
          section === "ROOT"
            ? 1250
            : 2600,
          time
        );
        filter.Q.value = .7;

        gain.gain.setValueAtTime(
          0.0001,
          time
        );
        gain.gain.exponentialRampToValueAtTime(
          volume *
            (
              index === 0
                ? 1
                : .58
            ),
          time + .012
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          time +
            (
              section === "ROOT"
                ? .34
                : .24
            )
        );

        oscillator.connect(
          filter
        );
        filter.connect(
          gain
        );
        gain.connect(
          this.stemBus(
            section === "ROOT"
              ? "boss"
              : "harmony"
          )
        );

        oscillator.start(
          time
        );
        oscillator.stop(
          time + .38
        );
      }
    );
  }

  scheduleHat(time, volume) {
    const source =
      this.context.createBufferSource();
    const filter =
      this.context.createBiquadFilter();
    const gain =
      this.context.createGain();

    source.buffer =
      this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = 5400;

    gain.gain.setValueAtTime(
      Math.max(
        0.0001,
        volume
      ),
      time
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.035
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(
      this.stemBus("drums")
    );

    source.start(time);
    source.stop(
      time + 0.045
    );
  }

  scheduleSnare(
    time,
    volume = 0.042
  ) {
    const source =
      this.context.createBufferSource();
    const filter =
      this.context.createBiquadFilter();
    const gain =
      this.context.createGain();

    source.buffer =
      this.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = 1750;
    filter.Q.value = 0.9;

    gain.gain.setValueAtTime(
      volume,
      time
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.09
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(
      this.stemBus("drums")
    );
    source.start(time);
    source.stop(
      time + 0.095
    );
  }

  scheduleKick(
    time,
    volume = 0.082
  ) {
    const oscillator =
      this.context.createOscillator();
    const gain =
      this.context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      128,
      time
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      46,
      time + 0.11
    );

    gain.gain.setValueAtTime(
      volume,
      time
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.13
    );

    oscillator.connect(gain);
    gain.connect(
      this.stemBus("drums")
    );
    oscillator.start(time);
    oscillator.stop(
      time + 0.14
    );
  }

  scheduleDrumFill(
    time,
    step,
    volume
  ) {
    const oscillator =
      this.context.createOscillator();
    const source =
      this.context.createBufferSource();
    const toneGain =
      this.context.createGain();
    const noiseGain =
      this.context.createGain();
    const filter =
      this.context.createBiquadFilter();

    oscillator.type =
      "triangle";
    oscillator.frequency.value =
      step % 2 === 0
        ? 172
        : 224;

    source.buffer =
      this.noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value =
      step % 2 === 0
        ? 1200
        : 2100;
    filter.Q.value = 1.1;

    toneGain.gain.setValueAtTime(
      volume,
      time
    );
    toneGain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.08
    );

    noiseGain.gain.setValueAtTime(
      volume * 0.72,
      time
    );
    noiseGain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.055
    );

    oscillator.connect(
      toneGain
    );
    source.connect(filter);
    filter.connect(
      noiseGain
    );

    toneGain.connect(
      this.stemBus("drums")
    );
    noiseGain.connect(
      this.stemBus("drums")
    );

    oscillator.start(time);
    source.start(time);
    oscillator.stop(
      time + 0.09
    );
    source.stop(
      time + 0.06
    );
  }

  scheduleBassStem(
    time,
    frequency,
    volume
  ) {
    const oscillator =
      this.context.createOscillator();
    const sub =
      this.context.createOscillator();
    const gain =
      this.context.createGain();
    const filter =
      this.context.createBiquadFilter();

    oscillator.type = "triangle";
    oscillator.frequency.value =
      frequency;
    sub.type = "sine";
    sub.frequency.value =
      frequency / 2;

    filter.type = "lowpass";
    filter.frequency.value =
      520 +
      wave * 55;

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
      time + 0.23
    );

    oscillator.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(
      this.stemBus("bass")
    );

    oscillator.start(time);
    sub.start(time);
    oscillator.stop(
      time + 0.24
    );
    sub.stop(
      time + 0.24
    );
  }

  scheduleHarmonyStem(
    time,
    frequencies,
    volume
  ) {
    for (
      let index = 0;
      index < frequencies.length;
      index += 1
    ) {
      const oscillator =
        this.context.createOscillator();
      const gain =
        this.context.createGain();
      const filter =
        this.context.createBiquadFilter();

      oscillator.type =
        index === 0
          ? "triangle"
          : "sine";
      oscillator.frequency.value =
        frequencies[index];

      filter.type = "lowpass";
      filter.frequency.value =
        920 +
        wave * 75;

      gain.gain.setValueAtTime(
        0.0001,
        time
      );
      gain.gain.exponentialRampToValueAtTime(
        volume /
          (1 + index * 0.28),
        time + 0.07
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        time + 1.55
      );

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(
        this.stemBus("harmony")
      );
      oscillator.start(time);
      oscillator.stop(
        time + 1.58
      );
    }
  }

  scheduleLeadStem(
    time,
    frequency,
    volume
  ) {
    const oscillator =
      this.context.createOscillator();
    const gain =
      this.context.createGain();
    const filter =
      this.context.createBiquadFilter();

    oscillator.type = "sawtooth";
    oscillator.frequency.value =
      frequency;

    filter.type = "lowpass";
    filter.frequency.value =
      1450 +
      wave * 95;

    gain.gain.setValueAtTime(
      0.0001,
      time
    );
    gain.gain.exponentialRampToValueAtTime(
      volume,
      time + 0.009
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.17
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(
      this.stemBus("lead")
    );
    oscillator.start(time);
    oscillator.stop(
      time + 0.18
    );
  }

  scheduleAuraStem(
    time,
    frequency,
    volume
  ) {
    for (const ratio of [1, 1.5]) {
      const oscillator =
        this.context.createOscillator();
      const gain =
        this.context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value =
        frequency * ratio;

      gain.gain.setValueAtTime(
        0.0001,
        time
      );
      gain.gain.exponentialRampToValueAtTime(
        volume /
          ratio,
        time + 0.018
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        time + 0.34
      );

      oscillator.connect(gain);
      gain.connect(
        this.stemBus("aura")
      );
      oscillator.start(time);
      oscillator.stop(
        time + 0.36
      );
    }
  }

  scheduleBossStem(
    time,
    frequency,
    volume
  ) {
    const oscillator =
      this.context.createOscillator();
    const gain =
      this.context.createGain();
    const filter =
      this.context.createBiquadFilter();

    oscillator.type =
      bossState.phase === 2
        ? "sawtooth"
        : "square";
    oscillator.frequency.value =
      frequency;

    filter.type = "lowpass";
    filter.frequency.value =
      bossState.phase === 2
        ? 720
        : 520;

    gain.gain.setValueAtTime(
      0.0001,
      time
    );
    gain.gain.exponentialRampToValueAtTime(
      volume,
      time + 0.012
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      time + 0.30
    );

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(
      this.stemBus("boss")
    );
    oscillator.start(time);
    oscillator.stop(
      time + 0.32
    );
  }

  scheduleBuildClick(
    time,
    volume
  ) {
    const source =
      this.context.createBufferSource();
    const filter =
      this.context.createBiquadFilter();
    const gain =
      this.context.createGain();

    source.buffer =
      this.noiseBuffer;
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
    gain.connect(
      this.stemBus("drums")
    );
    source.start(time);
    source.stop(
      time + 0.03
    );
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
      runMods.fragmentCount += runMods.fragmentCount === 0 ? 3 : 1;
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

const BUILD_SYNERGIES = [
  {
    id: "pinball-engine",
    title: "PINBALL",
    requires: ["bumper", "bumper-split", "ricochet"],
    desc: "Bumper + duplicación + rebotes."
  },
  {
    id: "wallstorm",
    title: "WALLSTORM",
    requires: ["ricochet", "wall-charge", "shockwave"],
    desc: "Las paredes alimentan detonaciones AOE."
  },
  {
    id: "chain-reactor",
    title: "CHAIN REACTOR",
    requires: ["chain-relay", "fragments", "fusion"],
    desc: "Las cadenas generan materia para nuevas colisiones."
  },
  {
    id: "twin-nova",
    title: "TWIN NOVA",
    requires: ["nova", "mirror-slide"],
    desc: "Los Slides cierran con salvas simétricas."
  },
  {
    id: "needle-storm",
    title: "NEEDLE STORM",
    requires: ["twin-shot", "pierce", "fragments"],
    desc: "Más proyectiles que atraviesan y se multiplican."
  },
  {
    id: "core-breaker",
    title: "CORE BREAKER",
    requires: ["pierce", "fusion", "shockwave"],
    desc: "Build orientada a abrir y castigar objetivos duros."
  }
];

let announcedSynergies = new Set();

function upgradeById(id) {
  return UPGRADES.find(
    (upgrade) => upgrade.id === id
  ) ?? null;
}

function moduleMaxLevel(upgrade) {
  if (!upgrade) return MODULE_MAX_LEVEL;

  return [
    "wall-charge",
    "bumper-split"
  ].includes(upgrade.id)
    ? 1
    : MODULE_MAX_LEVEL;
}

function moduleLevel(id) {
  return Number(
    moduleInventory.get(id) || 0
  );
}

function activeBuildCounts() {
  const counts = new Map();

  for (const id of activeModuleIds) {
    const level =
      moduleLevel(id);

    if (level > 0) {
      counts.set(id, level);
    }
  }

  return counts;
}

function inventoryCounts() {
  return new Map(
    moduleInventory
  );
}

function buildCounts() {
  return activeBuildCounts();
}

function activeModulePower() {
  let total = 0;

  for (const id of activeModuleIds) {
    total += moduleLevel(id);
  }

  return total;
}

function activeBuildSynergies() {
  const counts =
    activeBuildCounts();

  return BUILD_SYNERGIES.filter(
    (synergy) =>
      synergy.requires.every(
        (id) => counts.has(id)
      )
  );
}

function hasActiveSynergy(id) {
  return activeBuildSynergies().some(
    (synergy) => synergy.id === id
  );
}

function simulatedActiveIdsForUpgrade(
  upgrade
) {
  const ids =
    [...activeModuleIds];

  if (
    ids.includes(upgrade.id) ||
    reserveModuleIds.includes(
      upgrade.id
    )
  ) {
    return ids;
  }

  if (
    ids.length <
    ACTIVE_MODULE_LIMIT
  ) {
    ids.push(upgrade.id);
  }

  return ids;
}

function synergyHintsForUpgrade(upgrade) {
  const current =
    new Set(
      activeBuildSynergies()
        .map(
          (synergy) => synergy.id
        )
    );
  const simulated =
    new Set(
      simulatedActiveIdsForUpgrade(
        upgrade
      )
    );

  return BUILD_SYNERGIES.filter(
    (synergy) =>
      !current.has(synergy.id) &&
      synergy.requires.every(
        (id) => simulated.has(id)
      )
  );
}

function resetModuleLoadout() {
  moduleInventory =
    new Map();
  activeModuleIds = [];
  reserveModuleIds = [];
  selectedBuildModule = null;
  runConsumables.comboShieldSpent = 0;
}

function rebuildRunMods() {
  resetRunMods();

  for (const id of activeModuleIds) {
    const upgrade =
      upgradeById(id);
    const level =
      moduleLevel(id);

    if (!upgrade || level <= 0) {
      continue;
    }

    for (
      let rank = 0;
      rank < level;
      rank += 1
    ) {
      upgrade.apply();
    }
  }

  runMods.comboShieldCharges =
    Math.max(
      0,
      runMods.comboShieldCharges -
        runConsumables.comboShieldSpent
    );
}

function acquireModule(upgrade) {
  const current =
    moduleLevel(upgrade.id);
  const maxLevel =
    moduleMaxLevel(upgrade);
  const next =
    Math.min(
      maxLevel,
      current + 1
    );

  if (next === current) {
    return {
      upgraded: false,
      active:
        activeModuleIds.includes(
          upgrade.id
        ),
      reserve:
        reserveModuleIds.includes(
          upgrade.id
        ),
      level: current
    };
  }

  moduleInventory.set(
    upgrade.id,
    next
  );

  let placement =
    "upgrade";

  if (current === 0) {
    if (
      activeModuleIds.length <
      ACTIVE_MODULE_LIMIT
    ) {
      activeModuleIds.push(
        upgrade.id
      );
      placement = "active";
    } else if (
      reserveModuleIds.length <
      RESERVE_MODULE_LIMIT
    ) {
      reserveModuleIds.push(
        upgrade.id
      );
      placement = "reserve";
    }
  }

  buildHistory.push({
    id: upgrade.id,
    title: upgrade.title,
    family: upgrade.family,
    icon: upgrade.icon,
    effect: upgrade.effect,
    desc: upgrade.desc,
    level: next,
    placement
  });

  rebuildRunMods();

  return {
    upgraded: current > 0,
    active:
      activeModuleIds.includes(
        upgrade.id
      ),
    reserve:
      reserveModuleIds.includes(
        upgrade.id
      ),
    level: next,
    placement
  };
}

function moveActiveToReserve(id) {
  if (
    !activeModuleIds.includes(id) ||
    reserveModuleIds.length >=
      RESERVE_MODULE_LIMIT
  ) {
    return false;
  }

  activeModuleIds =
    activeModuleIds.filter(
      (item) => item !== id
    );
  reserveModuleIds.push(id);
  selectedBuildModule = id;
  rebuildRunMods();
  clock.applyRunMix(0.28);
  return true;
}

function equipReserveModule(id) {
  if (
    !reserveModuleIds.includes(id) ||
    activeModuleIds.length >=
      ACTIVE_MODULE_LIMIT
  ) {
    return false;
  }

  reserveModuleIds =
    reserveModuleIds.filter(
      (item) => item !== id
    );
  activeModuleIds.push(id);
  selectedBuildModule = id;
  rebuildRunMods();
  clock.applyRunMix(0.28);
  return true;
}

function swapReserveWithActive(
  reserveId,
  activeId
) {
  const reserveIndex =
    reserveModuleIds.indexOf(
      reserveId
    );
  const activeIndex =
    activeModuleIds.indexOf(
      activeId
    );

  if (
    reserveIndex < 0 ||
    activeIndex < 0
  ) {
    return false;
  }

  reserveModuleIds[
    reserveIndex
  ] = activeId;
  activeModuleIds[
    activeIndex
  ] = reserveId;
  selectedBuildModule =
    reserveId;

  rebuildRunMods();
  clock.applyRunMix(0.28);
  return true;
}

function renderBuildVisibility({
  announce = false
} = {}) {
  const counts =
    activeBuildCounts();
  const synergies =
    activeBuildSynergies();

  buildDockItems.innerHTML = "";

  if (counts.size === 0) {
    const empty =
      document.createElement("span");
    empty.className =
      "build-empty";
    empty.textContent =
      "SIN MODS";
    buildDockItems.append(
      empty
    );
  } else {
    for (const [id, level] of counts) {
      const upgrade =
        upgradeById(id);

      if (!upgrade) continue;

      const chip =
        document.createElement("span");
      chip.className =
        `build-chip family-${upgrade.family}`;
      chip.innerHTML =
        `<span>${upgrade.icon}</span><b>LV${level}</b>`;
      chip.title =
        `${upgrade.title} · Nivel ${level}: ${upgrade.desc}`;
      buildDockItems.append(
        chip
      );
    }
  }

  const primary =
    synergies[0] ?? null;

  synergyBadge.hidden =
    !primary;

  if (primary) {
    synergyBadge.textContent =
      primary.title;
  }

  moduleSlotStatus.textContent =
    `BUILD ${activeModuleIds.length}/${ACTIVE_MODULE_LIMIT}`;

  currentSynergy.hidden =
    synergies.length === 0;
  currentSynergy.textContent =
    synergies.length
      ? `SYNERGY · ${synergies
          .map(
            (synergy) =>
              synergy.title
          )
          .join(" · ")}`
      : "";

  if (!announce) return;

  for (const synergy of synergies) {
    if (
      announcedSynergies.has(
        synergy.id
      )
    ) {
      continue;
    }

    announcedSynergies.add(
      synergy.id
    );

    showMessage(
      `SYNERGY · ${synergy.title}`,
      "#ffe56d",
      900
    );
    successTone(880);
    bumpFeedback(3.8, 0.10);
    setOperatorMood(
      "chain",
      1
    );
  }
}

function buildManagerEditable() {
  return [
    "upgrade",
    "post-upgrade"
  ].includes(
    buildPanelContext
  );
}

function moduleSlotElement(
  id,
  source,
  index
) {
  const button =
    document.createElement("button");
  button.type = "button";

  if (!id) {
    button.className =
      "loadout-slot empty";
    button.disabled = true;
    button.innerHTML =
      `<i>＋</i><strong>VACÍO</strong><small>SLOT ${index + 1}</small>`;
    return button;
  }

  const upgrade =
    upgradeById(id);
  const level =
    moduleLevel(id);

  button.className =
    `loadout-slot family-${upgrade.family}`;
  button.classList.toggle(
    "is-selected",
    selectedBuildModule === id
  );
  button.innerHTML =
    `<i>${upgrade.icon}</i><strong>${upgrade.title}</strong><small>LV${level}</small>`;

  button.addEventListener(
    "click",
    () => {
      if (
        buildManagerEditable() &&
        source === "active" &&
        selectedBuildModule &&
        reserveModuleIds.includes(
          selectedBuildModule
        )
      ) {
        swapReserveWithActive(
          selectedBuildModule,
          id
        );
        renderBuildVisibility({
          announce: true
        });
        renderBuildManager();
        return;
      }

      selectedBuildModule = id;
      renderBuildManager();
    }
  );

  return button;
}

function moduleLevelEffect(
  upgrade,
  level
) {
  switch (upgrade.id) {
    case "twin-shot":
      return `${1 + level} ORBS POR PERFECT`;
    case "ricochet":
      return `${level} REBOTE${level === 1 ? "" : "S"} POR PROYECTIL`;
    case "pierce":
      return `ATRAVIESA ${level} BLANCO${level === 1 ? "" : "S"}`;
    case "fragments":
      return `${2 + level} FRAGMENTOS POR EXPLOSIÓN`;
    case "bumper":
      return `${Math.min(level, BUMPER_LAYOUT.length)} BUMPER${level === 1 ? "" : "S"} ACTIVOS`;
    case "nova":
      return `${1 + level} POWER ORBS AL CERRAR SLIDE`;
    case "mirror-slide":
      return `${Math.min(3, level)} ORB${level === 1 ? "" : "S"} ESPEJO`;
    case "chain-relay":
      return `${Math.min(3, level)} RELEVO${level === 1 ? "" : "S"} TRAS CHAIN`;
    case "shockwave":
      return `RADIO SHOCK ${68 + level * 16}px`;
    case "fusion":
      return `FUSIÓN LV${level} · EXPLOSIÓN MAYOR`;
    case "wall-charge":
      return "IMPACTO DE PARED DETONA POWER";
    case "bumper-split":
      return "PRIMER BUMPER DUPLICA EL PROYECTIL";
    case "combo-shield":
      return `${level} CARGA${level === 1 ? "" : "S"} DE SHIELD`;
    default:
      return upgrade.effect;
  }
}

function renderBuildManager() {
  activeModuleSlots.innerHTML =
    "";
  reserveModuleSlots.innerHTML =
    "";

  for (
    let index = 0;
    index < ACTIVE_MODULE_LIMIT;
    index += 1
  ) {
    activeModuleSlots.append(
      moduleSlotElement(
        activeModuleIds[index],
        "active",
        index
      )
    );
  }

  for (
    let index = 0;
    index < RESERVE_MODULE_LIMIT;
    index += 1
  ) {
    reserveModuleSlots.append(
      moduleSlotElement(
        reserveModuleIds[index],
        "reserve",
        index
      )
    );
  }

  activeSlotCount.textContent =
    `${activeModuleIds.length} / ${ACTIVE_MODULE_LIMIT}`;
  reserveSlotCount.textContent =
    `${reserveModuleIds.length} / ${RESERVE_MODULE_LIMIT}`;

  const synergies =
    activeBuildSynergies();
  buildManagerSynergy.textContent =
    synergies.length
      ? `SYNERGY · ${synergies
          .map(
            (item) => item.title
          )
          .join(" · ")}`
      : "SIN SINERGIA ACTIVA";

  const id =
    selectedBuildModule;
  const upgrade =
    upgradeById(id);

  if (!upgrade) {
    buildManagerDetail.innerHTML =
      "<span>Selecciona un módulo para ver su función.</span>";
    return;
  }

  const level =
    moduleLevel(id);
  const active =
    activeModuleIds.includes(id);
  const reserve =
    reserveModuleIds.includes(id);
  const atMax =
    level >=
    moduleMaxLevel(upgrade);
  const action =
    document.createElement("button");

  buildManagerDetail.innerHTML =
    `<canvas class="build-detail-preview module-preview-canvas" width="260" height="110" data-module="${upgrade.id}" data-level="${level}" aria-hidden="true"></canvas><strong>${upgrade.icon} ${upgrade.title} · LV${level}${atMax ? " MAX" : ""}</strong><span>${upgrade.desc}</span><small class="build-level-effect">${moduleLevelEffect(upgrade, level)}</small><small>${active ? "ACTIVO · modifica física, sinergias y música." : "RESERVA · no modifica la run hasta equiparlo."}</small>`;

  if (!buildManagerEditable()) {
    const hint =
      document.createElement(
        "small"
      );
    hint.textContent =
      "CAMBIOS DISPONIBLES ENTRE ACTOS.";
    buildManagerDetail.append(
      hint
    );
  } else if (
    active &&
    reserveModuleIds.length <
      RESERVE_MODULE_LIMIT
  ) {
    action.textContent =
      "MOVER A RESERVA";
    action.addEventListener(
      "click",
      () => {
        moveActiveToReserve(id);
        renderBuildVisibility({
          announce: true
        });
        renderBuildManager();
      }
    );
    buildManagerDetail.append(
      action
    );
  } else if (
    reserve &&
    activeModuleIds.length <
      ACTIVE_MODULE_LIMIT
  ) {
    action.textContent =
      "EQUIPAR";
    action.addEventListener(
      "click",
      () => {
        equipReserveModule(id);
        renderBuildVisibility({
          announce: true
        });
        renderBuildManager();
      }
    );
    buildManagerDetail.append(
      action
    );
  } else if (
    reserve &&
    activeModuleIds.length >=
      ACTIVE_MODULE_LIMIT
  ) {
    const hint =
      document.createElement(
        "small"
      );
    hint.textContent =
      "Toca un módulo ACTIVO para intercambiarlo con éste.";
    buildManagerDetail.append(
      hint
    );
  }

  startModulePreviewLoop();
}

async function openBuildManager(
  context = "run"
) {
  if (
    context === "run" &&
    !running
  ) {
    return;
  }

  buildPanelContext =
    context;

  if (context === "run") {
    running = false;
    runPaused = true;
    await clock.pause();
  }

  if (context === "pause") {
    pausePanel.hidden = true;
  }

  if (
    context === "upgrade" ||
    context === "post-upgrade"
  ) {
    upgradePanel.hidden = true;
  }

  selectedBuildModule =
    activeModuleIds[0] ??
    reserveModuleIds[0] ??
    null;
  renderBuildManager();
  buildPanel.hidden = false;
}

async function closeBuildManager() {
  buildPanel.hidden = true;

  if (
    buildPanelContext ===
    "upgrade"
  ) {
    upgradePanel.hidden = false;
    startModulePreviewLoop();
    return;
  }

  if (
    buildPanelContext ===
    "post-upgrade"
  ) {
    await beginAct();
    return;
  }

  if (
    buildPanelContext ===
    "pause"
  ) {
    renderPauseBuild();
    pausePanel.hidden = false;
    return;
  }

  if (
    buildPanelContext ===
    "run" &&
    runPaused
  ) {
    await clock.resumePaused();
    runPaused = false;
    running = true;
    lastFrame =
      performance.now();
    requestAnimationFrame(
      frame
    );
  }
}


const slideControl = {
  left: {
    held: false,
    x: 0,
    y: 0
  },
  right: {
    held: false,
    x: 0,
    y: 0
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

function stemMidiNearBeat(
  beat,
  stem
) {
  const field =
    stem === "aura"
      ? "auraMidi"
      : stem === "bass"
        ? "bassMidi"
        : stem === "boss"
          ? "bossMidi"
          : "leadMidi";
  const offsets =
    [0, -0.5, 0.5, -1, 1];

  for (const offset of offsets) {
    const frame =
      songFrameAtBeat(
        beat + offset
      );
    const value =
      frame[field];

    if (
      Number.isFinite(value)
    ) {
      return value;
    }
  }

  return null;
}

function buildMusicalSlideAnchors(
  event
) {
  const stem =
    event.music?.stem === "aura"
      ? "aura"
      : "lead";
  const energy =
    clamp(
      Number(
        event.music?.energy ?? 0.6
      ),
      0,
      1
    );
  const sampleBeats = [];
  const pitches = [];

  for (
    let relative = 0;
    relative <
      event.durationBeats;
    relative += 1
  ) {
    sampleBeats.push(relative);
  }

  if (
    sampleBeats.at(-1) !==
    event.durationBeats
  ) {
    sampleBeats.push(
      event.durationBeats
    );
  }

  for (
    const relative of
    sampleBeats
  ) {
    pitches.push(
      stemMidiNearBeat(
        event.beat + relative,
        stem
      )
    );
  }

  const finite =
    pitches.filter(
      Number.isFinite
    );
  const fallback =
    finite[0] ?? 60;
  const filled =
    pitches.map(
      (pitch, index) => {
        if (
          Number.isFinite(pitch)
        ) {
          return pitch;
        }

        for (
          let distance = 1;
          distance <
            pitches.length;
          distance += 1
        ) {
          const before =
            pitches[
              index - distance
            ];
          const after =
            pitches[
              index + distance
            ];

          if (
            Number.isFinite(before)
          ) {
            return before;
          }

          if (
            Number.isFinite(after)
          ) {
            return after;
          }
        }

        return fallback;
      }
    );
  const low =
    Math.min(...filled);
  const high =
    Math.max(...filled);
  const span =
    Math.max(
      1,
      high - low
    );

  return sampleBeats.map(
    (relative, index) => {
      const normalized =
        (filled[index] - low) /
        span;
      const leftLow =
        -2.42;
      const leftHigh =
        -0.72;
      const angle =
        event.side === "left"
          ? lerp(
              leftLow,
              leftHigh,
              normalized
            )
          : lerp(
              -Math.PI -
                leftLow,
              -Math.PI -
                leftHigh,
              normalized
            );
      const phrasePulse =
        Math.sin(
          (
            relative /
            Math.max(
              1,
              event.durationBeats
            )
          ) *
            Math.PI
        );
      const reach =
        clamp(
          0.90 +
            energy * 0.055 +
            phrasePulse * 0.025,
          0.88,
          1.02
        );

      return {
        beat: relative,
        x:
          Math.cos(angle) *
          reach,
        y:
          Math.sin(angle) *
          reach
      };
    }
  );
}

function eventMusicEnergy(event) {
  return clamp(
    Number(
      event?.music?.energy ?? 0.5
    ),
    0,
    1
  );
}

function musicalRouteForEvent(event) {
  if (
    !event ||
    event.type !== "tap"
  ) {
    return Number(
      event?.route ?? 0
    );
  }

  const stem =
    event.music?.stem;
  const intent =
    event.music?.intent;
  const energy =
    eventMusicEnergy(event);

  if (
    [
      "fill",
      "climax"
    ].includes(intent)
  ) {
    return 2;
  }

  if (
    intent ===
    "syncopation"
  ) {
    return energy >= 0.72
      ? 2
      : 1;
  }

  if (
    [
      "response",
      "pickup",
      "resolve"
    ].includes(intent)
  ) {
    return 1;
  }

  if (stem === "drums") {
    return 0;
  }

  if (stem === "bass") {
    return energy >= 0.72
      ? 1
      : 0;
  }

  if (
    stem === "lead" ||
    stem === "aura"
  ) {
    const pitch =
      stemMidiNearBeat(
        event.beat,
        stem
      );

    if (
      Number.isFinite(pitch)
    ) {
      if (pitch >= 72) {
        return 2;
      }

      if (pitch >= 62) {
        return 1;
      }

      return 0;
    }
  }

  if (stem === "boss") {
    return 2;
  }

  return Number(
    event.route ?? 0
  );
}

async function ensureChartLoaded() {
  if (chartLoaded) return;

  const chartUrl = new URL("../charts/tap-lab.json?v=0.32", import.meta.url);
  const chart = await loadGameChart(chartUrl);

  BPM = chart.bpm;
  LOOP_BEATS = chart.loopBeats;
  COUNT_IN_BEATS = chart.countInBeats;

  if (
    BPM !== AURA_SONG.bpm ||
    LOOP_BEATS !== AURA_SONG.beats
  ) {
    throw new Error(
      `Track/chart mismatch: ${AURA_SONG.title} expects ${AURA_SONG.bpm} BPM / ${AURA_SONG.beats} beats.`
    );
  }

  CHART =
    chart.events.map(
      (event) => {
        if (
          event.type === "slide" &&
          event.music?.contour
        ) {
          return {
            ...event,
            anchors:
              buildMusicalSlideAnchors(
                event
              )
          };
        }

        if (
          event.type === "tap"
        ) {
          return {
            ...event,
            route:
              musicalRouteForEvent(
                event
              )
          };
        }

        return event;
      }
    );
  chartName =
    `${chart.name || "Mechanics chart"} · ${AURA_SONG.title}`;
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
          vy: 0,
          radiusScale:
            clamp(
              0.95 +
                eventMusicEnergy(
                  event
                ) *
                  0.10,
              0.95,
              1.05
            ),        });
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
          mode: "trace",
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
  gain.connect(
    clock.sfxBus()
  );

  oscillator.start(now);
  oscillator.stop(now + duration + 0.01);
}

function hitSound(
  side,
  judgement,
  note = null
) {
  const music =
    note?.music;
  const frame =
    note
      ? songFrameAtBeat(
          note.beat
        )
      : null;
  let frequency =
    side === "left"
      ? 480
      : 540;
  let type =
    "triangle";

  if (music?.stem === "bass") {
    frequency =
      Number.isFinite(
        frame?.bassMidi
      )
        ? midiToHz(
            frame.bassMidi + 12
          )
        : 220;
    type = "sine";
  } else if (
    music?.stem === "lead"
  ) {
    frequency =
      Number.isFinite(
        frame?.leadMidi
      )
        ? midiToHz(
            frame.leadMidi
          )
        : 620;
    type = "triangle";
  } else if (
    music?.stem === "aura"
  ) {
    frequency =
      Number.isFinite(
        frame?.auraMidi
      )
        ? midiToHz(
            frame.auraMidi
          )
        : 760;
    type = "sine";
  } else if (
    music?.stem === "boss"
  ) {
    frequency =
      Number.isFinite(
        frame?.bossMidi
      )
        ? midiToHz(
            frame.bossMidi + 12
          )
        : 330;
    type = "square";
  } else if (
    music?.intent ===
      "backbeat"
  ) {
    frequency = 560;
  }

  playTone(
    frequency,
    0.052 +
      eventMusicEnergy(
        note
      ) *
        0.022,
    0.052 +
      eventMusicEnergy(
        note
      ) *
        0.032,
    type
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

function moduleInstallSound() {
  playTone(
    330,
    0.055,
    0.035,
    "triangle"
  );

  window.setTimeout(
    () => playTone(
      495,
      0.065,
      0.04,
      "triangle"
    ),
    55
  );

  window.setTimeout(
    () => playTone(
      660,
      0.09,
      0.045,
      "sine"
    ),
    110
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
    inheritMods = true,
    bonusRicochets = 0
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
    (
      inheritMods
        ? runMods.ricochetBounces
        : 0
    ) +
    Math.max(
      0,
      bonusRicochets
    );
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
  inheritMods = true,
  bonusRicochets = 0
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
      inheritMods,
      bonusRicochets
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
  const musicEnergy =
    eventMusicEnergy(note);

  bumpFeedback(
    (
      combo >= 12
        ? 2.7
        : 1.35
    ) +
      musicEnergy * 0.85,
    (
      combo >= 12
        ? 0.085
        : 0.035
    ) +
      musicEnergy * 0.026
  );
  setOperatorMood(
    combo >= 12
      ? "flow"
      : "hit",
    0.30 +
      musicEnergy * 0.30
  );
  setOperatorLean(
    side,
    combo >= 12
      ? 1
      : 0.72
  );

  showMessage(
    shotCount > 1 ? `PERFECT · ×${shotCount}` : "PERFECT",
    JUDGEMENTS.perfect.color,
    shotCount > 1 ? 480 : 360
  );
  hitSound(
    side,
    JUDGEMENTS.perfect,
    note
  );

  if (navigator.vibrate) {
    navigator.vibrate(
      Math.round(
        5 +
        musicEnergy * 7
      )
    );
  }

  updateHud();
  return true;
}

function failEvent(event, label = "MISS") {
  const protectedCombo =
    combo > 0 && runMods.comboShieldCharges > 0;

  if (protectedCombo) {
    runMods.comboShieldCharges -= 1;
    runConsumables.comboShieldSpent += 1;
  } else {
    combo = 0;
  }

  missCount += 1;
  lastDeltaMs = null;
  lastJudgement = label;

  active.delete(event.key);
  resolved.add(event.key);

  setOperatorMood(
    protectedCombo
      ? "shield"
      : "miss",
    0.7
  );
  bumpFeedback(
    protectedCombo ? 1.5 : 2.2,
    protectedCombo ? 0.035 : 0.07
  );

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
  const shockRadius =
    scale > 1.2 &&
    runMods.shockwave > 0
      ? 68 +
        runMods.shockwave * 16
      : 0;
  const fusionBurst =
    scale >= 1.80;

  explosions.push({
    x,
    y,
    scale,
    shockRadius,
    fusionBurst,
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
  bumpFeedback(
    Math.min(5.8, 0.9 + scale * 1.55),
    Math.min(0.13, 0.018 + scale * 0.026)
  );

  if (scale > 1.2) {
    playTone(105, 0.09, 0.045, "sine");
  }

  if (shockRadius > 0) {
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
        bumpFeedback(
          Math.min(
            5.5,
            2.2 + chainCount * 0.35
          ),
          Math.min(
            0.16,
            0.055 + chainCount * 0.012
          )
        );
        setOperatorMood(
          "chain",
          0.8
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

function bossArmorNodes(songTime) {
  const center =
    bossCenter();
  const phaseSpeed =
    bossState.phase === 1
      ? 0.68
      : 0.94;
  const orbitRadius =
    bossState.phase === 1
      ? 92
      : 102;
  const baseAngle =
    songTime * phaseSpeed;

  return bossState.armor.map(
    (broken, index) => {
      const angle =
        baseAngle +
        index *
          (Math.PI * 2 / 3);

      return {
        index,
        broken,
        angle,
        radius: 17,
        x:
          center.x +
          Math.cos(angle) *
            orbitRadius,
        y:
          center.y +
          Math.sin(angle) *
            orbitRadius
      };
    }
  );
}

function bossArmorRemaining() {
  return bossState.armor.filter(
    (broken) => !broken
  ).length;
}

function bossShielded() {
  return (
    bossState.active &&
    !bossState.broken &&
    bossArmorRemaining() > 0
  );
}

function reflectProjectileFromCircle(
  projectile,
  center,
  limit
) {
  const dx =
    projectile.x - center.x;
  const dy =
    projectile.y - center.y;
  const distance =
    Math.hypot(dx, dy) || 1;
  const nx = dx / distance;
  const ny = dy / distance;
  const dot =
    projectile.vx * nx +
    projectile.vy * ny;

  projectile.vx -=
    2 * dot * nx;
  projectile.vy -=
    2 * dot * ny;

  projectile.x =
    center.x +
    nx * (limit + 1);
  projectile.y =
    center.y +
    ny * (limit + 1);
  projectile.prevX =
    projectile.x;
  projectile.prevY =
    projectile.y;
}

function resolveBossCollisions(songTime) {
  if (
    !bossState.active ||
    bossState.broken
  ) {
    return;
  }

  const center =
    bossCenter();
  const coreRadius = 58;
  const nodes =
    bossArmorNodes(songTime);

  for (const projectile of [...active.values()]) {
    if (
      projectile.type !== "tap" ||
      !projectile.launched
    ) {
      continue;
    }

    let armorHit = false;

    for (const node of nodes) {
      if (node.broken) continue;

      const distance =
        Math.hypot(
          projectile.x - node.x,
          projectile.y - node.y
        );

      if (
        distance >
        node.radius +
          noteRadius(projectile)
      ) {
        continue;
      }

      bossState.armor[node.index] =
        true;
      active.delete(
        projectile.key
      );
      armorHit = true;

      createExplosion(
        node.x,
        node.y,
        projectile.power
          ? 1.55
          : 1.12,
        {
          emitFragments:
            !projectile.fragment,
          side: projectile.side
        }
      );
      awardScore(
        projectile.power
          ? 450
          : 275
      );
      bumpFeedback(
        projectile.power
          ? 5.2
          : 3.4,
        projectile.power
          ? 0.15
          : 0.09
      );
      setOperatorMood(
        "boss",
        1
      );

      const remaining =
        bossArmorRemaining();

      showMessage(
        remaining === 0
          ? "ARMOR BREAK · CORE EXPOSED"
          : `ARMOR -1 · ${remaining} RESTAN`,
        "#ffdf85",
        remaining === 0
          ? 900
          : 480
      );

      if (navigator.vibrate) {
        navigator.vibrate(
          remaining === 0
            ? [10, 20, 16]
            : 9
        );
      }

      break;
    }

    if (armorHit) continue;

    const distance =
      Math.hypot(
        projectile.x - center.x,
        projectile.y - center.y
      );
    const limit =
      coreRadius +
      noteRadius(projectile);

    if (distance > limit) {
      continue;
    }

    if (bossShielded()) {
      reflectProjectileFromCircle(
        projectile,
        center,
        limit
      );
      bossState.shieldFlash =
        0.18;
      bumpFeedback(
        2.4,
        0.055
      );
      playTone(
        190,
        0.055,
        0.04,
        "square"
      );
      showMessage(
        "CORE SHIELDED",
        "#8ee8ff",
        280
      );
      continue;
    }

    const damage =
      projectile.power
        ? 3
        : 1;

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
      projectile.power
        ? 1.75
        : 1.2,
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
    setOperatorMood(
      "boss",
      0.85
    );

    if (navigator.vibrate) {
      navigator.vibrate(
        projectile.power
          ? [10, 18, 14]
          : 7
      );
    }

    if (
      bossState.health <=
        bossState.maxHealth / 2 &&
      !bossState.recharged &&
      bossState.health > 0
    ) {
      bossState.phase = 2;
      bossState.recharged = true;
      bossState.armor =
        [false, false, false];
      bossState.shieldFlash =
        0.32;
      clock.applyRunMix(
        0.22
      );

      showMessage(
        "PHASE 2 · ARMOR REBOOT",
        "#ff9fd0",
        1000
      );
      playTone(
        330,
        0.16,
        0.055,
        "sawtooth"
      );
      bumpFeedback(
        6.2,
        0.18
      );

      if (navigator.vibrate) {
        navigator.vibrate(
          [14, 24, 14, 24, 18]
        );
      }
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
      setOperatorMood(
        "victory",
        1.3
      );
      bumpFeedback(
        8.5,
        0.28
      );

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

    if (runMods.bumperSplit > 0) {
      const pulse =
        0.5 +
        0.5 *
          Math.sin(
            performance.now() /
            150 +
            bumper.x
          );

      ctx.strokeStyle =
        `rgba(82,224,207,${0.48 + pulse * 0.30})`;
      ctx.lineWidth = 2.5;

      for (const sign of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(
          bumper.x +
            sign *
              (
                bumper.radius +
                7
              ),
          bumper.y,
          4 + pulse * 1.5,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      ctx.fillStyle =
        "rgba(82,224,207,.72)";
      ctx.font =
        "900 9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "×2",
        bumper.x,
        bumper.y +
          bumper.radius +
          13
      );
    }

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
function slideMode() {
  return "trace";
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
  return Boolean(
    event.traceHeld
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

function beginSlide(event, side, songTime) {
  if (event.started) return;

  event.started = true;
  event.startDelta =
    songTime - event.targetTime;
  event.lastGoodTime = songTime;

  if (runStats) {
    runStats.traceAttempts += 1;
  }

  recordLifetimeMetric(
    "traceAttempts",
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
    "SLIDE · ARRASTRA POR EL RIEL",
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

function slideRewardAngle(
  point,
  side,
  laneOffset = 0
) {
  const target = {
    x:
      DESIGN.width / 2 +
      (
        side === "left"
          ? 52
          : -52
      ) +
      laneOffset,
    y: 150
  };

  return Math.atan2(
    target.y - point.y,
    target.x - point.x
  );
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
    1 + runMods.slideNova;
  const baseAngle =
    slideRewardAngle(
      point,
      event.side
    );
  const angles =
    fanAngles(
      baseAngle,
      shotCount,
      0.16
    );

  for (const angle of angles) {
    spawnLaunchedProjectile({
      x: point.x,
      y: point.y,
      angle,
      side: event.side,
      symbol: "★",
      power: true,
      radiusScale: POWER_ORB_BASE_SCALE,
      speed: POWER_ORB_SPEED,
      inheritMods: true,
      bonusRicochets:
        POWER_ORB_BONUS_RICOCHETS
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
      Math.min(
        3,
        runMods.slideMirror
      );
    const mirrorBase =
      slideRewardAngle(
        mirrorSegment.tip,
        mirrorSide
      );

    for (
      const angle of
      fanAngles(
        mirrorBase,
        mirrorCount,
        0.14
      )
    ) {
      spawnLaunchedProjectile({
        x: mirrorSegment.tip.x,
        y: mirrorSegment.tip.y,
        angle,
        side: mirrorSide,
        symbol: "◇",
        power: true,
        radiusScale:
          POWER_ORB_BASE_SCALE *
          0.88,
        speed:
          POWER_ORB_SPEED,
        inheritMods: true,
        bonusRicochets:
          POWER_ORB_BONUS_RICOCHETS
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

  if (runStats) {
    runStats.traceSuccess += 1;
  }

  recordLifetimeMetric(
    "traceSuccess",
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

  bumpFeedback(3.5, 0.10);
  setOperatorMood(
    "slide",
    0.9
  );
  setOperatorLean(
    event.side,
    1.12
  );

  showMessage(
    "SLIDE PERFECT · POWER RETURN",
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

  // One subtle playable corridor. It communicates judgement without becoming decoration.
  ctx.strokeStyle =
    connected
      ? "rgba(255,241,169,.12)"
      : `rgba(${sideColor},.09)`;
  ctx.lineWidth =
    slideTolerance() * 2;
  traceSlideRail(points);
  ctx.stroke();

  // Single dark rail body.
  ctx.strokeStyle =
    "rgba(7,11,18,.90)";
  ctx.lineWidth = 18;
  traceSlideRail(points);
  ctx.stroke();

  // Functional colored edge.
  ctx.shadowBlur =
    connected ? 10 : 4;
  ctx.shadowColor =
    connected
      ? "#fff1a9"
      : `rgba(${sideColor},.60)`;
  ctx.strokeStyle =
    connected
      ? "rgba(255,241,169,.92)"
      : `rgba(${sideColor},.78)`;
  ctx.lineWidth = 8;
  traceSlideRail(points);
  ctx.stroke();

  // Thin white core gives clean musical continuity.
  ctx.shadowBlur = 0;
  ctx.strokeStyle =
    connected
      ? "rgba(255,255,240,.88)"
      : "rgba(238,244,255,.54)";
  ctx.lineWidth = 2;
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

function drawSlideFretPlate(
  event,
  beat,
  alpha = 1,
  anchor = false
) {
  const point =
    slideRailPoint(
      event,
      beat
    );
  const tangent =
    slideRailTangent(
      event,
      beat
    );
  const sideColor =
    event.side === "left"
      ? "110,215,255"
      : "216,139,255";

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(
    point.x,
    point.y
  );
  ctx.rotate(tangent);

  // A fret is one clean crossbar, not another node.
  ctx.strokeStyle =
    anchor
      ? "rgba(255,255,255,.78)"
      : `rgba(${sideColor},.58)`;
  ctx.lineWidth =
    anchor ? 3 : 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(
    0,
    anchor ? -17 : -14
  );
  ctx.lineTo(
    0,
    anchor ? 17 : 14
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
    Math.ceil(
      startBeat /
      SLIDE.nodeBeats
    ) *
    SLIDE.nodeBeats;

  for (
    let beat = first;
    beat <= endBeat + 0.001;
    beat += SLIDE.nodeBeats
  ) {
    const fullBeat =
      Math.abs(
        beat -
        Math.round(beat)
      ) < 0.02;
    const anchor =
      event.anchors.some(
        (item) =>
          Math.abs(
            item.beat - beat
          ) < 0.02
      );

    if (fullBeat) {
      drawSlideFretPlate(
        event,
        beat,
        alpha *
          (
            anchor
              ? 0.92
              : 0.72
          ),
        anchor
      );
      continue;
    }

    const point =
      slideRailPoint(
        event,
        beat
      );
    const sideColor =
      event.side === "left"
        ? "110,215,255"
        : "216,139,255";

    ctx.save();
    ctx.globalAlpha =
      alpha * 0.40;
    ctx.fillStyle =
      `rgba(${sideColor},.78)`;
    ctx.beginPath();
    ctx.arc(
      point.x,
      point.y,
      2.2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
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
    slideRailPoint(
      event,
      beat
    );
  const tangent =
    slideRailTangent(
      event,
      beat
    );
  const sideColor =
    event.side === "left"
      ? "110,215,255"
      : "216,139,255";

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(
    point.x,
    point.y
  );
  ctx.rotate(tangent);

  // Thin outer tolerance ring = actual judgement geometry.
  ctx.strokeStyle =
    connected
      ? "rgba(255,241,169,.40)"
      : `rgba(${sideColor},.28)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    slideTolerance(),
    0,
    Math.PI * 2
  );
  ctx.stroke();

  // One bright crossbar marks the exact current target.
  ctx.shadowBlur =
    connected ? 14 : 5;
  ctx.shadowColor =
    connected
      ? "#fff1a9"
      : `rgba(${sideColor},.70)`;
  ctx.strokeStyle =
    connected
      ? "#fff1a9"
      : `rgba(${sideColor},.90)`;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 16);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle =
    connected
      ? "#fff1a9"
      : `rgb(${sideColor})`;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    connected ? 5 : 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
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
  ctx.translate(
    head.x,
    head.y
  );

  ctx.shadowBlur = 8;
  ctx.shadowColor = sideColor;
  ctx.fillStyle =
    "rgba(7,11,18,.94)";
  ctx.strokeStyle =
    sideColor;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(
    0,
    0,
    19,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = sideColor;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    6,
    0,
    Math.PI * 2
  );
  ctx.fill();

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
      "rgba(216,139,255,.18)";
    ctx.lineWidth = 7;
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

    // When the head gets close, visually join it to the rope.
    const startDistance =
      Math.hypot(
        head.x - startPoint.x,
        head.y - startPoint.y
      );

    if (startDistance < 220) {
      ctx.strokeStyle =
        "rgba(216,139,255,.24)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 9]);
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

  drawSlideCatcher(
    event,
    currentBeat,
    connected,
    1
  );

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
  bossState.shieldFlash =
    Math.max(
      0,
      bossState.shieldFlash - dt
    );

  screenShake =
    Math.max(
      0,
      screenShake - dt * 17
    );
  impactVeil =
    Math.max(
      0,
      impactVeil - dt * 2.8
    );
  operatorPulse =
    Math.max(
      0,
      operatorPulse - dt * 1.9
    );
  operatorLean *=
    Math.max(
      0,
      1 - dt * 7.5
    );

  if (
    operatorPulse <= 0 &&
    combo < 8
  ) {
    operatorMood = "idle";
  }

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
    String(combo);
  comboMultEl.textContent =
    `×${comboMultiplier(combo)}`;
  topbarEl.classList.toggle(
    "is-flow",
    combo >= 10
  );
  actEl.textContent =
    `${Math.min(wave, runTargetActs())}/${runTargetActs()}`;

  lastHitEl.textContent =
    lastDeltaMs === null
      ? lastJudgement
      : `${lastJudgement} ${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`;
}

let lastHudSection = "";
let lastHudProgressBucket = -1;

function updateLiveHud(songTime) {
  if (!chartLoaded) return;

  const beat =
    songTime /
    (60 / BPM);
  const frame =
    songFrameAtBeat(
      Math.max(0, beat)
    );
  const section =
    frame.section;
  const progress =
    clamp(
      beat /
        Math.max(
          1,
          LOOP_BEATS
        ),
      0,
      1
    );
  const bucket =
    Math.round(
      progress * 200
    );

  if (
    section !==
    lastHudSection
  ) {
    lastHudSection =
      section;
    trackSectionEl.textContent =
      section;
  }

  if (
    bucket !==
    lastHudProgressBucket
  ) {
    lastHudProgressBucket =
      bucket;
    trackProgressEl.style.width =
      `${progress * 100}%`;
  }
}

function worldMusicResponse() {
  const beat =
    Math.max(
      0,
      clock.songTime /
        beatToSeconds(1)
    );
  const step =
    Math.round(
      beat * 2
    ) / 2;
  const distance =
    Math.abs(
      beat - step
    );
  const envelope =
    clamp(
      1 -
        distance / 0.18,
      0,
      1
    );
  const frame =
    songFrameAtBeat(
      step
    );

  return {
    kick:
      frame.kick
        ? envelope
        : 0,
    snare:
      frame.snare
        ? envelope
        : 0,
    lead:
      Number.isFinite(
        frame.leadMidi
      )
        ? envelope
        : 0,
    aura:
      Number.isFinite(
        frame.auraMidi
      )
        ? envelope
        : 0
  };
}

function drawBackground() {
  const palette =
    machinePalette();
  const act =
    currentActMeta();
  const intensity =
    act.intensity;
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
  const musicResponse =
    worldMusicResponse();

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
    `rgba(${ar},${ag},${ab},${0.030 + intensity * 0.050 + pulse * 0.014 + musicResponse.kick * 0.038})`
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

  drawWorldAsset(
    WORLD_ASSETS.far,
    0.62
  );
  drawWorldAsset(
    WORLD_ASSETS.mid,
    0.42
  );

  // Chassis rails.
  ctx.strokeStyle =
    `rgba(${ar},${ag},${ab},${0.08 + intensity * 0.10 + musicResponse.kick * 0.12 + musicResponse.snare * 0.05})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 105);
  ctx.lineTo(28, 820);
  ctx.lineTo(105, 905);
  ctx.moveTo(512, 105);
  ctx.lineTo(512, 820);
  ctx.lineTo(435, 905);
  ctx.stroke();

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


  // Each act physically lights another cell in the chassis.
  for (let index = 0; index < RUN_ACTS; index += 1) {
    const lit =
      index < wave;
    const y =
      166 + index * 82;

    for (const x of [23, 517]) {
      ctx.fillStyle =
        lit
          ? `rgba(${ar},${ag},${ab},${0.26 + intensity * 0.28})`
          : "rgba(255,255,255,.035)";
      ctx.beginPath();
      ctx.roundRect(
        x - 6,
        y - 12,
        12,
        24,
        5
      );
      ctx.fill();
    }
  }

  // More circuitry wakes up as the run escalates.
  ctx.save();
  ctx.strokeStyle =
    `rgba(${sr},${sg},${sb},${0.030 + intensity * 0.085 + musicResponse.lead * 0.07})`;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";

  for (let lane = 0; lane < wave; lane += 1) {
    const phase =
      clock.songTime *
        (0.35 + lane * 0.025) +
      lane;
    const y =
      245 + lane * 54;
    const offset =
      Math.sin(phase) *
      (18 + lane * 2);

    ctx.beginPath();
    ctx.moveTo(
      96,
      y
    );
    ctx.bezierCurveTo(
      175 + offset,
      y - 18,
      365 - offset,
      y + 18,
      444,
      y
    );
    ctx.stroke();
  }

  ctx.restore();

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


  // Growth conduits: small bio-electric leaves appear as the machine wakes.
  for (let index = 0; index < wave; index += 1) {
    const y =
      205 + index * 72;
    const side =
      index % 2 === 0
        ? -1
        : 1;
    const x =
      side < 0 ? 54 : 486;

    ctx.strokeStyle =
      `rgba(${ar},${ag},${ab},${0.11 + intensity * 0.09 + musicResponse.aura * 0.12})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + 12);
    ctx.quadraticCurveTo(
      x - side * 13,
      y,
      x - side * 7,
      y - 15
    );
    ctx.stroke();

    ctx.fillStyle =
      `rgba(${ar},${ag},${ab},${0.15 + intensity * 0.12 + musicResponse.aura * 0.18})`;
    ctx.beginPath();
    ctx.ellipse(
      x - side * 10,
      y - 7,
      5,
      2.4,
      side * 0.55,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
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
    bossState.hitFlash > 0;
  const shielded =
    bossShielded();
  const armorNodes =
    bossArmorNodes(songTime);

  // Energy tethers make the armor read as one coherent system.
  if (!bossState.broken) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 7]);

    for (const node of armorNodes) {
      if (node.broken) continue;

      ctx.strokeStyle =
        `rgba(${palette.secondary.join(",")},.32)`;
      ctx.beginPath();
      ctx.moveTo(
        center.x,
        center.y
      );
      ctx.lineTo(
        node.x,
        node.y
      );
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(
    center.x,
    center.y
  );

  if (shielded) {
    ctx.shadowBlur =
      16 +
      beatPulse * 12;
    ctx.shadowColor =
      `rgb(${palette.secondary.join(",")})`;
    ctx.strokeStyle =
      bossState.shieldFlash > 0
        ? "#e9ffff"
        : `rgba(${palette.secondary.join(",")},.72)`;
    ctx.lineWidth =
      bossState.shieldFlash > 0
        ? 7
        : 4;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      69 + beatPulse * 3,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

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
      songTime *
        (bossState.phase === 1
          ? 0.22
          : -0.34);

    ctx.strokeStyle =
      bossState.phase === 1
        ? "rgba(255,255,255,.18)"
        : "rgba(255,145,190,.28)";
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

  // Physical armor nodes.
  for (const node of armorNodes) {
    ctx.save();
    ctx.translate(
      node.x,
      node.y
    );

    if (node.broken) {
      ctx.globalAlpha = 0.18;
    }

    ctx.rotate(
      node.angle +
      Math.PI / 2
    );

    ctx.shadowBlur =
      node.broken ? 0 : 18;
    ctx.shadowColor =
      `rgb(${palette.secondary.join(",")})`;
    ctx.fillStyle =
      node.broken
        ? "rgba(55,66,78,.45)"
        : "#111b27";
    ctx.strokeStyle =
      node.broken
        ? "rgba(255,255,255,.12)"
        : `rgb(${palette.secondary.join(",")})`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(15, 11);
    ctx.lineTo(-15, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle =
      node.broken
        ? "rgba(255,255,255,.12)"
        : `rgb(${palette.accent.join(",")})`;
    ctx.beginPath();
    ctx.arc(
      0,
      2,
      5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  }

  ctx.fillStyle =
    "rgba(5,8,14,.82)";
  ctx.fillRect(
    180,
    250,
    180,
    16
  );

  ctx.fillStyle =
    bossState.broken
      ? "#ff637d"
      : `rgb(${palette.accent.join(",")})`;
  ctx.fillRect(
    183,
    253,
    174 * healthRatio,
    10
  );

  ctx.fillStyle =
    "rgba(255,255,255,.68)";
  ctx.font =
    "900 10px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    bossState.broken
      ? "CORE BREAK"
      : shielded
        ? `PHASE ${bossState.phase} · ARMOR ${bossArmorRemaining()}`
        : `PHASE ${bossState.phase} · CORE EXPOSED`,
    DESIGN.width / 2,
    280
  );
}

function drawOperatorSocket(songTime) {
  const palette =
    machinePalette();
  const act =
    currentActMeta();
  const pulse =
    1 +
    operatorPulse * 0.075;
  const x =
    DESIGN.width / 2;
  const y = 858;
  const comboFlow =
    combo >= 8;
  const mood =
    comboFlow &&
    operatorMood === "idle"
      ? "flow"
      : operatorMood;
  const beat =
    0.5 +
    0.5 *
      Math.sin(
        songTime *
        BPM /
        60 *
        Math.PI *
        2
      );

  ctx.save();
  ctx.translate(
    x + operatorLean * 3.2,
    y
  );
  ctx.rotate(
    operatorLean *
    0.035 *
    (
      0.35 +
      operatorPulse
    )
  );
  ctx.scale(pulse, pulse);

  // Central cockpit: AURI lives between the two thumbs, outside the playfield.
  ctx.shadowBlur =
    operatorPulse > 0
      ? 20
      : 8;
  ctx.shadowColor =
    `rgb(${palette.secondary.join(",")})`;
  ctx.fillStyle =
    "rgba(7,12,20,.94)";
  ctx.strokeStyle =
    `rgba(${palette.secondary.join(",")},.50)`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(
    -34,
    -29,
    68,
    50,
    16
  );
  ctx.fill();
  ctx.stroke();

  if (runMods.comboShieldCharges > 0) {
    const shieldPulse =
      0.5 +
      0.5 *
        Math.sin(
          songTime *
          4.8
        );
    const charges =
      Math.min(
        4,
        runMods.comboShieldCharges
      );

    ctx.shadowBlur =
      12 + shieldPulse * 8;
    ctx.shadowColor =
      `rgb(${palette.secondary.join(",")})`;
    ctx.strokeStyle =
      `rgba(${palette.secondary.join(",")},${0.36 + shieldPulse * 0.25})`;
    ctx.lineWidth = 2.2;

    for (
      let charge = 0;
      charge < charges;
      charge += 1
    ) {
      const start =
        -Math.PI / 2 +
        charge *
          (Math.PI * 2 / charges);
      const end =
        start +
        Math.PI * 1.22 /
          charges;

      ctx.beginPath();
      ctx.arc(
        0,
        -3,
        39 + charge * 1.8,
        start,
        end
      );
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  // Side headset pods give AURI a stable readable silhouette.
  ctx.shadowBlur = 0;
  for (const sign of [-1, 1]) {
    ctx.fillStyle = "#172332";
    ctx.strokeStyle =
      `rgba(${palette.accent.join(",")},.70)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      sign * 22,
      -5,
      8,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle =
      `rgba(${palette.accent.join(",")},.72)`;
    ctx.beginPath();
    ctx.arc(
      sign * 22,
      -5,
      2.7,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Hood / helmet.
  const hood =
    ctx.createLinearGradient(
      0,
      -29,
      0,
      15
    );
  hood.addColorStop(
    0,
    "#334557"
  );
  hood.addColorStop(
    0.55,
    "#1b2938"
  );
  hood.addColorStop(
    1,
    "#0f1824"
  );

  ctx.fillStyle = hood;
  ctx.strokeStyle =
    `rgb(${palette.accent.join(",")})`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-18, 8);
  ctx.quadraticCurveTo(
    -22,
    -10,
    -13,
    -22
  );
  ctx.quadraticCurveTo(
    0,
    -31,
    13,
    -22
  );
  ctx.quadraticCurveTo(
    22,
    -10,
    18,
    8
  );
  ctx.quadraticCurveTo(
    0,
    18,
    -18,
    8
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Visor.
  ctx.fillStyle =
    mood === "miss"
      ? "rgba(70,20,30,.92)"
      : "rgba(8,18,29,.94)";
  ctx.strokeStyle =
    mood === "boss"
      ? "#ff9dc5"
      : `rgba(${palette.secondary.join(",")},.88)`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(
    -13,
    -16,
    26,
    17,
    7
  );
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(
    -13,
    -16,
    26,
    17,
    7
  );
  ctx.clip();

  const visorGlow =
    ctx.createLinearGradient(
      -13,
      -16,
      13,
      1
    );
  visorGlow.addColorStop(
    0,
    `rgba(${palette.secondary.join(",")},.03)`
  );
  visorGlow.addColorStop(
    0.5,
    `rgba(${palette.secondary.join(",")},${0.10 + beat * 0.08})`
  );
  visorGlow.addColorStop(
    1,
    `rgba(${palette.accent.join(",")},.05)`
  );
  ctx.fillStyle = visorGlow;
  ctx.fillRect(
    -13,
    -16,
    26,
    17
  );

  const eyeColor =
    mood === "miss"
      ? "#ff7c91"
      : mood === "victory"
        ? "#fff1a9"
        : `rgb(${palette.secondary.join(",")})`;

  ctx.strokeStyle = eyeColor;
  ctx.fillStyle = eyeColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  if (mood === "miss") {
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(
        sign * 7 - 2,
        -9
      );
      ctx.lineTo(
        sign * 7 + 2,
        -6
      );
      ctx.stroke();
    }
  } else if (
    mood === "chain" ||
    mood === "victory"
  ) {
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        sign * 6,
        -8,
        3.5,
        Math.PI,
        Math.PI * 2
      );
      ctx.stroke();
    }
  } else if (mood === "flow") {
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(
        sign * 8,
        -8
      );
      ctx.lineTo(
        sign * 4,
        -8
      );
      ctx.stroke();
    }
  } else {
    const radius =
      mood === "boss" ||
      mood === "slide"
        ? 2.8
        : 2.1;

    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        sign * 6 +
          operatorLean * 1.4,
        -8,
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.restore();

  // Collar / field-tech suit.
  ctx.fillStyle = "#111c29";
  ctx.strokeStyle =
    "rgba(255,255,255,.18)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-15, 7);
  ctx.lineTo(-22, 18);
  ctx.lineTo(22, 18);
  ctx.lineTo(15, 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle =
    `rgb(${palette.accent.join(",")})`;
  ctx.globalAlpha = 0.66;
  ctx.beginPath();
  ctx.arc(
    0,
    11,
    3.5,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.globalAlpha = 1;

  // AURI's sprout antenna grows with the current build.
  const growth =
    clamp(
      activeModulePower() / 8,
      0,
      1
    );
  const synergyGrowth =
    Math.min(
      2,
      activeBuildSynergies()
        .length
    );
  const sway =
    Math.sin(
      songTime *
      BPM /
      60 *
      Math.PI
    ) * 2.2;
  const stemTop =
    -39 -
    growth * 7;

  ctx.strokeStyle =
    `rgb(${palette.accent.join(",")})`;
  ctx.lineWidth =
    2 + growth * 0.6;
  ctx.beginPath();
  ctx.moveTo(
    0,
    -26
  );
  ctx.quadraticCurveTo(
    sway * 0.3,
    -34,
    sway,
    stemTop
  );
  ctx.stroke();

  const leafPairs =
    1 +
    (
      activeModulePower() >= 3
        ? 1
        : 0
    ) +
    synergyGrowth;

  for (
    let level = 0;
    level < leafPairs;
    level += 1
  ) {
    const leafY =
      stemTop +
      level * 5.5;
    const spread =
      3.5 + level * 0.7;

    for (const sign of [-1, 1]) {
      ctx.save();
      ctx.translate(
        sway +
          sign * spread,
        leafY
      );
      ctx.rotate(
        sign * -0.45
      );
      ctx.scale(
        1 +
          beat * 0.08 +
          growth * 0.12,
        1
      );
      ctx.fillStyle =
        level >= 2
          ? `rgb(${palette.secondary.join(",")})`
          : `rgb(${palette.accent.join(",")})`;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        5,
        2.5,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();

  ctx.fillStyle =
    "rgba(255,255,255,.40)";
  ctx.font =
    "900 8px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    `AURI · ${act.name}`,
    x,
    y + 29
  );
}

function currentStemLevels(songTime) {
  const beat =
    Math.max(
      0,
      songTime /
        (60 / BPM)
    );
  const frame =
    songFrameAtBeat(beat);
  const actEnergy =
    clamp(
      (wave - 1) /
        Math.max(
          1,
          RUN_ACTS - 1
        ),
      0,
      1
    );
  const slideEnergy =
    clamp(
      (
        runMods.slideNova +
        runMods.slideMirror
      ) / 3,
      0,
      1
    );
  const auraEnergy =
    clamp(
      (
        runMods.shockwave +
        runMods.fusionBlast +
        runMods.wallCharge +
        runMods.fragmentCount *
          0.25
      ) / 4,
      0,
      1
    );

  return [
    {
      key: "D",
      level:
        frame.kick ||
        frame.snare ||
        frame.hat
          ? 0.72 +
            actEnergy * 0.28
          : 0.18
    },
    {
      key: "B",
      level:
        frame.bassMidi !== null
          ? 0.70 +
            actEnergy * 0.20
          : 0.16
    },
    {
      key: "H",
      level:
        frame.chordMidi
          ? 0.70
          : 0.24
    },
    {
      key: "L",
      level:
        frame.leadMidi !== null
          ? clamp(
              0.28 +
              actEnergy * 0.38 +
              slideEnergy * 0.34,
              0,
              1
            )
          : 0.12
    },
    {
      key: "A",
      level:
        frame.auraMidi !== null
          ? clamp(
              0.18 +
              actEnergy * 0.25 +
              auraEnergy * 0.50,
              0,
              1
            )
          : 0.08
    },
    {
      key: "X",
      level:
        wave === FINAL_ACT
          ? (
              bossState.phase === 2
                ? 1
                : 0.76
            )
          : 0.04
    }
  ];
}

function drawStemRack(songTime) {
  if (
    !running ||
    !showDebug
  ) {
    return;
  }

  const palette =
    machinePalette();
  const levels =
    currentStemLevels(
      songTime
    );
  const x = 270;
  const y = 924;
  const spacing = 16;

  ctx.save();

  ctx.fillStyle =
    "rgba(5,9,15,.74)";
  ctx.strokeStyle =
    "rgba(255,255,255,.065)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(
    x - 58,
    y - 13,
    116,
    26,
    9
  );
  ctx.fill();
  ctx.stroke();

  levels.forEach(
    (stem, index) => {
      const sx =
        x +
        (
          index -
          (levels.length - 1) / 2
        ) *
          spacing;

      for (
        let segment = 0;
        segment < 3;
        segment += 1
      ) {
        const threshold =
          (segment + 1) / 3;
        const lit =
          stem.level >=
          threshold;

        ctx.fillStyle =
          lit
            ? (
                stem.key === "A" ||
                stem.key === "X"
                  ? `rgba(${palette.accent.join(",")},.88)`
                  : `rgba(${palette.secondary.join(",")},.78)`
              )
            : "rgba(255,255,255,.055)";

        ctx.fillRect(
          sx - 3,
          y + 3 -
            segment * 5,
          6,
          3
        );
      }

      ctx.fillStyle =
        "rgba(255,255,255,.34)";
      ctx.font =
        "900 6px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign =
        "center";
      ctx.fillText(
        stem.key,
        sx,
        y + 10
      );
    }
  );

  ctx.restore();
}

function drawAuriFieldGuide(songTime) {
  if (
    profile.tutorialSeen ||
    runMode === "daily" ||
    songTime < 0
  ) {
    return;
  }

  const beat =
    songTime /
    (60 / BPM);
  let cue = null;

  if (beat < 4.1) {
    cue =
      "GOLPEA CUANDO LA SEMILLA TOQUE LA PINZA";
  } else if (
    beat >= 4.6 &&
    beat < 12.4
  ) {
    cue =
      "SLIDE: SIGUE LOS FRETS · EL RIEL ES LA REGLA";
  } else if (
    beat >= 12.7 &&
    beat < 19.6
  ) {
    cue =
      "CHAIN: USA EL RETORNO PARA CRUZAR EL GRUPO";
  } else if (beat >= 20) {
    profile.tutorialSeen = true;
    saveLocalJson(
      PROFILE_KEY,
      profile
    );
    return;
  }

  if (!cue) return;

  const palette =
    machinePalette();
  const x = 270;
  const y = 714;
  const width = 388;

  ctx.save();

  ctx.fillStyle =
    "rgba(5,10,17,.88)";
  ctx.strokeStyle =
    `rgba(${palette.secondary.join(",")},.30)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(
    x - width / 2,
    y - 17,
    width,
    34,
    12
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle =
    `rgb(${palette.accent.join(",")})`;
  ctx.font =
    "900 8px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    "AURI //",
    x - width / 2 + 12,
    y
  );

  ctx.fillStyle =
    "rgba(255,255,255,.78)";
  ctx.font =
    "800 8px system-ui, sans-serif";
  ctx.fillText(
    cue,
    x - width / 2 + 58,
    y
  );

  ctx.restore();
}

function drawImpactVeil() {
  if (impactVeil <= 0) return;

  const palette =
    machinePalette();

  ctx.save();
  ctx.globalAlpha =
    Math.min(
      0.22,
      impactVeil
    );
  ctx.fillStyle =
    `rgb(${palette.accent.join(",")})`;
  ctx.fillRect(
    0,
    0,
    DESIGN.width,
    DESIGN.height
  );
  ctx.restore();
}


function drawTrail(note) {
  if (note.launched) {
    const speed = Math.hypot(note.vx, note.vy) || 1;
    const ux = note.vx / speed;
    const uy = note.vy / speed;

    const pierceReady =
      Number(note.piercesLeft || 0) > 0;
    const ricochetReady =
      Number(note.ricochetsLeft || 0) > 0;

    ctx.strokeStyle =
      note.power
        ? "rgba(255,241,169,.34)"
        : pierceReady
          ? "rgba(255,125,153,.32)"
          : ricochetReady
            ? "rgba(94,226,215,.30)"
            : note.side === "left"
              ? "rgba(110,215,255,.20)"
              : "rgba(216,139,255,.20)";

    ctx.lineWidth =
      note.power
        ? 12
        : pierceReady
          ? 8
          : 6;
    ctx.shadowBlur =
      note.power || pierceReady
        ? 18
        : ricochetReady
          ? 10
          : 0;
    ctx.shadowColor =
      note.power
        ? "#fff1a9"
        : pierceReady
          ? "#ff7d99"
          : ricochetReady
            ? "#5ee2d7"
            : "transparent";
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

    const alpha =
      clamp(
        0.18 +
        notes.length * 0.055,
        0.18,
        0.48
      );

    ctx.save();
    ctx.strokeStyle =
      `rgba(255,229,109,${alpha})`;
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

    for (
      let index = 0;
      index < notes.length - 1;
      index += 1
    ) {
      const a = notes[index];
      const b = notes[index + 1];
      const mx =
        (a.x + b.x) / 2;
      const my =
        (a.y + b.y) / 2;
      const angle =
        Math.atan2(
          b.y - a.y,
          b.x - a.x
        );

      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(angle);
      ctx.strokeStyle =
        "rgba(255,238,143,.58)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(2, 0);
      ctx.lineTo(-5, 5);
      ctx.stroke();
      ctx.restore();
    }

    const lead = notes[0];
    const pulse =
      0.5 +
      0.5 *
        Math.sin(
          performance.now() /
          125
        );

    ctx.strokeStyle =
      `rgba(255,229,109,${0.38 + pulse * 0.32})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      lead.x,
      lead.y,
      noteRadius(lead) +
        13 +
        pulse * 3,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    if (notes.length >= 3) {
      const centroid =
        notes.reduce(
          (acc, note) => ({
            x: acc.x + note.x,
            y: acc.y + note.y
          }),
          { x: 0, y: 0 }
        );

      centroid.x /= notes.length;
      centroid.y /= notes.length;

      ctx.fillStyle =
        "rgba(255,238,143,.66)";
      ctx.font =
        "900 9px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        `CHAIN ×${notes.length}`,
        centroid.x,
        centroid.y - 18
      );
    }

    ctx.restore();
  }
}


function drawTap(note) {
  drawTrail(note);

  const radius =
    noteRadius(note);
  const noteColor =
    note.side === "left"
      ? "#6ed7ff"
      : note.side === "right"
        ? "#d88bff"
        : "#dfeaff";
  const musicEnergy =
    eventMusicEnergy(note);

  ctx.save();
  ctx.translate(
    note.x,
    note.y
  );

  if (note.launched) {
    ctx.rotate(
      Math.atan2(
        note.vy,
        note.vx
      ) +
      Math.PI / 2
    );
  }

  if (note.power) {
    ctx.shadowBlur = 16;
    ctx.shadowColor =
      "#fff1a9";
    ctx.fillStyle =
      "#fff1a9";
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle =
      "rgba(255,255,255,.76)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      radius + 4,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  } else if (note.fragment) {
    ctx.shadowBlur = 7;
    ctx.shadowColor =
      "#ffffff";
    ctx.fillStyle =
      "#ffffff";
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
  } else if (note.launched) {
    ctx.shadowBlur = 7;
    ctx.shadowColor =
      noteColor;
    ctx.fillStyle =
      noteColor;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
  } else {
    // Minimal incoming note: ring, body, core.
    ctx.shadowBlur = 5;
    ctx.shadowColor =
      noteColor;
    ctx.fillStyle =
      "rgba(7,12,20,.94)";
    ctx.strokeStyle =
      noteColor;
    ctx.lineWidth =
      2.4 +
      musicEnergy * 0.8;

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
    ctx.fillStyle =
      noteColor;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      radius * 0.34,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  if (
    note.chainGroup &&
    !note.launched
  ) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle =
      "rgba(255,229,109,.66)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      radius + 6,
      -Math.PI * 0.78,
      -Math.PI * 0.20
    );
    ctx.stroke();
  }

  if (
    note.launched &&
    Number(
      note.ricochetsLeft || 0
    ) > 0
  ) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle =
      "rgba(94,226,215,.76)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      radius + 5,
      -Math.PI * 0.64,
      Math.PI * 0.64
    );
    ctx.stroke();
  }

  if (
    note.launched &&
    Number(
      note.piercesLeft || 0
    ) > 0
  ) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle =
      "rgba(255,125,153,.84)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(
      0,
      -radius - 6
    );
    ctx.lineTo(
      0,
      radius + 6
    );
    ctx.stroke();
  }

  ctx.fillStyle = "#08101d";
  ctx.font =
    `900 ${Math.round(
      note.power
        ? 31
        : note.launched
          ? 25
          : 20
    )}px system-ui, sans-serif`;
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
  const center =
    controlButtonCenter(side);
  const m = view();
  const pivot =
    m.pivot[side];
  const phase =
    flipperPhase(
      side,
      songTime
    );
  const slide =
    activeSlideAt(
      songTime,
      side
    );
  const control =
    slideControl[side];
  const left =
    side === "left";
  const palette =
    machinePalette();
  const sideRgb =
    left
      ? palette.secondary
      : palette.accent;
  const sideColor =
    `rgb(${sideRgb.join(",")})`;
  const slideActive =
    Boolean(
      slide?.started &&
      slideMode(slide) === "follow"
    );
  const connected =
    slideActive &&
    slideVisualConnected(
      slide,
      songTime
    );

  const displacement =
    slideActive ||
    control.held
      ? {
          x: control.x * 30,
          y: control.y * 30
        }
      : { x: 0, y: 0 };

  const cap = {
    x:
      center.x +
      displacement.x,
    y:
      center.y +
      displacement.y +
      (
        !slideActive &&
        phase.active
          ? 4
          : 0
      )
  };

  ctx.save();

  // Cable: one quiet structural line.
  ctx.strokeStyle =
    `rgba(${sideRgb.join(",")},.14)`;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(
    center.x +
      (left ? 22 : -22),
    center.y - 14
  );
  ctx.quadraticCurveTo(
    left ? 106 : 434,
    846,
    pivot.x,
    pivot.y + 5
  );
  ctx.stroke();

  // Socket: one dark disc, one functional ring.
  ctx.fillStyle =
    "#0b121c";
  ctx.strokeStyle =
    slideActive
      ? (
          connected
            ? "#fff1a9"
            : "rgba(255,125,153,.68)"
        )
      : `rgba(${sideRgb.join(",")},.52)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    center.x,
    center.y,
    35,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // Shaft.
  ctx.strokeStyle =
    "#3b4856";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(
    center.x,
    center.y
  );
  ctx.lineTo(
    cap.x,
    cap.y
  );
  ctx.stroke();

  // Thumb cap: single material surface.
  ctx.shadowBlur =
    slideActive ||
    phase.active
      ? 10
      : 4;
  ctx.shadowColor =
    connected
      ? "#fff1a9"
      : sideColor;
  ctx.fillStyle =
    "#263342";
  ctx.strokeStyle =
    slideActive
      ? (
          connected
            ? "#fff1a9"
            : "#ff8c9b"
        )
      : sideColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    cap.x,
    cap.y,
    27,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle =
    "rgba(255,255,255,.16)";
  ctx.beginPath();
  ctx.arc(
    cap.x - 7,
    cap.y - 8,
    4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

function drawFlipper(side, songTime) {
  const segment =
    flipperSegment(
      side,
      songTime
    );
  const phase =
    segment.phase;
  const slide =
    activeSlideAt(
      songTime,
      side
    );
  const slideActive =
    Boolean(
      slide?.started
    );
  const palette =
    machinePalette();
  const sideRgb =
    side === "left"
      ? palette.secondary
      : palette.accent;
  const sideColor =
    `rgb(${sideRgb.join(",")})`;
  const hot =
    phase.attack ||
    slideActive;
  const angle =
    Math.atan2(
      segment.tip.y -
        segment.pivot.y,
      segment.tip.x -
        segment.pivot.x
    );

  drawControlButton(
    side,
    songTime
  );

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // One strong silhouette.
  ctx.strokeStyle =
    "#0c131d";
  ctx.lineWidth =
    FLIPPER.width + 10;
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

  // One structural surface.
  ctx.strokeStyle =
    hot
      ? "#d7c98a"
      : "#394856";
  ctx.lineWidth =
    FLIPPER.width;
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

  // One thin functional accent.
  ctx.strokeStyle =
    hot
      ? "#fff1a9"
      : sideColor;
  ctx.globalAlpha =
    hot ? 0.86 : 0.52;
  ctx.lineWidth = 3;
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

  // Pivot.
  ctx.fillStyle =
    "#0d1520";
  ctx.strokeStyle =
    sideColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    segment.pivot.x,
    segment.pivot.y,
    11,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  // Pincer: silhouette first, accent only on the edge.
  ctx.save();
  ctx.translate(
    segment.tip.x,
    segment.tip.y
  );
  ctx.rotate(angle);

  const jawSpread =
    phase.attack
      ? 0.18
      : slideActive
        ? 0.28
        : 0.44;
  const jawLength =
    hot ? 21 : 19;

  ctx.fillStyle =
    "#111a26";
  ctx.strokeStyle =
    hot
      ? "#fff1a9"
      : sideColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    0,
    0,
    8,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  for (const sign of [-1, 1]) {
    const a =
      sign *
      jawSpread;
    const elbowX =
      Math.cos(a) * 10;
    const elbowY =
      Math.sin(a) * 10;
    const tipX =
      Math.cos(
        a * 1.45
      ) *
      jawLength;
    const tipY =
      Math.sin(
        a * 1.45
      ) *
      jawLength;

    ctx.strokeStyle =
      "#111a26";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(
      2,
      sign * 3
    );
    ctx.quadraticCurveTo(
      elbowX,
      elbowY,
      tipX,
      tipY
    );
    ctx.stroke();

    ctx.strokeStyle =
      hot
        ? "#fff1a9"
        : sideColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(
      2,
      sign * 3
    );
    ctx.quadraticCurveTo(
      elbowX,
      elbowY,
      tipX,
      tipY
    );
    ctx.stroke();
  }

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

    if (explosion.shockRadius > 0) {
      const shockProgress =
        clamp(
          explosion.life /
            explosion.duration,
          0,
          1
        );

      ctx.strokeStyle =
        `rgba(255,190,92,${alpha * 0.58})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        explosion.x,
        explosion.y,
        Math.max(
          8,
          explosion.shockRadius *
            shockProgress
        ),
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    if (explosion.fusionBurst) {
      ctx.strokeStyle =
        `rgba(211,139,255,${alpha * 0.72})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.arc(
        explosion.x,
        explosion.y,
        (15 + t * 38) *
          explosion.scale,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

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

  const palette =
    machinePalette();
  const remaining =
    Math.max(
      1,
      Math.ceil(
        -clock.beat
      )
    );
  const fraction =
    (
      (
        clock.beat %
        1
      ) +
      1
    ) %
    1;
  const ringRadius =
    lerp(
      58,
      34,
      fraction
    );
  const x =
    DESIGN.width / 2;
  const y = 350;

  ctx.save();

  // Boot capsule.
  ctx.fillStyle =
    "rgba(5,10,17,.82)";
  ctx.strokeStyle =
    `rgba(${palette.secondary.join(",")},.22)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(
    x - 94,
    y - 84,
    188,
    168,
    28
  );
  ctx.fill();
  ctx.stroke();

  // Four sync ticks.
  for (
    let tick = 0;
    tick < 4;
    tick += 1
  ) {
    const angle =
      -Math.PI / 2 +
      tick *
        Math.PI / 2;
    const active =
      tick >= 4 - remaining;

    ctx.strokeStyle =
      active
        ? `rgb(${palette.accent.join(",")})`
        : "rgba(255,255,255,.12)";
    ctx.lineWidth =
      active ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(
      x +
        Math.cos(angle) *
          68,
      y +
        Math.sin(angle) *
          68
    );
    ctx.lineTo(
      x +
        Math.cos(angle) *
          78,
      y +
        Math.sin(angle) *
          78
    );
    ctx.stroke();
  }

  // Contracting beat ring.
  ctx.shadowBlur = 18;
  ctx.shadowColor =
    `rgb(${palette.secondary.join(",")})`;
  ctx.strokeStyle =
    `rgba(${palette.secondary.join(",")},${0.42 + fraction * 0.45})`;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(
    x,
    y,
    ringRadius,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle =
    "#0c1520";
  ctx.strokeStyle =
    `rgb(${palette.accent.join(",")})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(
    x,
    y,
    29,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle =
    "#f7fbff";
  ctx.font =
    "950 34px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    String(remaining),
    x,
    y + 1
  );

  ctx.fillStyle =
    `rgb(${palette.secondary.join(",")})`;
  ctx.font =
    "900 8px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(
    "AURI // SYNC",
    x,
    y - 57
  );

  ctx.fillStyle =
    "rgba(255,255,255,.48)";
  ctx.font =
    "800 9px system-ui, sans-serif";
  ctx.fillText(
    AURA_SONG.title,
    x,
    y + 57
  );

  ctx.restore();
}


function drawDebug(songTime) {
  const loopBeat =
    ((clock.beat % LOOP_BEATS) + LOOP_BEATS) %
    LOOP_BEATS;

  const lines = [
    `SLICE v0.32 · ${chartName} · BPM ${BPM} · beat ${loopBeat.toFixed(2)}`,
    `tap ${NOTE_SPEED}px/s CONSTANTE · projectile ${POST_HIT_SPEED}px/s`,
    `tap contacto · slide TRACE directo · wave ${wave} · upgrades físicos`,
    `hits ${hitCount} miss ${missCount} chain ${chainCount} choque ${collisionCount} pared ${wallExplosionCount}`,
    "tap zonas L/R · slide trace directo en canvas",
    `input ${lastInputType} · offset ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`,
    `FPS ${fps.toFixed(0)} · multi x${comboMultiplier(combo)}`,
    `mode ${runMode} seed ${runSeed} · SLIDE ${runStats?.traceSuccess ?? 0}/${runStats?.traceAttempts ?? 0}`
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

  if (screenShake > 0) {
    const time =
      performance.now();
    ctx.translate(
      Math.sin(time * 0.087) *
        screenShake,
      Math.cos(time * 0.113) *
        screenShake * 0.65
    );
  }

  drawBackground();
  drawBossCore(songTime);
  drawBumpers();
  drawOperatorSocket(songTime);

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
  drawStemRack(songTime);

  drawImpactFlashes();
  drawExplosions();
  drawMessage();
  drawCountIn(songTime);
  drawAuriFieldGuide(songTime);
  drawImpactVeil();

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
    slideControl[side].x = 0;
    slideControl[side].y = 0;
  }

  flippers.left.startTime = -Infinity;
  flippers.left.hitThisSwing = false;
  flippers.right.startTime = -Infinity;
  flippers.right.hitThisSwing = false;
}

function shuffledUpgrades(items) {
  const copy =
    [...items];

  for (
    let i = copy.length - 1;
    i > 0;
    i -= 1
  ) {
    const j =
      Math.floor(
        runRandom() *
        (i + 1)
      );
    [copy[i], copy[j]] =
      [copy[j], copy[i]];
  }

  return copy;
}

function pickUpgradeChoices() {
  const pool =
    shuffledUpgrades(
      UPGRADES.filter(
        (upgrade) =>
          moduleLevel(upgrade.id) <
            moduleMaxLevel(upgrade) &&
          (
            !upgrade.available ||
            upgrade.available()
          )
      )
    );
  const choices = [];
  const usedFamilies =
    new Set();
  const ownedFamilies =
    new Set(
      activeModuleIds
        .map(
          (id) =>
            upgradeById(id)?.family
        )
        .filter(Boolean)
    );

  const add = (
    upgrade,
    {
      allowFamilyRepeat = false
    } = {}
  ) => {
    if (
      !upgrade ||
      choices.includes(upgrade)
    ) {
      return false;
    }

    if (
      !allowFamilyRepeat &&
      usedFamilies.has(
        upgrade.family
      )
    ) {
      return false;
    }

    choices.push(upgrade);
    usedFamilies.add(
      upgrade.family
    );
    return true;
  };

  // Slot 1: if the player is one module away from a synergy,
  // offer one way to complete it. This makes builds steerable,
  // without guaranteeing the same build every run.
  const finishers =
    pool.filter(
      (upgrade) =>
        synergyHintsForUpgrade(
          upgrade
        ).length > 0
    );

  if (finishers.length > 0) {
    add(finishers[0]);
  }

  // Slot 2: reinforce a family already being built.
  if (
    activeModuleIds.length > 0 &&
    choices.length < 2
  ) {
    const continuation =
      pool.find(
        (upgrade) =>
          ownedFamilies.has(
            upgrade.family
          ) &&
          !choices.includes(
            upgrade
          )
      );

    add(
      continuation,
      {
        allowFamilyRepeat:
          choices.length === 0
      }
    );
  }

  // Slot 3: keep one door open to a new family.
  if (choices.length < 3) {
    const discovery =
      pool.find(
        (upgrade) =>
          !ownedFamilies.has(
            upgrade.family
          ) &&
          !choices.includes(
            upgrade
          ) &&
          !usedFamilies.has(
            upgrade.family
          )
      );

    add(discovery);
  }

  // Fill remaining slots with distinct families when possible.
  for (const upgrade of pool) {
    if (choices.length >= 3) break;
    add(upgrade);
  }

  // Small pools can force a repeated family.
  for (const upgrade of pool) {
    if (choices.length >= 3) break;
    add(
      upgrade,
      {
        allowFamilyRepeat: true
      }
    );
  }

  return choices;
}

const MODULE_PREVIEW_COLORS = {
  shot: "#6ed7ff",
  collision: "#5ee2d7",
  explosion: "#ffc45c",
  arena: "#d38bff",
  slide: "#72b7ff",
  chain: "#ffe56d",
  wall: "#ff7d99",
  defense: "#ccecff"
};

function previewEase(t) {
  const x =
    clamp(t, 0, 1);

  return (
    0.5 -
    Math.cos(
      x * Math.PI
    ) / 2
  );
}

function previewSceneTime(now) {
  const cycleMs = 2850;
  const raw =
    (now % cycleMs) /
    cycleMs;

  return raw < 0.92
    ? raw / 0.92
    : 1;
}

function drawPreviewArena(
  context,
  width,
  height
) {
  const palette =
    machinePalette();

  context.clearRect(
    0,
    0,
    width,
    height
  );

  const gradient =
    context.createLinearGradient(
      0,
      0,
      0,
      height
    );
  gradient.addColorStop(
    0,
    "#070c14"
  );
  gradient.addColorStop(
    1,
    "#0a111b"
  );

  context.fillStyle =
    gradient;
  context.fillRect(
    0,
    0,
    width,
    height
  );

  if (
    WORLD_ASSETS.far.complete &&
    WORLD_ASSETS.far.naturalWidth > 0
  ) {
    context.save();
    context.globalAlpha = 0.13;
    context.drawImage(
      WORLD_ASSETS.far,
      0,
      0,
      width,
      height
    );
    context.restore();
  }

  context.strokeStyle =
    "rgba(255,255,255,.045)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(11, 12);
  context.lineTo(
    11,
    height - 10
  );
  context.lineTo(
    width - 11,
    height - 10
  );
  context.lineTo(
    width - 11,
    12
  );
  context.stroke();

  context.fillStyle =
    `rgba(${palette.secondary.join(",")},.12)`;
  context.fillRect(
    18,
    height - 18,
    width - 36,
    1
  );
}

function drawPreviewLabel(
  context,
  text,
  color,
  alpha = 1,
  y = 21
) {
  context.save();
  context.globalAlpha =
    alpha;
  context.fillStyle =
    color;
  context.font =
    "900 9px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.textAlign =
    "center";
  context.textBaseline =
    "middle";
  context.fillText(
    text,
    context.canvas.width / 2,
    y
  );
  context.restore();
}

function previewSideColor(side) {
  return side === "right"
    ? "#d88bff"
    : "#6ed7ff";
}

function drawPreviewNote(
  context,
  x,
  y,
  side = "left",
  {
    launched = false,
    power = false,
    scale = 1,
    alpha = 1
  } = {}
) {
  const radius =
    (launched ? 6 : 8) *
    scale;
  const color =
    power
      ? "#fff1a9"
      : previewSideColor(
          side
        );

  context.save();
  context.globalAlpha =
    alpha;

  if (launched) {
    context.shadowBlur =
      power ? 13 : 7;
    context.shadowColor =
      color;
    context.fillStyle =
      color;
    context.beginPath();
    context.arc(
      x,
      y,
      radius,
      0,
      Math.PI * 2
    );
    context.fill();
  } else {
    context.shadowBlur = 4;
    context.shadowColor =
      color;
    context.fillStyle =
      "rgba(7,12,20,.96)";
    context.strokeStyle =
      color;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(
      x,
      y,
      radius,
      0,
      Math.PI * 2
    );
    context.fill();
    context.stroke();

    context.shadowBlur = 0;
    context.fillStyle =
      color;
    context.beginPath();
    context.arc(
      x,
      y,
      radius * 0.34,
      0,
      Math.PI * 2
    );
    context.fill();
  }

  context.restore();
}

function previewClawGeometry(
  width,
  height,
  side = "left"
) {
  const left =
    side === "left";
  const pivot = {
    x:
      left
        ? width * 0.20
        : width * 0.80,
    y:
      height - 25
  };
  const angle =
    left
      ? -0.79
      : -2.35;
  const length = 37;

  return {
    pivot,
    angle,
    tip: {
      x:
        pivot.x +
        Math.cos(angle) *
          length,
      y:
        pivot.y +
        Math.sin(angle) *
          length
    }
  };
}

function drawPreviewClaw(
  context,
  width,
  height,
  side = "left",
  active = false
) {
  const palette =
    machinePalette();
  const color =
    side === "left"
      ? `rgb(${palette.secondary.join(",")})`
      : `rgb(${palette.accent.join(",")})`;
  const geometry =
    previewClawGeometry(
      width,
      height,
      side
    );
  const {
    pivot,
    tip,
    angle
  } = geometry;

  context.save();
  context.lineCap = "round";

  context.strokeStyle =
    "#0c131d";
  context.lineWidth = 13;
  context.beginPath();
  context.moveTo(
    pivot.x,
    pivot.y
  );
  context.lineTo(
    tip.x,
    tip.y
  );
  context.stroke();

  context.strokeStyle =
    active
      ? "#d7c98a"
      : "#394856";
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(
    pivot.x,
    pivot.y
  );
  context.lineTo(
    tip.x,
    tip.y
  );
  context.stroke();

  context.strokeStyle =
    active
      ? "#fff1a9"
      : color;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(
    pivot.x,
    pivot.y
  );
  context.lineTo(
    tip.x,
    tip.y
  );
  context.stroke();

  context.fillStyle =
    "#0d1520";
  context.strokeStyle =
    color;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(
    pivot.x,
    pivot.y,
    6,
    0,
    Math.PI * 2
  );
  context.fill();
  context.stroke();

  context.translate(
    tip.x,
    tip.y
  );
  context.rotate(angle);

  context.fillStyle =
    "#111a26";
  context.strokeStyle =
    active
      ? "#fff1a9"
      : color;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(
    0,
    0,
    5,
    0,
    Math.PI * 2
  );
  context.fill();
  context.stroke();

  for (const sign of [-1, 1]) {
    context.strokeStyle =
      "#111a26";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(
      2,
      sign * 2
    );
    context.quadraticCurveTo(
      8,
      sign * 5,
      15,
      sign * 8
    );
    context.stroke();

    context.strokeStyle =
      active
        ? "#fff1a9"
        : color;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(
      2,
      sign * 2
    );
    context.quadraticCurveTo(
      8,
      sign * 5,
      15,
      sign * 8
    );
    context.stroke();
  }

  context.restore();

  return geometry;
}

function drawPreviewBumper(
  context,
  x,
  y,
  color = "#fff1a9"
) {
  context.save();
  context.fillStyle =
    "#192431";
  context.strokeStyle =
    color;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(
    x,
    y,
    15,
    0,
    Math.PI * 2
  );
  context.fill();
  context.stroke();
  context.restore();
}

function drawPreviewWall(
  context,
  x,
  y0,
  y1,
  color =
    "rgba(255,255,255,.22)"
) {
  context.save();
  context.strokeStyle =
    color;
  context.lineWidth = 3;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(x, y0);
  context.lineTo(x, y1);
  context.stroke();
  context.restore();
}

function drawPreviewBurst(
  context,
  x,
  y,
  progress,
  color,
  radius = 38
) {
  if (
    progress < 0 ||
    progress > 1
  ) {
    return;
  }

  context.save();
  context.globalAlpha =
    1 - progress;
  context.strokeStyle =
    color;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(
    x,
    y,
    8 +
      radius *
        previewEase(progress),
    0,
    Math.PI * 2
  );
  context.stroke();
  context.restore();
}

function drawPreviewHitSetup(
  context,
  width,
  height,
  t,
  {
    side = "left",
    hitAt = 0.31
  } = {}
) {
  const geometry =
    drawPreviewClaw(
      context,
      width,
      height,
      side,
      t >= hitAt &&
        t < hitAt + 0.15
    );
  const incoming =
    clamp(
      t / hitAt,
      0,
      1
    );
  const startY = 21;
  const noteX =
    geometry.tip.x;
  const noteY =
    lerp(
      startY,
      geometry.tip.y,
      previewEase(incoming)
    );

  if (t < hitAt) {
    drawPreviewNote(
      context,
      noteX,
      noteY,
      side
    );
  }

  if (
    t >= hitAt &&
    t < hitAt + 0.18
  ) {
    const flash =
      1 -
      (
        t - hitAt
      ) / 0.18;
    drawPreviewLabel(
      context,
      "PERFECT",
      "#fff1a9",
      flash,
      24
    );
    drawPreviewBurst(
      context,
      geometry.tip.x,
      geometry.tip.y,
      (
        t - hitAt
      ) / 0.18,
      "#fff1a9",
      22
    );
  }

  return {
    ...geometry,
    hitAt
  };
}

function drawPreviewSlideRail(
  context,
  points,
  color,
  progress = 1
) {
  const count =
    Math.max(
      2,
      Math.floor(
        points.length *
        clamp(
          progress,
          0,
          1
        )
      )
    );

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  context.strokeStyle =
    "rgba(6,11,18,.94)";
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(
    points[0].x,
    points[0].y
  );
  for (
    let index = 1;
    index < count;
    index += 1
  ) {
    context.lineTo(
      points[index].x,
      points[index].y
    );
  }
  context.stroke();

  context.strokeStyle =
    color;
  context.globalAlpha = .78;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(
    points[0].x,
    points[0].y
  );
  for (
    let index = 1;
    index < count;
    index += 1
  ) {
    context.lineTo(
      points[index].x,
      points[index].y
    );
  }
  context.stroke();

  context.globalAlpha = 1;
  context.strokeStyle =
    "rgba(255,255,255,.58)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(
    points[0].x,
    points[0].y
  );
  for (
    let index = 1;
    index < count;
    index += 1
  ) {
    context.lineTo(
      points[index].x,
      points[index].y
    );
  }
  context.stroke();

  context.restore();
}

function previewPolylinePoint(
  points,
  t
) {
  const scaled =
    clamp(
      t,
      0,
      1
    ) *
    (points.length - 1);
  const index =
    Math.min(
      points.length - 2,
      Math.floor(scaled)
    );
  const local =
    scaled - index;
  const a =
    points[index];
  const b =
    points[index + 1];

  return {
    x:
      lerp(
        a.x,
        b.x,
        local
      ),
    y:
      lerp(
        a.y,
        b.y,
        local
      )
  };
}

function drawModulePreview(
  canvas,
  upgrade,
  now
) {
  const context =
    canvas.getContext(
      "2d"
    );
  const width =
    canvas.width;
  const height =
    canvas.height;
  const familyColor =
    MODULE_PREVIEW_COLORS[
      upgrade.family
    ] ?? "#ffffff";
  const t =
    previewSceneTime(now);
  const previewLevel =
    clamp(
      Number(
        canvas.dataset.level || 1
      ),
      1,
      MODULE_MAX_LEVEL
    );

  drawPreviewArena(
    context,
    width,
    height
  );

  const leftClaw =
    previewClawGeometry(
      width,
      height,
      "left"
    );
  const rightClaw =
    previewClawGeometry(
      width,
      height,
      "right"
    );

  if (
    [
      "nova",
      "mirror-slide"
    ].includes(upgrade.id)
  ) {
    const slideColor =
      "#d88bff";
    const rail = [
      {
        x:
          rightClaw.tip.x,
        y:
          rightClaw.tip.y
      },
      {
        x:
          width * 0.67,
        y:
          height * 0.58
      },
      {
        x:
          width * 0.54,
        y:
          height * 0.40
      },
      {
        x:
          width * 0.60,
        y:
          height * 0.24
      }
    ];
    const slideEnd = 0.58;
    const slideT =
      clamp(
        t / slideEnd,
        0,
        1
      );

    drawPreviewSlideRail(
      context,
      rail,
      slideColor
    );
    drawPreviewClaw(
      context,
      width,
      height,
      "right",
      t < slideEnd
    );

    const cursor =
      previewPolylinePoint(
        rail,
        slideT
      );

    if (t < slideEnd) {
      context.fillStyle =
        "#fff1a9";
      context.beginPath();
      context.arc(
        cursor.x,
        cursor.y,
        4,
        0,
        Math.PI * 2
      );
      context.fill();
      drawPreviewLabel(
        context,
        "SLIDE",
        "rgba(255,255,255,.68)",
        1,
        24
      );
    } else {
      const shot =
        (t - slideEnd) /
        (1 - slideEnd);
      drawPreviewLabel(
        context,
        "POWER RETURN",
        "#fff1a9",
        1 -
          clamp(
            shot - .55,
            0,
            1
          ),
        24
      );

      const count =
        upgrade.id ===
          "nova"
          ? 1 + previewLevel
          : Math.min(
              3,
              previewLevel
            );

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        const spread =
          count === 1
            ? 0
            : (
                index -
                (count - 1) / 2
              ) * 22;
        const origin =
          upgrade.id ===
            "mirror-slide" &&
          index === 1
            ? leftClaw.tip
            : rail.at(-1);
        drawPreviewNote(
          context,
          origin.x +
            spread *
              shot * .55,
          origin.y -
            shot * 90,
          index === 1
            ? "left"
            : "right",
          {
            launched: true,
            power: true,
            scale: .95
          }
        );
      }

      if (
        upgrade.id ===
        "mirror-slide"
      ) {
        drawPreviewClaw(
          context,
          width,
          height,
          "left",
          false
        );
      }
    }

    return;
  }

  if (
    upgrade.id ===
    "combo-shield"
  ) {
    const geometry =
      drawPreviewClaw(
        context,
        width,
        height,
        "left",
        false
      );
    const missAt = 0.45;
    const y =
      lerp(
        20,
        geometry.tip.y + 24,
        previewEase(
          clamp(
            t / missAt,
            0,
            1
          )
        )
      );

    if (t < missAt) {
      drawPreviewNote(
        context,
        geometry.tip.x + 24,
        y,
        "left"
      );
    }

    context.fillStyle =
      "rgba(255,255,255,.42)";
    context.font =
      "900 8px ui-monospace, SFMono-Regular, Menlo, monospace";
    context.textAlign =
      "left";
    context.fillText(
      "COMBO 12",
      17,
      22
    );

    if (t >= missAt) {
      const pulse =
        clamp(
          (
            t - missAt
          ) / 0.34,
          0,
          1
        );
      drawPreviewBurst(
        context,
        geometry.pivot.x,
        geometry.pivot.y - 8,
        pulse,
        familyColor,
        42
      );
      drawPreviewLabel(
        context,
        "SHIELD",
        familyColor,
        1 -
          clamp(
            (
              t -
              0.76
            ) / .18,
            0,
            1
          ),
        25
      );
    }

    return;
  }

  if (
    upgrade.id ===
    "fusion"
  ) {
    const hitAt = .28;
    const left =
      drawPreviewHitSetup(
        context,
        width,
        height,
        t,
        {
          side: "left",
          hitAt
        }
      );
    const right =
      drawPreviewHitSetup(
        context,
        width,
        height,
        t,
        {
          side: "right",
          hitAt
        }
      );

    if (t >= hitAt) {
      const travel =
        clamp(
          (
            t -
            hitAt
          ) / .42,
          0,
          1
        );
      const x1 =
        lerp(
          left.tip.x,
          width / 2,
          travel
        );
      const y1 =
        lerp(
          left.tip.y,
          height * .43,
          travel
        );
      const x2 =
        lerp(
          right.tip.x,
          width / 2,
          travel
        );
      const y2 =
        lerp(
          right.tip.y,
          height * .43,
          travel
        );

      if (travel < .98) {
        drawPreviewNote(
          context,
          x1,
          y1,
          "left",
          {
            launched: true
          }
        );
        drawPreviewNote(
          context,
          x2,
          y2,
          "right",
          {
            launched: true
          }
        );
      } else {
        drawPreviewBurst(
          context,
          width / 2,
          height * .43,
          clamp(
            (
              t -
              .70
            ) / .25,
            0,
            1
          ),
          familyColor,
          48
        );
        drawPreviewLabel(
          context,
          "FUSIÓN",
          familyColor,
          1,
          24
        );
      }
    }

    return;
  }

  const setup =
    drawPreviewHitSetup(
      context,
      width,
      height,
      t
    );
  const hitAt =
    setup.hitAt;
  const post =
    clamp(
      (
        t -
        hitAt
      ) /
      (1 - hitAt),
      0,
      1
    );

  if (t < hitAt) {
    return;
  }

  switch (upgrade.id) {
    case "twin-shot": {
      const count =
        1 + previewLevel;

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        const offset =
          index -
          (count - 1) / 2;

        drawPreviewNote(
          context,
          setup.tip.x +
            offset *
              post * 24,
          setup.tip.y -
            post * 98,
          "left",
          {
            launched: true
          }
        );
      }
      break;
    }

    case "ricochet": {
      const wallX =
        width - 16;
      drawPreviewWall(
        context,
        wallX,
        17,
        height - 18
      );
      const bounceAt = .54;

      if (post < bounceAt) {
        const q =
          post /
          bounceAt;
        drawPreviewNote(
          context,
          lerp(
            setup.tip.x,
            wallX - 7,
            q
          ),
          lerp(
            setup.tip.y,
            height * .38,
            q
          ),
          "left",
          {
            launched: true
          }
        );
      } else {
        const q =
          (
            post -
            bounceAt
          ) /
          (1 - bounceAt);
        drawPreviewNote(
          context,
          lerp(
            wallX - 7,
            width * .52,
            q
          ),
          lerp(
            height * .38,
            22,
            q
          ),
          "left",
          {
            launched: true
          }
        );
        drawPreviewLabel(
          context,
          "REBOTE",
          familyColor,
          1 -
            clamp(
              q - .62,
              0,
              1
            ),
          24
        );
      }
      break;
    }

    case "pierce": {
      const targets = [
        {
          x:
            width * .51,
          y:
            height * .52
        },
        {
          x:
            width * .70,
          y:
            height * .31
        }
      ];
      const projectile = {
        x:
          lerp(
            setup.tip.x,
            width * .84,
            post
          ),
        y:
          lerp(
            setup.tip.y,
            22,
            post
          )
      };

      targets.forEach(
        (target, index) => {
          const threshold =
            index === 0
              ? .36
              : .67;

          if (
            post <
            threshold
          ) {
            drawPreviewNote(
              context,
              target.x,
              target.y,
              index
                ? "right"
                : "left"
            );
          }
        }
      );

      drawPreviewNote(
        context,
        projectile.x,
        projectile.y,
        "left",
        {
          launched: true
        }
      );

      if (
        post > .38 &&
        post < .80
      ) {
        drawPreviewLabel(
          context,
          "CHAIN · PERFORA",
          "#ffe56d",
          1,
          24
        );
      }
      break;
    }

    case "fragments": {
      const target = {
        x:
          width * .58,
        y:
          height * .43
      };
      const impactAt = .46;

      if (post < impactAt) {
        drawPreviewNote(
          context,
          target.x,
          target.y,
          "right"
        );
        drawPreviewNote(
          context,
          lerp(
            setup.tip.x,
            target.x,
            post /
              impactAt
          ),
          lerp(
            setup.tip.y,
            target.y,
            post /
              impactAt
          ),
          "left",
          {
            launched: true
          }
        );
      } else {
        const burst =
          (
            post -
            impactAt
          ) /
          (1 - impactAt);

        drawPreviewBurst(
          context,
          target.x,
          target.y,
          clamp(
            burst * 1.4,
            0,
            1
          ),
          familyColor,
          32
        );

        const fragmentCount =
          2 + previewLevel;

        for (
          let index = 0;
          index < fragmentCount;
          index += 1
        ) {
          const angle =
            -Math.PI * .95 +
            index *
              (
                Math.PI * 1.9 /
                Math.max(
                  1,
                  fragmentCount - 1
                )
              );
          drawPreviewNote(
            context,
            target.x +
              Math.cos(angle) *
                burst * 45,
            target.y +
              Math.sin(angle) *
                burst * 38,
            "left",
            {
              launched: true,
              scale: .56
            }
          );
        }
      }
      break;
    }

    case "bumper":
    case "bumper-split": {
      const bumper = {
        x:
          width * .59,
        y:
          height * .46
      };
      const impactAt = .48;
      drawPreviewBumper(
        context,
        bumper.x,
        bumper.y,
        "#fff1a9"
      );

      if (post < impactAt) {
        drawPreviewNote(
          context,
          lerp(
            setup.tip.x,
            bumper.x - 17,
            post /
              impactAt
          ),
          lerp(
            setup.tip.y,
            bumper.y + 12,
            post /
              impactAt
          ),
          "left",
          {
            launched: true
          }
        );
      } else {
        const q =
          (
            post -
            impactAt
          ) /
          (1 - impactAt);
        drawPreviewNote(
          context,
          lerp(
            bumper.x - 8,
            width * .40,
            q
          ),
          lerp(
            bumper.y - 4,
            19,
            q
          ),
          "left",
          {
            launched: true
          }
        );

        if (
          upgrade.id ===
          "bumper-split"
        ) {
          drawPreviewNote(
            context,
            lerp(
              bumper.x + 3,
              width * .83,
              q
            ),
            lerp(
              bumper.y - 5,
              height * .26,
              q
            ),
            "left",
            {
              launched: true,
              scale: .78
            }
          );
          drawPreviewLabel(
            context,
            "×2",
            familyColor,
            1,
            24
          );
        }
      }
      break;
    }

    case "shockwave": {
      const target = {
        x:
          width * .61,
        y:
          height * .42
      };
      const neighbors = [
        {
          x:
            width * .48,
          y:
            height * .25
        },
        {
          x:
            width * .76,
          y:
            height * .33
        }
      ];
      const impactAt = .47;

      if (post < impactAt) {
        drawPreviewNote(
          context,
          target.x,
          target.y,
          "right"
        );
        for (
          const neighbor of
          neighbors
        ) {
          drawPreviewNote(
            context,
            neighbor.x,
            neighbor.y,
            "right",
            {
              scale: .78
            }
          );
        }

        drawPreviewNote(
          context,
          lerp(
            setup.tip.x,
            target.x,
            post /
              impactAt
          ),
          lerp(
            setup.tip.y,
            target.y,
            post /
              impactAt
          ),
          "left",
          {
            launched: true,
            power: true
          }
        );
      } else {
        const q =
          (
            post -
            impactAt
          ) /
          (1 - impactAt);
        drawPreviewBurst(
          context,
          target.x,
          target.y,
          q,
          familyColor,
          55
        );
        if (q < .58) {
          for (
            const neighbor of
            neighbors
          ) {
            drawPreviewNote(
              context,
              neighbor.x,
              neighbor.y,
              "right",
              {
                scale: .78,
                alpha:
                  1 -
                  q * 1.6
              }
            );
          }
        }
        drawPreviewLabel(
          context,
          "SHOCK",
          familyColor,
          1 -
            clamp(
              q - .68,
              0,
              1
            ),
          24
        );
      }
      break;
    }

    case "wall-charge": {
      const wallX =
        width - 18;
      const impactAt = .65;
      drawPreviewWall(
        context,
        wallX,
        16,
        height - 18,
        "rgba(255,125,153,.36)"
      );

      if (post < impactAt) {
        drawPreviewNote(
          context,
          lerp(
            setup.tip.x,
            wallX - 6,
            post /
              impactAt
          ),
          lerp(
            setup.tip.y,
            height * .37,
            post /
              impactAt
          ),
          "left",
          {
            launched: true,
            power: true
          }
        );
      } else {
        const q =
          (
            post -
            impactAt
          ) /
          (1 - impactAt);
        drawPreviewBurst(
          context,
          wallX - 5,
          height * .37,
          q,
          familyColor,
          43
        );
        drawPreviewLabel(
          context,
          "CARGA",
          familyColor,
          1 -
            q * .65,
          24
        );
      }
      break;
    }

    case "chain-relay": {
      const targets = [
        {
          x:
            width * .46,
          y:
            height * .55
        },
        {
          x:
            width * .63,
          y:
            height * .38
        },
        {
          x:
            width * .79,
          y:
            height * .22
        }
      ];
      const segment =
        post * 3;
      const targetIndex =
        Math.min(
          2,
          Math.floor(segment)
        );

      targets.forEach(
        (target, index) => {
          if (index >= targetIndex) {
            drawPreviewNote(
              context,
              target.x,
              target.y,
              index % 2
                ? "right"
                : "left",
              {
                scale: .74
              }
            );
          }
        }
      );

      const from =
        targetIndex === 0
          ? setup.tip
          : targets[
              targetIndex - 1
            ];
      const to =
        targets[
          targetIndex
        ];
      const q =
        segment -
        Math.floor(segment);

      drawPreviewNote(
        context,
        lerp(
          from.x,
          to.x,
          q
        ),
        lerp(
          from.y,
          to.y,
          q
        ),
        "left",
        {
          launched: true,
          scale: .78
        }
      );

      if (post > .32) {
        drawPreviewLabel(
          context,
          "CHAIN",
          "#ffe56d",
          1,
          24
        );
      }
      break;
    }

    default: {
      drawPreviewNote(
        context,
        lerp(
          setup.tip.x,
          width * .72,
          post
        ),
        lerp(
          setup.tip.y,
          20,
          post
        ),
        "left",
        {
          launched: true
        }
      );
    }
  }
}

function startModulePreviewLoop() {
  if (modulePreviewFrame) {
    cancelAnimationFrame(
      modulePreviewFrame
    );
  }

  const tick = (now) => {
    if (
      !awaitingUpgrade &&
      buildPanel.hidden
    ) {
      modulePreviewFrame = null;
      return;
    }

    for (
      const canvas of
      document.querySelectorAll(
        "#upgradeCards .module-preview-canvas, #buildManagerDetail .module-preview-canvas"
      )
    ) {
      const upgrade =
        upgradeById(
          canvas.dataset.module
        );

      if (upgrade) {
        drawModulePreview(
          canvas,
          upgrade,
          now
        );
      }
    }

    modulePreviewFrame =
      requestAnimationFrame(
        tick
      );
  };

  modulePreviewFrame =
    requestAnimationFrame(tick);
}


function renderUpgradeChoices() {
  const choices =
    pickUpgradeChoices();

  renderBuildVisibility();
  upgradeCards.innerHTML = "";

  for (const upgrade of choices) {
    const button =
      document.createElement("button");
    button.type = "button";
    button.className =
      `upgrade-card family-${upgrade.family}`;

    const owned =
      moduleLevel(upgrade.id);
    const nextLevel =
      Math.min(
        moduleMaxLevel(upgrade),
        owned + 1
      );
    const hints =
      synergyHintsForUpgrade(
        upgrade
      );
    const fitLabel =
      owned > 0
        ? `LV${nextLevel}`
        : hints.length
          ? `SINERGIA · ${hints[0].title}`
          : activeModuleIds.length >=
              ACTIVE_MODULE_LIMIT
            ? "RESERVA"
            : "";

    button.classList.toggle(
      "is-synergy",
      hints.length > 0
    );
    button.dataset.module =
      upgrade.id;
    button.innerHTML =
      `<span class="module-head"${fitLabel ? "" : " hidden"}><span>${fitLabel}</span></span><canvas class="module-preview-canvas" width="260" height="150" data-module="${upgrade.id}" data-level="${nextLevel}" aria-hidden="true"></canvas><strong>${upgrade.title}</strong><span class="upgrade-desc">${upgrade.desc}</span>`;

    button.addEventListener(
      "click",
      async () => {
        if (!awaitingUpgrade) return;

        awaitingUpgrade = false;

        for (
          const card of
          upgradeCards.children
        ) {
          card.disabled = true;
        }

        button.classList.add(
          "is-installing"
        );
        upgradePanel.classList.add(
          "installing"
        );
        moduleInstallSound();

        if (navigator.vibrate) {
          navigator.vibrate(
            [7, 20, 10]
          );
        }

        const result =
          acquireModule(upgrade);

        renderBuildVisibility({
          announce: true
        });
        clock.applyRunMix(
          0.36
        );

        if (runStats) {
          runStats.chosenUpgrades.push(
            upgrade.id
          );
        }

        showMessage(
          result.upgraded
            ? `${upgrade.title.toUpperCase()} · LV${result.level}`
            : result.reserve
              ? `${upgrade.title.toUpperCase()} · RESERVA`
              : `${upgrade.title.toUpperCase()} · ACTIVO`,
          result.reserve
            ? "#9cb0c4"
            : "#ffe56d",
          650
        );

        wave += 1;

        await new Promise(
          (resolve) =>
            window.setTimeout(
              resolve,
              390
            )
        );

        upgradePanel.hidden = true;
        upgradePanel.classList.remove(
          "installing"
        );

        if (
          result.placement ===
            "reserve"
        ) {
          selectedBuildModule =
            upgrade.id;
          await openBuildManager(
            "post-upgrade"
          );
          return;
        }

        await beginAct();
      }
    );

    upgradeCards.append(button);
  }

  startModulePreviewLoop();
}


async function beginAct() {
  resetWaveState();

  bossState = {
    active:
      runMode !== "practice" &&
      wave === FINAL_ACT,
    health: BOSS_MAX_HEALTH,
    maxHealth: BOSS_MAX_HEALTH,
    broken: false,
    damage: 0,
    hitFlash: 0,
    shieldFlash: 0,
    armor: [false, false, false],
    phase: 1,
    recharged: false
  };

  updateHud();
  lastHudSection = "";
  lastHudProgressBucket = -1;
  trackProgressEl.style.width = "0%";

  const act =
    currentActMeta();

  const bossAct =
    bossState.active;

  showMessage(
    runMode === "practice"
      ? "PRACTICE · TAP + TRACE"
      : bossAct
        ? "ACTO 7 · AURA CORE"
        : `ACTO ${wave} · ${act.name}`,
    bossAct
      ? "#ffdf85"
      : "#fff1a9",
    bossAct
      ? 1100
      : 760
  );

  setOperatorMood(
    bossAct
      ? "boss"
      : "flow",
    0.8
  );
  bumpFeedback(
    bossAct
      ? 4.8
      : 2.4,
    bossAct
      ? 0.13
      : 0.055
  );

  playTone(
    330 + wave * 42,
    0.09,
    0.04,
    "triangle"
  );

  await clock.start();

  runPaused = false;
  pausePanel.hidden = true;
  pauseButton.disabled = false;
  running = true;
  lastFrame = performance.now();
  requestAnimationFrame(frame);
}

function openUpgradePanel() {
  if (awaitingUpgrade) return;

  awaitingUpgrade = true;
  running = false;
  pauseButton.disabled = true;
  clock.stopScheduler();

  active.clear();
  explosions = [];
  impactFlashes = [];

  upgradeTitle.textContent =
    runMode === "daily"
      ? `DAILY · ACTO ${wave}/${runTargetActs()}`
      : `ACTO ${wave}/${runTargetActs()} · ELIGE 1`;

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

function flowRankForRun({
  practice = false,
  bossDamage = 0
} = {}) {
  if (practice) {
    const attempts =
      runStats?.traceAttempts ??
      0;
    const successes =
      runStats?.traceSuccess ??
      0;
    const ratio =
      attempts > 0
        ? successes / attempts
        : 0;

    return ratio >= 0.9
      ? {
          rank: "A",
          label: "LAB LOCKED"
        }
      : ratio >= 0.6
        ? {
            rank: "B",
            label: "LAB STABLE"
          }
        : {
            rank: "C",
            label: "KEEP TUNING"
          };
  }

  const attempts =
    hitCount +
    missCount;
  const accuracy =
    attempts > 0
      ? hitCount / attempts
      : 0;
  const chainQuality =
    clamp(
      chainCount / 9,
      0,
      1
    );
  const comboQuality =
    clamp(
      maxCombo / 26,
      0,
      1
    );
  const bossQuality =
    clamp(
      bossDamage / 100,
      0,
      1
    );

  const quality =
    accuracy * 0.48 +
    chainQuality * 0.20 +
    comboQuality * 0.14 +
    bossQuality * 0.18;

  if (
    quality >= 0.90 &&
    missCount <= 2
  ) {
    return {
      rank: "S",
      label: "FULL BLOOM"
    };
  }

  if (quality >= 0.77) {
    return {
      rank: "A",
      label: "FLOW STATE"
    };
  }

  if (quality >= 0.62) {
    return {
      rank: "B",
      label: "MACHINE HOT"
    };
  }

  if (quality >= 0.46) {
    return {
      rank: "C",
      label: "STABLE GROWTH"
    };
  }

  return {
    rank: "D",
    label: "RECALIBRATE"
  };
}

function completeRun() {
  if (!running) return;

  running = false;
  runPaused = false;
  awaitingUpgrade = false;
  pauseButton.disabled = true;
  clock.stopScheduler();

  const practice =
    runMode === "practice";
  const completedBossDamage =
    practice
      ? 0
      : bossDamagePercent();
  const previousRuns =
    profile.runsCompleted;
  const previousBest =
    Number(profile.bestScore || 0);
  let dailyRecord = false;

  if (!practice) {
    profile.runsCompleted += 1;
    profile.bestScore =
      Math.max(
        previousBest,
        score
      );

    if (runMode === "daily") {
      const key =
        localDateKey();
      const previousDaily =
        Number(
          profile.dailyBest[key] || 0
        );

      if (score > previousDaily) {
        profile.dailyBest[key] = score;
        dailyRecord = true;
      }
    }

    recordLifetimeMetric(
      "runsCompleted",
      1
    );
  } else {
    recordLifetimeMetric(
      "practiceSessions",
      1
    );
  }

  profile.calibrationOffsetMs =
    calibrationOffsetMs;

  saveLocalJson(
    PROFILE_KEY,
    profile
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

  const flowRank =
    flowRankForRun({
      practice,
      bossDamage:
        completedBossDamage
    });

  summaryMachine.textContent =
    MACHINES[
      selectedMachine
    ]?.name ?? "FORGE";
  summaryRank.textContent =
    flowRank.rank;
  summaryRankLabel.textContent =
    flowRank.label;
  summaryRankCard.dataset.rank =
    flowRank.rank;

  summaryScore.textContent =
    String(score);
  summaryHits.textContent =
    String(hitCount);
  summaryChains.textContent =
    String(chainCount);
  summaryMisses.textContent =
    String(missCount);
  summaryBoss.textContent =
    practice
      ? "—"
      : `${completedBossDamage}%`;

  summaryTitle.textContent =
    practice
      ? "PRACTICE COMPLETE"
      : bossState.broken
        ? "AURA CORE ROTO"
        : "MÁQUINA ESTABLE";

  summaryBuild.innerHTML = "";

  const finalCounts =
    buildCounts();

  if (finalCounts.size === 0) {
    const empty =
      document.createElement("span");
    empty.textContent = "SIN MODS";
    summaryBuild.append(empty);
  } else {
    for (const [id, count] of finalCounts) {
      const upgrade =
        upgradeById(id);

      if (!upgrade) continue;

      const chip =
        document.createElement("span");
      chip.textContent =
        `${upgrade.icon} ${upgrade.title} · LV${count}`;
      chip.className =
        `family-${upgrade.family}`;
      summaryBuild.append(chip);
    }

    for (
      const synergy of
      activeBuildSynergies()
    ) {
      const chip =
        document.createElement("span");
      chip.textContent =
        `✦ ${synergy.title}`;
      chip.className =
        "family-chain";
      summaryBuild.append(chip);
    }
  }

  const unlocked =
    practice
      ? []
      : Object.entries(MACHINES)
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
    practice
      ? `SLIDE ${runStats?.traceSuccess ?? 0}/${runStats?.traceAttempts ?? 0}`
      : unlocked.length
        ? `NUEVA MÁQUINA: ${unlocked.join(" · ")}`
        : dailyRecord
          ? `DAILY RECORD · ${localDateKey()}`
          : score > previousBest
            ? "NUEVO MEJOR REGISTRO"
            : "";

  refreshMachineOptions();
  refreshStartMenu();

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
  resolveBossCollisions(songTime);
  resolveProjectileCollisions();
  updateEffects(dt);
  updateLiveHud(songTime);
  render(songTime);

  if (clock.beat >= LOOP_BEATS) {
    if (wave >= runTargetActs()) {
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
  inputType = "unknown"
) {
  if (!running) return;

  triggerFlipper(
    side,
    eventTimestamp,
    inputType
  );
}

function handleSideRelease(
  side
) {
  const control =
    slideControl[side];

  control.held = false;
  control.x = 0;
  control.y = 0;
}


function bindButton(button, side) {
  button.addEventListener(
    "pointerdown",
    (event) => {
      event.preventDefault();
      button.setPointerCapture?.(
        event.pointerId
      );
      pressVisual(
        button,
        true
      );

      handleSidePress(
        side,
        event.timeStamp,
        event.pointerType ||
          "touch"
      );
    }
  );

  const release =
    (event) => {
      event?.preventDefault?.();
      pressVisual(
        button,
        false
      );
      handleSideRelease(
        side
      );
    };

  button.addEventListener(
    "pointerup",
    release
  );
  button.addEventListener(
    "pointercancel",
    release
  );
  button.addEventListener(
    "lostpointercapture",
    release
  );
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
      "left"
    );
  }

  if (key === "d" || event.key === "ArrowRight") {
    pressVisual(rightButton, false);
    handleSideRelease(
      "right"
    );
  }
});

async function startRun(mode = "standard") {
  closeAutoCalibration();
  runMode = mode;
  runPaused = false;
  pausePanel.hidden = true;
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
  resetModuleLoadout();
  announcedSynergies =
    new Set();
  renderBuildVisibility();
  runStats = newRunStats();
  runStartedAt = performance.now();

  lastDeltaMs = null;
  lastJudgement = "—";
  lastInputType = "—";
  message = "";

  rebuildRunMods();
  resetWaveState();

  bossState = {
    active: false,
    health: BOSS_MAX_HEALTH,
    maxHealth: BOSS_MAX_HEALTH,
    broken: false,
    damage: 0,
    hitFlash: 0,
    shieldFlash: 0,
    armor: [false, false, false],
    phase: 1,
    recharged: false
  };

  updateHud();

  startButton.disabled = true;
  dailyButton.disabled = true;
  practiceButton.disabled = true;
  startButton.classList.add(
    "is-loading"
  );
  startButtonLabel.textContent =
    "INICIANDO…";

  upgradePanel.hidden = true;
  buildPanel.hidden = true;
  summaryPanel.hidden = true;

  await ensureChartLoaded();
  buildPaths();

  recordLifetimeMetric(
    mode === "practice"
      ? "practiceStarted"
      : "runsStarted",
    1
  );

  menuSettings.hidden = true;
  startPanel.hidden = true;
  buildDock.hidden = false;
  pauseButton.disabled = false;

  await beginAct();

  startButton.disabled = false;
  dailyButton.disabled = false;
  practiceButton.disabled = false;
  startButton.classList.remove(
    "is-loading"
  );
  startButtonLabel.textContent =
    "INICIAR RUN";
}

menuSettingsButton.addEventListener(
  "click",
  () => {
    menuSettings.hidden = false;
  }
);

menuSettingsClose.addEventListener(
  "click",
  () => {
    menuSettings.hidden = true;
  }
);

startButton.addEventListener(
  "click",
  () => startRun("standard")
);

dailyButton.addEventListener(
  "click",
  () => startRun("daily")
);

practiceButton.addEventListener(
  "click",
  () => startRun("practice")
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
      refreshStartMenu();
      render(clock.songTime);
    }
  );
}

function scheduleCalibrationPulse(
  time,
  index
) {
  if (!clock.context) return null;

  const oscillator =
    clock.context.createOscillator();
  const gain =
    clock.context.createGain();

  oscillator.type =
    index % 2 === 0
      ? "sine"
      : "triangle";
  oscillator.frequency.value =
    index === 7
      ? 1046.5
      : 784;

  gain.gain.setValueAtTime(
    0.0001,
    time
  );
  gain.gain.exponentialRampToValueAtTime(
    0.075,
    time + 0.003
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    time + 0.055
  );

  oscillator.connect(gain);
  gain.connect(
    clock.sfxBus()
  );
  oscillator.start(time);
  oscillator.stop(
    time + 0.06
  );

  return oscillator;
}

function closeAutoCalibration() {
  if (calibrationSession) {
    for (
      const timer of
      calibrationSession.timers
    ) {
      window.clearTimeout(
        timer
      );
    }

    for (
      const oscillator of
      calibrationSession.oscillators
    ) {
      try {
        oscillator.stop();
      } catch {
        // Already stopped.
      }
    }
  }

  calibrationSession = null;
  calibrationPanel.hidden = true;
  calibrationTap.classList.remove(
    "is-pulse"
  );
  calibrationClose.textContent =
    "CANCELAR";
}

async function startAutoCalibration() {
  closeAutoCalibration();

  clock.context ??=
    new AudioContext();
  await clock.context.resume();
  clock.ensureMixGraph();

  const count = 8;
  const interval = 0.64;
  const first =
    clock.context.currentTime +
    1.05;
  const times =
    Array.from(
      { length: count },
      (_, index) =>
        first +
        index * interval
    );
  const timers = [];
  const oscillators = [];

  calibrationSession = {
    times,
    used: new Set(),
    deltas: [],
    timers,
    oscillators,
    complete: false
  };

  calibrationPanel.hidden = false;
  calibrationStatus.textContent =
    `0 / ${count} · ESCUCHA`;
  calibrationClose.textContent =
    "CANCELAR";

  times.forEach(
    (time, index) => {
      const oscillator =
        scheduleCalibrationPulse(
          time,
          index
        );

      if (oscillator) {
        oscillators.push(
          oscillator
        );
      }

      const delay =
        Math.max(
          0,
          (
            time -
            clock.context.currentTime
          ) *
            1000
        );

      timers.push(
        window.setTimeout(
          () => {
            if (
              !calibrationSession ||
              calibrationSession.complete
            ) {
              return;
            }

            calibrationTap.classList.remove(
              "is-pulse"
            );
            void calibrationTap.offsetWidth;
            calibrationTap.classList.add(
              "is-pulse"
            );

            window.setTimeout(
              () =>
                calibrationTap.classList.remove(
                  "is-pulse"
                ),
              125
            );
          },
          delay
        )
      );
    }
  );
}

function recordCalibrationTap() {
  const session =
    calibrationSession;

  if (
    !session ||
    session.complete ||
    !clock.context
  ) {
    return;
  }

  const now =
    clock.context.currentTime;
  let bestIndex = -1;
  let bestDistance =
    Infinity;

  session.times.forEach(
    (time, index) => {
      if (
        session.used.has(
          index
        )
      ) {
        return;
      }

      const distance =
        Math.abs(
          now - time
        );

      if (
        distance <
        bestDistance
      ) {
        bestDistance =
          distance;
        bestIndex =
          index;
      }
    }
  );

  if (
    bestIndex < 0 ||
    bestDistance > 0.32
  ) {
    return;
  }

  session.used.add(
    bestIndex
  );
  session.deltas.push(
    (
      now -
      session.times[bestIndex]
    ) *
      1000
  );

  calibrationStatus.textContent =
    `${session.deltas.length} / ${session.times.length}`;

  if (navigator.vibrate) {
    navigator.vibrate(5);
  }

  if (
    session.deltas.length <
    session.times.length
  ) {
    return;
  }

  session.complete = true;

  const sorted =
    [...session.deltas].sort(
      (a, b) => a - b
    );
  const middle =
    Math.floor(
      sorted.length / 2
    );
  const median =
    (
      sorted[middle - 1] +
      sorted[middle]
    ) /
    2;
  const proposed =
    clamp(
      Math.round(
        -median / 5
      ) * 5,
      -250,
      250
    );

  setCalibration(
    proposed
  );

  calibrationStatus.textContent =
    `MEDIANA ${median >= 0 ? "+" : ""}${Math.round(median)}ms · OFFSET ${proposed >= 0 ? "+" : ""}${proposed}ms`;
  calibrationClose.textContent =
    "LISTO";

  successTone(880);
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

autoCalibration.addEventListener(
  "click",
  () => startAutoCalibration()
);

calibrationTap.addEventListener(
  "pointerdown",
  (event) => {
    event.preventDefault();
    recordCalibrationTap();
  }
);

calibrationClose.addEventListener(
  "click",
  () => closeAutoCalibration()
);

window.addEventListener("resize", () => {
  resizeCanvas();

  if (routes) {
    buildPaths();
  }

  render(clock.songTime);
});

function renderPauseBuild() {
  const counts =
    buildCounts();

  pauseBuildList.innerHTML = "";

  if (counts.size === 0) {
    const empty =
      document.createElement("span");
    empty.className =
      "build-empty";
    empty.textContent =
      "SIN MÓDULOS INSTALADOS";
    pauseBuildList.append(
      empty
    );
  } else {
    for (const [id, count] of counts) {
      const upgrade =
        upgradeById(id);

      if (!upgrade) continue;

      const item =
        document.createElement("div");
      item.className =
        `pause-build-item family-${upgrade.family}`;
      item.innerHTML =
        `<i>${upgrade.icon}</i><strong>${upgrade.title}${count > 1 ? ` ×${count}` : ""}</strong><small>${upgrade.desc}</small>`;
      pauseBuildList.append(
        item
      );
    }
  }

  const synergies =
    activeBuildSynergies();

  pauseSynergy.textContent =
    synergies.length
      ? `SYNERGY · ${synergies.map((item) => item.title).join(" · ")}`
      : "SIN SINERGIA COMPLETA";
}

async function pauseRun() {
  if (
    !running ||
    awaitingUpgrade
  ) {
    return;
  }

  running = false;
  runPaused = true;
  await clock.pause();
  renderPauseBuild();
  render(clock.songTime);
  pausePanel.hidden = false;
}

async function resumeRun() {
  if (!runPaused) return;

  resumeButton.disabled = true;
  resumeButton.textContent =
    "REANUDANDO…";

  await clock.resumePaused();

  runPaused = false;
  pausePanel.hidden = true;
  running = true;
  lastFrame =
    performance.now();

  resumeButton.disabled = false;
  resumeButton.textContent =
    "CONTINUAR";

  requestAnimationFrame(frame);
}

function abandonRun() {
  if (
    !runPaused &&
    !running
  ) {
    return;
  }

  running = false;
  runPaused = false;
  awaitingUpgrade = false;
  clock.stopScheduler();

  active.clear();
  resolved.clear();
  explosions = [];
  impactFlashes = [];

  pausePanel.hidden = true;
  buildPanel.hidden = true;
  upgradePanel.hidden = true;
  summaryPanel.hidden = true;
  buildDock.hidden = true;
  menuSettings.hidden = true;
  startPanel.hidden = false;
  refreshStartMenu();

  score = 0;
  combo = 0;
  updateHud();
  render(clock.songTime);
}

buildButton.addEventListener(
  "click",
  () => openBuildManager("run")
);

upgradeManageButton.addEventListener(
  "click",
  () => openBuildManager("upgrade")
);

buildCloseButton.addEventListener(
  "click",
  () => closeBuildManager()
);

pauseButton.addEventListener(
  "click",
  () => pauseRun()
);

document.addEventListener(
  "visibilitychange",
  async () => {
    if (
      document.hidden &&
      running
    ) {
      await pauseRun();
      return;
    }

    if (
      !document.hidden &&
      runPaused
    ) {
      renderPauseBuild();
      pausePanel.hidden = false;
    }
  }
);

resumeButton.addEventListener(
  "click",
  () => resumeRun()
);

abandonButton.addEventListener(
  "click",
  () => abandonRun()
);

refreshMachineOptions();
refreshStartMenu();
pauseButton.disabled = true;
buildDock.hidden = true;
renderBuildVisibility();
setCalibration(
  calibrationOffsetMs
);
resizeCanvas();
buildPaths();
updateHud();
render(clock.songTime);
