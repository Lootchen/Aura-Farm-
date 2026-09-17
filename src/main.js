import { loadTapChart } from "./chart.js?v=0.10";

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
let BPM = 120;
let LOOP_BEATS = 16;
let COUNT_IN_BEATS = 4;
let CHART = [];
let chartName = "cargando…";
let chartLoaded = false;

const NOTE_SPEED = 285;
const NOTE_RADIUS = 20;
const PATH_SAMPLES = 160;
const POST_HIT_SPEED = 455;

const WINDOWS = {
  perfect: 0.045,
  great: 0.090,
  good: 0.160
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



class RhythmClock {
  constructor() {
    this.context = null;
    this.startAt = 0;
    this.nextClickBeat = 0;
    this.timer = null;
  }

  async start() {
    this.context ??= new AudioContext();
    await this.context.resume();

    const beatDuration = 60 / BPM;
    this.startAt = this.context.currentTime + 0.08 + COUNT_IN_BEATS * beatDuration;
    this.nextClickBeat = -COUNT_IN_BEATS;

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
    const horizon = this.context.currentTime + 0.12;

    while (this.startAt + this.nextClickBeat * beatDuration < horizon) {
      const time = this.startAt + this.nextClickBeat * beatDuration;
      if (time >= this.context.currentTime) this.click(time, this.nextClickBeat);
      this.nextClickBeat += 1;
    }
  }

  click(time, beatNumber) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const downbeat = beatNumber >= 0 && Math.floor(beatNumber) % 4 === 0;

    oscillator.frequency.value = downbeat ? 880 : 620;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(downbeat ? 0.085 : 0.04, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.038);

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.048);
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
let score = 0;
let combo = 0;
let hitCount = 0;
let missCount = 0;
let whiffCount = 0;
let collisionCount = 0;
let chainCount = 0;
let wallExplosionCount = 0;
let impactFlashes = [];
let showDebug = false;
let lastDeltaMs = null;
let lastJudgement = "—";
let lastFrame = performance.now();
let fps = 60;
let message = "";
let messageColor = "#ffffff";
let messageUntil = 0;
let calibrationOffsetMs = 0;
let lastInputType = "—";

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

  const chartUrl = new URL("../charts/tap-lab.json?v=0.10", import.meta.url);
  const chart = await loadTapChart(chartUrl);

  BPM = chart.bpm;
  LOOP_BEATS = chart.loopBeats;
  COUNT_IN_BEATS = chart.countInBeats;
  CHART = chart.events;
  chartName = chart.name || "Tap chart";
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

function buildRoutes() {
  const m = view();
  const mirror = (point) => ({ x: DESIGN.width - point.x, y: point.y });

  const leftDefs = [
    [
      { x: 72, y: 88 },
      { x: 60, y: 300 },
      { x: 118, y: 570 },
      m.impact.left
    ],
    [
      { x: 245, y: 70 },
      { x: 232, y: 280 },
      { x: 196, y: 560 },
      m.impact.left
    ],
    [
      { x: 410, y: 120 },
      { x: 346, y: 300 },
      { x: 276, y: 570 },
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

function judgementFor(deltaSeconds) {
  const error = Math.abs(deltaSeconds);

  if (error <= WINDOWS.perfect) return JUDGEMENTS.perfect;
  if (error <= WINDOWS.great) return JUDGEMENTS.great;
  if (error <= WINDOWS.good) return JUDGEMENTS.good;

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

      const path = routeFor(event.side, event.route);
      const targetTime = loop * duration + beatToSeconds(event.beat);
      const spawnLead = path.length / NOTE_SPEED;
      const timeUntil = targetTime - songTime;

      if (
        timeUntil <= spawnLead + 0.04 &&
        timeUntil >= -WINDOWS.good - 0.20
      ) {
        active.set(key, {
          key,
          ...event,
          path,
          targetTime,
          pathDistance: 0,
          launched: false,
          x: path.points[0].x,
          y: path.points[0].y,
          vx: 0,
          vy: 0,
          prevX: path.points[0].x,
          prevY: path.points[0].y,
          life: 0
        });
      }
    });
  }

  for (const key of [...resolved]) {
    const loop = Number(key.split(":")[0]);
    if (loop < currentLoop - 1) resolved.delete(key);
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

  if (impactFlashes.length > 8) impactFlashes.shift();
}

function resolveHit(note, side, songTime) {
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
  note.life = 0;
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

function miss(note) {
  combo = 0;
  missCount += 1;
  lastDeltaMs = null;
  lastJudgement = "MISS";

  active.delete(note.key);
  resolved.add(note.key);

  showMessage("MISS", "#ff7184", 360);

  if (navigator.vibrate) navigator.vibrate(12);

  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(score);
  comboEl.textContent = combo ? `${combo} · x${comboMultiplier(combo)}` : "0";
  lastHitEl.textContent =
    lastDeltaMs === null
      ? lastJudgement
      : `${lastJudgement} ${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`;
}

function updateNotes(dt, songTime) {
  for (const note of [...active.values()]) {
    if (note.launched) {
      note.life += dt;
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

      continue;
    }

    note.prevX = note.x;
    note.prevY = note.y;

    note.pathDistance =
      note.path.length - NOTE_SPEED * (note.targetTime - songTime);

    const point = pointAtDistance(note.path, note.pathDistance);
    note.x = point.x;
    note.y = point.y;

    if (songTime - note.targetTime > WINDOWS.good) {
      miss(note);
    }
  }
}

function resolveFlipperCollisions(songTime) {
  for (const side of ["left", "right"]) {
    const state = flippers[side];
    const segment = flipperSegment(side, songTime);

    if (!segment.phase.attack || state.hitThisSwing) continue;

    const candidates = [...active.values()]
      .filter((note) => !note.launched && note.side === side)
      .sort(
        (a, b) =>
          Math.abs(a.targetTime - songTime) -
          Math.abs(b.targetTime - songTime)
      );

    for (const note of candidates) {
      if (Math.abs(songTime - note.targetTime) > WINDOWS.good + 0.035) continue;

      const distance = distancePointToSegment(note, segment.pivot, segment.tip);
      const collisionDistance = NOTE_RADIUS + FLIPPER.width * 0.5;

      if (
        distance <= collisionDistance &&
        resolveHit(note, side, songTime)
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

  if (explosions.length > 10) {
    explosions.shift();
  }

  explosionSound();
}

function sweptProjectileHit(a, b) {
  const ax0 = Number.isFinite(a.prevX) ? a.prevX : a.x;
  const ay0 = Number.isFinite(a.prevY) ? a.prevY : a.y;
  const bx0 = Number.isFinite(b.prevX) ? b.prevX : b.x;
  const by0 = Number.isFinite(b.prevY) ? b.prevY : b.y;

  const relativeStartX = ax0 - bx0;
  const relativeStartY = ay0 - by0;
  const relativeStepX = (a.x - ax0) - (b.x - bx0);
  const relativeStepY = (a.y - ay0) - (b.y - by0);

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
  const collisionRadius = NOTE_RADIUS * 2;

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
  const projectiles = [...active.values()].filter((note) => note.launched);
  const checkedPairs = new Set();

  for (const projectile of projectiles) {
    if (!active.has(projectile.key)) continue;

    for (const other of [...active.values()]) {
      if (other.key === projectile.key || !active.has(other.key)) continue;

      const pairKey =
        projectile.key < other.key
          ? `${projectile.key}|${other.key}`
          : `${other.key}|${projectile.key}`;

      if (checkedPairs.has(pairKey)) continue;
      checkedPairs.add(pairKey);

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

function updateExplosions(dt) {
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

function updateWhiffs(songTime) {
  for (const side of ["left", "right"]) {
    const state = flippers[side];
    const elapsed = songTime - state.startTime;

    if (
      Number.isFinite(state.startTime) &&
      elapsed >= FLIPPER.cycle &&
      elapsed < FLIPPER.cycle + 0.050
    ) {
      if (!state.hitThisSwing) whiffCount += 1;

      state.startTime = -Infinity;
      state.hitThisSwing = false;
    }
  }
}

function drawBackground() {
  ctx.fillStyle = "#0a1020";
  ctx.fillRect(0, 0, DESIGN.width, DESIGN.height);

  ctx.fillStyle = "rgba(255,255,255,.15)";
  for (let i = 0; i < 34; i += 1) {
    const x = (((i * 73) % 521) / 521) * DESIGN.width;
    const y = (((i * 113) % 601) / 601) * DESIGN.height * 0.61;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
}

function drawTrail(note) {
  if (note.launched) {
    const speed = Math.hypot(note.vx, note.vy) || 1;
    const ux = note.vx / speed;
    const uy = note.vy / speed;

    ctx.strokeStyle =
      note.side === "left"
        ? "rgba(110,215,255,.24)"
        : "rgba(216,139,255,.24)";

    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(note.x, note.y);
    ctx.lineTo(note.x - ux * 32, note.y - uy * 32);
    ctx.stroke();
    return;
  }

  const trailDistances = [16, 32];

  for (let i = 0; i < trailDistances.length; i += 1) {
    const point = pointAtDistance(
      note.path,
      Math.max(0, note.pathDistance - trailDistances[i])
    );

    const alpha = 0.13 - i * 0.045;

    ctx.fillStyle =
      note.side === "left"
        ? `rgba(110,215,255,${alpha})`
        : `rgba(216,139,255,${alpha})`;

    ctx.beginPath();
    ctx.arc(
      point.x,
      point.y,
      Math.max(4, NOTE_RADIUS - 8 - i * 2),
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function drawNote(note) {
  drawTrail(note);

  ctx.save();
  ctx.translate(note.x, note.y);

  if (note.launched) {
    ctx.rotate(Math.atan2(note.vy, note.vx) + Math.PI / 2);
  }

  ctx.fillStyle = note.side === "left" ? "#6ed7ff" : "#d88bff";
  ctx.beginPath();
  ctx.arc(0, 0, NOTE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#08101d";
  ctx.font = "900 25px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(note.symbol, 0, 1);

  ctx.restore();
}

function roundedRectPath(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFingerprint(cx, cy, side, activeState) {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.strokeStyle =
    side === "left"
      ? `rgba(156,226,255,${activeState ? .88 : .48})`
      : `rgba(224,190,255,${activeState ? .88 : .48})`;
  ctx.lineWidth = activeState ? 3 : 2;
  ctx.lineCap = "round";

  const rings = [
    { rx: 34, ry: 45, start: Math.PI * .17, end: Math.PI * .83 },
    { rx: 26, ry: 36, start: Math.PI * .13, end: Math.PI * .87 },
    { rx: 18, ry: 27, start: Math.PI * .10, end: Math.PI * .90 },
    { rx: 10, ry: 17, start: Math.PI * .08, end: Math.PI * .92 }
  ];

  for (const ring of rings) {
    ctx.beginPath();
    ctx.ellipse(0, 4, ring.rx, ring.ry, 0, ring.start, ring.end);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-29, 23);
  ctx.quadraticCurveTo(-8, 49, 0, 50);
  ctx.quadraticCurveTo(8, 49, 29, 23);
  ctx.stroke();

  ctx.restore();
}

function drawControlModule(side, songTime) {
  const m = view();
  const pivot = m.pivot[side];
  const phase = flipperPhase(side, songTime);
  const left = side === "left";

  const pad = left
    ? { x: 18, y: 812, w: 205, h: 140 }
    : { x: 317, y: 812, w: 205, h: 140 };

  const neckOuterX = left ? 96 : 444;
  const neckInnerX = left ? 140 : 400;
  const neckTopY = pivot.y + 8;
  const neckBottomY = 840;

  ctx.save();

  ctx.shadowBlur = phase.active ? 24 : 10;
  ctx.shadowColor = left
    ? "rgba(92,198,255,.38)"
    : "rgba(196,121,255,.34)";

  ctx.beginPath();

  if (left) {
    ctx.moveTo(neckOuterX, neckTopY);
    ctx.quadraticCurveTo(96, 794, 82, 812);
    ctx.lineTo(54, 812);
    ctx.quadraticCurveTo(18, 812, 18, 848);
    ctx.lineTo(18, 916);
    ctx.quadraticCurveTo(18, 952, 54, 952);
    ctx.lineTo(187, 952);
    ctx.quadraticCurveTo(223, 952, 223, 916);
    ctx.lineTo(223, 858);
    ctx.quadraticCurveTo(223, 828, 194, 820);
    ctx.lineTo(neckInnerX, neckBottomY);
    ctx.lineTo(neckInnerX, neckTopY);
    ctx.closePath();
  } else {
    ctx.moveTo(neckInnerX, neckTopY);
    ctx.lineTo(neckInnerX, neckBottomY);
    ctx.lineTo(346, 820);
    ctx.quadraticCurveTo(317, 828, 317, 858);
    ctx.lineTo(317, 916);
    ctx.quadraticCurveTo(317, 952, 353, 952);
    ctx.lineTo(486, 952);
    ctx.quadraticCurveTo(522, 952, 522, 916);
    ctx.lineTo(522, 848);
    ctx.quadraticCurveTo(522, 812, 486, 812);
    ctx.lineTo(458, 812);
    ctx.quadraticCurveTo(444, 794, neckOuterX, neckTopY);
    ctx.closePath();
  }

  const fill = ctx.createLinearGradient(0, neckTopY, 0, 952);

  if (left) {
    fill.addColorStop(0, phase.active ? "rgba(55,123,162,.98)" : "rgba(23,63,91,.94)");
    fill.addColorStop(1, "rgba(10,27,45,.98)");
    ctx.strokeStyle = phase.active
      ? "rgba(183,237,255,.88)"
      : "rgba(120,210,255,.46)";
  } else {
    fill.addColorStop(0, phase.active ? "rgba(98,70,134,.98)" : "rgba(53,39,83,.94)");
    fill.addColorStop(1, "rgba(25,20,51,.98)");
    ctx.strokeStyle = phase.active
      ? "rgba(236,213,255,.88)"
      : "rgba(211,166,255,.44)";
  }

  ctx.fillStyle = fill;
  ctx.lineWidth = phase.active ? 3 : 2;
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = phase.active ? .95 : .72;
  drawFingerprint(
    left ? pad.x + 103 : pad.x + 102,
    pad.y + 63,
    side,
    phase.active
  );
  ctx.globalAlpha = 1;

  ctx.fillStyle = phase.active
    ? "#fff2ad"
    : left
      ? "rgba(224,247,255,.78)"
      : "rgba(245,229,255,.78)";
  ctx.font = "900 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(left ? "A" : "D", pad.x + pad.w / 2, 927);

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

  ctx.lineWidth = phase.attack ? FLIPPER.width + 5 : FLIPPER.width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(segment.pivot.x, segment.pivot.y);
  ctx.lineTo(segment.tip.x, segment.tip.y);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = phase.active ? "#243a51" : "#132238";
  ctx.beginPath();
  ctx.arc(segment.pivot.x, segment.pivot.y, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = phase.attack ? 22 : 8;
  ctx.shadowColor = phase.attack ? "#ffe985" : "#9edcff";
  ctx.fillStyle = phase.attack ? "#ffe985" : "#9edcff";
  ctx.beginPath();
  ctx.arc(segment.tip.x, segment.tip.y, phase.attack ? 10 : 7, 0, Math.PI * 2);
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

    ctx.strokeStyle = `rgba(255,240,170,${alpha * 0.8})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, 8 + t * 30, 0, Math.PI * 2);
    ctx.stroke();

    for (const particle of explosion.particles) {
      const distance = particle.speed * explosion.life;
      const x = explosion.x + Math.cos(particle.angle) * distance;
      const y = explosion.y + Math.sin(particle.angle) * distance;

      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMessage() {
  if (performance.now() > messageUntil) return;

  ctx.fillStyle = messageColor;
  ctx.font = "900 25px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, DESIGN.width / 2, 455);
}

function drawCountIn(songTime) {
  if (songTime >= 0) return;

  const remaining = Math.max(1, Math.ceil(-clock.beat));

  ctx.fillStyle = "rgba(255,255,255,.86)";
  ctx.font = "900 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(remaining), DESIGN.width / 2, 365);

  ctx.font = "700 12px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.48)";
  ctx.fillText("PREPÁRATE", DESIGN.width / 2, 405);
}

function drawDebug(songTime) {
  const loopBeat = ((clock.beat % LOOP_BEATS) + LOOP_BEATS) % LOOP_BEATS;
  const leftPhase = flipperPhase("left", songTime);
  const rightPhase = flipperPhase("right", songTime);

  const lines = [
    `TAP v0.10   ${chartName}   BPM ${BPM}   beat ${loopBeat.toFixed(2)}`,
    `nota ${NOTE_SPEED}px/s CONSTANTE   post-hit ${POST_HIT_SPEED}px/s`,
    `P ±45  G ±90  GOOD ±160ms`,
    `último Δ ${lastDeltaMs === null ? "—" : `${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`}`,
    `L ${leftPhase.active ? "OCUPADA" : "LISTA"}   R ${rightPhase.active ? "OCUPADA" : "LISTA"}`,
    `hits ${hitCount} miss ${missCount} chain ${chainCount} choque ${collisionCount} pared ${wallExplosionCount}`,
    `input ${lastInputType}   offset ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`,
    `FPS ${fps.toFixed(0)}   multi x${comboMultiplier(combo)}`
  ];

  ctx.fillStyle = "rgba(0,0,0,.50)";
  ctx.fillRect(12, 92, 390, 132);

  ctx.fillStyle = "rgba(235,244,255,.78)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  lines.forEach((line, index) => {
    ctx.fillText(line, 19, 101 + index * 15);
  });
}

function render(songTime) {
  clearCanvas();
  drawBackground();

  for (const note of active.values()) {
    drawNote(note);
  }

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

  const dt = Math.min(0.033, (now - lastFrame) / 1000 || 0);
  lastFrame = now;

  if (dt > 0) fps += ((1 / dt) - fps) * 0.08;

  const songTime = clock.songTime;

  spawnReady(songTime);
  updateNotes(dt, songTime);
  resolveFlipperCollisions(songTime);
  resolveProjectileCollisions();
  updateExplosions(dt);
  updateWhiffs(songTime);
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
    triggerFlipper(side, event.timeStamp, event.pointerType || "touch");
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

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  const key = event.key.toLowerCase();

  if (key === "h") {
    showDebug = !showDebug;
    return;
  }

  if (key === "[") {
    calibrationOffsetMs = clamp(calibrationOffsetMs - 5, -200, 200);
    showMessage(
      `OFFSET ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`,
      "#79d8ff",
      500
    );
    return;
  }

  if (key === "]") {
    calibrationOffsetMs = clamp(calibrationOffsetMs + 5, -200, 200);
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
  whiffCount = 0;
  collisionCount = 0;
  chainCount = 0;
  wallExplosionCount = 0;
  lastDeltaMs = null;
  lastJudgement = "—";
  lastInputType = "—";
  message = "";

  active.clear();
  resolved.clear();
  explosions = [];
  impactFlashes = [];

  flippers.left.startTime = -Infinity;
  flippers.left.hitThisSwing = false;
  flippers.right.startTime = -Infinity;
  flippers.right.hitThisSwing = false;

  updateHud();

  startButton.disabled = true;
  startButton.textContent = "INICIANDO…";

  await ensureChartLoaded();
  await clock.start();

  running = true;
  lastFrame = performance.now();
  startPanel.hidden = true;

  requestAnimationFrame(frame);
});

window.addEventListener("resize", () => {
  resizeCanvas();
  render(clock.songTime);
});

window.addEventListener("orientationchange", resizeCanvas);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden || !running) return;

  running = false;
  clock.stopScheduler();

  startPanel.hidden = false;
  startButton.disabled = false;
  startButton.textContent = "REINICIAR PRUEBA";
});

resizeCanvas();
buildRoutes();
updateHud();
render(clock.songTime);
