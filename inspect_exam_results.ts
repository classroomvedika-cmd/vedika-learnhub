import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';
const supabase = createClient(url, key);

async function inspectExamResults() {
  const { data, error } = await supabase.from('exam_results').select('*').limit(1);
  if (error) {
    console.error('Error fetching exam_results:', error);
  } else {
    console.log('exam_results sample:', data);
  }
}

inspectExamResults();
