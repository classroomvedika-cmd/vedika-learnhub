import React, { useState, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { TopHeader } from './components/common/TopHeader';
import { BottomNav } from './components/common/BottomNav';
import { AuthView } from './components/auth/AuthView';
import { AuthCallback } from './components/auth/AuthCallback';
import { HomeView } from './components/home/HomeView';
import { LearnView } from './components/learning/LearnView';
import { ExamsView } from './components/exams/ExamsView';
import { RoutineView } from './components/routine/RoutineView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { CommunityView } from './components/community/CommunityView';
import { ProfileView } from './components/profile/ProfileView';
import { NoticeBoardView } from './components/noticeboard/NoticeBoardView';
import { PlansModal } from './components/subscription/PlansModal';
import { NotificationsModal } from './components/notifications/NotificationsModal';
import { GraduationCap, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const MainAppLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [isPlansModalOpen, setIsPlansModalOpen] = useState<boolean>(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const mainContentRef = useRef<HTMLElement>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  };

  // Check if current URL is an auth verification callback
  const [isAuthCallbackRoute, setIsAuthCallbackRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search;
    const hash = window.location.hash;
    return (
      path.includes('/auth/callback') ||
      search.includes('code=') ||
      hash.includes('access_token=') ||
      hash.includes('type=signup') ||
      hash.includes('type=recovery') ||
      hash.includes('type=invite') ||
      search.includes('error=') ||
      hash.includes('error=')
    );
  });

  if (isAuthCallbackRoute) {
    return <AuthCallback onComplete={() => setIsAuthCallbackRoute(false)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#312C51] flex flex-col items-center justify-center p-6 text-center text-white">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 rounded-2xl bg-[#48426D]/50 border border-[#F0C38E]/30 p-2 shadow-2xl mb-4 flex items-center justify-center backdrop-blur-md"
        >
          <img
            src="https://cdn.phototourl.com/free/2026-08-31-cde583fc-08b8-47ee-ab02-63114e29ce8d.png"
            alt="Vedika LearnHub Logo"
            className="w-full h-full object-contain rounded-xl"
          />
        </motion.div>
        <h1 className="text-xl font-black text-white font-['Outfit'] tracking-wider">
          VEDIKA LEARNHUB
        </h1>
        <p className="text-xs text-[#F0C38E] mt-1 font-bold">Connecting to live student hub...</p>
        <Loader2 className="w-5 h-5 text-[#F0C38E] animate-spin mt-4" />
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-[#1E1B31] text-[#172033] flex justify-center">
      {/* Mobile-first responsive wrapper */}
      <div className="w-full max-w-lg min-h-screen bg-[#F5F3F9] border-x border-[#EAE6F4] shadow-2xl flex flex-col relative overflow-hidden">
        {/* Top Header */}
        {activeTab !== 'community' && (
          <TopHeader
            onOpenNotifications={() => setIsNotifModalOpen(true)}
            onOpenProfile={() => setActiveTab('profile')}
            onOpenPlans={() => setIsPlansModalOpen(true)}
          />
        )}

        {/* Main Body with Tab Switching */}
        <main
          ref={mainContentRef}
          className={
            activeTab === 'community'
              ? 'flex-1 overflow-hidden h-screen flex flex-col relative'
              : 'flex-1 p-4 overflow-y-auto custom-scrollbar min-h-[calc(100vh-130px)]'
          }
        >
          <ErrorBoundary fallbackTitle="Error loading this tab">
            <div key={activeTab} className="h-full transition-opacity duration-150 animate-fadeIn">
              {activeTab === 'home' && (
                <HomeView
                  onNavigateTab={handleTabChange}
                  onOpenPlans={() => setIsPlansModalOpen(true)}
                />
              )}
              {activeTab === 'notice-board' && <NoticeBoardView />}
              {activeTab === 'learn' && (
                <LearnView onOpenPlans={() => setIsPlansModalOpen(true)} />
              )}
              {activeTab === 'exams' && (
                <ExamsView onOpenPlans={() => setIsPlansModalOpen(true)} />
              )}
              {activeTab === 'routine' && <RoutineView />}
              {activeTab === 'leaderboard' && <LeaderboardView />}
              {activeTab === 'community' && (
                <CommunityView onBack={() => handleTabChange('home')} />
              )}
              {activeTab === 'profile' && (
                <ProfileView onOpenPlans={() => setIsPlansModalOpen(true)} />
              )}
            </div>
          </ErrorBoundary>
        </main>

        {/* Bottom Navigation */}
        {activeTab !== 'community' && (
          <BottomNav
            currentTab={
              ['home', 'learn', 'exams', 'community', 'profile'].includes(activeTab)
                ? (activeTab as any)
                : 'home'
            }
            onTabChange={handleTabChange}
          />
        )}

        {/* Global Modals */}
        <PlansModal
          isOpen={isPlansModalOpen}
          onClose={() => setIsPlansModalOpen(false)}
        />

        <NotificationsModal
          isOpen={isNotifModalOpen}
          onClose={() => setIsNotifModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainAppLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
