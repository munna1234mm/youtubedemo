import React, { useState } from 'react';
import { 
  Bell, 
  Sparkles, 
  Heart, 
  MessageSquare, 
  Store, 
  UserPlus, 
  Check, 
  CheckCheck 
} from 'lucide-react';
import { NotificationItem, User } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  currentUser: User;
  onMarkAllAsRead: () => void;
  onSelectNotification: (item: NotificationItem) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  currentUser,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'stars'>('all');

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'stars') return n.type === 'star';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'star':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-yellow-400 border border-yellow-500/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 fill-yellow-400" />
          </div>
        );
      case 'like':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
            <Heart className="w-4 h-4 fill-rose-500" />
          </div>
        );
      case 'comment':
        return (
          <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'marketplace':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
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
            Stay updated with reactions, comments & Telegram Star tips
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
      <div className="flex gap-2">
        {(['all', 'unread', 'stars'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              triggerHaptic('selection');
              setFilter(tab);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize border transition ${
              filter === tab
                ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {tab === 'stars' ? '⭐ Telegram Stars' : tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden shadow-md">
        {filteredNotifs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No notifications in this filter</p>
          </div>
        ) : (
          filteredNotifs.map((item) => (
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

              {/* Actor & Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-200 leading-relaxed">
                  <span className="font-bold text-white mr-1 hover:underline">
                    {item.actor.name}
                  </span>
                  <span>{item.message}</span>
                </div>

                {item.targetPreview && (
                  <div className="mt-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg inline-block border border-amber-500/20">
                    {item.targetPreview}
                  </div>
                )}

                <span className="text-[10px] text-slate-500 block mt-1">
                  {item.timestamp}
                </span>
              </div>

              {/* Unread indicator */}
              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};
