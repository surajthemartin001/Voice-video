/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Play,
  Square,
  Pause,
  EyeOff,
  Maximize2,
  Minimize2,
  Trash2,
  Video,
  Film,
  Music,
  FileAudio,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  Gauge,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform.tsx';
import {
  VoiceEffectPreset,
  VOICE_EFFECT_PRESETS,
  formatSemitones,
  getPitchDescriptor,
} from '../utils/voiceEffects.ts';

export interface UploadedAudioInfo {
  name: string;
  sizeFormatted: string;
  duration: number;
}

interface ControlPanelProps {
  hidden: boolean;
  onToggleHide: () => void;
  audioInfo: UploadedAudioInfo | null;
  onUploadFile: (file: File) => void;
  onLoadSampleAudio: () => void;
  onRemoveAudio: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  titleText: string;
  onChangeTitleText: (title: string) => void;
  background: 'space' | 'green';
  onChangeBackground: (bg: 'space' | 'green') => void;
  onPlay: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  hasAudio: boolean;
  statusMessage: string;
  statusType: 'ok' | 'err' | 'info' | 'warn';
  analyserNode: AnalyserNode | null;
  currentTime: number;
  duration: number;
  onSeekTime: (time: number) => void;
  // Video Recording Props
  isRecording: boolean;
  recordingTime: number;
  onRecordAndPlay: () => void;
  onStopRecording: () => void;
  hasRecordedVideo: boolean;
  onOpenVideoModal: () => void;
  autoHideOnRecord: boolean;
  onToggleAutoHideOnRecord: (val: boolean) => void;
  // Voice Morphing / Tone / Pitch Props
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  pitchSemitones: number;
  onChangePitch: (val: number) => void;
  bassGain: number;
  onChangeBass: (val: number) => void;
  midGain: number;
  onChangeMid: (val: number) => void;
  trebleGain: number;
  onChangeTreble: (val: number) => void;
  volume: number;
  onChangeVolume: (val: number) => void;
  onResetEffects: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  hidden,
  onToggleHide,
  audioInfo,
  onUploadFile,
  onLoadSampleAudio,
  onRemoveAudio,
  speed,
  onChangeSpeed,
  titleText,
  onChangeTitleText,
  background,
  onChangeBackground,
  onPlay,
  onStop,
  onPause,
  onResume,
  onToggleFullscreen,
  isFullscreen,
  isSpeaking,
  isPaused,
  hasAudio,
  statusMessage,
  statusType,
  analyserNode,
  currentTime,
  duration,
  onSeekTime,
  isRecording,
  recordingTime,
  onRecordAndPlay,
  onStopRecording,
  hasRecordedVideo,
  onOpenVideoModal,
  autoHideOnRecord,
  onToggleAutoHideOnRecord,
  activePresetId,
  onSelectPreset,
  pitchSemitones,
  onChangePitch,
  bassGain,
  onChangeBass,
  midGain,
  onChangeMid,
  trebleGain,
  onChangeTreble,
  volume,
  onChangeVolume,
  onResetEffects,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAdvancedEQ, setShowAdvancedEQ] = useState<boolean>(true);

  const formatSecs = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFile(e.target.files[0]);
    }
  };

  if (hidden) {
    return (
      <div className="fixed top-4 right-4 z-40">
        <button
          type="button"
          onClick={onToggleHide}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 text-cyan-300 border border-cyan-500/40 backdrop-blur-md shadow-xl hover:bg-slate-800 transition-all font-medium text-xs cursor-pointer active:scale-95"
          title="पैनल खोलें (Press H)"
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>कंट्रोल पैनल खोलें (H)</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-4 sm:right-auto z-40 w-full sm:w-[480px] max-h-[88vh] sm:max-h-[86vh] flex flex-col bg-slate-950/92 backdrop-blur-xl border-t sm:border border-cyan-500/30 sm:rounded-2xl shadow-2xl text-slate-100 overflow-hidden transition-all duration-300"
      aria-label="ऑडियो कंट्रोल पैनल"
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-blue-950/80 border-b border-cyan-500/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-cyan-300 font-mono">
            आवाज़ मॉर्फ़र व लिप-सिंक स्टूडियो
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'फुलस्क्रीन बंद करें (F)' : 'फुलस्क्रीन चालू करें (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onToggleHide}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
            title="पैनल छुपाएँ (Press H)"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs text-slate-200">
        {/* Status Indicator */}
        <div
          className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
            statusType === 'ok'
              ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
              : statusType === 'err'
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                : statusType === 'warn'
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                  : 'bg-slate-900/60 border-slate-700 text-slate-300'
          }`}
        >
          <span className="truncate pr-2">{statusMessage}</span>
          {isSpeaking && (
            <span className="flex items-center gap-1 shrink-0 font-mono text-[10px] text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              चल रहा है
            </span>
          )}
        </div>

        {/* 1. AUDIO UPLOAD & WAVEFORM SCRUBBER */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
              <FileAudio className="w-3.5 h-3.5 text-cyan-400" />
              <span>ऑडियो फ़ाइल (Custom Audio)</span>
            </span>
            {audioInfo && (
              <button
                type="button"
                onClick={onRemoveAudio}
                className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer hover:underline"
              >
                <Trash2 className="w-3 h-3" />
                <span>हटाएँ</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm,.flac"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!audioInfo ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 rounded-xl p-3.5 text-center bg-slate-950/60 cursor-pointer transition-all hover:bg-cyan-950/20 group"
            >
              <UploadCloud className="w-7 h-7 mx-auto text-cyan-400 group-hover:scale-110 transition-transform mb-1.5" />
              <p className="font-semibold text-slate-200 text-xs">
                अपनी ऑडियो फ़ाइल चुनें या यहाँ ड्रैग करें
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                MP3, WAV, M4A, AAC, OGG समर्थित हैं
              </p>
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoadSampleAudio();
                  }}
                  className="px-3 py-1 rounded-lg bg-cyan-900/50 hover:bg-cyan-800/60 text-cyan-200 text-[10px] border border-cyan-500/30 transition-colors"
                >
                  डेमो ऑडियो लोड करें (Demo Sound)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                <div className="flex items-center gap-2 truncate pr-2">
                  <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-medium truncate text-cyan-100">{audioInfo.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-slate-400">
                  <span>{audioInfo.sizeFormatted}</span>
                  <span>•</span>
                  <span>{formatSecs(duration || audioInfo.duration)}</span>
                </div>
              </div>

              {/* Real-time Waveform Spectrum & Scrubber */}
              <AudioWaveform
                analyserNode={analyserNode}
                currentTime={currentTime}
                duration={duration || audioInfo.duration}
                onSeek={onSeekTime}
                isPlaying={isSpeaking}
              />
            </div>
          )}
        </div>

        {/* 2. ADVANCED VOICE MORPHING & PITCH / EQUALIZER CONTROLLER */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-900/90 to-cyan-950/30 border border-cyan-500/30 flex flex-col gap-3 shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs text-cyan-200">
                आवाज़ मॉड्यूलेटर (Voice Pitch & Studio EQ)
              </span>
            </div>
            <button
              type="button"
              onClick={onResetEffects}
              className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              title="सभी इफ़ेक्ट सामान्य करें"
            >
              <RotateCcw className="w-3 h-3" />
              <span>रीसेट (Reset)</span>
            </button>
          </div>

          {/* Quick Voice Character Presets (8 Presets) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">
              त्वरित आवाज़ मोड (Voice Presets):
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {VOICE_EFFECT_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset.id)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-cyan-600/40 to-blue-700/50 border-cyan-400 text-white shadow-md shadow-cyan-500/20 scale-[1.02]'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
                    }`}
                    title={preset.description}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <span className="text-[10px] font-bold truncate max-w-full text-center leading-tight">
                      {preset.hindiName}
                    </span>
                    <span className="text-[8px] font-mono opacity-80">
                      {formatSemitones(preset.pitchSemitones)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MASTER PITCH SLIDER (-24 to +24 Semitones: Ultra Deep to Ultra Squeaky) */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>पिच नियंत्रण (पतली / मोटी आवाज़):</span>
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                {formatSemitones(pitchSemitones)}
              </span>
            </div>

            {/* Descriptor tag */}
            <div className="text-[11px] font-medium text-cyan-300/90 bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-500/20 text-center">
              {getPitchDescriptor(pitchSemitones)}
            </div>

            {/* Slider */}
            <input
              type="range"
              min="-24"
              max="24"
              step="0.5"
              value={pitchSemitones}
              onChange={(e) => onChangePitch(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span className="text-rose-400 font-bold">👹 -24 st (अल्ट्रा मोटा)</span>
              <span>0 st (मूल)</span>
              <span className="text-emerald-400 font-bold">🐿️ +24 st (अल्ट्रा पतला)</span>
            </div>

            {/* Quick Pitch Jump Buttons */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              <button
                type="button"
                onClick={() => onChangePitch(-18)}
                className={`py-1 px-1 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer ${
                  pitchSemitones === -18
                    ? 'bg-rose-900/60 border-rose-400 text-rose-200'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                👹 -18st दानव
              </button>
              <button
                type="button"
                onClick={() => onChangePitch(-8)}
                className={`py-1 px-1 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer ${
                  pitchSemitones === -8
                    ? 'bg-amber-900/60 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                👴 -8st भारी
              </button>
              <button
                type="button"
                onClick={() => onChangePitch(0)}
                className={`py-1 px-1 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer ${
                  pitchSemitones === 0
                    ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                ✨ 0st मूल
              </button>
              <button
                type="button"
                onClick={() => onChangePitch(9.5)}
                className={`py-1 px-1 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer ${
                  pitchSemitones === 9.5
                    ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                🦜 +9.5st तोता
              </button>
              <button
                type="button"
                onClick={() => onChangePitch(18)}
                className={`py-1 px-1 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer ${
                  pitchSemitones === 18
                    ? 'bg-purple-900/60 border-purple-400 text-purple-200'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                🐿️ +18st पतला
              </button>
            </div>
          </div>

          {/* ADVANCED 3-BAND STUDIO EQUALIZER (Bass, Mids, Treble Clarity) */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2.5">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setShowAdvancedEQ((prev) => !prev)}
            >
              <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>स्टूडियो इक्वलाइज़र (Deep Bass / Mids / Crisp Treble)</span>
              </span>
              <button type="button" className="text-slate-400 hover:text-white">
                {showAdvancedEQ ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showAdvancedEQ && (
              <div className="space-y-3 pt-1 border-t border-slate-800/80">
                {/* 1. Bass / Chest Resonance (-12 dB to +15 dB) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span>बास व भारीपन (Deep Chest Resonance):</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {bassGain > 0 ? `+${bassGain}` : bassGain} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="15"
                    step="0.5"
                    value={bassGain}
                    onChange={(e) => onChangeBass(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>लाइट कट (-12dB)</span>
                    <span>0 dB</span>
                    <span className="text-amber-400 font-bold">गहरा भारी बेस (+15dB)</span>
                  </div>
                </div>

                {/* 2. Vocal Mids / Presence (-10 dB to +10 dB) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span>मिड-रेंज वोकल्स (Vocal Clarity & Presence):</span>
                    <span className="text-cyan-300 font-mono font-bold">
                      {midGain > 0 ? `+${midGain}` : midGain} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.5"
                    value={midGain}
                    onChange={(e) => onChangeMid(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>सॉफ्ट (-10dB)</span>
                    <span>0 dB</span>
                    <span>स्पष्ट वोकल्स (+10dB)</span>
                  </div>
                </div>

                {/* 3. Treble / Air Clarity (-15 dB to +15 dB) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-300">
                    <span>ट्रेबल व चमक (Crisp Highs & Squeak):</span>
                    <span className="text-emerald-300 font-mono font-bold">
                      {trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="0.5"
                    value={trebleGain}
                    onChange={(e) => onChangeTreble(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>स्मूथ (-15dB)</span>
                    <span>0 dB</span>
                    <span className="text-emerald-400 font-bold">तीखी पतली चमक (+15dB)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Master Volume Boost (0% to 200%) & Speed (0.5x to 2.0x) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Volume Gain Slider (0 to 2.0) */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1">
                  {volume === 0 ? (
                    <VolumeX className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-cyan-400" />
                  )}
                  <span>वॉल्यूम (Volume):</span>
                </span>
                <span className="text-cyan-300 font-mono font-bold">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2.0"
                step="0.05"
                value={volume}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>0%</span>
                <span>100%</span>
                <span className="text-cyan-400 font-bold">200%</span>
              </div>
            </div>

            {/* Playback Speed Slider (0.5x to 2.0x) */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-purple-400" />
                  <span>स्पीड (Speed):</span>
                </span>
                <span className="text-purple-300 font-mono font-bold">
                  {speed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={speed}
                onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
                className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. VIDEO RECORDING SYSTEM (Direct Save to Gallery) */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-sky-950/60 border border-emerald-400/40 flex flex-col gap-2 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Video className="w-4 h-4 text-emerald-400" />
              <span>Lip-Sync वीडियो रिकॉर्डर (Save Video to Gallery)</span>
            </span>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoHideOnRecord}
                onChange={(e) => onToggleAutoHideOnRecord(e.target.checked)}
                className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span>रिकॉर्डिंग में UI छुपाएँ</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={onRecordAndPlay}
                disabled={!hasAudio}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>मॉर्फ़ ऑडियो के साथ वीडियो रिकॉर्ड करें (Record Video)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStopRecording}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>रिकॉर्डिंग रोकें और सेव करें ({formatSecs(recordingTime)})</span>
              </button>
            )}

            {hasRecordedVideo ? (
              <button
                type="button"
                onClick={onOpenVideoModal}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5 text-white" />
                <span>रिकॉर्ड किया हुआ वीडियो देखें / डाउनलोड करें</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center justify-center text-[11px] text-slate-400 italic">
                रिकॉर्ड होते ही वीडियो आपकी गैलरी में सेव हो जाएगा
              </div>
            )}
          </div>
        </div>

        {/* 4. VISUAL CUSTOMIZATION (Title & Green Screen Chroma Key) */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-300">शीर्षक (Title):</span>
            <input
              type="text"
              value={titleText}
              onChange={(e) => onChangeTitleText(e.target.value)}
              placeholder="शीर्षक दर्ज करें..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-300">बैकग्राउंड थीम:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onChangeBackground('space')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  background === 'space'
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🌌 स्पेस (Space)
              </button>
              <button
                type="button"
                onClick={() => onChangeBackground('green')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  background === 'green'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🟩 ग्रीन स्क्रीन (Chroma Key)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Playbar */}
      <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center gap-2 shrink-0">
        {!isSpeaking ? (
          <button
            type="button"
            onClick={isPaused ? onResume : onPlay}
            disabled={!hasAudio}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isPaused ? 'पुनः शुरू करें (Resume)' : 'प्ले करें और Lip-Sync देखें'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>रोकें (Pause)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onStop}
          disabled={!hasAudio}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="ऑडियो पूरी तरह रोकें"
        >
          <Square className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
