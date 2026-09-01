import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';

const supabase = createClient(url, key);

async function probeProfiles() {
  const cols = [
    'id', 'uid', 'user_id', 'full_name', 'name', 'email', 'phone', 'role',
    'student_id', 'roll_number', 'class_grade', 'avatar_url', 'created_at', 'updated_at'
  ];
  const validCols: string[] = [];
  for (const c of cols) {
    const res = await supabase.from('profiles').select(c).limit(1);
    if (!res.error) {
      validCols.push(c);
    } else {
      console.log(`profiles.${c} invalid: ${res.error.message}`);
    }
  }
  console.log('Valid profiles columns:', validCols);

  const roleRes = await supabase.from('profiles').select('*').eq('role', 'admin');
  console.log('Profiles with role=admin:', roleRes.data);
}

probeProfiles();
