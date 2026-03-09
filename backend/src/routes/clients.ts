import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import {
  ClientListItem,
  ClientDetailResponse,
  EngagementDetailResponse,
  QuizWithAnswers,
  FormResponseGrouped,
} from '../lib/types'

const router = Router()

/**
 * GET /api/clients
 * Get list of all clients with their latest engagement status
 * Admin only
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get all client profiles
    const { data: clients, error: clientsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')

    if (clientsError) {
      console.error('[clients] Failed to fetch clients:', clientsError)
      return res.status(500).json({ error: 'Failed to fetch clients' })
    }

    if (!clients || clients.length === 0) {
      return res.json({ clients: [] })
    }

    // For each client, get their latest engagement and check for published report
    const clientsWithStatus: ClientListItem[] = await Promise.all(
      clients.map(async (client) => {
        // Get latest engagement
        const { data: latestEngagement } = await supabase
          .from('engagements')
          .select('*')
          .eq('user_id', client.id)
          .order('engagement_number', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Check if has published report
        const { data: publishedReport } = await supabase
          .from('reports')
          .select('id')
          .eq('user_id', client.id)
          .eq('reporte_publicado', true)
          .limit(1)
          .maybeSingle()

        return {
          id: client.id,
          full_name: client.full_name,
          email: client.email,
          created_at: client.created_at,
          latest_engagement: latestEngagement
            ? {
                id: latestEngagement.id,
                engagement_number: latestEngagement.engagement_number,
                status: latestEngagement.status,
                engagement_date: latestEngagement.engagement_date,
              }
            : null,
          has_published_report: !!publishedReport,
        }
      })
    )

    return res.json({ clients: clientsWithStatus })
  } catch (error) {
    console.error('[clients] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/clients/:id
 * Get full profile of one client with all engagement history and cross-engagement data
 * Admin only
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const clientId = req.params.id

    // Get client profile (must be role = 'client')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single()

    if (profileError || !profile || profile.role !== 'client') {
      return res.status(404).json({ error: 'Client not found' })
    }

    // Get all engagements ordered by engagement_number
    const { data: engagements, error: engagementsError } = await supabase
      .from('engagements')
      .select('*')
      .eq('user_id', clientId)
      .order('engagement_number', { ascending: true })

    if (engagementsError) {
      console.error('[clients] Failed to fetch engagements:', engagementsError)
      return res.status(500).json({ error: 'Failed to fetch engagements' })
    }

    // For each engagement, get quiz attempt and check for published report
    const engagementsWithData = await Promise.all(
      (engagements || []).map(async (engagement) => {
        // Get quiz attempt if exists
        const { data: quizAttempt } = await supabase
          .from('quiz_attempts')
          .select('score, level, answers')
          .eq('engagement_id', engagement.id)
          .maybeSingle()

        // Check for published report
        const { data: report } = await supabase
          .from('reports')
          .select('id')
          .eq('engagement_id', engagement.id)
          .eq('reporte_publicado', true)
          .limit(1)
          .maybeSingle()

        return {
          id: engagement.id,
          engagement_number: engagement.engagement_number,
          status: engagement.status,
          engagement_date: engagement.engagement_date,
          quiz_attempt: quizAttempt
            ? {
                score: quizAttempt.score,
                level: quizAttempt.level,
                answers: quizAttempt.answers,
              }
            : null,
          has_published_report: !!report,
        }
      })
    )

    // Get all objectives for this client (cross-engagement)
    const { data: objectives, error: objectivesError } = await supabase
      .from('objetivos')
      .select('*')
      .eq('user_id', clientId)
      .order('orden', { ascending: true })

    if (objectivesError) {
      console.error('[clients] Failed to fetch objectives:', objectivesError)
      return res.status(500).json({ error: 'Failed to fetch objectives' })
    }

    // Get all tasks for this client (cross-engagement, pending first)
    const { data: tasks, error: tasksError } = await supabase
      .from('tareas')
      .select('*')
      .eq('user_id', clientId)
      .order('completada', { ascending: true })
      .order('orden', { ascending: true })

    if (tasksError) {
      console.error('[clients] Failed to fetch tasks:', tasksError)
      return res.status(500).json({ error: 'Failed to fetch tasks' })
    }

    const response: ClientDetailResponse = {
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        created_at: profile.created_at,
      },
      engagements: engagementsWithData,
      objectives: (objectives || []).map((obj) => ({
        id: obj.id,
        titulo: obj.titulo,
        descripcion: obj.descripcion,
        eta: obj.eta,
        orden: obj.orden,
        engagement_id: obj.engagement_id,
      })),
      tasks: (tasks || []).map((task) => ({
        id: task.id,
        descripcion: task.descripcion,
        completada: task.completada,
        completada_at: task.completada_at,
        orden: task.orden,
        engagement_id: task.engagement_id,
      })),
    }

    return res.json(response)
  } catch (error) {
    console.error('[clients] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/clients/:id/engagements/:engagementId
 * Get full detail of one specific engagement including quiz, form, and report
 * Admin only
 */
