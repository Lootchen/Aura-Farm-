import { loadGameChart } from "./chart.js?v=0.16";

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

const TAP_MISS_WINDOW = 0.160;

const DRAW_WINDOWS = {
  perfect: 0.200,
  great: 0.400,
  good: 0.850
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
  leadSeconds: 2.25,
  startEarly: 0.25,
  startLate: 0.25,
  scrollSpeed: 150,
  positionTolerance: 0.24,
  disconnectGrace: 0.12,
  minCoverage: 0.72,
  padTravel: 44,
  nodeBeats: 0.5
};

const DRAW = {
  previewSeconds: 1.35,
  recognitionThreshold: 0.62,
  minPoints: 6
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

let drawGesture = null;

const slideControl = {
  left: {
    held: false,
    pointerId: null,
    position: 0,
    releasedAt: -Infinity
  },
  right: {
    held: false,
    pointerId: null,
    position: 0,
    releasedAt: -Infinity
  }
};

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

  const chartUrl = new URL("../charts/tap-lab.json?v=0.16", import.meta.url);
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
        expireAt = targetTime + TAP_MISS_WINDOW + 0.22;
      } else if (event.type === "slide") {
        lead = SLIDE.leadSeconds;
        expireAt = targetTime + beatToSeconds(event.durationBeats) + 0.35;
      } else if (event.type === "draw") {
        lead = DRAW.previewSeconds;
        expireAt = targetTime + beatToSeconds(event.windowBeats);
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
          lastError: 1
        });
      }

      if (event.type === "draw") {
        active.set(key, {
          key,
          loop,
          ...event,
          targetTime,
          endTime: targetTime + beatToSeconds(event.windowBeats)
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
  const slide = activeSlideAt(songTime, side);

  const angle =
    slide?.started
      ? slideAngle(side, slideControl[side].position)
      : phase.angle;

  return {
    pivot,
    tip: {
      x: pivot.x + Math.cos(angle) * FLIPPER.length,
      y: pivot.y + Math.sin(angle) * FLIPPER.length
    },
    phase: {
      ...phase,
      slide: Boolean(slide?.started),
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
  combo += 1;
  const multiplier = comboMultiplier(combo);

  score += JUDGEMENTS.perfect.points * multiplier;
  hitCount += 1;

  lastDeltaMs = null;
  lastJudgement = "PERFECT";

  note.launched = true;
  note.prevX = note.x;
  note.prevY = note.y;

  const segment = flipperSegment(side, songTime);
  const dx = segment.tip.x - segment.pivot.x;
  const dy = segment.tip.y - segment.pivot.y;
  const length = Math.hypot(dx, dy) || 1;

  note.vx = (dx / length) * POST_HIT_SPEED;
  note.vy = (dy / length) * POST_HIT_SPEED;

  resolved.add(note.key);
  flippers[side].hitThisSwing = true;

  createImpactFlash(
    segment.tip.x,
    segment.tip.y,
    JUDGEMENTS.perfect
  );

  showMessage("PERFECT", JUDGEMENTS.perfect.color, 360);
  hitSound(side, JUDGEMENTS.perfect);

  if (navigator.vibrate) {
    navigator.vibrate(8);
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

  if (songTime - note.targetTime > TAP_MISS_WINDOW) {
    failEvent(note, "MISS");
  }
}

function slideAngle(side, position) {
  const m = view();
  const center =
    (m.restAngle[side] + m.strikeAngle[side]) / 2;
  const span =
    Math.abs(m.strikeAngle[side] - m.restAngle[side]) / 2;

  return center - clamp(position, -1, 1) * span;
}

function slidePositionAtBeat(event, beatOffset) {
  const anchors = event.anchors;

  if (beatOffset <= anchors[0].beat) {
    return anchors[0].position;
  }

  for (let i = 1; i < anchors.length; i += 1) {
    const a = anchors[i - 1];
    const b = anchors[i];

    if (beatOffset <= b.beat) {
      const span =
        Math.max(0.0001, b.beat - a.beat);
      const t =
        (beatOffset - a.beat) / span;

      return lerp(a.position, b.position, t);
    }
  }

  return anchors.at(-1).position;
}

function slidePositionAtTime(event, songTime) {
  return slidePositionAtBeat(
    event,
    clamp(
      (songTime - event.targetTime) / beatToSeconds(1),
      0,
      event.durationBeats
    )
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

  slideControl[side].position = clamp(
    (point.x - center.x) / SLIDE.padTravel,
    -1,
    1
  );
}

function beginSlide(event, side, songTime) {
  if (!event.started) {
    event.started = true;
    event.startDelta = songTime - event.targetTime;
    event.lastGoodTime = songTime;
    slideControl[side].position =
      event.anchors[0].position;

    const receiver = slideTipPoint(
      side,
      event.anchors[0].position
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

function slideTipPoint(side, position) {
  const m = view();
  const pivot = m.pivot[side];
  const angle = slideAngle(side, position);

  return {
    x: pivot.x + Math.cos(angle) * FLIPPER.length,
    y: pivot.y + Math.sin(angle) * FLIPPER.length
  };
}

function slideConnected(event, songTime) {
  if (!event.started) return false;

  const control = slideControl[event.side];
  const target =
    slidePositionAtTime(event, songTime);

  const error =
    Math.abs(control.position - target);

  event.lastError = error;

  if (
    control.held &&
    error <= SLIDE.positionTolerance
  ) {
    event.lastGoodTime = songTime;
    return true;
  }

  return (
    songTime - event.lastGoodTime <=
    SLIDE.disconnectGrace
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
  const finalPosition =
    event.anchors.at(-1).position;
  const point =
    slideTipPoint(event.side, finalPosition);
  const angle =
    slideAngle(event.side, finalPosition);

  const key =
    `slidefx:${performance.now().toFixed(3)}:${Math.random().toString(36).slice(2)}`;

  active.set(key, {
    key,
    type: "tap",
    side: event.side,
    symbol: "★",
    launched: true,
    x: point.x,
    y: point.y,
    prevX: point.x,
    prevY: point.y,
    vx: Math.cos(angle) * POST_HIT_SPEED,
    vy: Math.sin(angle) * POST_HIT_SPEED
  });
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
    SLIDE.disconnectGrace;

  if (
    coverage < SLIDE.minCoverage ||
    !connectedAtEnd
  ) {
    failEvent(event, "SLIDE MISS");
    return;
  }

  combo += 1;
  score +=
    450 * comboMultiplier(combo);

  lastDeltaMs = null;
  lastJudgement = "SLIDE PERFECT";

  active.delete(event.key);
  resolved.add(event.key);

  const finalPoint =
    slideTipPoint(
      event.side,
      event.anchors.at(-1).position
    );

  createImpactFlash(
    finalPoint.x,
    finalPoint.y,
    JUDGEMENTS.perfect
  );

  spawnSlideProjectile(event);

  showMessage(
    "SLIDE PERFECT",
    JUDGEMENTS.perfect.color,
    580
  );

  successTone(820);

  if (navigator.vibrate) {
    navigator.vibrate([6, 20, 7]);
  }

  slideControl[event.side].position = 0;

  updateHud();
}

function slideNodePoint(
  event,
  beatOffset,
  songTime
) {
  const m = view();
  const pivot = m.pivot[event.side];
  const position =
    slidePositionAtBeat(event, beatOffset);
  const angle =
    slideAngle(event.side, position);

  const nodeTime =
    event.targetTime + beatToSeconds(beatOffset);

  const radius =
    FLIPPER.length +
    SLIDE.scrollSpeed * (nodeTime - songTime);

  return {
    x: pivot.x + Math.cos(angle) * radius,
    y: pivot.y + Math.sin(angle) * radius,
    radius,
    position,
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
  ctx.fillText("↔", x, y + 1);
  ctx.restore();
}

function drawSlide(event, songTime) {
  ctx.save();

  if (!event.started) {
    const distance =
      event.path.length -
      NOTE_SPEED *
      (event.targetTime - songTime);

    const head =
      pointAtDistance(event.path, distance);

    ctx.strokeStyle =
      event.side === "left"
        ? "rgba(110,215,255,.34)"
        : "rgba(216,139,255,.34)";

    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);

    const behind =
      pointAtDistance(
        event.path,
        Math.max(0, distance - 55)
      );

    ctx.lineTo(behind.x, behind.y);
    ctx.stroke();

    drawSlideOrb(
      head.x,
      head.y,
      event.side,
      22,
      1,
      false
    );

    ctx.fillStyle =
      "rgba(240,248,255,.78)";
    ctx.font =
      "900 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "ATRAPA Y ARRASTRA",
      DESIGN.width / 2,
      650
    );

    ctx.restore();
    return;
  }

  const nodes = [];

  for (
    let beat = 0;
    beat <= event.durationBeats + 0.001;
    beat += SLIDE.nodeBeats
  ) {
    const point =
      slideNodePoint(
        event,
        beat,
        songTime
      );

    if (
      point.radius >= FLIPPER.length - 18 &&
      point.radius <= 360
    ) {
      nodes.push({
        beat,
        ...point
      });
    }
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (nodes.length > 1) {
    ctx.strokeStyle =
      event.side === "left"
        ? "rgba(110,215,255,.40)"
        : "rgba(216,139,255,.40)";

    ctx.lineWidth = 12;
    ctx.shadowBlur = 12;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();

    nodes.forEach((node, index) => {
      if (index === 0) {
        ctx.moveTo(node.x, node.y);
      } else {
        ctx.lineTo(node.x, node.y);
      }
    });

    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  for (const node of nodes) {
    drawSlideOrb(
      node.x,
      node.y,
      event.side,
      node.beat === 0 ? 15 : 9,
      0.82,
      false
    );
  }

  const targetPosition =
    slidePositionAtTime(event, songTime);

  const target =
    slideTipPoint(
      event.side,
      targetPosition
    );

  const connected =
    slideConnected(event, songTime);

  ctx.strokeStyle =
    connected
      ? "#fff1a9"
      : "#ff7184";

  ctx.lineWidth = 5;
  ctx.shadowBlur = 22;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.beginPath();
  ctx.arc(
    target.x,
    target.y,
    19,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle =
    "rgba(240,248,255,.82)";
  ctx.font =
    "900 14px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "DESLIZA EL PULGAR · SIGUE LA CINTA",
    DESIGN.width / 2,
    650
  );

  ctx.restore();
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
  const sampled = resamplePolyline(points, 48);

  const centroid = sampled.reduce(
    (acc, point) => ({
      x: acc.x + point.x / sampled.length,
      y: acc.y + point.y / sampled.length
    }),
    { x: 0, y: 0 }
  );

  const centered = sampled.map((point) => ({
    x: point.x - centroid.x,
    y: point.y - centroid.y
  }));

  const xs = centered.map((point) => point.x);
  const ys = centered.map((point) => point.y);

  const width =
    Math.max(...xs) - Math.min(...xs);
  const height =
    Math.max(...ys) - Math.min(...ys);

  const scale =
    Math.max(1, width, height);

  return centered.map((point) => ({
    x: point.x / scale,
    y: point.y / scale
  }));
}

function gestureScore(points, template) {
  if (points.length < DRAW.minPoints) return 0;

  const gesture = normalizeGesture(points);
  const target = normalizeGesture(template);

  const compare = (candidate) => {
    let distance = 0;

    for (let i = 0; i < candidate.length; i += 1) {
      distance += Math.hypot(
        candidate[i].x - target[i].x,
        candidate[i].y - target[i].y
      );
    }

    const mean =
      distance / candidate.length;

    return clamp(
      1 - mean / 0.70,
      0,
      1
    );
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
        songTime >= event.targetTime &&
        songTime <= event.endTime
    )
    .sort(
      (a, b) =>
        a.endTime - b.endTime
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
  const scoreValue =
    gestureScore(
      points,
      drawTemplate(event.symbol)
    );

  drawGesture = null;

  if (songTime > event.endTime) {
    failEvent(event, "MAGIC MISS");
    return;
  }

  if (
    scoreValue <
    DRAW.recognitionThreshold
  ) {
    showMessage(
      "TRAZO NO RECONOCIDO · INTENTA OTRA VEZ",
      "#ff9da9",
      480
    );
    return;
  }

  combo += 1;

  const remainingRatio =
    clamp(
      (event.endTime - songTime) /
      Math.max(
        0.001,
        event.endTime - event.targetTime
      ),
      0,
      1
    );

  const timeBonus =
    Math.round(120 * remainingRatio);

  score +=
    (JUDGEMENTS.perfect.points + 150 + timeBonus) *
    comboMultiplier(combo);

  lastJudgement =
    `MAGIC ${event.symbol.toUpperCase()}`;
  lastDeltaMs = null;

  active.delete(event.key);
  resolved.add(event.key);

  const constellation =
    constellationPoints(event.symbol);

  for (const point of constellation) {
    createExplosion(point.x, point.y);
  }

  showMessage(
    `MAGIC ${event.symbol.toUpperCase()} · PERFECT`,
    JUDGEMENTS.perfect.color,
    600
  );

  successTone(860);

  if (navigator.vibrate) {
    navigator.vibrate([5, 25, 5]);
  }

  updateHud();
}

function constellationPoints(symbol) {
  const template = resamplePolyline(drawTemplate(symbol), 8);

  return template.map((point) => ({
    x: 88 + point.x * 364,
    y: 205 + point.y * 360
  }));
}

function updateEvents(dt, songTime) {
  for (const event of [...active.values()]) {
    if (event.type === "tap") {
      updateTap(event, dt, songTime);
      continue;
    }

    if (event.type === "slide") {
      updateSlide(event, dt, songTime);
      continue;
    }

    if (
      event.type === "draw" &&
      songTime > event.endTime
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
    Boolean(slide?.started);

  ctx.save();

  ctx.strokeStyle = left
    ? "rgba(122,211,255,.25)"
    : "rgba(211,166,255,.25)";

  ctx.lineWidth =
    slideActive ? 13 : 9;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(
    center.x + (left ? 24 : -24),
    center.y - 20
  );

  ctx.quadraticCurveTo(
    left ? 106 : 434,
    846,
    pivot.x,
    pivot.y + 5
  );

  ctx.stroke();

  const highlighted =
    phase.active ||
    slideActive ||
    Boolean(slide && !slide.started);

  ctx.shadowBlur =
    highlighted ? 24 : 9;

  ctx.shadowColor =
    left
      ? "rgba(92,204,255,.58)"
      : "rgba(204,139,255,.56)";

  ctx.fillStyle =
    highlighted
      ? "#24303d"
      : left
        ? "#153e5d"
        : "#34264f";

  ctx.strokeStyle =
    slideActive
      ? "#fff1a9"
      : left
        ? "rgba(142,222,255,.76)"
        : "rgba(224,188,255,.74)";

  ctx.lineWidth =
    highlighted ? 4 : 2.5;

  ctx.beginPath();
  ctx.arc(
    center.x,
    center.y,
    36,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;

  if (slide) {
    ctx.strokeStyle =
      "rgba(255,255,255,.34)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(
      center.x - 27,
      center.y
    );
    ctx.lineTo(
      center.x + 27,
      center.y
    );
    ctx.stroke();

    const targetPos =
      slide.started
        ? slidePositionAtTime(
            slide,
            songTime
          )
        : slide.anchors[0].position;

    ctx.strokeStyle =
      "rgba(255,241,169,.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(
      center.x +
        targetPos * 27,
      center.y - 10
    );
    ctx.lineTo(
      center.x +
        targetPos * 27,
      center.y + 10
    );
    ctx.stroke();

    ctx.fillStyle =
      control.held && slide.started
        ? "#fff1a9"
        : "#e8f5ff";

    ctx.beginPath();
    ctx.arc(
      center.x +
        control.position * 27,
      center.y,
      8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  } else {
    ctx.strokeStyle = left
      ? "rgba(170,232,255,.58)"
      : "rgba(235,210,255,.56)";

    ctx.lineWidth = 2;

    for (const radius of [24, 17, 10]) {
      ctx.beginPath();
      ctx.arc(
        center.x,
        center.y + 3,
        radius,
        Math.PI * 1.15,
        Math.PI * 1.85
      );
      ctx.stroke();
    }
  }

  ctx.fillStyle =
    "rgba(244,250,255,.84)";
  ctx.font =
    "900 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    left ? "A" : "D",
    center.x,
    center.y + 18
  );

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

  const proximity =
    songTime < event.targetTime
      ? clamp(
          1 -
          (event.targetTime - songTime) /
          DRAW.previewSeconds,
          0,
          1
        )
      : clamp(
          1 -
          (event.endTime - songTime) /
          Math.max(
            0.001,
            event.endTime - event.targetTime
          ),
          0,
          1
        );

  for (const point of points) {
    ctx.shadowBlur = 12 + 10 * proximity;
    ctx.shadowColor = "#fff1a9";
    ctx.fillStyle =
      `rgba(255,241,169,${0.48 + pulse * 0.36})`;

    ctx.beginPath();
    ctx.arc(point.x, point.y, 8 + proximity * 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,.54)";
  ctx.font = "900 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    songTime < event.targetTime
      ? "PREPÁRATE PARA DIBUJAR"
      : `DIBUJA · ${Math.max(0, (event.endTime - songTime)).toFixed(1)}s`,
    270,
    620
  );

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
    `LAB v0.16 · ${chartName} · BPM ${BPM} · beat ${loopBeat.toFixed(2)}`,
    `tap ${NOTE_SPEED}px/s CONSTANTE · projectile ${POST_HIT_SPEED}px/s`,
    `tap: impacto = PERFECT · slide: pad analógico · magic: figura/deadline`,
    `hits ${hitCount} miss ${missCount} chain ${chainCount} choque ${collisionCount} pared ${wallExplosionCount}`,
    `slide L:${slideControl.left.position.toFixed(2)} R:${slideControl.right.position.toFixed(2)} · draw ${drawGesture ? "ACTIVO" : "—"}`,
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

    if (!slide.started) {
      beginSlide(
        slide,
        side,
        songTime
      );
    } else if (pointerEvent) {
      updateSlidePadPosition(
        side,
        pointerEvent
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

canvas.addEventListener("pointerdown", (event) => {
  if (!running) return;

  event.preventDefault();

  const point = eventToDesign(event);
  const songTime = eventSongTime(event.timeStamp);
  const draw = activeDrawCandidate(songTime);

  if (draw) {
    beginDraw(draw, event.pointerId, point);
  }
});

canvas.addEventListener("pointermove", (event) => {
  if (
    !drawGesture ||
    drawGesture.pointerId !== event.pointerId
  ) {
    return;
  }

  const point = eventToDesign(event);
  const last = drawGesture.points.at(-1);

  if (
    !last ||
    Math.hypot(
      point.x - last.x,
      point.y - last.y
    ) >= 4
  ) {
    drawGesture.points.push(point);
  }
});

canvas.addEventListener("pointerup", (event) => {
  if (
    !drawGesture ||
    drawGesture.pointerId !== event.pointerId
  ) {
    return;
  }

  const songTime = eventSongTime(event.timeStamp);
  const activeDraw = active.get(drawGesture.key);

  if (activeDraw) {
    finishDraw(activeDraw, songTime);
  } else {
    drawGesture = null;
  }
});

canvas.addEventListener("pointercancel", (event) => {
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

  lastDeltaMs = null;
  lastJudgement = "—";
  lastInputType = "—";
  message = "";

  active.clear();
  resolved.clear();
  explosions = [];
  impactFlashes = [];
  drawGesture = null;

  for (const side of ["left", "right"]) {
    slideControl[side].held = false;
    slideControl[side].pointerId = null;
    slideControl[side].position = 0;
    slideControl[side].releasedAt = -Infinity;
  }

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
