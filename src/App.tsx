import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  Smile, 
  BarChart2, 
  Sparkles, 
  TrendingUp, 
  Filter, 
  RefreshCw 
} from 'lucide-react';
import { 
  User, 
  Post, 
  Story, 
  Reel, 
  MarketplaceItem, 
  Group, 
  ChatThread, 
  NotificationItem, 
  TabType, 
  ReactionType 
} from './types';
import { 
  CURRENT_USER, 
  INITIAL_POSTS, 
  INITIAL_STORIES, 
  INITIAL_REELS, 
  INITIAL_MARKETPLACE, 
  INITIAL_GROUPS, 
  INITIAL_CHATS, 
  INITIAL_NOTIFICATIONS 
} from './data/initialData';
import { 
  getTelegramWebApp, 
  triggerHaptic, 
  fireConfetti 
} from './utils/telegram';

import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { StoriesBar } from './components/StoriesBar';
import { StoryViewer } from './components/StoryViewer';
import { CreatePostModal } from './components/CreatePostModal';
import { PostCard } from './components/PostCard';
import { CommentsDrawer } from './components/CommentsDrawer';
import { ReelsView } from './components/ReelsView';
import { MarketplaceView } from './components/MarketplaceView';
import { GroupsView } from './components/GroupsView';
import { MessengerView } from './components/MessengerView';
import { ChatModal } from './components/ChatModal';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { TelegramStarsModal } from './components/TelegramStarsModal';
import { TelegramFrameWrapper } from './components/TelegramFrameWrapper';
import { VideoStorageModal } from './components/VideoStorageModal';
import { CreateStoryModal } from './components/CreateStoryModal';
import { FloatingUploadBar, UploadTask } from './components/FloatingUploadBar';

