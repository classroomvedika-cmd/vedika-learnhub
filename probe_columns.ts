import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function probeColumns() {
  const checkCols = async (table: string, candidates: string[]) => {
    const valid: string[] = [];
    for (const c of candidates) {
      const res = await supabase.from(table).select(c).limit(1);
      if (!res.error) valid.push(c);
    }
    console.log(`Table '${table}' valid columns:`, valid);
  };

  await checkCols('doubts', ['id', 'student_uid', 'title', 'description', 'question', 'subject', 'status', 'audio_url', 'image_url', 'created_at', 'updated_at']);
  await checkCols('doubt_replies', ['id', 'doubt_id', 'sender_uid', 'reply_text', 'message', 'text', 'created_at', 'updated_at']);
  await checkCols('notifications', ['id', 'title', 'message', 'content', 'type', 'target', 'created_at', 'updated_at']);
  await checkCols('private_messages', ['id', 'sender_uid', 'receiver_uid', 'message', 'is_read', 'created_at', 'updated_at']);
  await checkCols('group_messages', ['id', 'sender_uid', 'sender_name', 'message', 'created_at', 'updated_at']);
}

probeColumns();
