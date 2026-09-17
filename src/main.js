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
const NOTE_LEAD_SECONDS = 1.55;
const APPROACH_SECONDS = 0.48;
const MISS_AFTER_SECONDS = 0.24;

const WINDOWS = {
  perfect: 0.070,
  great: 0.140,
  good: 0.220
};

const JUDGEMENTS = {
  perfect: { label: "PERFECT", short: "P", points: 300, color: "#ffe47a" },
  great: { label: "GREAT", short: "G", points: 200, color: "#ca8cff" },
  good: { label: "GOOD", short: "OK", points: 100, color: "#79d8ff" }
};

const CHART = [
  { beat: 0, side: "left", symbol: "♩" },
  { beat: 1, side: "right", symbol: "♪" },
  { beat: 2, side: "left", symbol: "♪" },
  { beat: 3, side: "right", symbol: "♩" },
  { beat: 4, side: "left", symbol: "♬" },
  { beat: 4.5, side: "right", symbol: "♬" },
  { beat: 5, side: "left", symbol: "♬" },
  { beat: 5.5, side: "right", symbol: "♬" },
  { beat: 7, side: "right", symbol: "♩" },
  { beat: 8, side: "left", symbol: "♪" },
  { beat: 9, side: "left", symbol: "♪" },
  { beat: 10, side: "right", symbol: "♪" },
  { beat: 11, side: "right", symbol: "♪" },
  { beat: 12, side: "left", symbol: "♩" },
  { beat: 13, side: "right", symbol: "♩" },
  { beat: 14, side: "left", symbol: "♪" },
  { beat: 15, side: "right", symbol: "♪" }
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
    gain.gain.exponentialRampToValueAtTime(downbeat ? 0.105 : 0.055, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.055);
  }
}

const clock = new RhythmClock();
let viewport = { scale: 1, offsetX: 0, offsetY: 0, dpr: 1, cssWidth: 540, cssHeight: 960 };
let running = false;
let active = new Map();
let resolved = new Set();
let score = 0;
let combo = 0;
let lastDeltaMs = null;
let lastJudgement = "—";
let lastFrame = performance.now();
let fps = 60;
let flash = { left: 0, right: 0 };
let message = "";
let messageColor = "#fff0a3";
let messageUntil = 0;
let hitCount = 0;
let totalAbsDeltaMs = 0;
let totalSignedDeltaMs = 0;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smoothstep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function beatToSeconds(beat) {
  return beat * (60 / BPM);
}

function loopDuration() {
  return beatToSeconds(LOOP_BEATS);
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
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
}

function clearCanvas() {
  const { dpr, cssWidth, cssHeight } = viewport;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#080b12";
  ctx.fillRect(0, 0, cssWidth, cssHeight);
  setDesignTransform();
}

