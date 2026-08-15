import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  Sparkles, 
  Users, 
  CheckCheck, 
  RefreshCw,
  Send,
  UserCheck
} from 'lucide-react';
import { ChatThread, User } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface MessengerViewProps {
  chats: ChatThread[];
  currentUser: User;
  onOpenChat: (participant: User) => void;
}

export const MessengerView: React.FC<MessengerViewProps> = ({
  chats,
  currentUser,
  onOpenChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [communityUsers, setCommunityUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Sync current user & fetch all community members
  const fetchCommunityUsers = async () => {
    setLoadingUsers(true);
    try {
      // Register current user in the live network
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentUser),
      });

      // Get all registered members from server
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        const otherUsers = (data.users || []).filter((u: User) => u.id !== currentUser.id);
        setCommunityUsers(otherUsers);
      }
    } catch {
      // fallback
      setCommunityUsers(chats.map((c) => c.participant).filter((p) => p.id !== currentUser.id));
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchCommunityUsers();
    const interval = setInterval(fetchCommunityUsers, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Combine recent chats with all community members so no one is missing
  const userMap = new Map<string, User>();
  communityUsers.forEach((u) => userMap.set(u.id, u));
  chats.forEach((c) => {
    if (c.participant.id !== currentUser.id) {
      userMap.set(c.participant.id, c.participant);
    }
  });

  const allMembersList = Array.from(userMap.values());

  const filteredMembers = allMembersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-sky-400" />
            <span>TeleMessenger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct chat & instant messaging with all community members
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">Live ({allMembersList.length + 1})</span>
        </div>
      </div>

      {/* Online Active Members Horizontal Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Online Network
          </span>
          <button
            onClick={fetchCommunityUsers}
            className="text-xs text-sky-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loadingUsers ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pt-1">
          {/* Current User */}
          <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <span className="text-[10px] text-slate-300 font-semibold line-clamp-1 max-w-[54px] text-center">
              You
            </span>
          </div>

          {/* All Community Members */}
          {allMembersList.map((member) => (
            <div
              key={member.id}
              onClick={() => {
                triggerHaptic('light');
                onOpenChat(member);
              }}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-sky-500/80 group-hover:scale-105 transition"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <span className="text-[10px] text-slate-300 font-semibold line-clamp-1 max-w-[54px] text-center">
                {member.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search any member by name or @username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-sm"
        />
      </div>

      {/* All Community Members Inbox List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-md">
        <div className="px-4 py-2.5 bg-slate-800/40 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            All Members Directory & Chats ({filteredMembers.length})
          </span>
          <span className="text-[10px] text-slate-400">Click to start direct chat</span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MessageCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No members found</p>
            <p className="text-xs text-slate-500 mt-1">Try searching for a different name</p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const chatThread = chats.find((c) => c.participant.id === member.id);

            return (
              <div
                key={member.id}
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenChat(member);
                }}
                className="p-3.5 flex items-center justify-between hover:bg-slate-800/50 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm text-white group-hover:text-sky-400 transition truncate">
                          {member.name}
                        </span>
                        {member.isVerified && (
                          <span className="text-sky-400 text-xs">✓</span>
                        )}
                        {member.isPremium && (
                          <span className="text-sky-400 text-xs">★</span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 shrink-0 font-semibold">
                        Online
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-300 truncate pr-2">
                        {chatThread ? chatThread.lastMessage.text : `Connect & chat with @${member.username}`}
                      </p>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('medium');
                          onOpenChat(member);
                        }}
                        className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold flex items-center gap-1 shadow transition shrink-0 ml-2"
                      >
                        <Send className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
