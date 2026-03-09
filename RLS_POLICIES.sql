-- RLS Policies for La Bicicleta Financiera Onboarding Flow
-- These policies allow authenticated users to read quiz/form data and manage their own engagement data

-- Enable RLS on all tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_question_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;

-- QUIZZES: Allow all authenticated users to read active quizzes
CREATE POLICY "authenticated_read_active_quizzes" ON quizzes
  FOR SELECT
  USING (auth.role() = 'authenticated' AND active = true);

-- QUIZ_QUESTION_MAP: Allow all authenticated users to read maps
CREATE POLICY "authenticated_read_quiz_question_map" ON quiz_question_map
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- QUIZ_QUESTIONS: Allow all authenticated users to read active questions
CREATE POLICY "authenticated_read_active_quiz_questions" ON quiz_questions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND active = true);

-- FORMS: Allow all authenticated users to read active forms
CREATE POLICY "authenticated_read_active_forms" ON forms
  FOR SELECT
  USING (auth.role() = 'authenticated' AND active = true);

-- FORM_SECTIONS: Allow all authenticated users to read sections
CREATE POLICY "authenticated_read_form_sections" ON form_sections
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- FORM_QUESTIONS: Allow all authenticated users to read active questions
CREATE POLICY "authenticated_read_active_form_questions" ON form_questions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND active = true);

-- ENGAGEMENTS: Allow users to read and create their own engagements
CREATE POLICY "users_read_own_engagements" ON engagements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_create_own_engagements" ON engagements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_engagements" ON engagements
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- QUIZ_ATTEMPTS: Allow users to read and create their own quiz attempts
CREATE POLICY "users_read_own_quiz_attempts" ON quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_create_own_quiz_attempts" ON quiz_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- FORM_ANSWERS: Allow users to read and create their own form answers
CREATE POLICY "users_read_own_form_answers" ON form_answers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_create_own_form_answers" ON form_answers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- VERIFICATION
-- Run these SELECT statements to verify the policies are working:
--
-- SELECT 'Check quizzes' as test;
-- SELECT id, title, type, active FROM quizzes WHERE active = true LIMIT 1;
--
-- SELECT 'Check quiz questions' as test;
-- SELECT qm.quiz_id, qm.question_id, qm.position
-- FROM quiz_question_map qm
-- WHERE qm.quiz_id = (SELECT id FROM quizzes WHERE type = 'onboarding' AND active = true LIMIT 1)
-- ORDER BY qm.position;
--
-- SELECT 'Check forms' as test;
-- SELECT id, title, type, active FROM forms WHERE active = true LIMIT 1;
--
-- SELECT 'Check form sections' as test;
-- SELECT fs.id, fs.title, fs.position
-- FROM form_sections fs
-- WHERE fs.form_id = (SELECT id FROM forms WHERE type = 'onboarding' AND active = true LIMIT 1)
-- ORDER BY fs.position;
