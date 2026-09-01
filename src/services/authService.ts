import { supabase, CONFIG } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { resolvePersistentStudentId, getDeterministicStudentId, isValidPersistentStudentId } from '../lib/studentIdHelper';
import { Profile } from '../types';

export const authService = {
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch notice:', error.message);
        return null;
      }

      if (!data) return null;

      // Deterministically resolve permanent student ID from database or stable user hash
      const resolvedStudentId = resolvePersistentStudentId(userId, data.student_id);

      // Normalize profile fields across schema versions
      const normalized: Profile = {
        id: data.id,
        name: data.name || data.full_name || 'Student',
        full_name: data.name || data.full_name || 'Student',
        email: data.email || '',
        phone: data.phone || '',
        student_id: resolvedStudentId,
        photo_url: data.photo_url || data.image_url || data.avatar_url || '',
        image_url: data.photo_url || data.image_url || data.avatar_url || '',
        avatar_url: data.photo_url || data.image_url || data.avatar_url || '',
        class_grade: data.class_grade || 'Class 12',
        role: data.role || 'student',
        streak: data.streak ?? 1,
        force_logout: Boolean(data.force_logout),
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return normalized;
    } catch (e) {
      console.error('getProfile error:', e);
      return null;
    }
  },

  async login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw error;
    return data;
  },

  async register(params: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    classGrade?: string;
  }) {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.fullName.trim();
    const cleanPhone = params.phone.trim();
    const grade = params.classGrade || 'Class 12';

    // 1. Prepare dynamically resolved redirect URL
    const redirectUrl = getAuthRedirectUrl('signup');

    // 2. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: params.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: cleanName,
          full_name: cleanName,
          phone: cleanPhone,
          class_grade: grade,
          role: 'student',
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Account creation failed.');

    // 3. Deterministically resolve Student ID based on permanent User UUID
    const studentId = getDeterministicStudentId(authData.user.id);

    // 4. If session is active (email confirmation disabled or instant token), create profile record
    if (authData.session && authData.user) {
      try {
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          student_id: studentId,
          role: 'student',
          photo_url: null,
          streak: 1,
          force_logout: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (profErr) {
        console.warn('Profile sync notice:', profErr);
      }
    }

    const emailConfirmationRequired =
      !authData.session && Boolean(authData.user.confirmation_sent_at);

    return {
      user: authData.user,
      session: authData.session,
      studentId,
      emailConfirmationRequired,
    };
  },

  async resendVerificationEmail(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const redirectUrl = getAuthRedirectUrl('signup');
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) throw error;
    return data;
  },

  async resetPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const redirectUrl = getAuthRedirectUrl('recovery');
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(password: string) {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    // Exact column update mapping for profiles table
    const safeUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.full_name !== undefined || updates.name !== undefined) {
      safeUpdates.name = (updates.full_name || updates.name || '').trim();
    }
    if (updates.phone !== undefined) {
      safeUpdates.phone = updates.phone.trim();
    }
    if (updates.photo_url !== undefined || updates.image_url !== undefined || updates.avatar_url !== undefined) {
      safeUpdates.photo_url = updates.photo_url || updates.image_url || updates.avatar_url;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Also update auth user metadata if name/class_grade changed
    try {
      await supabase.auth.updateUser({
        data: {
          name: safeUpdates.name,
          full_name: safeUpdates.name,
          phone: safeUpdates.phone,
          class_grade: updates.class_grade,
        },
      });
    } catch {
      // Non-critical
    }

    return {
      ...data,
      full_name: data.name || 'Student',
      image_url: data.photo_url,
      avatar_url: data.photo_url,
      class_grade: updates.class_grade || 'Class 12',
    } as Profile;
  },

  async uploadImageToImgBB(fileOrBase64: File | string): Promise<string> {
    let base64String = '';

    if (fileOrBase64 instanceof File) {
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileOrBase64);
      });
    } else {
      base64String = fileOrBase64;
    }

    // Call secure backend proxy
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image: base64String }),
    });

    if (!response.ok) {
      // Fallback direct ImgBB client call if server proxy is unavailable
      const cleanBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
      const formData = new FormData();
      formData.append('image', cleanBase64);

      const directRes = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      const directData = await directRes.json();
      if (directData?.success && directData?.data?.url) {
        return directData.data.display_url || directData.data.url;
      }
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    if (!data.success || !data.url) {
      throw new Error(data.error || 'Failed to upload image');
    }
    return data.url;
  },

  async logout() {
    await supabase.auth.signOut();
  },
};
