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
  Film,
  ArrowLeft,
  MessageCircle,
  Plus,
  LogOut
} from 'lucide-react';
import { User, Post, TabType } from '../types';
import { triggerHaptic, fireConfetti, shareToTelegram } from '../utils/telegram';
import { PostCard } from './PostCard';

interface ProfileViewProps {
  currentUser: User;
  viewedUser?: User | null;
  onBackToMyProfile?: () => void;
  onOpenChat?: (user: User) => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
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
  viewedUser,
  onBackToMyProfile,
  onOpenChat,
  onOpenAuthModal,
  onLogout,
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
  const [isFollowing, setIsFollowing] = useState(false);

  // Active target user: viewedUser if specified, otherwise currentUser
  const targetUser: User = viewedUser || currentUser;
  const isOwnProfile = !viewedUser || viewedUser.id === currentUser.id;

  // STRICTLY filter posts belonging ONLY to target user by id or username
  const userPosts = posts.filter(
    (p) =>
      (p.author?.id && targetUser.id && p.author.id === targetUser.id) ||
      (p.author?.username && targetUser.username && p.author.username === targetUser.username)
  );

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
      `Check out ${targetUser.name}'s profile on TeleBook!\n@${targetUser.username}`
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      
      {/* Back button if viewing another user */}
      {!isOwnProfile && onBackToMyProfile && (
        <button
          onClick={onBackToMyProfile}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-sky-400 text-xs font-bold rounded-2xl transition shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Profile</span>
        </button>
      )}

      {/* Cover & Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 overflow-hidden">
          {targetUser.coverImage ? (
            <img
              src={targetUser.coverImage}
              alt="cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 font-semibold text-xs">
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
                src={targetUser.avatar}
                alt={targetUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-slate-900 shadow-2xl bg-slate-800 ring-2 ring-sky-500/40"
              />
              {targetUser.isPremium && (
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center border-2 border-slate-900 shadow">
                  ★
                </span>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOwnProfile ? (
                <>
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
                    <span>{targetUser.starsCount} Stars Balance</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Other User Profile Actions */}
                  <button
                    onClick={() => {
                      triggerHaptic('success');
                      setIsFollowing(!isFollowing);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow transition ${
                      isFollowing
                        ? 'bg-emerald-500 text-white'
                        : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                    }`}
                  >
                    {isFollowing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>

                  {onOpenChat && (
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        onOpenChat(targetUser);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      triggerHaptic('heavy');
                      onTipStars(50, targetUser.name);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
                  >
                    <Sparkles className="w-4 h-4 fill-yellow-200" />
                    <span>Tip Stars</span>
                  </button>
                </>
              )}

              <button
                onClick={handleShareProfile}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Name & Handle */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-['Outfit']">{targetUser.name}</h1>
              {targetUser.isVerified && (
                <span className="w-4 h-4 rounded-full bg-sky-500 text-[10px] text-white flex items-center justify-center font-bold">
                  ✓
                </span>
              )}
            </div>
            <span className="text-xs text-sky-400 font-semibold">@{targetUser.username}</span>
          </div>

          {/* Bio */}
          <div className="mt-2.5">
            {isEditingBio && isOwnProfile ? (
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
                  {targetUser.bio || (isOwnProfile ? 'Add a bio to tell others about yourself...' : 'No bio added yet.')}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="text-xs text-sky-400 hover:underline ml-2 shrink-0 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Social Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-white block">{targetUser.friendsCount}</span>
              <span className="text-[10px] text-slate-400">Mutual Friends</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-white block">{targetUser.followersCount}</span>
              <span className="text-[10px] text-slate-400">Followers</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-white block">{targetUser.followingCount}</span>
              <span className="text-[10px] text-slate-400">Following</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-amber-300 block">⭐ {targetUser.starsCount}</span>
              <span className="text-[10px] text-slate-400">TG Stars</span>
            </div>
          </div>

        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-md">
        {[
          { id: 'posts' as const, label: isOwnProfile ? 'My Posts' : 'Posts', icon: Grid },
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

      {/* Tab: Posts */}
      {profileTab === 'posts' && (
        <div className="space-y-3.5">
          {userPosts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-300">No posts yet</p>
              <p className="text-xs text-slate-500 mt-1">
                {isOwnProfile
                  ? 'Share your first update on the Home feed!'
                  : `${targetUser.name} hasn't posted anything yet.`}
              </p>
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

      {/* Tab: Reels */}
      {profileTab === 'reels' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-sky-950/80 via-indigo-950/60 to-slate-900 border border-sky-500/30 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Video Analytics & Reach
              </span>
              {isOwnProfile && onOpenVideoStorage && (
                <button
                  onClick={onOpenVideoStorage}
                  className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Reel</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-base font-extrabold text-white block">12.4K</span>
                <span className="text-[10px] text-slate-400 font-medium">👁️ Views</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-base font-extrabold text-rose-400 block">3.8K</span>
                <span className="text-[10px] text-slate-400 font-medium">❤️ Likes</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-base font-extrabold text-amber-300 block">94.2%</span>
                <span className="text-[10px] text-slate-400 font-medium">📈 Reach</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Photos */}
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

      {/* Tab: Saved */}
      {profileTab === 'saved' && (
        <div className="space-y-3.5">
          {savedPosts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <Bookmark className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">No saved posts yet</p>
              <p className="text-xs text-slate-500 mt-1">Save interesting posts to revisit later.</p>
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

      {/* Tab: Settings */}
      {profileTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-white">App & Profile Settings</h3>
          <div className="space-y-2">
            {onOpenAuthModal && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenAuthModal();
                }}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-sky-500/20 to-blue-500/20 rounded-xl border border-sky-500/40 text-left hover:brightness-110 transition"
              >
                <div className="flex items-center gap-2.5 text-xs text-sky-300 font-bold">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Switch Account / Sign In as Another User</span>
                </div>
                <span className="text-[11px] font-bold text-sky-400">Login ➔</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={() => {
                  triggerHaptic('warning');
                  onLogout();
                }}
                className="w-full flex items-center justify-between p-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 text-left transition"
              >
                <div className="flex items-center gap-2.5 text-xs text-rose-400 font-bold">
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Log Out of Account</span>
                </div>
                <span className="text-[11px] font-bold text-rose-400">Exit ➔</span>
              </button>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <Moon className="w-4 h-4 text-sky-400" />
                <span>Dark Theme (Always On)</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-400">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>TeleBook Support & Help</span>
              </div>
              <span className="text-xs text-slate-400">v2.4.0</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
