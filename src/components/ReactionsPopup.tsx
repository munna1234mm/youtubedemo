import React from 'react';
import { ReactionType } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface ReactionsPopupProps {
  onSelectReaction: (type: ReactionType) => void;
  onClose?: () => void;
}

export const REACTIONS_DATA: { type: ReactionType; label: string; emoji: string; color: string }[] = [
  { type: 'like', label: 'Like', emoji: '👍', color: 'text-sky-400' },
  { type: 'love', label: 'Love', emoji: '❤️', color: 'text-rose-500' },
  { type: 'star', label: 'Star', emoji: '⭐', color: 'text-yellow-400' },
  { type: 'haha', label: 'Haha', emoji: '😆', color: 'text-amber-400' },
  { type: 'wow', label: 'Wow', emoji: '😮', color: 'text-amber-300' },
  { type: 'sad', label: 'Sad', emoji: '😢', color: 'text-yellow-500' },
  { type: 'angry', label: 'Angry', emoji: '😡', color: 'text-orange-500' },
];

export const ReactionsPopup: React.FC<ReactionsPopupProps> = ({ onSelectReaction, onClose }) => {
  return (
    <div className="absolute -top-12 left-0 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full px-2 py-1 shadow-2xl flex items-center gap-1.5 animate-in fade-in zoom-in-90 duration-150">
      {REACTIONS_DATA.map((item) => (
        <button
          key={item.type}
          onClick={(e) => {
            e.stopPropagation();
            triggerHaptic('medium');
            onSelectReaction(item.type);
            if (onClose) onClose();
          }}
          className="group relative p-1 text-xl hover:scale-135 active:scale-95 transition transform duration-150 flex flex-col items-center cursor-pointer"
          title={item.label}
        >
          <span className="drop-shadow">{item.emoji}</span>
          <span className="absolute -top-6 px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap border border-slate-700 shadow">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};
