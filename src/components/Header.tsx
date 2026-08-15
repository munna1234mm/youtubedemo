import React, { useState, useRef, useEffect } from 'react';
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
  UploadCloud,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { User, TabType } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface HeaderProps {
  currentUser: User | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unreadMessagesCount: number;
  unreadNotifsCount: number;
  onOpenStarsModal: () => void;
  onOpenVideoStorage: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
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
  onOpenAuthModal,
  onLogout,
  isFrameMode,
  setIsFrameMode,
  searchQuery,
  setSearchQuery,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search TeleBook..."
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800 border border-slate-700/60 focus:border-sky-500 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-400 transition-all focus:outline-none focus:ring-1 focus:ring-sky-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Search Popup */}
            {isSearchOpen && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-400 border-b border-slate-700/60 mb-1">
                  <span>Quick Results</span>
                  <button onClick={() => setIsSearchOpen(false)} className="hover:text-white">Close</button>
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
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Upload Reel</span>
          </button>

          {/* Telegram Stars Balance Pill */}
          {currentUser && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                onOpenStarsModal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span>{currentUser.starsCount.toLocaleString()}</span>
            </button>
          )}

          {/* TeleMessenger Shortcut */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('messenger');
            }}
            className={`p-2 rounded-full border transition relative ${
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

          {/* Log Out Button (Prominent & Quick) */}
          {currentUser && onLogout && (
            <button
              onClick={() => {
                triggerHaptic('warning');
                onLogout();
              }}
              className="p-2 rounded-full bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Account / Profile Dropdown */}
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsAccountMenuOpen(!isAccountMenuOpen);
                }}
                className="flex items-center gap-1 focus:outline-none"
                title="Account Menu"
              >
                <div className="relative">
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
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Account Dropdown Menu */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 py-1.5 text-xs divide-y divide-slate-700/60 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2">
                    <p className="font-bold text-white truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">@{currentUser.username}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsAccountMenuOpen(false);
                        triggerHaptic('selection');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-700 text-left"
                    >
                      <UserIcon className="w-4 h-4 text-sky-400" />
                      <span>My Profile</span>
                    </button>

                    {onOpenAuthModal && (
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          triggerHaptic('medium');
                          onOpenAuthModal();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-700 text-left"
                      >
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>Switch Account / Sign In</span>
                      </button>
                    )}
                  </div>

                  {onLogout && (
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          triggerHaptic('warning');
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 text-left font-bold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            onOpenAuthModal && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenAuthModal();
                }}
                className="px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition"
              >
                Sign In
              </button>
            )
          )}

        </div>
      </div>
    </header>
  );
};
