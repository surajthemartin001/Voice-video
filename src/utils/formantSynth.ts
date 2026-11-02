/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * High-quality Formant Speech Audio Synthesizer.
 * Provides fallback audio generation when Google Gemini API quota (429) is reached,
 * ensuring speech playback, real-time lip sync, and screen video recording NEVER fail.
 */

interface FormantProfile {
  f1: number;
  f2: number;
  f3: number;
}

// Vowel formant frequencies in Hz
const VOWEL_FORMANTS: Record<string, FormantProfile> = {
  a: { f1: 750, f2: 1220, f3: 2550 },
  aa: { f1: 820, f2: 1280, f3: 2600 },
  e: { f1: 530, f2: 1840, f3: 2480 },
  i: { f1: 300, f2: 2250, f3: 3000 },
  ee: { f1: 280, f2: 2300, f3: 3050 },
  o: { f1: 500, f2: 950, f3: 2500 },
  oo: { f1: 380, f2: 850, f3: 2400 },
  u: { f1: 350, f2: 800, f3: 2400 },
  ai: { f1: 650, f2: 1950, f3: 2700 },
  au: { f1: 600, f2: 1050, f3: 2400 },
  neutral: { f1: 500, f2: 1500, f3: 2500 },
};

/**
 * Maps Hindi Devanagari characters or Latin characters to approximate phonetic segments.
 */
function textToPhonemeSegments(text: string): { vowel: string; duration: number; isSilence: boolean; isFricative: boolean }[] {
  const segments: { vowel: string; duration: number; isSilence: boolean; isFricative: boolean }[] = [];
  const clean = text.trim();

  let i = 0;
  while (i < clean.length) {
    const char = clean[i];

    // Silence for punctuation
    if (/[.!?,।;\n\s]/.test(char)) {
      const dur = /[।.\n]/.test(char) ? 0.28 : /[,;]/.test(char) ? 0.16 : 0.08;
      segments.push({ vowel: 'neutral', duration: dur, isSilence: true, isFricative: false });
      i++;
      continue;
    }

    // Hindi Devanagari vowel signs / characters
    if (/[ा]/i.test(char)) {
      segments.push({ vowel: 'aa', duration: 0.16, isSilence: false, isFricative: false });
    } else if (/[िी]/i.test(char)) {
      segments.push({ vowel: 'ee', duration: 0.15, isSilence: false, isFricative: false });
    } else if (/[ुू]/i.test(char)) {
      segments.push({ vowel: 'oo', duration: 0.15, isSilence: false, isFricative: false });
    } else if (/[ेै]/i.test(char)) {
      segments.push({ vowel: 'e', duration: 0.15, isSilence: false, isFricative: false });
    } else if (/[ोौ]/i.test(char)) {
      segments.push({ vowel: 'o', duration: 0.16, isSilence: false, isFricative: false });
    } else if (/[सशषफ़szf]/i.test(char)) {
      // Sibilants
      segments.push({ vowel: 'neutral', duration: 0.08, isSilence: false, isFricative: true });
    } else if (/[aeiouAEIOU]/.test(char)) {
      // Latin vowels
      const v = char.toLowerCase();
      segments.push({ vowel: v, duration: 0.14, isSilence: false, isFricative: false });
    } else {
      // Inherent Hindi / consonant vowel ('a' sound in Devanagari consonants)
      segments.push({ vowel: 'a', duration: 0.11, isSilence: false, isFricative: false });
    }

    i++;
  }

  return segments;
}

/**
 * Resonant Biquad Bandpass Filter
 */
class BandpassFilter {
  b0 = 0;
  b2 = 0;
  a1 = 0;
  a2 = 0;
  x1 = 0;
  x2 = 0;
  y1 = 0;
  y2 = 0;

