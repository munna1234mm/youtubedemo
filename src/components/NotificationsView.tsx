import React, { useState } from 'react';
import { 
  Bell, 
  Sparkles, 
  Heart, 
  MessageSquare, 
  Store, 
  UserPlus, 
  Check, 
  CheckCheck,
  Send,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { NotificationItem, User } from '../types';
import { triggerHaptic, fireConfetti } from '../utils/telegram';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  currentUser: User;
  onMarkAllAsRead: () => void;
  onSelectNotification: (item: NotificationItem) => void;
  onFollowBack?: (actor: User) => void;
  onOpenChat?: (actor: User) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  currentUser,
  onMarkAllAsRead,
  onSelectNotification,
  onFollowBack,
  onOpenChat,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'friends' | 'stars'>('all');
  const [followedUsers, setFollowedUsers] = useState<{ [id: string]: boolean }>({});

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'stars') return n.type === 'star';
    if (filter === 'friends') return n.type === 'follow' || n.type === 'friend_request';
    return true;
  });

  const handleFollowBackClick = (e: React.MouseEvent, actor: User) => {
    e.stopPropagation();
    setFollowedUsers((prev) => ({ ...prev, [actor.id]: true }));
    triggerHaptic('success');
    fireConfetti();
    if (onFollowBack) {
      onFollowBack(actor);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'star':
        return (
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-yellow-400 border border-yellow-500/40 flex items-center justify-center shadow">
            <Sparkles className="w-4 h-4 fill-yellow-400" />
          </div>
        );
      case 'like':
        return (
          <div className="w-9 h-9 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow">
            <Heart className="w-4 h-4 fill-rose-500" />
          </div>
        );
      case 'comment':
        return (
          <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shadow">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'follow':
      case 'friend_request':
        return (
          <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      case 'message':
        return (
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow">
            <Send className="w-4 h-4" />
          </div>
        );
      case 'marketplace':
        return (
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow">
            <Store className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shadow">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Bell className="w-5 h-5 text-sky-400" />
            <span>Notifications</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Instant alerts for likes, comments, friend requests & stars
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('success');
            onMarkAllAsRead();
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all' as const, label: 'All' },
          { id: 'unread' as const, label: 'Unread' },
          { id: 'friends' as const, label: '👥 Friend Requests' },
          { id: 'stars' as const, label: '⭐ Telegram Stars' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              triggerHaptic('selection');
              setFilter(tab.id);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
              filter === tab.id
                ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden shadow-md">
        {filteredNotifs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No notifications here</p>
            <p className="text-xs text-slate-500 mt-1">When someone interacts with you, it will appear right here.</p>
          </div>
        ) : (
          filteredNotifs.map((item) => {
            const isFollowNotif = item.type === 'follow' || item.type === 'friend_request';
            const isFollowed = followedUsers[item.actor.id] || item.isFollowedBack;

            return (
              <div
                key={item.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectNotification(item);
                }}
                className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/60 transition cursor-pointer ${
                  !item.isRead ? 'bg-sky-500/5' : ''
                }`}
              >
                {/* Type Icon */}
                <div className="shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>

                {/* Actor Avatar */}
                <img
                  src={item.actor.avatar}
                  alt={item.actor.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                  }}
                />

                {/* Actor & Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-200 leading-relaxed">
                    <span className="font-bold text-white mr-1 hover:underline">
                      {item.actor.name}
                    </span>
                    <span>{item.message}</span>
                  </div>

                  {item.targetPreview && (
                    <div className="mt-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg inline-block border border-amber-500/20">
                      {item.targetPreview}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 block mt-1">
                    {item.timestamp}
                  </span>
                </div>

                {/* Right Action: Follow Back or Direct Chat or View */}
                <div className="shrink-0 flex items-center gap-1.5 ml-1">
                  {isFollowNotif ? (
                    <button
                      onClick={(e) => handleFollowBackClick(e, item.actor)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-md ${
                        isFollowed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/25'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Followed ✓</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow Back</span>
                        </>
                      )}
                    </button>
                  ) : item.type === 'message' && onOpenChat ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('medium');
                        onOpenChat(item.actor);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-500/20"
                    >
                      <Send className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  ) : (
                    <span className="text-slate-500 hover:text-sky-400 p-1">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}

                  {/* Unread indicator */}
                  {!item.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
