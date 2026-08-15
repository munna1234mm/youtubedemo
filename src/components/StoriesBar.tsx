import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Story, User } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface StoriesBarProps {
  stories: Story[];
  currentUser: User;
  onSelectStory: (index: number) => void;
  onAddStory: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  stories,
  currentUser,
  onSelectStory,
  onAddStory,
}) => {
  return (
    <div className="w-full bg-slate-900/60 border-y border-slate-800/80 py-3.5 px-3">
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5 max-w-4xl mx-auto">
        
        {/* Create Story Card */}
        <div
          onClick={() => {
            triggerHaptic('medium');
            onAddStory();
          }}
          className="relative w-28 h-44 rounded-2xl overflow-hidden shrink-0 cursor-pointer bg-slate-800 border border-slate-700/80 hover:border-sky-500/60 transition group shadow-md flex flex-col justify-between"
        >
          {/* User Top Half Avatar/Cover */}
          <div className="h-28 w-full overflow-hidden bg-slate-900">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-90"
              onError={(e) => {
                // fallback if avatar fails
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          {/* Plus Button */}
          <div className="absolute top-24 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-sky-500 border-3 border-slate-800 flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:bg-sky-400 transition">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>

          {/* Bottom Label */}
          <div className="p-2 text-center bg-slate-800">
            <span className="text-[11px] font-bold text-slate-200 line-clamp-1">
              Add Story
            </span>
          </div>
        </div>

        {/* Stories List */}
        {stories.map((story, idx) => {
          const isVideo = story.mediaType === 'video' || story.mediaUrl?.includes('.mp4') || story.mediaUrl?.startsWith('data:video');

          return (
            <div
              key={story.id}
              onClick={() => {
                triggerHaptic('light');
                onSelectStory(idx);
              }}
              className="relative w-28 h-44 rounded-2xl overflow-hidden shrink-0 cursor-pointer bg-gradient-to-br from-slate-800 via-indigo-950/70 to-slate-900 border border-slate-700/70 hover:border-sky-400/80 transition-all duration-200 group shadow-md"
            >
              {/* Story Media Background */}
              {isVideo ? (
                <video
                  src={story.mediaUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-95 pointer-events-none"
                  muted
                  playsInline
                  autoPlay
                  loop
                />
              ) : (
                <img
                  src={story.mediaUrl}
                  alt={story.userName}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300 brightness-95"
                  onError={(e) => {
                    // Graceful fallback to user avatar or gradient background if link broken
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              {/* Dark gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

              {/* User Avatar with gradient border */}
              <div className="absolute top-2.5 left-2.5 z-10">
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-500 shadow-md">
                  <img
                    src={story.userAvatar}
                    alt={story.userName}
                    className="w-8 h-8 rounded-full object-cover border-2 border-slate-900"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
              </div>

              {/* User Name & Time */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                <p className="text-[11px] font-bold text-white line-clamp-2 leading-tight drop-shadow-md">
                  {story.userName}
                </p>
                <span className="text-[9px] text-slate-300/90 font-medium drop-shadow">
                  {story.timestamp}
                </span>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};
