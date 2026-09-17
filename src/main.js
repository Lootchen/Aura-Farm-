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
const NOTE_LEAD_SECONDS = 1.45;
const NOTE_SPEED = 520;
const IMPACT_GRACE_SECONDS = 0.030;

const WINDOWS = {
  perfect: 0.045,
  great: 0.090,
  good: 0.160
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
let calibrationOffsetMs = 0;
let lastInputType = "—";
let lastProcessingDelayMs = 0;
let mistakeCount = 0;

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
  const centerX = 270;
  const auraY = 820;
  const contactRadius = 76;
  const angles = {
    left: -104 * Math.PI / 180,
    right: -76 * Math.PI / 180
  };

  const unit = {
    left: { x: Math.cos(angles.left), y: Math.sin(angles.left) },
    right: { x: Math.cos(angles.right), y: Math.sin(angles.right) }
  };

  const contact = {
    left: {
      x: centerX + unit.left.x * contactRadius,
      y: auraY + unit.left.y * contactRadius
    },
    right: {
      x: centerX + unit.right.x * contactRadius,
      y: auraY + unit.right.y * contactRadius
    }
  };

  return {
    width: DESIGN.width,
    height: DESIGN.height,
    centerX,
    auraY,
    contactRadius,
    auraOuter: contactRadius + NOTE_SPEED * WINDOWS.good,
    auraMiddle: contactRadius + NOTE_SPEED * WINDOWS.great,
    auraInner: contactRadius + NOTE_SPEED * WINDOWS.perfect,
    unit,
    contact,
    pivot: {
      left: { x: 158, y: 846 },
      right: { x: 382, y: 846 }
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
      if (until <= NOTE_LEAD_SECONDS + 0.04 && until >= -IMPACT_GRACE_SECONDS) {
        active.set(key, {
          key,
          ...event,
          targetTime,
          launched: false,
          armed: false,
          armedJudgement: null,
          armedDeltaMs: null,
          scheduledImpact: false,
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

function judgementForLead(leadSeconds) {
  if (leadSeconds < 0 || leadSeconds > WINDOWS.good) return null;
  if (leadSeconds <= WINDOWS.perfect) return JUDGEMENTS.perfect;
  if (leadSeconds <= WINDOWS.great) return JUDGEMENTS.great;
  return JUDGEMENTS.good;
}

function timingWord(deltaMs) {
  const lead = Math.abs(deltaMs);
  if (lead <= 8) return "AL LÍMITE";
  return `${lead}ms ANTES`;
}

function comboMultiplier(value = combo) {
  return Math.min(4, 1 + Math.floor(Math.max(0, value) / 10));
}

function candidateFor(side, now) {
  return [...active.values()]
    .filter((note) => !note.launched && !note.armed && note.side === side)
    .map((note) => ({
      note,
      lead: note.targetTime - now
    }))
    .filter(({ lead }) => lead >= 0 && lead <= WINDOWS.good)
    .sort((a, b) => a.note.targetTime - b.note.targetTime)[0] ?? null;
}

function armedNoteFor(side) {
  return [...active.values()]
    .find((note) => !note.launched && note.armed && note.side === side) ?? null;
}

function oppositeCandidate(side, now) {
  const opposite = side === "left" ? "right" : "left";
  return candidateFor(opposite, now);
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

function scheduleImpactSound(side, judgement, targetTime) {
  if (!clock.context) return;
  const base = side === "left" ? 310 : 390;
  const bonus = judgement === JUDGEMENTS.perfect ? 150 : judgement === JUDGEMENTS.great ? 80 : 20;
  const oscillator = clock.context.createOscillator();
  const gain = clock.context.createGain();
  const impactAt = Math.max(clock.context.currentTime + 0.002, clock.startAt + targetTime);

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(base + bonus, impactAt);
  gain.gain.setValueAtTime(0.0001, impactAt);
  gain.gain.exponentialRampToValueAtTime(judgement === JUDGEMENTS.perfect ? 0.08 : 0.06, impactAt + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, impactAt + 0.060);

  oscillator.connect(gain);
  gain.connect(clock.context.destination);
  oscillator.start(impactAt);
  oscillator.stop(impactAt + 0.070);
}

function playArmSound(judgement) {
  const frequency = judgement === JUDGEMENTS.perfect ? 760 : judgement === JUDGEMENTS.great ? 650 : 560;
  playTone(frequency, 0.025, 0.022, "sine");
}

function playErrorSound() {
  playTone(145, 0.07, 0.045, "square");
}

function eventSongTime(eventTimestamp) {
  const timestamp = Number(eventTimestamp);
  const processingDelayMs = Number.isFinite(timestamp)
    ? clamp(performance.now() - timestamp, 0, 100)
    : 0;
  lastProcessingDelayMs = processingDelayMs;
  return clock.songTime - processingDelayMs / 1000 + calibrationOffsetMs / 1000;
}

function strikeFault(label, detail = "") {
  combo = 0;
  mistakeCount += 1;
  lastJudgement = label;
  lastDeltaMs = null;
  message = detail ? `${label} · ${detail}` : label;
  messageColor = "#ff8d9c";
  messageUntil = performance.now() + 360;
  playErrorSound();
  if (navigator.vibrate) navigator.vibrate(10);
  updateHud();
}

function armHit(side, eventTimestamp = null, inputType = "unknown") {
  if (!running) return;
  lastInputType = inputType;

  const now = eventSongTime(eventTimestamp);

  if (armedNoteFor(side)) {
    strikeFault("DOBLE GOLPE");
    return;
  }

  const candidate = candidateFor(side, now);

  if (!candidate) {
    const opposite = oppositeCandidate(side, now);
    strikeFault(opposite ? "LADO CONTRARIO" : "OVERSTRIKE");
    return;
  }

  const { note, lead } = candidate;
  const judgement = judgementForLead(lead);
  if (!judgement) {
    strikeFault("OVERSTRIKE");
    return;
  }

  const deltaMs = -Math.round(lead * 1000);
  note.armed = true;
  note.armedJudgement = judgement;
  note.armedDeltaMs = deltaMs;
  note.scheduledImpact = true;

  lastDeltaMs = deltaMs;
  lastJudgement = `${judgement.label} ARMADO`;
  message = `${judgement.label} · ARMADO · ${timingWord(deltaMs)}`;
  messageColor = judgement.color;
  messageUntil = performance.now() + 330;

  playArmSound(judgement);
  scheduleImpactSound(side, judgement, note.targetTime);
  if (navigator.vibrate) navigator.vibrate(4);
  updateHud();
}

function resolveArmedHit(note) {
  if (!note.armed || note.launched) return;

  const judgement = note.armedJudgement;
  combo += 1;
  const multiplier = comboMultiplier(combo);
  score += judgement.points * multiplier;
  hitCount += 1;
  totalAbsDeltaMs += Math.abs(note.armedDeltaMs);
  totalSignedDeltaMs += note.armedDeltaMs;
  lastDeltaMs = note.armedDeltaMs;
  lastJudgement = judgement.label;

  note.launched = true;
  note.life = 0;
  note.x = view().contact[note.side].x;
  note.y = view().contact[note.side].y;
  note.vx = note.side === "left" ? 390 : -390;
  note.vy = -520;
  resolved.add(note.key);

  flash[note.side] = performance.now() + 135;
  message = `${judgement.label} · IMPACTO · x${multiplier}`;
  messageColor = judgement.color;
  messageUntil = performance.now() + 430;

  if (navigator.vibrate) navigator.vibrate(judgement === JUDGEMENTS.perfect ? 9 : 6);
  updateHud();
}

function miss(note) {
  combo = 0;
  mistakeCount += 1;
  lastDeltaMs = null;
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
  comboEl.textContent = combo ? `${combo} · x${comboMultiplier(combo)}` : "0";
  lastHitEl.textContent = lastDeltaMs === null
    ? lastJudgement
    : `${lastJudgement} ${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`;
}

function incomingPosition(note, songTime, m) {
  const secondsToImpact = note.targetTime - songTime;
  const distanceFromContact = NOTE_SPEED * secondsToImpact;
  const contact = m.contact[note.side];
  const outward = m.unit[note.side];

  return {
    x: contact.x + outward.x * distanceFromContact,
    y: contact.y + outward.y * distanceFromContact
  };
}

function updateNotes(dt, songTime, m) {
  for (const note of [...active.values()]) {
    if (note.launched) {
      note.life += dt;
      note.x += note.vx * dt;
      note.y += note.vy * dt;

      if (note.x < 22 && note.vx < 0) {
        note.x = 22;
        note.vx *= -1;
      } else if (note.x > m.width - 22 && note.vx > 0) {
        note.x = m.width - 22;
        note.vx *= -1;
      }

      if (note.life > 1.25 || note.y > m.height + 70) active.delete(note.key);
      continue;
    }

    const point = incomingPosition(note, songTime, m);
    note.x = point.x;
    note.y = point.y;

    if (songTime >= note.targetTime) {
      if (note.armed) resolveArmedHit(note);
      else if (songTime - note.targetTime > IMPACT_GRACE_SECONDS) miss(note);
    }
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
  for (const side of ["left", "right"]) {
    const contact = m.contact[side];
    const outward = m.unit[side];
    const far = {
      x: contact.x + outward.x * NOTE_SPEED * NOTE_LEAD_SECONDS,
      y: contact.y + outward.y * NOTE_SPEED * NOTE_LEAD_SECONDS
    };
    ctx.beginPath();
    ctx.moveTo(far.x, far.y);
    ctx.lineTo(contact.x, contact.y);
    ctx.stroke();
  }
}

function semiBand(m, outerRadius, innerRadius, fill, stroke) {
  ctx.beginPath();
  ctx.arc(m.centerX, m.auraY, outerRadius, Math.PI, 0);
  ctx.lineTo(m.centerX + innerRadius, m.auraY);
  ctx.arc(m.centerX, m.auraY, innerRadius, 0, Math.PI, true);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function activeTier(songTime) {
  let best = null;
  for (const note of active.values()) {
    if (note.launched || note.armed) continue;
    const lead = note.targetTime - (songTime + calibrationOffsetMs / 1000);
    const judgement = judgementForLead(lead);
    if (!judgement) continue;
    if (!best || judgement.points > best.points) best = judgement;
  }
  return best;
}

function drawAura(m, songTime) {
  const tier = activeTier(songTime);

  semiBand(
    m,
    m.auraOuter,
    m.auraMiddle,
    tier === JUDGEMENTS.good ? "rgba(65,150,255,.34)" : "rgba(65,150,255,.16)",
    "rgba(121,216,255,.38)"
  );
  semiBand(
    m,
    m.auraMiddle,
    m.auraInner,
    tier === JUDGEMENTS.great ? "rgba(177,92,255,.38)" : "rgba(177,92,255,.18)",
    "rgba(202,140,255,.42)"
  );
  semiBand(
    m,
    m.auraInner,
    m.contactRadius,
    tier === JUDGEMENTS.perfect ? "rgba(255,207,75,.43)" : "rgba(255,207,75,.21)",
    "rgba(255,228,122,.50)"
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 10px system-ui, sans-serif";
  ctx.fillStyle = "rgba(121,216,255,.72)";
  ctx.fillText("GOOD", m.centerX, m.auraY - (m.auraOuter + m.auraMiddle) / 2);
  ctx.fillStyle = "rgba(202,140,255,.74)";
  ctx.fillText("GREAT", m.centerX, m.auraY - (m.auraMiddle + m.auraInner) / 2);
  ctx.fillStyle = "rgba(255,228,122,.80)";
  ctx.fillText("PERFECT", m.centerX, m.auraY - (m.auraInner + m.contactRadius) / 2);
}

function flipperAngle(side, pressed) {
  if (side === "left") return pressed ? -0.80 : -0.38;
  return pressed ? Math.PI + 0.80 : Math.PI + 0.38;
}

function drawFlipper(m, side, songTime) {
  const now = performance.now();
  const pivot = m.pivot[side];
  const contact = m.contact[side];
  const pressed = flash[side] > now;
  const armed = Boolean(armedNoteFor(side));
  const dx = contact.x - pivot.x;
  const dy = contact.y - pivot.y;
  const strikeAngle = Math.atan2(dy, dx);
  const restAngle = strikeAngle + (side === "left" ? 0.30 : -0.30);
  const angle = pressed ? strikeAngle : restAngle;
  const length = Math.max(90, Math.hypot(dx, dy));

  ctx.save();
  ctx.translate(pivot.x, pivot.y);
  ctx.rotate(angle);
  ctx.shadowBlur = armed ? 22 : pressed ? 14 : 0;
  ctx.shadowColor = armed ? "#ffe985" : pressed ? "#ffffff" : "transparent";
  ctx.strokeStyle = armed ? "#ffe985" : pressed ? "#fff7d0" : "#cfe9ff";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#15243a";
  ctx.beginPath();
  ctx.arc(pivot.x, pivot.y, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawNote(note) {
  ctx.save();
  ctx.translate(note.x, note.y);

  if (note.launched) ctx.rotate(note.life * note.vx * 0.011);

  ctx.fillStyle = note.side === "left" ? "#6ed7ff" : "#d88bff";
  ctx.beginPath();
  ctx.arc(0, 0, 23, 0, Math.PI * 2);
  ctx.fill();

  if (note.armed && !note.launched) {
    ctx.strokeStyle = note.armedJudgement?.color ?? "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 29, 0, Math.PI * 2);
    ctx.stroke();
  }

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
    `TAP v0.5.1   BPM ${BPM}   beat ${loopBeat.toFixed(2)}`,
    `time ${songTime.toFixed(3)}s   FPS ${fps.toFixed(0)}`,
    `zonas: P 0-${Math.round(WINDOWS.perfect * 1000)}  G ${Math.round(WINDOWS.perfect * 1000)}-${Math.round(WINDOWS.great * 1000)}  OK ${Math.round(WINDOWS.great * 1000)}-${Math.round(WINDOWS.good * 1000)}ms`,
    `delta ${lastDeltaMs === null ? "—" : `${lastDeltaMs >= 0 ? "+" : ""}${lastDeltaMs}ms`}   avg |Δ| ${hitCount ? avgAbs.toFixed(0) : "—"}ms`,
    `velocidad ${NOTE_SPEED}px/s CONSTANTE   armados por zona`,
    `offset ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms   input ${lastInputType}   cola ${lastProcessingDelayMs.toFixed(1)}ms`,
    `hits ${hitCount}   errores ${mistakeCount}   multi x${comboMultiplier(combo)}   [ / ] offset`
  ];

  ctx.fillStyle = "rgba(0,0,0,.52)";
  ctx.fillRect(12, 92, 370, 118);
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
  drawAura(m, songTime);

  for (const note of active.values()) drawNote(note);

  drawFlipper(m, "left", songTime);
  drawFlipper(m, "right", songTime);
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
    armHit(side, event.timeStamp, event.pointerType || "touch");
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

  if (key === "[") {
    calibrationOffsetMs = clamp(calibrationOffsetMs - 5, -200, 200);
    message = `OFFSET ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`;
    messageColor = "#79d8ff";
    messageUntil = performance.now() + 500;
    return;
  }

  if (key === "]") {
    calibrationOffsetMs = clamp(calibrationOffsetMs + 5, -200, 200);
    message = `OFFSET ${calibrationOffsetMs >= 0 ? "+" : ""}${calibrationOffsetMs}ms`;
    messageColor = "#79d8ff";
    messageUntil = performance.now() + 500;
    return;
  }

  if (key === "a" || event.key === "ArrowLeft") {
    pressVisual(leftButton, true);
    armHit("left", event.timeStamp, "keyboard");
  }

  if (key === "d" || key === "l" || event.key === "ArrowRight") {
    pressVisual(rightButton, true);
    armHit("right", event.timeStamp, "keyboard");
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (key === "a" || event.key === "ArrowLeft") pressVisual(leftButton, false);
  if (key === "d" || key === "l" || event.key === "ArrowRight") pressVisual(rightButton, false);
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
  lastInputType = "—";
  lastProcessingDelayMs = 0;
  mistakeCount = 0;
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
