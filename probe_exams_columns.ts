import { createClient } from '@supabase/supabase-js';

const url = 'https://zaweivmgzxjfthvkkmzl.supabase.co';
const key = 'sb_publishable_jmJ1F5fwyPLFV34h-LE03Q_bmQQDHoY';
const supabase = createClient(url, key);

async function testAllPossibleCols() {
  const testTable = async (tableName: string, cols: string[]) => {
    const valid: string[] = [];
    for (const c of cols) {
      const { error } = await supabase.from(tableName).select(c).limit(1);
      if (!error) valid.push(c);
    }
    console.log(`=== ${tableName} VALID COLUMNS ===\n`, valid.join(', '));
  };

  await testTable('exams', [
    'id', 'title', 'description', 'subject', 'duration_minutes', 'duration',
    'total_marks', 'passing_marks', 'negative_marks', 'negative_marking',
    'is_active', 'is_published', 'created_at', 'updated_at', 'access_type'
  ]);

  await testTable('exam_questions', [
    'id', 'exam_id', 'question_text', 'question', 'title', 'question_image', 'image_url',
    'options', 'options_json', 'correct_option', 'correct_answer', 'answer', 'explanation', 'solution',
    'marks', 'marks_per_question', 'negative_marks', 'sort_order', 'created_at'
  ]);

  await testTable('exam_results', [
    'id', 'exam_id', 'student_uid', 'user_id', 'score', 'marks_obtained', 'total_marks', 'total_questions',
    'correct_count', 'correct_answers', 'incorrect_count', 'incorrect_answers',
    'unattempted_count', 'skipped_count', 'percentage', 'passed', 'is_passed',
    'submitted_at', 'created_at', 'updated_at'
  ]);

  await testTable('exam_answers', [
    'id', 'result_id', 'question_id', 'selected_option', 'is_correct', 'correct',
    'created_at'
  ]);

  await testTable('notifications', [
    'id', 'student_uid', 'user_id', 'title', 'message', 'body', 'content', 'type',
    'is_read', 'read', 'created_at', 'updated_at', 'audience', 'target_audience', 'role'
  ]);
}

testAllPossibleCols();
