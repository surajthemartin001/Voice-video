/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceAssistantOrb } from './components/VoiceAssistantOrb.tsx';
import { ControlPanel, UploadedAudioInfo } from './components/ControlPanel.tsx';
import { VideoModal } from './components/VideoModal.tsx';
import { synthesizeFallbackSpeechWav } from './utils/formantSynth.ts';
import {
  VOICE_EFFECT_PRESETS,
  semitonesToPitchRatio,
  formatSemitones,
} from './utils/voiceEffects.ts';
import {
  getSupportedVideoMimeType,
  generateVideoFilename,
  triggerVideoDownload,
} from './utils/videoRecorder.ts';
import { Square } from 'lucide-react';

export default function App() {
  const [audioInfo, setAudioInfo] = useState<UploadedAudioInfo | null>(null);
  const [speed, setSpeed] = useState<number>(1.0);
  const [titleText, setTitleText] = useState<string>('Everything at a Glance');
  const [background, setBackground] = useState<'space' | 'green'>('space');
  const [panelHidden, setPanelHidden] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Voice Tone / Pitch / Studio EQ States
  const [activePresetId, setActivePresetId] = useState<string>('original');
  const [pitchSemitones, setPitchSemitones] = useState<number>(0); // -24 to +24 st
  const [bassGain, setBassGain] = useState<number>(0);             // -12 to +15 dB
  const [midGain, setMidGain] = useState<number>(0);               // -10 to +10 dB
  const [trebleGain, setTrebleGain] = useState<number>(0);         // -15 to +15 dB
  const [volume, setVolume] = useState<number>(1.0);               // 0 to 2.0 (0% - 200%)

  // Playback states
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hasAudio, setHasAudio] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    'अपनी ऑडियो फ़ाइल अपलोड करें और तोता, बच्चा, बुजुर्ग, दानव जैसी टोन में आवाज़ बदलें।'
  );
  const [statusType, setStatusType] = useState<'ok' | 'err' | 'info' | 'warn'>('ok');

  // Video Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [autoHideOnRecord, setAutoHideOnRecord] = useState<boolean>(true);
  const [hasRecordedVideo, setHasRecordedVideo] = useState<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);

  // Audio Graph References
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const mediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // 5-Band Studio Vocal DSP Filter Nodes
  const lowCutFilterRef = useRef<BiquadFilterNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const formantFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Apply real-time playbackRate calculated from semitones and speed
  const applyPitchAndSpeed = useCallback(
    (semitones: number, spd: number) => {
      if (audioRef.current) {
        // Disabling preservesPitch allows browser to shift physical acoustic pitch
        (audioRef.current as any).preservesPitch = false;
        (audioRef.current as any).mozPreservesPitch = false;
        (audioRef.current as any).webkitPreservesPitch = false;

        const pitchRatio = semitonesToPitchRatio(semitones);
        // Supports massive range: 0.15 (super deep monster) to 4.5 (super thin squeaky cartoon)
        const finalRate = Math.max(0.15, Math.min(4.5, pitchRatio * spd));
        audioRef.current.playbackRate = finalRate;
      }
    },
    []
  );

  // Initialize Web Audio Graph with complete 5-band studio vocal processing
  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();

      // 1. Low Cut Filter (Highpass) to eliminate subsonic mud and mic rumble
      const lowCut = ctx.createBiquadFilter();
      lowCut.type = 'highpass';
      lowCut.frequency.value = 50;
      lowCut.Q.value = 0.7;

      // 2. Deep Bass Shelf Filter (120 Hz) for chest resonance / heavy voice
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 120;
      bass.gain.value = bassGain;

      // 3. Vocal Midrange Filter (1200 Hz) for clarity and presence
      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1200;
      mid.Q.value = 1.0;
      mid.gain.value = midGain;

      // 4. Formant Peaking Filter to tune throat / character resonance
      const formant = ctx.createBiquadFilter();
      formant.type = 'peaking';
      formant.frequency.value = 1500;
      formant.Q.value = 0.7;
      formant.gain.value = 0;

      // 5. Treble / High Shelf Filter (3800 Hz) for crisp air, sparkle, and squeakiness
      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 3800;
      treble.gain.value = trebleGain;

      // 6. Dynamics Compressor for tight, clean, punchy vocal delivery without distortion
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.003;
      comp.release.value = 0.25;

      // 7. Master Gain Node (Volume boost slider, up to 200%)
      const gain = ctx.createGain();
      gain.gain.value = volume;

      // 8. Analyser Node for Visualizer and Lip-sync
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.55;

      // 9. MediaStreamDestination for recording audio directly into video
      const streamDest = ctx.createMediaStreamDestination();

      audioCtxRef.current = ctx;
      lowCutFilterRef.current = lowCut;
      bassFilterRef.current = bass;
      midFilterRef.current = mid;
      formantFilterRef.current = formant;
      trebleFilterRef.current = treble;
      compressorRef.current = comp;
      masterGainRef.current = gain;
      analyserNodeRef.current = analyser;
      mediaStreamDestRef.current = streamDest;

      if (audioRef.current && !audioSourceNodeRef.current) {
        try {
          const source = ctx.createMediaElementSource(audioRef.current);
          // Complete Studio Signal Chain:
          // source -> lowCut -> bass -> mid -> formant -> treble -> compressor -> gain -> analyser -> [speakers, streamDest]
          source.connect(lowCut);
          lowCut.connect(bass);
          bass.connect(mid);
          mid.connect(formant);
          formant.connect(treble);
          treble.connect(comp);
          comp.connect(gain);
          gain.connect(analyser);

          analyser.connect(ctx.destination);
          analyser.connect(streamDest);

          audioSourceNodeRef.current = source;
        } catch (e) {
          console.warn('Audio node connection notice:', e);
        }
      }
    }

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    return analyserNodeRef.current;
  }, [bassGain, midGain, trebleGain, volume]);

  // Setup HTML5 Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    // Essential for pitch shifting
    (audio as any).preservesPitch = false;
    (audio as any).mozPreservesPitch = false;
    (audio as any).webkitPreservesPitch = false;
    audioRef.current = audio;

    audio.onplay = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setStatusMessage('ऑडियो चल रहा है और Lip-Sync चालू है...');
      setStatusType('ok');
    };

    audio.onpause = () => {
      if (audio.currentTime > 0 && !audio.ended) {
        setIsPaused(true);
        setIsSpeaking(false);
        setStatusMessage('ऑडियो Pause किया गया।');
        setStatusType('info');
      }
    };

    audio.onended = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentTime(0);
      setStatusMessage('ऑडियो पूरा हुआ। (Completed)');
      setStatusType('ok');

      if (isRecordingRef.current) {
        stopRecording();
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
      setStatusMessage('ऑडियो फ़ाइल लोड करने में समस्या आई।');
      setStatusType('err');

      if (isRecordingRef.current) {
        stopRecording();
      }
    };

    return () => {
      audio.pause();
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts (H for panel, F for fullscreen, Space for play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.tagName === 'TEXTAREA');

      if (!isInput) {
        if (e.key === 'h' || e.key === 'H') {
          setPanelHidden((prev) => !prev);
        } else if (e.key === 'f' || e.key === 'F') {
          handleToggleFullscreen();
        } else if (e.key === ' ') {
          e.preventDefault();
          if (isSpeaking && !isPaused) {
            handlePause();
          } else if (isPaused || (!isSpeaking && hasAudio)) {
            handlePlay();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpeaking, isPaused, hasAudio]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Upload custom voice audio file
  const handleUploadFile = (file: File) => {
    handleStop();
    ensureAudioContext();

    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    currentBlobUrlRef.current = url;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`;

    if (audioRef.current) {
      audioRef.current.src = url;
      applyPitchAndSpeed(pitchSemitones, speed);

      audioRef.current.onloadedmetadata = () => {
        const dur = audioRef.current?.duration || 0;
        setDuration(dur);
        setAudioInfo({
          name: file.name,
          sizeFormatted: sizeStr,
          duration: dur,
        });
      };
    }

    setHasAudio(true);
    setStatusMessage(`ऑडियो लोड हुआ: "${file.name}"। टोन चुनें और चलाएँ।`);
    setStatusType('ok');
  };

  // Load sample demo voice audio
  const handleLoadSampleAudio = () => {
    handleStop();
    ensureAudioContext();

    const sampleWav = synthesizeFallbackSpeechWav(
      'नमस्ते दोस्तों! Everything at a Glance में आपका स्वागत है। आप अपनी आवाज़ की टोन बदलकर तोता या बच्चा बना सकते हैं।',
      'female',
      1.0
    );

    const blob = new Blob([sampleWav as any], { type: 'audio/wav' });

    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
    }

    const url = URL.createObjectURL(blob);
    currentBlobUrlRef.current = url;

    if (audioRef.current) {
      audioRef.current.src = url;
      applyPitchAndSpeed(pitchSemitones, speed);

      audioRef.current.onloadedmetadata = () => {
        const dur = audioRef.current?.duration || 0;
        setDuration(dur);
        setAudioInfo({
          name: 'Demo-Voice.wav',
          sizeFormatted: `${Math.round(blob.size / 1024)} KB`,
          duration: dur,
        });
      };
    }

    setHasAudio(true);
    setStatusMessage('डेमो आवाज़ लोड हो गई है। तोता, बच्चा या बुजुर्ग मोड चुनकर देखें!');
    setStatusType('ok');
  };

  // Remove audio
  const handleRemoveAudio = () => {
    handleStop();
    if (audioRef.current) {
      audioRef.current.src = '';
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    setAudioInfo(null);
    setHasAudio(false);
    setCurrentTime(0);
    setDuration(0);
    setStatusMessage('ऑडियो हटा दिया गया।');
    setStatusType('info');
  };

  // Select Voice Effect Preset (Parrot, Chipmunk, Giant, Child, Elder, Studio, Robot, Original)
  const handleSelectPreset = (presetId: string) => {
    const preset =
      VOICE_EFFECT_PRESETS.find((p) => p.id === presetId) || VOICE_EFFECT_PRESETS[0];

    setActivePresetId(preset.id);
    setPitchSemitones(preset.pitchSemitones);
    setBassGain(preset.bassGain);
    setMidGain(preset.midGain);
    setTrebleGain(preset.trebleGain);

    ensureAudioContext();

    // Apply pitch and speed
    applyPitchAndSpeed(preset.pitchSemitones, speed);

    if (audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (lowCutFilterRef.current) {
        lowCutFilterRef.current.frequency.setTargetAtTime(preset.lowCutFreq, now, 0.05);
      }
      if (bassFilterRef.current) {
        bassFilterRef.current.gain.setTargetAtTime(preset.bassGain, now, 0.05);
      }
      if (midFilterRef.current) {
        midFilterRef.current.gain.setTargetAtTime(preset.midGain, now, 0.05);
      }
      if (formantFilterRef.current) {
        formantFilterRef.current.frequency.setTargetAtTime(preset.formantFreq, now, 0.05);
        formantFilterRef.current.Q.setTargetAtTime(preset.formantQ, now, 0.05);
        const gainVal = preset.id === 'original' ? 0 : preset.id === 'parrot' ? 6 : preset.id === 'chipmunk' ? 8 : preset.id === 'giant' ? 5 : 3;
        formantFilterRef.current.gain.setTargetAtTime(gainVal, now, 0.05);
      }
      if (trebleFilterRef.current) {
        trebleFilterRef.current.gain.setTargetAtTime(preset.trebleGain, now, 0.05);
      }
    }

    setStatusMessage(`आवाज़ का मोड: ${preset.hindiName} ${preset.icon} (${formatSemitones(preset.pitchSemitones)})`);
    setStatusType('ok');
  };

  // Manual Pitch Slider Change (-24 to +24 st)
  const handleChangePitch = (val: number) => {
    setPitchSemitones(val);
    setActivePresetId('custom');
    ensureAudioContext();
    applyPitchAndSpeed(val, speed);
  };

  // Manual Bass Gain Change (-12 to +15 dB)
  const handleChangeBass = (val: number) => {
    setBassGain(val);
    setActivePresetId('custom');
    ensureAudioContext();
    if (bassFilterRef.current && audioCtxRef.current) {
      bassFilterRef.current.gain.setTargetAtTime(val, audioCtxRef.current.currentTime, 0.05);
    }
  };

  // Manual Mid Gain Change (-10 to +10 dB)
  const handleChangeMid = (val: number) => {
    setMidGain(val);
    setActivePresetId('custom');
    ensureAudioContext();
    if (midFilterRef.current && audioCtxRef.current) {
      midFilterRef.current.gain.setTargetAtTime(val, audioCtxRef.current.currentTime, 0.05);
    }
  };

  // Manual Treble Gain Change (-15 to +15 dB)
  const handleChangeTreble = (val: number) => {
    setTrebleGain(val);
    setActivePresetId('custom');
    ensureAudioContext();
    if (trebleFilterRef.current && audioCtxRef.current) {
      trebleFilterRef.current.gain.setTargetAtTime(val, audioCtxRef.current.currentTime, 0.05);
    }
  };

  // Manual Volume Slider Change (0 to 2.0x / 200%)
  const handleChangeVolume = (val: number) => {
    setVolume(val);
    ensureAudioContext();
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(val, audioCtxRef.current.currentTime, 0.05);
    }
  };

  // Reset All Audio Effects to pristine defaults
  const handleResetEffects = () => {
    handleSelectPreset('original');
    setSpeed(1.0);
    setVolume(1.0);
    applyPitchAndSpeed(0, 1.0);
    setStatusMessage('सभी ऑडियो इफ़ेक्ट सामान्य (Reset) कर दिए गए हैं।');
    setStatusType('info');
  };

  // Play audio
  const handlePlay = async () => {
    if (!hasAudio || !audioRef.current) {
      setStatusMessage('कृपया पहले अपनी ऑडियो फ़ाइल अपलोड करें।');
      setStatusType('warn');
      return;
    }

    ensureAudioContext();
    applyPitchAndSpeed(pitchSemitones, speed);

    try {
      await audioRef.current.play();
      setStatusMessage(`ऑडियो चल रहा है (${formatSemitones(pitchSemitones)}) व Lip-Sync चालू है...`);
      setStatusType('ok');
    } catch (err: any) {
      console.error('Play error:', err);
      setStatusMessage('ऑडियो चलाने में त्रुटि। कृपया पुनः प्रयास करें।');
      setStatusType('err');
    }
  };

  const handlePause = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  };

  const handleResume = () => {
    ensureAudioContext();
    if (audioRef.current && audioRef.current.paused) {
      applyPitchAndSpeed(pitchSemitones, speed);
      audioRef.current.play().catch(() => {});
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (isRecording) {
      stopRecording();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentTime(0);
    setStatusMessage('ऑडियो रोक दिया गया। (Stopped)');
    setStatusType('info');
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Video recording stream capture
  const startRecordingStream = () => {
    const canvas = canvasElementRef.current;
    if (!canvas) {
      setStatusMessage('Canvas not available for recording.');
      setStatusType('err');
      return false;
    }

    ensureAudioContext();

    try {
      const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(60) : null;
      if (!canvasStream) {
        throw new Error('Browser does not support canvas video capture.');
      }

      // Audio track from Web Audio MediaStreamDestination includes the EXACT morphed voice!
      const audioTracks = mediaStreamDestRef.current
        ? mediaStreamDestRef.current.stream.getAudioTracks()
        : [];

      const tracks = [...canvasStream.getVideoTracks(), ...audioTracks];
      const combinedStream = new MediaStream(tracks);

      const mimeType = getSupportedVideoMimeType();
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 4500000,
      });

      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);
        setRecordedVideoUrl(videoUrl);
        setHasRecordedVideo(true);
        setIsRecording(false);
        isRecordingRef.current = false;
        clearInterval(recordingTimerRef.current);

        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const filename = generateVideoFilename(titleText || 'assistant-lipsync', activePresetId, ext);
        triggerVideoDownload(videoBlob, filename);

        setStatusMessage(`Lip-Sync वीडियो (${activePresetId}) रिकॉर्ड होकर गैलरी में सेव हो गया!`);
        setStatusType('ok');
        setPanelHidden(false);
        setIsVideoModalOpen(true);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);

      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);

      return true;
    } catch (err: any) {
      console.error('Error starting video recording:', err);
      setStatusMessage(`Screen recording error: ${err?.message || 'Unsupported browser'}`);
      setStatusType('err');
      return false;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('MediaRecorder stop notice:', e);
      }
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    isRecordingRef.current = false;
  };

  // RECORD AND PLAY: Record video while playing audio with modified pitch and lip-sync
  const handleRecordAndPlay = async () => {
    if (!hasAudio || !audioRef.current) {
      setStatusMessage('कृपया पहले अपनी ऑडियो फ़ाइल अपलोड करें।');
      setStatusType('warn');
      return;
    }

    handleStop();
    ensureAudioContext();

    audioRef.current.currentTime = 0;
    applyPitchAndSpeed(pitchSemitones, speed);

    if (autoHideOnRecord) {
      setPanelHidden(true);
    }

    const started = startRecordingStream();
    if (!started) return;

    try {
      await audioRef.current.play();
      setStatusMessage(`🔴 वीडियो रिकॉर्ड हो रहा है (${activePresetId} voice)...`);
      setStatusType('ok');
    } catch (e) {
      console.error('Audio play error during recording:', e);
      stopRecording();
    }
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050a24] select-none">
      {/* Floating Recording Banner (Visible when panel is hidden during recording) */}
      {isRecording && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-slate-900/95 border border-rose-500/60 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <span className="flex items-center gap-2 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>रिकॉर्ड हो रहा है: {formatSecs(recordingTime)} ({activePresetId})</span>
          </span>
          <button
            onClick={stopRecording}
            className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>रोकें व सेव करें</span>
          </button>
        </div>
      )}

      {/* 2D Canvas Animated Character Orb */}
      <VoiceAssistantOrb
        titleText={titleText}
        background={background}
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        analyserNode={analyserNodeRef.current}
        onTogglePanel={() => setPanelHidden((prev) => !prev)}
        panelHidden={panelHidden}
        onCanvasReady={(canvas) => {
          canvasElementRef.current = canvas;
        }}
      />

      {/* Control Panel UI */}
      <ControlPanel
        hidden={panelHidden}
        onToggleHide={() => setPanelHidden((prev) => !prev)}
        audioInfo={audioInfo}
        onUploadFile={handleUploadFile}
        onLoadSampleAudio={handleLoadSampleAudio}
        onRemoveAudio={handleRemoveAudio}
        speed={speed}
        onChangeSpeed={(s) => {
          setSpeed(s);
          applyPitchAndSpeed(pitchSemitones, s);
        }}
        titleText={titleText}
        onChangeTitleText={(t) => setTitleText(t)}
        background={background}
        onChangeBackground={(b) => setBackground(b)}
        onPlay={handlePlay}
        onStop={handleStop}
        onPause={handlePause}
        onResume={handleResume}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        hasAudio={hasAudio}
        statusMessage={statusMessage}
        statusType={statusType}
        analyserNode={analyserNodeRef.current}
        currentTime={currentTime}
        duration={duration}
        onSeekTime={handleSeek}
        isRecording={isRecording}
        recordingTime={recordingTime}
        onRecordAndPlay={handleRecordAndPlay}
        onStopRecording={stopRecording}
        hasRecordedVideo={hasRecordedVideo}
        onOpenVideoModal={() => setIsVideoModalOpen(true)}
        autoHideOnRecord={autoHideOnRecord}
        onToggleAutoHideOnRecord={(val) => setAutoHideOnRecord(val)}
        // Voice Morphing & Studio EQ Props
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        pitchSemitones={pitchSemitones}
        onChangePitch={handleChangePitch}
        bassGain={bassGain}
        onChangeBass={handleChangeBass}
        midGain={midGain}
        onChangeMid={handleChangeMid}
        trebleGain={trebleGain}
        onChangeTreble={handleChangeTreble}
        volume={volume}
        onChangeVolume={handleChangeVolume}
        onResetEffects={handleResetEffects}
      />

      {/* Video Preview & Save Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={recordedVideoUrl}
        onDownload={() => {
          if (recordedVideoUrl) {
            const a = document.createElement('a');
            a.href = recordedVideoUrl;
            a.download = generateVideoFilename(titleText || 'assistant-lipsync', activePresetId, 'webm');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }}
      />
    </main>
  );
}
