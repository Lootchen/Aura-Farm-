import { loadGameChart } from "./chart.js?v=0.20";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startPanel = document.querySelector("#startPanel");
const startButton = document.querySelector("#startButton");
const leftButton = document.querySelector("#leftButton");
const rightButton = document.querySelector("#rightButton");
const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const lastHitEl = document.querySelector("#lastHit");
const upgradePanel = document.querySelector("#upgradePanel");
const upgradeTitle = document.querySelector("#upgradeTitle");
const upgradeCards = document.querySelector("#upgradeCards");

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
  nodeBeats: 0.5
};

const POWER_ORB_BASE_SCALE = 1.55;

const BUMPER_LAYOUT = [
  { x: 270, y: 535, radius: 31 },
  { x: 185, y: 430, radius: 27 },
  { x: 355, y: 430, radius: 27 }
];

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
    const barBeat = ((beat % 4) + 4) % 4;

    this.scheduleHat(time, 0.018);

    if (Math.abs(barBeat - 0) < 0.001 || Math.abs(barBeat - 2) < 0.001) {
      this.scheduleKick(time);
    }

    if (Math.abs(barBeat - 1) < 0.001 || Math.abs(barBeat - 3) < 0.001) {
      this.scheduleSnare(time);
    }

    if (Number.isInteger(beat)) {
      this.scheduleBass(time, beat);
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
let calibrationOffsetMs = 0;
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
  comboShieldCharges: 0
};

const UPGRADES = [
  {
    id: "twin-shot",
    icon: "Ⅱ",
    title: "Gemela",
    effect: "+1 ORB",
    apply: () => {
      runMods.twinShots += 1;
    }
  },
  {
    id: "ricochet",
    icon: "↗",
    title: "Rebote",
    effect: "+1 REBOTE",
    apply: () => {
      runMods.ricochetBounces += 1;
    }
  },
  {
    id: "pierce",
    icon: "➞",
    title: "Perfora",
    effect: "+1 BLANCO",
    apply: () => {
      runMods.pierceHits += 1;
    }
  },
  {
    id: "fragments",
    icon: "✣",
    title: "Astillas",
    effect: "+FRAGMENTOS",
    apply: () => {
      runMods.fragmentCount += runMods.fragmentCount === 0 ? 3 : 2;
    }
  },
  {
    id: "bumper",
    icon: "◉",
    title: "Bumper",
    effect: "+OBSTÁCULO",
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
    icon: "✹",
    title: "Nova",
    effect: "+2 POWER",
    apply: () => {
      runMods.slideNova += 1;
    }
  },
  {
    id: "combo-shield",
    icon: "◇",
    title: "Shield",
    effect: "SALVA 1",
    apply: () => {
      runMods.comboShieldCharges += 1;
    }
  }
];

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

  const chartUrl = new URL("../charts/tap-lab.json?v=0.21", import.meta.url);
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
          started: false,
          goodTime: 0,
          trackingTime: 0,
          lastGoodTime: -Infinity,
          startDelta: null,
          lastErrorPx: Infinity
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
        slideControl[side]
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
        awardScore(100 * comboMultiplier(combo));
        showMessage(
          pierces ? "CHAIN · PERFORA" : "CHAIN +100",
          "#ffe985",
          300
        );
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

      const powerScale =
        projectile.power || other.power
          ? 1.65
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

      updateHud();

      if (!active.has(projectile.key)) break;
    }
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
        note.power ? 1.65 : 1,
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
  if (!event || event.side !== side) return false;

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
  if (!event.started) {
    event.started = true;
    event.startDelta = songTime - event.targetTime;
    event.lastGoodTime = songTime;

    const receiver = slideTipPoint(
      side,
      slideVectorAtBeat(event, 0)
    );

    createImpactFlash(
      receiver.x,
      receiver.y,
      JUDGEMENTS.perfect
    );

    showMessage(
      "SLIDE · ARRASTRA EL PULGAR",
      "#fff1a9",
      520
    );

    successTone(620);

    if (navigator.vibrate) {
      navigator.vibrate(6);
    }
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
      slideControl[event.side]
    ).tip;

  return Math.hypot(
    actual.x - target.x,
    actual.y - target.y
  );
}

