import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function inspectExamsAndQuestions() {
  console.log('--- 1. EXAMS ---');
  const { data: exams, error: eErr } = await supabase.from('exams').select('*');
  console.log('Exams count:', exams?.length, 'Error:', eErr);
  if (exams && exams.length > 0) {
    console.log('Sample exam:', exams[0]);
  }

  console.log('--- 2. EXAM_QUESTIONS ---');
  const { data: questions, error: qErr } = await supabase.from('exam_questions').select('*');
  console.log('Exam questions count:', questions?.length, 'Error:', qErr);
  if (questions && questions.length > 0) {
    console.log('Sample question:', questions[0]);
  }

  if (exams && exams.length > 0) {
    for (const ex of exams) {
      const { data: qForEx, error: qExErr } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', ex.id);
      console.log(`Questions for exam ID ${ex.id} ('${ex.title}'): count=${qForEx?.length}, err=${qExErr?.message || 'none'}`);
    }
  }
}

inspectExamsAndQuestions();
