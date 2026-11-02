/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Download, Film, CheckCircle, Play, RotateCcw } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  onDownload: () => void;
  duration?: number;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  onDownload,
  duration,
}) => {
  if (!isOpen || !videoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-sky-400/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-sky-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-sky-500/20">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm text-sky-200">
              रिकॉर्डेड Lip-Sync वीडियो (Recorded Video Preview)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <video
            src={videoUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Information & Action Footer */}
        <div className="p-4 flex flex-col gap-3 bg-slate-950/50">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-emerald-300">
                वीडियो सफलतापूर्वक तैयार हो गया है!
              </span>
              <span className="text-slate-300 text-[11px]">
                आपकी आवाज़ और Lip-Sync मूवमेंट दोनों इस वीडियो में सिंक हैं। इसे अपने किसी भी वीडियो में क्लिप की तरह इस्तेमाल कर सकते हैं।
              </span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onDownload}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>गैलरी में सेव करें (Download Video)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-sky-400/30 text-sky-200 text-xs font-semibold transition-all cursor-pointer"
            >
              बंद करें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
