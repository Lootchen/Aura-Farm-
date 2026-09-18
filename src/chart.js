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

  const supported = new Set(["tap", "link", "draw"]);

  for (const [index, event] of chart.events.entries()) {
    if (!supported.has(event.type)) {
      throw new Error(`Evento ${index}: type inválido.`);
    }

    if (!Number.isFinite(event.beat) || event.beat < 0 || event.beat >= chart.loopBeats) {
      throw new Error(`Evento ${index}: beat inválido.`);
    }

    if (event.type === "tap") {
      if (!["left", "right"].includes(event.side)) {
        throw new Error(`Evento ${index}: side inválido.`);
      }

      if (!Number.isInteger(event.route) || event.route < 0 || event.route > 2) {
        throw new Error(`Evento ${index}: route debe estar entre 0 y 2.`);
      }
    }

    if (event.type === "link") {
      if (!Number.isFinite(event.durationBeats) || event.durationBeats <= 0) {
        throw new Error(`Evento ${index}: durationBeats inválido.`);
      }

      if (event.beat + event.durationBeats > chart.loopBeats) {
        throw new Error(`Evento ${index}: link excede el loop.`);
      }

      if (!Array.isArray(event.segments) || event.segments.length < 1) {
        throw new Error(`Evento ${index}: link necesita segments.`);
      }

      if (event.segments[0].beat !== 0) {
        throw new Error(`Evento ${index}: el primer segmento de link debe comenzar en beat 0.`);
      }

      let previousBeat = -Infinity;

      for (const [segmentIndex, segment] of event.segments.entries()) {
        if (!Number.isFinite(segment.beat) || segment.beat < 0 || segment.beat >= event.durationBeats) {
          throw new Error(`Evento ${index}, segmento ${segmentIndex}: beat inválido.`);
        }

        if (segment.beat <= previousBeat) {
          throw new Error(`Evento ${index}: segments debe estar ordenado y sin beats repetidos.`);
        }

        if (!["left", "right"].includes(segment.side)) {
          throw new Error(`Evento ${index}, segmento ${segmentIndex}: side inválido.`);
        }

        previousBeat = segment.beat;
      }
    }

    if (event.type === "draw") {
      if (!["u", "l", "z"].includes(event.symbol)) {
        throw new Error(`Evento ${index}: símbolo de draw inválido.`);
      }

      if (!Number.isFinite(event.windowBeats) || event.windowBeats <= 0) {
        throw new Error(`Evento ${index}: windowBeats de draw inválido.`);
      }

      if (event.beat + event.windowBeats > chart.loopBeats) {
        throw new Error(`Evento ${index}: draw excede el loop.`);
      }
    }
  }
}
