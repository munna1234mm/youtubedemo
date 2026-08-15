import React from 'react';
import { MoreVertical, X, Sparkles, Send, ShieldCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface TelegramFrameWrapperProps {
  children: React.ReactNode;
  isFrameMode: boolean;
  onCloseApp?: () => void;
}

export const TelegramFrameWrapper: React.FC<TelegramFrameWrapperProps> = ({
  children,
  isFrameMode,
  onCloseApp,
}) => {
  if (!isFrameMode) {
    return <div className="min-h-screen bg-slate-950 text-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 py-4 sm:py-8 px-2 sm:px-4 flex items-center justify-center">
      {/* Smartphone frame container */}
      <div className="w-full max-w-[430px] h-[92vh] max-h-[920px] bg-slate-900 rounded-[44px] border-[8px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative ring-1 ring-white/10">
        
        {/* Dynamic Island / Speaker notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-50 pointer-events-none flex items-center justify-end pr-2">
          <div className="w-2 h-2 rounded-full bg-slate-800" />
        </div>

        {/* Telegram App Native Header Bar */}
        <div className="pt-7 pb-2 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-40 select-none">
          <button
            onClick={() => {
              triggerHaptic('light');
              if (onCloseApp) onCloseApp();
            }}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              TeleBook Bot
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            </span>
            <span className="text-[10px] text-slate-400">Mini App</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <button
              onClick={() => triggerHaptic('light')}
              className="p-1 hover:text-white"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mini App Content Screen */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col bg-slate-950">
          {children}
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="py-2 flex justify-center bg-slate-900 shrink-0 select-none">
          <div className="w-32 h-1 bg-slate-700 rounded-full" />
        </div>

      </div>
    </div>
  );
};
