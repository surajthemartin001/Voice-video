import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkTextForTTS } from './textChunker';

test('chunkTextForTTS returns empty array for empty string', () => {
  assert.deepEqual(chunkTextForTTS(''), []);
  assert.deepEqual(chunkTextForTTS('   '), []);
});

test('chunkTextForTTS preserves short text as single chunk', () => {
  const shortText = 'नमस्ते दोस्तों! Everything at a Glance में आपका स्वागत है।';
  const chunks = chunkTextForTTS(shortText, 300);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], shortText);
});

test('chunkTextForTTS splits on Hindi purna viram (।)', () => {
  const hindiText = 'यह पहला वाक्य है। यह दूसरा वाक्य है जो थोड़ा लम्बा है। और यह तीसरा वाक्य है।';
  const chunks = chunkTextForTTS(hindiText, 35);
  assert.ok(chunks.length >= 2, 'Should split into multiple chunks');
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 40, `Chunk length ${chunk.length} should be reasonably within limit`);
  }
});

test('chunkTextForTTS splits on English sentence boundaries', () => {
  const englishText = 'Sentence one is crisp. Sentence two delivers more detail about the topic! Sentence three wraps it all up.';
  const chunks = chunkTextForTTS(englishText, 40);
  assert.ok(chunks.length >= 2);
  for (const chunk of chunks) {
    assert.ok(chunk.length > 0);
  }
});

test('chunkTextForTTS splits oversized sentence on word boundaries', () => {
  const longSentence = 'A'.repeat(50) + ' ' + 'B'.repeat(50) + ' ' + 'C'.repeat(50);
  const chunks = chunkTextForTTS(longSentence, 60);
  assert.ok(chunks.length >= 3);
});
