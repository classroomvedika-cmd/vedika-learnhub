import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Check, Clock, Receipt, CreditCard, Loader2, ArrowRight, AlertCircle, History, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Plan, Payment } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { supabase, CONFIG, supabaseUrl } from '../../lib/supabase';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlansModal: React.FC<PlansModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, subscription, hasActiveSubscription, refreshSubscription } = useAuth();

  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
      const channel = supabase
        .channel(`plans-realtime-${Math.random().toString(36).substring(2, 8)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => {
          loadData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    setFeedback(null);
    setFetchError(null);
    try {
      const [fetchedPlans, fetchedPayments] = await Promise.all([
        dataService.getPlans(),
        user?.id ? dataService.getUserPayments(user.id) : Promise.resolve([]),
      ]);
      setPlans(fetchedPlans);
      setPayments(fetchedPayments);
    } catch (err: any) {
      console.error('Error loading plans/payments:', err);
      setFetchError(err?.message || 'Unable to load subscription plans.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (plan: Plan) => {
    if (!user) {
      setFeedback({ type: 'error', message: 'Please login to subscribe to a plan.' });
      return;
    }

    if (processingPlanId) {
      return; // Prevent duplicate payment requests
    }

    setProcessingPlanId(plan.id);
    setFeedback(null);

    try {
      // Ensure we have a valid, fresh session and token
      const sessionResult = await supabase.auth.getSession();
      let currentSession = sessionResult.data.session;

      const isExpired = currentSession?.expires_at 
        ? (currentSession.expires_at * 1000) < (Date.now() + 10000) // 10 seconds buffer
        : true;

      if (!currentSession || isExpired) {
        const refreshResult = await supabase.auth.refreshSession();
        currentSession = refreshResult.data.session;
      }

      if (!currentSession || !currentSession.access_token) {
        throw new Error('Please log in again. Your session has expired.');
      }

      const token = currentSession.access_token;

      // 1. Create order securely through Supabase Edge Function with structured diagnostics
      console.log('[DEBUG] --- START Razorpay Order Initialization ---');
      console.log('[DEBUG] Target Plan ID:', plan.id);
      console.log('[DEBUG] Student ID:', user.id);
      console.log('[DEBUG] Supabase URL:', supabaseUrl);
      console.log('[DEBUG] Authenticated session is valid immediately before invocation:', !!currentSession);
      console.log('[DEBUG] Access token exists immediately before invocation:', !!token);
      console.log('[DEBUG] Invoking Supabase Function: create-razorpay-order...');

      let orderData: any = null;
      let invokeError: any = null;

      try {
        const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: { plan_id: plan.id },
        });
        orderData = data;
        invokeError = error;

        if (orderData && !orderData.success) {
          throw new Error(orderData.error || "Edge Function returned unsuccessful response");
        }
      } catch (err: any) {
        console.warn('[WARN] Direct Supabase Edge Function failed, trying secure Express server fallback proxy...', err);
        try {
          const fallbackRes = await fetch('/api/payment/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              plan_id: plan.id,
              student_id: user.id
            })
          });
          if (fallbackRes.ok) {
            orderData = await fallbackRes.json();
            invokeError = null;
          } else {
            const fallbackErr = await fallbackRes.json().catch(() => ({}));
            throw new Error(fallbackErr?.error || "Express server fallback order creation failed");
          }
        } catch (fbErr: any) {
          console.error('[DEBUG] Fallback proxy also failed:', fbErr);
          invokeError = fbErr;
        }
      }

      console.log('[DEBUG] --- END Razorpay Order Initialization Response ---');
      console.log('[DEBUG] Invoke Result Data:', orderData);
      console.log('[DEBUG] Invoke Result Error:', invokeError);

      if (invokeError || !orderData || !orderData.success) {
        // Attempt to extract structured error response from Edge Function response context
        let errorMsg = 'Failed to initialize payment order.';
        if (invokeError) {
          try {
            const errContext = (invokeError as any).context;
            if (errContext) {
              if (typeof errContext.clone === 'function') {
                const cloned = errContext.clone();
                const text = await cloned.text().catch(() => '');
                try {
                  const parsed = JSON.parse(text);
                  if (parsed && parsed.error) {
                    errorMsg = parsed.error;
                  } else {
                    errorMsg = `Error (Status ${cloned.status || 'unknown'}): ${text || invokeError.message}`;
                  }
                } catch {
                  if (text) {
                    errorMsg = text;
                  } else {
                    errorMsg = invokeError.message;
                  }
                }
              } else if (typeof errContext.json === 'function') {
                const errBody = await errContext.json().catch(() => null);
                if (errBody?.error) {
                  errorMsg = errBody.error;
                } else {
                  errorMsg = invokeError.message;
                }
              } else if (typeof errContext.text === 'function') {
                const errText = await errContext.text().catch(() => '');
                try {
                  const parsed = JSON.parse(errText);
                  if (parsed && parsed.error) {
                    errorMsg = parsed.error;
                  } else if (errText) {
                    errorMsg = errText;
                  } else {
                    errorMsg = invokeError.message;
                  }
                } catch {
                  if (errText) {
                    errorMsg = errText;
                  } else {
                    errorMsg = invokeError.message;
                  }
                }
              } else {
                errorMsg = invokeError.message;
              }
            } else {
              errorMsg = invokeError.message;
            }
          } catch (e) {
            console.error("[DEBUG] Error reading invokeError context:", e);
            errorMsg = invokeError.message;
          }
        } else if (orderData?.error) {
          errorMsg = orderData.error;
        }

        if (errorMsg.includes('unavailable')) {
          throw new Error('This subscription plan is currently unavailable.');
        }
        if (errorMsg.includes('no longer active') || errorMsg.includes('no longer available')) {
          throw new Error('This plan is no longer available.');
        }
        throw new Error(errorMsg);
      }

      const keyId = orderData.key_id || CONFIG.RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('Unable to open payment. Please try again.');
      }

      // 2. Open Razorpay Checkout
      if (typeof (window as any).Razorpay !== 'function') {
        throw new Error('Unable to open payment. Please try again.');
      }

      const options: any = {
        key: keyId,
        amount: orderData.amount, // Server-authorized amount in paise
        currency: orderData.currency || 'INR',
        name: 'Vedika LearnHub',
        description: `${plan.name} (${plan.duration_days} Days Access)`,
        image: 'https://cdn.phototourl.com/free/2026-08-31-cde583fc-08b8-47ee-ab02-63114e29ce8d.png',
        order_id: orderData.order_id, // Pass real order_id for signature verification matching
        prefill: {
          name: profile?.full_name || 'Vedika Student',
          email: profile?.email || user.email || '',
          contact: profile?.phone || '',
        },
        theme: {
          color: '#312C51',
        },
        handler: async (response: any) => {
          try {
            // Ensure we still have a valid, fresh token for verification (handles session timeout during payment)
            const verifySessionResult = await supabase.auth.getSession();
            let verifySession = verifySessionResult.data.session;

            const isVerifyExpired = verifySession?.expires_at 
              ? (verifySession.expires_at * 1000) < (Date.now() + 10000) 
              : true;

            if (!verifySession || isVerifyExpired) {
              const refreshResult = await supabase.auth.refreshSession();
              verifySession = refreshResult.data.session;
            }
            const verifyToken = verifySession?.access_token || token;

            // Server-side verification via Supabase Edge Function with structured diagnostics
            console.log('[DEBUG] --- START Razorpay Payment Verification ---');
            console.log('[DEBUG] Razorpay Order ID:', response.razorpay_order_id || orderData.order_id);
            console.log('[DEBUG] Razorpay Payment ID:', response.razorpay_payment_id);
            console.log('[DEBUG] Razorpay Signature Exists:', !!response.razorpay_signature);
            console.log('[DEBUG] Invoking Supabase Function: verify-razorpay-payment...');

            let verifyData: any = null;
            let verifyError: any = null;

            try {
              const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
                headers: {
                  Authorization: `Bearer ${verifyToken}`,
                },
                body: {
                  razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              });
              verifyData = data;
              verifyError = error;

              if (verifyData && !verifyData.success) {
                throw new Error(verifyData.error || "Edge Function verification failed");
              }
            } catch (err: any) {
              console.warn('[WARN] Direct Supabase verification failed, trying secure Express server fallback proxy...', err);
              try {
                const fallbackVerifyRes = await fetch('/api/payment/verify', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${verifyToken}`,
                  },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    plan_id: plan.id,
                    student_id: user.id
                  })
                });
                if (fallbackVerifyRes.ok) {
                  verifyData = await fallbackVerifyRes.json();
                  verifyError = null;
                } else {
                  const fallbackVerifyErr = await fallbackVerifyRes.json().catch(() => ({}));
                  throw new Error(fallbackVerifyErr?.error || "Express server fallback verification failed");
                }
              } catch (fbVerifyErr: any) {
                console.error('[DEBUG] Fallback verification proxy also failed:', fbVerifyErr);
                verifyError = fbVerifyErr;
              }
            }

            console.log('[DEBUG] --- END Razorpay Payment Verification Response ---');
            console.log('[DEBUG] Verify Result Data:', verifyData);
            console.log('[DEBUG] Verify Result Error:', verifyError);

            if (verifyError || !verifyData || !verifyData.success) {
              let verifyErrMsg = 'Payment verification failed.';
              if (verifyError) {
                try {
                  if ((verifyError as any).context && typeof (verifyError as any).context.json === 'function') {
                    const errBody = await (verifyError as any).context.json();
                    if (errBody?.error) verifyErrMsg = errBody.error;
                  }
                } catch {
                  if (verifyError.message) verifyErrMsg = verifyError.message;
                }
              } else if (verifyData?.error) {
                verifyErrMsg = verifyData.error;
              }
              throw new Error(verifyErrMsg);
            }

            // Record payment in Supabase payments table
            await dataService.createPaymentRecord({
              student_uid: user.id,
              plan_id: plan.id,
              amount: plan.price,
              status: 'paid',
              payment_method: 'Razorpay',
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
            });

            // Activate subscription in Supabase subscriptions table
            await dataService.activateSubscription(user.id, plan.id, plan.duration_days);

            // Only after server-side verification confirms payment
            await refreshSubscription();
            setFeedback({
              type: 'success',
              message: `🎉 Success! Your subscription to ${plan.name} has been verified & activated.`,
            });
            loadData();
          } catch (err: any) {
            console.error('Payment processing error:', err);
            setFeedback({
              type: 'error',
              message: err?.message || 'Payment completed but activation is pending. Please contact support.',
            });
          } finally {
            setProcessingPlanId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPlanId(null);
          },
        },
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (failRes: any) => {
          console.error('Razorpay payment failed:', failRes);
          setFeedback({
            type: 'error',
            message: failRes.error?.description || 'Payment was unsuccessful. Please try again.',
          });
          setProcessingPlanId(null);
        });

        rzp.open();
      } catch (openErr) {
        console.error('Failed to instantiate or open Razorpay Checkout:', openErr);
        throw new Error('Unable to open payment. Please try again.');
      }
    } catch (err: any) {
      console.error('Purchase initialization error:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Unable to open payment. Please try again.',
      });
      setProcessingPlanId(null);
    }
  };

  const getParsedFeatures = (features?: string[] | string): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'string') {
      try {
        const parsed = JSON.parse(features);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return features.split(',').map((f) => f.trim()).filter(Boolean);
      }
    }
    return [];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          className="w-full max-w-lg h-full sm:h-[88vh] bg-[#F5F3F9] border border-[#EAE6F4] rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-white border-b border-[#EAE6F4] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#312C51] text-[#F0C38E] flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#312C51] font-['Outfit'] uppercase tracking-wide">
                  SUBSCRIPTION PLANS
                </h3>
                <p className="text-[11px] text-[#7D7696] font-medium mt-0.5">
                  Unlock full access to notes, video lectures, and live exams
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F5F3F9] hover:bg-[#DDD6EE] text-[#48426D] flex items-center justify-center transition-colors font-bold"
            >
              ✕
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="px-5 pt-3 pb-2 bg-white border-b border-[#EAE6F4] flex gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'plans'
                  ? 'bg-[#312C51] text-white shadow-xs'
                  : 'bg-[#F5F3F9] text-[#48426D] hover:bg-[#DDD6EE]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-[#F0C38E]" />
              <span>Available Plans</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-[#312C51] text-white shadow-xs'
                  : 'bg-[#F5F3F9] text-[#48426D] hover:bg-[#DDD6EE]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#F1AA9B]" />
              <span>Payment History ({payments.length})</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
            {/* Feedback Alert */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </motion.div>
            )}

            {/* Current Active Subscription Status Card */}
            {hasActiveSubscription && subscription && (
              <div className="bg-gradient-to-r from-[#312C51] via-[#48426D] to-[#312C51] border border-[#F0C38E]/40 rounded-3xl p-4 text-white shadow-xs space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#312C51] bg-[#F0C38E] px-2.5 py-0.5 rounded-full shadow-xs">
                    ACTIVE MEMBERSHIP
                  </span>
                  <span className="text-xs text-[#F1AA9B] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Expires: {new Date(subscription.expiry_date).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-white font-['Outfit']">
                  {subscription.plan?.name || 'Vedika VIP Access'}
                </h4>
                <p className="text-xs text-[#DDD6EE] leading-relaxed">
                  You have full unlimited access to all notes, exams, formula banks, and video classes.
                </p>
              </div>
            )}

            {isLoading ? (
              <LoadingSkeleton type="card" count={3} />
            ) : activeTab === 'plans' ? (
              fetchError ? (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-rose-900 font-['Outfit']">
                    Unable to load subscription plans
                  </h4>
                  <p className="text-xs text-rose-700">{fetchError}</p>
                  <button
                    type="button"
                    onClick={loadData}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : plans.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No subscription plans are currently available"
                  description="Please check again later."
                />
              ) : (
                <div className="space-y-4">
                  {plans.map((plan, idx) => {
                    const isPopular = idx === 1 || plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('6');
                    const features = getParsedFeatures(plan.features);
                    const isCurrentPlan = subscription?.plan_id === plan.id && hasActiveSubscription;

                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className={`relative rounded-3xl p-5 border transition-all ${
                          isPopular
                            ? 'bg-white border-2 border-[#312C51] shadow-md ring-2 ring-[#312C51]/10'
                            : 'bg-white border-[#EAE6F4] hover:border-[#DDD6EE] shadow-xs'
                        }`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 right-4 bg-[#312C51] text-[#F0C38E] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#F0C38E]" /> Most Popular
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-base font-extrabold text-[#312C51] font-['Outfit']">{plan.name}</h4>
                            <p className="text-xs text-[#7D7696] font-medium mt-0.5">
                              {plan.duration_days >= 30
                                ? `${Math.round(plan.duration_days / 30)} Month${Math.round(plan.duration_days / 30) > 1 ? 's' : ''} Duration (${plan.duration_days} Days)`
                                : `${plan.duration_days} Days Access`}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black text-[#312C51]">
                              ₹{plan.price}
                            </div>
                            <div className="text-[10px] text-[#7D7696] font-medium">All taxes included</div>
                          </div>
                        </div>

                        {/* Features Checklist */}
                        <div className="space-y-2 my-4 pt-3 border-t border-[#F5F3F9]">
                          {features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-2 text-xs text-[#48426D] font-medium">
                              <div className="w-4 h-4 rounded-full bg-[#F5F3F9] border border-[#DDD6EE] flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 text-[#312C51]" />
                              </div>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => handlePurchase(plan)}
                          disabled={Boolean(processingPlanId) || isCurrentPlan}
                          className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                            isCurrentPlan
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                              : isPopular
                              ? 'bg-[#312C51] hover:bg-[#48426D] text-white shadow-xs'
                              : 'bg-[#F5F3F9] hover:bg-[#DDD6EE] text-[#312C51] border border-[#DDD6EE]'
                          } disabled:opacity-50`}
                        >
                          {processingPlanId === plan.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-[#F0C38E]" />
                              <span>Opening Razorpay Checkout...</span>
                            </>
                          ) : isCurrentPlan ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>Currently Active Plan</span>
                            </>
                          ) : (
                            <>
                              <span>Subscribe for ₹{plan.price}</span>
                              <ArrowRight className="w-4 h-4 text-[#F0C38E]" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Payment History Tab */
              payments.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No payment history"
                  description="Your completed subscription transactions will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {payments.map((pmt) => (
                    <div
                      key={pmt.id}
                      className="bg-white border border-[#EAE6F4] rounded-2xl p-4 flex items-center justify-between shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs text-[#312C51]">
                            {pmt.plan?.name || 'Subscription Plan'}
                          </h5>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              pmt.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {pmt.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#7D7696]">
                          {new Date(pmt.created_at).toLocaleString()} • {pmt.payment_method || 'Razorpay'}
                        </p>
                        {pmt.razorpay_payment_id && (
                          <p className="text-[9px] text-[#7D7696] font-mono">
                            ID: {pmt.razorpay_payment_id}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-[#312C51]">₹{pmt.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
