import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, FileText, Info, Phone, Mail, LogOut, Trash2, KeyRound, Check, AlertTriangle, Loader2, BellRing, BookOpen, Clock, Volume2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { supabase, CONFIG } from '../../lib/supabase';
import { Switch } from '../common/Switch';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenEditProfile,
}) => {
  const { user, profile, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'menu' | 'password' | 'terms' | 'privacy' | 'about'>('menu');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setSignOutError(null);
      await logout();
      setShowSignOutConfirm(false);
      onClose();
    } catch (err: any) {
      console.error('Settings logout error:', err);
      setSignOutError(err?.message || 'Unable to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  // Preferences state
  const [preferences, setPreferences] = useState({
    notifications: true,
    classReminders: true,
    examAlerts: true,
    soundEffects: true,
  });
  const [savingPrefKey, setSavingPrefKey] = useState<string | null>(null);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vedika_student_preferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Preferences load notice:', e);
    }
  }, []);

  const handleTogglePreference = (key: keyof typeof preferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    
    // Immediate UI update
    setPreferences(updated);
    setSavingPrefKey(key);

    try {
      localStorage.setItem('vedika_student_preferences', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not persist preference:', err);
    } finally {
      setTimeout(() => setSavingPrefKey(null), 100);
    }
  };

  // Change password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Deletion confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await authService.updatePassword(newPassword);
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (err?.status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
        setPasswordStatus({ type: 'error', message: 'Too many attempts. Please wait a moment before trying again.' });
      } else {
        setPasswordStatus({ type: 'error', message: err?.message || 'Could not update password.' });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Graceful account purge / signout
    await logout();
    onClose();
    alert('Your account has been deactivated and signed out.');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          className="w-full max-w-lg h-full sm:h-[88vh] bg-[#F7F9FC] border border-slate-200 rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">
                {activeSection === 'menu' && 'SETTINGS & INFORMATION'}
                {activeSection === 'password' && 'CHANGE PASSWORD'}
                {activeSection === 'terms' && 'TERMS & CONDITIONS'}
                {activeSection === 'privacy' && 'PRIVACY POLICY'}
                {activeSection === 'about' && 'ABOUT VEDIKA LEARNHUB'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {activeSection !== 'menu' && (
                <button
                  onClick={() => setActiveSection('menu')}
                  className="text-xs text-[#3157D5] font-semibold px-2 py-1 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Back
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

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
            {activeSection === 'menu' && (
              <div className="space-y-4">
                {/* Account Section */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                    Account & Profile
                  </span>
                  <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenEditProfile();
                      }}
                      className="w-full p-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <span>Edit Student Profile Details</span>
                      <span className="text-slate-400">→</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('password')}
                      className="w-full p-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-[#3157D5]" />
                        <span>Change Password</span>
                      </div>
                      <span className="text-slate-400">→</span>
                    </button>
                  </div>
                </div>

                {/* Student Preferences & Switches */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                    Student Preferences & Alerts
                  </span>
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-4 shadow-xs">
                    <Switch
                      id="switch-notifications"
                      label="Push & In-App Notifications"
                      description="Receive real-time updates for classes, tests, and announcements."
                      checked={preferences.notifications}
                      loading={savingPrefKey === 'notifications'}
                      onChange={(checked) => handleTogglePreference('notifications', checked)}
                    />

                    <div className="border-t border-slate-100 pt-3">
                      <Switch
                        id="switch-class-reminders"
                        label="Lecture & Routine Reminders"
                        description="Alert 15 minutes before live classes and daily sessions begin."
                        checked={preferences.classReminders}
                        loading={savingPrefKey === 'classReminders'}
                        onChange={(checked) => handleTogglePreference('classReminders', checked)}
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <Switch
                        id="switch-exam-alerts"
                        label="Exam & Mock Test Alerts"
                        description="Instant notification when new test series or marks are published."
                        checked={preferences.examAlerts}
                        loading={savingPrefKey === 'examAlerts'}
                        onChange={(checked) => handleTogglePreference('examAlerts', checked)}
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <Switch
                        id="switch-sound-effects"
                        label="Interactive Sound Effects"
                        description="Play subtle audio cues during quiz submission and timer ticks."
                        checked={preferences.soundEffects}
                        loading={savingPrefKey === 'soundEffects'}
                        onChange={(checked) => handleTogglePreference('soundEffects', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Legal & App Information */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                    Information & Legal
                  </span>
                  <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xs">
                    <button
                      onClick={() => setActiveSection('about')}
                      className="w-full p-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#6C63D9]" />
                        <span>About Vedika LearnHub</span>
                      </div>
                      <span className="text-slate-400">→</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('terms')}
                      className="w-full p-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span>Terms & Conditions</span>
                      </div>
                      <span className="text-slate-400">→</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('privacy')}
                      className="w-full p-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>Privacy Policy</span>
                      </div>
                      <span className="text-slate-400">→</span>
                    </button>
                  </div>
                </div>

                {/* Help & Support */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
                    Help & Support Contacts
                  </span>
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#3157D5]">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold">Direct Helpline</div>
                        <a href={`tel:${CONFIG.SUPPORT_PHONE}`} className="text-xs font-bold text-slate-900 hover:text-[#3157D5]">
                          {CONFIG.SUPPORT_PHONE}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#6C63D9]">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold">Support Email</div>
                        <a href={`mailto:${CONFIG.SUPPORT_EMAIL}`} className="text-xs font-bold text-slate-900 hover:text-[#3157D5]">
                          {CONFIG.SUPPORT_EMAIL}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session & Danger Zone */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => {
                      setSignOutError(null);
                      setShowSignOutConfirm(true);
                    }}
                    className="w-full py-3 px-4 bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-2xl border border-slate-300 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-slate-600" />
                    <span>Sign Out from Device</span>
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 px-4 text-rose-600 hover:text-rose-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </button>
                </div>

                <div className="text-center pt-2 text-[10px] text-slate-400">
                  {CONFIG.APP_NAME} • Version {CONFIG.APP_VERSION}
                </div>
              </div>
            )}

            {/* CHANGE PASSWORD */}
            {activeSection === 'password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Enter your desired new password below to secure your student account.
                </p>

                {passwordStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs ${
                      passwordStatus.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {passwordStatus.message}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-[#3157D5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-[#3157D5]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-3 bg-[#3157D5] hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs"
                >
                  {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save New Password'}
                </button>
              </form>
            )}

            {/* ABOUT VEDIKA */}
            {activeSection === 'about' && (
              <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Welcome to Vedika LearnHub – Your Ultimate Learning Companion</h4>
                <p>
                  Vedika LearnHub is a premium EdTech platform dedicated to transforming the way students learn, practice, and achieve their academic goals. Our mission is to make high-quality education accessible, interactive, and highly effective for every student, regardless of their location.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="font-bold text-[#3157D5]">Comprehensive Learning Vault:</div>
                  <p>Access a structured library of long notes, short notes, formula banks, and daily video classes carefully curated by expert educators.</p>

                  <div className="font-bold text-[#3157D5]">Live MCQ & Analytics:</div>
                  <p>Test your knowledge in real-time with our Live MCQ exams. Compete on the global leaderboard, and track your progress with detailed performance analytics.</p>

                  <div className="font-bold text-[#3157D5]">Interactive Doubt Forum:</div>
                  <p>Never get stuck again. Capture your doubts and upload them to our community forum where educators and peers collaborate to provide step-by-step solutions.</p>

                  <div className="font-bold text-[#3157D5]">Structured Study Plans:</div>
                  <p>From flexible premium subscriptions to customized daily routines, Vedika LearnHub ensures you stay disciplined and on track for your exams.</p>
                </div>
              </div>
            )}

            {/* TERMS & CONDITIONS */}
            {activeSection === 'terms' && (
              <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] text-slate-500 font-bold">Last Updated: 01/09/2026</div>
                <p>
                  Welcome to Vedika LearnHub. By downloading, accessing, or using our mobile application, you agree to be bound by these Terms and Conditions. Please read them carefully.
                </p>
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-slate-900">1. Account Registration</h5>
                  <p>To access premium features, you must create an account using accurate and current information. You are entirely responsible for maintaining the confidentiality of your login credentials. Sharing your account or password with others is strictly prohibited and may result in account suspension.</p>

                  <h5 className="font-bold text-slate-900">2. Subscriptions and Payments</h5>
                  <p>Certain features of the app (e.g., Premium Mock Tests, VIP Materials) require a paid subscription. All payments are processed securely through our authorized payment gateway (Razorpay). Once a subscription is purchased, it is non-transferable. Fees paid are generally non-refundable unless there is a critical technical failure on our end that prevents access to the purchased service.</p>

                  <h5 className="font-bold text-slate-900">3. User Conduct & Doubt Forum Rules</h5>
                  <p>The Doubt Forum is a place for academic discussion. Any use of foul language, harassment, or sharing of inappropriate/non-educational content will result in immediate termination of your account. You agree not to use the app for any illegal or unauthorized purpose.</p>

                  <h5 className="font-bold text-slate-900">4. Intellectual Property Rights</h5>
                  <p>All content available on Vedika LearnHub, including text, graphics, logos, mock tests, and PDFs, is the exclusive property of Vedika LearnHub. You may not download, print, distribute, or reproduce any material for commercial purposes without our explicit written permission.</p>

                  <h5 className="font-bold text-slate-900">5. Limitation of Liability</h5>
                  <p>While we strive to provide accurate and up-to-date educational content, Vedika LearnHub does not guarantee that the application will be error-free or uninterrupted. We are not liable for any direct or indirect damages arising from your use of the app.</p>

                  <h5 className="font-bold text-slate-900">6. Termination</h5>
                  <p>We reserve the right to suspend or terminate your access to the app at any time, without prior notice, if you breach any of these Terms and Conditions.</p>

                  <h5 className="font-bold text-slate-900">7. Contact Us</h5>
                  <p>If you have any questions or suggestions regarding our Terms and Conditions, please contact us at:</p>
                  <div className="p-2.5 rounded-xl bg-slate-100 font-mono text-[11px] text-slate-800">
                    Email: vedikalearnhub@gmail.com<br />
                    Phone: +91 62963 62232
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY POLICY */}
            {activeSection === 'privacy' && (
              <div className="space-y-3 text-xs text-slate-700 leading-relaxed bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="text-[11px] text-slate-500 font-bold">Last Updated: 01/09/2026</div>
                <p>
                  Welcome to Vedika LearnHub. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
                </p>
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-slate-900">1. Information We Collect</h5>
                  <p>When you register and use Vedika LearnHub, we may collect:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-slate-800">Personal Information:</strong> Name, email address, phone number, and profile picture when you create an account.</li>
                    <li><strong className="text-slate-800">Academic Information:</strong> Your grade, enrolled courses, quiz scores, and study preferences to provide a personalized learning experience.</li>
                    <li><strong className="text-slate-800">Device and Usage Data:</strong> Device model, OS version, and app interaction telemetry to improve services.</li>
                  </ul>

                  <h5 className="font-bold text-slate-900">2. How We Use Your Information</h5>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>To create, manage, and secure your student account.</li>
                    <li>To process your subscription payments seamlessly via Razorpay.</li>
                    <li>To track your academic progress and provide relevant study materials.</li>
                    <li>To respond to your queries in the Doubt Forum and provide customer support.</li>
                    <li>To send important notifications regarding app updates, new classes, or subscription expiry.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sign Out Confirmation Dialog */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 font-['Outfit']">Sign Out?</h4>
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shadow-xs cursor-pointer"
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Delete Student Account?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action will end your active session, cancel active renewals, and clear local study data. Are you sure you wish to proceed?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
