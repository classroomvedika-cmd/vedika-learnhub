import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function probeDoubts2() {
  const candidates = [
    'question_text', 'doubt_text', 'query', 'content', 'body', 'topic', 'category',
    'status', 'state', 'subject_id', 'audio', 'image', 'audio_path', 'image_path',
    'doubt_title', 'doubt_description', 'subject_name'
  ];
  const valid: string[] = [];
  for (const c of candidates) {
    const res = await supabase.from('doubts').select(c).limit(1);
    if (!res.error) valid.push(c);
  }
  console.log('Doubts valid columns batch 2:', valid);
}

probeDoubts2();
