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
const BPM = 120;
const LOOP_BEATS = 16;
const COUNT_IN_BEATS = 4;

const NOTE_SPEED = 315;
const NOTE_RADIUS = 20;
const PATH_SAMPLES = 140;
const POST_HIT_SPEED = 430;

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
  length: 82,
  width: 18,
  attack: 0.075,
  hold: 0.015,
  return: 0.090
};
FLIPPER.cycle = FLIPPER.attack + FLIPPER.hold + FLIPPER.return;

const CHART = [
  { beat: 0, side: "left", route: 0, symbol: "♩" },
  { beat: 1, side: "right", route: 0, symbol: "♪" },
  { beat: 2, side: "left", route: 1, symbol: "♪" },
  { beat: 3, side: "right", route: 2, symbol: "♩" },
  { beat: 4, side: "left", route: 2, symbol: "♬" },
  { beat: 4.5, side: "right", route: 1, symbol: "♬" },
  { beat: 5, side: "left", route: 0, symbol: "♬" },
  { beat: 5.5, side: "right", route: 2, symbol: "♬" },
  { beat: 7, side: "right", route: 0, symbol: "♩" },
  { beat: 8, side: "left", route: 2, symbol: "♪" },
  { beat: 9, side: "left", route: 1, symbol: "♪" },
  { beat: 10, side: "right", route: 1, symbol: "♪" },
  { beat: 11, side: "right", route: 2, symbol: "♪" },
  { beat: 12, side: "left", route: 0, symbol: "♩" },
  { beat: 13, side: "right", route: 0, symbol: "♩" },
  { beat: 14, side: "left", route: 1, symbol: "♪" },
  { beat: 15, side: "right", route: 2, symbol: "♪" }
];

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
    gain.gain.exponentialRampToValueAtTime(downbeat ? 0.095 : 0.045, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.040);

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.050);
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
let score = 0;
let combo = 0;
let hitCount = 0;
let missCount = 0;
let whiffCount = 0;
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

function comboMultiplier(value = combo) {
  return Math.min(4, 1 + Math.floor(Math.max(0, value) / 10));
}

