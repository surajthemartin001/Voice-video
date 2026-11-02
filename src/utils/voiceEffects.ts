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
  pitchSemitones: number; // -24 to +24
  bassGain: number;       // -12 dB to +15 dB (120 Hz Low Shelf)
  midGain: number;        // -10 dB to +10 dB (1200 Hz Peaking)
  trebleGain: number;     // -15 dB to +15 dB (3800 Hz High Shelf)
  formantFreq: number;    // Hz (vocal resonance center)
  formantQ: number;       // Q factor
  lowCutFreq: number;     // Hz (rumble / highpass cut)
}

export const VOICE_EFFECT_PRESETS: VoiceEffectPreset[] = [
  {
    id: 'original',
    name: 'Original (मूल आवाज़)',
    hindiName: 'मूल आवाज़',
    icon: '✨',
    description: 'आपकी असली अपलोड की गई आवाज़, बिल्कुल शुद्ध व प्राकृतिक।',
    pitchSemitones: 0,
    bassGain: 0,
    midGain: 0,
    trebleGain: 0,
    formantFreq: 1500,
    formantQ: 0.7,
    lowCutFreq: 50,
  },
  {
    id: 'parrot',
    name: 'Parrot (तोता)',
    hindiName: 'तोते की आवाज़',
    icon: '🦜',
    description: 'ऊँची तीखी पिच और बोलने वाले तोते जैसी स्पष्ट चहचहाहट।',
    pitchSemitones: 9.5,
    bassGain: -6,
    midGain: 3,
    trebleGain: 8,
    formantFreq: 3400,
    formantQ: 3.5,
    lowCutFreq: 300,
  },
  {
    id: 'chipmunk',
    name: 'Chipmunk / Cartoon (अल्ट्रा पतली)',
    hindiName: 'कार्टून / गिलहरी',
    icon: '🐿️',
    description: 'अत्यंत पतली, सुपर हाई-पिच और मजेदार कार्टून कैरेक्टर आवाज़।',
    pitchSemitones: 16,
    bassGain: -10,
    midGain: 5,
    trebleGain: 10,
    formantFreq: 4200,
    formantQ: 3.0,
    lowCutFreq: 400,
  },
  {
    id: 'child',
    name: 'Child (बच्चा)',
    hindiName: 'मासूम बच्चा',
    icon: '👶',
    description: 'कोमल, मासूम और मधुर ऊँची पिच वाली बच्चे जैसी आवाज़।',
    pitchSemitones: 5.5,
    bassGain: -3,
    midGain: 2,
    trebleGain: 4,
    formantFreq: 2400,
    formantQ: 2.0,
    lowCutFreq: 180,
  },
  {
    id: 'elder',
    name: 'Elder (बुजुर्ग / भारी)',
    hindiName: 'बुजुर्ग व गंभीर',
    icon: '👴',
    description: 'गंभीर, शांत और वार्म बेस वाली अनुभवी बुजुर्ग जैसी आवाज़।',
    pitchSemitones: -5.5,
    bassGain: 6,
    midGain: 1,
    trebleGain: -2,
    formantFreq: 320,
    formantQ: 1.8,
    lowCutFreq: 40,
  },
  {
    id: 'giant',
    name: 'Giant / Monster (अल्ट्रा भारी दानव)',
    hindiName: 'दानव / राक्षस',
    icon: '👹',
    description: 'अति-गंभीर, विशालकाय गूंजता बेस और डरावनी भारी आवाज़।',
    pitchSemitones: -15,
    bassGain: 12,
    midGain: -2,
    trebleGain: -6,
    formantFreq: 150,
    formantQ: 2.2,
    lowCutFreq: 30,
  },
  {
    id: 'studio',
    name: 'Studio Narrator (स्टूडियो नैरेटर)',
    hindiName: 'पॉडकास्ट / नैरेटर',
    icon: '📢',
    description: 'क्रिस्टल क्लियर वोकल्स, डीप चेस्ट प्रेजेंस और रेडियो एयर क्लैरिटी।',
    pitchSemitones: 0,
    bassGain: 4,
    midGain: 2,
    trebleGain: 4.5,
    formantFreq: 2600,
    formantQ: 1.2,
    lowCutFreq: 80,
  },
  {
    id: 'robot',
    name: 'Cyber Robot (साइबर रोबोट)',
    hindiName: 'रोबोटिक आवाज़',
    icon: '🤖',
    description: 'मेटालिक रोबोटिक टोन, रेज़ोनेंट साइबर फ्रीक्वेंसी रिंग।',
    pitchSemitones: 2,
    bassGain: 2,
    midGain: 6,
    trebleGain: 6,
    formantFreq: 1050,
    formantQ: 7.0,
    lowCutFreq: 120,
  },
];

/**
 * Converts semitones (-24 to +24) into audio playbackRate ratio (0.25 to 4.0).
 * Formula: 2^(semitones / 12)
 */
export function semitonesToPitchRatio(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

/**
 * Converts playback rate ratio to semitones.
 */
export function pitchRatioToSemitones(ratio: number): number {
  return Math.round(12 * Math.log2(Math.max(0.1, ratio)));
}

/**
 * Formats semitone offset for display (e.g. "+16 st" or "-15 st").
 */
export function formatSemitones(semitones: number): string {
  const rounded = Math.round(semitones * 10) / 10;
  if (rounded > 0) return `+${rounded} st`;
  if (rounded < 0) return `${rounded} st`;
  return '0 st (मूल)';
}

/**
 * Returns human-readable Hindi tone descriptor based on semitone level.
 */
export function getPitchDescriptor(semitones: number): string {
  if (semitones >= 14) return 'अल्ट्रा पतली / कार्टून चिपमंक 🐿️';
  if (semitones >= 8) return 'तीखी चहक / तोते जैसी आवाज़ 🦜';
  if (semitones >= 4) return 'ऊँची पतली / बच्चे जैसी आवाज़ 👶';
  if (semitones > 0.5) return 'हल्की पतली आवाज़ 🎵';
  if (semitones >= -0.5) return 'मूल प्राकृतिक आवाज़ ✨';
  if (semitones >= -4) return 'हल्की भारी आवाज़ 🎙️';
  if (semitones >= -9) return 'गंभीर बुजुर्ग आवाज़ 👴';
  if (semitones >= -16) return 'अल्ट्रा भारी दानव आवाज़ 👹';
  return 'महाकाय रंबल बेस आवाज़ 🌋';
}
