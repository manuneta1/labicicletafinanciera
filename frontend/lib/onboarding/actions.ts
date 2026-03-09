'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'

export interface QuizQuestion {
  id: string
  text: string
  options: Array<{
    label: string
    text: string
    isCorrect: boolean
    explanation: string
  }>
}

export interface Quiz {
  id: string
  type: string
  questions: QuizQuestion[]
}

export interface FormQuestion {
  id: string
  text: string
  position: number
  field_type: string
  options?: Array<{ label: string; value: string }>
  required: boolean
}

export interface FormSection {
  id: string
  position: number
  title: string
  questions: FormQuestion[]
}

export interface Form {
  id: string
  type: string
  sections: FormSection[]
}

export interface Engagement {
  id: string
  user_id: string
  status: string
  engagement_number: number
  title: string
}

/**
 * Get active onboarding quiz with questions
 */
export async function getActiveQuiz(): Promise<Quiz | null> {
  const supabase = await createServerClient()

  try {
    // Fetch active quiz
    const { data: quizzes, error: quizError } = await supabase
      .from('quizzes')
      .select('id, type')
      .eq('type', 'onboarding')
      .eq('active', true)
      .single()

    if (quizError || !quizzes) {
      console.error('Failed to fetch quiz:', quizError)
      return null
    }

    // Fetch quiz questions through the mapping table
    const { data: questionMaps, error: mapError } = await supabase
      .from('quiz_question_map')
      .select('question_id, position')
      .eq('quiz_id', quizzes.id)
      .order('position', { ascending: true })

    if (mapError || !questionMaps) {
      console.error('Failed to fetch question map:', mapError)
      return null
    }

    // Fetch actual questions
    const questionIds = questionMaps.map((m) => m.question_id)
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, text, options')
      .in('id', questionIds)

    if (questionsError || !questions) {
      console.error('Failed to fetch questions:', questionsError)
      return null
    }

    // Order questions by position from the map
    const orderedQuestions = questionMaps.map((map) => {
      const question = questions.find((q) => q.id === map.question_id)
      return question as QuizQuestion
    })

    return {
      id: quizzes.id,
      type: quizzes.type,
      questions: orderedQuestions,
    }
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return null
  }
}

/**
 * Get active onboarding form with sections and questions
 */
export async function getActiveForm(): Promise<Form | null> {
  const supabase = await createServerClient()

  try {
    // Fetch active form
    const { data: forms, error: formError } = await supabase
      .from('forms')
      .select('id, type')
      .eq('type', 'onboarding')
      .eq('active', true)
      .single()

    if (formError || !forms) {
      console.error('Failed to fetch form:', formError)
      return null
    }

    // Fetch form sections
    const { data: sections, error: sectionsError } = await supabase
      .from('form_sections')
      .select('id, position, title')
      .eq('form_id', forms.id)
      .order('position', { ascending: true })

    if (sectionsError || !sections) {
      console.error('Failed to fetch sections:', sectionsError)
      return null
    }

    // Fetch questions for each section
    const sectionIds = sections.map((s) => s.id)
    const { data: questions, error: questionsError } = await supabase
      .from('form_questions')
      .select('id, section_id, text, position, field_type, options, required')
      .in('section_id', sectionIds)
      .order('position', { ascending: true })

    if (questionsError || !questions) {
      console.error('Failed to fetch questions:', questionsError)
      return null
    }

    // Group questions by section
    const sectionsWithQuestions = sections.map((section) => ({
      ...section,
      questions: questions.filter((q) => q.section_id === section.id),
    }))

    return {
      id: forms.id,
      type: forms.type,
      sections: sectionsWithQuestions,
    }
  } catch (error) {
    console.error('Error fetching form:', error)
    return null
  }
}

/**
 * Create initial engagement for user
 */
export async function createEngagement(
  userId: string
): Promise<Engagement | null> {
  const supabase = await createServerClient()

  try {
    // Insert engagement
    const { error: insertError } = await supabase
      .from('engagements')
      .insert([
        {
          user_id: userId,
          status: 'active',
          engagement_number: 1,
          title: 'Sesión inicial',
        },
      ])

    if (insertError) {
      console.error('Failed to insert engagement:', insertError)
      return null
    }

    // Fetch the newly created engagement
    const { data, error: selectError } = await supabase
      .from('engagements')
      .select('id, user_id, status, engagement_number, title')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (selectError) {
      console.error('Failed to fetch created engagement:', selectError)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating engagement:', error)
    return null
  }
}

/**
 * Get user's engagement, creating one if it doesn't exist
 */
export async function getOrCreateEngagement(
  userId: string
): Promise<Engagement | null> {
  const supabase = await createServerClient()

  try {
    // Check if engagement exists
    const { data: existing, error: checkError } = await supabase
      .from('engagements')
      .select('id, user_id, status, engagement_number, title')
      .eq('user_id', userId)
      .single()

    if (!checkError && existing) {
      return existing
    }

    // Create new engagement
    return await createEngagement(userId)
  } catch (error) {
    console.error('Error getting or creating engagement:', error)
    return null
  }
}

/**
 * Check if user has completed engagement
 */
export async function hasCompletedEngagement(userId: string): Promise<boolean> {
  const supabase = await createServerClient()

  try {
    const { data, error } = await supabase
      .from('engagements')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(1)

    // If there's an error or no data, return false
    if (error || !data || data.length === 0) {
      return false
    }

    return true
  } catch (err) {
    console.error('Error checking engagement completion:', err)
    return false
  }
}

/**
 * Save quiz attempt
 */
export async function saveQuizAttempt(
  userId: string,
  engagementId: string,
  quizId: string,
  answers: Record<string, string>,
  totalQuestions: number,
  correctAnswers: number
): Promise<boolean> {
  const supabase = await createServerClient()

  try {
    // Calculate level based on percentage
    const percentage = (correctAnswers / totalQuestions) * 100
    let level = 'beginner'
    if (percentage >= 75) level = 'advanced'
    else if (percentage >= 50) level = 'intermediate'
    else if (percentage >= 25) level = 'developing'

    const { error } = await supabase.from('quiz_attempts').insert([
      {
        user_id: userId,
        engagement_id: engagementId,
        quiz_id: quizId,
        score: correctAnswers,
        level,
        answers,
      },
    ])

    if (error) {
      console.error('Failed to save quiz attempt:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving quiz attempt:', error)
    return false
  }
}

/**
 * Save form answers
 */
export async function saveFormAnswers(
  userId: string,
  engagementId: string,
  answers: Array<{ question_id: string; value: unknown }>
): Promise<boolean> {
  const supabase = await createServerClient()

  try {
    const answersToInsert = answers.map((answer) => ({
      user_id: userId,
      engagement_id: engagementId,
      question_id: answer.question_id,
      value: answer.value,
    }))

    const { error } = await supabase
      .from('form_answers')
      .insert(answersToInsert)

    if (error) {
      console.error('Failed to save form answers:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving form answers:', error)
    return false
  }
}

/**
 * Mark engagement as completed
 */
export async function completeEngagement(
  engagementId: string
): Promise<boolean> {
  const supabase = await createServerClient()

  try {
    const { error } = await supabase
      .from('engagements')
      .update({ status: 'completed' })
      .eq('id', engagementId)

    if (error) {
      console.error('Failed to complete engagement:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error completing engagement:', error)
    return false
  }
}
