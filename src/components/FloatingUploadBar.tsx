import React from 'react';
import { X, Check, Film, UploadCloud, ChevronUp, ChevronDown } from 'lucide-react';

export interface UploadTask {
  id: string;
  title: string;
  target: 'reels' | 'stories' | 'post';
  progress: number;
  previewUrl: string;
  status: 'uploading' | 'processing' | 'done' | 'error';
  statusText: string;
}

interface FloatingUploadBarProps {
  task: UploadTask | null;
  onDismiss: () => void;
}

export const FloatingUploadBar: React.FC<FloatingUploadBarProps> = ({ task, onDismiss }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!task) return null;

  const isDone = task.status === 'done';
  const isError = task.status === 'error';

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 rounded-2xl shadow-2xl p-3 text-white overflow-hidden ring-1 ring-sky-500/20">
        
        {/* Main Bar Row */}
        <div className="flex items-center gap-3">
          
          {/* Thumbnail preview */}
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-black shrink-0 border border-slate-700">
            {task.previewUrl ? (
              <video src={task.previewUrl} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <Film className="w-5 h-5 text-sky-400" />
              </div>
            )}
            {!isDone && !isError && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-[10px] font-extrabold text-sky-300">{task.progress}%</span>
              </div>
            )}
          </div>

          {/* Title & Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white truncate">{task.title || 'Video Upload'}</p>
              <span className="text-[10px] font-semibold text-sky-400 capitalize">
                {isDone ? 'Published 🎉' : isError ? 'Error ⚠️' : `${task.progress}%`}
              </span>
            </div>
            
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              {task.statusText} · {task.target === 'reels' ? '🎬 Reel' : task.target === 'stories' ? '⏱️ Story' : '📝 Post'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {isDone && (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={onDismiss}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Animated Progress Bar */}
        {!isDone && !isError && (
          <div className="mt-2.5 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}

      </div>
    </div>
  );
};
