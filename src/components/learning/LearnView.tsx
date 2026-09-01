import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, BookOpen, Sparkles, Lock, Play, FileText, ChevronRight } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { ContentCategory, ContentItem } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ContentDetailModal } from './ContentDetailModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SubscriptionModal } from '../common/SubscriptionModal';

interface LearnViewProps {
  onOpenPlans: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({ onOpenPlans }) => {
  const { hasActiveSubscription } = useAuth();
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const [showSubModal, setShowSubModal] = useState<boolean>(false);
  const [subModalTitle, setSubModalTitle] = useState<string>("Unlock Study Material");
  const [subModalDesc, setSubModalDesc] = useState<string>("Subscribe to Vedika LearnHub to access this premium study material.");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadContents();
  }, [selectedCategoryId, searchQuery]);

  // Realtime subscription for contents and categories (subscribed once with unique channel ID)
  useEffect(() => {
    const channelName = `learn-sync-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contents' }, () => {
        loadContents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_categories' }, () => {
        loadCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategoryId, searchQuery]);

  const loadCategories = async () => {
    try {
      const data = await dataService.getCategories();
      setCategories(data);
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  };

  const loadContents = async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getContentByCategory(selectedCategoryId, searchQuery);
      setContents(data);
    } catch (e) {
      console.error('Error loading contents:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Search Header */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes, formula banks, videos..."
          className="w-full bg-white border border-slate-200 focus:border-[#3157D5] text-slate-900 text-xs rounded-2xl pl-10 pr-4 py-3 outline-none placeholder:text-slate-400 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Pills (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategoryId === 'all'
              ? 'bg-[#3157D5] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Resources
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategoryId === cat.id
                ? 'bg-[#3157D5] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Content Items List */}
      {isLoading ? (
        <LoadingSkeleton type="card" count={4} />
      ) : contents.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No study materials found"
          description={
            searchQuery
              ? 'No results match your search keyword.'
              : 'Content will appear once published by Vedika educators.'
          }
        />
      ) : (
        <div className="space-y-3">
          {contents.map((item, idx) => {
            const isLocked = !hasActiveSubscription && (item.is_premium || item.access_type === 'subscriber');

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  if (isLocked) {
                    setSubModalTitle(`Unlock Study Material`);
                    setSubModalDesc(`Subscribe to Vedika LearnHub to access "${item.title}" and open all premium notes, formula banks, and videos.`);
                    setShowSubModal(true);
                  } else {
                    setSelectedContent(item);
                  }
                }}
                className="bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] shadow-xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail / Icon */}
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : item.youtube_url ? (
                      <Play className="w-6 h-6 text-red-500" />
                    ) : (
                      <FileText className="w-6 h-6 text-[#3157D5]" />
                    )}

                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                        <Lock className="w-4 h-4 text-amber-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#3157D5] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 truncate">
                        {item.category?.name || 'Study Material'}
                      </span>
                      {item.is_premium && (
                        <span className="text-[9px] font-extrabold uppercase bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5 shrink-0">
                          <Sparkles className="w-2 h-2 text-amber-500" /> VIP
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#3157D5] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.description || 'Tap to view resources and notes'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-slate-400 group-hover:text-[#3157D5] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Content Detail Modal */}
      <ContentDetailModal
        content={selectedContent}
        isOpen={Boolean(selectedContent)}
        onClose={() => setSelectedContent(null)}
        onOpenPlans={onOpenPlans}
      />

      <SubscriptionModal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        title={subModalTitle}
        description={subModalDesc}
      />
    </div>
  );
};
