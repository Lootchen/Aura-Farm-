export async function loadGameChart(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el chart: ${response.status}`);
  }

  const chart = await response.json();
  validateGameChart(chart);
  chart.events.sort((a, b) => a.beat - b.beat);
  return chart;
}

function validateGameChart(chart) {
  if (!chart || typeof chart !== "object") {
    throw new Error("El chart debe ser un objeto JSON.");
  }

  if (!Number.isFinite(chart.bpm) || chart.bpm <= 0) {
    throw new Error("El chart necesita un BPM mayor que cero.");
  }

  if (!Number.isFinite(chart.loopBeats) || chart.loopBeats <= 0) {
    throw new Error("El chart necesita loopBeats mayor que cero.");
  }

  if (!Number.isInteger(chart.countInBeats) || chart.countInBeats < 0) {
    throw new Error("countInBeats debe ser un entero >= 0.");
  }

  if (!Array.isArray(chart.events)) {
    throw new Error("El chart necesita un array de events.");
  }

  const supported = new Set(["tap", "slide"]);

  for (const [index, event] of chart.events.entries()) {
    if (!supported.has(event.type)) {
      throw new Error(`Evento ${index}: type inválido.`);
    }

    if (!Number.isFinite(event.beat) || event.beat < 0 || event.beat >= chart.loopBeats) {
      throw new Error(`Evento ${index}: beat inválido.`);
    }

    if (
      event.minAct !== undefined &&
      (
        !Number.isInteger(event.minAct) ||
        event.minAct < 1 ||
        event.minAct > 7
      )
    ) {
      throw new Error(`Evento ${index}: minAct debe estar entre 1 y 7.`);
    }

    if (
      event.chainGroup !== undefined &&
      (
        typeof event.chainGroup !== "string" ||
        event.chainGroup.length < 1
      )
    ) {
      throw new Error(`Evento ${index}: chainGroup inválido.`);
    }

    if (
      !event.music ||
      typeof event.music !== "object"
    ) {
      throw new Error(`Evento ${index}: music es obligatorio.`);
    }

    const musicStems =
      new Set([
        "drums",
        "bass",
        "harmony",
        "lead",
        "aura",
        "boss"
      ]);
    const musicIntents =
      new Set([
        "pulse",
        "backbeat",
        "accent",
        "syncopation",
        "phrase",
        "fill",
        "response",
        "pickup",
        "resolve",
        "climax"
      ]);

    if (
      !musicStems.has(
        event.music.stem
      )
    ) {
      throw new Error(`Evento ${index}: music.stem inválido.`);
    }

    if (
      !musicIntents.has(
        event.music.intent
      )
    ) {
      throw new Error(`Evento ${index}: music.intent inválido.`);
    }

    if (
      !Number.isFinite(
        event.music.energy
      ) ||
      event.music.energy < 0 ||
      event.music.energy > 1
    ) {
      throw new Error(`Evento ${index}: music.energy debe estar entre 0 y 1.`);
    }

    if (
      typeof event.music.phrase !==
        "string" ||
      event.music.phrase.length < 1
    ) {
      throw new Error(`Evento ${index}: music.phrase inválido.`);
    }

    if (
      event.music.contour !== undefined &&
      typeof event.music.contour !==
        "boolean"
    ) {
      throw new Error(`Evento ${index}: music.contour debe ser boolean.`);
    }

    if (
      event.shield !== undefined &&
      typeof event.shield !==
        "boolean"
    ) {
      throw new Error(`Evento ${index}: shield debe ser boolean.`);
    }

    if (
      event.type !== "tap" &&
      event.shield
    ) {
      throw new Error(`Evento ${index}: sólo Tap puede tener shield.`);
    }

    if (event.type === "tap") {
      if (!["left", "right"].includes(event.side)) {
        throw new Error(`Evento ${index}: side inválido.`);
      }

      if (!Number.isInteger(event.route) || event.route < 0 || event.route > 2) {
        throw new Error(`Evento ${index}: route debe estar entre 0 y 2.`);
      }
    }

    if (event.type === "slide") {
      if (event.mode !== "trace") {
        throw new Error(`Evento ${index}: Slide sólo admite mode trace.`);
      }

      if (!["left", "right"].includes(event.side)) {
        throw new Error(`Evento ${index}: side de slide inválido.`);
      }

      if (!Number.isInteger(event.route) || event.route < 0 || event.route > 2) {
        throw new Error(`Evento ${index}: route de slide debe estar entre 0 y 2.`);
      }

      if (!Number.isFinite(event.durationBeats) || event.durationBeats <= 0) {
        throw new Error(`Evento ${index}: durationBeats de slide inválido.`);
      }

      if (event.beat + event.durationBeats > chart.loopBeats) {
        throw new Error(`Evento ${index}: slide excede el loop.`);
      }

      if (
        event.music.contour &&
        !["lead", "aura"].includes(
          event.music.stem
        )
      ) {
        throw new Error(`Evento ${index}: un Slide con contour debe seguir lead o aura.`);
      }

      if (!Array.isArray(event.anchors) || event.anchors.length < 2) {
        throw new Error(`Evento ${index}: slide necesita al menos 2 anchors.`);
      }

      if (event.anchors[0].beat !== 0) {
        throw new Error(`Evento ${index}: el primer anchor de slide debe comenzar en beat 0.`);
      }

      let previousBeat = -Infinity;

      for (const [anchorIndex, anchor] of event.anchors.entries()) {
        if (
          !Number.isFinite(anchor.beat) ||
          anchor.beat < 0 ||
          anchor.beat > event.durationBeats
        ) {
          throw new Error(`Evento ${index}, anchor ${anchorIndex}: beat inválido.`);
        }

        if (anchor.beat <= previousBeat) {
          throw new Error(`Evento ${index}: anchors debe estar ordenado y sin beats repetidos.`);
        }

        if (
          !Number.isFinite(anchor.x) ||
          !Number.isFinite(anchor.y)
        ) {
          throw new Error(`Evento ${index}, anchor ${anchorIndex}: x/y inválidos.`);
        }

        if (Math.hypot(anchor.x, anchor.y) > 1.001) {
          throw new Error(`Evento ${index}, anchor ${anchorIndex}: vector fuera del alcance TRACE.`);
        }

        previousBeat = anchor.beat;
      }

      if (event.anchors.at(-1).beat !== event.durationBeats) {
        throw new Error(`Evento ${index}: el último anchor debe terminar en durationBeats.`);
      }
    }

  }
}
