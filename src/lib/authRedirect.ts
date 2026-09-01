/**
 * Centralized Authentication & Deep-Link Redirect Configuration
 * Supports Web runtime, configurable environment URLs, and Mobile/Flutter deep-linking.
 */

export function getAuthRedirectUrl(action: 'signup' | 'recovery' | 'magiclink' = 'signup'): string {
  // 1. Check if a custom redirect/deep-link URL is explicitly configured in environment
  const customRedirect =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AUTH_REDIRECT_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_AUTH_REDIRECT_URL);

  if (customRedirect && typeof customRedirect === 'string' && customRedirect.trim()) {
    const cleanCustom = customRedirect.trim().replace(/\/+$/, '');
    return `${cleanCustom}/auth/callback?type=${action}`;
  }

  // 2. Browser / Web runtime detection
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin.replace(/\/+$/, '');
    // Ensure origin is a valid HTTP(S) URL
    if (origin.startsWith('http://') || origin.startsWith('https://')) {
      return `${origin}/auth/callback?type=${action}`;
    }
  }

  // 3. Fallback mobile/app deep-link schema
  return `vedika://auth/callback?type=${action}`;
}

export function getBaseCallbackPath(): string {
  return '/auth/callback';
}
