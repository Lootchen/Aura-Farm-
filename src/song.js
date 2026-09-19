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
    alignment,
    sourceUrl:
      String(url)
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
    ![
      "procedural",
      "file"
    ].includes(
      audio.mode
    )
  ) {
    throw new Error(
      "audio.mode debe ser procedural o file."
    );
  }

  if (
    !Array.isArray(
      audio.stems
    ) ||
    audio.stems.length === 0
  ) {
    throw new Error(
      "audio.stems necesita al menos un stem semántico."
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

  if (
    audio.mode ===
      "procedural"
  ) {
    if (
      audio.engine !==
        "aura-procedural-v1"
    ) {
      throw new Error(
        "Las canciones procedurales v1 requieren aura-procedural-v1."
      );
    }

    if (
      timing.offsetMs !== 0
    ) {
      throw new Error(
        "Las canciones procedurales v1 deben usar offsetMs 0."
      );
    }

    validateComposition(song);
  } else {
    requireString(
      audio.src,
      "audio.src"
    );

    if (
      audio.gain !== undefined &&
      (
        !Number.isFinite(
          audio.gain
        ) ||
        audio.gain < 0 ||
        audio.gain > 2
      )
    ) {
      throw new Error(
        "audio.gain debe estar entre 0 y 2."
      );
    }

    validateFileAnalysis(
      song
    );
  }

  validateMusicFeel(song);
  validateLevelPhases(song);
  validateSongEvents(song);

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

function validateSongEvents(
  song
) {
  const events =
    song.songEvents;

  if (events === undefined) {
    return;
  }

  if (!Array.isArray(events)) {
    throw new Error(
      "songEvents debe ser array."
    );
  }

  const steps =
    song.timing.stepsPerBeat;

  events.forEach(
    (
      event,
      index
    ) => {
      if (
        !event ||
        typeof event !== "object"
      ) {
        throw new Error(
          `songEvents[${index}] inválido.`
        );
      }

      requireString(
        event.type,
        `songEvents[${index}].type`
      );

      if (
        !Number.isFinite(event.beat) ||
        event.beat < 0 ||
        event.beat >=
          song.timing.beats
      ) {
        throw new Error(
          `songEvents[${index}].beat fuera de rango.`
        );
      }

      if (
        Math.abs(
          event.beat * steps -
          Math.round(
            event.beat * steps
          )
        ) > 1e-6
      ) {
        throw new Error(
          `songEvents[${index}].beat debe caer en el grid.`
        );
      }

      if (
        event.strength !== undefined &&
        (
          !Number.isFinite(event.strength) ||
          event.strength < 0 ||
          event.strength > 2
        )
      ) {
        throw new Error(
          `songEvents[${index}].strength debe estar entre 0 y 2.`
        );
      }

      if (
        event.mood !== undefined
      ) {
        requireString(
          event.mood,
          `songEvents[${index}].mood`
        );
      }

      if (
        event.label !== undefined
      ) {
        requireString(
          event.label,
          `songEvents[${index}].label`
        );
      }
    }
  );

  for (
    let index = 1;
    index < events.length;
    index += 1
  ) {
    if (
      events[index].beat <
      events[index - 1].beat
    ) {
      throw new Error(
        "songEvents debe estar ordenado por beat."
      );
    }
  }
}

function validateLevelPhases(
  song
) {
  const phases =
    song.levelPhases;

  if (phases === undefined) {
    return;
  }

  if (
    !Array.isArray(phases) ||
    phases.length < 1 ||
    phases.length > 12
  ) {
    throw new Error(
      "levelPhases debe tener 1..12 fases."
    );
  }

  let previousEnd = 0;

  phases.forEach(
    (
      phase,
      index
    ) => {
      if (
        !phase ||
        typeof phase !== "object"
      ) {
        throw new Error(
          `levelPhases[${index}] inválida.`
        );
      }

      requireString(
        phase.id ??
          phase.name,
        `levelPhases[${index}].id/name`
      );

      const start =
        Number(
          phase.startBeat
        );
      const end =
        Number(
          phase.endBeat
        );

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 0 ||
        end <= start ||
        end >
          song.timing.beats
      ) {
        throw new Error(
          `levelPhases[${index}] startBeat/endBeat inválidos.`
        );
      }

      const steps =
        song.timing
          .stepsPerBeat;

      if (
        Math.abs(
          start * steps -
          Math.round(
            start * steps
          )
        ) > 1e-6 ||
        Math.abs(
          end * steps -
          Math.round(
            end * steps
          )
        ) > 1e-6
      ) {
        throw new Error(
          `levelPhases[${index}] debe caer en el grid del tema.`
        );
      }

      if (
        index === 0 &&
        start !== 0
      ) {
        throw new Error(
          "levelPhases debe comenzar en beat 0."
        );
      }

      if (
        start <
        previousEnd -
          1e-6
      ) {
        throw new Error(
          "levelPhases no puede solaparse."
        );
      }

      if (
        index > 0 &&
        Math.abs(
          start -
          previousEnd
        ) > 1e-6
      ) {
        throw new Error(
          "levelPhases debe ser contigua para v1."
        );
      }

      previousEnd = end;
    }
  );

  if (
    Math.abs(
      previousEnd -
      song.timing.beats
    ) > 1e-6
  ) {
    throw new Error(
      "levelPhases debe cubrir toda la canción en v1."
    );
  }
}

function validateMusicFeel(
  song
) {
  const feel =
    song.musicFeel;

  if (!feel) {
    return;
  }

  if (
    feel.motif !== undefined
  ) {
    if (
      !Array.isArray(
        feel.motif
      ) ||
      feel.motif.length < 2 ||
      feel.motif.length > 12 ||
      feel.motif.some(
        (value) =>
          !Number.isFinite(value) ||
          value < -24 ||
          value > 36
      )
    ) {
      throw new Error(
        "musicFeel.motif debe ser un array de 2..12 intervalos MIDI (-24..36)."
      );
    }
  }

  if (
    feel.sectionCues !==
      undefined
  ) {
    if (
      !feel.sectionCues ||
      typeof feel.sectionCues !==
        "object" ||
      Array.isArray(
        feel.sectionCues
      )
    ) {
      throw new Error(
        "musicFeel.sectionCues debe ser objeto."
      );
    }

    for (
      const [name, cue] of
      Object.entries(
        feel.sectionCues
      )
    ) {
      requireString(
        name,
        "musicFeel.sectionCues key"
      );

      if (
        !cue ||
        !Array.isArray(
          cue.intervals
        ) ||
        cue.intervals.length < 1 ||
        cue.intervals.length > 6 ||
        cue.intervals.some(
          (value) =>
            !Number.isFinite(value) ||
            value < -24 ||
            value > 36
        )
      ) {
        throw new Error(
          `musicFeel.sectionCues.${name}.intervals inválido.`
        );
      }

      if (
        cue.gain !== undefined &&
        (
          !Number.isFinite(
            cue.gain
          ) ||
          cue.gain < 0 ||
          cue.gain > 1.5
        )
      ) {
        throw new Error(
          `musicFeel.sectionCues.${name}.gain debe estar entre 0 y 1.5.`
        );
      }
    }
  }

  if (
    feel.actArrangements !==
      undefined
  ) {
    if (
      !Array.isArray(
        feel.actArrangements
      ) ||
      feel.actArrangements.length <
        1 ||
      feel.actArrangements.length >
        12
    ) {
      throw new Error(
        "musicFeel.actArrangements debe tener 1..12 entradas."
      );
    }

    for (
      const [
        index,
        arrangement
      ] of
      feel.actArrangements.entries()
    ) {
      if (
        !arrangement ||
        typeof arrangement !==
          "object"
      ) {
        throw new Error(
          `musicFeel.actArrangements[${index}] inválido.`
        );
      }

      for (
        const key of [
          "drums",
          "bass",
          "harmony",
          "lead",
          "aura",
          "brightness",
          "drive"
        ]
      ) {
        if (
          arrangement[key] !==
            undefined &&
          (
            !Number.isFinite(
              arrangement[key]
            ) ||
            arrangement[key] < 0 ||
            arrangement[key] > 1.5
          )
        ) {
          throw new Error(
            `musicFeel.actArrangements[${index}].${key} debe estar entre 0 y 1.5.`
          );
        }
      }
    }
  }

  if (
    feel.interactiveCues !==
      undefined
  ) {
    if (
      !feel.interactiveCues ||
      typeof feel.interactiveCues !==
        "object" ||
      Array.isArray(
        feel.interactiveCues
      )
    ) {
      throw new Error(
        "musicFeel.interactiveCues debe ser objeto."
      );
    }

    for (
      const [name, cue] of
      Object.entries(
        feel.interactiveCues
      )
    ) {
      requireString(
        name,
        "interactive cue name"
      );

      if (
        !cue ||
        !Array.isArray(
          cue.intervals
        ) ||
        cue.intervals.length < 1
      ) {
        throw new Error(
          `musicFeel.interactiveCues.${name}.intervals es obligatorio.`
        );
      }

      if (
        cue.quantize !== undefined &&
        ![
          "step",
          "beat",
          "bar"
        ].includes(
          cue.quantize
        )
      ) {
        throw new Error(
          `musicFeel.interactiveCues.${name}.quantize inválido.`
        );
      }
    }
  }
}

function validateFileAnalysis(
  song
) {
  const analysis =
    song.audio?.analysis;

  if (!analysis) {
    return;
  }

  if (
    analysis.version !== 1 ||
    analysis.type !==
      "mix-energy"
  ) {
    throw new Error(
      "audio.analysis debe usar version 1 / mix-energy."
    );
  }

  requirePositive(
    analysis.durationSeconds,
    "audio.analysis.durationSeconds"
  );

  if (
    !Array.isArray(
      analysis.stepEnergy
    )
  ) {
    throw new Error(
      "audio.analysis.stepEnergy debe ser array."
    );
  }

  const expectedSteps =
    Math.ceil(
      song.timing.beats *
      song.timing.stepsPerBeat
    );

  if (
    analysis.stepEnergy.length <
    expectedSteps
  ) {
    throw new Error(
      `audio.analysis.stepEnergy necesita al menos ${expectedSteps} pasos.`
    );
  }

  if (
    analysis.stepEnergy.some(
      (value) =>
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1
    )
  ) {
    throw new Error(
      "audio.analysis.stepEnergy sólo admite valores 0..1."
    );
  }

  if (
    analysis.minEventEnergy !==
      undefined &&
    (
      !Number.isFinite(
        analysis.minEventEnergy
      ) ||
      analysis.minEventEnergy < 0 ||
      analysis.minEventEnergy > 1
    )
  ) {
    throw new Error(
      "audio.analysis.minEventEnergy debe estar entre 0 y 1."
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
  if (
    song?.audio?.mode !==
      "procedural" ||
    !song?.composition
  ) {
    throw new Error(
      "songFrameFromData sólo está disponible para canciones procedurales."
    );
  }

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
    rootMidi: bar.root,
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
          stepsPerBar -
          timing.stepsPerBeat
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
  const warnings = [];

  if (
    song.audio.mode ===
      "procedural"
  ) {
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
      ok:
        errors.length === 0,
      mode:
        "semantic-stem",
      checked:
        chart.events.length,
      verified:
        chart.events.length,
      warnings,
      errors
    };
  }

  const analysis =
    song.audio.analysis;

  if (
    !analysis?.stepEnergy
  ) {
    warnings.push(
      "Audio externo sin análisis: sólo se verifican timing/grid y estructura del chart."
    );

    return {
      ok: true,
      mode: "grid-only",
      checked:
        chart.events.length,
      verified: 0,
      warnings,
      errors
    };
  }

  const threshold =
    Number(
      analysis.minEventEnergy ??
      0.018
    );

  for (
    const [index, event] of
    chart.events.entries()
  ) {
    const step =
      Math.round(
        event.beat *
        song.timing
          .stepsPerBeat
      );
    const energy =
      Number(
        analysis.stepEnergy[
          step
        ] ?? 0
      );

    if (
      energy <
      threshold
    ) {
      errors.push({
        index,
        beat: event.beat,
        type: event.type,
        stem:
          event.music?.stem,
        phrase:
          event.music?.phrase ??
          null,
        energy,
        reason:
          `mix casi silencioso en ese paso (energy ${energy.toFixed(3)})`
      });
    }
  }

  warnings.push(
    "El análisis de un mix estéreo verifica energía temporal, no identifica instrumentos/stems individuales."
  );

  return {
    ok:
      errors.length === 0,
    mode:
      "mix-energy",
    checked:
      chart.events.length,
    verified:
      chart.events.length -
      errors.length,
    warnings,
    errors
  };
}


export function auditChartFlow(
  song,
  chart
) {
  const warnings = [];
  const timing =
    song.timing;
  const feel =
    song.chartFeel ??
    {};
  const events =
    [...chart.events]
      .sort(
        (a, b) =>
          a.beat - b.beat
      );
  const advanced =
    chart.difficulty ===
      "advanced";
  const preTraceRecovery =
    Math.max(
      0,
      Number(
        feel.tracePreRecoveryBeats ??
        (
          advanced
            ? 0.25
            : 0.5
        )
      )
    );
  const postTraceRecovery =
    Math.max(
      0,
      Number(
        feel.tracePostRecoveryBeats ??
        (
          advanced
            ? 0.5
            : 1
        )
      )
    );

  // TRACE is a continuous touch gesture. Validate setup, occupancy and escape,
  // not only strict mathematical overlap.
  for (
    const [
      traceIndex,
      trace
    ] of
    events.entries()
  ) {
    if (
      trace.type !== "slide"
    ) {
      continue;
    }

    const start =
      trace.beat;
    const end =
      trace.beat +
      trace.durationBeats;

    for (
      const [
        eventIndex,
        event
      ] of
      events.entries()
    ) {
      if (
        event.type !== "tap"
      ) {
        continue;
      }

      const inside =
        event.beat >
          start &&
        event.beat <
          end;
      const tooCloseBefore =
        event.beat <
          start &&
        event.beat >
          start -
            preTraceRecovery;
      const tooCloseAfter =
        event.beat >=
          end &&
        event.beat <
          end +
            postTraceRecovery;

      if (
        inside &&
        event.allowDuringTrace !==
          true
      ) {
        warnings.push({
          kind:
            "trace-overlap",
          index: eventIndex,
          beat: event.beat,
          traceBeat: start,
          traceEnd: end,
          reason:
            `Tap en beat ${event.beat} cae dentro de TRACE ${start}–${end}; marca allowDuringTrace sólo si el multitouch es intencional.`
        });
        continue;
      }

      if (
        (
          tooCloseBefore ||
          tooCloseAfter
        ) &&
        event.allowTraceRecovery !==
          true
      ) {
        warnings.push({
          kind:
            tooCloseBefore
              ? "trace-setup"
              : "trace-escape",
          index: eventIndex,
          beat: event.beat,
          traceBeat: start,
          traceEnd: end,
          reason:
            tooCloseBefore
              ? `Tap en beat ${event.beat} deja menos de ${preTraceRecovery} beats para preparar TRACE en ${start}.`
              : `Tap en beat ${event.beat} llega antes de recuperar ${postTraceRecovery} beats tras TRACE ${start}–${end}.`
        });
      }
    }

    const nextTrace =
      events.find(
        (event) =>
          event.type ===
            "slide" &&
          event !== trace &&
          event.beat >= end
      );

    if (
      nextTrace &&
      nextTrace.beat <
        end +
          postTraceRecovery
    ) {
      warnings.push({
        kind:
          "trace-to-trace",
        index:
          events.indexOf(
            nextTrace
          ),
        beat:
          nextTrace.beat,
        traceBeat: start,
        traceEnd: end,
        reason:
          `TRACE en ${nextTrace.beat} comienza sin ${postTraceRecovery} beats de recuperación tras TRACE ${start}–${end}.`
      });
    }
  }

  const windowBeats =
    timing.beatsPerBar;
  const densityLimit =
    Math.max(
      1,
      Number(
        feel.maxEventsPerBar ??
        (
          advanced
            ? 7
            : 6
        )
      )
    );

  for (
    let start = 0;
    start <
      timing.beats;
    start +=
      timing.beatsPerBar
  ) {
    const count =
      events.filter(
        (event) =>
          event.beat >= start &&
          event.beat <
            start + windowBeats
      ).length;

    if (
      count >
      densityLimit
    ) {
      warnings.push({
        kind:
          "density",
        beat: start,
        reason:
          `Compás ${Math.floor(start / timing.beatsPerBar) + 1}: ${count} eventos en ${windowBeats} beats; revisa overmapping/flow.`
      });
    }
  }

  const minRecovery =
    Math.max(
      0,
      Number(
        feel.minRecoveryBeats ??
        1
      )
    );

  if (
    song.audio.mode ===
      "procedural" &&
    song.composition?.bars
  ) {
    const ranges = [];
    let current = null;

    for (
      const [
        barIndex,
        bar
      ] of
      song.composition.bars.entries()
    ) {
      const start =
        barIndex *
        timing.beatsPerBar;
      const end =
        start +
        timing.beatsPerBar;

      if (
        !current ||
        current.name !==
          bar.section
      ) {
        if (current) {
          ranges.push(
            current
          );
        }

        current = {
          name: bar.section,
          start,
          end
        };
      } else {
        current.end = end;
      }
    }

    if (current) {
      ranges.push(current);
    }

    for (
      const range of
      ranges
    ) {
      const beats =
        events
          .filter(
            (event) =>
              event.beat >=
                range.start &&
              event.beat <
                range.end
          )
          .map(
            (event) =>
              event.beat
          )
          .sort(
            (a, b) => a - b
          );

      const points = [
        range.start,
        ...beats,
        range.end
      ];
      let longestGap = 0;

      for (
        let index = 1;
        index < points.length;
        index += 1
      ) {
        longestGap =
          Math.max(
            longestGap,
            points[index] -
              points[index - 1]
          );
      }

      if (
        beats.length >= 4 &&
        longestGap <
          minRecovery
      ) {
        warnings.push({
          kind:
            "recovery",
          beat:
            range.start,
          reason:
            `${range.name}: no hay hueco de recuperación ≥ ${minRecovery} beat(s) (máx. ${longestGap.toFixed(2)}).`
        });
      }
    }
  }

  return {
    ok:
      warnings.length === 0,
    metrics: {
      preTraceRecovery,
      postTraceRecovery,
      densityLimit,
      minRecovery
    },
    warnings
  };
}
