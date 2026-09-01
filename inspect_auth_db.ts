import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function testAuthAndExams() {
  const email = `test_student_${Date.now()}@test.com`;
  const password = 'Password123!';

  console.log('Registering test student...');
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'Test Student',
        full_name: 'Test Student',
        role: 'student'
      }
    }
  });

  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }

  console.log('Authenticated as user:', authData.user?.id);

  // Check exams
  const { data: exams, error: eErr } = await supabase.from('exams').select('*');
  console.log('Exams count (authenticated):', exams?.length, 'Error:', eErr);

  // Check exam questions
  const { data: questions, error: qErr } = await supabase.from('exam_questions').select('*');
  console.log('Exam questions count (authenticated):', questions?.length, 'Error:', qErr);

  // Check doubts
  const { data: doubts, error: dErr } = await supabase.from('doubts').select('*');
  console.log('Doubts count (authenticated):', doubts?.length, 'Error:', dErr);

  // Check group_messages
  const { data: groupMsgs, error: gErr } = await supabase.from('group_messages').select('*');
  console.log('Group messages count (authenticated):', groupMsgs?.length, 'Error:', gErr);

  // Check profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log('Profiles count (authenticated):', profiles?.length, 'Error:', pErr);
}

testAuthAndExams();
