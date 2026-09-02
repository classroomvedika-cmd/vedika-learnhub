import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { resolvePersistentStudentId } from '../../lib/studentIdHelper';

interface AuthCallbackProps {
  onComplete?: () => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onComplete }) => {
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        // 1. Check for URL error parameters (e.g. ?error=access_denied&error_description=...)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription =
          urlParams.get('error_description') ||
          hashParams.get('error_description') ||
          urlParams.get('error_msg');

        if (error || errorDescription) {
          if (!isMounted) return;
          setStatus('error');
          setErrorMessage(
            errorDescription
              ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
              : 'Authentication verification failed or link has expired.'
          );
          return;
        }

        // 2. Check for PKCE exchange code in search query (?code=...)
        const code = urlParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.warn('PKCE exchange error:', exchangeError);
            // Even if exchangeCode throws, check if session is already established
          }
        }

        // 3. Inspect current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session && session.user) {
          // Sync profile if user metadata exists
          const userMeta = session.user.user_metadata || {};
          const studentName = userMeta.name || userMeta.full_name || 'Student';
          const studentPhone = userMeta.phone || '';
          const studentId = resolvePersistentStudentId(session.user.id, userMeta.student_id);

          try {
            await supabase.from('profiles').upsert({
              id: session.user.id,
              name: studentName,
              email: session.user.email || '',
              phone: studentPhone,
              student_id: studentId,
              role: 'student',
              photo_url: null,
              streak: 1,
              force_logout: false,
              updated_at: new Date().toISOString(),
            });
          } catch (upsertErr) {
            console.warn('Callback profile sync notice:', upsertErr);
          }

          await refreshProfile();

          if (!isMounted) return;
          setStatus('success');

          // Clean URL parameters cleanly without triggering a full page reload
          const cleanUrl = window.location.origin;
          window.history.replaceState({}, document.title, cleanUrl);

          // Allow brief confirmation animation before transition
          setTimeout(() => {
            if (isMounted) {
              onComplete?.();
            }
          }, 1200);
        } else {
          // If no active session found after callback, listen for onAuthStateChange
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession?.user) {
              await refreshProfile();
              if (isMounted) {
                setStatus('success');
                window.history.replaceState({}, document.title, window.location.origin);
                setTimeout(() => onComplete?.(), 1000);
              }
            }
          });

          // Timeout fallback if no session resolves within 4 seconds
          setTimeout(() => {
            if (isMounted && status === 'processing') {
              setStatus('error');
              setErrorMessage('Session verification timed out. Please try logging in with your email and password.');
            }
            authListener?.subscription?.unsubscribe();
          }, 4500);
        }
      } catch (err: any) {
        console.error('Auth callback handler error:', err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err?.message || 'Failed to complete authentication verification.');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [onComplete, refreshProfile]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col items-center justify-center p-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] text-center select-none">
      <div className="w-full max-w-sm bg-[#0f1626]/95 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 mb-4 border border-blue-400/30">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-xl font-black text-white font-['Outfit'] tracking-tight">
          VEDIKA LEARNHUB
        </h1>
        <p className="text-[11px] text-blue-400 font-bold tracking-wider uppercase mt-0.5">
          Student Portal Authentication
        </p>

        <div className="mt-6">
          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-200">
                Verifying your account...
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Please wait while we validate your credentials and prepare your Student Dashboard.
              </p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-emerald-300">
                Email Verified Successfully!
              </p>
              <p className="text-xs text-slate-400">
                Redirecting you to the Vedika LearnHub Student Panel...
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 text-left"
            >
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/70 text-rose-300 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold mb-1">Verification Issue</p>
                  <p>{errorMessage || 'Could not verify authentication session.'}</p>
                </div>
              </div>

              <button
                type="button"
                id="btn-callback-back-login"
                onClick={() => {
                  window.location.href = window.location.origin;
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Return to Student Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mt-6">
        Vedika LearnHub • Secure Supabase Session Handler
      </p>
    </div>
  );
};
