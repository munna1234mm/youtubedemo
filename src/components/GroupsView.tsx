import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Sparkles, 
  Check, 
  Plus, 
  Radio, 
  MessageSquare, 
  Share2, 
  Globe, 
  ExternalLink 
} from 'lucide-react';
import { Group, User } from '../types';
import { triggerHaptic, fireConfetti, shareToTelegram } from '../utils/telegram';

interface GroupsViewProps {
  groups: Group[];
  currentUser: User;
  onToggleJoinGroup: (groupId: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  currentUser,
  onToggleJoinGroup,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [groupPostText, setGroupPostText] = useState('');

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'my' && g.isJoined);
    return matchesSearch && matchesTab;
  });

  const handleShareGroup = (group: Group) => {
    triggerHaptic('medium');
    shareToTelegram(
      window.location.href,
      `Join the "${group.name}" community on TeleBook!\n@${group.handle}`
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Telegram Communities & Groups</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect with web3 builders, designers, and creators directly inside Telegram
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('all');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Explore All
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActiveTab('my');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === 'my'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Groups
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search Telegram groups, handles, or topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between hover:border-slate-700 transition"
          >
            {/* Cover Image */}
            <div className="relative h-28 w-full bg-slate-800 overflow-hidden">
              <img
                src={group.coverImage}
                alt={group.name}
                className="w-full h-full object-cover brightness-75"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-slate-200 border border-white/10">
                {group.category}
              </div>
            </div>

            {/* Content & Avatar */}
            <div className="p-3.5 pt-0 relative flex-1 flex flex-col justify-between">
              
              {/* Group Avatar Floating */}
              <div className="-mt-7 mb-2 flex items-end justify-between">
                <img
                  src={group.avatar}
                  alt={group.name}
                  className="w-14 h-14 rounded-2xl object-cover border-3 border-slate-900 shadow-xl bg-slate-800"
                />
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onToggleJoinGroup(group.id);
                    if (!group.isJoined) fireConfetti();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                    group.isJoined
                      ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-rose-500/50 hover:text-rose-400'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-110'
                  }`}
                >
                  {group.isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Joined</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Join Group</span>
                    </>
                  )}
                </button>
              </div>

              {/* Info */}
              <div>
                <h3 className="text-sm font-bold text-white hover:text-purple-400 transition cursor-pointer">
                  {group.name}
                </h3>
                <span className="text-[11px] font-semibold text-purple-400">
                  @{group.handle}
                </span>
                <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                  {group.description}
                </p>
              </div>

              {/* Footer details */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span>{(group.membersCount).toLocaleString()} members</span>
                  <span>•</span>
                  <span>{group.postsCount} posts</span>
                </div>
                <button
                  onClick={() => handleShareGroup(group)}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Share Group"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
