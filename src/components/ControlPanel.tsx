/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  UploadCloud,
  Play,
  Square,
  Pause,
  EyeOff,
  Maximize2,
  Minimize2,
  Trash2,
  Layers,
  Settings2,
  Video,
  Film,
  Music,
  FileAudio,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  Gauge,
  SlidersHorizontal,
} from 'lucide-react';
import { AudioWaveform } from './AudioWaveform.tsx';
import {
  VoiceEffectPreset,
  VOICE_EFFECT_PRESETS,
  formatSemitones,
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
  toneBrightness: number;
  onChangeTone: (val: number) => void;
  volume: number;
  onChangeVolume: (val: number) => void;
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
  toneBrightness,
  onChangeTone,
  volume,
  onChangeVolume,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatSecs = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onUploadFile(file);
    }
  };

  const activePreset =
    VOICE_EFFECT_PRESETS.find((p) => p.id === activePresetId) ||
    VOICE_EFFECT_PRESETS[0];

  return (
    <>
      {/* Floating restore pill button when panel is hidden */}
      {hidden && (
        <button
          onClick={onToggleHide}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full bg-slate-900/90 border border-sky-400/50 text-sky-200 text-sm font-semibold shadow-xl backdrop-blur-md hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
          title="पैनल दिखाएँ (H)"
        >
          <Settings2 className="w-4 h-4 text-sky-400" />
          <span>पैनल दिखाएँ (Press H)</span>
        </button>
      )}

      {/* Main glassmorphism control panel */}
      <section
        id="panel"
        className={`fixed z-20 left-1/2 bottom-3 -translate-x-1/2 w-[min(700px,96vw)] max-h-[85vh] overflow-y-auto bg-slate-950/92 border border-sky-400/40 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-xl shadow-2xl transition-all duration-200 text-[#eaf8ff] ${
          hidden ? 'hidden pointer-events-none' : 'flex'
        }`}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-2 border-b border-sky-500/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-300 font-semibold">
              <FileAudio className="w-3.5 h-3.5 text-sky-400" />
              <span>ऑडियो फ़ाइल Lip-Sync व वॉइस टोन मॉर्फ़र</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-sky-400/30 text-sky-200 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onToggleHide}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-sky-400/30 text-sky-200 transition-colors cursor-pointer"
              title="पैनल छुपाएँ (H)"
              aria-label="Hide panel"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 1. AUDIO UPLOAD ZONE */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac"
          onChange={handleFileChange}
          className="hidden"
          id="audioFileInput"
        />

        {!audioInfo ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-2xl border-2 border-dashed border-sky-400/50 hover:border-sky-300 bg-sky-950/30 hover:bg-sky-950/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
          >
            <div className="p-2.5 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-300 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-sky-100">
                अपनी ऑडियो फ़ाइल यहाँ अपलोड करें (Upload Voice Audio)
              </span>
              <span className="text-xs text-sky-300/70">
                MP3, WAV, M4A, AAC, OGG चुनें (क्लिक करें या ड्रैग करें)
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSampleAudio();
              }}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-sky-400/30 text-sky-200 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer mt-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>या डेमो आवाज़ लोड करें (Try Demo Voice)</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-400/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-400/40 shrink-0 text-sky-300">
                <Music className="w-4 h-4 text-sky-300" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs text-sky-100 truncate">
                  {audioInfo.name}
                </span>
                <span className="text-[11px] text-sky-300/70 font-mono">
                  {audioInfo.sizeFormatted} | अवधि: {formatSecs(duration || audioInfo.duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-semibold transition-all cursor-pointer"
              >
                बदलें
              </button>
              <button
                type="button"
                onClick={onRemoveAudio}
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs transition-all cursor-pointer"
                title="फ़ाइल हटाएँ"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          </div>
        )}

        {/* 2. VOICE TONE & PITCH MODIFICATION CONTROLLER (NEW USER REQUEST) */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-sky-500/30 flex flex-col gap-2.5 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-sky-200">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              <span>आवाज़ की टोन और पिच बदलें (Voice Tone & Pitch Morph)</span>
            </span>
            <span className="text-[11px] text-sky-300/80 font-mono">
              {formatSemitones(pitchSemitones)}
            </span>
          </div>

          {/* Voice Character Mode Presets Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {VOICE_EFFECT_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className={`p-1.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-sky-500/30 to-blue-600/30 border-sky-400 text-white shadow-sm ring-1 ring-sky-400'
                      : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-700/60 text-slate-300'
                  }`}
                  title={preset.description}
                >
                  <span className="text-lg leading-none">{preset.icon}</span>
                  <span className="text-[11px] font-bold truncate max-w-full text-center">
                    {preset.hindiName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Preset Description Helper */}
          {activePreset && (
            <div className="text-[11px] text-slate-300/90 bg-sky-950/40 border border-sky-500/20 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
              <span>{activePreset.description}</span>
              <span className="text-[10px] text-sky-400 font-mono shrink-0 ml-2">
                Pitch: {formatSemitones(activePreset.pitchSemitones)}
              </span>
            </div>
          )}

          {/* Fine Tuning Sliders: Pitch, Tone Brightness, Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-800">
            {/* Pitch Shift Slider (-12 to +12 semitones) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span>पिच (Pitch):</span>
                <span className="text-sky-300 font-mono font-bold">
                  {pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} st
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={pitchSemitones}
                onChange={(e) => onChangePitch(parseFloat(e.target.value))}
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>भारी (Deep)</span>
                <span>मूल</span>
                <span>तीखी (Parrot)</span>
              </div>
            </div>

            {/* Tone / Formant Brightness Slider (-8 to +8 dB) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span>टोन / क्लैरिटी (Tone):</span>
                <span className="text-sky-300 font-mono font-bold">
                  {toneBrightness > 0 ? `+${toneBrightness}` : toneBrightness} dB
                </span>
              </div>
              <input
                type="range"
                min="-8"
                max="8"
                step="0.5"
                value={toneBrightness}
                onChange={(e) => onChangeTone(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>वॉर्म (Warm)</span>
                <span>0 dB</span>
                <span>क्रिस्प (Crisp)</span>
              </div>
            </div>

            {/* Volume Gain Slider (0 to 1.5) */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1">
                  {volume === 0 ? (
                    <VolumeX className="w-3 h-3 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-sky-400" />
                  )}
                  <span>वॉल्यूम (Volume):</span>
                </span>
                <span className="text-sky-300 font-mono font-bold">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={volume}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0%</span>
                <span>100%</span>
                <span>150%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. VIDEO RECORDING SYSTEM (Save Lip-Sync to Gallery) */}
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
              <span>रिकॉर्डिंग के दौरान UI छुपाएँ (Clean Video)</span>
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
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                <span>रिकॉर्डेड वीडियो देखें / डाउनलोड करें</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center text-[11px] text-slate-400 px-2 leading-tight">
                बदली हुई टोन और पिच की आवाज़ के साथ ऑर्ब Lip-sync करेगा और पूरी वीडियो सीधे आपकी गैलरी में सेव होगी।
              </div>
            )}
          </div>
        </div>

        {/* 4. SETTINGS: Title, Background, Speed */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <label className="flex flex-col gap-1 text-xs font-semibold text-sky-200">
            <span>नाम (गोले के नीचे - Title)</span>
            <input
              id="title"
              type="text"
              value={titleText}
              onChange={(e) => onChangeTitleText(e.target.value)}
              placeholder="Everything at a Glance"
              className="w-full px-2.5 py-1.5 rounded-xl border border-sky-400/40 bg-slate-900 text-sky-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-sky-200">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Background</span>
            </span>
            <select
              id="bg"
              value={background}
              onChange={(e) => onChangeBackground(e.target.value as 'space' | 'green')}
              className="w-full px-2 py-1.5 rounded-xl border border-sky-400/40 bg-slate-900 text-sky-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="space">🌌 Space (ब्रह्मांड और तारे)</option>
              <option value="green">🟩 Green Screen (Chroma Key)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-sky-200">
            <span>Playback Speed</span>
            <select
              id="speed"
              value={speed}
              onChange={(e) => onChangeSpeed(Number(e.target.value))}
              className="w-full px-2 py-1.5 rounded-xl border border-sky-400/40 bg-slate-900 text-sky-100 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value={0.8}>0.8x धीमी</option>
              <option value={0.9}>0.9x Normal</option>
              <option value={1.0}>1.0x सामान्य</option>
              <option value={1.15}>1.15x तेज</option>
              <option value={1.3}>1.3x बहुत तेज</option>
            </select>
          </label>
        </div>

        {/* 5. LIVE AUDIO WAVEFORM & SEEKER */}
        <AudioWaveform
          analyserNode={analyserNode}
          isPlaying={isSpeaking && !isPaused}
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeekTime}
        />

        {/* 6. PRIMARY PLAYBACK CONTROLS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {!isSpeaking ? (
            <button
              id="play"
              type="button"
              onClick={onPlay}
              disabled={!hasAudio}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>ऑडियो चलाएँ (Play with Lip-Sync)</span>
            </button>
          ) : (
            <button
              id="pause"
              type="button"
              onClick={onPause}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause (रोकें)</span>
            </button>
          )}

          <button
            id="stop"
            type="button"
            onClick={onStop}
            disabled={!isSpeaking && !isPaused && !isRecording}
            className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-sky-400/40 text-sky-100 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Square className="w-4 h-4 fill-current text-rose-400" />
            <span>Stop (बंद करें)</span>
          </button>
        </div>

        {/* Secondary controls row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="clean"
            type="button"
            onClick={onToggleHide}
            className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-sky-400/20 text-sky-200 text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <EyeOff className="w-3 h-3" />
            <span>पैनल छुपाएँ (H)</span>
          </button>

          <button
            id="full"
            type="button"
            onClick={onToggleFullscreen}
            className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-sky-400/20 text-sky-200 text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Fullscreen</span>
          </button>
        </div>

        {/* Status indicator */}
        <div
          id="status"
          role="status"
          className={`text-xs px-3 py-2 rounded-xl border flex items-center justify-between ${
            statusType === 'err'
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              : statusType === 'ok'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-sky-950/50 border-sky-500/30 text-sky-200'
          }`}
        >
          <span className="truncate">{statusMessage}</span>
          <span className="text-[10px] opacity-70 shrink-0 ml-2">Press H to hide</span>
        </div>
      </section>
    </>
  );
};
