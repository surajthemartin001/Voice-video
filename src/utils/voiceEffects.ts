/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VoiceEffectPreset {
  id: string;
  name: string;
  hindiName: string;
  icon: string;
  description: string;
  pitchSemitones: number; // -12 to +12
  toneBrightness: number; // -10 dB to +10 dB
  formantFreq: number;    // Hz
  formantQ: number;       // resonance Q
  lowCutFreq: number;     // Hz to eliminate mud
}

export const VOICE_EFFECT_PRESETS: VoiceEffectPreset[] = [
  {
    id: 'original',
    name: 'Original (सामान्य)',
    hindiName: 'मूल आवाज़',
    icon: '✨',
    description: 'आपकी असली अपलोड की गई आवाज़, बिना किसी बदलाव के।',
    pitchSemitones: 0,
    toneBrightness: 0,
    formantFreq: 1500,
    formantQ: 0.7,
    lowCutFreq: 60,
  },
  {
    id: 'parrot',
    name: 'Parrot (तोता)',
    hindiName: 'तोते की आवाज़',
    icon: '🦜',
    description: 'उच्च पिच और तीखी चहचहाहट, बिल्कुल बोलने वाले तोते जैसी साफ आवाज़।',
    pitchSemitones: 8,
    toneBrightness: 5,
    formantFreq: 3200,
    formantQ: 3.2,
    lowCutFreq: 320,
  },
  {
    id: 'child',
    name: 'Child (बच्चा)',
    hindiName: 'बच्चे की आवाज़',
    icon: '👶',
    description: 'कोमल, मासूम और मधुर ऊँची पिच वाली बच्चे जैसी आवाज़।',
    pitchSemitones: 5,
    toneBrightness: 3,
    formantFreq: 2400,
    formantQ: 2.0,
    lowCutFreq: 180,
  },
  {
    id: 'elder',
    name: 'Elder / Deep (बुजुर्ग / भारी)',
    hindiName: 'बुजुर्ग व गंभीर आवाज़',
    icon: '👴',
    description: 'गंभीर, शांत और भारी बेस वाली बुजुर्ग/ज्ञानी व्यक्ति जैसी आवाज़।',
    pitchSemitones: -4.5,
    toneBrightness: -1,
    formantFreq: 180,
    formantQ: 1.8,
    lowCutFreq: 40,
  },
  {
    id: 'robot',
    name: 'Robot / Cyber (रोबोट)',
    hindiName: 'रोबोटिक आवाज़',
    icon: '🤖',
    description: 'मेटालिक रोबोटिक टोन और मॉड्युलेटेड साउंड इफ़ेक्ट।',
    pitchSemitones: 1.5,
    toneBrightness: 4,
    formantFreq: 950,
    formantQ: 6.5,
    lowCutFreq: 120,
  },
  {
    id: 'studio',
    name: 'Studio Narrator (नैरेटर)',
    hindiName: 'स्टूडियो पॉडकास्टर',
    icon: '📢',
    description: 'क्रिस्टल क्लियर ब्रॉडकास्ट टोन, वोकल क्लैरिटी और नोइज़ कट।',
    pitchSemitones: 0,
    toneBrightness: 3.5,
    formantFreq: 2800,
    formantQ: 1.2,
    lowCutFreq: 85,
  },
];

/**
 * Converts semitones (-12 to +12) into audio playbackRate ratio (0.5 to 2.0).
 * Formula: 2^(semitones / 12)
 */
export function semitonesToPitchRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

/**
 * Converts playback rate ratio to semitones.
 */
export function pitchRatioToSemitones(ratio: number): number {
  return Math.round(12 * Math.log2(Math.max(0.2, ratio)));
}

/**
 * Formats semitone offset for display (e.g. "+5 st" or "-4 st").
 */
export function formatSemitones(semitones: number): string {
  const rounded = Math.round(semitones * 10) / 10;
  if (rounded > 0) return `+${rounded} st`;
  if (rounded < 0) return `${rounded} st`;
  return '0 st (Original)';
}
