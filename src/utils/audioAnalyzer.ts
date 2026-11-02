/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates Root Mean Square (RMS) volume level from Uint8Array time-domain data (centered around 128).
 * Returns a normalized value between 0 and 1.
 */
export function calculateRmsTimeDomain(timeData: Uint8Array): number {
  if (!timeData || timeData.length === 0) return 0;

  let sumSquares = 0;
  for (let i = 0; i < timeData.length; i++) {
    // Convert 0..255 byte value to -1.0 .. 1.0
    const normalized = (timeData[i] - 128) / 128;
    sumSquares += normalized * normalized;
  }

  const rms = Math.sqrt(sumSquares / timeData.length);
  return Math.min(1, rms);
}

/**
 * Calculates vocal energy and formant emphasis from frequency data.
 * Returns { vowelEnergy, sibilantEnergy, level, wideTarget }
 */
export function analyzeFrequencySpectrum(freqData: Uint8Array): {
  level: number;
  wideTarget: number;
} {
  if (!freqData || freqData.length === 0) {
    return { level: 0, wideTarget: 0.4 };
  }

  const len = freqData.length;
  // Vocal formant bins: low-mid range (approx 200Hz - 1500Hz)
  const lowEnd = Math.floor(len * 0.04);
  const midEnd = Math.floor(len * 0.25);
  const highEnd = Math.floor(len * 0.65);

  let lowSum = 0;
  let midSum = 0;
  let highSum = 0;

  for (let i = 0; i < len; i++) {
    const val = freqData[i] / 255;
    if (i <= lowEnd) {
      lowSum += val;
    } else if (i <= midEnd) {
      midSum += val;
    } else if (i <= highEnd) {
      highSum += val;
    }
  }

  const lowAvg = lowSum / Math.max(1, lowEnd);
  const midAvg = midSum / Math.max(1, midEnd - lowEnd);
  const highAvg = highSum / Math.max(1, highEnd - midEnd);

  // Overall vocal volume: heavily driven by vowel resonance in low/mid
  const rawLevel = midAvg * 0.7 + lowAvg * 0.3;
  // Noise gate: if below 0.04, clamp to 0 so mouth closes completely in silence
  const level = rawLevel < 0.04 ? 0 : Math.min(1, (rawLevel - 0.04) * 1.5);

  // Wide target: high sibilants and open mid frequencies widen the mouth (e.g. 'ee', 's', 't')
  // while deeper lows round the mouth (e.g. 'oo', 'oh')
  const wideTarget = Math.min(0.95, Math.max(0.3, 0.4 + (highAvg - lowAvg * 0.5) * 0.6));

  return { level, wideTarget };
}

/**
 * Smoothly updates current animation state towards target using asymmetric attack/decay.
 * Attack is quick so mouth opens crisply with sound, decay is smooth so it doesn't flutter.
 */
export function smoothStep(
  current: number,
  target: number,
  attackRate = 0.45,
  decayRate = 0.18
): number {
  const rate = target > current ? attackRate : decayRate;
  return current + (target - current) * rate;
}
