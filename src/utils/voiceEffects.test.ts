import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VOICE_EFFECT_PRESETS,
  semitonesToPitchRatio,
  pitchRatioToSemitones,
  formatSemitones,
} from './voiceEffects';

test('semitonesToPitchRatio converts 0 semitones to 1.0 ratio', () => {
  assert.equal(semitonesToPitchRatio(0), 1.0);
});

test('semitonesToPitchRatio converts +12 semitones to exactly 2.0 (one octave up)', () => {
  const ratio = semitonesToPitchRatio(12);
  assert.ok(Math.abs(ratio - 2.0) < 0.0001);
});

test('semitonesToPitchRatio converts -12 semitones to exactly 0.5 (one octave down)', () => {
  const ratio = semitonesToPitchRatio(-12);
  assert.ok(Math.abs(ratio - 0.5) < 0.0001);
});

test('pitchRatioToSemitones inverts correctly', () => {
  assert.equal(pitchRatioToSemitones(2.0), 12);
  assert.equal(pitchRatioToSemitones(1.0), 0);
  assert.equal(pitchRatioToSemitones(0.5), -12);
});

test('formatSemitones displays positive, negative, and zero properly', () => {
  assert.equal(formatSemitones(0), '0 st (Original)');
  assert.equal(formatSemitones(5), '+5 st');
  assert.equal(formatSemitones(-4.5), '-4.5 st');
});

test('VOICE_EFFECT_PRESETS has parrot, child, elder, robot presets', () => {
  const ids = VOICE_EFFECT_PRESETS.map((p) => p.id);
  assert.ok(ids.includes('parrot'), 'Should have parrot preset');
  assert.ok(ids.includes('child'), 'Should have child preset');
  assert.ok(ids.includes('elder'), 'Should have elder preset');
  assert.ok(ids.includes('robot'), 'Should have robot preset');
});
