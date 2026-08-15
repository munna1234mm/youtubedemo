import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  MapPin, 
  Calendar, 
  Edit3, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Share2, 
  Bookmark, 
  Grid, 
  Camera, 
  Settings, 
  Moon, 
  HelpCircle,
  Smartphone,
  UploadCloud,
  Film,
  ArrowLeft,
  MessageCircle,
  Plus,
  LogOut,
  Play
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
  onDeletePost?: (postId: string) => void;
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
  onDeletePost,
  isFrameMode,
  setIsFrameMode,
}) => {
  const [profileTab, setProfileTab] = useState<'posts' | 'reels' | 'photos' | 'saved' | 'settings'>('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(currentUser.bio || '');
  const [isFollowing, setIsFollowing] = useState(false);
  const [userReels, setUserReels] = useState<any[]>([]);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  // Active target user
  const targetUser: User = viewedUser || currentUser;
  const isOwnProfile = !viewedUser || viewedUser.id === currentUser.id;

  // STRICTLY filter posts belonging ONLY to target user
  const userPosts = posts.filter(
    (p) =>
      (p.author?.id && targetUser.id && p.author.id === targetUser.id) ||
      (p.author?.username && targetUser.username && p.author.username === targetUser.username)
  );

  // Fetch all videos/reels uploaded by this specific user
  const fetchUserVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        const allVideos = data.videos || [];
        const filtered = allVideos.filter(
          (v: any) =>
            v.authorId === targetUser.id ||
            v.authorUsername === targetUser.username ||
            (isOwnProfile && v.authorName === currentUser.name)
        );
        setUserReels(filtered);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchUserVideos();
  }, [targetUser.id, targetUser.username]);

  // Extract all photos uploaded by this user in their posts
  const userPhotos = userPosts.flatMap((p) => p.images || []);

  const samplePhotos = userPhotos.length > 0 ? userPhotos : [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
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
      
      {/* If viewing another member's profile, show back button */}
      {!isOwnProfile && onBackToMyProfile && (
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-2xl">
          <button
            onClick={() => {
              triggerHaptic('light');
              onBackToMyProfile();
            }}
            className="flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Profile</span>
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Viewing @{targetUser.username}
          </span>
        </div>
      )}

      {/* Profile Card Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        
        {/* Cover Photo */}
        <div className="h-36 sm:h-48 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 relative">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition"
              title="Share Profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-5 pb-5 pt-0 relative">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            
            {/* Avatar */}
            <div className="relative inline-block self-start sm:self-auto">
              <img
                src={targetUser.avatar}
                alt={targetUser.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-slate-900 shadow-2xl bg-slate-800"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                }}
              />
              {targetUser.isPremium && (
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center border-2 border-slate-900 shadow">
                  ★
                </span>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      setIsEditingBio(true);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-700 shadow"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Edit Bio</span>
                  </button>

                  {onOpenVideoStorage && (
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        onOpenVideoStorage();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-sky-500/25"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Reel</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      triggerHaptic('success');
                      setIsFollowing(!isFollowing);
                    }}
                    className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow ${
                      isFollowing
                        ? 'bg-slate-800 text-slate-200 border border-slate-700'
                        : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/25'
                    }`}
                  >
                    {isFollowing ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>

                  {onOpenChat && (
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        onOpenChat(targetUser);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-md shadow-emerald-500/25"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                  )}
                </>
              )}
            </div>

          </div>

          {/* Name & Handle */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                {targetUser.name}
              </h1>
              {targetUser.isVerified && (
                <span className="w-4 h-4 rounded-full bg-sky-500 text-[10px] text-white flex items-center justify-center font-bold">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">@{targetUser.username}</p>
          </div>

          {/* Bio Section */}
          <div className="mt-3">
            {isEditingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Write your bio..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBio}
                    className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg"
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
                  {targetUser.bio || (isOwnProfile ? 'Add a bio to tell others about yourself...' : 'TeleBook Community Member')}
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

          {/* Real Profile Stats (Posts, Reels, Followers, Stars) */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-white block">{userPosts.length}</span>
              <span className="text-[10px] text-slate-400">Posts</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-sky-400 block">{userReels.length}</span>
              <span className="text-[10px] text-slate-400">Reels / Videos</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-white block">{targetUser.followersCount}</span>
              <span className="text-[10px] text-slate-400">Followers</span>
            </div>
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="font-bold text-base text-amber-300 block">⭐ {targetUser.starsCount}</span>
              <span className="text-[10px] text-slate-400">TG Stars</span>
            </div>
          </div>

        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-md">
        {[
          { id: 'posts' as const, label: `Posts (${userPosts.length})`, icon: Grid },
          { id: 'reels' as const, label: `Reels (${userReels.length})`, icon: Film },
          { id: 'photos' as const, label: `Photos (${samplePhotos.length})`, icon: Camera },
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
                onDeletePost={onDeletePost}
              />
            ))
          )}
        </div>
      )}

      {/* Tab: Reels & Videos */}
      {profileTab === 'reels' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Film className="w-4 h-4 text-sky-400" />
                <span>Uploaded Reels & Videos ({userReels.length})</span>
              </h3>

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

            {userReels.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Reels uploaded yet</p>
                <p className="text-xs text-slate-500 mt-1">Uploaded reels will appear here for everyone to watch.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userReels.map((reel: any) => (
                  <div
                    key={reel.id}
                    onClick={() => setSelectedVideoUrl(reel.url)}
                    className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-slate-950 border border-slate-800 group cursor-pointer shadow-lg"
                  >
                    <video
                      src={reel.url}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    
                    {/* Play Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Caption */}
                    <div className="absolute bottom-2 inset-x-2 text-white">
                      <p className="text-[11px] font-bold line-clamp-1 drop-shadow">{reel.title || 'Reel'}</p>
                      <span className="text-[9px] text-slate-400">{reel.uploadedAt ? new Date(reel.uploadedAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
                  }}
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

      {/* Video Fullscreen Player Modal */}
      {selectedVideoUrl && (
        <div 
          onClick={() => setSelectedVideoUrl(null)} 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-sm w-full rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800"
          >
            <video
              src={selectedVideoUrl}
              autoPlay
              controls
              playsInline
              className="w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setSelectedVideoUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
