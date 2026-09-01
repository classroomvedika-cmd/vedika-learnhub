import React from 'react';
import { motion } from 'motion/react';
import { Home, BookOpen, FileCheck, MessageSquare, User } from 'lucide-react';

export type NavTab = 'home' | 'learn' | 'exams' | 'community' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'exams', label: 'Exams', icon: FileCheck },
    { id: 'community', label: 'Community', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9FC]/95 backdrop-blur-xl border-t border-[#EAE6F4] px-2 py-1.5 pb-safe shadow-[0_-4px_20px_rgba(49,44,81,0.05)]">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              type="button"
              id={`nav-tab-${tab.id}`}
              key={tab.id}
              onClick={() => onTabChange(tab.id as NavTab)}
              aria-label={`Navigate to ${tab.label}`}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 active:scale-95 select-none focus:outline-none ${
                isActive ? 'text-[#312C51]' : 'text-[#7D7696] hover:text-[#312C51]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 bg-[#EFEBF8] border border-[#DDD6EE] rounded-2xl -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'text-[#312C51] scale-105 stroke-[2.4]'
                      : 'text-[#7D7696] stroke-[1.8]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#F0C38E]" />
                )}
              </div>

              <span
                className={`text-[11px] mt-1 tracking-tight transition-colors duration-200 ${
                  isActive ? 'text-[#312C51] font-extrabold' : 'text-[#7D7696] font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
