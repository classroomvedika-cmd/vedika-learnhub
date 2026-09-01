import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Pin, Calendar, ExternalLink, RefreshCw, Megaphone } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Post } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { supabase } from '../../lib/supabase';

export const NoticeBoardView: React.FC = () => {
  const [notices, setNotices] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadNoticeBoardData();

    // Supabase Realtime listener on posts/announcements
    const channel = supabase
      .channel('noticeboard-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadNoticeBoardData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNoticeBoardData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const posts = await dataService.getPosts();
      setNotices(posts);
    } catch (e) {
      console.error('Error fetching Notice Board posts:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const pinnedNotices = notices.filter((n) => n.is_pinned);
  const regularNotices = notices.filter((n) => !n.is_pinned);

  return (
    <div className="space-y-4 pb-20 max-w-lg mx-auto">
      {/* Notice Board Header */}
      <div className="bg-white border border-[#EAE6F4] rounded-3xl p-5 shadow-[0_4px_20px_rgba(49,44,81,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#312C51] flex items-center justify-center text-[#F0C38E] shadow-sm">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#312C51] font-['Outfit'] tracking-wide">
                  NOTICE BOARD
                </h2>
                {isRefreshing && (
                  <span className="text-[10px] text-[#48426D] bg-[#F5F3F9] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-[#DDD6EE]">
                    <RefreshCw className="w-3 h-3 animate-spin text-[#312C51]" /> Updating
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7D7696] font-medium">
                Official institute announcements, exam schedules & updates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadNoticeBoardData()}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-2xl bg-[#F5F3F9] hover:bg-[#DDD6EE] text-[#312C51] transition-colors"
            title="Refresh Notice Board"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton type="card" count={3} />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No notices published yet"
          description="Check back soon for official announcements, exam updates, and class routines from the administration."
        />
      ) : (
        <div className="space-y-4">
          {/* Pinned Notices Section */}
          {pinnedNotices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 px-1">
                <Pin className="w-3.5 h-3.5 text-[#F0C38E] fill-[#F0C38E]" />
                <h3 className="text-xs font-bold text-[#312C51] uppercase tracking-wider">
                  Pinned Announcements ({pinnedNotices.length})
                </h3>
              </div>

              <div className="space-y-3">
                {pinnedNotices.map((notice) => (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-[#312C51] rounded-3xl p-5 shadow-md relative overflow-hidden space-y-3"
                  >
                    {/* Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#312C51] bg-[#F0C38E] px-2.5 py-1 rounded-full shadow-xs">
                        <Pin className="w-3 h-3 fill-[#312C51]" /> PINNED NOTICE
                      </span>
                      <span className="text-[10px] font-bold text-[#7D7696] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(notice.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-[#312C51] font-['Outfit'] leading-snug">
                      {notice.title}
                    </h4>

                    {/* Notice Description / Content */}
                    <p className="text-xs text-[#48426D] whitespace-pre-line leading-relaxed">
                      {notice.content}
                    </p>

                    {/* Optional Image */}
                    {notice.image_url && (
                      <div className="rounded-2xl overflow-hidden border border-[#EAE6F4] bg-[#F5F3F9]">
                        <img
                          src={notice.image_url}
                          alt={notice.title}
                          className="w-full max-h-64 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Notice Buttons / Links */}
                    {notice.buttons && notice.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F5F3F9]">
                        {notice.buttons.map((btn) => (
                          <a
                            key={btn.id || btn.label}
                            href={btn.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#312C51] hover:bg-[#48426D] text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
                          >
                            <span>{btn.label}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#F0C38E]" />
                          </a>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Notices */}
          {regularNotices.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1.5 px-1">
                <Bell className="w-3.5 h-3.5 text-[#48426D]" />
                <h3 className="text-xs font-bold text-[#312C51] uppercase tracking-wider">
                  Recent Notices
                </h3>
              </div>

              <div className="space-y-3">
                {regularNotices.map((notice) => (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-[#EAE6F4] hover:border-[#DDD6EE] rounded-3xl p-4 shadow-xs space-y-2.5 transition-all"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-sm font-bold text-[#312C51] font-['Outfit'] leading-snug">
                        {notice.title}
                      </h4>
                      <span className="text-[10px] font-semibold text-[#7D7696] shrink-0 bg-[#F5F3F9] px-2 py-0.5 rounded-full">
                        {new Date(notice.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-[#48426D] whitespace-pre-line leading-relaxed">
                      {notice.content}
                    </p>

                    {notice.image_url && (
                      <div className="rounded-2xl overflow-hidden border border-[#EAE6F4] bg-[#F5F3F9]">
                        <img
                          src={notice.image_url}
                          alt={notice.title}
                          className="w-full max-h-56 object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {notice.buttons && notice.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F5F3F9]">
                        {notice.buttons.map((btn) => (
                          <a
                            key={btn.id || btn.label}
                            href={btn.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F5F3F9] hover:bg-[#DDD6EE] text-[#312C51] text-xs font-bold transition-all active:scale-95"
                          >
                            <span>{btn.label}</span>
                            <ExternalLink className="w-3 h-3 text-[#48426D]" />
                          </a>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