function view() {
  return {
    width: DESIGN.width,
    height: DESIGN.height,
    centerX: 270,
    auraY: 806,
    auraOuter: 226,
    auraMiddle: 170,
    auraInner: 114,
    spawnY: 118,
    approachY: 470,
    laneX: { left: 154, right: 386 },
    contact: {
      left: { x: 235, y: 756 },
      right: { x: 305, y: 756 }
    },
    pivot: {
      left: { x: 176, y: 810 },
      right: { x: 364, y: 810 }
    }
  };
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
      const until = targetTime - songTime;
      if (until <= NOTE_LEAD_SECONDS + 0.04 && until >= -MISS_AFTER_SECONDS - 0.04) {
        active.set(key, {
          key,
          ...event,
          targetTime,
          launched: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
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

function judgementFor(delta) {
  const abs = Math.abs(delta);
  if (abs <= WINDOWS.perfect) return JUDGEMENTS.perfect;
  if (abs <= WINDOWS.great) return JUDGEMENTS.great;
  if (abs <= WINDOWS.good) return JUDGEMENTS.good;
  return null;
}

function timingWord(deltaMs) {
  if (Math.abs(deltaMs) <= 8) return "CENTRO";
  return deltaMs < 0 ? "EARLY" : "LATE";
}

function candidateFor(side, now) {
  return [...active.values()]
    .filter((note) => !note.launched && note.side === side)
    .map((note) => ({ note, delta: now - note.targetTime }))
    .filter(({ delta }) => Math.abs(delta) <= WINDOWS.good)
    .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0] ?? null;
}

function oppositeCandidate(side, now) {
  const opposite = side === "left" ? "right" : "left";
  return candidateFor(opposite, now);
}

function hit(side) {
  if (!running) return;
  flash[side] = performance.now() + 120;

  const now = clock.songTime;
  const candidate = candidateFor(side, now);

  if (!candidate) {
    const opposite = oppositeCandidate(side, now);
    lastJudgement = opposite ? "LADO" : "VACÍO";
    lastDeltaMs = null;
    message = opposite ? "LADO CONTRARIO" : "SIN NOTA";
    messageColor = opposite ? "#ff9da9" : "rgba(235,244,255,.72)";
    messageUntil = performance.now() + 300;
    updateHud();
    return;
  }

  const { note, delta } = candidate;
  const judgement = judgementFor(delta);
  if (!judgement) return;

  const deltaMs = Math.round(delta * 1000);
  score += judgement.points;
  combo += 1;
  hitCount += 1;
  totalAbsDeltaMs += Math.abs(deltaMs);
  totalSignedDeltaMs += deltaMs;
  lastDeltaMs = deltaMs;
  lastJudgement = judgement.label;
  message = `${judgement.label} · ${timingWord(deltaMs)} ${Math.abs(deltaMs)}ms`;
  messageColor = judgement.color;
  messageUntil = performance.now() + 480;

  note.launched = true;
  note.life = 0;
  note.vx = side === "left" ? 370 : -370;
  note.vy = -500;
  note.x = view().contact[side].x;
  note.y = view().contact[side].y;
  resolved.add(note.key);

  if (navigator.vibrate) navigator.vibrate(judgement === JUDGEMENTS.perfect ? 8 : 5);
  updateHud();
}

function miss(note) {
  combo = 0;
  lastDeltaMs = Math.round((clock.songTime - note.targetTime) * 1000);
  lastJudgement = "MISS";
  message = "MISS";
  messageColor = "#ff7184";
  messageUntil = performance.now() + 400;
  active.delete(note.key);
  resolved.add(note.key);
  if (navigator.vibrate) navigator.vibrate(14);
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(score);
  comboEl.textContent = String(combo);
  lastHitEl.textContent = lastDeltaMs === null
    ? lastJudgement
    : `${lastJudgement} ${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`;
}

function incomingPosition(note, songTime, m) {
  const delta = songTime - note.targetTime;
  const laneX = m.laneX[note.side];
  const contact = m.contact[note.side];

  if (delta <= -APPROACH_SECONDS) {
    const travel = NOTE_LEAD_SECONDS - APPROACH_SECONDS;
    const elapsed = delta + NOTE_LEAD_SECONDS;
    const t = clamp(elapsed / travel, 0, 1);
    return {
      x: laneX,
      y: m.spawnY + (m.approachY - m.spawnY) * t
    };
  }

  if (delta <= 0) {
    const t = smoothstep((delta + APPROACH_SECONDS) / APPROACH_SECONDS);
    const bendX = laneX + (contact.x - laneX) * 0.35;
    const bendY = 650;
    const oneMinus = 1 - t;
    return {
      x: oneMinus * oneMinus * laneX + 2 * oneMinus * t * bendX + t * t * contact.x,
      y: oneMinus * oneMinus * m.approachY + 2 * oneMinus * t * bendY + t * t * contact.y
    };
  }

  const t = smoothstep(delta / MISS_AFTER_SECONDS);
  const direction = note.side === "left" ? 1 : -1;
  return {
    x: contact.x + direction * 16 * t,
    y: contact.y + 132 * t
  };
}

function updateNotes(dt, songTime, m) {
  for (const note of [...active.values()]) {
    if (note.launched) {
      note.life += dt;
      note.vy += 820 * dt;
      note.x += note.vx * dt;
      note.y += note.vy * dt;

      if (note.x < 22 && note.vx < 0) {
        note.x = 22;
        note.vx *= -0.62;
      } else if (note.x > m.width - 22 && note.vx > 0) {
        note.x = m.width - 22;
        note.vx *= -0.62;
      }

      if (note.life > 1.25 || note.y > m.height + 70) active.delete(note.key);
      continue;
    }

    const point = incomingPosition(note, songTime, m);
    note.x = point.x;
    note.y = point.y;

    if (songTime - note.targetTime > MISS_AFTER_SECONDS) miss(note);
  }
}

function drawBackground(m) {
  ctx.fillStyle = "#0a1020";
  ctx.fillRect(0, 0, m.width, m.height);

  ctx.fillStyle = "rgba(255,255,255,.16)";
  for (let i = 0; i < 34; i += 1) {
    const x = ((i * 73) % 521) / 521 * m.width;
    const y = ((i * 113) % 601) / 601 * m.height * 0.61;
    ctx.fillRect(x, y, 1.3, 1.3);
  }

  ctx.strokeStyle = "rgba(255,255,255,.055)";
  ctx.lineWidth = 1;
  for (const x of [m.laneX.left, m.laneX.right]) {
    ctx.beginPath();
    ctx.moveTo(x, m.spawnY - 20);
    ctx.lineTo(x, m.approachY + 12);
    ctx.stroke();
  }
}

function semicircle(m, radius, fill) {
  ctx.beginPath();
  ctx.moveTo(m.centerX - radius, m.auraY);
  ctx.arc(m.centerX, m.auraY, radius, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawAura(m) {
  semicircle(m, m.auraOuter, "rgba(65,150,255,.115)");
  semicircle(m, m.auraMiddle, "rgba(177,92,255,.145)");
  semicircle(m, m.auraInner, "rgba(255,207,75,.18)");

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 10px system-ui, sans-serif";
  ctx.fillStyle = "rgba(121,216,255,.58)";
  ctx.fillText("GOOD", m.centerX, m.auraY - m.auraOuter + 17);
  ctx.fillStyle = "rgba(202,140,255,.58)";
  ctx.fillText("GREAT", m.centerX, m.auraY - m.auraMiddle + 17);
  ctx.fillStyle = "rgba(255,228,122,.67)";
  ctx.fillText("PERFECT", m.centerX, m.auraY - m.auraInner + 17);
}

function flipperAngle(side, pressed) {
  if (side === "left") return pressed ? -0.80 : -0.38;
  return pressed ? Math.PI + 0.80 : Math.PI + 0.38;
}

function drawFlipper(m, side) {
  const now = performance.now();
  const pivot = m.pivot[side];
  const pressed = flash[side] > now;
  const angle = flipperAngle(side, pressed);
  const length = 82;

  ctx.save();
  ctx.translate(pivot.x, pivot.y);
  ctx.rotate(angle);
  ctx.strokeStyle = pressed ? "#fff0a3" : "#cfe9ff";
  ctx.lineWidth = 15;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#15243a";
  ctx.beginPath();
  ctx.arc(pivot.x, pivot.y, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawHitMarkers(m) {
  for (const side of ["left", "right"]) {
    const point = m.contact[side];
    ctx.strokeStyle = flash[side] > performance.now() ? "#ffe985" : "rgba(145,215,255,.68)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, 28, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawNote(note) {
  ctx.save();
  ctx.translate(note.x, note.y);

  if (note.launched) ctx.rotate(note.life * note.vx * 0.011);

  ctx.fillStyle = note.side === "left" ? "#6ed7ff" : "#d88bff";
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#08101d";
  ctx.font = "900 27px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(note.symbol, 0, 1);
  ctx.restore();
}

function drawDebug(songTime) {
  const beat = clock.beat;
  const loopBeat = ((beat % LOOP_BEATS) + LOOP_BEATS) % LOOP_BEATS;
  const avgAbs = hitCount ? totalAbsDeltaMs / hitCount : 0;
  const bias = hitCount ? totalSignedDeltaMs / hitCount : 0;
  const lines = [
    `TAP v0.2   BPM ${BPM}   beat ${loopBeat.toFixed(2)}`,
    `time ${songTime.toFixed(3)}s   FPS ${fps.toFixed(0)}`,
    `P ±${Math.round(WINDOWS.perfect * 1000)}  G ±${Math.round(WINDOWS.great * 1000)}  OK ±${Math.round(WINDOWS.good * 1000)} ms`,
    `delta ${lastDeltaMs === null ? "—" : `${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`}   avg |Δ| ${hitCount ? avgAbs.toFixed(0) : "—"}ms`,
    `bias ${hitCount ? `${bias >= 0 ? "+" : ""}${bias.toFixed(0)}ms` : "—"}   hits ${hitCount}`
  ];

  ctx.fillStyle = "rgba(0,0,0,.52)";
  ctx.fillRect(12, 92, 310, 87);
  ctx.fillStyle = "rgba(235,244,255,.78)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((line, index) => ctx.fillText(line, 19, 101 + index * 15));
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

function render(songTime) {
  const m = view();
  clearCanvas();
  drawBackground(m);
  drawAura(m);
  drawHitMarkers(m);

  for (const note of active.values()) drawNote(note);

  drawFlipper(m, "left");
  drawFlipper(m, "right");
  drawMessage();
  drawCountIn(songTime);
  drawDebug(songTime);
}

function frame(now) {
  if (!running) return;
  const dt = Math.min(0.033, (now - lastFrame) / 1000 || 0);
  lastFrame = now;
  if (dt > 0) fps += ((1 / dt) - fps) * 0.08;

  const songTime = clock.songTime;
  const m = view();
  spawnReady(songTime);
  updateNotes(dt, songTime, m);
  render(songTime);
  requestAnimationFrame(frame);
}

function pressVisual(button, activeState) {
  button.classList.toggle("active", activeState);
}

function bindButton(button, side) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    pressVisual(button, true);
    hit(side);
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
  if (key === "a" || event.key === "ArrowLeft") {
    pressVisual(leftButton, true);
    hit("left");
  }
  if (key === "l" || event.key === "ArrowRight") {
    pressVisual(rightButton, true);
    hit("right");
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (key === "a" || event.key === "ArrowLeft") pressVisual(leftButton, false);
  if (key === "l" || event.key === "ArrowRight") pressVisual(rightButton, false);
});

startButton.addEventListener("click", async () => {
  score = 0;
  combo = 0;
  lastDeltaMs = null;
  lastJudgement = "—";
  message = "";
  hitCount = 0;
  totalAbsDeltaMs = 0;
  totalSignedDeltaMs = 0;
  active.clear();
  resolved.clear();
  updateHud();

  startButton.disabled = true;
  startButton.textContent = "INICIANDO…";
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
updateHud();
render(clock.songTime);