  constructor(fc: number, q: number, sampleRate: number) {
    const w0 = (2 * Math.PI * Math.min(fc, sampleRate * 0.48)) / sampleRate;
    const alpha = Math.sin(w0) / (2 * q);
    const a0 = 1 + alpha;

    this.b0 = (Math.sin(w0) / 2) / a0;
    this.b2 = -(Math.sin(w0) / 2) / a0;
    this.a1 = (-2 * Math.cos(w0)) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  process(sample: number): number {
    const out = this.b0 * sample + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = sample;
    this.y2 = this.y1;
    this.y1 = out;
    return out;
  }
}

/**
 * Synthesizes speech waveform as a complete WAV buffer.
 */
export function synthesizeFallbackSpeechWav(
  text: string,
  voiceGender: 'male' | 'female' = 'female',
  speed = 1.0,
  sampleRate = 24000
): Uint8Array {
  const segments = textToPhonemeSegments(text);
  if (segments.length === 0) {
    segments.push({ vowel: 'a', duration: 0.2, isSilence: true, isFricative: false });
  }

  // Calculate total sample count
  let totalDuration = 0;
  for (const seg of segments) {
    totalDuration += seg.duration / Math.max(0.6, Math.min(1.6, speed));
  }

  const numSamples = Math.floor(totalDuration * sampleRate);
  const pcm16 = new Int16Array(numSamples);

  // Pitch settings
  const baseF0 = voiceGender === 'female' ? 220 : 135;
  let phase = 0;
  let sampleIndex = 0;

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    const segDur = seg.duration / Math.max(0.6, Math.min(1.6, speed));
    const segSamples = Math.floor(segDur * sampleRate);
    const formants = VOWEL_FORMANTS[seg.vowel] || VOWEL_FORMANTS.neutral;

    // Pitch intonation curve
    const intonation = 1 + 0.08 * Math.sin((sIdx / Math.max(1, segments.length)) * Math.PI * 2);
    const f0 = baseF0 * intonation;

    const bp1 = new BandpassFilter(formants.f1, 6.0, sampleRate);
    const bp2 = new BandpassFilter(formants.f2, 8.0, sampleRate);
    const bp3 = new BandpassFilter(formants.f3, 10.0, sampleRate);

    for (let i = 0; i < segSamples && sampleIndex < numSamples; i++) {
      let excitation = 0;

      if (!seg.isSilence) {
        if (seg.isFricative) {
          // White noise for consonants
          excitation = (Math.random() * 2 - 1) * 0.45;
        } else {
          // Glottal pulse waveform
          phase += f0 / sampleRate;
          if (phase >= 1.0) phase -= 1.0;

          // Rosenberg glottal pulse approximation
          if (phase < 0.4) {
            excitation = Math.sin((phase / 0.4) * Math.PI) * 0.85;
          } else if (phase < 0.6) {
            excitation = -Math.sin(((phase - 0.4) / 0.2) * Math.PI * 0.5) * 0.4;
          } else {
            excitation = 0;
          }
        }
      }

      // Envelope shaping to avoid clicks
      const attack = Math.min(1, i / (sampleRate * 0.015));
      const release = Math.min(1, (segSamples - i) / (sampleRate * 0.015));
      const env = attack * release;

      // Filtered resonance output
      const y1 = bp1.process(excitation);
      const y2 = bp2.process(excitation);
      const y3 = bp3.process(excitation);

      const mixed = (y1 * 0.6 + y2 * 0.35 + y3 * 0.15) * env;
      const clamped = Math.max(-1, Math.min(1, mixed * 2.2));

      pcm16[sampleIndex++] = Math.round(clamped * 32767);
    }
  }

  // Create 44-byte WAV header
  const pcmBytes = pcm16.length * 2;
  const outBuf = new Uint8Array(44 + pcmBytes);

  // RIFF
  outBuf.set([0x52, 0x49, 0x46, 0x46], 0);
  const riffSize = 36 + pcmBytes;
  outBuf[4] = riffSize & 0xff;
  outBuf[5] = (riffSize >> 8) & 0xff;
  outBuf[6] = (riffSize >> 16) & 0xff;
  outBuf[7] = (riffSize >> 24) & 0xff;

  // WAVE
  outBuf.set([0x57, 0x41, 0x56, 0x45], 8);

  // fmt
  outBuf.set([0x66, 0x6d, 0x74, 0x20], 12);
  outBuf[16] = 16;
  outBuf[20] = 1; // PCM
  outBuf[22] = 1; // Mono
  outBuf[24] = sampleRate & 0xff;
  outBuf[25] = (sampleRate >> 8) & 0xff;
  outBuf[26] = (sampleRate >> 16) & 0xff;
  outBuf[27] = (sampleRate >> 24) & 0xff;

  const byteRate = sampleRate * 2;
  outBuf[28] = byteRate & 0xff;
  outBuf[29] = (byteRate >> 8) & 0xff;
  outBuf[30] = (byteRate >> 16) & 0xff;
  outBuf[31] = (byteRate >> 24) & 0xff;

  outBuf[32] = 2; // BlockAlign
  outBuf[34] = 16; // BitsPerSample

  // data
  outBuf.set([0x64, 0x61, 0x74, 0x61], 36);
  outBuf[40] = pcmBytes & 0xff;
  outBuf[41] = (pcmBytes >> 8) & 0xff;
  outBuf[42] = (pcmBytes >> 16) & 0xff;
  outBuf[43] = (pcmBytes >> 24) & 0xff;

  // PCM data little-endian
  const dataView = new DataView(outBuf.buffer, outBuf.byteOffset + 44, pcmBytes);
  for (let i = 0; i < pcm16.length; i++) {
    dataView.setInt16(i * 2, pcm16[i], true);
  }

  return outBuf;
}
