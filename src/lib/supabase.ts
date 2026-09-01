import { createClient } from '@supabase/supabase-js';

// Safe environment variable retrieval across Vite and Node
const getEnvVar = (viteKey: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  if (typeof process !== 'undefined' && process.env && process.env[viteKey]) {
    return process.env[viteKey];
  }
  return fallback;
};

// Helper to sanitize Supabase project root URL (removes trailing slashes, /rest/v1, /auth/v1 etc.)
export function sanitizeSupabaseUrl(rawUrl: string): string {
  let cleaned = (rawUrl || '').trim();
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/(rest|auth|storage|functions)(\/v\d+)?$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned || 'https://zaweivmgzxjfthvkkmzl.supabase.co';
}

const rawSupabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://zaweivmgzxjfthvkkmzl.supabase.co');
export const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const CONFIG = {
  SUPABASE_URL: supabaseUrl,
  RAZORPAY_KEY_ID: getEnvVar('VITE_RAZORPAY_KEY_ID', 'rzp_live_TVhxtzR8hlsFcN'),
  IMGBB_API_KEY: getEnvVar('VITE_IMGBB_API_KEY', 'bd4409d3bd7410ab3e30b50154ddce29'),
  APP_NAME: 'Vedika LearnHub',
  APP_VERSION: '1.0.0 (Build 2026.09)',
  SUPPORT_PHONE: '+91 62963 62232',
  SUPPORT_EMAIL: 'vedikalearnhub@gmail.com',
};