export default function App() {
  // Local state with localStorage persistence
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('tb_user');
    return saved ? JSON.parse(saved) : CURRENT_USER;
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('tb_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem('tb_stories');
    return saved ? JSON.parse(saved) : INITIAL_STORIES;
  });

  const [reels, setReels] = useState<Reel[]>(() => {
    const saved = localStorage.getItem('tb_reels');
    return saved ? JSON.parse(saved) : INITIAL_REELS;
  });

  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(() => {
    const saved = localStorage.getItem('tb_marketplace');
    return saved ? JSON.parse(saved) : INITIAL_MARKETPLACE;
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('tb_groups');
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });

  const [chats, setChats] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem('tb_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('tb_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [isFrameMode, setIsFrameMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isVideoStorageOpen, setIsVideoStorageOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [activeChatParticipant, setActiveChatParticipant] = useState<User | null>(null);
  const [isStarsModalOpen, setIsStarsModalOpen] = useState(false);
  const [uploadTask, setUploadTask] = useState<UploadTask | null>(null);

  // Sync with persistent backend posts
  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.json())
      .then((d) => {
        if (d.posts && d.posts.length > 0) {
          setPosts((prev) => {
            const serverIds = new Set(d.posts.map((p: any) => p.id));
            const locals = prev.filter((p) => !serverIds.has(p.id));
            return [...d.posts, ...locals];
          });
        }
      })
      .catch(() => {});
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('tb_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('tb_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('tb_stories', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('tb_marketplace', JSON.stringify(marketplaceItems));
  }, [marketplaceItems]);

  useEffect(() => {
    localStorage.setItem('tb_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('tb_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('tb_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Initialize Telegram WebApp SDK if available
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        // Sync user from real Telegram if present
        if (tg.initDataUnsafe?.user) {
          const u = tg.initDataUnsafe.user;
          setCurrentUser((prev) => ({
            ...prev,
            name: `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}`,
            username: u.username || prev.username,
            avatar: u.photo_url || prev.avatar,
            isPremium: Boolean(u.is_premium) || prev.isPremium,
          }));
        }
      } catch (err) {
        console.log('Telegram init warning:', err);
      }
    }
  }, []);

  // Post handlers
  const handleCreatePost = async (newPostData: Partial<Post>) => {
    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: currentUser,
      content: newPostData.content || '',
      images: newPostData.images,
      videoUrl: newPostData.videoUrl,
      feeling: newPostData.feeling,
      location: newPostData.location,
      privacy: newPostData.privacy || 'public',
      poll: newPostData.poll,
      timestamp: 'Just now',
      likesCount: 0,
      reactionsSummary: {},
      commentsCount: 0,
      sharesCount: 0,
      starsDonated: 0,
    };

    setPosts([newPost, ...posts]);

    // Save to persistent server db
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
    } catch {
      // ignore
    }
  };

  const handleReact = (postId: string, reactionType: ReactionType) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const isSame = p.userReaction === reactionType;
        const newReaction = isSame ? undefined : reactionType;
        const diff = isSame ? -1 : p.userReaction ? 0 : 1;

        const updatedSummary = { ...p.reactionsSummary };
        if (p.userReaction && updatedSummary[p.userReaction]) {
          updatedSummary[p.userReaction] = Math.max(0, (updatedSummary[p.userReaction] || 1) - 1);
        }
        if (!isSame) {
          updatedSummary[reactionType] = (updatedSummary[reactionType] || 0) + 1;
        }

        return {
          ...p,
          userReaction: newReaction,
          likesCount: Math.max(0, p.likesCount + diff),
          reactionsSummary: updatedSummary,
        };
      })
    );
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || !p.poll) return p;

        const alreadyVotedOptionId = p.poll.userVotedOptionId;
        const updatedOptions = p.poll.options.map((opt) => {
          if (opt.id === optionId) {
            return {
              ...opt,
              votes: opt.votes + 1,
              votedUserIds: [...opt.votedUserIds, currentUser.id],
            };
          }
          if (opt.id === alreadyVotedOptionId) {
            return {
              ...opt,
              votes: Math.max(0, opt.votes - 1),
              votedUserIds: opt.votedUserIds.filter((id) => id !== currentUser.id),
            };
          }
          return opt;
        });

        const totalVotes = updatedOptions.reduce((sum, o) => sum + o.votes, 0);

        return {
          ...p,
          poll: {
            ...p.poll,
            options: updatedOptions,
            totalVotes,
            userVotedOptionId: optionId,
          },
        };
      })
    );
  };

  const handleTipStars = (amount: number, recipientName: string) => {
    if (currentUser.starsCount < amount) {
      setIsStarsModalOpen(true);
      return;
    }

    setCurrentUser((prev) => ({
      ...prev,
      starsCount: Math.max(0, prev.starsCount - amount),
    }));

    // Update post stars if tipping from active comments or feed
    if (activeCommentsPostId) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activeCommentsPostId ? { ...p, starsDonated: p.starsDonated + amount } : p
        )
      );
    }

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      type: 'star',
      actor: currentUser,
      message: `You tipped ${amount} Telegram Stars to ${recipientName}! ⭐`,
      targetPreview: `⭐ -${amount} Stars Sent`,
      timestamp: 'Just now',
      isRead: true,
    };
    setNotifications([newNotif, ...notifications]);

    triggerHaptic('heavy');
    fireConfetti();
  };

  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    );
  };

  // Story reply handler
  const handleSendStoryReply = (storyId: string, replyText: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (!story) return;

    // Create or find chat thread
    const targetUser: User = {
      id: story.userId,
      name: story.userName,
      username: story.userName.toLowerCase().replace(/\s+/g, '_'),
      avatar: story.userAvatar,
      isPremium: story.isPremium,
      starsCount: 500,
      followersCount: 1200,
      followingCount: 200,
      friendsCount: 300,
    };

    const newMsg = {
      id: `m_story_${Date.now()}`,
      senderId: currentUser.id,
      receiverId: story.userId,
      text: `Replied to your Story: "${replyText}"`,
      timestamp: 'Just now',
      isRead: true,
    };

    setChats((prev) => {
      const existing = prev.find((c) => c.participant.id === story.userId);
      if (existing) {
        return prev.map((c) =>
          c.participant.id === story.userId
            ? { ...c, lastMessage: newMsg, unreadCount: 0 }
            : c
        );
      }
      return [
        {
          id: `chat_${Date.now()}`,
          participant: targetUser,
          lastMessage: newMsg,
          unreadCount: 0,
          isOnline: true,
        },
        ...prev,
      ];
    });

    triggerHaptic('success');
  };

  // Comments handlers
  const handleAddComment = (text: string, parentCommentId?: string, image?: string) => {
    if (!activeCommentsPostId) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== activeCommentsPostId) return p;

        return {
          ...p,
          commentsCount: p.commentsCount + 1,
        };
      })
    );
  };

  // Marketplace & Groups handlers
  const handleAddNewListing = (newItem: Partial<MarketplaceItem>) => {
    const fullItem: MarketplaceItem = {
      id: `item_${Date.now()}`,
      title: newItem.title || 'New Item',
      price: newItem.price || 0,
      currency: newItem.currency || 'USD',
      category: newItem.category || 'Electronics',
      location: newItem.location || currentUser.location || 'Dubai',
      images: newItem.images || [],
      description: newItem.description || '',
      seller: currentUser,
      condition: newItem.condition || 'Brand New',
      createdAt: 'Just now',
      status: 'available',
    };

    setMarketplaceItems([fullItem, ...marketplaceItems]);
  };

  const handleToggleJoinGroup = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const nextState = !g.isJoined;
        return {
          ...g,
          isJoined: nextState,
          membersCount: g.membersCount + (nextState ? 1 : -1),
        };
      })
    );
  };

  const handleAddStars = (amount: number) => {
    setCurrentUser((prev) => ({
      ...prev,
      starsCount: prev.starsCount + amount,
    }));
  };

  const handleResetDemoData = () => {
    if (confirm('Reset to initial sample data?')) {
      localStorage.clear();
      setCurrentUser(CURRENT_USER);
      setPosts(INITIAL_POSTS);
      setStories(INITIAL_STORIES);
      setReels(INITIAL_REELS);
      setMarketplaceItems(INITIAL_MARKETPLACE);
      setGroups(INITIAL_GROUPS);
      setChats(INITIAL_CHATS);
      setNotifications(INITIAL_NOTIFICATIONS);
      triggerHaptic('success');
    }
  };

  const unreadMessagesCount = chats.reduce((acc, c) => acc + c.unreadCount, 0);
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const activeCommentsPost = posts.find((p) => p.id === activeCommentsPostId);

  // Search filtered posts
  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.content.toLowerCase().includes(q) ||
      p.author.name.toLowerCase().includes(q) ||
      (p.location && p.location.toLowerCase().includes(q))
    );
  });

  return (
    <TelegramFrameWrapper
      isFrameMode={isFrameMode}
      onCloseApp={() => {
        const tg = getTelegramWebApp();
        if (tg) tg.close();
      }}
    >
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased">
        
        {/* App Header */}
        <Header
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadMessagesCount={unreadMessagesCount}
          unreadNotifsCount={unreadNotifsCount}
          onOpenStarsModal={() => setIsStarsModalOpen(true)}
          onOpenVideoStorage={() => setIsVideoStorageOpen(true)}
          isFrameMode={isFrameMode}
          setIsFrameMode={setIsFrameMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Facebook-style Top Navigation */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadNotifsCount={unreadNotifsCount}
          unreadMessagesCount={unreadMessagesCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-3.5 space-y-4">
          
          {/* TAB: FEED / HOME */}
          {activeTab === 'feed' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              
              {/* Stories Bar */}
              <StoriesBar
                stories={stories}
                currentUser={currentUser}
                onSelectStory={(index) => setActiveStoryIndex(index)}
                onAddStory={() => {
                  triggerHaptic('medium');
                  setIsCreateStoryOpen(true);
                }}
              />

              {/* What's on your mind? Post Composer Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setIsCreatePostOpen(true);
                    }}
                    className="flex-1 text-left bg-slate-800/90 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-full px-4 py-2 text-xs text-slate-400 font-medium transition"
                  >
                    What's on your mind, {currentUser.name.split(' ')[0]}?
                  </button>
                </div>

                <div className="flex items-center justify-around mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400">
                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      setIsCreatePostOpen(true);
                    }}
                    className="flex items-center gap-1.5 hover:text-emerald-400 font-semibold transition"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Photo / Video</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      setIsCreatePostOpen(true);
                    }}
                    className="flex items-center gap-1.5 hover:text-amber-400 font-semibold transition"
                  >
                    <Smile className="w-4 h-4 text-amber-400" />
                    <span>Feeling / Activity</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      setIsCreatePostOpen(true);
                    }}
                    className="flex items-center gap-1.5 hover:text-sky-400 font-semibold transition"
                  >
                    <BarChart2 className="w-4 h-4 text-sky-400" />
                    <span>Telegram Poll</span>
                  </button>
                </div>
              </div>

              {/* Feed Posts List */}
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onReact={handleReact}
                    onOpenComments={(postId) => setActiveCommentsPostId(postId)}
                    onVotePoll={handleVotePoll}
                    onTipStars={handleTipStars}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>

              {/* Demo Reset Helper Button at bottom */}
              <div className="pt-6 pb-8 text-center">
                <button
                  onClick={handleResetDemoData}
                  className="text-xs text-slate-600 hover:text-slate-400 flex items-center justify-center gap-1 mx-auto transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Demo Data</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB: REELS */}
          {activeTab === 'reels' && (
            <ReelsView
              reels={reels}
              currentUser={currentUser}
              onOpenComments={(reelId) => {
                // Open comments using dummy post reference
                setActiveCommentsPostId(posts[0].id);
              }}
              onTipStars={handleTipStars}
              onOpenVideoStorage={() => setIsVideoStorageOpen(true)}
            />
          )}

          {/* TAB: MARKETPLACE */}
          {activeTab === 'marketplace' && (
            <MarketplaceView
              items={marketplaceItems}
              currentUser={currentUser}
              onOpenChatWithUser={(user) => setActiveChatParticipant(user)}
              onAddNewListing={handleAddNewListing}
            />
          )}

          {/* TAB: GROUPS */}
          {activeTab === 'groups' && (
            <GroupsView
              groups={groups}
              currentUser={currentUser}
              onToggleJoinGroup={handleToggleJoinGroup}
            />
          )}

          {/* TAB: MESSENGER */}
          {activeTab === 'messenger' && (
            <MessengerView
              chats={chats}
              currentUser={currentUser}
              onOpenChat={(participant) => setActiveChatParticipant(participant)}
            />
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              currentUser={currentUser}
              onMarkAllAsRead={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
              }}
              onSelectNotification={(item) => {
                setNotifications((prev) =>
                  prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                );
                if (item.type === 'marketplace') {
                  setActiveTab('marketplace');
                } else if (item.type === 'like' || item.type === 'comment' || item.type === 'star') {
                  setActiveTab('feed');
                }
              }}
            />
          )}

          {/* TAB: PROFILE / MENU */}
          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              posts={posts}
              savedPosts={posts.filter((p) => p.isSaved)}
              onUpdateBio={(newBio) => {
                setCurrentUser((prev) => ({ ...prev, bio: newBio }));
              }}
              onOpenStarsModal={() => setIsStarsModalOpen(true)}
              onOpenVideoStorage={() => setIsVideoStorageOpen(true)}
              onReact={handleReact}
              onOpenComments={(postId) => setActiveCommentsPostId(postId)}
              onVotePoll={handleVotePoll}
              onTipStars={handleTipStars}
              onToggleSave={handleToggleSave}
              isFrameMode={isFrameMode}
              setIsFrameMode={setIsFrameMode}
            />
          )}

        </main>

        {/* Story Viewer Modal */}
        {activeStoryIndex !== null && (
          <StoryViewer
            stories={stories}
            initialIndex={activeStoryIndex}
            currentUser={currentUser}
            onClose={() => setActiveStoryIndex(null)}
            onSendStoryReply={handleSendStoryReply}
            onTipStars={handleTipStars}
          />
        )}

        {/* Create Post Modal */}
        {isCreatePostOpen && (
          <CreatePostModal
            currentUser={currentUser}
            onClose={() => setIsCreatePostOpen(false)}
            onSubmitPost={handleCreatePost}
          />
        )}

        {/* Comments Drawer */}
        {activeCommentsPostId && activeCommentsPost && (
          <CommentsDrawer
            postAuthorName={activeCommentsPost.author.name}
            currentUser={currentUser}
            comments={[
              {
                id: 'c1',
                userId: 'user_2',
                userName: 'Elena Rostova',
                userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                isPremium: true,
                text: 'The user interface feels so lightweight and fast compared to standard mobile apps! 🚀',
                timestamp: '25m ago',
                likesCount: 14,
                isLiked: false,
                replies: [
                  {
                    id: 'c1_r1',
                    userId: 'user_3',
                    userName: 'Marcus Chen',
                    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                    text: 'Agreed, Telegram WebApp SDK handles haptics and theme syncing flawlessly.',
                    timestamp: '10m ago',
                    likesCount: 4,
                  },
                ],
              },
              {
                id: 'c2',
                userId: 'user_5',
                userName: 'David Miller',
                userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
                text: 'Already testing the Marketplace checkout flow with TG Stars ⭐ Super seamless.',
                timestamp: '1h ago',
                likesCount: 6,
                isLiked: true,
              },
            ]}
            onClose={() => setActiveCommentsPostId(null)}
            onAddComment={handleAddComment}
            onLikeComment={(cId) => triggerHaptic('light')}
          />
        )}

        {/* Direct Chat Modal */}
        {activeChatParticipant && (
          <ChatModal
            participant={activeChatParticipant}
            currentUser={currentUser}
            onClose={() => setActiveChatParticipant(null)}
            onTipStars={handleTipStars}
          />
        )}

        {/* Telegram Stars Wallet Modal */}
        {isStarsModalOpen && (
          <TelegramStarsModal
            currentUser={currentUser}
            onClose={() => setIsStarsModalOpen(false)}
            onAddStars={handleAddStars}
          />
        )}

        {/* User Video Storage Modal (Cloud & Reels & Stories) */}
        {isVideoStorageOpen && (
          <VideoStorageModal
            currentUser={currentUser}
            onClose={() => setIsVideoStorageOpen(false)}
            onAddReel={(newReel) => {
              setReels([newReel, ...reels]);
              setActiveTab('reels');
            }}
            onAddStory={(newStory) => {
              setStories([newStory, ...stories]);
              setActiveTab('feed');
            }}
            onAddPost={(newPost) => {
              handleCreatePost(newPost);
              setActiveTab('feed');
            }}
          />
        )}

      </div>

        {/* Create Story / Reel Modal */}
        {isCreateStoryOpen && (
          <CreateStoryModal
            currentUser={currentUser}
            onClose={() => setIsCreateStoryOpen(false)}
            onAddStory={(newStory) => {
              setStories([newStory, ...stories]);
              setActiveTab('feed');
            }}
            onAddReel={(newReel) => {
              setReels([newReel, ...reels]);
              setActiveTab('reels');
            }}
          />
        )}

        {/* Facebook-style Background Floating Upload Bar */}
        <FloatingUploadBar task={uploadTask} onDismiss={() => setUploadTask(null)} />

    </TelegramFrameWrapper>
  );
}
