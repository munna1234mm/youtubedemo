import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  Smile, 
  BarChart2, 
  Sparkles, 
  TrendingUp, 
  Filter, 
  RefreshCw,
  RotateCcw 
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
import { AuthModal } from './components/AuthModal';

export default function App() {
  // Local state with localStorage persistence (null initially if not logged in)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tb_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('tb_user');
    setCurrentUser(null);
    triggerHaptic('medium');
  };

  const safeSetItem = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // If quota exceeded, remove large cached items
      try {
        localStorage.removeItem('tb_posts');
        localStorage.removeItem('tb_stories');
      } catch {}
    }
  };

  const [posts, setPosts] = useState<Post[]>(() => {
    return INITIAL_POSTS;
  });

  // Stories live from server (demo stories removed)
  const [stories, setStories] = useState<Story[]>([]);

  const [reels, setReels] = useState<Reel[]>(() => {
    return INITIAL_REELS;
  });

  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(() => {
    return INITIAL_MARKETPLACE;
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    return INITIAL_GROUPS;
  });

  const [chats, setChats] = useState<ChatThread[]>(() => {
    return INITIAL_CHATS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    return INITIAL_NOTIFICATIONS;
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
  const [viewingProfileUser, setViewingProfileUser] = useState<User | null>(null);

  // Sync with persistent backend posts & stories
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

    const fetchStories = async () => {
      try {
        const res = await fetch('/api/stories');
        if (res.ok) {
          const data = await res.json();
          if (data.stories) {
            setStories(data.stories);
          }
        }
      } catch {}
    };

    fetchStories();
    const interval = setInterval(fetchStories, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync safe lightweight state to localStorage
  useEffect(() => {
    if (currentUser) {
      safeSetItem('tb_user', currentUser);
    }
  }, [currentUser]);

  // Live real-time notification sync from server
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchLiveNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.notifications && data.notifications.length > 0) {
            setNotifications((prev) => {
              const serverIds = new Set(data.notifications.map((n: any) => n.id));
              const locals = prev.filter((p) => !serverIds.has(p.id));
              return [...data.notifications, ...locals];
            });
          }
        }
      } catch {}
    };

    fetchLiveNotifs();
    const interval = setInterval(fetchLiveNotifs, 2500);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // --- Modern URL Deep-Linking & History Router ---
  const isPopStateRef = useRef(false);

  // 1. Parse initial URL and Handle Back/Forward Navigation
  const handleRouteFromUrl = async () => {
    const path = window.location.pathname;
    if (!path || path === '/' || path === '/feed') {
      setActiveTab('feed');
      setViewingProfileUser(null);
      return;
    }

    // Handle @username/profile or @username
    if (path.startsWith('/@')) {
      const parts = path.substring(2).split('/');
      const rawUsername = decodeURIComponent(parts[0]);
      const subAction = parts[1]; // 'profile', 'post', etc.

      if (subAction === 'post' && parts[2]) {
        const postId = parts[2];
        setActiveTab('feed');
        setActiveCommentsPostId(postId);
        return;
      }

      // Load matching user profile
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          const found = (data.users || []).find(
            (u: any) =>
              u.username?.toLowerCase() === rawUsername.toLowerCase() ||
              u.name?.toLowerCase() === rawUsername.toLowerCase()
          );
          if (found) {
            setViewingProfileUser(found);
            setActiveTab('profile');
            return;
          }
        }
      } catch {}

      // Fallback user placeholder for profile
      setViewingProfileUser({
        id: `u_${rawUsername}`,
        name: rawUsername,
        username: rawUsername,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        starsCount: 0,
        followersCount: 0,
        followingCount: 0,
        friendsCount: 0,
      });
      setActiveTab('profile');
      return;
    }

    // Direct /post/:id
    if (path.startsWith('/post/')) {
      const postId = path.replace('/post/', '');
      setActiveTab('feed');
      setActiveCommentsPostId(postId);
      return;
    }

    // Direct /reels
    if (path.startsWith('/reels')) {
      setActiveTab('reels');
      return;
    }

    // Direct /messages or /messages/@username
    if (path.startsWith('/messages')) {
      setActiveTab('messenger');
      if (path.includes('/@')) {
        const targetUsername = decodeURIComponent(path.split('/@')[1] || '');
        if (targetUsername) {
          fetch('/api/users')
            .then((r) => r.json())
            .then((d) => {
              const found = (d.users || []).find(
                (u: any) =>
                  u.username?.toLowerCase() === targetUsername.toLowerCase() ||
                  u.name?.toLowerCase() === targetUsername.toLowerCase()
              );
              if (found) setActiveChatParticipant(found);
            })
            .catch(() => {});
        }
      }
      return;
    }

    // Direct /marketplace
    if (path.startsWith('/marketplace')) {
      setActiveTab('marketplace');
      return;
    }

    // Direct /groups
    if (path.startsWith('/groups')) {
      setActiveTab('groups');
      return;
    }

    // Direct /notifications
    if (path.startsWith('/notifications')) {
      setActiveTab('notifications');
      return;
    }

    // Direct /profile
    if (path.startsWith('/profile')) {
      setViewingProfileUser(null);
      setActiveTab('profile');
      return;
    }
  };

  useEffect(() => {
    handleRouteFromUrl();

    const onPopState = () => {
      isPopStateRef.current = true;
      handleRouteFromUrl().finally(() => {
        isPopStateRef.current = false;
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 2. Sync State Changes to Clean Browser URL
  useEffect(() => {
    if (isPopStateRef.current) return;

    let targetUrl = '/';

    if (viewingProfileUser) {
      targetUrl = `/@${viewingProfileUser.username || viewingProfileUser.name}/profile`;
    } else if (activeTab === 'profile') {
      targetUrl = currentUser ? `/@${currentUser.username || currentUser.name}/profile` : '/profile';
    } else if (activeTab === 'reels') {
      targetUrl = '/reels';
    } else if (activeTab === 'messenger') {
      targetUrl = activeChatParticipant
        ? `/messages/@${activeChatParticipant.username || activeChatParticipant.name}`
        : '/messages';
    } else if (activeTab === 'marketplace') {
      targetUrl = '/marketplace';
    } else if (activeTab === 'groups') {
      targetUrl = '/groups';
    } else if (activeTab === 'notifications') {
      targetUrl = '/notifications';
    } else if (activeCommentsPostId) {
      const targetPost = posts.find((p) => p.id === activeCommentsPostId);
      const author = targetPost?.author?.username || 'user';
      targetUrl = `/@${author}/post/${activeCommentsPostId}`;
    } else if (activeTab === 'feed') {
      targetUrl = '/';
    }

    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ tab: activeTab }, '', targetUrl);
    }
  }, [
    activeTab,
    viewingProfileUser,
    activeChatParticipant,
    activeCommentsPostId,
    currentUser?.username,
  ]);

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

  const handleReact = async (postId: string, reactionType: ReactionType) => {
    let newSummary: any;
    let diffVal = 1;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const isSame = p.userReaction === reactionType;
        const newReaction = isSame ? undefined : reactionType;
        diffVal = isSame ? -1 : p.userReaction ? 0 : 1;

        const updatedSummary = { ...p.reactionsSummary };
        if (p.userReaction && updatedSummary[p.userReaction]) {
          updatedSummary[p.userReaction] = Math.max(0, (updatedSummary[p.userReaction] || 1) - 1);
        }
        if (!isSame) {
          updatedSummary[reactionType] = (updatedSummary[reactionType] || 0) + 1;
        }

        newSummary = updatedSummary;

        return {
          ...p,
          userReaction: newReaction,
          likesCount: Math.max(0, p.likesCount + diffVal),
          reactionsSummary: updatedSummary,
        };
      })
    );

    try {
      await fetch(`/api/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType, diff: diffVal, summary: newSummary, user: currentUser }),
      });
    } catch {
      // ignore
    }
  };

  const handleFollowUser = async (targetUser: User) => {
    if (!currentUser) return;
    try {
      await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower: currentUser, targetUserId: targetUser.id }),
      });
    } catch {}
  };

  const handleAddComment = async (text: string, parentCommentId?: string, image?: string) => {
    if (!activeCommentsPostId) return;

    const newComment = {
      id: `c_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      isPremium: currentUser.isPremium || false,
      text,
      image,
      timestamp: 'Just now',
      likesCount: 0,
      isLiked: false,
      replies: [],
    };

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== activeCommentsPostId) return p;
        const currentComments = p.comments || [];
        return {
          ...p,
          comments: [newComment, ...currentComments],
          commentsCount: (p.commentsCount || 0) + 1,
        };
      })
    );

    try {
      await fetch(`/api/posts/${activeCommentsPostId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          text,
          image,
          parentCommentId,
        }),
      });
    } catch {
      // ignore
    }
  };

  const handleAddNewStory = async (newStoryData: Story) => {
    setStories((prev) => [newStoryData, ...prev]);
    try {
      await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStoryData),
      });
    } catch {}
  };

  const handleDeleteStory = async (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    setActiveStoryIndex(null);
    try {
      await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
    } catch {}
  };

  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    } catch {}
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

  const handleSelectTab = (tab: TabType) => {
    if (tab === 'profile' && activeTab === 'profile') {
      setViewingProfileUser(null);
    } else if (tab !== 'profile') {
      setViewingProfileUser(null);
    }
    setActiveTab(tab);
  };

  const handleStartBackgroundUpload = async (taskData: {
    file: File | null;
    previewUrl: string;
    title: string;
    caption: string;
    target: 'reels' | 'stories' | 'post';
  }) => {
    const taskId = `task_${Date.now()}`;
    
    // Initialize floating bar immediately
    setUploadTask({
      id: taskId,
      title: taskData.title || (taskData.target === 'reels' ? 'Reel Video' : 'Video Upload'),
      target: taskData.target,
      progress: 15,
      previewUrl: taskData.previewUrl,
      status: 'uploading',
      statusText: 'Uploading in background…',
    });

    let currentPct = 15;
    const progressInterval = setInterval(() => {
      currentPct = Math.min(88, currentPct + Math.floor(Math.random() * 15 + 8));
      setUploadTask((prev) =>
        prev && prev.id === taskId
          ? {
              ...prev,
              progress: currentPct,
              status: currentPct > 60 ? 'processing' : 'uploading',
              statusText: currentPct > 60 ? 'Processing & optimizing quality…' : 'Uploading in background…',
            }
          : prev
      );
    }, 400);

    try {
      let videoUrl = taskData.previewUrl;

      if (taskData.file) {
        const formData = new FormData();
        formData.append('video', taskData.file);
        formData.append('title', taskData.title || 'Video');
        formData.append('authorId', currentUser.id);
        formData.append('authorName', currentUser.name);
        formData.append('authorAvatar', currentUser.avatar);
        formData.append('authorUsername', currentUser.username);

        const res = await fetch('/api/upload/video', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.video?.url) {
            videoUrl = data.video.url;
          }
        }
      } else {
        await fetch('/api/upload/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: taskData.previewUrl,
            title: taskData.title || 'Video',
            authorId: currentUser.id,
            authorName: currentUser.name,
            authorAvatar: currentUser.avatar,
            authorUsername: currentUser.username,
          }),
        });
      }

      clearInterval(progressInterval);

      // Publish to respective feed
      if (taskData.target === 'reels') {
        const newReel: Reel = {
          id: `reel_${Date.now()}`,
          author: currentUser,
          videoUrl,
          thumbnailUrl: currentUser.avatar,
          caption: taskData.caption || taskData.title || 'New Reel',
          audioName: `Original Audio · ${currentUser.name}`,
          likesCount: 1,
          commentsCount: 0,
          sharesCount: 0,
          isLiked: true,
        };
        setReels((prev) => [newReel, ...prev]);
      } else if (taskData.target === 'stories') {
        const newStory: Story = {
          id: `story_${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          isPremium: currentUser.isPremium,
          mediaUrl: videoUrl,
          mediaType: 'video',
          caption: taskData.caption || taskData.title,
          timestamp: 'Just now',
          likesCount: 0,
        };
        setStories((prev) => [newStory, ...prev]);
      } else {
        handleCreatePost({
          content: `🎬 ${taskData.title}\n${taskData.caption}`,
          videoUrl,
        });
      }

      // Set 100% done
      setUploadTask((prev) =>
        prev && prev.id === taskId
          ? {
              ...prev,
              progress: 100,
              status: 'done',
              statusText: 'Published successfully! 🎉',
            }
          : prev
      );

      triggerHaptic('success');
      fireConfetti();

      // Auto dismiss toast after 3.5s
      setTimeout(() => {
        setUploadTask((prev) => (prev && prev.id === taskId ? null : prev));
      }, 3500);
    } catch {
      clearInterval(progressInterval);
      setUploadTask((prev) =>
        prev && prev.id === taskId
          ? {
              ...prev,
              status: 'error',
              statusText: 'Upload failed. Tap to retry.',
            }
          : prev
      );
      triggerHaptic('warning');
    }
  };

  if (!currentUser) {
    return (
      <TelegramFrameWrapper
        isFrameMode={isFrameMode}
        onCloseApp={() => {
          const tg = getTelegramWebApp();
          if (tg) tg.close();
        }}
      >
        <AuthModal
          onLoginSuccess={(loggedInUser) => {
            setCurrentUser(loggedInUser);
            localStorage.setItem('tb_user', JSON.stringify(loggedInUser));
            setIsAuthModalOpen(false);
          }}
        />
      </TelegramFrameWrapper>
    );
  }

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
          setActiveTab={handleSelectTab}
          unreadMessagesCount={unreadMessagesCount}
          unreadNotifsCount={unreadNotifsCount}
          onOpenStarsModal={() => setIsStarsModalOpen(true)}
          onOpenVideoStorage={() => setIsVideoStorageOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          isFrameMode={isFrameMode}
          setIsFrameMode={setIsFrameMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Facebook-style Top Navigation */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
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
                    onDeletePost={handleDeletePost}
                    onViewProfile={(author) => {
                      setViewingProfileUser(author);
                      setActiveTab('profile');
                    }}
                  />
                ))}
              </div>

              {/* Reset to fresh state button */}
              <div className="text-center pt-4 pb-2">
                <button
                  onClick={handleResetDemoData}
                  className="text-xs text-slate-400 hover:text-rose-400 transition inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-750 bg-slate-900/50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
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
                setActiveCommentsPostId(posts[0]?.id || null);
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
                if (currentUser) {
                  fetch('/api/notifications/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser.id }),
                  }).catch(() => {});
                }
              }}
              onFollowBack={handleFollowUser}
              onOpenChat={(actor) => setActiveChatParticipant(actor)}
              onSelectNotification={(item) => {
                setNotifications((prev) =>
                  prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                );
                if (item.type === 'marketplace') {
                  setActiveTab('marketplace');
                } else if (item.type === 'like' || item.type === 'comment' || item.type === 'star') {
                  setActiveTab('feed');
                } else if (item.type === 'message') {
                  setActiveChatParticipant(item.actor);
                } else if (item.type === 'follow' || item.type === 'friend_request') {
                  setViewingProfileUser(item.actor);
                  setActiveTab('profile');
                }
              }}
            />
          )}

          {/* TAB: PROFILE / MENU */}
          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              viewedUser={viewingProfileUser}
              onBackToMyProfile={() => setViewingProfileUser(null)}
              onOpenChat={(user) => setActiveChatParticipant(user)}
              posts={posts}
              savedPosts={posts.filter((p) => p.isSaved)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
              onUpdateBio={(newBio) => {
                setCurrentUser((prev) => (prev ? { ...prev, bio: newBio } : null));
              }}
              onOpenStarsModal={() => setIsStarsModalOpen(true)}
              onOpenVideoStorage={() => setIsVideoStorageOpen(true)}
              onReact={handleReact}
              onOpenComments={(postId) => setActiveCommentsPostId(postId)}
              onVotePoll={handleVotePoll}
              onTipStars={handleTipStars}
              onToggleSave={handleToggleSave}
              onDeletePost={handleDeletePost}
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
            onDeleteStory={handleDeleteStory}
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

        {/* Comments Drawer (Real-Time Comments) */}
        {activeCommentsPostId && activeCommentsPost && (
          <CommentsDrawer
            postAuthorName={activeCommentsPost.author.name}
            currentUser={currentUser}
            comments={activeCommentsPost.comments || []}
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
              handleAddNewStory(newStory);
              setActiveTab('feed');
            }}
            onAddPost={(newPost) => {
              handleCreatePost(newPost);
              setActiveTab('feed');
            }}
            onStartBackgroundUpload={handleStartBackgroundUpload}
          />
        )}

      </div>

        {/* Create Story / Reel Modal */}
        {isCreateStoryOpen && (
          <CreateStoryModal
            currentUser={currentUser}
            onClose={() => setIsCreateStoryOpen(false)}
            onAddStory={(newStory) => {
              handleAddNewStory(newStory);
              setActiveTab('feed');
            }}
            onAddReel={(newReel) => {
              setReels([newReel, ...reels]);
              setActiveTab('reels');
            }}
            onStartBackgroundUpload={handleStartBackgroundUpload}
          />
        )}

        {/* Facebook-style Background Floating Upload Bar */}
        <FloatingUploadBar task={uploadTask} onDismiss={() => setUploadTask(null)} />

        {/* Dual Sign-up & Login Modal (Telegram & Email/Password) */}
        {isAuthModalOpen && (
          <AuthModal
            onLoginSuccess={(loggedInUser) => {
              setCurrentUser(loggedInUser);
              localStorage.setItem('tb_user', JSON.stringify(loggedInUser));
              setIsAuthModalOpen(false);
            }}
            onClose={() => setIsAuthModalOpen(false)}
          />
        )}

    </TelegramFrameWrapper>
  );
}
