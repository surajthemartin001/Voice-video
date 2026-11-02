import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeFallbackSpeechWav } from './formantSynth';

test('synthesizeFallbackSpeechWav creates a playable sample audio buffer', () => {
  const wav = synthesizeFallbackSpeechWav('नमस्ते दोस्तों, Everything at a Glance में आपका स्वागत है।', 'female');
  assert.ok(wav.length > 100);
});
