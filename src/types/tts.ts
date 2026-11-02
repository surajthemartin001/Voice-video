/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VoiceGender = 'male' | 'female';

export interface VoiceOption {
  id: string; // Gemini voice name, e.g. "Puck", "Charon", "Fenrir", "Kore", "Aoede", "Zephyr"
  name: string;
  gender: VoiceGender;
  description: string;
  hindiDescription: string;
  recommendedStyle: string;
  traits: string[];
}

export interface StylePreset {
  id: string;
  label: string;
  hindiLabel: string;
  instruction: string;
  icon?: string;
}

export interface TTSRequest {
  text: string;
  voiceName: string;
  style?: string;
  speed?: number;
  language?: 'hi' | 'en' | 'auto';
}

export interface TTSResponse {
  audioBase64: string;
  mimeType: string;
  durationEstimate?: number;
  characterCount: number;
}
