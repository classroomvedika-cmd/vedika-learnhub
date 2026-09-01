import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { resolvePersistentStudentId } from '../lib/studentIdHelper';
import { Profile, Subscription } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  isLoading: boolean;
  unreadNotificationsCount: number;
  login: typeof authService.login;
  register: typeof authService.register;
  resendVerificationEmail: typeof authService.resendVerificationEmail;
  resetPassword: typeof authService.resetPassword;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<Profile | null>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshNotificationsCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  const fetchProfileAndSubscription = useCallback(async (currentUserId: string) => {
    try {
      const [profData, subData] = await Promise.all([
        authService.getProfile(currentUserId),
        dataService.getUserSubscription(currentUserId),
      ]);

      if (profData) {
        setProfile(profData);
        // Check force logout
        if (profData.force_logout) {
          await authService.logout();
          setUser(null);
          setSession(null);
          setProfile(null);
          alert('Your account session was ended by the administrator.');
          return;
        }
      } else {
        // Create deterministic profile representation if first time sign-in
        const persistentId = resolvePersistentStudentId(currentUserId);
        const fallbackProfile: Profile = {
          id: currentUserId,
          full_name: 'Vedika Student',
          email: '',
          student_id: persistentId,
          class_grade: 'Class 12',
          role: 'student',
          streak: 1,
          force_logout: false,
        };
        setProfile(fallbackProfile);
      }

      setSubscription(subData);
    } catch (e) {
      console.error('Error fetching student profile/subscription:', e);
    }
  }, []);

  const refreshNotificationsCount = useCallback(async () => {
    if (!user) {
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const notifs = await dataService.getNotifications(user.id);
      const unread = notifs.filter((n) => !n.is_read).length;
      setUnreadNotificationsCount(unread);
    } catch {
      // Ignore count error
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial session restore
    authService.getSession().then((currSession) => {
      if (!isMounted) return;
      setSession(currSession);
      setUser(currSession?.user || null);
      if (currSession?.user) {
        fetchProfileAndSubscription(currSession.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // 2. Auth State Change Listener
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Fetch profile in background without flashing full-screen loading if already loaded
          await fetchProfileAndSubscription(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setSubscription(null);
        }
      }
    );

    return () => {
      isMounted = false;
      authSub.unsubscribe();
    };
  }, [fetchProfileAndSubscription]);

  // Realtime subscription for Profile force_logout & updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            const updated = payload.new as Profile;
            setProfile(updated);
            if (updated.force_logout) {
              authService.logout().then(() => {
                setUser(null);
                setSession(null);
                setProfile(null);
                alert('Your account session was ended by the administrator.');
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchProfileAndSubscription(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchProfileAndSubscription]);

  useEffect(() => {
    if (user?.id) {
      refreshNotificationsCount();
    }
  }, [user?.id, refreshNotificationsCount]);

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Supabase signOut error:', e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setSubscription(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
        } catch {
          // ignore storage clear errors
        }
      }
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user?.id) return null;
    try {
      const updated = await authService.updateProfile(user.id, updates);
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      return updated;
    } catch (err) {
      console.error('Update profile error:', err);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const p = await authService.getProfile(user.id);
      if (p) setProfile(p);
    }
  };

  const refreshSubscription = async () => {
    if (user?.id) {
      const sub = await dataService.getUserSubscription(user.id);
      setSubscription(sub);
    }
  };

  const hasActiveSubscription = Boolean(
    subscription &&
    subscription.status === 'active' &&
    new Date((subscription as any).expie_date || subscription.expiry_date).getTime() > Date.now()
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscription,
        hasActiveSubscription,
        isLoading,
        unreadNotificationsCount,
        login: authService.login,
        register: authService.register,
        resendVerificationEmail: authService.resendVerificationEmail,
        resetPassword: authService.resetPassword,
        logout,
        updateProfile,
        refreshProfile,
        refreshSubscription,
        refreshNotificationsCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
