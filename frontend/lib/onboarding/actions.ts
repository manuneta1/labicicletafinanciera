'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * Quiz types matching the actual database schema
 */
export interface QuizQuestion {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  correctOption: 'a' | 'b' | 'c'
  explanation: string
  topic: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  type: string
  questions: QuizQuestion[]
}

/**
 * Form types matching the actual database schema
 */
export interface FormQuestion {
  id: string
  label: string
  fieldType: 'text' | 'number' | 'radio' | 'checkbox' | 'select' | 'textarea'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  required: boolean
  position: number
}

export interface FormSection {
  id: string
  title: string
  description: string
  position: number
  questions: FormQuestion[]
}

export interface Form {
  id: string
  title: string
  description: string
  type: string
  sections: FormSection[]
}

export interface Engagement {
  id: string
  userId: string
  title: string
  engagementNumber: number
  status: 'pending' | 'active' | 'completed'
}

/**
 * Get active onboarding quiz with questions
 */
export async function getActiveQuiz(): Promise<Quiz | null> {
  const supabase = await createServerClient()

  try {
    // Fetch active quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, description, type')
      .eq('type', 'onboarding')
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (quizError || !quiz) {
      console.error('Failed to fetch quiz:', quizError)
      return null
    }

    // Fetch question IDs and positions from quiz_question_map
    const { data: questionMaps, error: mapError } = await supabase
      .from('quiz_question_map')
      .select('question_id, position')
      .eq('quiz_id', quiz.id)
      .order('position', { ascending: true })

    if (mapError || !questionMaps || questionMaps.length === 0) {
      console.error('Failed to fetch question map:', mapError)
      return null
    }

    // Fetch actual questions from quiz_questions table
    const questionIds = questionMaps.map((m) => m.question_id)
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, question, option_a, option_b, option_c, correct_option, explanation, topic')
      .in('id', questionIds)

    if (questionsError || !questions) {
      console.error('Failed to fetch questions:', questionsError)
      return null
    }

    // Order questions by position from the map and transform to camelCase
    const orderedQuestions = questionMaps
      .map((map) => {
        const question = questions.find((q) => q.id === map.question_id)
        if (!question) return null
        return {
          id: question.id,
          question: question.question,
          optionA: question.option_a,
          optionB: question.option_b,
          optionC: question.option_c,
          correctOption: question.correct_option as 'a' | 'b' | 'c',
          explanation: question.explanation,
          topic: question.topic,
        }
      })
      .filter((q) => q !== null) as QuizQuestion[]

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      type: quiz.type,
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
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, title, description, type')
      .eq('type', 'onboarding')
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (formError || !form) {
      console.error('Failed to fetch form:', formError)
      return null
    }

    // Fetch form sections
    const { data: sections, error: sectionsError } = await supabase
      .from('form_sections')
      .select('id, title, description, position')
      .eq('form_id', form.id)
      .order('position', { ascending: true })

    if (sectionsError || !sections || sections.length === 0) {
      console.error('Failed to fetch sections:', sectionsError)
      return null
    }

    // Fetch questions for each section
    const sectionIds = sections.map((s) => s.id)
    const { data: questions, error: questionsError } = await supabase
      .from('form_questions')
      .select('id, section_id, label, field_type, options, placeholder, required, position')
      .in('section_id', sectionIds)
      .eq('active', true)
      .order('position', { ascending: true })

    if (questionsError || !questions) {
      console.error('Failed to fetch questions:', questionsError)
      return null
    }

    // Group questions by section and transform to camelCase
    const sectionsWithQuestions = sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      position: section.position,
      questions: questions
        .filter((q) => q.section_id === section.id)
        .map((q) => ({
          id: q.id,
          label: q.label,
          fieldType: q.field_type as FormQuestion['fieldType'],
          options: q.options as Array<{ value: string; label: string }> | undefined,
          placeholder: q.placeholder || undefined,
          required: q.required,
          position: q.position,
        })),
    }))

    return {
      id: form.id,
      title: form.title,
      description: form.description,
      type: form.type,
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
export async function createEngagement(userId: string): Promise<Engagement | null> {
  const supabase = await createServerClient()

  try {
    // Insert engagement
    const { error: insertError } = await supabase.from('engagements').insert([
      {
        user_id: userId,
        status: 'active',
        engagement_number: 1,
        title: 'Initial Assessment Session',
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
      .maybeSingle()

    if (selectError) {
      console.error('Failed to fetch created engagement:', selectError)
      return null
    }

    if (!data) {
      console.error('No engagement data returned after insert')
      return null
    }

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      engagementNumber: data.engagement_number,
      title: data.title,
    }
  } catch (error) {
    console.error('Error creating engagement:', error)
    return null
  }
}

/**
 * Get user's engagement, creating one if it doesn't exist
 */
export async function getOrCreateEngagement(userId: string): Promise<Engagement | null> {
  const supabase = await createServerClient()

  try {
    // Check if engagement exists
    const { data: existing, error: checkError } = await supabase
      .from('engagements')
      .select('id, user_id, status, engagement_number, title')
      .eq('user_id', userId)
      .maybeSingle()

    if (!checkError && existing) {
      return {
        id: existing.id,
        userId: existing.user_id,
        status: existing.status,
        engagementNumber: existing.engagement_number,
        title: existing.title,
      }
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

    const { error } = await supabase.from('form_answers').insert(answersToInsert)

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
export async function completeEngagement(engagementId: string): Promise<boolean> {
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
