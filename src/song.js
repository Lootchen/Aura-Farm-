const EVENT_TYPES =
  new Set(["tap", "slide"]);

const MUSIC_INTENTS =
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

async function fetchJson(url, label) {
  const response =
    await fetch(
      url,
      { cache: "no-store" }
    );

  if (!response.ok) {
    throw new Error(
      `No se pudo cargar ${label}: ${response.status}`
    );
  }

  try {
    return await response.json();
  } catch {
    throw new Error(
      `${label} no contiene JSON válido.`
    );
  }
}

function requireString(
  value,
  label
) {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${label} debe ser texto no vacío.`
    );
  }
}

function requirePositive(
  value,
  label
) {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new Error(
      `${label} debe ser > 0.`
    );
  }
}

function onGrid(
  beat,
  stepsPerBeat
) {
  const step =
    beat * stepsPerBeat;

  return (
    Math.abs(
      step -
      Math.round(step)
    ) <
    0.000001
  );
}

export async function loadSongRegistry(
  url
) {
  const registry =
    await fetchJson(
      url,
      "el catálogo de canciones"
    );

  if (
    registry?.schemaVersion !== 1 ||
    !Array.isArray(
      registry.songs
    ) ||
    registry.songs.length === 0
  ) {
    throw new Error(
      "songs/index.json necesita schemaVersion 1 y al menos una canción."
    );
  }

  requireString(
    registry.defaultSong,
    "defaultSong"
  );

  const ids =
    new Set();

  for (
    const [index, entry] of
    registry.songs.entries()
  ) {
    requireString(
      entry?.id,
      `songs[${index}].id`
    );
    requireString(
      entry?.file,
      `songs[${index}].file`
    );

    if (ids.has(entry.id)) {
      throw new Error(
        `Song id repetido: ${entry.id}.`
      );
    }

    ids.add(entry.id);
  }

  if (
    !ids.has(
      registry.defaultSong
    )
  ) {
    throw new Error(
      "defaultSong no existe en songs[]."
    );
  }

  return registry;
}

export async function loadGameSong(
  url,
  {
    chartId = null
  } = {}
) {
  const song =
    await fetchJson(
      url,
      "la canción"
    );

  validateGameSong(song);

  const wantedChart =
    chartId ??
    song.defaultChart;
  const chart =
    song.charts.find(
      (item) =>
        item.id === wantedChart
    );

  if (!chart) {
    throw new Error(
      `Chart "${wantedChart}" no existe en ${song.id}.`
    );
  }

  validateGameChart(
    chart,
    song
  );

  const alignment =
    auditChartAlignment(
      song,
      chart
    );

  if (!alignment.ok) {
    const preview =
      alignment.errors
        .slice(0, 4)
        .map(
          (item) =>
            `beat ${item.beat}: ${item.reason}`
        )
        .join(" · ");

    throw new Error(
      `Song/chart mismatch en ${song.id}: ${preview}`
    );
  }

  chart.events.sort(
    (a, b) =>
      a.beat - b.beat
  );

  return {
    song,
    chart,
    alignment
  };
}

export function validateGameSong(
  song
) {
  if (
    !song ||
    typeof song !== "object"
  ) {
    throw new Error(
      "La canción debe ser un objeto JSON."
    );
  }

  if (
    song.schemaVersion !== 1
  ) {
    throw new Error(
      "La canción necesita schemaVersion 1."
    );
  }

  requireString(song.id, "song.id");
  requireString(
    song.title,
    "song.title"
  );

  const timing =
    song.timing;

  if (
    !timing ||
    timing.mode !== "constant"
  ) {
    throw new Error(
      "v1 sólo admite timing.mode = constant."
    );
  }

  requirePositive(
    timing.bpm,
    "timing.bpm"
  );
  requirePositive(
    timing.beats,
    "timing.beats"
  );

  if (
    !Number.isInteger(
      timing.beatsPerBar
    ) ||
    timing.beatsPerBar <= 0
  ) {
    throw new Error(
      "timing.beatsPerBar debe ser entero > 0."
    );
  }

  if (
    !Number.isInteger(
      timing.stepsPerBeat
    ) ||
    timing.stepsPerBeat <= 0
  ) {
    throw new Error(
      "timing.stepsPerBeat debe ser entero > 0."
    );
  }

  if (
    !Number.isInteger(
      timing.countInBeats
    ) ||
    timing.countInBeats < 0
  ) {
    throw new Error(
      "timing.countInBeats debe ser entero >= 0."
    );
  }

  if (
    !Number.isFinite(
      timing.offsetMs
    )
  ) {
    throw new Error(
      "timing.offsetMs debe ser numérico."
    );
  }

  const audio =
    song.audio;

  if (
    !audio ||
    audio.mode !==
      "procedural" ||
    audio.engine !==
      "aura-procedural-v1"
  ) {
    throw new Error(
      "v1 requiere audio.mode procedural + aura-procedural-v1."
    );
  }

  if (
    timing.offsetMs !== 0
  ) {
    throw new Error(
      "Las canciones procedurales v1 deben usar offsetMs 0."
    );
  }

  if (
    !Array.isArray(
      audio.stems
    ) ||
    audio.stems.length === 0
  ) {
    throw new Error(
      "audio.stems necesita al menos un stem."
    );
  }

  for (
    const stem of audio.stems
  ) {
    requireString(
      stem,
      "audio.stems[]"
    );
  }

  validateComposition(song);

  if (
    !Array.isArray(
      song.charts
    ) ||
    song.charts.length === 0
  ) {
    throw new Error(
      "La canción necesita charts[]."
    );
  }

  requireString(
    song.defaultChart,
    "defaultChart"
  );

  const chartIds =
    new Set();

  for (
    const chart of song.charts
  ) {
    requireString(
      chart?.id,
      "chart.id"
    );

    if (
      chartIds.has(chart.id)
    ) {
      throw new Error(
        `Chart id repetido: ${chart.id}.`
      );
    }

    chartIds.add(chart.id);
  }

  if (
    !chartIds.has(
      song.defaultChart
    )
  ) {
    throw new Error(
      "defaultChart no existe en charts[]."
    );
  }
}

function validateComposition(
  song
) {
  const composition =
    song.composition;
  const timing =
    song.timing;
  const stepsPerBar =
    timing.beatsPerBar *
    timing.stepsPerBeat;

  if (
    !composition ||
    !Array.isArray(
      composition.bars
    ) ||
    composition.bars.length === 0
  ) {
    throw new Error(
      "composition.bars es obligatorio."
    );
  }

  const expectedBeats =
    composition.bars.length *
    timing.beatsPerBar;

  if (
    Math.abs(
      expectedBeats -
      timing.beats
    ) >
    0.000001
  ) {
    throw new Error(
      `timing.beats (${timing.beats}) no coincide con ${composition.bars.length} barras × ${timing.beatsPerBar} beats.`
    );
  }

  for (
    const key of [
      "drumPatterns",
      "bassPatterns",
      "leadPatterns",
      "auraPatterns"
    ]
  ) {
    if (
      !composition[key] ||
      typeof composition[key] !==
        "object"
    ) {
      throw new Error(
        `composition.${key} es obligatorio.`
      );
    }
  }

  const tonalGroups = [
    "bassPatterns",
    "leadPatterns",
    "auraPatterns"
  ];

  for (
    const group of tonalGroups
  ) {
    for (
      const [name, pattern] of
      Object.entries(
        composition[group]
      )
    ) {
      if (
        !Array.isArray(pattern) ||
        pattern.length !==
          stepsPerBar
      ) {
        throw new Error(
          `${group}.${name} debe tener ${stepsPerBar} pasos.`
        );
      }
    }
  }

  for (
    const [name, drums] of
    Object.entries(
      composition.drumPatterns
    )
  ) {
    for (
      const lane of [
        "kick",
        "snare",
        "hat"
      ]
    ) {
      if (
        !Array.isArray(
          drums[lane]
        ) ||
        drums[lane].some(
          (step) =>
            !Number.isInteger(step) ||
            step < 0 ||
            step >= stepsPerBar
        )
      ) {
        throw new Error(
          `drumPatterns.${name}.${lane} contiene pasos inválidos.`
        );
      }
    }
  }

  for (
    const [index, bar] of
    composition.bars.entries()
  ) {
    if (
      !Number.isFinite(
        bar.root
      ) ||
      !Array.isArray(
        bar.chord
      ) ||
      bar.chord.length === 0
    ) {
      throw new Error(
        `bar ${index}: root/chord inválidos.`
      );
    }

    for (
      const [field, group] of [
        ["drums", "drumPatterns"],
        ["bass", "bassPatterns"],
        ["lead", "leadPatterns"],
        ["aura", "auraPatterns"]
      ]
    ) {
      if (
        !composition[group][
          bar[field]
        ]
      ) {
        throw new Error(
          `bar ${index}: ${field} referencia patrón inexistente.`
        );
      }
    }

    requireString(
      bar.section,
      `bar ${index}.section`
    );
  }
}

export function validateGameChart(
  chart,
  song
) {
  if (
    !chart ||
    typeof chart !== "object"
  ) {
    throw new Error(
      "El chart debe ser un objeto."
    );
  }

  requireString(
    chart.id,
    "chart.id"
  );

  if (
    chart.mechanicsVersion !==
      "aura-chart-v1"
  ) {
    throw new Error(
      `${chart.id}: mechanicsVersion debe ser aura-chart-v1.`
    );
  }

  if (
    !Array.isArray(
      chart.events
    )
  ) {
    throw new Error(
      `${chart.id}: events debe ser array.`
    );
  }

  const timing =
    song.timing;
  const stems =
    new Set(
      song.audio.stems
    );

  for (
    const [index, event] of
    chart.events.entries()
  ) {
    if (
      !EVENT_TYPES.has(
        event.type
      )
    ) {
      throw new Error(
        `Evento ${index}: type inválido.`
      );
    }

    if (
      !Number.isFinite(
        event.beat
      ) ||
      event.beat < 0 ||
      event.beat >=
        timing.beats
    ) {
      throw new Error(
        `Evento ${index}: beat inválido.`
      );
    }

    if (
      !onGrid(
        event.beat,
        timing.stepsPerBeat
      )
    ) {
      throw new Error(
        `Evento ${index}: beat ${event.beat} no cae en la rejilla 1/${timing.stepsPerBeat}.`
      );
    }

    if (
      event.minAct !== undefined &&
      (
        !Number.isInteger(
          event.minAct
        ) ||
        event.minAct < 1 ||
        event.minAct > 7
      )
    ) {
      throw new Error(
        `Evento ${index}: minAct debe estar entre 1 y 7.`
      );
    }

    if (
      event.chainGroup !== undefined &&
      (
        typeof event.chainGroup !==
          "string" ||
        event.chainGroup.length < 1
      )
    ) {
      throw new Error(
        `Evento ${index}: chainGroup inválido.`
      );
    }

    if (
      !event.music ||
      typeof event.music !==
        "object"
    ) {
      throw new Error(
        `Evento ${index}: music es obligatorio.`
      );
    }

    if (
      !stems.has(
        event.music.stem
      )
    ) {
      throw new Error(
        `Evento ${index}: stem ${event.music.stem} no existe en la canción.`
      );
    }

    if (
      !MUSIC_INTENTS.has(
        event.music.intent
      )
    ) {
      throw new Error(
        `Evento ${index}: music.intent inválido.`
      );
    }

    if (
      !Number.isFinite(
        event.music.energy
      ) ||
      event.music.energy < 0 ||
      event.music.energy > 1
    ) {
      throw new Error(
        `Evento ${index}: music.energy debe estar entre 0 y 1.`
      );
    }

    requireString(
      event.music.phrase,
      `Evento ${index}: music.phrase`
    );

    if (
      event.music.contour !==
        undefined &&
      typeof event.music.contour !==
        "boolean"
    ) {
      throw new Error(
        `Evento ${index}: music.contour debe ser boolean.`
      );
    }

    if (
      event.shield !== undefined &&
      typeof event.shield !==
        "boolean"
    ) {
      throw new Error(
        `Evento ${index}: shield debe ser boolean.`
      );
    }

    if (
      event.type !== "tap" &&
      event.shield
    ) {
      throw new Error(
        `Evento ${index}: sólo Tap puede tener shield.`
      );
    }

    if (
      !["left", "right"].includes(
        event.side
      )
    ) {
      throw new Error(
        `Evento ${index}: side inválido.`
      );
    }

    if (
      !Number.isInteger(
        event.route
      ) ||
      event.route < 0 ||
      event.route > 2
    ) {
      throw new Error(
        `Evento ${index}: route debe estar entre 0 y 2.`
      );
    }

    if (
      event.type === "slide"
    ) {
      if (
        event.mode !== "trace"
      ) {
        throw new Error(
          `Evento ${index}: Slide sólo admite mode trace.`
        );
      }

      if (
        !Number.isFinite(
          event.durationBeats
        ) ||
        event.durationBeats <= 0 ||
        !onGrid(
          event.durationBeats,
          timing.stepsPerBeat
        )
      ) {
        throw new Error(
          `Evento ${index}: durationBeats inválido para la rejilla.`
        );
      }

      if (
        event.beat +
          event.durationBeats >
        timing.beats
      ) {
        throw new Error(
          `Evento ${index}: Slide excede la canción.`
        );
      }

      if (
        event.music.contour &&
        !["lead", "aura"].includes(
          event.music.stem
        )
      ) {
        throw new Error(
          `Evento ${index}: contour sólo puede seguir lead/aura.`
        );
      }

      if (
        !Array.isArray(
          event.anchors
        ) ||
        event.anchors.length < 2
      ) {
        throw new Error(
          `Evento ${index}: Slide necesita >= 2 anchors.`
        );
      }

      if (
        event.anchors[0].beat !== 0
      ) {
        throw new Error(
          `Evento ${index}: primer anchor debe empezar en 0.`
        );
      }

      let previousBeat =
        -Infinity;

      for (
        const [
          anchorIndex,
          anchor
        ] of
        event.anchors.entries()
      ) {
        if (
          !Number.isFinite(
            anchor.beat
          ) ||
          anchor.beat < 0 ||
          anchor.beat >
            event.durationBeats ||
          anchor.beat <=
            previousBeat
        ) {
          throw new Error(
            `Evento ${index}, anchor ${anchorIndex}: beat inválido.`
          );
        }

        if (
          !Number.isFinite(
            anchor.x
          ) ||
          !Number.isFinite(
            anchor.y
          ) ||
          Math.hypot(
            anchor.x,
            anchor.y
          ) >
            1.001
        ) {
          throw new Error(
            `Evento ${index}, anchor ${anchorIndex}: vector inválido.`
          );
        }

        previousBeat =
          anchor.beat;
      }

      if (
        event.anchors.at(-1)
          .beat !==
        event.durationBeats
      ) {
        throw new Error(
          `Evento ${index}: último anchor debe terminar en durationBeats.`
        );
      }
    }
  }
}

export function songFrameFromData(
  song,
  beat
) {
  const timing =
    song.timing;
  const composition =
    song.composition;
  const rawStep =
    Math.max(
      0,
      Math.round(
        beat *
        timing.stepsPerBeat
      )
    );
  const stepsPerBar =
    timing.beatsPerBar *
    timing.stepsPerBeat;
  const barIndex =
    Math.floor(
      rawStep /
      stepsPerBar
    ) %
    composition.bars.length;
  const step =
    rawStep %
    stepsPerBar;
  const bar =
    composition.bars[
      barIndex
    ];
  const drums =
    composition
      .drumPatterns[
        bar.drums
      ];
  const bassOffset =
    composition
      .bassPatterns[
        bar.bass
      ][step];
  const leadOffset =
    composition
      .leadPatterns[
        bar.lead
      ][step];
  const auraOffset =
    composition
      .auraPatterns[
        bar.aura
      ][step];

  return {
    barIndex,
    step,
    section: bar.section,
    kick:
      drums.kick.includes(
        step
      ),
    snare:
      drums.snare.includes(
        step
      ),
    hat:
      drums.hat.includes(
        step
      ),
    hatAccent:
      step %
        timing.stepsPerBeat ===
      0
        ? 1
        : 0.62,
    bassMidi:
      bassOffset === null
        ? null
        : bar.root +
          bassOffset,
    chordMidi:
      step === 0
        ? bar.chord.map(
            (offset) =>
              bar.root +
              12 +
              offset
          )
        : null,
    leadMidi:
      leadOffset === null
        ? null
        : bar.root +
          leadOffset,
    auraMidi:
      auraOffset === null
        ? null
        : bar.root +
          auraOffset,
    fill:
      Boolean(
        bar.fill &&
        step >=
          stepsPerBar - 2
      ),
    bossMidi:
      bar.root -
      12 +
      (
        step %
          timing.stepsPerBeat ===
        0
          ? 0
          : 1
      )
  };
}

function stemAudible(
  frame,
  stem
) {
  switch (stem) {
    case "drums":
      return (
        frame.kick ||
        frame.snare ||
        frame.hat
      );
    case "bass":
      return Number.isFinite(
        frame.bassMidi
      );
    case "harmony":
      return Array.isArray(
        frame.chordMidi
      );
    case "lead":
      return Number.isFinite(
        frame.leadMidi
      );
    case "aura":
      return Number.isFinite(
        frame.auraMidi
      );
    case "boss":
      return Number.isFinite(
        frame.bossMidi
      );
    default:
      return false;
  }
}

export function auditChartAlignment(
  song,
  chart
) {
  const errors = [];

  for (
    const [index, event] of
    chart.events.entries()
  ) {
    const frame =
      songFrameFromData(
        song,
        event.beat
      );
    const stem =
      event.music?.stem;

    if (
      !stemAudible(
        frame,
        stem
      )
    ) {
      errors.push({
        index,
        beat: event.beat,
        type: event.type,
        stem,
        phrase:
          event.music?.phrase ??
          null,
        reason:
          `stem ${stem} no suena en ese paso`
      });
    }
  }

  return {
    ok: errors.length === 0,
    checked:
      chart.events.length,
    errors
  };
}
