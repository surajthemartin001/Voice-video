import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesizeFallbackSpeechWav } from './formantSynth';
import { findWavDataOffset } from './wavConcat';

test('synthesizeFallbackSpeechWav produces valid WAV header and PCM data', () => {
  const wav = synthesizeFallbackSpeechWav('नमस्ते दोस्तों', 'female');
  assert.ok(wav.length > 44, 'Should generate WAV data beyond header');

  const info = findWavDataOffset(wav);
  assert.equal(info.dataOffset, 44);
  assert.ok(info.dataSize > 0);
});

test('synthesizeFallbackSpeechWav works for English text and male gender', () => {
  const wav = synthesizeFallbackSpeechWav('Hello world this is a test', 'male', 1.2);
  assert.ok(wav.length > 44);
  const info = findWavDataOffset(wav);
  assert.equal(info.dataOffset, 44);
});