router.get('/:id/engagements/:engagementId', async (req: Request, res: Response) => {
  try {
    const clientId = req.params.id
    const engagementId = req.params.engagementId

    // Validate engagement belongs to client
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('*')
      .eq('id', engagementId)
      .eq('user_id', clientId)
      .single()

    if (engagementError || !engagement) {
      return res.status(404).json({ error: 'Engagement not found' })
    }

    // Get quiz attempt if exists
    const { data: quizAttempt } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, score, level, answers')
      .eq('engagement_id', engagementId)
      .maybeSingle()

    let quizWithAnswers: QuizWithAnswers | null = null

    if (quizAttempt) {
      // Get quiz questions in order
      const { data: questionMaps } = await supabase
        .from('quiz_question_map')
        .select('question_id, position, quiz_questions(*)')
        .eq('quiz_id', quizAttempt.quiz_id)
        .order('position', { ascending: true })

      if (questionMaps) {
        quizWithAnswers = {
          score: quizAttempt.score,
          level: quizAttempt.level,
          questions: questionMaps.map((map: any) => {
            const question = map.quiz_questions
            const clientAnswer = quizAttempt.answers[question.id]
            return {
              id: question.id,
              question: question.question,
              topic: question.topic,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              correct_option: question.correct_option,
              explanation: question.explanation,
              client_answer: clientAnswer || '',
              is_correct: clientAnswer === question.correct_option,
            }
          }),
        }
      }
    }

    // Get form answers grouped by section
    const { data: formAnswersData } = await supabase
      .from('form_answers')
      .select('value, form_questions(label, field_type, form_sections(id, title, position))')
      .eq('engagement_id', engagementId)

    const formResponsesMap: Record<string, FormResponseGrouped> = {}

    if (formAnswersData) {
      formAnswersData.forEach((item: any) => {
        const section = item.form_questions.form_sections
        const sectionKey = section.id

        if (!formResponsesMap[sectionKey]) {
          formResponsesMap[sectionKey] = {
            section_title: section.title,
            section_position: section.position,
            answers: [],
          }
        }

        formResponsesMap[sectionKey].answers.push({
          question_id: item.form_questions.id,
          label: item.form_questions.label,
          field_type: item.form_questions.field_type,
          value: item.value,
        })
      })
    }

    const formResponses = Object.values(formResponsesMap).sort(
      (a, b) => a.section_position - b.section_position
    )

    // Get report if exists
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .maybeSingle()

    // Get objectives for this engagement
    const { data: objectives } = await supabase
      .from('objetivos')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('orden', { ascending: true })

    // Get tasks for this engagement
    const { data: tasks } = await supabase
      .from('tareas')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('orden', { ascending: true })

    const response: EngagementDetailResponse = {
      engagement: {
        id: engagement.id,
        engagement_number: engagement.engagement_number,
        status: engagement.status,
        engagement_date: engagement.engagement_date,
      },
      quiz_attempt: quizWithAnswers,
      form_responses: formResponses,
      report: report
        ? {
            id: report.id,
            reporte_texto: report.reporte_texto,
            reporte_publicado: report.reporte_publicado,
          }
        : null,
      objectives: (objectives || []).map((obj) => ({
        id: obj.id,
        titulo: obj.titulo,
        descripcion: obj.descripcion,
        eta: obj.eta,
        orden: obj.orden,
      })),
      tasks: (tasks || []).map((task) => ({
        id: task.id,
        descripcion: task.descripcion,
        completada: task.completada,
        completada_at: task.completada_at,
        orden: task.orden,
      })),
    }

    return res.json(response)
  } catch (error) {
    console.error('[clients] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
