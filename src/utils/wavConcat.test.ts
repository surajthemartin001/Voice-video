import test from 'node:test';
import assert from 'node:assert/strict';
import { concatWavBuffers, findWavDataOffset } from './wavConcat';

// Helper to create a dummy WAV header + PCM payload
function createDummyWav(pcmLength: number, sampleRate = 24000): Uint8Array {
  const buf = new Uint8Array(44 + pcmLength);
  
  // "RIFF"
  buf.set([0x52, 0x49, 0x46, 0x46], 0);
  const riffSize = 36 + pcmLength;
  buf[4] = riffSize & 0xff;
  buf[5] = (riffSize >> 8) & 0xff;
  buf[6] = (riffSize >> 16) & 0xff;
  buf[7] = (riffSize >> 24) & 0xff;

  // "WAVE"
  buf.set([0x57, 0x41, 0x56, 0x45], 8);

  // "fmt "
  buf.set([0x66, 0x6d, 0x74, 0x20], 12);
  // fmt size 16
  buf[16] = 16;
  // Audio format 1 (PCM)
  buf[20] = 1;
  // Channels 1 (Mono)
  buf[22] = 1;
  // Sample rate (24000)
  buf[24] = sampleRate & 0xff;
  buf[25] = (sampleRate >> 8) & 0xff;
  buf[26] = (sampleRate >> 16) & 0xff;
  buf[27] = (sampleRate >> 24) & 0xff;
  // Byte rate (24000 * 2 = 48000)
  const byteRate = sampleRate * 2;
  buf[28] = byteRate & 0xff;
  buf[29] = (byteRate >> 8) & 0xff;
  // Block align 2
  buf[32] = 2;
  // Bits per sample 16
  buf[34] = 16;

  // "data"
  buf.set([0x64, 0x61, 0x74, 0x61], 36);
  // Subchunk2Size
  buf[40] = pcmLength & 0xff;
  buf[41] = (pcmLength >> 8) & 0xff;
  buf[42] = (pcmLength >> 16) & 0xff;
  buf[43] = (pcmLength >> 24) & 0xff;

  // Fill PCM with dummy values
  for (let i = 0; i < pcmLength; i++) {
    buf[44 + i] = (i % 255);
  }

  return buf;
}

test('findWavDataOffset correctly locates 44-byte standard header', () => {
  const wav = createDummyWav(100);
  const info = findWavDataOffset(wav);
  assert.equal(info.dataOffset, 44);
  assert.equal(info.dataSize, 100);
});

test('concatWavBuffers returns empty for empty array', () => {
  assert.equal(concatWavBuffers([]).length, 0);
});

test('concatWavBuffers returns same buffer if single buffer', () => {
  const wav = createDummyWav(50);
  const result = concatWavBuffers([wav]);
  assert.equal(result.length, wav.length);
});

test('concatWavBuffers combines two buffers and updates headers', () => {
  const wav1 = createDummyWav(100);
  const wav2 = createDummyWav(150);

  const combined = concatWavBuffers([wav1, wav2]);
  
  // Total size should be 44 (header) + 100 + 150 = 294 bytes
  assert.equal(combined.length, 294);

  // Check RIFF size at bytes 4-7 = 294 - 8 = 286
  const riffSize =
    combined[4] | (combined[5] << 8) | (combined[6] << 16) | (combined[7] << 24);
  assert.equal(riffSize, 286);

  // Check data subchunk size at bytes 40-43 = 250
  const dataSize =
    combined[40] | (combined[41] << 8) | (combined[42] << 16) | (combined[43] << 24);
  assert.equal(dataSize, 250);

  // Check PCM data from wav1 is present
  assert.equal(combined[44], wav1[44]);
  // Check PCM data from wav2 starts at 44 + 100 = 144
  assert.equal(combined[144], wav2[44]);
});
