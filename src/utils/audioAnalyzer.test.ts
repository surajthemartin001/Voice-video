import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRmsTimeDomain,
  analyzeFrequencySpectrum,
  smoothStep,
} from './audioAnalyzer';

test('calculateRmsTimeDomain returns 0 for flat silence (all 128)', () => {
  const silence = new Uint8Array(128).fill(128);
  const rms = calculateRmsTimeDomain(silence);
  assert.equal(rms, 0);
});

test('calculateRmsTimeDomain detects loud sine wave', () => {
  const loud = new Uint8Array(128);
  for (let i = 0; i < 128; i++) {
    loud[i] = Math.round(128 + 120 * Math.sin((i / 128) * Math.PI * 4));
  }
  const rms = calculateRmsTimeDomain(loud);
  assert.ok(rms > 0.5, 'Loud wave should have high RMS');
});

test('analyzeFrequencySpectrum zeroes out below noise floor', () => {
  const quiet = new Uint8Array(256).fill(5); // tiny background noise
  const result = analyzeFrequencySpectrum(quiet);
  assert.equal(result.level, 0, 'Noise gate should cut subtle background noise to 0');
});

test('analyzeFrequencySpectrum detects active speech frequencies', () => {
  const speech = new Uint8Array(256).fill(0);
  // inject mid frequency energy
  for (let i = 10; i < 60; i++) {
    speech[i] = 180;
  }
  const result = analyzeFrequencySpectrum(speech);
  assert.ok(result.level > 0.3, 'Vocal formants should register substantial level');
});

test('smoothStep respects asymmetric attack and decay', () => {
  // Attack: target > current
  const attackNext = smoothStep(0, 1.0, 0.5, 0.1);
  assert.equal(attackNext, 0.5);

  // Decay: target < current
  const decayNext = smoothStep(1.0, 0, 0.5, 0.2);
  assert.equal(decayNext, 0.8);
});
