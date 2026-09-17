import { loadGameChart } from "./chart.js?v=0.11";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startPanel = document.querySelector("#startPanel");
const startButton = document.querySelector("#startButton");
const leftButton = document.querySelector("#leftButton");
const rightButton = document.querySelector("#rightButton");
const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const lastHitEl = document.querySelector("#lastHit");

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

const TAP_WINDOWS = {
  perfect: 0.045,
  great: 0.090,
  good: 0.160
};

const DRAW_WINDOWS = {
  perfect: 0.150,
  great: 0.280,
  good: 0.550
};

const JUDGEMENTS = {
  perfect: { label: "PERFECT", points: 300, color: "#ffe47a" },
  great: { label: "GREAT", points: 200, color: "#ca8cff" },
  good: { label: "GOOD", points: 100, color: "#79d8ff" }
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
  leadSeconds: 1.35,
  startEarly: 0.26,
  startLate: 0.34,
  radius: 62,
  endGrace: 0.24,
  minCoverage: 0.68
};

const DRAW = {
  leadSeconds: 1.85,
  recognitionThreshold: 0.72,
  minPoints: 8
};

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
let slidePaths = null;
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

let slidePointer = null;
let drawGesture = null;

const flippers = {
  left: { startTime: -Infinity, hitThisSwing: false },
  right: { startTime: -Infinity, hitThisSwing: false }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

function beatToSeconds(beat) {
  return beat * (60 / BPM);
}

function loopDuration() {
  return beatToSeconds(LOOP_BEATS);
}

async function ensureChartLoaded() {
  if (chartLoaded) return;

  const chartUrl = new URL("../charts/tap-lab.json?v=0.11", import.meta.url);
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
  const leftPivot = { x: 118, y: 768 };
  const rightPivot = { x: 422, y: 768 };

  const leftRest = -0.22;
  const leftStrike = -1.12;
  const rightRest = Math.PI + 0.22;
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

  slidePaths = {
    "arc-left": makePath(
      { x: 128, y: 610 },
      { x: 152, y: 440 },
      { x: 366, y: 430 },
      { x: 404, y: 620 }
    ),
    "arc-right": makePath(
      { x: 410, y: 600 },
      { x: 348, y: 440 },
      { x: 180, y: 458 },
      { x: 132, y: 620 }
    ),
    wave: makePath(
      { x: 128, y: 610 },
      { x: 220, y: 470 },
      { x: 320, y: 720 },
      { x: 410, y: 570 }
    )
  };
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

function judgementFor(errorSeconds, windows = TAP_WINDOWS) {
  const error = Math.abs(errorSeconds);

  if (error <= windows.perfect) return JUDGEMENTS.perfect;
  if (error <= windows.great) return JUDGEMENTS.great;
  if (error <= windows.good) return JUDGEMENTS.good;

  return null;
}

function spawnReady(songTime) {
  const duration = loopDuration();
  const currentLoop = songTime < 0 ? 0 : Math.floor(songTime / duration);
  const loops = currentLoop === 0 ? [0, 1] : [currentLoop, currentLoop + 1];

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
        expireAt = targetTime + TAP_WINDOWS.good + 0.22;
      } else if (event.type === "slide") {
        lead = SLIDE.leadSeconds;
        expireAt = targetTime + beatToSeconds(event.durationBeats) + SLIDE.endGrace;
      } else if (event.type === "draw") {
        lead = DRAW.leadSeconds;
        expireAt = targetTime + DRAW_WINDOWS.good;
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
        active.set(key, {
          key,
          loop,
          ...event,
          targetTime,
          endTime: targetTime + beatToSeconds(event.durationBeats),
          pathObject: slidePaths[event.path],
          trackingTime: 0,
          goodTime: 0,
          lastDistance: Infinity
        });
      }

      if (event.type === "draw") {
        active.set(key, {
          key,
          loop,
          ...event,
          targetTime
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

  return {
    pivot,
    tip: {
      x: pivot.x + Math.cos(phase.angle) * FLIPPER.length,
      y: pivot.y + Math.sin(phase.angle) * FLIPPER.length
    },
    phase
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
  const bonus =
    judgement === JUDGEMENTS.perfect
      ? 150
      : judgement === JUDGEMENTS.great
        ? 80
        : 25;

  playTone(
    base + bonus,
    0.055,
    judgement === JUDGEMENTS.perfect ? 0.075 : 0.055,
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

function resolveTapHit(note, side, songTime) {
  const delta = songTime - note.targetTime;
  const judgement = judgementFor(delta);

  if (!judgement) return false;

  const deltaMs = Math.round(delta * 1000);

  combo += 1;
  const multiplier = comboMultiplier(combo);

  score += judgement.points * multiplier;
  hitCount += 1;

  lastDeltaMs = deltaMs;
  lastJudgement = judgement.label;

  note.launched = true;
  note.prevX = note.x;
  note.prevY = note.y;

  const direction = side === "left" ? 1 : -1;
  const vertical = -1;
  const vectorLength = Math.hypot(direction, vertical) || 1;

  note.vx = (direction / vectorLength) * POST_HIT_SPEED;
  note.vy = (vertical / vectorLength) * POST_HIT_SPEED;

  resolved.add(note.key);
  flippers[side].hitThisSwing = true;

  const contact = flipperSegment(side, songTime).tip;
  createImpactFlash(contact.x, contact.y, judgement);

  showMessage(
    `${judgement.label} · ${deltaMs >= 0 ? "+" : ""}${deltaMs}ms · x${multiplier}`,
    judgement.color
  );

  hitSound(side, judgement);

  if (navigator.vibrate) {
    navigator.vibrate(judgement === JUDGEMENTS.perfect ? 8 : 5);
  }

  updateHud();
  return true;
}

function failEvent(event, label = "MISS") {
  combo = 0;
  missCount += 1;
  lastDeltaMs = null;
  lastJudgement = label;

  active.delete(event.key);
  resolved.add(event.key);

  showMessage(label, "#ff7184", 360);

  if (navigator.vibrate) navigator.vibrate(12);

  updateHud();
}

function resolveFlipperCollisions(songTime) {
  for (const side of ["left", "right"]) {
    const state = flippers[side];
    const segment = flipperSegment(side, songTime);

    if (!segment.phase.attack || state.hitThisSwing) continue;

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
      if (
        Math.abs(songTime - note.targetTime) >
        TAP_WINDOWS.good + 0.035
      ) {
        continue;
      }

      const distance = distancePointToSegment(
        note,
        segment.pivot,
        segment.tip
      );

      const collisionDistance =
        NOTE_RADIUS + FLIPPER.width * 0.5;

      if (
        distance <= collisionDistance &&
        resolveTapHit(note, side, songTime)
      ) {
        break;
      }
    }
  }
}

function createExplosion(x, y) {
  explosions.push({
    x,
    y,
    life: 0,
    duration: 0.28,
    particles: Array.from({ length: 7 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 7;

      return {
        angle,
        speed: 70 + index * 8
      };
    })
  });

  if (explosions.length > 12) explosions.shift();

  explosionSound();
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
  const collisionRadius = NOTE_RADIUS * 2.15;

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

      active.delete(projectile.key);
      active.delete(other.key);

      if (chain) {
        resolved.add(other.key);
        chainCount += 1;
        score += 100 * comboMultiplier(combo);
        showMessage("CHAIN +100", "#ffe985", 300);
      } else {
        collisionCount += 1;
        score += 50 * comboMultiplier(combo);
        showMessage("COLISIÓN +50", "#ffffff", 260);
      }

      createExplosion(collision.x, collision.y);
      updateHud();
      break;
    }
  }
}

function updateTap(note, dt, songTime) {
  if (note.launched) {
    note.prevX = note.x;
    note.prevY = note.y;

    note.x += note.vx * dt;
    note.y += note.vy * dt;

    const hitWall =
      note.x <= NOTE_RADIUS ||
      note.x >= DESIGN.width - NOTE_RADIUS ||
      note.y <= 72 ||
      note.y >= DESIGN.height - NOTE_RADIUS;

    if (hitWall) {
      active.delete(note.key);
      wallExplosionCount += 1;

      createExplosion(
        clamp(note.x, NOTE_RADIUS, DESIGN.width - NOTE_RADIUS),
        clamp(note.y, 72, DESIGN.height - NOTE_RADIUS)
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

  if (songTime - note.targetTime > TAP_WINDOWS.good) {
    failEvent(note, "MISS");
  }
}

function activeSlideCandidate(songTime, point) {
  return [...active.values()]
    .filter((event) => event.type === "slide")
    .map((event) => {
      const start = event.pathObject.points[0];
      const distance = Math.hypot(point.x - start.x, point.y - start.y);

      return {
        event,
        distance,
        timeDelta: songTime - event.targetTime
      };
    })
    .filter(
      ({ distance, timeDelta }) =>
        distance <= 64 &&
        timeDelta >= -SLIDE.startEarly &&
        timeDelta <= SLIDE.startLate
    )
    .sort((a, b) => a.distance - b.distance)[0]?.event ?? null;
}

function beginSlide(event, pointerId, point) {
  slidePointer = {
    key: event.key,
    pointerId,
    x: point.x,
    y: point.y
  };

  event.goodTime = 0;
  event.trackingTime = 0;
  event.lastDistance = 0;

  canvas.setPointerCapture?.(pointerId);
  showMessage("SLIDE", "#9edcff", 260);
}

function updateSlideTracking(event, dt, songTime) {
  if (!slidePointer || slidePointer.key !== event.key) return;

  if (songTime < event.targetTime || songTime > event.endTime) return;

  const progress = clamp(
    (songTime - event.targetTime) /
    Math.max(0.001, event.endTime - event.targetTime),
    0,
    1
  );

  const expected = pointAtDistance(
    event.pathObject,
    event.pathObject.length * progress
  );

  const distance = Math.hypot(
    slidePointer.x - expected.x,
    slidePointer.y - expected.y
  );

  event.lastDistance = distance;
  event.trackingTime += dt;

  if (distance <= SLIDE.radius) {
    event.goodTime += dt;
  }
}

function finishSlide(event, songTime, point) {
  const releaseDelta = songTime - event.endTime;
  const duration = Math.max(0.001, event.endTime - event.targetTime);
  const coverage = event.goodTime / duration;
  const endPoint = event.pathObject.points.at(-1);
  const endDistance = Math.hypot(point.x - endPoint.x, point.y - endPoint.y);

  const success =
    Math.abs(releaseDelta) <= SLIDE.endGrace &&
    coverage >= SLIDE.minCoverage &&
    endDistance <= 82;

  slidePointer = null;

  if (!success) {
    showMessage("SLIDE FALLÓ", "#ff7184", 360);
    return;
  }

  let judgement = JUDGEMENTS.good;

  if (coverage >= 0.91 && Math.abs(releaseDelta) <= 0.10) {
    judgement = JUDGEMENTS.perfect;
  } else if (coverage >= 0.80 && Math.abs(releaseDelta) <= 0.17) {
    judgement = JUDGEMENTS.great;
  }

  combo += 1;
  score += (judgement.points + 120) * comboMultiplier(combo);
  lastJudgement = `SLIDE ${judgement.label}`;
  lastDeltaMs = Math.round(releaseDelta * 1000);

  active.delete(event.key);
  resolved.add(event.key);

  showMessage(
    `SLIDE ${judgement.label} · ${Math.round(coverage * 100)}%`,
    judgement.color,
    520
  );

  successTone(760);

  if (navigator.vibrate) navigator.vibrate(9);

  updateHud();
}

function drawTemplate(symbol) {
  if (symbol === "u") {
    return [
      { x: 0.12, y: 0.08 },
      { x: 0.12, y: 0.62 },
      { x: 0.20, y: 0.83 },
      { x: 0.38, y: 0.94 },
      { x: 0.60, y: 0.94 },
      { x: 0.80, y: 0.83 },
      { x: 0.88, y: 0.62 },
      { x: 0.88, y: 0.08 }
    ];
  }

  if (symbol === "l") {
    return [
      { x: 0.20, y: 0.06 },
      { x: 0.20, y: 0.35 },
      { x: 0.20, y: 0.65 },
      { x: 0.20, y: 0.92 },
      { x: 0.48, y: 0.92 },
      { x: 0.76, y: 0.92 },
      { x: 0.90, y: 0.92 }
    ];
  }

  return [
    { x: 0.10, y: 0.10 },
    { x: 0.42, y: 0.10 },
    { x: 0.88, y: 0.10 },
    { x: 0.66, y: 0.38 },
    { x: 0.42, y: 0.66 },
    { x: 0.12, y: 0.92 },
    { x: 0.50, y: 0.92 },
    { x: 0.90, y: 0.92 }
  ];
}

function resamplePolyline(points, count) {
  if (points.length < 2) return points.slice();

  const distances = [0];

  for (let i = 1; i < points.length; i += 1) {
    distances.push(
      distances[i - 1] +
      Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y
      )
    );
  }

  const total = distances.at(-1);

  if (total <= 0.001) {
    return Array.from({ length: count }, () => ({ ...points[0] }));
  }

  const result = [];

  for (let i = 0; i < count; i += 1) {
    const target = (total * i) / (count - 1);
    let index = 1;

    while (index < distances.length && distances[index] < target) {
      index += 1;
    }

    const a = points[index - 1];
    const b = points[Math.min(index, points.length - 1)];
    const start = distances[index - 1];
    const end = distances[Math.min(index, distances.length - 1)];
    const span = Math.max(0.0001, end - start);
    const t = (target - start) / span;

    result.push({
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t)
    });
  }

  return result;
}

function normalizeGesture(points) {
  const sampled = resamplePolyline(points, 32);
  const xs = sampled.map((point) => point.x);
  const ys = sampled.map((point) => point.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return sampled.map((point) => ({
    x: (point.x - minX) / width,
    y: (point.y - minY) / height
  }));
}

function gestureScore(points, template) {
  if (points.length < DRAW.minPoints) return 0;

  const gesture = normalizeGesture(points);
  const target = resamplePolyline(template, 32);

  const compare = (candidate) => {
    let distance = 0;

    for (let i = 0; i < candidate.length; i += 1) {
      distance += Math.hypot(
        candidate[i].x - target[i].x,
        candidate[i].y - target[i].y
      );
    }

    const mean = distance / candidate.length;
    return clamp(1 - mean / 0.82, 0, 1);
  };

  return Math.max(
    compare(gesture),
    compare([...gesture].reverse())
  );
}

function activeDrawCandidate(songTime) {
  return [...active.values()]
    .filter((event) => event.type === "draw")
    .filter(
      (event) =>
        songTime >= event.targetTime - DRAW.leadSeconds &&
        songTime <= event.targetTime + DRAW_WINDOWS.good
    )
    .sort(
      (a, b) =>
        Math.abs(a.targetTime - songTime) -
        Math.abs(b.targetTime - songTime)
    )[0] ?? null;
}

function beginDraw(event, pointerId, point) {
  drawGesture = {
    key: event.key,
    pointerId,
    points: [point]
  };

  canvas.setPointerCapture?.(pointerId);
}

function finishDraw(event, songTime) {
  const points = drawGesture?.points ?? [];
  const scoreValue = gestureScore(points, drawTemplate(event.symbol));
  const timingDelta = songTime - event.targetTime;
  const judgement = judgementFor(timingDelta, DRAW_WINDOWS);

  drawGesture = null;

  if (scoreValue < DRAW.recognitionThreshold || !judgement) {
    showMessage(
      scoreValue < DRAW.recognitionThreshold
        ? "TRAZO NO RECONOCIDO"
        : "FUERA DE TIEMPO",
      "#ff9da9",
      360
    );
    return;
  }

  combo += 1;
  score += (judgement.points + 150) * comboMultiplier(combo);
  lastJudgement = `MAGIC ${event.symbol.toUpperCase()}`;
  lastDeltaMs = Math.round(timingDelta * 1000);

  active.delete(event.key);
  resolved.add(event.key);

  const constellation = constellationPoints(event.symbol);

  for (const point of constellation) {
    createExplosion(point.x, point.y);
  }

  showMessage(
    `MAGIC ${event.symbol.toUpperCase()} · ${judgement.label} · ${Math.round(scoreValue * 100)}%`,
    judgement.color,
    560
  );

  successTone(860);

  if (navigator.vibrate) navigator.vibrate([5, 25, 5]);

  updateHud();
}

function constellationPoints(symbol) {
  const template = resamplePolyline(drawTemplate(symbol), 8);

  return template.map((point) => ({
    x: 190 + point.x * 160,
    y: 300 + point.y * 145
  }));
}

function updateEvents(dt, songTime) {
  for (const event of [...active.values()]) {
    if (event.type === "tap") {
      updateTap(event, dt, songTime);
      continue;
    }

    if (event.type === "slide") {
      updateSlideTracking(event, dt, songTime);

      if (
        songTime > event.endTime + SLIDE.endGrace &&
        active.has(event.key)
      ) {
        if (slidePointer?.key === event.key) slidePointer = null;
        failEvent(event, "SLIDE MISS");
      }

      continue;
    }

    if (
      event.type === "draw" &&
      songTime > event.targetTime + DRAW_WINDOWS.good
    ) {
      if (drawGesture?.key === event.key) drawGesture = null;
      failEvent(event, "MAGIC MISS");
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

    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(note.x, note.y);
    ctx.lineTo(note.x - ux * 30, note.y - uy * 30);
    ctx.stroke();
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

  ctx.save();
  ctx.translate(note.x, note.y);

  if (note.launched) {
    ctx.rotate(Math.atan2(note.vy, note.vx) + Math.PI / 2);
  }

  ctx.fillStyle =
    note.side === "left"
      ? "#6ed7ff"
      : "#d88bff";

  ctx.beginPath();
  ctx.arc(0, 0, NOTE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#08101d";
  ctx.font = "900 25px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(note.symbol || "♪", 0, 1);

  ctx.restore();
}

function drawFingerprint(cx, cy, side, activeState) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.strokeStyle =
    side === "left"
      ? `rgba(157,227,255,${activeState ? .92 : .54})`
      : `rgba(228,196,255,${activeState ? .92 : .54})`;

  ctx.lineWidth = activeState ? 3 : 2;
  ctx.lineCap = "round";

  const rings = [
    { rx: 32, ry: 43 },
    { rx: 24, ry: 34 },
    { rx: 16, ry: 25 },
    { rx: 8, ry: 15 }
  ];

  for (const ring of rings) {
    ctx.beginPath();
    ctx.ellipse(
      0,
      2,
      ring.rx,
      ring.ry,
      0,
      Math.PI * 0.16,
      Math.PI * 0.84
    );
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-28, 23);
  ctx.quadraticCurveTo(-8, 48, 0, 49);
  ctx.quadraticCurveTo(8, 48, 28, 23);
  ctx.stroke();

  ctx.restore();
}

function drawControlModule(side, songTime) {
  const m = view();
  const pivot = m.pivot[side];
  const phase = flipperPhase(side, songTime);
  const left = side === "left";

  const x0 = left ? 16 : 316;
  const x1 = left ? 224 : 524;
  const neckLeft = left ? 94 : 400;
  const neckRight = left ? 142 : 448;
  const shoulderY = 822;
  const bottomY = 950;

  ctx.save();

  ctx.shadowBlur = phase.active ? 22 : 9;
  ctx.shadowColor = left
    ? "rgba(89,197,255,.36)"
    : "rgba(196,121,255,.32)";

  ctx.beginPath();

  if (left) {
    ctx.moveTo(neckLeft, pivot.y + 8);
    ctx.bezierCurveTo(94, 792, 74, 807, 54, shoulderY);
    ctx.bezierCurveTo(30, 836, x0, 856, x0, 882);
    ctx.lineTo(x0, 914);
    ctx.quadraticCurveTo(x0, bottomY, 52, bottomY);
    ctx.lineTo(188, bottomY);
    ctx.quadraticCurveTo(x1, bottomY, x1, 914);
    ctx.lineTo(x1, 870);
    ctx.bezierCurveTo(x1, 842, 204, 827, 180, shoulderY);
    ctx.bezierCurveTo(158, 815, 145, 798, neckRight, pivot.y + 8);
  } else {
    ctx.moveTo(neckLeft, pivot.y + 8);
    ctx.bezierCurveTo(397, 798, 384, 815, 360, shoulderY);
    ctx.bezierCurveTo(336, 827, x0, 842, x0, 870);
    ctx.lineTo(x0, 914);
    ctx.quadraticCurveTo(x0, bottomY, 352, bottomY);
    ctx.lineTo(488, bottomY);
    ctx.quadraticCurveTo(x1, bottomY, x1, 914);
    ctx.lineTo(x1, 882);
    ctx.bezierCurveTo(x1, 856, 510, 836, 486, shoulderY);
    ctx.bezierCurveTo(466, 807, 446, 792, neckRight, pivot.y + 8);
  }

  ctx.closePath();

  const fill = ctx.createLinearGradient(0, pivot.y, 0, bottomY);

  if (left) {
    fill.addColorStop(
      0,
      phase.active
        ? "rgba(55,124,164,.98)"
        : "rgba(22,62,91,.95)"
    );
    fill.addColorStop(1, "rgba(9,27,45,.99)");

    ctx.strokeStyle =
      phase.active
        ? "rgba(185,239,255,.90)"
        : "rgba(119,209,255,.47)";
  } else {
    fill.addColorStop(
      0,
      phase.active
        ? "rgba(101,72,140,.98)"
        : "rgba(53,39,83,.95)"
    );
    fill.addColorStop(1, "rgba(25,20,51,.99)");

    ctx.strokeStyle =
      phase.active
        ? "rgba(239,219,255,.90)"
        : "rgba(211,166,255,.46)";
  }

  ctx.fillStyle = fill;
  ctx.lineWidth = phase.active ? 3 : 2;
  ctx.fill();
  ctx.stroke();

  drawFingerprint(
    left ? 121 : 419,
    875,
    side,
    phase.active
  );

  ctx.fillStyle =
    phase.active
      ? "#fff1a9"
      : left
        ? "rgba(224,247,255,.80)"
        : "rgba(245,229,255,.80)";

  ctx.font = "900 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(left ? "A" : "D", left ? 121 : 419, 928);

  ctx.restore();
}

function drawFlipper(side, songTime) {
  const segment = flipperSegment(side, songTime);
  const phase = segment.phase;

  drawControlModule(side, songTime);

  ctx.save();

  ctx.shadowBlur = phase.attack ? 22 : 6;
  ctx.shadowColor = phase.attack ? "#fff0a3" : "#79cfff";

  ctx.strokeStyle =
    phase.attack
      ? "#fff0a3"
      : phase.active
        ? "#f2fbff"
        : "#cfe9ff";

  ctx.lineWidth =
    phase.attack
      ? FLIPPER.width + 5
      : FLIPPER.width;

  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(segment.pivot.x, segment.pivot.y);
  ctx.lineTo(segment.tip.x, segment.tip.y);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle =
    phase.active
      ? "#243a51"
      : "#132238";

  ctx.beginPath();
  ctx.arc(segment.pivot.x, segment.pivot.y, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = phase.attack ? 22 : 8;
  ctx.shadowColor = phase.attack ? "#ffe985" : "#9edcff";
  ctx.fillStyle = phase.attack ? "#ffe985" : "#9edcff";

  ctx.beginPath();
  ctx.arc(
    segment.tip.x,
    segment.tip.y,
    phase.attack ? 10 : 7,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

function drawSlide(event, songTime) {
  const path = event.pathObject;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = "rgba(155,217,255,.16)";
  ctx.lineWidth = 22;
  ctx.beginPath();

  path.points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  ctx.stroke();

  ctx.strokeStyle = "rgba(205,239,255,.68)";
  ctx.lineWidth = 4;
  ctx.beginPath();

  path.points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  ctx.stroke();

  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    const star = pointAtDistance(path, path.length * fraction);
    const activeStar =
      slidePointer?.key === event.key &&
      Math.abs(
        fraction -
        clamp(
          (songTime - event.targetTime) /
          Math.max(0.001, event.endTime - event.targetTime),
          0,
          1
        )
      ) < 0.12;

    ctx.fillStyle =
      activeStar
        ? "#fff1a9"
        : "rgba(205,239,255,.72)";

    ctx.beginPath();
    ctx.arc(star.x, star.y, activeStar ? 8 : 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const progress = clamp(
    (songTime - event.targetTime) /
    Math.max(0.001, event.endTime - event.targetTime),
    0,
    1
  );

  const head = pointAtDistance(path, path.length * progress);

  ctx.shadowBlur = 18;
  ctx.shadowColor = "#fff1a9";
  ctx.fillStyle = "#fff1a9";
  ctx.beginPath();
  ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
  ctx.fill();

  if (slidePointer?.key === event.key) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle =
      event.lastDistance <= SLIDE.radius
        ? "rgba(126,255,192,.80)"
        : "rgba(255,113,132,.80)";

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      slidePointer.x,
      slidePointer.y,
      18,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  ctx.restore();
}

function drawConstellation(event, songTime) {
  const points = constellationPoints(event.symbol);
  const pulse = 0.55 +
    0.45 * Math.sin(performance.now() / 140);

  ctx.save();

  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();

  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  ctx.stroke();

  const proximity = clamp(
    1 -
    Math.abs(songTime - event.targetTime) /
    DRAW.leadSeconds,
    0,
    1
  );

  for (const point of points) {
    ctx.shadowBlur = 12 + 10 * proximity;
    ctx.shadowColor = "#fff1a9";
    ctx.fillStyle =
      `rgba(255,241,169,${0.48 + pulse * 0.36})`;

    ctx.beginPath();
    ctx.arc(point.x, point.y, 5 + proximity * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.54)";
  ctx.font = "800 11px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DIBUJA", 270, 472);

  ctx.restore();
}

function drawCurrentGesture() {
  if (!drawGesture || drawGesture.points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = "rgba(255,244,188,.92)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#fff1a9";

  ctx.beginPath();

  drawGesture.points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });

  ctx.stroke();
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
      8 + t * 30,
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
    `LAB v0.11 · ${chartName} · BPM ${BPM} · beat ${loopBeat.toFixed(2)}`,
    `tap ${NOTE_SPEED}px/s CONSTANTE · projectile ${POST_HIT_SPEED}px/s`,
    `tap P±45 G±90 GOOD±160ms · draw P±150 G±280 GOOD±550ms`,
    `hits ${hitCount} miss ${missCount} chain ${chainCount} choque ${collisionCount} pared ${wallExplosionCount}`,
    `slide ${slidePointer ? "ACTIVO" : "—"} · draw ${drawGesture ? "ACTIVO" : "—"}`,
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

  for (const event of active.values()) {
    if (event.type === "slide") {
      drawSlide(event, songTime);
    }
  }

  for (const event of active.values()) {
    if (event.type === "draw") {
      drawConstellation(event, songTime);
    }
  }

  for (const event of active.values()) {
    if (event.type === "tap") {
      drawTap(event);
    }
  }

  drawCurrentGesture();

  drawFlipper("left", songTime);
  drawFlipper("right", songTime);

  drawImpactFlashes();
  drawExplosions();
  drawMessage();
  drawCountIn(songTime);

  if (showDebug) drawDebug(songTime);
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
  resolveProjectileCollisions();
  updateEffects(dt);
  render(songTime);

  requestAnimationFrame(frame);
}

function pressVisual(button, state) {
  button.classList.toggle("active", state);
}

function bindButton(button, side) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    pressVisual(button, true);

    triggerFlipper(
      side,
      event.timeStamp,
      event.pointerType || "touch"
    );
  });

  const release = (event) => {
    event?.preventDefault?.();
    pressVisual(button, false);
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

bindButton(leftButton, "left");
bindButton(rightButton, "right");

canvas.addEventListener("pointerdown", (event) => {
  if (!running) return;

  event.preventDefault();

  const point = eventToDesign(event);
  const songTime = eventSongTime(event.timeStamp);

  const slide = activeSlideCandidate(songTime, point);

  if (slide) {
    beginSlide(slide, event.pointerId, point);
    return;
  }

  const draw = activeDrawCandidate(songTime);

  if (draw) {
    beginDraw(draw, event.pointerId, point);
  }
});

canvas.addEventListener("pointermove", (event) => {
  const point = eventToDesign(event);

  if (
    slidePointer &&
    slidePointer.pointerId === event.pointerId
  ) {
    slidePointer.x = point.x;
    slidePointer.y = point.y;
    return;
  }

  if (
    drawGesture &&
    drawGesture.pointerId === event.pointerId
  ) {
    const last = drawGesture.points.at(-1);

    if (
      !last ||
      Math.hypot(point.x - last.x, point.y - last.y) >= 4
    ) {
      drawGesture.points.push(point);
    }
  }
});

canvas.addEventListener("pointerup", (event) => {
  const point = eventToDesign(event);
  const songTime = eventSongTime(event.timeStamp);

  if (
    slidePointer &&
    slidePointer.pointerId === event.pointerId
  ) {
    const activeSlide = active.get(slidePointer.key);

    if (activeSlide) {
      finishSlide(activeSlide, songTime, point);
    } else {
      slidePointer = null;
    }

    return;
  }

  if (
    drawGesture &&
    drawGesture.pointerId === event.pointerId
  ) {
    const activeDraw = active.get(drawGesture.key);

    if (activeDraw) {
      finishDraw(activeDraw, songTime);
    } else {
      drawGesture = null;
    }
  }
});

canvas.addEventListener("pointercancel", (event) => {
  if (
    slidePointer &&
    slidePointer.pointerId === event.pointerId
  ) {
    slidePointer = null;
  }

  if (
    drawGesture &&
    drawGesture.pointerId === event.pointerId
  ) {
    drawGesture = null;
  }
});

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
    triggerFlipper("left", event.timeStamp, "keyboard");
  }

  if (key === "d" || event.key === "ArrowRight") {
    pressVisual(rightButton, true);
    triggerFlipper("right", event.timeStamp, "keyboard");
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();

  if (key === "a" || event.key === "ArrowLeft") {
    pressVisual(leftButton, false);
  }

  if (key === "d" || event.key === "ArrowRight") {
    pressVisual(rightButton, false);
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

  lastDeltaMs = null;
  lastJudgement = "—";
  lastInputType = "—";
  message = "";

  active.clear();
  resolved.clear();
  explosions = [];
  impactFlashes = [];
  slidePointer = null;
  drawGesture = null;

  flippers.left.startTime = -Infinity;
  flippers.left.hitThisSwing = false;
  flippers.right.startTime = -Infinity;
  flippers.right.hitThisSwing = false;

  updateHud();

  startButton.disabled = true;
  startButton.textContent = "INICIANDO…";

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

  if (routes && slidePaths) {
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
