import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, ShieldCheck, CreditCard, Settings, GraduationCap, Phone, Mail, Camera, QrCode, LogOut, Loader2, Edit3, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { resolvePersistentStudentId } from '../../lib/studentIdHelper';
import { DigitalIDCardModal } from './DigitalIDCardModal';
import { SettingsModal } from '../settings/SettingsModal';

interface ProfileViewProps {
  onOpenPlans: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenPlans }) => {
  const { profile, subscription, hasActiveSubscription, logout, updateProfile, refreshProfile } = useAuth();

  const [isIDCardOpen, setIsIDCardOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setSignOutError(null);
      await logout();
      setShowSignOutConfirm(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setSignOutError(err?.message || 'Unable to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Edit Profile Form
  const [editName, setEditName] = useState(profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [editClass, setEditClass] = useState(profile?.class_grade || 'Class 12');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || isSaving) return;

    try {
      setIsSaving(true);
      let uploadedUrl = profile?.image_url;

      if (editAvatarFile) {
        uploadedUrl = await authService.uploadImageToImgBB(editAvatarFile);
      }

      await updateProfile({
        full_name: editName.trim(),
        phone: editPhone.trim(),
        class_grade: editClass,
        image_url: uploadedUrl,
        avatar_url: uploadedUrl,
      });

      await refreshProfile();
      setIsEditProfileOpen(false);
    } catch (err: any) {
      console.error('Profile update error:', err);
      alert(err?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Student Profile Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-4 items-center">
            {/* Avatar with status */}
            <div className="relative">
              <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-[#3157D5] to-[#6C63D9] p-[2px] shadow-sm">
                {profile?.image_url || profile?.avatar_url ? (
                  <img
                    src={profile.image_url || profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover rounded-[14px]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-[14px] flex items-center justify-center text-[#3157D5] font-extrabold text-xl">
                    {profile?.full_name?.charAt(0) || <User className="w-8 h-8" />}
                  </div>
                )}
              </div>
              {hasActiveSubscription && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 border-2 border-white rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 text-white" />
                </span>
              )}
            </div>

            {/* Info */}
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">
                {profile?.full_name || 'Vedika Student'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#3157D5]">
                <span>{profile?.student_id || (profile?.id ? resolvePersistentStudentId(profile.id) : 'VDH-2026-000100')}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile?.class_grade || 'Class 12'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setEditName(profile?.full_name || '');
              setEditPhone(profile?.phone || '');
              setEditClass(profile?.class_grade || 'Class 12');
              setIsEditProfileOpen(true);
            }}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-2.5 pt-3 border-t border-slate-100">
          <div
            onClick={onOpenPlans}
            className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:border-[#3157D5] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold">Subscription</div>
              <div className="text-xs font-bold text-emerald-700 mt-0.5 truncate max-w-[90px]">
                {hasActiveSubscription ? subscription?.plan?.name || 'Active' : 'Free Tier'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Student E-ID Card Action Banner */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsIDCardOpen(true)}
        className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200 rounded-3xl p-4 flex items-center justify-between cursor-pointer shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#3157D5] flex items-center justify-center text-white shadow-xs">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900">Digital Student E-ID Card</h3>
            <p className="text-[11px] text-slate-600">
              View official credentials, holographic seal & save ID
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#3157D5]">View →</span>
      </motion.div>

      {/* Profile Details List */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Registered Information
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Email
            </span>
            <span className="font-semibold text-slate-900 truncate max-w-[180px]">{profile?.email}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Phone
            </span>
            <span className="font-semibold text-slate-900">{profile?.phone || 'Not provided'}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              Class Target
            </span>
            <span className="font-semibold text-slate-900">{profile?.class_grade || 'Class 12'}</span>
          </div>
        </div>
      </div>

      {/* Account Navigation */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden divide-y divide-slate-100 shadow-xs">
        <button
          onClick={onOpenPlans}
          className="w-full p-4 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-[#3157D5]" />
            <span>Manage Subscriptions & Upgrade</span>
          </div>
          <span className="text-slate-400">→</span>
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full p-4 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-[#6C63D9]" />
            <span>App Settings, Terms & Security</span>
          </div>
          <span className="text-slate-400">→</span>
        </button>

        <button
          onClick={() => {
            setSignOutError(null);
            setShowSignOutConfirm(true);
          }}
          className="w-full p-4 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50/50 flex items-center justify-between transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out</span>
          </div>
          <span className="text-slate-400">→</span>
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 text-slate-900"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900">Edit Profile Details</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              {/* Photo Upload */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Profile Photo
                </label>
                <div 
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-[#3157D5] transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f && f.type.startsWith('image/')) {
                      setEditAvatarFile(f);
                      setEditAvatarPreview(URL.createObjectURL(f));
                    }
                  }}
                  onClick={() => document.getElementById('input-profile-file')?.click()}
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {editAvatarPreview || profile?.image_url || profile?.avatar_url ? (
                      <img
                        src={editAvatarPreview || profile?.image_url || profile?.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800">Click or drag & drop photo here</p>
                    <p className="text-[10px] text-slate-500">JPG, PNG, or WebP up to 5MB</p>
                  </div>
                  <input
                    id="input-profile-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setEditAvatarFile(f);
                        setEditAvatarPreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-[#3157D5]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-[#3157D5]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Class / Target Stream</label>
                <select
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 outline-none focus:border-[#3157D5]"
                >
                  <option value="Class 10">Class 10 (Madhyamik / Secondary)</option>
                  <option value="Class 11">Class 11 (Higher Secondary)</option>
                  <option value="Class 12">Class 12 (Board Examination)</option>
                  <option value="WBJEE / JEE">WBJEE / JEE Main</option>
                  <option value="NEET">NEET Prep</option>
                  <option value="General Academic">General Academic</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#3157D5] hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Digital ID Card Modal */}
      <DigitalIDCardModal isOpen={isIDCardOpen} onClose={() => setIsIDCardOpen(false)} />

      {/* App Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
      />

      {/* SIGN OUT CONFIRMATION MODAL */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-slate-900"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 font-['Outfit']">
                  Sign out of Vedika LearnHub?
                </h3>
                <p className="text-[11px] text-slate-500">
                  Are you sure you want to log out of your student session?
                </p>
              </div>
            </div>

            {signOutError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {signOutError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                disabled={isSigningOut}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
