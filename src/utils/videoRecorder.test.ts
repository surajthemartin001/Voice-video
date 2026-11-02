import test from 'node:test';
import assert from 'node:assert/strict';
import { generateVideoFilename, getSupportedVideoMimeType } from './videoRecorder';

test('getSupportedVideoMimeType falls back safely when MediaRecorder is undefined', () => {
  const mime = getSupportedVideoMimeType();
  assert.ok(typeof mime === 'string');
  assert.ok(mime.includes('video/'));
});

test('generateVideoFilename produces safe sanitized string with voice and extension', () => {
  const filename = generateVideoFilename('Everything at a Glance', 'Kore (कोरे)', 'webm');
  assert.ok(filename.startsWith('everything-at-a-glance-kore-'));
  assert.ok(filename.endsWith('.webm'));
  assert.ok(!filename.includes(' '));
});
