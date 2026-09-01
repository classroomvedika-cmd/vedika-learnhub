import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, ExternalLink, Download, FileText, Play, ShieldAlert, Sparkles } from 'lucide-react';
import { ContentItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ContentDetailModalProps {
  content: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPlans: () => void;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  content,
  isOpen,
  onClose,
  onOpenPlans,
}) => {
  const { hasActiveSubscription } = useAuth();

  if (!isOpen || !content) return null;

  const isLocked = content.is_premium && !hasActiveSubscription;

  // Convert YouTube URLs to embed format
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
      if (url.includes('embed/')) return url;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const embedUrl = getYouTubeEmbedUrl(content.youtube_url);

  const getButtonIcon = (type?: string, label?: string) => {
    const l = (label || '').toLowerCase();
    if (type === 'pdf' || l.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type === 'download' || l.includes('download')) return <Download className="w-4 h-4" />;
    if (type === 'video' || l.includes('watch') || l.includes('class')) return <Play className="w-4 h-4" />;
    return <ExternalLink className="w-4 h-4" />;
  };

  const handleOpenLink = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          className="w-full max-w-lg h-full sm:h-[88vh] bg-white border border-slate-200 rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl text-slate-900"
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#3157D5] px-2 py-0.5 rounded border border-blue-200/60">
                {content.category?.name || 'Learning Vault'}
              </span>
              {content.is_premium && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" /> VIP
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
            {/* YouTube Player or Cover Image */}
            {embedUrl && !isLocked ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-md">
                <iframe
                  src={embedUrl}
                  title={content.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : content.image_url ? (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={content.image_url}
                  alt={content.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {isLocked && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                    <Lock className="w-8 h-8 text-amber-300 mb-2" />
                    <p className="text-xs font-bold text-white">Premium Content Locked</p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Title & Description */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-snug">{content.title}</h2>
              {content.description && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {content.description}
                </p>
              )}
            </div>

            {/* Premium Lock Banner if student is not subscribed */}
            {isLocked ? (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">VIP Membership Required</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                    This material is reserved for active Vedika LearnHub subscribers.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenPlans();
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-[#3157D5] to-[#6C63D9] hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
                >
                  View Subscription Plans
                </button>
              </div>
            ) : (
              /* Custom Content Buttons from Supabase (content_buttons) */
              content.buttons && content.buttons.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Attached Resources & Links
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {content.buttons.map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => handleOpenLink(btn.url)}
                        className="w-full py-3 px-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-800 hover:text-[#3157D5] text-xs font-semibold rounded-xl flex items-center justify-between transition-all active:scale-[0.98] shadow-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[#3157D5]">{getButtonIcon(btn.button_type, btn.label)}</span>
                          <span>{btn.label}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
