import React, { useState } from 'react';
import { 
  Edit3, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Settings, 
  Grid, 
  Bookmark, 
  Share2, 
  Camera, 
  Check, 
  Store, 
  HelpCircle, 
  Moon, 
  Smartphone,
  UploadCloud,
  Film
} from 'lucide-react';
import { User, Post, TabType } from '../types';
import { triggerHaptic, fireConfetti, shareToTelegram } from '../utils/telegram';
import { PostCard } from './PostCard';

interface ProfileViewProps {
  currentUser: User;
  posts: Post[];
  savedPosts: Post[];
  onUpdateBio: (bio: string) => void;
  onOpenStarsModal: () => void;
  onOpenVideoStorage?: () => void;
  onReact: (postId: string, reaction: any) => void;
  onOpenComments: (postId: string) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onTipStars: (amount: number, recipientName: string) => void;
  onToggleSave: (postId: string) => void;
  isFrameMode: boolean;
  setIsFrameMode: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  posts,
  savedPosts,
  onUpdateBio,
  onOpenStarsModal,
  onOpenVideoStorage,
  onReact,
  onOpenComments,
  onVotePoll,
  onTipStars,
  onToggleSave,
  isFrameMode,
  setIsFrameMode,
}) => {
  const [profileTab, setProfileTab] = useState<'posts' | 'reels' | 'photos' | 'saved' | 'settings'>('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(currentUser.bio || '');

  const userPosts = posts.filter((p) => p.author.id === currentUser.id);

  const samplePhotos = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80',
  ];

  const handleSaveBio = () => {
    triggerHaptic('success');
    onUpdateBio(bioInput);
    setIsEditingBio(false);
  };

  const handleShareProfile = () => {
    triggerHaptic('medium');
    shareToTelegram(
      window.location.href,
      `Check out ${currentUser.name}'s profile on TeleBook!\n@${currentUser.username}`
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      
      {/* Cover & Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 overflow-hidden">
          {currentUser.coverImage ? (
            <img
              src={currentUser.coverImage}
              alt="cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              Cover Image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        </div>

        {/* User Info Bar */}
        <div className="px-5 pb-5 relative">
          
          {/* Avatar Floating */}
          <div className="-mt-14 sm:-mt-16 mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="relative inline-block">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-slate-900 shadow-2xl bg-slate-800 ring-2 ring-sky-500/40"
              />
              {currentUser.isPremium && (
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center border-2 border-slate-900 shadow">
                  ★
                </span>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {onOpenVideoStorage && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onOpenVideoStorage();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
                >
                  <Film className="w-4 h-4" />
                  <span>Upload Reel</span>
                </button>
              )}

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenStarsModal();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
              >
                <Sparkles className="w-4 h-4 fill-yellow-200" />
                <span>{currentUser.starsCount} Stars Balance</span>
              </button>

              <button
                onClick={handleShareProfile}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>

          {/* Name & Handle */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-['Outfit']">{currentUser.name}</h1>
              {currentUser.isVerified && (
                <span className="w-4 h-4 rounded-full bg-sky-500 text-[10px] text-white flex items-center justify-center font-bold">
                  ✓
                </span>
              )}
            </div>
            <span className="text-xs text-sky-400 font-semibold">@{currentUser.username}</span>
          </div>

          {/* Bio */}
          <div className="mt-2.5">
            {isEditingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBio}
                    className="px-3 py-1 bg-sky-500 text-white text-xs font-bold rounded-lg hover:bg-sky-400"
                  >
                    Save Bio
                  </button>
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className="px-3 py-1 bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentUser.bio || 'Add a bio to tell others about yourself...'}
                </p>
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="text-xs text-sky-400 hover:underline ml-2 shrink-0 flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>

          {/* Social Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-white block">{currentUser.friendsCount}</span>
              <span className="text-[10px] text-slate-400">Mutual Friends</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-white block">{currentUser.followersCount}</span>
              <span className="text-[10px] text-slate-400">Followers</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-white block">{currentUser.followingCount}</span>
              <span className="text-[10px] text-slate-400">Following</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-amber-300 block">⭐ {currentUser.starsCount}</span>
              <span className="text-[10px] text-slate-400">TG Stars Earned</span>
            </div>
          </div>

        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-md">
        {[
          { id: 'posts' as const, label: 'My Posts', icon: Grid },
          { id: 'reels' as const, label: 'Reels', icon: Film },
          { id: 'photos' as const, label: 'Photos', icon: Camera },
          { id: 'saved' as const, label: 'Saved', icon: Bookmark },
          { id: 'settings' as const, label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = profileTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection');
                setProfileTab(tab.id);
              }}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-semibold flex flex-col items-center justify-center gap-1 transition ${
                isActive
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {profileTab === 'posts' && (
        <div className="space-y-3.5">
          {userPosts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-300">No posts yet</p>
              <p className="text-xs text-slate-500 mt-1">Share your first update on the Home feed!</p>
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onReact={onReact}
                onOpenComments={onOpenComments}
                onVotePoll={onVotePoll}
                onTipStars={onTipStars}
                onToggleSave={onToggleSave}
              />
            ))
          )}
        </div>
      )}

      {profileTab === 'reels' && (
        <div className="space-y-3">
          {/* Creator Analytics Summary Banner */}
          <div className="bg-gradient-to-r from-sky-950/80 via-indigo-950/60 to-slate-900 border border-sky-500/30 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Creator Reach & Video Analytics
              </span>
              <button
                onClick={onOpenVideoStorage}
                className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload New Reel</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-base font-extrabold text-white block">12.4K</span>
                <span className="text-[10px] text-slate-400 font-medium">👁️ Total Views</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-base font-extrabold text-rose-400 block">3.8K</span>
                <span className="text-[10px] text-slate-400 font-medium">❤️ Total Likes</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-base font-extrabold text-amber-300 block">94.2%</span>
                <span className="text-[10px] text-slate-400 font-medium">📈 Reach Rate</span>
              </div>
            </div>
          </div>

          {/* Sample creator reels list */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                title: 'Ocean Sunset Vibe 🌅',
                views: '4.8K',
                likes: '1.2K',
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
              },
              {
                title: 'Coding Telegram MiniApp 💻',
                views: '5.2K',
                likes: '1.8K',
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-computer-1606-large.mp4',
              },
              {
                title: 'Tokyo Night Drive 🚗',
                views: '2.4K',
                likes: '840',
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42861-large.mp4',
              },
            ].map((reel, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 group shadow-md aspect-[9/14]">
                <video src={reel.videoUrl} className="w-full h-full object-cover" muted playsInline />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
                <div className="absolute bottom-2.5 inset-x-2.5 space-y-1">
                  <p className="text-xs font-bold text-white line-clamp-1">{reel.title}</p>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-300">
                    <span>👁️ {reel.views} views</span>
                    <span className="text-rose-400">❤️ {reel.likes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profileTab === 'photos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <h3 className="text-sm font-bold text-white mb-3">Photos & Media Gallery</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {samplePhotos.map((photo, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden h-36 bg-slate-800 group">
                <img
                  src={photo}
                  alt="gallery"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {profileTab === 'saved' && (
        <div className="space-y-3.5">
          {savedPosts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <Bookmark className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No saved posts yet</p>
              <p className="text-xs text-slate-500 mt-1">Save interesting articles, reels, or discussions to revisit later.</p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onReact={onReact}
                onOpenComments={onOpenComments}
                onVotePoll={onVotePoll}
                onTipStars={onTipStars}
                onToggleSave={onToggleSave}
              />
            ))
          )}
        </div>
      )}

      {profileTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-white mb-2">Telegram Mini App Preferences</h3>

          {/* Toggle Device Frame */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-sky-400" />
              <div>
                <span className="text-xs font-bold text-white block">Telegram Container Frame</span>
                <span className="text-[11px] text-slate-400">Simulate Telegram mobile chat shell</span>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsFrameMode((prev: boolean) => !prev);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                isFrameMode ? 'bg-sky-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  isFrameMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Cloud Video Storage Manager */}
          {onOpenVideoStorage && (
            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-transparent rounded-2xl border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  Google Drive & Cloud Video Hub
                </span>
                <button
                  onClick={onOpenVideoStorage}
                  className="text-xs text-emerald-400 font-bold hover:underline"
                >
                  Manage Videos →
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your Google Drive account or Google Cloud Storage to store and stream high-definition reels, stories, and feed videos.
              </p>
            </div>
          )}

          {/* Telegram Stars Wallet Information */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent rounded-2xl border border-yellow-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 fill-yellow-400" />
                Telegram Stars & TON Ecosystem
              </span>
              <button
                onClick={onOpenStarsModal}
                className="text-xs text-yellow-400 font-bold hover:underline"
              >
                Manage Wallet →
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Telegram Stars enable peer-to-peer creator tips, marketplace purchases, and digital collectibles with zero blockchain friction.
            </p>
          </div>

          {/* App Info */}
          <div className="pt-2 text-center text-xs text-slate-500">
            <span>TeleBook v1.0.0 • Built for Telegram WebApp SDK</span>
          </div>
        </div>
      )}

    </div>
  );
};
