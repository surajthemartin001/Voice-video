/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  analyserNode,
  isPlaying,
  currentTime,
  duration,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Idle gentle waveform
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.floor(8 + Math.sin(Date.now() * 0.003 + i * 0.2) * 6);
        }
      }

      const barCount = 36;
      const step = Math.max(1, Math.floor(bufferLength / barCount));
      const barWidth = (width / barCount) * 0.65;
      const spacing = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        const normalized = Math.min(1, Math.max(0.08, val / 255));
        const barHeight = Math.max(4, normalized * (height * 0.88));

        const x = i * (barWidth + spacing);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#87ceeb');
        grad.addColorStop(1, '#3b82f6');

        ctx.fillStyle = isPlaying ? grad : 'rgba(135,206,235,0.35)';
        ctx.beginPath();
        // Rounded bar
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyserNode, isPlaying]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-sky-400/20 backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs font-mono text-sky-200/80 px-1">
        <span className="flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          {isPlaying ? 'Live Audio Formants' : 'Audio Track'}
        </span>
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="relative h-10 w-full flex items-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={40}
          className="w-full h-full block rounded-lg"
        />
      </div>

      {duration > 0 && (
        <div
          className="relative h-1.5 w-full bg-slate-700/60 rounded-full cursor-pointer overflow-hidden group"
          onClick={(e) => {
            if (!onSeek) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            onSeek(pct * duration);
          }}
          title="Click to seek"
        >
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-75"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};
