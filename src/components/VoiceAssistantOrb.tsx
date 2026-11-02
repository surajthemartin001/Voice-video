/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { analyzeFrequencySpectrum, calculateRmsTimeDomain, smoothStep } from '../utils/audioAnalyzer.ts';

interface VoiceAssistantOrbProps {
  titleText: string;
  background: 'space' | 'green';
  isSpeaking: boolean;
  isPaused: boolean;
  analyserNode: AnalyserNode | null;
  onTogglePanel?: () => void;
  panelHidden?: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

interface Star {
  x: number;
  y: number;
  r: number;
  p: number;
  s: number;
}

interface Spark {
  a: number;
  r: number;
  v: number;
  life: number;
  size: number;
  spin: number;
}

export const VoiceAssistantOrb: React.FC<VoiceAssistantOrbProps> = ({
  titleText,
  background,
  isSpeaking,
  isPaused,
  analyserNode,
  onTogglePanel,
  panelHidden,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (onCanvasReady && canvasRef.current) {
      onCanvasReady(canvasRef.current);
    }
  }, [onCanvasReady]);

  // Animation and state refs (survives renders without resetting canvas loop)
  const animStateRef = useRef({
    level: 0,
    wide: 0.4,
    cx: 0,
    cy: 0,
    R: 0,
    init: false,
    nextBlink: 2,
    blinkStart: -1,
  });

