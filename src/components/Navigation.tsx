import React from 'react';
import { 
  Home, 
  Clapperboard, 
  Store, 
  Users, 
  Bell, 
  MessageSquareQuote,
  User as UserIcon 
} from 'lucide-react';
import { TabType } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  unreadNotifsCount: number;
  unreadMessagesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  unreadNotifsCount,
  unreadMessagesCount,
}) => {
  const tabs = [
    {
      id: 'feed' as TabType,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'reels' as TabType,
      label: 'Reels',
      icon: Clapperboard,
      badge: 'NEW',
    },
    {
      id: 'marketplace' as TabType,
      label: 'Market',
      icon: Store,
    },
    {
      id: 'groups' as TabType,
      label: 'Groups',
      icon: Users,
    },
    {
      id: 'notifications' as TabType,
      label: 'Alerts',
      icon: Bell,
      count: unreadNotifsCount,
    },
    {
      id: 'profile' as TabType,
      label: 'Menu',
      icon: UserIcon,
    },
  ];

  return (
    <nav className="sticky top-[53px] z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab(tab.id);
              }}
              className={`relative flex-1 py-2.5 sm:py-3 flex flex-col items-center justify-center transition-all group cursor-pointer ${
                isActive ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${
                  isActive ? 'scale-110 stroke-[2.4px]' : 'group-hover:scale-105'
                }`} />

                {/* Badge count */}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-slate-900 min-w-[16px] text-center">
                    {tab.count}
                  </span>
                )}

                {/* Pill tag */}
                {tab.badge && (
                  <span className="absolute -top-2 -right-3 px-1 py-0.2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] font-extrabold rounded-full scale-90 tracking-wider">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] mt-1 tracking-tight hidden xs:block">
                {tab.label}
              </span>

              {/* Active Indicator Bar */}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-sky-400 to-blue-500 rounded-t-full shadow-sm shadow-sky-400/50"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
