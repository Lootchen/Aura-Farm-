export async function loadTapChart(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`No se pudo cargar el chart: ${response.status}`);
  }

  const chart = await response.json();
  validateTapChart(chart);
  chart.events.sort((a, b) => a.beat - b.beat);
  return chart;
}

function validateTapChart(chart) {
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

  for (const [index, event] of chart.events.entries()) {
    if (!Number.isFinite(event.beat) || event.beat < 0 || event.beat >= chart.loopBeats) {
      throw new Error(`Evento ${index}: beat inválido.`);
    }

    if (!["left", "right"].includes(event.side)) {
      throw new Error(`Evento ${index}: side inválido.`);
    }

    if (!Number.isInteger(event.route) || event.route < 0 || event.route > 2) {
      throw new Error(`Evento ${index}: route debe estar entre 0 y 2.`);
    }
  }
}
