import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';
const supabase = createClient(url, key);

async function probe() {
  const tables = ['exams', 'exam_questions', 'exam_results', 'exam_answers', 'notifications'];
  for (const t of tables) {
    const { error } = await supabase.from(t).insert({ __nonexistent__: '1' });
    console.log(`Table '${t}' insert error:`, error?.message);
  }
}

probe();