function view() {
  const leftPivot = { x: 178, y: 824 };
  const rightPivot = { x: 362, y: 824 };

  const leftRest = -0.53;
  const leftStrike = -1.08;
  const rightRest = Math.PI + 0.53;
  const rightStrike = Math.PI + 1.08;

  const leftImpactAngle = (leftRest + leftStrike) / 2;
  const rightImpactAngle = (rightRest + rightStrike) / 2;

  return {
    width: DESIGN.width,
    height: DESIGN.height,
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

    points.push({
      x: point.x,
      y: point.y,
      distance: length
    });

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
  const mirror = (point) => ({
    x: DESIGN.width - point.x,
    y: point.y
  });

  const leftDefs = [
    [
      { x: 82, y: 86 },
      { x: 74, y: 300 },
      { x: 132, y: 560 },
      m.impact.left
    ],
    [
      { x: 246, y: 70 },
      { x: 226, y: 270 },
      { x: 190, y: 560 },
      m.impact.left
    ],
    [
      { x: 392, y: 118 },
      { x: 326, y: 300 },
      { x: 270, y: 560 },
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

  return (
    clock.songTime -
    processingDelayMs / 1000 +
    calibrationOffsetMs / 1000
  );
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
  const currentLoop =
    songTime < 0 ? 0 : Math.floor(songTime / duration);

  const loops =
    currentLoop === 0
      ? [0, 1]
      : [currentLoop, currentLoop + 1];

  for (const loop of loops) {
    CHART.forEach((event, index) => {
      const key = `${loop}:${index}`;

      if (active.has(key) || resolved.has(key)) return;

      const path = routeFor(event.side, event.route);
      const targetTime =
        loop * duration + beatToSeconds(event.beat);
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
          launched: false,
          x: path.points[0].x,
          y: path.points[0].y,
          vx: 0,
          vy: 0,
          life: 0
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

  if (elapsed < 0 || elapsed >= FLIPPER.cycle) {
    return {
      active: false,
      attack: false,
      angle: view().restAngle[side]
    };
  }

  const m = view();
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

  const returnElapsed =
    elapsed - FLIPPER.attack - FLIPPER.hold;

  return {
    active: true,
    attack: false,
    angle: lerp(
      strike,
      rest,
      returnElapsed / FLIPPER.return
    )
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

  if (lengthSq <= 0.0001) {
    return Math.hypot(apx, apy);
  }

  const t = clamp(
    (apx * abx + apy * aby) / lengthSq,
    0,
    1
  );

  const closestX = a.x + abx * t;
  const closestY = a.y + aby * t;

  return Math.hypot(
    point.x - closestX,
    point.y - closestY
  );
}

function playTone(
  frequency,
  duration = 0.045,
  volume = 0.05,
  type = "sine"
) {
  if (!clock.context) return;

  const oscillator = clock.context.createOscillator();
  const gain = clock.context.createGain();
  const now = clock.context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(
    Math.max(0.0001, volume),
    now
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + duration
  );

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

function showMessage(
  text,
  color,
  milliseconds = 420
) {
  message = text;
  messageColor = color;
  messageUntil = performance.now() + milliseconds;
}

function triggerFlipper(
  side,
  eventTimestamp = null,
  inputType = "unknown"
) {
  if (!running) return;

  const inputTime = eventSongTime(eventTimestamp);
  const currentPhase = flipperPhase(side, inputTime);

  lastInputType = inputType;

  if (currentPhase.active) return;

  flippers[side].startTime = inputTime;
  flippers[side].hitThisSwing = false;
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

  const direction = side === "left" ? 1 : -1;
  const vertical = delta <= 0 ? -1 : -0.72;
  const vectorLength =
    Math.hypot(direction, vertical) || 1;

  note.vx =
    (direction / vectorLength) * POST_HIT_SPEED;
  note.vy =
    (vertical / vectorLength) * POST_HIT_SPEED;

  resolved.add(note.key);
  flippers[side].hitThisSwing = true;

  showMessage(
    `${judgement.label} · ${deltaMs >= 0 ? "+" : ""}${deltaMs}ms · x${multiplier}`,
    judgement.color
  );

  hitSound(side, judgement);

  if (navigator.vibrate) {
    navigator.vibrate(
      judgement === JUDGEMENTS.perfect ? 8 : 5
    );
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

  if (navigator.vibrate) {
    navigator.vibrate(12);
  }

  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(score);
  comboEl.textContent =
    combo
      ? `${combo} · x${comboMultiplier(combo)}`
      : "0";

  lastHitEl.textContent =
    lastDeltaMs === null
      ? lastJudgement
      : `${lastJudgement} ${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`;
}

function updateNotes(dt, songTime) {
  for (const note of [...active.values()]) {
    if (note.launched) {
      note.life += dt;
      note.x += note.vx * dt;
      note.y += note.vy * dt;

      if (
        note.x < NOTE_RADIUS &&
        note.vx < 0
      ) {
        note.x = NOTE_RADIUS;
        note.vx *= -1;
      } else if (
        note.x > DESIGN.width - NOTE_RADIUS &&
        note.vx > 0
      ) {
        note.x = DESIGN.width - NOTE_RADIUS;
        note.vx *= -1;
      }

      if (
        note.life > 1.25 ||
        note.y < -80 ||
        note.y > DESIGN.height + 80
      ) {
        active.delete(note.key);
      }

      continue;
    }

    const distance =
      note.path.length -
      NOTE_SPEED * (note.targetTime - songTime);

    const point = pointAtDistance(
      note.path,
      distance
    );

    note.x = point.x;
    note.y = point.y;

    if (
      songTime - note.targetTime >
      WINDOWS.good
    ) {
      miss(note);
    }
  }
}

function resolveCollisions(songTime) {
  for (const side of ["left", "right"]) {
    const state = flippers[side];
    const segment = flipperSegment(
      side,
      songTime
    );

    if (
      !segment.phase.attack ||
      state.hitThisSwing
    ) {
      continue;
    }

    const candidates = [...active.values()]
      .filter(
        (note) =>
          !note.launched &&
          note.side === side
      )
      .sort(
        (a, b) =>
          Math.abs(a.targetTime - songTime) -
          Math.abs(b.targetTime - songTime)
      );

    for (const note of candidates) {
      if (
        Math.abs(
          songTime - note.targetTime
        ) > WINDOWS.good + 0.035
      ) {
        continue;
      }

      const distance =
        distancePointToSegment(
          note,
          segment.pivot,
          segment.tip
        );

      const collisionDistance =
        NOTE_RADIUS +
        FLIPPER.width * 0.5;

      if (
        distance <= collisionDistance &&
        resolveHit(note, side, songTime)
      ) {
        break;
      }
    }
  }
}

function updateWhiffs(songTime) {
  for (const side of ["left", "right"]) {
    const state = flippers[side];
    const elapsed =
      songTime - state.startTime;

    if (
      Number.isFinite(state.startTime) &&
      elapsed >= FLIPPER.cycle &&
      elapsed < FLIPPER.cycle + 0.050
    ) {
      if (!state.hitThisSwing) {
        whiffCount += 1;
      }

      state.startTime = -Infinity;
      state.hitThisSwing = false;
    }
  }
}

function drawBackground() {
  ctx.fillStyle = "#0a1020";
  ctx.fillRect(
    0,
    0,
    DESIGN.width,
    DESIGN.height
  );

  ctx.fillStyle =
    "rgba(255,255,255,.15)";

  for (let i = 0; i < 34; i += 1) {
    const x =
      (((i * 73) % 521) / 521) *
      DESIGN.width;
    const y =
      (((i * 113) % 601) / 601) *
      DESIGN.height *
      0.61;

    ctx.fillRect(x, y, 1.2, 1.2);
  }
}

function drawPath(
  path,
  alpha = 0.06,
  width = 1.2
) {
  ctx.strokeStyle =
    `rgba(210,230,255,${alpha})`;
  ctx.lineWidth = width;
  ctx.beginPath();

  path.points.forEach(
    (point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
  );

  ctx.stroke();
}

function drawTimingTicks(note) {
  if (note.launched) return;

  const markers = [
    {
      seconds: WINDOWS.good,
      color: "rgba(121,216,255,.48)"
    },
    {
      seconds: WINDOWS.great,
      color: "rgba(202,140,255,.55)"
    },
    {
      seconds: WINDOWS.perfect,
      color: "rgba(255,228,122,.68)"
    }
  ];

  for (const marker of markers) {
    const distance =
      note.path.length -
      NOTE_SPEED * marker.seconds;

    const a = pointAtDistance(
      note.path,
      distance - 5
    );
    const b = pointAtDistance(
      note.path,
      distance + 5
    );

    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const tangentLength =
      Math.hypot(tx, ty) || 1;

    const nx = -ty / tangentLength;
    const ny = tx / tangentLength;

    const center = pointAtDistance(
      note.path,
      distance
    );

    ctx.strokeStyle = marker.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(
      center.x - nx * 13,
      center.y - ny * 13
    );
    ctx.lineTo(
      center.x + nx * 13,
      center.y + ny * 13
    );
    ctx.stroke();
  }
}

function drawNote(note) {
  ctx.save();
  ctx.translate(note.x, note.y);

  if (note.launched) {
    ctx.rotate(
      Math.atan2(note.vy, note.vx) +
      Math.PI / 2
    );
  }

  ctx.fillStyle =
    note.side === "left"
      ? "#6ed7ff"
      : "#d88bff";

  ctx.beginPath();
  ctx.arc(
    0,
    0,
    NOTE_RADIUS,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle = "#08101d";
  ctx.font =
    "900 25px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(note.symbol, 0, 1);

  ctx.restore();
}

function drawSweepFan(side, songTime) {
  const m = view();
  const pivot = m.pivot[side];
  const phase = flipperPhase(
    side,
    songTime
  );
  const rest = m.restAngle[side];
  const strike = m.strikeAngle[side];

  ctx.save();
  ctx.globalAlpha =
    phase.active ? 0.18 : 0.08;
  ctx.fillStyle =
    phase.active
      ? "#ffe985"
      : "#9ecfff";

  ctx.beginPath();
  ctx.moveTo(pivot.x, pivot.y);
  ctx.arc(
    pivot.x,
    pivot.y,
    FLIPPER.length + 15,
    rest,
    strike,
    side === "right"
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFlipper(side, songTime) {
  const segment = flipperSegment(
    side,
    songTime
  );
  const phase = segment.phase;

  drawSweepFan(side, songTime);

  ctx.save();

  ctx.strokeStyle =
    phase.attack
      ? "#fff0a3"
      : phase.active
        ? "#d7efff"
        : "#cfe9ff";

  ctx.lineWidth = FLIPPER.width;
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

  ctx.fillStyle = "#15243a";
  ctx.beginPath();
  ctx.arc(
    segment.pivot.x,
    segment.pivot.y,
    10,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

function drawMessage() {
  if (
    performance.now() >
    messageUntil
  ) {
    return;
  }

  ctx.fillStyle = messageColor;
  ctx.font =
    "900 25px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    message,
    DESIGN.width / 2,
    455
  );
}

function drawCountIn(songTime) {
  if (songTime >= 0) return;

  const remaining =
    Math.max(1, Math.ceil(-clock.beat));

  ctx.fillStyle =
    "rgba(255,255,255,.86)";
  ctx.font =
    "900 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    String(remaining),
    DESIGN.width / 2,
    365
  );

  ctx.font =
    "700 12px system-ui, sans-serif";
  ctx.fillStyle =
    "rgba(255,255,255,.48)";

  ctx.fillText(
    "PREPÁRATE",
    DESIGN.width / 2,
    405
  );
}

function drawDebug(songTime) {
  const loopBeat =
    ((clock.beat % LOOP_BEATS) +
      LOOP_BEATS) %
    LOOP_BEATS;

  const leftPhase =
    flipperPhase("left", songTime);
  const rightPhase =
    flipperPhase("right", songTime);

  const lines = [
    `TAP v0.6   BPM ${BPM}   beat ${loopBeat.toFixed(2)}`,
    `velocidad notas ${NOTE_SPEED}px/s CONSTANTE`,
    `P ±45  G ±90  GOOD ±160ms`,
    `último Δ ${lastDeltaMs === null ? "—" : `${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`}`,
    `L ${leftPhase.active ? "OCUPADA" : "LISTA"}   R ${rightPhase.active ? "OCUPADA" : "LISTA"}`,
    `hits ${hitCount}   miss ${missCount}   swings vacíos ${whiffCount}`,
    `input ${lastInputType}   offset ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`,
    `FPS ${fps.toFixed(0)}   multi x${comboMultiplier(combo)}`
  ];

  ctx.fillStyle =
    "rgba(0,0,0,.50)";
  ctx.fillRect(12, 92, 350, 132);

  ctx.fillStyle =
    "rgba(235,244,255,.78)";
  ctx.font =
    "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  lines.forEach(
    (line, index) => {
      ctx.fillText(
        line,
        19,
        101 + index * 15
      );
    }
  );
}

function render(songTime) {
  clearCanvas();
  drawBackground();

  for (const side of [
    "left",
    "right"
  ]) {
    routes[side].forEach((path) =>
      drawPath(path)
    );
  }

  const nextBySide = {
    left: [...active.values()]
      .filter(
        (note) =>
          !note.launched &&
          note.side === "left"
      )
      .sort(
        (a, b) =>
          a.targetTime - b.targetTime
      )[0],

    right: [...active.values()]
      .filter(
        (note) =>
          !note.launched &&
          note.side === "right"
      )
      .sort(
        (a, b) =>
          a.targetTime - b.targetTime
      )[0]
  };

  if (nextBySide.left) {
    drawPath(
      nextBySide.left.path,
      0.18,
      2
    );
    drawTimingTicks(nextBySide.left);
  }

  if (nextBySide.right) {
    drawPath(
      nextBySide.right.path,
      0.18,
      2
    );
    drawTimingTicks(nextBySide.right);
  }

  for (const note of active.values()) {
    drawNote(note);
  }

  drawFlipper("left", songTime);
  drawFlipper("right", songTime);
  drawMessage();
  drawCountIn(songTime);
  drawDebug(songTime);
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

  const songTime = clock.songTime;

  spawnReady(songTime);
  updateNotes(dt, songTime);
  resolveCollisions(songTime);
  updateWhiffs(songTime);
  render(songTime);

  requestAnimationFrame(frame);
}

function pressVisual(button, state) {
  button.classList.toggle(
    "active",
    state
  );
}

function bindButton(button, side) {
  button.addEventListener(
    "pointerdown",
    (event) => {
      event.preventDefault();
      button.setPointerCapture?.(
        event.pointerId
      );
      pressVisual(button, true);
      triggerFlipper(
        side,
        event.timeStamp,
        event.pointerType || "touch"
      );
    }
  );

  const release = (event) => {
    event?.preventDefault?.();
    pressVisual(button, false);
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

window.addEventListener(
  "keydown",
  (event) => {
    if (event.repeat) return;

    const key =
      event.key.toLowerCase();

    if (key === "[") {
      calibrationOffsetMs =
        clamp(
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
      calibrationOffsetMs =
        clamp(
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

    if (
      key === "a" ||
      event.key === "ArrowLeft"
    ) {
      pressVisual(
        leftButton,
        true
      );
      triggerFlipper(
        "left",
        event.timeStamp,
        "keyboard"
      );
    }

    if (
      key === "d" ||
      event.key === "ArrowRight"
    ) {
      pressVisual(
        rightButton,
        true
      );
      triggerFlipper(
        "right",
        event.timeStamp,
        "keyboard"
      );
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    const key =
      event.key.toLowerCase();

    if (
      key === "a" ||
      event.key === "ArrowLeft"
    ) {
      pressVisual(
        leftButton,
        false
      );
    }

    if (
      key === "d" ||
      event.key === "ArrowRight"
    ) {
      pressVisual(
        rightButton,
        false
      );
    }
  }
);

startButton.addEventListener(
  "click",
  async () => {
    score = 0;
    combo = 0;
    hitCount = 0;
    missCount = 0;
    whiffCount = 0;
    lastDeltaMs = null;
    lastJudgement = "—";
    lastInputType = "—";
    message = "";

    active.clear();
    resolved.clear();

    flippers.left.startTime =
      -Infinity;
    flippers.left.hitThisSwing =
      false;
    flippers.right.startTime =
      -Infinity;
    flippers.right.hitThisSwing =
      false;

    updateHud();

    startButton.disabled = true;
    startButton.textContent =
      "INICIANDO…";

    await clock.start();

    running = true;
    lastFrame = performance.now();
    startPanel.hidden = true;

    requestAnimationFrame(frame);
  }
);

window.addEventListener(
  "resize",
  () => {
    resizeCanvas();
    render(clock.songTime);
  }
);

window.addEventListener(
  "orientationchange",
  resizeCanvas
);

document.addEventListener(
  "visibilitychange",
  () => {
    if (
      !document.hidden ||
      !running
    ) {
      return;
    }

    running = false;
    clock.stopScheduler();

    startPanel.hidden = false;
    startButton.disabled = false;
    startButton.textContent =
      "REINICIAR PRUEBA";
  }
);

resizeCanvas();
buildRoutes();
updateHud();
render(clock.songTime);
