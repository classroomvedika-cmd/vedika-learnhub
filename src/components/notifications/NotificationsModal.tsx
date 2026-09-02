import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCheck, X, Sparkles, AlertCircle, Info, Calendar } from 'lucide-react';
import { Notification } from '../../types';
import { dataService } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../common/EmptyState';
import { supabase } from '../../lib/supabase';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    loadNotifications();

    const channelName = `notif-modal-sync-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await dataService.getNotifications(user.id);
      setNotifications(data);
    } catch (e) {
      console.error('Error loading notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await dataService.markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (refreshNotificationsCount) await refreshNotificationsCount();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.98 }}
          className="w-full max-w-lg h-full sm:h-[85vh] bg-[#F7F9FC] border border-slate-200 rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#3157D5]" />
              <h3 className="font-extrabold text-sm text-slate-900">NOTIFICATIONS</h3>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.is_read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#3157D5] hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
            {isLoading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="All caught up!"
                description="You'll be notified when new classes, mock tests, or announcements are published."
              />
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) {
                      dataService.markNotificationAsRead(notif.id);
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
                      );
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 shadow-xs relative group ${
                    notif.is_read
                      ? 'bg-white border-slate-200/70 text-slate-600'
                      : 'bg-white border-blue-300 ring-1 ring-blue-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#3157D5] shrink-0" />
                      )}
                      {notif.title}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400">
                        {new Date(notif.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 pr-4">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
