export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'star';

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  starsCount: number;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  location?: string;
  joinedDate?: string;
  work?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isPremium?: boolean;
  text: string;
  timestamp: string;
  likesCount: number;
  isLiked?: boolean;
  image?: string;
  replies?: Comment[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedUserIds: string[];
}

export interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  images?: string[];
  videoUrl?: string;
  timestamp: string;
  likesCount: number;
  userReaction?: ReactionType;
  reactionsSummary: { [key in ReactionType]?: number };
  commentsCount: number;
  sharesCount: number;
  starsDonated: number;
  isSaved?: boolean;
  isPinned?: boolean;
  feeling?: string;
  location?: string;
  taggedUsers?: string[];
  poll?: Poll;
  groupId?: string;
  groupName?: string;
  privacy: 'public' | 'friends' | 'telegram_contacts';
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  isPremium?: boolean;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  timestamp: string;
  viewed?: boolean;
  likesCount: number;
  isLiked?: boolean;
}

export interface Reel {
  id: string;
  author: User;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  audioName: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  tags?: string[];
}

export interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  currency: 'USD' | 'TON' | 'STARS';
  category: string;
  location: string;
  images: string[];
  description: string;
  seller: User;
  condition: 'Brand New' | 'Like New' | 'Good' | 'Fair';
  createdAt: string;
  isSaved?: boolean;
  status: 'available' | 'sold' | 'pending';
}

export interface Group {
  id: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  coverImage: string;
  membersCount: number;
  isJoined?: boolean;
  category: string;
  isPrivate?: boolean;
  recentActivity?: string;
  postsCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  mediaUrl?: string;
  starsSent?: number;
  isVoice?: boolean;
  voiceDuration?: string;
}

export interface ChatThread {
  id: string;
  participant: User;
  lastMessage: Message;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: string;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'star' | 'friend_request' | 'group_invite' | 'marketplace';
  actor: User;
  message: string;
  targetId?: string;
  targetPreview?: string;
  timestamp: string;
  isRead: boolean;
}

export type TabType = 'feed' | 'reels' | 'messenger' | 'marketplace' | 'groups' | 'notifications' | 'profile';
