import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Send, 
  Sparkles, 
  Share2, 
  Pause, 
  Play 
} from 'lucide-react';
import { Story, User } from '../types';
import { triggerHaptic, fireConfetti, shareToTelegram } from '../utils/telegram';

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  currentUser: User;
  onClose: () => void;
  onSendStoryReply: (storyId: string, replyText: string) => void;
  onTipStars: (amount: number, recipientName: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex,
  currentUser,
  onClose,
  onSendStoryReply,
  onTipStars,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const currentStory = stories[currentIndex];

  const timerRef = useRef<number | null>(null);
  const STORY_DURATION_MS = 6000;
  const UPDATE_INTERVAL_MS = 50;

  useEffect(() => {
    setProgress(0);
    setIsLiked(Boolean(currentStory?.isLiked));
  }, [currentIndex, currentStory]);

  useEffect(() => {
    if (isPaused) return;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (UPDATE_INTERVAL_MS / STORY_DURATION_MS) * 100;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, UPDATE_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, stories.length]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      triggerHaptic('light');
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      triggerHaptic('light');
    } else {
      setProgress(0);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    triggerHaptic('success');
    onSendStoryReply(currentStory.id, replyText);
    setReplyText('');
  };

  const handleQuickReaction = (emoji: string) => {
    triggerHaptic('medium');
    onSendStoryReply(currentStory.id, emoji);
    fireConfetti();
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    triggerHaptic('medium');
    if (!isLiked) {
      fireConfetti();
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Container simulating mobile story container */}
      <div 
        className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl overflow-hidden bg-slate-900 flex flex-col justify-between shadow-2xl border border-slate-800 select-none"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Background Image / Media */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.userName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>

        {/* Story Header */}
        <div className="relative z-10 p-3.5 space-y-2.5">
          {/* Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((story, i) => (
              <div
                key={story.id}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all ease-linear rounded-full"
                  style={{
                    width:
                      i < currentIndex
                        ? '100%'
                        : i === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* User Info Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={currentStory.userAvatar}
                alt={currentStory.userName}
                className="w-9 h-9 rounded-full object-cover border-2 border-sky-400"
              />
              <div className="text-left leading-tight">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-white drop-shadow">
                    {currentStory.userName}
                  </span>
                  {currentStory.isPremium && (
                    <span className="text-sky-400 text-xs">★</span>
                  )}
                </div>
                <span className="text-[11px] text-white/80 font-medium">
                  {currentStory.timestamp}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 text-white">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tap areas for prev / next */}
        <div className="absolute inset-y-20 inset-x-0 flex z-10">
          <div
            onClick={handlePrev}
            className="w-1/3 h-full cursor-pointer"
            title="Previous Story"
          />
          <div
            onClick={handleNext}
            className="w-2/3 h-full cursor-pointer"
            title="Next Story"
          />
        </div>

        {/* Story Caption & Bottom Actions */}
        <div className="relative z-20 p-4 space-y-3">
          {currentStory.caption && (
            <div className="bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-white text-sm">
              <p>{currentStory.caption}</p>
            </div>
          )}

          {/* Quick Reaction Emojis */}
          <div className="flex items-center justify-around py-1">
            {['❤️', '🔥', '👏', '😂', '😮', '⭐'].map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickReaction(emoji);
                }}
                className="text-xl hover:scale-125 active:scale-95 transition transform bg-black/30 p-1.5 rounded-full border border-white/10"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Reply to ${currentStory.userName.split(' ')[0]}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-black/50 backdrop-blur-md text-white text-sm placeholder-white/60 px-4 py-2.5 rounded-full border border-white/20 focus:outline-none focus:border-sky-400"
            />

            {/* Like story */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              className={`p-2.5 rounded-full backdrop-blur-md border transition ${
                isLiked
                  ? 'bg-rose-500 text-white border-rose-400 scale-110'
                  : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
            </button>

            {/* Tip Stars */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                onTipStars(25, currentStory.userName);
              }}
              className="p-2.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white border border-yellow-300 hover:scale-105 transition shadow-lg flex items-center justify-center"
              title="Tip 25 Telegram Stars"
            >
              <Sparkles className="w-5 h-5 fill-yellow-200" />
            </button>

            {/* Send Reply */}
            {replyText.trim().length > 0 && (
              <button
                type="submit"
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 rounded-full bg-sky-500 text-white border border-sky-400 hover:bg-sky-400 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

      </div>
    </div>
  );
};
