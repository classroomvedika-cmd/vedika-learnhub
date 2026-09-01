export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  name?: string;
  email: string;
  phone?: string;
  student_id: string;
  image_url?: string;
  avatar_url?: string;
  photo_url?: string;
  class_grade?: string;
  role: UserRole;
  streak?: number;
  force_logout?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  features?: string[] | string;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  student_id?: string;
  plan_id: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  start_date: string;
  expiry_date: string;
  plan?: Plan;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  student_id?: string;
  plan_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  payment_method?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  plan?: Plan;
  created_at: string;
}

export interface ContentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  image_url?: string;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  content_count?: number;
  access_type?: 'free' | 'subscriber';
}

export interface ContentButton {
  id: string;
  content_id: string;
  label: string;
  url: string;
  button_type?: 'pdf' | 'video' | 'link' | 'download' | 'drive' | 'custom';
  sort_order?: number;
  created_at?: string;
}

export interface ContentItem {
  id: string;
  category_id: string;
  title: string;
  description?: string;
  image_url?: string;
  youtube_url?: string;
  is_premium: boolean;
  required_plan_id?: string;
  duration_minutes?: number;
  is_active: boolean;
  sort_order?: number;
  created_at?: string;
  buttons?: ContentButton[];
  category?: ContentCategory;
  access_type?: 'free' | 'subscriber';
}

export interface PostButton {
  id: string;
  post_id: string;
  label: string;
  url: string;
  sort_order?: number;
}

export interface Post {
  id: string;
  title: string;
  description?: string;
  content?: string;
  image_url?: string;
  is_pinned?: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  buttons?: PostButton[];
  access_type?: 'free' | 'subscriber';
}

export interface AppNotification {
  id: string;
  user_id?: string | null;
  title: string;
  message: string;
  image_url?: string;
  is_read?: boolean;
  created_at: string;
}

export type Notification = AppNotification;
export type Announcement = Post;

export interface RoutineItem {
  id: string;
  day_of_week: number; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 7 = Sun
  subject: string;
  topic?: string;
  start_time: string;
  end_time: string;
  teacher_name?: string;
  room_link?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  access_type?: 'free' | 'subscriber';
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  negative_marks?: number;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  is_published?: boolean;
  created_at?: string;
  questions_count?: number;
  user_result?: ExamResult | null;
  access_type?: 'free' | 'subscriber';
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_image?: string;
  options: string[];
  correct_option?: number; // Only for answers/review
  explanation?: string;
  marks: number;
  negative_marks?: number;
  sort_order?: number;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  total_marks: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  percentage: number;
  passed: boolean;
  submitted_at: string;
  created_at?: string;
  exam?: Exam;
}

export interface GroupMessage {
  id: string;
  sender_id: string;
  sender_uid?: string;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  is_admin?: boolean;
  created_at: string;
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  sender_uid?: string;
  receiver_id: string;
  receiver_uid?: string;
  sender_name: string;
  message: string;
  is_read?: boolean;
  created_at: string;
}

export interface Doubt {
  id: string;
  student_uid?: string;
  student_id?: string;
  student_name: string;
  student_avatar?: string;
  text?: string;
  title: string;
  description: string;
  image_url?: string | null;
  subject?: string;
  status: 'open' | 'resolved' | 'answered';
  created_at: string;
  replies_count?: number;
  replies?: DoubtReply[];
}

export interface DoubtReply {
  id: string;
  doubt_id: string;
  sender_id?: string;
  sender_name?: string;
  sender_role?: 'student' | 'admin' | 'educator';
  message: string;
  image_url?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar?: string;
  points: number;
  streak?: number;
  rank?: number;
  class_grade?: string;
  updated_at?: string;
}

export interface AIKnowledge {
  id: string;
  category: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  isError?: boolean;
}
