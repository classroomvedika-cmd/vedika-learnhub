import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function probeDoubts() {
  const candidates = [
    'id', 'student_uid', 'user_id', 'subject', 'title', 'question', 'description', 'message',
    'doubt', 'details', 'status', 'audio_url', 'image_url', 'created_at', 'updated_at'
  ];
  const valid: string[] = [];
  for (const c of candidates) {
    const res = await supabase.from('doubts').select(c).limit(1);
    if (!res.error) valid.push(c);
  }
  console.log('Doubts valid columns:', valid);
}

probeDoubts();
