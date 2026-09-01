import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { ShieldCheck, Download, X, User, Phone, Mail, GraduationCap, Award, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resolvePersistentStudentId } from '../../lib/studentIdHelper';

interface DigitalIDCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalIDCardModal: React.FC<DigitalIDCardModalProps> = ({ isOpen, onClose }) => {
  const { profile, subscription, hasActiveSubscription } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const resolvedId = profile ? resolvePersistentStudentId(profile.id, profile.student_id) : '';

  useEffect(() => {
    if (resolvedId) {
      const payload = `${window.location.origin}/verify/${resolvedId}`;
      QRCode.toDataURL(payload, {
        margin: 1,
        width: 140,
        color: {
          dark: '#312C51',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR code:', err));
    }
  }, [resolvedId]);

  if (!isOpen || !profile) return null;

  const handleDownload = async () => {
    if (!cardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Vedika-StudentID-${resolvedId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export ID card:', err);
      alert('Could not download image. Please take a screenshot of your ID card.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl flex flex-col items-center"
        >
          {/* Top Bar */}
          <div className="w-full flex justify-between items-center mb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#312C51] flex items-center gap-1.5 font-['Outfit']">
              <ShieldCheck className="w-4 h-4 text-[#F0C38E]" />
              Digital Student Identity Card
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* THE E-ID CARD CONTAINER (Export Target) */}
          <div
            ref={cardRef}
            className="w-full bg-gradient-to-br from-[#312C51] via-[#48426D] to-[#312C51] border-2 border-[#F0C38E]/50 rounded-3xl p-5 shadow-xl relative overflow-hidden text-white"
          >
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F0C38E]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#F1AA9B]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Institutional Header */}
            <div className="flex items-center justify-between border-b border-[#F5F3F9]/20 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <img
                  src="https://cdn.phototourl.com/free/2026-08-31-cde583fc-08b8-47ee-ab02-63114e29ce8d.png"
                  alt="Vedika Logo"
                  className="w-7 h-7 object-contain rounded-lg bg-white/10 p-1"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <div className="text-sm font-black tracking-tight text-white font-['Outfit']">
                    VEDIKA LEARNHUB
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-[#F0C38E] font-extrabold">
                    Official Student Identity Card
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-bold text-[#F1AA9B] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                2026
              </span>
            </div>

            {/* Student Photo & Info */}
            <div className="flex gap-3.5 items-start mb-4">
              {/* Photo */}
              <div className="w-20 h-24 rounded-2xl bg-[#1f1b3a] border-2 border-[#F0C38E]/70 p-0.5 overflow-hidden shrink-0 shadow-lg relative flex items-center justify-center">
                {profile.image_url || profile.avatar_url ? (
                  <img
                    src={profile.image_url || profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover rounded-[14px]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-[#312C51] flex items-center justify-center text-[#F0C38E]">
                    <User className="w-8 h-8" />
                  </div>
                )}
                {hasActiveSubscription && (
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border border-black flex items-center justify-center">
                    <ShieldCheck className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </div>

              {/* Student Details */}
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-white truncate leading-tight font-['Outfit']">
                  {profile.full_name}
                </h3>
                <div className="text-xs font-mono font-bold text-[#F0C38E] bg-white/10 px-2 py-0.5 rounded inline-block">
                  {resolvedId}
                </div>

                <div className="text-[11px] text-[#DDD6EE] font-medium flex items-center gap-1 truncate pt-0.5">
                  <GraduationCap className="w-3 h-3 text-[#F1AA9B] shrink-0" />
                  <span className="truncate">{profile.class_grade || 'Class 12'}</span>
                </div>

                <div className="text-[10px] text-[#DDD6EE]/80 flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 text-[#F1AA9B] shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>

                <div className="text-[10px] text-[#DDD6EE]/80 flex items-center gap-1 truncate">
                  <Phone className="w-3 h-3 text-[#F1AA9B] shrink-0" />
                  <span className="truncate">{profile.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Plan & Status Strip */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between text-[10px] mb-4">
              <div>
                <span className="text-[#DDD6EE]/70 font-semibold block">Plan Access:</span>
                <span className="font-extrabold text-[#F0C38E]">
                  {hasActiveSubscription
                    ? subscription?.plan?.name || 'VIP Member'
                    : 'Standard Free Plan'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[#DDD6EE]/70 font-semibold block">Status:</span>
                <span className="font-extrabold text-emerald-400 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active Student
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between bg-white/5 p-2.5 rounded-2xl">
              <div>
                <div className="text-[10px] font-bold text-[#F0C38E] flex items-center gap-1">
                  <Award className="w-3 h-3" /> VERIFIED QR CODE
                </div>
                <div className="text-[9px] text-[#DDD6EE]/70 font-mono mt-0.5 max-w-[170px] truncate">
                  Scan for institute verification
                </div>
              </div>

              {/* QR Code Render */}
              <div className="w-16 h-16 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center shadow-md">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Student QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-slate-100 animate-pulse rounded" />
                )}
              </div>
            </div>
          </div>

          {/* Action Button: Download E-ID */}
          <div className="w-full mt-4 flex gap-2">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 py-3 bg-[#3157D5] hover:bg-[#48426D] text-white text-xs font-bold rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Image...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#F0C38E]" />
                  <span>Download E-ID Card</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
