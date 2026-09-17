const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const startPanel = document.querySelector("#startPanel");
const startButton = document.querySelector("#startButton");
const leftButton = document.querySelector("#leftButton");
const rightButton = document.querySelector("#rightButton");
const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const lastHitEl = document.querySelector("#lastHit");

const BPM = 120;
const LOOP_BEATS = 16;
const COUNT_IN_BEATS = 4;
const NOTE_LEAD_SECONDS = 1.55;
const WINDOWS = {
  perfect: 0.070,
  great: 0.140,
  good: 0.220
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
    gain.gain.exponentialRampToValueAtTime(downbeat ? 0.12 : 0.065, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);

    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.055);
  }
}

const clock = new RhythmClock();
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
let messageUntil = 0;

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
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function view() {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const hitY = height * 0.77;
  return {
    width,
    height,
    hitY,
    spawnY: height * 0.13,
    leftX: width * 0.34,
    rightX: width * 0.66,
    centerX: width * 0.5,
    auraY: height * 0.80,
    auraOuter: Math.min(width * 0.43, height * 0.22),
    auraMiddle: Math.min(width * 0.34, height * 0.17),
    auraInner: Math.min(width * 0.25, height * 0.125)
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
      if (until <= NOTE_LEAD_SECONDS + 0.04 && until >= -WINDOWS.good - 0.08) {
        active.set(key, {
          key,
          ...event,
          targetTime,
          hit: false,
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
  if (abs <= WINDOWS.perfect) return { label: "PERFECT", points: 300 };
  if (abs <= WINDOWS.great) return { label: "GREAT", points: 200 };
  if (abs <= WINDOWS.good) return { label: "GOOD", points: 100 };
  return null;
}

function hit(side) {
  if (!running) return;
  flash[side] = performance.now() + 110;

  const now = clock.songTime;
  const candidates = [...active.values()]
    .filter((note) => !note.launched && note.side === side)
    .map((note) => ({ note, delta: now - note.targetTime }))
    .filter(({ delta }) => Math.abs(delta) <= WINDOWS.good)
    .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta));

  if (!candidates.length) {
    lastJudgement = "VACÍO";
    lastDeltaMs = null;
    message = "SIN NOTA";
    messageUntil = performance.now() + 280;
    updateHud();
    return;
  }

  const { note, delta } = candidates[0];
  const judgement = judgementFor(delta);
  if (!judgement) return;

  score += judgement.points;
  combo += 1;
  lastDeltaMs = Math.round(delta * 1000);
  lastJudgement = judgement.label;
  message = judgement.label;
  messageUntil = performance.now() + 420;

  note.hit = true;
  note.launched = true;
  note.life = 0;
  note.vx = side === "left" ? 260 : -260;
  note.vy = -360;
  resolved.add(note.key);
  updateHud();
}

function miss(note) {
  combo = 0;
  lastDeltaMs = Math.round((clock.songTime - note.targetTime) * 1000);
  lastJudgement = "MISS";
  message = "MISS";
  messageUntil = performance.now() + 380;
  active.delete(note.key);
  resolved.add(note.key);
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(score);
  comboEl.textContent = String(combo);
  lastHitEl.textContent = lastDeltaMs === null
    ? lastJudgement
    : `${lastJudgement} ${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`;
}

function updateNotes(dt, songTime, m) {
  const speed = (m.hitY - m.spawnY) / NOTE_LEAD_SECONDS;

  for (const note of [...active.values()]) {
    if (note.launched) {
      note.life += dt;
      note.vy += 760 * dt;
      note.x += note.vx * dt;
      note.y += note.vy * dt;
      if (note.life > 0.9 || note.x < -50 || note.x > m.width + 50 || note.y > m.height + 60) {
        active.delete(note.key);
      }
      continue;
    }

    note.x = note.side === "left" ? m.leftX : m.rightX;
    note.y = m.hitY + (songTime - note.targetTime) * speed;

    if (songTime - note.targetTime > WINDOWS.good) miss(note);
  }
}

function drawBackground(m) {
  ctx.fillStyle = "#0a1020";
  ctx.fillRect(0, 0, m.width, m.height);

  ctx.fillStyle = "rgba(255,255,255,.18)";
  for (let i = 0; i < 34; i += 1) {
    const x = ((i * 73) % 521) / 521 * m.width;
    const y = ((i * 113) % 601) / 601 * m.height * 0.62;
    ctx.fillRect(x, y, 1.3, 1.3);
  }

  ctx.strokeStyle = "rgba(255,255,255,.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(m.width * 0.5, m.height * 0.12);
  ctx.lineTo(m.width * 0.5, m.hitY + 20);
  ctx.stroke();
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
  semicircle(m, m.auraOuter, "rgba(65,150,255,.12)");
  semicircle(m, m.auraMiddle, "rgba(177,92,255,.14)");
  semicircle(m, m.auraInner, "rgba(255,207,75,.17)");
}

function drawFlipper(m, side) {
  const now = performance.now();
  const isLeft = side === "left";
  const x = isLeft ? m.leftX : m.rightX;
  const y = m.hitY + 24;
  const pressed = flash[side] > now;
  const baseAngle = isLeft ? 0.30 : Math.PI - 0.30;
  const angle = baseAngle + (pressed ? (isLeft ? -0.48 : 0.48) : 0);
  const length = Math.min(86, m.width * 0.19);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = pressed ? "#fff0a3" : "#cfe9ff";
  ctx.lineWidth = 15;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(isLeft ? length : -length, 0);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#15243a";
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawHitMarkers(m) {
  for (const [side, x] of [["left", m.leftX], ["right", m.rightX]]) {
    ctx.strokeStyle = flash[side] > performance.now() ? "#ffe985" : "rgba(145,215,255,.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, m.hitY, 31, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawNote(note) {
  ctx.save();
  ctx.translate(note.x, note.y);

  if (note.launched) ctx.rotate(note.life * note.vx * 0.008);

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

function drawDebug(m, songTime) {
  const beat = clock.beat;
  const loopBeat = ((beat % LOOP_BEATS) + LOOP_BEATS) % LOOP_BEATS;
  const lines = [
    `BPM ${BPM}   beat ${loopBeat.toFixed(2)}`,
    `time ${songTime.toFixed(3)}s   FPS ${fps.toFixed(0)}`,
    `P ±${Math.round(WINDOWS.perfect * 1000)}  G ±${Math.round(WINDOWS.great * 1000)}  OK ±${Math.round(WINDOWS.good * 1000)} ms`,
    `delta ${lastDeltaMs === null ? "—" : `${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`}`
  ];

  ctx.fillStyle = "rgba(0,0,0,.48)";
  ctx.fillRect(10, m.height * 0.105, 250, 70);
  ctx.fillStyle = "rgba(235,244,255,.76)";
  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((line, index) => ctx.fillText(line, 17, m.height * 0.115 + index * 15));
}

function drawMessage(m) {
  if (performance.now() > messageUntil) return;
  ctx.fillStyle = message === "MISS" ? "#ff7184" : "#fff0a3";
  ctx.font = "900 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, m.centerX, m.height * 0.48);
}

function render(songTime) {
  const m = view();
  drawBackground(m);
  drawAura(m);
  drawHitMarkers(m);

  for (const note of active.values()) drawNote(note);

  drawFlipper(m, "left");
  drawFlipper(m, "right");
  drawMessage(m);
  drawDebug(m, songTime);
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

window.addEventListener("resize", resizeCanvas);
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