  const starsRef = useRef<Star[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Uint8Array | null>(null);

  // Setup Analyser byte arrays when analyserNode changes
  useEffect(() => {
    if (analyserNode) {
      freqDataRef.current = new Uint8Array(analyserNode.frequencyBinCount);
      timeDataRef.current = new Uint8Array(analyserNode.fftSize);
    }
  }, [analyserNode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const TAU = Math.PI * 2;
    const rnd = Math.random;

    let W = window.innerWidth;
    let H = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function handleResize() {
      if (!canvas || !ctx) return;
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      starsRef.current = Array.from(
        { length: Math.floor((W * H) / 5500) },
        () => ({
          x: rnd() * W,
          y: rnd() * H,
          r: 0.4 + Math.pow(rnd(), 3) * 2.2,
          p: rnd() * TAU,
          s: 0.8 + rnd() * 2.5,
        })
      );
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    // Glow helper
    function glow(x: number, y: number, r: number, col: string) {
      if (!ctx) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(0.1, r));
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(120,210,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
      ctx.fill();
    }

    // Blink calculation
    function blinkVal(t: number): number {
      const S = animStateRef.current;
      if (S.blinkStart < 0 && t > S.nextBlink) {
        S.blinkStart = t;
      }
      if (S.blinkStart >= 0) {
        const p = (t - S.blinkStart) / 0.16;
        if (p >= 1) {
          S.blinkStart = -1;
          S.nextBlink = t + 2 + rnd() * 3.5;
          return 1;
        }
        return 1 - Math.sin(p * Math.PI) * 0.92;
      }
      return 1;
    }

    // Audio Analysis & Mouth Modulation
    function updateAudioSignal(t: number) {
      const S = animStateRef.current;
      let targetLevel = 0;
      let targetWide = 0.4;

      if (isSpeaking && !isPaused) {
        if (analyserNode && freqDataRef.current && timeDataRef.current) {
          analyserNode.getByteFrequencyData(freqDataRef.current as any);
          analyserNode.getByteTimeDomainData(timeDataRef.current as any);

          const timeRms = calculateRmsTimeDomain(timeDataRef.current);
          const freqResult = analyzeFrequencySpectrum(freqDataRef.current);

          // If sound is active, blend time RMS and spectral energy
          if (timeRms > 0.02 || freqResult.level > 0.02) {
            targetLevel = Math.min(1.0, freqResult.level * 0.7 + timeRms * 1.4);
            targetWide = freqResult.wideTarget;
          } else {
            // Silence gap in sentence: mouth quickly rests
            targetLevel = 0;
            targetWide = 0.4;
          }
        } else {
          // Fallback simulation when AnalyserNode isn't connected
          const fallback = 0.5 + 0.5 * Math.sin(t * 18);
          targetLevel = 0.25 + fallback * 0.45;
          targetWide = 0.6;
        }
      } else {
        targetLevel = 0;
        targetWide = 0.4;
      }

      // Smooth step towards targets
      S.level = smoothStep(S.level, targetLevel, 0.48, 0.16);
      S.wide = smoothStep(S.wide, targetWide, 0.25, 0.1);
    }

    // Background Rendering
    function drawBG(t: number) {
      if (!ctx) return;
      const S = animStateRef.current;

      if (background === 'green') {
        ctx.fillStyle = '#00b140';
        ctx.fillRect(0, 0, W, H);
        return;
      }

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#030718');
      g.addColorStop(1, '#0c1650');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Deep radial glow behind the orb
      const n = ctx.createRadialGradient(S.cx, S.cy, 0, S.cx, S.cy, Math.max(1, S.R * 4.5));
      n.addColorStop(0, 'rgba(70,150,255,.28)');
      n.addColorStop(1, 'rgba(70,150,255,0)');
      ctx.fillStyle = n;
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (const s of starsRef.current) {
        const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
      }
    }

    // Corona Rays and Pulsing Sparks
    function drawCorona(t: number, cx: number, cy: number, R: number) {
      if (!ctx) return;
      const S = animStateRef.current;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const rr = R * (2.2 + S.level * 0.85);
      const g = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, rr);
      g.addColorStop(0, 'rgba(120,210,255,.5)');
      g.addColorStop(0.4, 'rgba(80,170,255,.16)');
      g.addColorStop(1, 'rgba(80,170,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, TAU);
      ctx.fill();

      const N = 56;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU + t * 0.12 + Math.sin(t * 0.5 + i) * 0.02;
        const n =
          0.5 +
          0.5 *
            (Math.sin(i * 1.7 + t * 1.3) * 0.5 +
              Math.sin(i * 3.1 - t * 0.9) * 0.3 +
              Math.sin(i * 0.7 + t * 2.1) * 0.2);
        const len = R * (0.18 + 0.55 * n * n) * (1 + S.level * 1.6);
        const bw = R * (0.07 + 0.05 * n);
        const bend = Math.sin(t * 1.4 + i * 2.3) * R * 0.14;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        const px = -dy;
        const py = dx;
        const bx = cx + dx * R * 0.96;
        const by = cy + dy * R * 0.96;
        const tx = bx + dx * len + px * bend;
        const ty = by + dy * len + py * bend;

        const gg = ctx.createLinearGradient(bx, by, tx, ty);
        gg.addColorStop(0, 'rgba(255,255,255,.55)');
        gg.addColorStop(0.4, 'rgba(130,210,255,.35)');
        gg.addColorStop(1, 'rgba(100,180,255,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.moveTo(bx + px * bw, by + py * bw);
        ctx.quadraticCurveTo(bx + dx * len * 0.5 + px * bw, by + dy * len * 0.5 + py * bw, tx, ty);
        ctx.quadraticCurveTo(bx + dx * len * 0.5 - px * bw, by + dy * len * 0.5 - py * bw, bx - px * bw, by - py * bw);
        ctx.closePath();
        ctx.fill();
      }

      // Spark particles
      const sparks = sparksRef.current;
      const spawn = (rnd() < 0.5 ? 1 : 0) + Math.floor(S.level * 6);
      for (let i = 0; i < spawn && sparks.length < 400; i++) {
        sparks.push({
          a: rnd() * TAU,
          r: R,
          v: 0.6 + rnd() * 1.8,
          life: 1,
          size: 1 + rnd() * 2.2,
          spin: (rnd() - 0.5) * 0.02,
        });
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.r += p.v * (1 + S.level * 2.2);
        p.a += p.spin;
        p.life -= 0.02;
        if (p.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        const x = cx + Math.cos(p.a) * p.r;
        const y = cy + Math.sin(p.a) * p.r;
        glow(x, y, p.size * 5, `rgba(160,225,255,${p.life * 0.3})`);
        ctx.fillStyle = `rgba(255,255,255,${p.life})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.8, 0, TAU);
        ctx.fill();
      }

      ctx.restore();
    }

    // Blue Orb Sphere
    function drawOrb(t: number, cx: number, cy: number, R: number) {
      if (!ctx) return;
      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
      g.addColorStop(0, '#f2fbff');
      g.addColorStop(0.35, '#bfe8fa');
      g.addColorStop(0.7, '#87ceeb');
      g.addColorStop(1, '#5bb5e3');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();

      // Specular internal reflections
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.clip();
      for (let k = 0; k < 3; k++) {
        glow(
          cx + Math.cos(t * 0.4 + k * 2.1) * R * 0.45,
          cy + Math.sin(t * 0.3 + k * 1.7) * R * 0.45,
          R * 0.6,
          'rgba(255,255,255,.2)'
        );
      }
      ctx.restore();

      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = R * 0.02;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
    }

    // Expressive Face (Eyes, Eyebrows, Blush, Responsive Mouth)
    function drawFace(t: number, cx: number, cy: number, R: number) {
      if (!ctx) return;
      const S = animStateRef.current;
      const L = S.level;
      const ink = '#1b2a52';

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(t * 0.8) * 0.03 + L * Math.sin(t * 9) * 0.02);

      // Pink blush cheeks
      for (const sx of [-1, 1]) {
        glow(sx * R * 0.52, R * 0.16, R * 0.15, `rgba(255,120,150,${0.5 + 0.25 * L})`);
      }

      // Eyes & Eyebrows
      const open = blinkVal(t) * (1 + 0.12 * L);
      const gx = Math.sin(t * 0.7) * R * 0.03;
      const gy = Math.cos(t * 0.5) * R * 0.015;

      for (const sx of [-1, 1]) {
        const ex = sx * R * 0.32;
        const ey = -R * 0.12;

        // Eye oval
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.ellipse(ex + gx, ey + gy, R * 0.085, R * 0.125 * open, 0, 0, TAU);
        ctx.fill();

        // White highlights
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex + gx - R * 0.03, ey + gy - R * 0.05 * open, R * 0.03, 0, TAU);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ex + gx + R * 0.03, ey + gy + R * 0.04 * open, R * 0.015, 0, TAU);
        ctx.fill();

        // Eyebrows
        ctx.strokeStyle = ink;
        ctx.lineWidth = R * 0.03;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - R * 0.11, -R * 0.32 + R * 0.02);
        ctx.quadraticCurveTo(ex, -R * 0.38, ex + R * 0.11, -R * 0.32 + R * 0.02);
        ctx.stroke();
      }

      // Responsive Mouth
      const wideAmt = Math.max(0, Math.min(1, (S.wide - 0.25) * 2.5));
      const mh = R * (0.03 + 0.34 * L);
      const mw = R * (0.14 + 0.14 * wideAmt) * (1 - 0.25 * L);
      const sm = R * 0.07 * Math.max(0, Math.min(1, 1 - L * 1.2));
      const cl = R * 0.03 * (1 - L);

      ctx.translate(0, R * 0.3);
      const p = new Path2D();
      p.moveTo(-mw, -cl);
      p.bezierCurveTo(-mw * 0.5, -mh * 0.3, mw * 0.5, -mh * 0.3, mw, -cl);
      p.bezierCurveTo(mw * 0.7, mh * 1.15 + sm, -mw * 0.7, mh * 1.15 + sm, -mw, -cl);

      ctx.fillStyle = '#5a1f2e';
      ctx.fill(p);

      ctx.save();
      ctx.clip(p);

      // Teeth band when mouth opens wide
      if (L > 0.12) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-mw, -R * 0.1, mw * 2, R * 0.1 + mh * 0.22);
      }

      // Pink tongue
      if (L > 0.1) {
        ctx.fillStyle = '#ff7a8a';
        ctx.beginPath();
        ctx.ellipse(0, mh * 0.95, mw * 0.5, mh * 0.45, 0, 0, TAU);
        ctx.fill();
      }

      ctx.restore();

      ctx.strokeStyle = ink;
      ctx.lineWidth = R * 0.025;
      ctx.stroke(p);

      ctx.restore();
    }

    // Glowing Title Beneath the Orb
    function drawTitle(t: number, cx: number, cy: number, R: number) {
      if (!ctx || !titleText.trim()) return;
      ctx.save();
      ctx.font = `700 ${R * 0.26}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const y = cy + R * 1.75 + Math.sin(t * 1.1) * R * 0.02;
      const g = ctx.createLinearGradient(cx - R * 2, y, cx + R * 2, y);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.5, '#b8ecff');
      g.addColorStop(1, '#ffffff');

      ctx.shadowColor = 'rgba(120,210,255,.95)';
      ctx.shadowBlur = R * (0.15 + 0.1 * animStateRef.current.level);
      ctx.fillStyle = g;
      ctx.fillText(titleText, cx, y);
      ctx.restore();
    }

    // Main Animation Loop
    function frame(ms: number) {
      const t = ms / 1000;
      updateAudioSignal(t);

      const S = animStateRef.current;
      // Reserve space for control panel unless hidden
      const ph = panelHidden ? 0 : 280;
      const areaH = Math.max(300, H - ph);
      const targetR = Math.min(W * 0.25, areaH * 0.24, 180);
      const targetY = areaH * 0.45;

      if (!S.init) {
        S.R = targetR;
        S.cy = targetY;
        S.init = true;
      }

      S.R += (targetR - S.R) * 0.08;
      S.cy += (targetY - S.cy) * 0.08;
      S.cx = W / 2;

      const R = S.R * (1 + 0.025 * Math.sin(t * 1.6) + 0.06 * S.level);
      const cx = S.cx;
      const cy = S.cy + Math.sin(t * 1.1) * S.R * 0.03;

      drawBG(t);
      drawCorona(t, cx, cy, R);
      drawOrb(t, cx, cy, R);
      drawFace(t, cx, cy, R);
      drawTitle(t, cx, cy, S.R);

      animationFrameId = requestAnimationFrame(frame);
    }

    animationFrameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [background, titleText, isSpeaking, isPaused, panelHidden, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      onDoubleClick={onTogglePanel}
      className="fixed inset-0 w-full h-full cursor-pointer z-0 touch-none"
      title="Double click to toggle control panel (H)"
    />
  );
};
