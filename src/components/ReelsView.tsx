import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Music2,
  Plus,
  Check,
  UploadCloud,
  RefreshCw,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Reel, User } from '../types';
import { triggerHaptic, fireConfetti, shareToTelegram } from '../utils/telegram';

interface ReelsViewProps {
  reels: Reel[];
  currentUser: User;
  onOpenComments: (reelId: string) => void;
  onTipStars: (amount: number, recipientName: string) => void;
  onOpenVideoStorage?: () => void;
}

interface ServerVideo {
  id: string;
  title: string;
  url: string;
  size: number;
  uploadedAt: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  authorUsername?: string;
}

const serverVideoToReel = (v: ServerVideo): Reel => ({
  id: v.id,
  author: {
    id: v.authorId || 'user_anon',
    name: v.authorName || 'TeleBook User',
    username: v.authorUsername || 'teleuser',
    avatar: v.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    starsCount: 150,
    followersCount: 1200,
    followingCount: 340,
    friendsCount: 45,
  },
  videoUrl: v.url,
  thumbnailUrl: v.authorAvatar || '',
  caption: v.title || 'New Reel',
  audioName: `Original Audio · ${v.authorName || 'TeleBook Creator'}`,
  likesCount: 124,
  commentsCount: 18,
  sharesCount: 9,
  isLiked: false,
});

