import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Headphones,
  HelpCircle,
  Users,
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  User,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  Clock,
  MessageCircle,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { authService } from '../../services/authService';
import { GroupMessage, PrivateMessage, Doubt, DoubtReply } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { supabase } from '../../lib/supabase';
import { SubscriptionModal } from '../common/SubscriptionModal';
import { Lock } from 'lucide-react';

type CommunityScreen = 'landing' | 'community-chat' | 'help-desk' | 'doubts';

export const CommunityView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user, profile, hasActiveSubscription } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<CommunityScreen>('landing');

  // Subscription modal states
  const [showSubModal, setShowSubModal] = useState<boolean>(false);
  const [subModalTitle, setSubModalTitle] = useState<string>("Unlock Community Hub");
  const [subModalDesc, setSubModalDesc] = useState<string>("Subscribe to Vedika LearnHub to access active student chats and doubts solving.");

  // Group Messages State
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupInput, setGroupInput] = useState('');
  const [isSendingGroup, setIsSendingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Private Messages State (Help Desk)
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [privateInput, setPrivateInput] = useState('');
  const [isSendingPrivate, setIsSendingPrivate] = useState(false);
  const [privateError, setPrivateError] = useState<string | null>(null);

  // Doubts State
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [isNewDoubtModalOpen, setIsNewDoubtModalOpen] = useState(false);
  const [doubtTitle, setDoubtTitle] = useState('');
  const [doubtSubject, setDoubtSubject] = useState('Physics');
  const [doubtDesc, setDoubtDesc] = useState('');
  const [doubtImageFile, setDoubtImageFile] = useState<File | null>(null);
  const [doubtImagePreview, setDoubtImagePreview] = useState<string | null>(null);
  const [isCreatingDoubt, setIsCreatingDoubt] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Delete Group Message Modal State
  const [messageToDelete, setMessageToDelete] = useState<GroupMessage | null>(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  // Delete Doubt Modal State
  const [doubtToDelete, setDoubtToDelete] = useState<Doubt | null>(null);
  const [isDeletingDoubt, setIsDeletingDoubt] = useState(false);
  const [doubtFeedback, setDoubtFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat view
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [groupMessages, privateMessages, selectedDoubt?.replies]);

  // Load screen data
  useEffect(() => {
    if (currentScreen === 'landing') return;
    loadScreenData();
  }, [currentScreen, user?.id]);

  // Realtime Supabase Subscriptions
  useEffect(() => {
    const channelName = `community-realtime-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, (payload) => {
        const raw = payload.new as any;
        const normalized: GroupMessage = {
          id: raw.id,
          sender_id: raw.sender_uid || raw.sender_id,
          sender_uid: raw.sender_uid || raw.sender_id,
          sender_name: raw.sender_name || 'Student',
          message: raw.message,
          created_at: raw.created_at,
        };
        setGroupMessages((prev) => (prev.some((m) => m.id === normalized.id) ? prev : [...prev, normalized]));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_messages' }, (payload) => {
        const deletedId = payload.old?.id;
        if (deletedId) {
          setGroupMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const raw = payload.new as any;
        const senderUid = raw.sender_uid || raw.sender_id;
        const receiverUid = raw.receiver_uid || raw.receiver_id;

        if (user && (senderUid === user.id || receiverUid === user.id)) {
          const normalized: PrivateMessage = {
            id: raw.id,
            sender_id: senderUid,
            sender_uid: senderUid,
            receiver_id: receiverUid,
            receiver_uid: receiverUid,
            sender_name: senderUid === user.id ? 'You' : 'Vedika Support',
            message: raw.message,
            created_at: raw.created_at,
          };
          setPrivateMessages((prev) => (prev.some((m) => m.id === normalized.id) ? prev : [...prev, normalized]));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doubts' }, () => {
        dataService.getDoubts().then(setDoubts);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadScreenData = async () => {
    setIsLoading(true);
    setGroupError(null);
    setPrivateError(null);
    try {
      if (currentScreen === 'community-chat') {
        const msgs = await dataService.getGroupMessages();
        setGroupMessages(msgs);
      } else if (currentScreen === 'help-desk' && user?.id) {
        const privMsgs = await dataService.getPrivateMessages(user.id);
        setPrivateMessages(privMsgs);
      } else if (currentScreen === 'doubts') {
        const doubtList = await dataService.getDoubts();
        setDoubts(doubtList);
      }
    } catch (e: any) {
      console.error('Error loading community screen:', e);
    } fontally: {
      setIsLoading(false);
    }
  };

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupError(null);
    if (!groupInput.trim() || !user || isSendingGroup) return;

    try {
      setIsSendingGroup(true);
      const sentMsg = await dataService.sendGroupMessage({
        sender_name: profile?.full_name || profile?.name || 'Student',
        message: groupInput.trim(),
      });
      setGroupMessages((prev) => (prev.some((m) => m.id === sentMsg.id) ? prev : [...prev, sentMsg]));
      setGroupInput('');
    } catch (err: any) {
      console.error('[COMMUNITY_SEND_FAILED]', err);
      setGroupError(err?.message || 'Failed to send message to community chat.');
    } finally {
      setIsSendingGroup(false);
    }
  };

  const handleSendPrivateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrivateError(null);
    if (!privateInput.trim() || !user || isSendingPrivate) return;

    try {
      setIsSendingPrivate(true);
      const sentMsg = await dataService.sendPrivateMessage({
        message: privateInput.trim(),
      });
      setPrivateMessages((prev) => (prev.some((m) => m.id === sentMsg.id) ? prev : [...prev, sentMsg]));
      setPrivateInput('');
    } catch (err: any) {
      console.error('[HELPDESK_SEND_FAILED]', err);
      setPrivateError(err?.message || 'Failed to send private support message.');
    } finally {
      setIsSendingPrivate(false);
    }
  };

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtTitle.trim() || !doubtDesc.trim() || !user || isCreatingDoubt) return;

    try {
      setIsCreatingDoubt(true);
      let uploadedImageUrl: string | undefined;

      if (doubtImageFile) {
        uploadedImageUrl = await authService.uploadImageToImgBB(doubtImageFile);
      }

      const formattedText = `[${doubtSubject}] ${doubtTitle.trim()}\n${doubtDesc.trim()}`;

      await dataService.createDoubt({
        student_uid: user.id,
        text: formattedText,
        image_url: uploadedImageUrl,
      });

      setDoubtTitle('');
      setDoubtDesc('');
      setDoubtImageFile(null);
      setDoubtImagePreview(null);
      setIsNewDoubtModalOpen(false);
      const updatedDoubts = await dataService.getDoubts();
      setDoubts(updatedDoubts);
    } catch (err: any) {
      console.error('Error creating doubt:', err);
      alert(err?.message || 'Could not submit doubt. Please check your image format or connection.');
    } finally {
      setIsCreatingDoubt(false);
    }
  };

  const handleSendDoubtReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedDoubt || !user || isSendingReply) return;

    try {
      setIsSendingReply(true);
      const newReply = await dataService.addDoubtReply({
        doubt_id: selectedDoubt.id,
        sender_id: user.id,
        sender_name: profile?.full_name || 'Student',
        sender_role: profile?.role || 'student',
        message: replyInput.trim(),
      });

      setSelectedDoubt((prev) =>
        prev
          ? {
              ...prev,
              replies: [...(prev.replies || []), newReply],
            }
          : null
      );
      setReplyInput('');
      const updatedDoubts = await dataService.getDoubts();
      setDoubts(updatedDoubts);
    } catch (err: any) {
      console.error('Error adding reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteGroupMessage = async () => {
    if (!messageToDelete || !user || isDeletingMessage) return;

    try {
      setIsDeletingMessage(true);
      await dataService.deleteGroupMessage(messageToDelete.id, user.id);
      setGroupMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
      setMessageToDelete(null);
      setGroupError(null);
    } catch (err: any) {
      console.error('Delete group message error:', err);
      setMessageToDelete(null);
      setGroupError(err?.message || 'Unable to delete message. Please try again.');
    } finally {
      setIsDeletingMessage(false);
    }
  };

  const handleDeleteDoubt = async () => {
    if (!doubtToDelete || !user || isDeletingDoubt) return;

    try {
      setIsDeletingDoubt(true);
      await dataService.deleteDoubt(doubtToDelete.id, user.id);
      setDoubts((prev) => prev.filter((d) => d.id !== doubtToDelete.id));
      if (selectedDoubt?.id === doubtToDelete.id) {
        setSelectedDoubt(null);
      }
      setDoubtToDelete(null);
      setDoubtFeedback({ type: 'success', message: 'Doubt deleted successfully.' });
      setTimeout(() => setDoubtFeedback(null), 4000);
    } catch (err: any) {
      console.error('Delete doubt error:', err);
      setDoubtFeedback({ type: 'error', message: err?.message || 'Unable to delete this doubt. Please try again.' });
      setTimeout(() => setDoubtFeedback(null), 4000);
    } finally {
      setIsDeletingDoubt(false);
    }
  };

  // ---------------- 1. LANDING SCREEN ----------------
  if (currentScreen === 'landing') {
    return (
      <div className="flex flex-col h-full bg-[#F5F3F9] overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0 shadow-xs">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              id="chat-landing-back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-base font-black text-slate-900 font-['Outfit']">
              Community Hub
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Connect with Vedika LearnHub
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 custom-scrollbar">
          {/* Header Title & Subtitle */}
          <div className="bg-gradient-to-br from-[#312C51] via-[#48426D] to-[#312C51] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-[#F0C38E]/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F0C38E]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F0C38E] bg-white/10 px-2.5 py-1 rounded-full border border-white/10 inline-block mb-2">
                Student Network
              </span>
              <h1 className="text-2xl font-black font-['Outfit'] tracking-tight text-white">
                Community
              </h1>
              <p className="text-xs text-[#DDD6EE] mt-1 font-medium">
                Connect, ask questions and get support.
              </p>
            </div>
          </div>

        {/* 3 Main Selection Cards */}
        <div className="space-y-4">
          {/* Card 1: Community Chat */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              if (!hasActiveSubscription) {
                setSubModalTitle("Unlock Community Chat");
                setSubModalDesc("Join the group discussion with thousands of top students. Available for active subscribers only.");
                setShowSubModal(true);
              } else {
                setCurrentScreen('community-chat');
              }
            }}
            className={`bg-white border-2 rounded-3xl p-5 shadow-xs cursor-pointer transition-all flex items-center justify-between group ${
              !hasActiveSubscription ? 'border-amber-100 hover:border-amber-300' : 'border-slate-200/80 hover:border-[#312C51]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-[#312C51] text-[#F0C38E] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform relative">
                <Users className="w-6 h-6" />
                {!hasActiveSubscription && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1 border border-white shadow-xs">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-['Outfit'] group-hover:text-[#312C51] transition-colors flex items-center gap-1.5">
                  Community Chat
                  {!hasActiveSubscription && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> VIP</span>}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Talk with other Vedika students.
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-[#312C51] group-hover:text-white text-slate-400 flex items-center justify-center transition-all shrink-0">
              {!hasActiveSubscription ? <Lock className="w-4 h-4 text-amber-600" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </motion.div>

          {/* Card 2: Help Desk */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => setCurrentScreen('help-desk')}
            className="bg-white border-2 border-slate-200/80 hover:border-[#48426D] rounded-3xl p-5 shadow-xs cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-[#48426D] text-[#F1AA9B] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-['Outfit'] group-hover:text-[#48426D] transition-colors">
                  Help Desk
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Chat privately with Vedika support.
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-[#48426D] group-hover:text-white text-slate-400 flex items-center justify-center transition-all shrink-0">
              <ChevronRight className="w-5 h-5" />
            </div>
          </motion.div>

          {/* Card 3: Doubts */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              if (!hasActiveSubscription) {
                setSubModalTitle("Unlock Doubts Solving");
                setSubModalDesc("Post your doubts, upload images, and get step-by-step solutions from expert mentors. Available for active subscribers only.");
                setShowSubModal(true);
              } else {
                setCurrentScreen('doubts');
              }
            }}
            className={`bg-white border-2 rounded-3xl p-5 shadow-xs cursor-pointer transition-all flex items-center justify-between group ${
              !hasActiveSubscription ? 'border-amber-100 hover:border-amber-300' : 'border-slate-200/80 hover:border-[#F0C38E]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-[#312C51] text-[#F0C38E] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform relative">
                <HelpCircle className="w-6 h-6" />
                {!hasActiveSubscription && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-1 border border-white shadow-xs">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 font-['Outfit'] group-hover:text-[#312C51] transition-colors flex items-center gap-1.5">
                  My Doubts
                  {!hasActiveSubscription && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> VIP</span>}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Ask questions and view replies.
                </p>
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-[#F0C38E] group-hover:text-[#312C51] text-slate-400 flex items-center justify-center transition-all shrink-0">
              {!hasActiveSubscription ? <Lock className="w-4 h-4 text-amber-600" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </motion.div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        title={subModalTitle}
        description={subModalDesc}
      />
    </div>
    );
  }

  // ---------------- 2. COMMUNITY CHAT SCREEN ----------------
  if (currentScreen === 'community-chat') {
    return (
      <div className="flex flex-col h-full bg-[#F5F3F9] p-4 overflow-hidden">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shrink-0 shadow-xs mb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentScreen('landing')}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#312C51]" />
                Community Chat
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Connect with the Vedika community
              </p>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {groupError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2 mb-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{groupError}</span>
            </div>
            <button
              onClick={() => setGroupError(null)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages Body */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-inner custom-scrollbar"
        >
          {isLoading ? (
            <LoadingSkeleton type="chat" count={4} />
          ) : groupMessages.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No community messages yet"
              description="Be the first to say hello to fellow Vedika students!"
            />
          ) : (
            groupMessages.map((msg) => {
              const isMe = msg.sender_uid === user?.id || msg.sender_id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-600 font-semibold px-1">
                    <span>{msg.sender_name}</span>
                    <span>•</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="relative max-w-[82%]">
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-[#312C51] text-white rounded-tr-xs'
                          : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                      }`}
                    >
                      {msg.message}
                    </div>

                    {/* Delete Icon for Student's Own Message */}
                    {isMe && (
                      <button
                        onClick={() => setMessageToDelete(msg)}
                        title="Delete Message"
                        className="absolute -left-7 top-2 p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendGroupMessage} className="mt-3 flex gap-2 shrink-0">
          <input
            type="text"
            value={groupInput}
            onChange={(e) => setGroupInput(e.target.value)}
            placeholder="Type your message to the community..."
            disabled={isSendingGroup}
            className="flex-1 bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#312C51] transition-all"
          />
          <button
            type="submit"
            disabled={!groupInput.trim() || isSendingGroup}
            className="px-4 bg-[#312C51] hover:bg-[#48426D] text-[#F0C38E] font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
          >
            {isSendingGroup ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>

        {/* Confirm Delete Group Message Modal */}
        {messageToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="font-extrabold text-sm text-slate-900">Delete Message?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will permanently delete your message from the community chat.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setMessageToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroupMessage}
                  disabled={isDeletingMessage}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 flex items-center gap-1"
                >
                  {isDeletingMessage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------- 3. HELP DESK SCREEN ----------------
  if (currentScreen === 'help-desk') {
    return (
      <div className="flex flex-col h-full bg-[#F5F3F9] p-4 overflow-hidden">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shrink-0 shadow-xs mb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentScreen('landing')}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-[#48426D]" />
                Help Desk
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Private support conversation
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Support Online
          </span>
        </div>

        {/* Error Banner */}
        {privateError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2 mb-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{privateError}</span>
            </div>
            <button
              onClick={() => setPrivateError(null)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Private Support Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-inner custom-scrollbar"
        >
          {isLoading ? (
            <LoadingSkeleton type="chat" count={3} />
          ) : privateMessages.length === 0 ? (
            <EmptyState
              icon={Headphones}
              title="Welcome to Vedika Support"
              description="Send a message below to talk directly with an authorized Vedika administrator or mentor."
            />
          ) : (
            privateMessages.map((msg) => {
              const isMe = msg.sender_uid === user?.id || msg.sender_id === user?.id;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-600 font-semibold px-1">
                    <span>{isMe ? 'You' : 'Vedika Support'}</span>
                    <span>•</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-[#48426D] text-white rounded-tr-xs'
                        : 'bg-blue-50 text-slate-900 border border-blue-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendPrivateMessage} className="mt-3 flex gap-2 shrink-0">
          <input
            type="text"
            value={privateInput}
            onChange={(e) => setPrivateInput(e.target.value)}
            placeholder="Write a private support message..."
            disabled={isSendingPrivate}
            className="flex-1 bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#48426D] transition-all"
          />
          <button
            type="submit"
            disabled={!privateInput.trim() || isSendingPrivate}
            className="px-4 bg-[#48426D] hover:bg-[#312C51] text-[#F1AA9B] font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
          >
            {isSendingPrivate ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    );
  }

  // ---------------- 4. DOUBTS SCREEN (LIST & DETAIL) ----------------
  if (currentScreen === 'doubts') {
    // Sub-view: Doubt Detail View
    if (selectedDoubt) {
      return (
        <div className="flex flex-col h-full bg-[#F5F3F9] p-4 overflow-hidden">
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shrink-0 shadow-xs mb-3">
            <button
              onClick={() => setSelectedDoubt(null)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Doubts</span>
            </button>
            {selectedDoubt.student_uid === user?.id && (
              <button
                onClick={() => setDoubtToDelete(selectedDoubt)}
                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Doubt Card & Replies Container */}
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
            {/* Original Doubt */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-[#312C51] bg-[#F0C38E]/30 px-2.5 py-0.5 rounded-full border border-[#F0C38E]">
                  Question
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(selectedDoubt.created_at).toLocaleDateString()}
                </span>
              </div>

              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                {selectedDoubt.text}
              </h3>

              {selectedDoubt.image_url && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-60 bg-slate-50">
                  <img
                    src={selectedDoubt.image_url}
                    alt="Doubt Attachment"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Replies List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                Discussion & Responses ({selectedDoubt.replies?.length || 0})
              </h4>

              {(!selectedDoubt.replies || selectedDoubt.replies.length === 0) ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                  No replies yet. An educator or admin will respond soon.
                </div>
              ) : (
                selectedDoubt.replies.map((reply) => {
                  const isAdmin = reply.sender_role === 'admin' || reply.sender_role === 'educator';

                  return (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                        isAdmin
                          ? 'bg-amber-50/70 border-2 border-[#F0C38E] text-slate-900'
                          : 'bg-white border border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold flex items-center gap-1.5 text-slate-900">
                          {reply.sender_name}
                          {isAdmin && (
                            <span className="text-[9px] bg-[#312C51] text-[#F0C38E] px-2 py-0.5 rounded font-bold uppercase">
                              Vedika Mentor
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="leading-relaxed font-medium">{reply.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Reply Input Form */}
          <form onSubmit={handleSendDoubtReply} className="mt-3 flex gap-2 shrink-0">
            <input
              type="text"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              placeholder="Add your response or follow-up question..."
              disabled={isSendingReply}
              className="flex-1 bg-white border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#312C51] transition-all"
            />
            <button
              type="submit"
              disabled={!replyInput.trim() || isSendingReply}
              className="px-4 bg-[#312C51] hover:bg-[#48426D] text-[#F0C38E] font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
            >
              {isSendingReply ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Confirm Delete Doubt Modal */}
          {doubtToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-rose-600">
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <h3 className="font-extrabold text-sm text-slate-900">Delete Doubt?</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This will permanently delete your doubt and all attached responses from the database.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setDoubtToDelete(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteDoubt}
                    disabled={isDeletingDoubt}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 flex items-center gap-1"
                  >
                    {isDeletingDoubt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Sub-view: Doubts List View
    return (
      <div className="flex flex-col h-full bg-[#F5F3F9] p-4 overflow-y-auto pb-24 custom-scrollbar space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentScreen('landing')}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-black text-slate-900 font-['Outfit'] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#312C51]" />
                My Doubts
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Ask questions and view replies
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNewDoubtModalOpen(true)}
            className="px-3 py-2 bg-[#312C51] hover:bg-[#48426D] text-[#F0C38E] text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Ask Doubt</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {doubtFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
              doubtFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{doubtFeedback.message}</span>
            <button onClick={() => setDoubtFeedback(null)} className="font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Doubts List */}
        {isLoading ? (
          <LoadingSkeleton type="exam" count={3} />
        ) : doubts.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No doubts asked yet"
            description="Have a question about Physics, Chemistry, or Math? Ask your educators now!"
          />
        ) : (
          <div className="space-y-3">
            {doubts.map((doubt) => {
              const replyCount = doubt.replies?.length || 0;
              const isMine = doubt.student_uid === user?.id;

              return (
                <div
                  key={doubt.id}
                  onClick={() => setSelectedDoubt(doubt)}
                  className="bg-white border border-slate-200/80 hover:border-[#312C51] rounded-3xl p-4 shadow-xs cursor-pointer transition-all space-y-2.5 group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-[#312C51] bg-[#F0C38E]/30 px-2 py-0.5 rounded border border-[#F0C38E]">
                      {doubt.text.startsWith('[') ? doubt.text.split(']')[0].replace('[', '') : 'General'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(doubt.created_at).toLocaleDateString()}
                      </span>
                      {isMine && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDoubtToDelete(doubt);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-relaxed group-hover:text-[#312C51] transition-colors">
                    {doubt.text.includes(']') ? doubt.text.substring(doubt.text.indexOf(']') + 1).trim() : doubt.text}
                  </h3>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px]">
                    <span className="font-semibold text-slate-500 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-[#312C51]" />
                      {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
                    </span>
                    <span className="font-bold text-[#312C51] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      View Discussion →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Doubt Modal */}
        {isNewDoubtModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-black text-sm text-slate-900 font-['Outfit']">Ask a New Doubt</h3>
                <button
                  onClick={() => setIsNewDoubtModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDoubt} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={doubtSubject}
                    onChange={(e) => setDoubtSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#312C51]"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                    <option value="General">General Query</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Doubt Title</label>
                  <input
                    type="text"
                    required
                    value={doubtTitle}
                    onChange={(e) => setDoubtTitle(e.target.value)}
                    placeholder="e.g. Help with Newton's 2nd Law equation"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#312C51]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Detailed Explanation</label>
                  <textarea
                    required
                    rows={4}
                    value={doubtDesc}
                    onChange={(e) => setDoubtDesc(e.target.value)}
                    placeholder="Describe where you are stuck in solving this problem..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#312C51]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Attach Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDoubtImageFile(file);
                        setDoubtImagePreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#312C51]"
                  />
                  {doubtImagePreview && (
                    <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200">
                      <img src={doubtImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewDoubtModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingDoubt || !doubtTitle.trim()}
                    className="px-4 py-2 text-xs font-bold text-[#F0C38E] bg-[#312C51] rounded-xl hover:bg-[#48426D] flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isCreatingDoubt ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Doubt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Doubt Modal */}
        {doubtToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="font-extrabold text-sm text-slate-900">Delete Doubt?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will permanently delete your doubt and all attached responses from the database.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDoubtToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteDoubt}
                  disabled={isDeletingDoubt}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 flex items-center gap-1"
                >
                  {isDeletingDoubt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
