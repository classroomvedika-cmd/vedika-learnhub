import { supabase } from '../lib/supabase';
import {
  Plan,
  Subscription,
  Payment,
  ContentCategory,
  ContentItem,
  ContentButton,
  Post,
  AppNotification,
  RoutineItem,
  Exam,
  ExamQuestion,
  ExamResult,
  GroupMessage,
  PrivateMessage,
  Doubt,
  DoubtReply,
  LeaderboardEntry,
  AIKnowledge,
} from '../types';

export const dataService = {
  // ---------------- PLANS & SUBSCRIPTIONS ----------------
  async getPlans(): Promise<Plan[]> {
    console.log('[PLAN_FETCH_STARTED]');
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*');

      if (error) {
        console.error('[PLAN_FETCH_FAILED]', error.message);
        throw new Error(error.message || 'Unable to load subscription plans.');
      }

      console.log('[PLAN_FETCH_SUCCESS]', `${data?.length || 0} plans retrieved`);

      let activeList = (data || []).filter((p: any) =>
        p.is_active === true || p.active === true || (p.is_active !== false && p.active !== false)
      );

      // Default active plans if database has not been seeded by admin yet
      if (activeList.length === 0) {
        activeList = [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Basic Starter',
            amount: 99,
            duration_days: 30,
            description: '30 Days Access to all basic course modules and practice quizzes',
            features: ['Full Course Access', 'Daily Practice Quizzes', 'Community Chat Access'],
            is_active: true
          },
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Pro Learner',
            amount: 199,
            duration_days: 90,
            description: '90 Days Unlimited Access with priority doubt solving and mock tests',
            features: ['Everything in Basic', '90 Days Full Access', 'Priority Doubt Clearing', 'Full Length Mock Tests'],
            is_active: true
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Mastery Annual',
            amount: 499,
            duration_days: 365,
            description: '365 Days Complete Access to all Premium Vedika content and 1-on-1 mentorship',
            features: ['365 Days Premium Access', '1-on-1 Help Desk Mentorship', 'All Mock Exams & Certificates', 'Downloadable Offline Resources'],
            is_active: true
          }
        ];
      }

      const mappedPlans: Plan[] = activeList.map((p: any) => {
        let parsedFeatures: string[] = [];
        if (Array.isArray(p.features)) {
          parsedFeatures = p.features;
        } else if (typeof p.features === 'string') {
          try {
            parsedFeatures = JSON.parse(p.features);
          } catch {
            parsedFeatures = [];
          }
        }

        const planPrice = Number(p.amount ?? p.price ?? 0);

        return {
          id: String(p.id),
          name: p.name || p.title || 'Subscription Plan',
          price: planPrice,
          amount: planPrice,
          duration_days: Number(p.duration_days ?? p.duration ?? 30),
          description: p.description || '',
          features: parsedFeatures,
          is_active: true,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString(),
        };
      });

      // Sort by price ascending
      mappedPlans.sort((a, b) => a.price - b.price);

      return mappedPlans;
    } catch (err: any) {
      console.error('[PLAN_FETCH_FAILED] Exception:', err?.message || err);
      throw err;
    }
  },

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('student_uid', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Subscription fetch error:', error.message);
        return null;
      }

      if (data && data.plan) {
        const p = data.plan as any;
        data.plan = {
          ...p,
          price: Number(p.amount ?? p.price ?? 0),
          amount: Number(p.amount ?? p.price ?? 0),
        };
      }
      return data as Subscription;
    } catch (e) {
      console.error('Subscription exception:', e);
      return null;
    }
  },

  async getUserPayments(userId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*, plan:plans(*)')
      .eq('student_uid', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Payments fetch error:', error.message);
      return [];
    }

    return (data || []).map((pmt: any) => {
      if (pmt.plan) {
        pmt.plan = {
          ...pmt.plan,
          price: Number(pmt.plan.amount ?? pmt.plan.price ?? 0),
          amount: Number(pmt.plan.amount ?? pmt.plan.price ?? 0),
        };
      }
      return pmt;
    }) as Payment[];
  },

  async createPaymentRecord(payment: {
    student_uid: string;
    plan_id: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    payment_method?: string;
    razorpay_payment_id?: string;
  }) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        student_uid: payment.student_uid,
        plan_id: payment.plan_id,
        amount: payment.amount,
        status: payment.status,
        razorpay_payment_id: payment.razorpay_payment_id || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async activateSubscription(userId: string, planId: string, durationDays: number) {
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + (durationDays || 30));

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        student_uid: userId,
        plan_id: planId,
        status: 'active',
        start_date: startDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ---------------- LEARNING CONTENT ----------------
  async getCategories(): Promise<ContentCategory[]> {
    const { data, error } = await supabase
      .from('content_categories')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false });

    if (error) {
      console.warn('Categories fetch error:', error);
      return [];
    }
    return (data || []) as ContentCategory[];
  },

  async getContentByCategory(categoryId?: string, search?: string): Promise<ContentItem[]> {
    let query = supabase
      .from('contents')
      .select('*, buttons:content_buttons(*), category:content_categories(*)')
      .order('created_at', { ascending: false });

    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    if (search && search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Contents fetch error:', error);
      return [];
    }
    return (data || []) as ContentItem[];
  },

  async getContentById(id: string): Promise<ContentItem | null> {
    const { data, error } = await supabase
      .from('contents')
      .select('*, buttons:content_buttons(*), category:content_categories(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('Content fetch error:', error);
      return null;
    }
    return data as ContentItem;
  },

  // ---------------- POSTS / ANNOUNCEMENTS ----------------
  async getPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*, buttons:post_buttons(*)')
      .order('is_pinned', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Posts fetch error:', error);
      return [];
    }
    return (data || []) as Post[];
  },

  async getAnnouncements(): Promise<Post[]> {
    return this.getPosts();
  },

  async getPostById(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*, buttons:post_buttons(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) return null;
    return data as Post;
  },

  // ---------------- NOTIFICATIONS ----------------
  async getNotifications(userId?: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notifications fetch error:', error);
      return [];
    }

    // Read stored read-notification IDs from localStorage for this student
    const readKey = userId ? `vedika_read_notifs_${userId}` : 'vedika_read_notifs_guest';
    let readIds: string[] = [];
    try {
      const stored = localStorage.getItem(readKey);
      if (stored) readIds = JSON.parse(stored);
    } catch (e) {
      readIds = [];
    }

    return (data || []).map((n: any) => ({
      id: String(n.id),
      title: n.title || 'Vedika Announcement',
      message: n.message || n.body || n.content || '',
      type: n.type || 'info',
      created_at: n.created_at || new Date().toISOString(),
      is_read: readIds.includes(String(n.id)) || Boolean(n.is_read),
      user_id: userId || null,
    })) as AppNotification[];
  },

  async markNotificationRead(id: string, userId?: string) {
    if (!userId) {
      const activeUser = (await supabase.auth.getUser()).data.user;
      userId = activeUser?.id;
    }
    const readKey = userId ? `vedika_read_notifs_${userId}` : 'vedika_read_notifs_guest';
    try {
      const stored = localStorage.getItem(readKey);
      const readIds: string[] = stored ? JSON.parse(stored) : [];
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem(readKey, JSON.stringify(readIds));
      }
    } catch (e) {
      console.warn('LocalStorage error saving notification read state:', e);
    }
  },

  async markNotificationAsRead(id: string, userId?: string) {
    return this.markNotificationRead(id, userId);
  },

  async markAllNotificationsAsRead(userId: string) {
    const notifs = await this.getNotifications(userId);
    const readKey = `vedika_read_notifs_${userId}`;
    const allIds = notifs.map((n) => n.id);
    try {
      localStorage.setItem(readKey, JSON.stringify(allIds));
    } catch (e) {
      console.warn('LocalStorage error marking all read:', e);
    }
  },

  async deleteNotification(notificationId: string, studentUid: string): Promise<boolean> {
    const activeUser = (await supabase.auth.getUser()).data.user;
    if (!activeUser || activeUser.id !== studentUid) {
      throw new Error('Unauthorized to delete this notification.');
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('[NOTIFICATION_DELETE_FAILED]', error.message, error.code);
      throw new Error(error.message || 'Failed to delete notification.');
    }

    // Post-check verification
    const { data: checkData } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', notificationId)
      .maybeSingle();

    if (checkData) {
      console.error('[NOTIFICATION_DELETE_VERIFY_FAILED] Notification still exists in DB:', notificationId);
      throw new Error('Unable to delete this notification. Please try again.');
    }

    console.log('[NOTIFICATION_DELETE_SUCCESS] Verified deleted from database:', notificationId);
    return true;
  },

  // ---------------- ROUTINE ----------------
  async getRoutine(): Promise<RoutineItem[]> {
    const { data, error } = await supabase
      .from('routine')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.warn('Routine fetch error:', error);
      return [];
    }
    return (data || []) as RoutineItem[];
  },

  // ---------------- EXAMS ----------------
  async getExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Exams fetch error:', error);
      return [];
    }
    return (data || []) as Exam[];
  },

  async getExamById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) return null;
    return data as Exam;
  },

  async getExamQuestions(examId: string): Promise<ExamQuestion[]> {
    console.log('[EXAM_QUESTIONS_FETCH_STARTED]', examId);
    if (!examId) return [];

    let { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .eq('exam_id', examId);

    // If query returned error or empty and examId is numeric string, try matching as number
    if ((error || !data || data.length === 0) && !isNaN(Number(examId))) {
      const numQuery = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', Number(examId));
      if (!numQuery.error && numQuery.data && numQuery.data.length > 0) {
        data = numQuery.data;
        error = null;
      }
    }

    if (error) {
      console.error('[EXAM_QUESTIONS_FETCH_FAILED]', error.message, error.code);
      throw new Error(error.message || 'Unable to load exam questions.');
    }

    const rawList = data || [];

    // Sort safely in memory to prevent missing column errors
    rawList.sort((a: any, b: any) => {
      const orderA = a.sort_order ?? a.order ?? a.id ?? 0;
      const orderB = b.sort_order ?? b.order ?? b.id ?? 0;
      return orderA > orderB ? 1 : -1;
    });

    return rawList.map((q: any) => {
      let parsedOptions: string[] = [];

      if (Array.isArray(q.options)) {
        parsedOptions = q.options.map((o: any) => typeof o === 'string' ? o : (o.text || o.option || JSON.stringify(o)));
      } else if (typeof q.options === 'string') {
        try {
          const parsed = JSON.parse(q.options);
          if (Array.isArray(parsed)) {
            parsedOptions = parsed.map((o: any) => typeof o === 'string' ? o : (o.text || o.option || JSON.stringify(o)));
          } else if (typeof parsed === 'object' && parsed !== null) {
            parsedOptions = Object.values(parsed).map(String);
          }
        } catch {
          if (q.options.includes('\n')) {
            parsedOptions = q.options.split('\n').map((s: string) => s.trim()).filter(Boolean);
          }
        }
      } else if (typeof q.options === 'object' && q.options !== null) {
        parsedOptions = Object.values(q.options).map(String);
      }

      // Fallback 1: options_json
      if (parsedOptions.length === 0 && q.options_json) {
        const jsonVal = typeof q.options_json === 'string' ? (() => { try { return JSON.parse(q.options_json); } catch { return []; } })() : q.options_json;
        if (Array.isArray(jsonVal)) parsedOptions = jsonVal.map(String);
        else if (typeof jsonVal === 'object' && jsonVal !== null) parsedOptions = Object.values(jsonVal).map(String);
      }

      // Fallback 2: option_a, option_b, option_c, option_d or option1, option2...
      if (parsedOptions.length === 0) {
        const individual = [
          q.option_a ?? q.optionA ?? q.option_1 ?? q.option1 ?? q.a,
          q.option_b ?? q.optionB ?? q.option_2 ?? q.option2 ?? q.b,
          q.option_c ?? q.optionC ?? q.option_3 ?? q.option3 ?? q.c,
          q.option_d ?? q.optionD ?? q.option_4 ?? q.option4 ?? q.d,
        ].filter((item) => item !== undefined && item !== null && String(item).trim() !== '');

        if (individual.length > 0) {
          parsedOptions = individual.map(String);
        }
      }

      // Parse correct_option
      let correctOpt = 0;
      const rawCorrect = q.correct_option ?? q.correct_answer ?? q.answer ?? q.correct_idx ?? q.correct_index ?? q.answer_key;
      if (typeof rawCorrect === 'number') {
        correctOpt = rawCorrect;
      } else if (typeof rawCorrect === 'string') {
        const trimmed = rawCorrect.trim().toUpperCase();
        if (['A', 'OPTION A', 'OPTION_A', '0'].includes(trimmed)) correctOpt = 0;
        else if (['B', 'OPTION B', 'OPTION_B', '1'].includes(trimmed)) correctOpt = 1;
        else if (['C', 'OPTION C', 'OPTION_C', '2'].includes(trimmed)) correctOpt = 2;
        else if (['D', 'OPTION D', 'OPTION_D', '3'].includes(trimmed)) correctOpt = 3;
        else if (!isNaN(Number(trimmed))) correctOpt = Number(trimmed);
      }

      return {
        id: String(q.id),
        exam_id: String(q.exam_id),
        question_text: q.question_text || q.question || q.title || 'Question',
        question_image: q.question_image || q.image_url || null,
        options: parsedOptions,
        correct_option: correctOpt,
        marks: Number(q.marks || 1),
        negative_marks: Number(q.negative_marks || 0),
        sort_order: q.sort_order ?? q.order ?? 0,
        explanation: q.explanation || q.solution || null,
      } as ExamQuestion;
    });
  },

  async submitExamResult(result: Partial<ExamResult>, answers: any[]) {
    const activeUser = (await supabase.auth.getUser()).data.user;
    if (!activeUser || !result.student_id || activeUser.id !== result.student_id) {
      throw new Error('Unauthorized submission attempt');
    }

    // 1. Check for duplicate submission using student_uid column
    const { data: existing } = await supabase
      .from('exam_results')
      .select('*, exam:exams(*)')
      .eq('exam_id', result.exam_id)
      .eq('student_uid', activeUser.id)
      .maybeSingle();

    if (existing) {
      console.log('[EXAM_SUBMIT_DUPLICATE_PREVENTED] Returning existing result:', existing.id);
      return {
        ...existing,
        student_id: activeUser.id,
        student_uid: activeUser.id,
        score: existing.score ?? result.score ?? 0,
        total_marks: result.total_marks ?? existing.total_questions ?? 0,
        correct_count: result.correct_count ?? 0,
        incorrect_count: result.incorrect_count ?? 0,
        unattempted_count: result.unattempted_count ?? 0,
        percentage: result.percentage ?? 0,
        passed: Boolean(result.passed),
      } as ExamResult;
    }

    // 2. Insert primary result into exam_results using matching schema columns (id, exam_id, student_uid, score, total_questions, submitted_at)
    const payload = {
      exam_id: result.exam_id,
      student_uid: activeUser.id,
      score: Number(result.score || 0),
      total_questions: Number(result.unattempted_count !== undefined ? (result.correct_count || 0) + (result.incorrect_count || 0) + result.unattempted_count : (answers.length || 1)),
      submitted_at: new Date().toISOString(),
    };

    const primaryInsert = await supabase
      .from('exam_results')
      .insert(payload)
      .select()
      .single();

    if (primaryInsert.error) {
      console.error('[EXAM_RESULTS_SUBMIT_FAILED]', primaryInsert.error.message, primaryInsert.error.details);
      throw new Error(primaryInsert.error.message || 'Failed to save exam result to database.');
    }

    const resData = primaryInsert.data;

    // 3. Save student question answers to exam_answers using matching schema columns (result_id, question_id, is_correct)
    try {
      if (answers.length > 0 && resData?.id) {
        const mappedAnswers = answers.map((ans) => ({
          result_id: resData.id,
          question_id: ans.question_id,
          is_correct: Boolean(ans.is_correct),
        }));
        const ansInsert = await supabase.from('exam_answers').insert(mappedAnswers);
        if (ansInsert.error) {
          console.warn('[EXAM_ANSWERS_INSERT_WARN]', ansInsert.error.message);
        }
      }
    } catch (ansErr) {
      console.warn('[EXAM_ANSWERS_INSERT_EXCEPTION] Could not insert question answers:', ansErr);
    }

    // Merge computed metrics for UI rendering
    const finalizedResult = {
      ...resData,
      student_id: activeUser.id,
      student_uid: activeUser.id,
      score: Number(result.score || 0),
      total_marks: Number(result.total_marks || result.score || 0),
      correct_count: Number(result.correct_count || 0),
      incorrect_count: Number(result.incorrect_count || 0),
      unattempted_count: Number(result.unattempted_count || 0),
      percentage: Number(result.percentage || 0),
      passed: Boolean(result.passed),
    } as ExamResult;

    return finalizedResult;
  },

  async getStudentExamResults(studentId: string): Promise<ExamResult[]> {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*, exam:exams(*)')
      .eq('student_uid', studentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.warn('Student exam results error:', error);
      return [];
    }

    return (data || []).map((res: any) => {
      const score = Number(res.score || 0);
      const examObj = res.exam || {};
      const totalMarks = Number(res.total_marks ?? examObj.total_marks ?? res.total_questions ?? (score > 0 ? score : 1));
      const totalQuestions = Number(res.total_questions ?? examObj.total_questions ?? (score > 0 ? score : 1));
      const correctCount = Number(res.correct_count ?? score);
      const incorrectCount = Number(res.incorrect_count ?? Math.max(0, totalQuestions - correctCount));
      const percentage = Number(res.percentage ?? (totalMarks > 0 ? (score / totalMarks) * 100 : (score / Math.max(1, totalQuestions)) * 100));
      const passingMarks = Number(examObj.passing_marks ?? Math.ceil(totalMarks * 0.4));
      const passed = res.passed !== undefined ? Boolean(res.passed) : score >= passingMarks;

      return {
        ...res,
        student_id: studentId,
        student_uid: studentId,
        score,
        total_marks: totalMarks,
        total_questions: totalQuestions,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        unattempted_count: Number(res.unattempted_count ?? 0),
        percentage: Number.isNaN(percentage) ? 0 : percentage,
        passed,
        submitted_at: res.submitted_at || res.created_at || new Date().toISOString(),
      } as ExamResult;
    });
  },

  // ---------------- CHAT & COMMUNITY ----------------
  async getGroupMessages(limit = 100): Promise<GroupMessage[]> {
    console.log('[COMMUNITY_FETCH_STARTED]');
    const { data, error } = await supabase
      .from('group_messages')
      .select('id, sender_uid, sender_name, message, created_at')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[COMMUNITY_FETCH_FAILED]', error.message);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      sender_id: m.sender_uid,
      sender_uid: m.sender_uid,
      sender_name: m.sender_name || 'Student',
      message: m.message,
      created_at: m.created_at,
    })) as GroupMessage[];
  },

  async sendGroupMessage(msg: {
    sender_name: string;
    message: string;
  }): Promise<GroupMessage> {
    console.log('[COMMUNITY_SEND_STARTED]');

    const trimmedMessage = (msg.message || '').trim();
    if (!trimmedMessage) {
      console.error('[COMMUNITY_INSERT_FAILED] Empty message body');
      throw new Error('Message cannot be empty.');
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const user = session?.user;
    if (sessionError || !user) {
      console.error('[COMMUNITY_INSERT_FAILED] Unauthenticated student session');
      throw new Error('You must be logged in to send a community message.');
    }

    const { data, error } = await supabase
      .from('group_messages')
      .insert({
        sender_uid: user.id, // Authenticated student session UUID
        sender_name: (msg.sender_name || 'Student').trim(),
        message: trimmedMessage,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[COMMUNITY_INSERT_FAILED]', error.message);
      throw new Error(error.message || 'Failed to send community message.');
    }

    console.log('[COMMUNITY_INSERT_SUCCESS]', data.id);

    return {
      id: data.id,
      sender_id: data.sender_uid,
      sender_uid: data.sender_uid,
      sender_name: data.sender_name,
      message: data.message,
      created_at: data.created_at,
    } as GroupMessage;
  },

  async getPrivateMessages(userId: string): Promise<PrivateMessage[]> {
    console.log('[HELPDESK_FETCH_STARTED]');
    if (!userId) return [];

    const { data, error } = await supabase
      .from('private_messages')
      .select('id, sender_uid, receiver_uid, message, created_at')
      .or(`sender_uid.eq.${userId},receiver_uid.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[HELPDESK_FETCH_FAILED]', error.message);
      return [];
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      sender_id: m.sender_uid,
      sender_uid: m.sender_uid,
      receiver_id: m.receiver_uid,
      receiver_uid: m.receiver_uid,
      sender_name: m.sender_uid === userId ? 'You' : 'Vedika Support',
      message: m.message,
      created_at: m.created_at,
    })) as PrivateMessage[];
  },

  async resolveAdminUid(): Promise<string | null> {
    try {
      // 1. Check profiles table for an account with role 'admin' or 'support'
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .or('role.eq.admin,role.eq.support')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[ADMIN_UID_RESOLUTION] Notice querying admin profile:', error.message);
      }

      if (data?.id) {
        console.log('[ADMIN_UID_RESOLVED]', data.id);
        return data.id;
      }

      // 2. Check if any existing private_messages record specifies a real receiver_uid
      const { data: pmData } = await supabase
        .from('private_messages')
        .select('receiver_uid')
        .not('receiver_uid', 'is', null)
        .limit(1)
        .maybeSingle();

      if (pmData?.receiver_uid && pmData.receiver_uid.length === 36) {
        console.log('[ADMIN_UID_RESOLVED_FROM_MESSAGES]', pmData.receiver_uid);
        return pmData.receiver_uid;
      }

      console.warn('[ADMIN_UID_RESOLUTION] No real Admin/Support UID found in database');
      return null;
    } catch (err) {
      console.error('[ADMIN_UID_RESOLUTION_FAILED]', err);
      return null;
    }
  },

  async sendPrivateMessage(msg: {
    receiver_uid?: string;
    message: string;
  }): Promise<PrivateMessage> {
    console.log('[HELPDESK_SEND_STARTED]');

    const trimmedMessage = (msg.message || '').trim();
    if (!trimmedMessage) {
      console.error('[HELPDESK_INSERT_FAILED] Empty message body');
      throw new Error('Support message cannot be empty.');
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const user = session?.user;
    if (sessionError || !user) {
      console.error('[HELPDESK_INSERT_FAILED] Unauthenticated student session');
      throw new Error('You must be logged in to message support desk.');
    }

    let targetReceiverUid = msg.receiver_uid;
    if (!targetReceiverUid || targetReceiverUid.length !== 36) {
      targetReceiverUid = (await this.resolveAdminUid()) || undefined;
    }

    if (!targetReceiverUid) {
      console.error('[HELPDESK_INSERT_FAILED] Could not resolve real Admin/Support UID in database');
      throw new Error('Support is currently unavailable. Please try again later.');
    }

    // 1. Execute REAL Supabase INSERT
    const { data, error } = await supabase
      .from('private_messages')
      .insert({
        sender_uid: user.id, // Authenticated student UID
        receiver_uid: targetReceiverUid, // REAL Admin/Support UID
        message: trimmedMessage,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[HELPDESK_INSERT_FAILED]', error.message, error.code);
      if (error.message.includes('foreign key constraint') || error.code === '23503') {
        throw new Error('Support is currently unavailable. Please try again later.');
      }
      throw new Error('Message could not be sent. Please try again.');
    }

    // 2. Perform safe verification readback to confirm database insertion
    const { data: readback, error: readbackError } = await supabase
      .from('private_messages')
      .select('id, sender_uid, receiver_uid, message, created_at')
      .eq('id', data.id)
      .single();

    if (readbackError || !readback) {
      console.error('[HELPDESK_VERIFY_FAILED] Could not read back inserted row from database');
      throw new Error('Message could not be sent. Please try again.');
    }

    console.log('[HELPDESK_INSERT_SUCCESS]', readback.id);

    return {
      id: readback.id,
      sender_id: readback.sender_uid,
      sender_uid: readback.sender_uid,
      receiver_id: readback.receiver_uid,
      receiver_uid: readback.receiver_uid,
      sender_name: 'You',
      message: readback.message,
      created_at: readback.created_at,
    } as PrivateMessage;
  },

  // ---------------- COMMUNITY CHAT DELETE ----------------
  async deleteGroupMessage(messageId: string, studentUid: string): Promise<boolean> {
    console.log('[COMMUNITY_DELETE_STARTED]', messageId, studentUid);

    if (!messageId) {
      throw new Error('Invalid message ID for deletion.');
    }

    // 1. Retrieve current authenticated user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const activeUser = session?.user;
    if (sessionError || !activeUser) {
      console.error('[COMMUNITY_DELETE_FAILED] Unauthenticated session');
      throw new Error('You must be logged in to delete a message.');
    }

    const targetUid = activeUser.id;

    // 2. Execute REAL Supabase DELETE
    const { data, error, count } = await supabase
      .from('group_messages')
      .delete({ count: 'exact' })
      .eq('id', messageId)
      .eq('sender_uid', targetUid)
      .select();

    if (error) {
      console.error('[COMMUNITY_DELETE_FAILED]', error.message, error.code);
    }

    // 3. Post-verification check
    const { data: checkData } = await supabase
      .from('group_messages')
      .select('id')
      .eq('id', messageId)
      .maybeSingle();

    if (checkData) {
      console.error('[COMMUNITY_DELETE_VERIFY_FAILED] Message still exists in DB:', messageId);
      throw new Error('Unable to delete this message. Please try again.');
    }

    console.log('[COMMUNITY_DELETE_SUCCESS] Record verified removed from database:', messageId);
    return true;
  },

  // ---------------- DOUBTS ----------------
  async getDoubts(): Promise<Doubt[]> {
    try {
      const { data, error } = await supabase
        .from('doubts')
        .select('*, profile:profiles!student_uid(id, name, photo_url, student_id), replies:doubt_replies(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Doubts fetch with join notice, running simple query fallback:', error.message);
        const { data: simpleData, error: simpleErr } = await supabase
          .from('doubts')
          .select('*')
          .order('created_at', { ascending: false });

        if (simpleErr) {
          console.warn('Doubts simple fetch error:', simpleErr);
          return [];
        }

        return (simpleData || []).map((d: any) => {
          const rawText = d.text || '';
          let subject = 'Academic';
          let title = rawText;
          let description = rawText;

          if (rawText.startsWith('[')) {
            const closeBracket = rawText.indexOf(']');
            if (closeBracket > 1) {
              subject = rawText.substring(1, closeBracket);
              const remaining = rawText.substring(closeBracket + 1).trim();
              const lines = remaining.split('\n');
              title = lines[0] || remaining;
              description = lines.slice(1).join('\n').trim() || title;
            }
          }

          return {
            id: d.id,
            student_uid: d.student_uid,
            student_id: d.student_uid,
            student_name: 'Student',
            student_avatar: undefined,
            text: rawText,
            title: title || 'Academic Doubt',
            description: description || rawText,
            subject,
            image_url: d.image_url,
            status: 'open',
            created_at: d.created_at,
            replies: [],
          } as Doubt;
        });
      }

      return (data || []).map((d: any) => {
        const rawText = d.text || '';
        let subject = 'Academic';
        let title = rawText;
        let description = rawText;

        if (rawText.startsWith('[')) {
          const closeBracket = rawText.indexOf(']');
          if (closeBracket > 1) {
            subject = rawText.substring(1, closeBracket);
            const remaining = rawText.substring(closeBracket + 1).trim();
            const lines = remaining.split('\n');
            title = lines[0] || remaining;
            description = lines.slice(1).join('\n').trim() || title;
          }
        }

        const replies = (d.replies || []).map((r: any) => ({
          id: r.id,
          doubt_id: r.doubt_id,
          message: r.message,
          created_at: r.created_at,
          sender_name: 'Vedika Educator',
          sender_role: 'educator' as const,
        }));

        const prof = d.profile;
        return {
          id: d.id,
          student_uid: d.student_uid,
          student_id: prof?.student_id || d.student_uid,
          student_name: prof?.name || 'Student',
          student_avatar: prof?.photo_url || undefined,
          text: rawText,
          title: title || 'Academic Doubt',
          description: description || rawText,
          subject,
          image_url: d.image_url,
          status: replies.length > 0 ? 'answered' : 'open',
          created_at: d.created_at,
          replies,
        } as Doubt;
      });
    } catch (e) {
      console.error('getDoubts exception:', e);
      return [];
    }
  },

  async createDoubt(payload: { student_uid: string; text: string; image_url?: string | null }) {
    const { data, error } = await supabase
      .from('doubts')
      .insert({
        student_uid: payload.student_uid,
        text: payload.text.trim(),
        image_url: payload.image_url || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase createDoubt error:', error);
      throw error;
    }
    return data;
  },

  async addDoubtReply(payload: {
    doubt_id: string;
    message: string;
    sender_id?: string;
    sender_name?: string;
    sender_role?: string;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    const insertData: any = {
      doubt_id: payload.doubt_id,
      sender_uid: user?.id || payload.sender_id,
      message: payload.message.trim(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('doubt_replies')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase addDoubtReply error:', error);
      throw error;
    }
    return data;
  },

  async deleteDoubt(doubtId: string, studentUid: string): Promise<boolean> {
    console.log('[DOUBT_DELETE_STARTED]', doubtId, studentUid);

    if (!doubtId) {
      throw new Error('Invalid parameters for doubt deletion.');
    }

    // 1. Retrieve current authenticated user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const activeUser = session?.user;
    if (sessionError || !activeUser) {
      console.error('[DOUBT_DELETE_FAILED] Unauthenticated session');
      throw new Error('You must be logged in to delete a doubt.');
    }

    const targetUid = activeUser.id;

    // 2. Pre-delete replies to prevent foreign key constraint violations if CASCADE is not set
    try {
      await supabase
        .from('doubt_replies')
        .delete()
        .eq('doubt_id', doubtId);
    } catch (replyErr) {
      console.warn('[DOUBT_REPLIES_PRE_DELETE_WARN]', replyErr);
    }

    // 3. Execute REAL Supabase DELETE on doubts
    const { data, error } = await supabase
      .from('doubts')
      .delete({ count: 'exact' })
      .eq('id', doubtId)
      .eq('student_uid', targetUid)
      .select();

    if (error) {
      console.error('[DOUBT_DELETE_FAILED]', error.message, error.code);
      throw new Error(error.message || 'Failed to delete doubt from database.');
    }

    // 4. Post-verification check
    const { data: checkData } = await supabase
      .from('doubts')
      .select('id')
      .eq('id', doubtId)
      .maybeSingle();

    if (checkData) {
      console.error('[DOUBT_DELETE_VERIFY_FAILED] Doubt still exists in DB:', doubtId);
      throw new Error('Unable to delete this doubt. Please try again.');
    }

    console.log('[DOUBT_DELETE_SUCCESS] Record verified removed from database:', doubtId);
    return true;
  },

  // ---------------- LEADERBOARD ----------------
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .order('points', { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) {
      console.warn('Leaderboard error:', error);
      return [];
    }
    return (data || []).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })) as LeaderboardEntry[];
  },

  // ---------------- AI KNOWLEDGE BASE ----------------
  async getAIKnowledge(): Promise<AIKnowledge[]> {
    const { data, error } = await supabase
      .from('ai_knowledge')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.warn('AI Knowledge error:', error);
      return [];
    }
    return (data || []) as AIKnowledge[];
  },
};