export const ReelsView: React.FC<ReelsViewProps> = ({
  reels,
  currentUser,
  onOpenComments,
  onTipStars,
  onOpenVideoStorage,
}) => {
  const [allReels, setAllReels] = useState<Reel[]>(reels);
  const [fetching, setFetching] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedReels, setLikedReels] = useState<{ [id: string]: boolean }>({ reel_1: true });
  const [followingCreators, setFollowingCreators] = useState<{ [id: string]: boolean }>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isScrollingRef = useRef(false);

  const fetchAndMerge = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        const serverReels: Reel[] = (data.videos || []).map(serverVideoToReel);
        const serverIds = new Set(serverReels.map((r) => r.id));
        const localOnly = reels.filter((r) => !serverIds.has(r.id));
        setAllReels([...serverReels, ...localOnly]);
      } else {
        setAllReels(reels);
      }
    } catch {
      setAllReels(reels);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAndMerge();
  }, []);

  useEffect(() => {
    setAllReels((prev) => {
      const prevIds = new Set(prev.map((r) => r.id));
      const newLocal = reels.filter((r) => !prevIds.has(r.id));
      if (newLocal.length === 0) return prev;
      return [...newLocal, ...prev];
    });
  }, [reels]);

  const currentReel = allReels[currentIndex] || reels[0];

  const handleNextReel = () => {
    if (currentIndex < allReels.length - 1) {
      triggerHaptic('medium');
      setCurrentIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrevReel = () => {
    if (currentIndex > 0) {
      triggerHaptic('medium');
      setCurrentIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevReel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allReels.length]);

  // Touch Swipe Gesture (TikTok/Instagram Reels)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    touchStartY.current = null;

    if (Math.abs(deltaY) > 40) {
      if (deltaY > 0) {
        // Swiped UP -> Next Reel
        handleNextReel();
      } else {
        // Swiped DOWN -> Prev Reel
        handlePrevReel();
      }
    }
  };

  // Mouse Wheel Scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (isScrollingRef.current) return;
    if (Math.abs(e.deltaY) > 30) {
      isScrollingRef.current = true;
      if (e.deltaY > 0) {
        handleNextReel();
      } else {
        handlePrevReel();
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 400);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleLike = (reelId: string) => {
    const nextState = !likedReels[reelId];
    setLikedReels({ ...likedReels, [reelId]: nextState });
    triggerHaptic('medium');
    if (nextState) fireConfetti();
  };

  const toggleFollow = (creatorId: string) => {
    triggerHaptic('success');
    setFollowingCreators({
      ...followingCreators,
      [creatorId]: !followingCreators[creatorId],
    });
  };

  const handleShareReel = (reel: Reel) => {
    triggerHaptic('medium');
    shareToTelegram(
      window.location.href,
      `Watch this Reel by ${reel.author.name} on TeleBook:\n"${reel.caption}"`
    );
  };

  if (!currentReel) {
    return (
      <div className="w-full max-w-lg mx-auto h-[calc(100vh-120px)] bg-slate-950 sm:rounded-3xl flex flex-col items-center justify-center gap-5 border border-slate-800">
        <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center">
          <span className="text-4xl">🎬</span>
        </div>
        <div className="text-center px-6">
          <h3 className="text-lg font-bold text-white mb-1">No Reels Yet</h3>
          <p className="text-sm text-slate-400">Be the first to upload a video reel for everyone to see!</p>
        </div>
        {onOpenVideoStorage && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenVideoStorage();
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-sky-500 text-white font-bold text-sm active:scale-95 transition shadow-lg"
          >
            <UploadCloud className="w-4 h-4" />
            Upload First Reel
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      className="w-full max-w-lg mx-auto h-[calc(100vh-120px)] relative bg-black sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col select-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      
      {/* Video Container */}
      <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
        <video
          ref={videoRef}
          key={currentReel.id}
          src={currentReel.videoUrl}
          poster={currentReel.thumbnailUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover cursor-pointer"
          onClick={togglePlay}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />

        {/* Play/Pause indicator overlay */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-10"
          >
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white shadow-2xl">
              <Play className="w-8 h-8 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white text-xs font-bold shadow">
            <span>Reels</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[10px] text-slate-300 font-mono ml-1">
              {currentIndex + 1}/{allReels.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenVideoStorage && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenVideoStorage();
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 shadow"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Right Floating Action Sidebar */}
        <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-4 text-white">
          
          {/* Creator Avatar & Follow Button */}
          <div className="relative mb-1">
            <img
              src={currentReel.author.avatar}
              alt={currentReel.author.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-sky-400 shadow-lg"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
              }}
            />
            <button
              onClick={() => toggleFollow(currentReel.author.id)}
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow ${
                followingCreators[currentReel.author.id] ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}
            >
              {followingCreators[currentReel.author.id] ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 stroke-[3]" />}
            </button>
          </div>

          {/* Like */}
          <button onClick={() => toggleLike(currentReel.id)} className="flex flex-col items-center group">
            <div className={`p-2.5 rounded-full backdrop-blur-md transition group-active:scale-90 ${
              likedReels[currentReel.id] ? 'bg-rose-500 text-white scale-110' : 'bg-black/40 text-white hover:bg-black/60'
            }`}>
              <Heart className={`w-6 h-6 ${likedReels[currentReel.id] ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[11px] font-bold drop-shadow mt-1">
              {(currentReel.likesCount + (likedReels[currentReel.id] ? 1 : 0)).toLocaleString()}
            </span>
          </button>

          {/* Comments */}
          <button onClick={() => { triggerHaptic('light'); onOpenComments(currentReel.id); }} className="flex flex-col items-center">
            <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white shadow">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold drop-shadow mt-1">{currentReel.commentsCount}</span>
          </button>

          {/* Tip Stars */}
          <button onClick={() => { triggerHaptic('heavy'); onTipStars(50, currentReel.author.name); }} className="flex flex-col items-center">
            <div className="p-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-lg animate-pulse">
              <Sparkles className="w-6 h-6 fill-yellow-200" />
            </div>
            <span className="text-[11px] font-bold text-yellow-300 drop-shadow mt-1">Tip Stars</span>
          </button>

          {/* Share */}
          <button onClick={() => handleShareReel(currentReel)} className="flex flex-col items-center">
            <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white shadow">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold drop-shadow mt-1">{currentReel.sharesCount}</span>
          </button>

          {/* Music disc */}
          <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center animate-spin duration-3000 mt-1 shadow">
            <Music2 className="w-4 h-4 text-sky-400" />
          </div>
        </div>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-4 left-3 right-16 z-20 text-white space-y-1.5">
          <div className="flex items-center gap-2">
            <img 
              src={currentReel.author.avatar} 
              alt={currentReel.author.name} 
              className="w-7 h-7 rounded-full object-cover border border-white/30"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
              }} 
            />
            <span className="font-bold text-sm drop-shadow">@{currentReel.author.username || currentReel.author.name}</span>
            <button
              onClick={() => toggleFollow(currentReel.author.id)}
              className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm shadow"
            >
              {followingCreators[currentReel.author.id] ? 'Following' : 'Follow'}
            </button>
          </div>

          <p className="text-xs text-slate-100 line-clamp-2 leading-relaxed drop-shadow">{currentReel.caption}</p>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
            <Music2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div className="overflow-hidden whitespace-nowrap">
              <span className="inline-block">{currentReel.audioName}</span>
            </div>
          </div>
        </div>

        {/* Floating Swipe Up/Down Navigation Hints */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20 opacity-40 hover:opacity-100 transition">
          {currentIndex > 0 && (
            <button
              onClick={handlePrevReel}
              className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-md"
              title="Previous Reel (Swipe Down / Arrow Up)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {currentIndex < allReels.length - 1 && (
            <button
              onClick={handleNextReel}
              className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-md"
              title="Next Reel (Swipe Up / Arrow Down)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
