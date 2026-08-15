import React, { useState } from 'react';
import { 
  Search, 
  MessageCircle, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  X,
  Send,
  User as UserIcon,
  Store,
  Users,
  Compass,
  UploadCloud
} from 'lucide-react';
import { User, TabType } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface HeaderProps {
  currentUser: User;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unreadMessagesCount: number;
  unreadNotifsCount: number;
  onOpenStarsModal: () => void;
  onOpenVideoStorage: () => void;
  isFrameMode: boolean;
  setIsFrameMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  unreadMessagesCount,
  onOpenStarsModal,
  onOpenVideoStorage,
  isFrameMode,
  setIsFrameMode,
  searchQuery,
  setSearchQuery,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white transition-all">
      <div className="max-w-4xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2.5">
        
        {/* Left: Logo & Search */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('feed');
            }}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-lg text-white font-['Outfit'] tracking-tighter">TB</span>
            </div>
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
                TeleBook
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">TMA</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Telegram Social</span>
            </div>
          </button>

          {/* Search Bar */}
          <div className="relative flex-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search TeleBook..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchOpen(true);
                  triggerHaptic('selection');
                }}
                className="w-full bg-slate-800/90 text-sm text-slate-100 placeholder-slate-400 rounded-full pl-9 pr-8 py-1.5 border border-slate-700/60 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Search Dropdown */}
            {isSearchOpen && searchQuery.trim().length > 0 && (
              <div 
                className="absolute left-0 right-0 top-full mt-1.5 bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-400 border-b border-slate-700/50 mb-1">
                  <span>Quick Results for "{searchQuery}"</span>
                  <button 
                    onClick={() => setIsSearchOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab('feed');
                      setIsSearchOpen(false);
                      triggerHaptic('selection');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-700/70 transition"
                  >
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>Search posts containing "{searchQuery}"</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('marketplace');
                      setIsSearchOpen(false);
                      triggerHaptic('selection');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-700/70 transition"
                  >
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span>Find items in Marketplace for "{searchQuery}"</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('groups');
                      setIsSearchOpen(false);
                      triggerHaptic('selection');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-200 hover:bg-slate-700/70 transition"
                  >
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Discover Telegram groups matching "{searchQuery}"</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Upload Reel Button */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenVideoStorage();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/40 text-sky-300 hover:text-white hover:border-sky-400 text-xs font-bold transition shadow-sm"
            title="Upload Reel & Video"
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Upload Reel</span>
          </button>

          {/* TG Stars Wallet Button */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenStarsModal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-500/40 text-amber-300 hover:border-yellow-400 text-xs font-bold transition shadow-sm cursor-pointer"
            title="Telegram Stars Balance"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse fill-yellow-400" />
            <span>{currentUser.starsCount.toLocaleString()}</span>
            <span className="text-[10px] font-medium text-yellow-400/80 hidden xs:inline">Stars</span>
          </button>

          {/* Messenger Shortcut */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('messenger');
            }}
            className={`relative p-2 rounded-full border transition ${
              activeTab === 'messenger'
                ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="TeleMessenger"
          >
            <MessageCircle className="w-4 h-4" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          {/* Toggle Device Frame Simulation */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsFrameMode((prev: boolean) => !prev);
            }}
            className={`p-2 rounded-full border transition hidden md:flex items-center justify-center ${
              isFrameMode
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                : 'bg-slate-800/80 border-slate-700/70 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title={isFrameMode ? "Switch to Fullscreen Mini App" : "Preview in Telegram Phone Frame"}
          >
            {isFrameMode ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>

          {/* Profile Avatar Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('profile');
            }}
            className="relative rounded-full focus:outline-none"
            title="My Profile"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className={`w-8 h-8 rounded-full object-cover border-2 transition-all ${
                activeTab === 'profile'
                  ? 'border-sky-400 ring-2 ring-sky-500/30'
                  : 'border-slate-700 hover:border-slate-500'
              }`}
            />
            {currentUser.isPremium && (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-sky-500 text-[8px] font-bold text-white flex items-center justify-center border border-slate-900">
                ★
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
};
