const bufferCache =
  new Map();

export function resolveSongAssetUrl(
  songSourceUrl,
  assetPath
) {
  if (
    !songSourceUrl ||
    !assetPath
  ) {
    return null;
  }

  return new URL(
    assetPath,
    songSourceUrl
  ).href;
}

export async function loadAudioBuffer(
  context,
  url
) {
  if (!context) {
    throw new Error(
      "AudioContext no disponible."
    );
  }

  const href =
    String(url);

  if (
    bufferCache.has(href)
  ) {
    return bufferCache.get(
      href
    );
  }

  const promise =
    (async () => {
      const response =
        await fetch(
          href,
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {
        throw new Error(
          `No se pudo cargar audio: ${response.status} · ${href}`
        );
      }

      const bytes =
        await response.arrayBuffer();

      try {
        return await context
          .decodeAudioData(
            bytes.slice(0)
          );
      } catch {
        throw new Error(
          `El navegador no pudo decodificar el audio: ${href}`
        );
      }
    })();

  bufferCache.set(
    href,
    promise
  );

  try {
    return await promise;
  } catch (error) {
    bufferCache.delete(href);
    throw error;
  }
}

export function audioDurationForSong(
  song
) {
  const timing =
    song?.timing;

  if (
    !timing ||
    !Number.isFinite(
      timing.bpm
    ) ||
    !Number.isFinite(
      timing.beats
    )
  ) {
    return 0;
  }

  return (
    timing.beats *
    60 /
    timing.bpm
  );
}

export function requiredFileDuration(
  song
) {
  const offset =
    Number(
      song?.timing?.offsetMs ??
      0
    ) /
    1000;

  return Math.max(
    0,
    offset +
      audioDurationForSong(
        song
      )
  );
}

export function validateDecodedAudioDuration(
  song,
  audioBuffer
) {
  if (
    !audioBuffer ||
    !Number.isFinite(
      audioBuffer.duration
    )
  ) {
    throw new Error(
      "AudioBuffer inválido."
    );
  }

  const required =
    requiredFileDuration(
      song
    );

  if (
    audioBuffer.duration +
      0.075 <
    required
  ) {
    throw new Error(
      `Audio demasiado corto: ${audioBuffer.duration.toFixed(2)}s; el chart necesita al menos ${required.toFixed(2)}s incluyendo offset.`
    );
  }

  return {
    durationSeconds:
      audioBuffer.duration,
    requiredSeconds:
      required
  };
}

function monoSampleAt(
  audioBuffer,
  sampleIndex
) {
  let sum = 0;

  for (
    let channel = 0;
    channel <
      audioBuffer.numberOfChannels;
    channel += 1
  ) {
    const data =
      audioBuffer.getChannelData(
        channel
      );
    sum +=
      Math.abs(
        data[
          Math.min(
            data.length - 1,
            Math.max(
              0,
              sampleIndex
            )
          )
        ] ?? 0
      );
  }

  return (
    sum /
    Math.max(
      1,
      audioBuffer.numberOfChannels
    )
  );
}

export function buildWaveformPeaks(
  audioBuffer,
  pointCount = 1800
) {
  const count =
    Math.max(
      64,
      Math.floor(
        pointCount
      )
    );
  const peaks =
    new Array(count)
      .fill(0);
  const samples =
    audioBuffer.length;
  const stride =
    samples / count;

  for (
    let point = 0;
    point < count;
    point += 1
  ) {
    const start =
      Math.floor(
        point * stride
      );
    const end =
      Math.max(
        start + 1,
        Math.floor(
          (point + 1) *
          stride
        )
      );
    const scanStep =
      Math.max(
        1,
        Math.floor(
          (end - start) /
          48
        )
      );
    let peak = 0;

    for (
      let sample = start;
      sample < end;
      sample += scanStep
    ) {
      peak =
        Math.max(
          peak,
          monoSampleAt(
            audioBuffer,
            sample
          )
        );
    }

    peaks[point] =
      Number(
        peak.toFixed(5)
      );
  }

  return peaks;
}

export function analyzeAudioSteps(
  audioBuffer,
  timing,
  {
    windowMs = 84
  } = {}
) {
  const steps =
    Math.ceil(
      timing.beats *
      timing.stepsPerBeat
    );
  const energies =
    new Array(steps)
      .fill(0);
  const halfWindowSamples =
    Math.max(
      16,
      Math.floor(
        audioBuffer.sampleRate *
        windowMs /
        2000
      )
    );
  const offsetSeconds =
    Number(
      timing.offsetMs ??
      0
    ) /
    1000;
  let maxEnergy = 0;

  for (
    let step = 0;
    step < steps;
    step += 1
  ) {
    const beat =
      step /
      timing.stepsPerBeat;
    const time =
      offsetSeconds +
      beat *
        60 /
        timing.bpm;
    const center =
      Math.round(
        time *
        audioBuffer.sampleRate
      );

    if (
      center < 0 ||
      center >=
        audioBuffer.length
    ) {
      energies[step] = 0;
      continue;
    }

    const start =
      Math.max(
        0,
        center -
          halfWindowSamples
      );
    const end =
      Math.min(
        audioBuffer.length,
        center +
          halfWindowSamples
      );
    const scanStep =
      Math.max(
        1,
        Math.floor(
          (end - start) /
          96
        )
      );
    let sumSquares = 0;
    let samplesRead = 0;

    for (
      let sample = start;
      sample < end;
      sample += scanStep
    ) {
      let mono = 0;

      for (
        let channel = 0;
        channel <
          audioBuffer
            .numberOfChannels;
        channel += 1
      ) {
        mono +=
          audioBuffer
            .getChannelData(
              channel
            )[sample] ?? 0;
      }

      mono /=
        Math.max(
          1,
          audioBuffer
            .numberOfChannels
        );

      sumSquares +=
        mono * mono;
      samplesRead += 1;
    }

    const rms =
      samplesRead > 0
        ? Math.sqrt(
            sumSquares /
            samplesRead
          )
        : 0;

    energies[step] = rms;
    maxEnergy =
      Math.max(
        maxEnergy,
        rms
      );
  }

  const normalized =
    energies.map(
      (value) =>
        Number(
          (
            maxEnergy > 0
              ? value /
                maxEnergy
              : 0
          ).toFixed(5)
        )
    );

  return {
    version: 1,
    type: "mix-energy",
    windowMs,
    durationSeconds:
      Number(
        audioBuffer.duration
          .toFixed(5)
      ),
    stepEnergy:
      normalized,
    minEventEnergy: 0.018
  };
}
