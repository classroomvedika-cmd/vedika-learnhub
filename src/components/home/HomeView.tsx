import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, FileCheck, Calendar, MessageSquare, 
  Play, Lock, ChevronRight, Video, Bell, ArrowRight, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { ContentItem, Exam, RoutineItem, Announcement } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ContentDetailModal } from '../learning/ContentDetailModal';

interface HomeViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenPlans: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateTab,
  onOpenPlans,
}) => {
  const { profile, hasActiveSubscription, subscription, refreshProfile } = useAuth();
  const [featuredContent, setFeaturedContent] = useState<ContentItem[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [todayRoutine, setTodayRoutine] = useState<RoutineItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setIsLoading(true);
    try {
      const currentJsDay = new Date().getDay();
      const todayDayNum = currentJsDay === 0 ? 7 : currentJsDay;

      const [contents, exams, routine, anns] = await Promise.all([
        dataService.getContentByCategory('all'),
        dataService.getExams(),
        dataService.getRoutine(),
        dataService.getAnnouncements(),
      ]);

      setFeaturedContent((contents || []).slice(0, 4));
      setUpcomingExams((exams || []).slice(0, 2));
      setTodayRoutine((routine || []).filter((r) => Number(r.day_of_week) === todayDayNum).slice(0, 3));
      setAnnouncements((anns || []).slice(0, 2));
    } catch (e) {
      console.error('Home data load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const studentFirstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Scholar';

  return (
    <div className="space-y-4 pb-20 max-w-lg mx-auto">
      {/* 1. Header Greeting & Notice Board Quick Button */}
      <div className="bg-white border border-[#EAE6F4] rounded-3xl p-5 shadow-[0_4px_20px_rgba(49,44,81,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[12px] font-medium text-[#7D7696]">
              {getGreeting()},
            </span>
            <h2 className="text-xl font-extrabold text-[#312C51] truncate font-['Outfit']">
              {studentFirstName} 👋
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Notice Board Button */}
            <button
              type="button"
              id="btn-home-notice-board"
              onClick={() => onNavigateTab('notice-board')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#312C51] hover:bg-[#48426D] text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Bell className="w-3.5 h-3.5 text-[#F0C38E]" />
              <span>Notices</span>
            </button>
          </div>
        </div>

        {/* Subscription / Status Snapshot Strip */}
        <div className="mt-4 pt-4 border-t border-[#F5F3F9] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#48426D]">
            <span className="text-[#7D7696]">Plan:</span>
            <span className="font-bold text-[#312C51]">
              {hasActiveSubscription ? (subscription?.plan?.name || 'VIP Member') : 'Free Plan'}
            </span>
            {hasActiveSubscription && (
              <span className="inline-flex items-center text-[10px] text-white bg-[#48426D] px-2 py-0.5 rounded-full font-bold">
                Active
              </span>
            )}
          </div>

          {!hasActiveSubscription ? (
            <button
              type="button"
              id="btn-home-upgrade-link"
              onClick={onOpenPlans}
              className="text-xs font-bold text-[#F1AA9B] hover:text-[#F0C38E] flex items-center gap-1 active:scale-95 transition-colors"
            >
              Upgrade to VIP <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[12px] font-semibold text-[#7D7696]">
              Class {profile?.class_grade || '12'}
            </span>
          )}
        </div>
      </div>

      {/* 2. Primary Navigation Shortcuts */}
      <div className="grid grid-cols-4 gap-3">
        <button
          type="button"
          id="btn-home-vault"
          onClick={() => onNavigateTab('learn')}
          className="bg-white hover:bg-[#FAF9FC] border border-[#EAE6F4] rounded-3xl p-3 flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-xs group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3F9] border border-[#DDD6EE] flex items-center justify-center text-[#312C51] group-hover:scale-105 transition-transform mb-2">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#312C51]">Vault</span>
        </button>

        <button
          type="button"
          id="btn-home-exams"
          onClick={() => onNavigateTab('exams')}
          className="bg-white hover:bg-[#FAF9FC] border border-[#EAE6F4] rounded-3xl p-3 flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-xs group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3F9] border border-[#DDD6EE] flex items-center justify-center text-[#312C51] group-hover:scale-105 transition-transform mb-2">
            <FileCheck className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#312C51]">Exams</span>
        </button>

        <button
          type="button"
          id="btn-home-routine"
          onClick={() => onNavigateTab('routine')}
          className="bg-white hover:bg-[#FAF9FC] border border-[#EAE6F4] rounded-3xl p-3 flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-xs group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3F9] border border-[#DDD6EE] flex items-center justify-center text-[#312C51] group-hover:scale-105 transition-transform mb-2">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#312C51]">Routine</span>
        </button>

        <button
          type="button"
          id="btn-home-community"
          onClick={() => onNavigateTab('community')}
          className="bg-white hover:bg-[#FAF9FC] border border-[#EAE6F4] rounded-3xl p-3 flex flex-col items-center justify-center text-center transition-all active:scale-95 shadow-xs group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3F9] border border-[#DDD6EE] flex items-center justify-center text-[#312C51] group-hover:scale-105 transition-transform mb-2">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-[#312C51]">Doubts</span>
        </button>
      </div>

      {/* 3. Compact Notice Board Quick Action Banner */}
      <div
        onClick={() => onNavigateTab('notice-board')}
        className="bg-gradient-to-r from-[#312C51] via-[#48426D] to-[#312C51] rounded-3xl p-4 text-white flex items-center justify-between cursor-pointer shadow-sm hover:opacity-95 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0C38E] text-[#312C51] flex items-center justify-center shrink-0 font-bold shadow-xs">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold tracking-wide uppercase font-['Outfit']">
                NOTICE BOARD
              </h3>
              {announcements.length > 0 && (
                <span className="bg-[#F1AA9B] text-[#312C51] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {announcements.length} New
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#DDD6EE] font-medium mt-0.5 line-clamp-1">
              {announcements[0]?.title || 'View official announcements, exam updates & notices'}
            </p>
          </div>
        </div>
        <span className="text-xs font-extrabold text-[#F0C38E] shrink-0 pl-2">
          View All →
        </span>
      </div>

      {/* 4. Today's Classes */}
      {todayRoutine.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#3157D5]" /> Today's Schedule
            </h3>
            <button
              type="button"
              id="btn-home-all-routine"
              onClick={() => onNavigateTab('routine')}
              className="text-[11px] text-[#3157D5] hover:text-blue-700 font-semibold"
            >
              Full Routine →
            </button>
          </div>

          <div className="space-y-1.5">
            {todayRoutine.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#3157D5] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                      {item.subject}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {item.topic || `${item.subject} Class`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {item.start_time} - {item.end_time} {item.teacher_name ? `• ${item.teacher_name}` : ''}
                  </div>
                </div>

                {item.room_link && (
                  <button
                    type="button"
                    onClick={() => window.open(item.room_link, '_blank', 'noopener,noreferrer')}
                    className="p-2 bg-[#3157D5] hover:bg-blue-700 text-white rounded-xl text-xs font-medium shrink-0 transition-colors active:scale-95 shadow-xs"
                    title="Join class"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Featured / Recent Study Materials */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#3157D5]" /> Featured Notes & Materials
          </h3>
          <button
            type="button"
            id="btn-home-all-materials"
            onClick={() => onNavigateTab('learn')}
            className="text-[11px] text-[#3157D5] hover:text-blue-700 font-semibold"
          >
            Browse All →
          </button>
        </div>

        {isLoading ? (
          <LoadingSkeleton type="card" count={2} />
        ) : featuredContent.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center text-xs text-slate-500 shadow-xs">
            No study materials published yet.
          </div>
        ) : (
          <div className="space-y-1.5">
            {featuredContent.map((item) => {
              const isLocked = item.is_premium && !hasActiveSubscription;

              return (
                <div
                  key={item.id}
                  id={`home-content-item-${item.id}`}
                  onClick={() => setSelectedContent(item)}
                  className="bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-colors active:scale-[0.99] gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[#3157D5] relative overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {isLocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock className="w-3 h-3 text-amber-300" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-[#3157D5] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                          {item.category?.name || 'Notes'}
                        </span>
                        {item.is_premium && (
                          <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                            VIP
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 truncate mt-0.5">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.description || 'Tap to view full lecture and study resources'}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Upcoming Mock Tests */}
      {upcomingExams.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Upcoming Mock Tests
            </h3>
            <button
              type="button"
              id="btn-home-all-exams"
              onClick={() => onNavigateTab('exams')}
              className="text-[11px] text-[#3157D5] hover:text-blue-700 font-semibold"
            >
              All Tests →
            </button>
          </div>

          <div className="space-y-1.5">
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                id={`home-exam-${exam.id}`}
                onClick={() => onNavigateTab('exams')}
                className="bg-white hover:bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-colors shadow-xs"
              >
                <div>
                  <span className="text-[9px] font-bold text-[#3157D5] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                    {exam.subject}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-900 mt-0.5">{exam.title}</h4>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {exam.duration_minutes} Mins • {exam.total_marks} Marks
                  </div>
                </div>

                <button
                  type="button"
                  className="px-2.5 py-1.5 bg-[#3157D5] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Detail Modal */}
      <ContentDetailModal
        content={selectedContent}
        isOpen={Boolean(selectedContent)}
        onClose={() => setSelectedContent(null)}
        onOpenPlans={onOpenPlans}
      />
    </div>
  );
};