function slideConnected(event, songTime) {
  if (!event.started) return false;

  const control = slideControl[event.side];
  const error = slideTipErrorPx(event, songTime);
  event.lastErrorPx = error;

  if (
    control.held &&
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
    slideControl[event.side].held &&
    slideTipErrorPx(event, songTime) <=
      slideTolerance()
  );
}

function drawSlideGate(
  point,
  angle,
  connected
) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(angle);

  ctx.shadowBlur = connected ? 22 : 12;
  ctx.shadowColor =
    connected ? "#fff1a9" : "#ff8c9b";
  ctx.strokeStyle =
    connected ? "#fff1a9" : "#ff8c9b";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.arc(
    0,
    0,
    11,
    -Math.PI * 0.72,
    Math.PI * 0.72
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-3, -15);
  ctx.lineTo(8, -7);
  ctx.moveTo(-3, 15);
  ctx.lineTo(8, 7);
  ctx.stroke();

  ctx.restore();
}

function drawSlide(event, songTime) {
  ctx.save();

  const sideColor =
    event.side === "left"
      ? "#6ed7ff"
      : "#d88bff";

  if (!event.started) {
    const distance =
      event.path.length -
      NOTE_SPEED * (event.targetTime - songTime);
    const head =
      pointAtDistance(event.path, distance);
    const behind =
      pointAtDistance(
        event.path,
        Math.max(0, distance - 72)
      );

    ctx.strokeStyle =
      event.side === "left"
        ? "rgba(110,215,255,.36)"
        : "rgba(216,139,255,.36)";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(behind.x, behind.y);
    ctx.stroke();

    drawSlideOrb(
      head.x,
      head.y,
      event.side,
      24,
      1,
      false
    );

    const preview = [];
    for (
      let beat = 0;
      beat <= event.durationBeats + 0.001;
      beat += 0.12
    ) {
      preview.push(
        slideTipPoint(
          event.side,
          slideVectorAtBeat(event, beat)
        )
      );
    }

    if (preview.length > 1) {
      ctx.strokeStyle =
        event.side === "left"
          ? "rgba(110,215,255,.18)"
          : "rgba(216,139,255,.18)";
      ctx.lineWidth = slideTolerance() * 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      preview.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,.30)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      preview.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    ctx.restore();
    return;
  }

  const beatLength = beatToSeconds(1);
  const currentBeat = clamp(
    (songTime - event.targetTime) / beatLength,
    0,
    event.durationBeats
  );
  const futureBeat =
    Math.min(
      event.durationBeats,
      currentBeat + 3.0
    );
  const connected =
    slideVisualConnected(event, songTime);

  const rail = [];
  for (
    let beat = currentBeat;
    beat <= futureBeat + 0.001;
    beat += 0.08
  ) {
    const vector =
      slideVectorAtBeat(event, beat);
    rail.push({
      beat,
      vector,
      ...slideSegmentFromVector(
        event.side,
        vector
      ).tip
    });
  }

  if (rail.length === 1) {
    const vector =
      slideVectorAtBeat(
        event,
        Math.min(event.durationBeats, currentBeat + 0.01)
      );
    rail.push({
      beat: currentBeat + 0.01,
      vector,
      ...slideSegmentFromVector(
        event.side,
        vector
      ).tip
    });
  }

  if (rail.length > 1) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle =
      connected
        ? "rgba(255,241,169,.26)"
        : "rgba(255,113,132,.20)";
    ctx.lineWidth = slideTolerance() * 2;
    ctx.beginPath();
    rail.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    ctx.shadowBlur = connected ? 18 : 8;
    ctx.shadowColor =
      connected ? "#fff1a9" : sideColor;
    ctx.strokeStyle =
      connected
        ? "#fff1a9"
        : sideColor;
    ctx.globalAlpha =
      connected ? 0.92 : 0.72;
    ctx.lineWidth = 6;
    ctx.beginPath();
    rail.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  for (
    let beat =
      Math.ceil(currentBeat / SLIDE.nodeBeats) *
      SLIDE.nodeBeats;
    beat <= futureBeat + 0.001;
    beat += SLIDE.nodeBeats
  ) {
    const vector =
      slideVectorAtBeat(event, beat);
    const point =
      slideTipPoint(event.side, vector);

    ctx.fillStyle =
      connected
        ? "rgba(255,241,169,.72)"
        : event.side === "left"
          ? "rgba(110,215,255,.60)"
          : "rgba(216,139,255,.60)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const targetVector =
    slideVectorAtTime(event, songTime);
  const targetSegment =
    slideSegmentFromVector(
      event.side,
      targetVector
    );

  ctx.strokeStyle =
    connected
      ? "rgba(255,241,169,.46)"
      : "rgba(255,113,132,.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(
    targetSegment.tip.x,
    targetSegment.tip.y,
    slideTolerance(),
    0,
    Math.PI * 2
  );
  ctx.stroke();

  drawSlideGate(
    targetSegment.tip,
    targetSegment.angle,
    connected
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

  explosions = explosions.filter(
    (explosion) => explosion.life < explosion.duration
  );

  impactFlashes = impactFlashes.filter(
    (flash) => flash.life < flash.duration
  );
}

function updateHud() {
  scoreEl.textContent = String(score);
  comboEl.textContent =
    combo ? `${combo} · x${comboMultiplier(combo)}` : "0";

  lastHitEl.textContent =
    lastDeltaMs === null
      ? lastJudgement
      : `${lastJudgement} ${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`;
}

function drawBackground() {
  ctx.fillStyle = "#0a1020";
  ctx.fillRect(0, 0, DESIGN.width, DESIGN.height);

  ctx.fillStyle = "rgba(255,255,255,.13)";

  for (let i = 0; i < 28; i += 1) {
    const x = (((i * 73) % 521) / 521) * DESIGN.width;
    const y = (((i * 113) % 601) / 601) * DESIGN.height * 0.60;
    ctx.fillRect(x, y, 1.15, 1.15);
  }
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
  const slideActive = Boolean(slide?.started);
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

  ctx.strokeStyle = left
    ? "rgba(122,211,255,.20)"
    : "rgba(211,166,255,.20)";
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

  drawControlButton(side, songTime);

  ctx.save();

  const slideActive =
    Boolean(slide?.started);

  ctx.shadowBlur =
    phase.attack || slideActive
      ? 22
      : 6;

  ctx.shadowColor =
    phase.attack || slideActive
      ? "#fff0a3"
      : "#79cfff";

  ctx.strokeStyle =
    phase.attack || slideActive
      ? "#fff0a3"
      : phase.active
        ? "#f2fbff"
        : "#cfe9ff";

  ctx.lineWidth =
    phase.attack || slideActive
      ? FLIPPER.width + 5
      : FLIPPER.width;

  ctx.lineCap = "round";
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
  ctx.fillStyle =
    slideActive || phase.active
      ? "#243a51"
      : "#132238";

  ctx.beginPath();
  ctx.arc(
    segment.pivot.x,
    segment.pivot.y,
    11,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.shadowBlur =
    phase.attack || slideActive
      ? 20
      : 8;

  ctx.shadowColor =
    phase.attack || slideActive
      ? "#ffe985"
      : "#9edcff";

  ctx.fillStyle =
    phase.attack || slideActive
      ? "#ffe985"
      : "#9edcff";

  ctx.beginPath();
  ctx.arc(
    segment.tip.x,
    segment.tip.y,
    phase.attack || slideActive
      ? 10
      : 7,
    0,
    Math.PI * 2
  );
  ctx.fill();

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
    `LAB v0.21 · ${chartName} · BPM ${BPM} · beat ${loopBeat.toFixed(2)}`,
    `tap ${NOTE_SPEED}px/s CONSTANTE · projectile ${POST_HIT_SPEED}px/s`,
    `tap contacto · slide riel físico · wave ${wave} · upgrades físicos`,
    `hits ${hitCount} miss ${missCount} chain ${chainCount} choque ${collisionCount} pared ${wallExplosionCount}`,
    `stick L:${slideControl.left.x.toFixed(2)},${slideControl.left.y.toFixed(2)} R:${slideControl.right.x.toFixed(2)},${slideControl.right.y.toFixed(2)}`,
    `input ${lastInputType} · offset ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`,
    `FPS ${fps.toFixed(0)} · multi x${comboMultiplier(combo)}`
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
  drawBumpers();

  for (const event of active.values()) {
    if (event.type === "slide") {
      drawSlide(event, songTime);
    }
  }

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
  const pool = UPGRADES.filter((upgrade) => !upgrade.available || upgrade.available());

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, 3);
}

function renderUpgradeChoices() {
  const choices = pickUpgradeChoices();

  upgradeCards.innerHTML = "";

  for (const upgrade of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "upgrade-card";
    button.innerHTML =
      `<span class="upgrade-icon" aria-hidden="true">${upgrade.icon}</span><strong>${upgrade.title}</strong><span class="upgrade-effect">${upgrade.effect}</span>`;

    button.addEventListener("click", async () => {
      if (!awaitingUpgrade) return;

      awaitingUpgrade = false;
      upgrade.apply();
      wave += 1;

      upgradePanel.hidden = true;
      resetWaveState();

      showMessage(
        `${upgrade.title.toUpperCase()} · OLEADA ${wave}`,
        "#fff1a9",
        800
      );

      await clock.start();

      running = true;
      lastFrame = performance.now();
      requestAnimationFrame(frame);
    });

    upgradeCards.append(button);
  }
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
    "ELIGE 1";

  render(clock.songTime);
  renderUpgradeChoices();
  upgradePanel.hidden = false;
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
    fps += ((1 / dt) - fps) * 0.08;
  }

  const songTime = clock.songTime;

  spawnReady(songTime);
  updateEvents(dt, songTime);
  resolveFlipperCollisions(songTime);
  resolveBumperCollisions();
  resolveProjectileCollisions();
  updateEffects(dt);
  render(songTime);

  if (clock.beat >= LOOP_BEATS) {
    openUpgradePanel();
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

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  const key = event.key.toLowerCase();

  if (key === "h") {
    showDebug = !showDebug;
    return;
  }

  if (key === "[") {
    calibrationOffsetMs = clamp(
      calibrationOffsetMs - 5,
      -200,
      200
    );

    showMessage(
      `OFFSET ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`,
      "#79d8ff",
      500
    );

    return;
  }

  if (key === "]") {
    calibrationOffsetMs = clamp(
      calibrationOffsetMs + 5,
      -200,
      200
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

startButton.addEventListener("click", async () => {
  score = 0;
  combo = 0;
  hitCount = 0;
  missCount = 0;
  chainCount = 0;
  collisionCount = 0;
  wallExplosionCount = 0;
  wave = 1;
  awaitingUpgrade = false;

  lastDeltaMs = null;
  lastJudgement = "—";
  lastInputType = "—";
  message = "";

  resetRunMods();
  resetWaveState();

  updateHud();

  startButton.disabled = true;
  startButton.textContent = "INICIANDO…";

  upgradePanel.hidden = true;

  await ensureChartLoaded();
  buildPaths();
  await clock.start();

  running = true;
  lastFrame = performance.now();
  startPanel.hidden = true;

  requestAnimationFrame(frame);
});

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

resizeCanvas();
buildPaths();
updateHud();
render(clock.songTime);
