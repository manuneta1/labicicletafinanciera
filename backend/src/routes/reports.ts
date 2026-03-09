import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { generateReport } from '../lib/anthropic'
import {
  GenerateReportRequest,
  UpdateReportRequest,
  QuizQuestion,
  FormQuestion,
} from '../lib/types'

const router = Router()

/**
 * POST /api/reports/generate
 * Generate a personalized report using Claude API
 * Creates a new report record with reporte_publicado = false
 * Admin only
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { client_id, engagement_id } = req.body as GenerateReportRequest

    // Validate engagement belongs to client
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('*')
      .eq('id', engagement_id)
      .eq('user_id', client_id)
      .single()

    if (engagementError || !engagement) {
      return res.status(404).json({ error: 'Engagement not found' })
    }

    // Get client profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', client_id)
      .single()

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Client not found' })
    }

    // Get quiz attempt
    const { data: quizAttempt, error: quizError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('engagement_id', engagement_id)
      .maybeSingle()

    if (quizError) {
      console.error('[reports] Failed to fetch quiz attempt:', quizError)
      return res.status(500).json({ error: 'Failed to fetch quiz attempt' })
    }

    if (!quizAttempt) {
      return res.status(400).json({ error: 'No quiz attempt found for this engagement' })
    }

    // Get quiz questions
    const { data: questionMaps, error: questionsError } = await supabase
      .from('quiz_question_map')
      .select('quiz_questions(*)')
      .eq('quiz_id', quizAttempt.quiz_id)
      .order('position', { ascending: true })

    if (questionsError) {
      console.error('[reports] Failed to fetch quiz questions:', questionsError)
      return res.status(500).json({ error: 'Failed to fetch quiz questions' })
    }

    const quizQuestions = (questionMaps || []).map((map: any) => ({
      ...map.quiz_questions,
      clientAnswer: quizAttempt.answers[map.quiz_questions.id],
    }))

    // Get form answers
    const { data: formAnswersData, error: formError } = await supabase
      .from('form_answers')
      .select('value, form_questions(*)')
      .eq('engagement_id', engagement_id)

    if (formError) {
      console.error('[reports] Failed to fetch form answers:', formError)
      return res.status(500).json({ error: 'Failed to fetch form answers' })
    }

    const formAnswers = (formAnswersData || []).map((item: any) => ({
      question: item.form_questions,
      value: item.value,
    }))

    // Generate report using Claude
    let reportText: string

    try {
      reportText = await generateReport({
        profile,
        quizAttempt,
        quizQuestions,
        formAnswers,
      })
    } catch (anthropicError) {
      console.error('[reports] Claude API error:', anthropicError)
      return res.status(500).json({ error: 'Failed to generate report' })
    }

    // Save report to database
    const { data: newReport, error: saveError } = await supabase
      .from('reports')
      .insert({
        user_id: client_id,
        engagement_id: engagement_id,
        reporte_texto: reportText,
        reporte_publicado: false,
      })
      .select()
      .single()

    if (saveError) {
      console.error('[reports] Failed to save report:', saveError)
      return res.status(500).json({ error: 'Failed to save report' })
    }

    return res.json({
      report: {
        id: newReport.id,
        reporte_texto: newReport.reporte_texto,
        reporte_publicado: newReport.reporte_publicado,
      },
    })
  } catch (error) {
    console.error('[reports] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * PUT /api/reports/:id
 * Update report text (can't edit published reports)
 * Admin only
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const reportId = req.params.id
    const { reporte_texto } = req.body as UpdateReportRequest

    if (!reporte_texto) {
      return res.status(400).json({ error: 'reporte_texto is required' })
    }

    // Get report and verify it's not published
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    if (report.reporte_publicado) {
      return res.status(400).json({ error: 'Cannot edit published report' })
    }

    // Update report
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({ reporte_texto })
      .eq('id', reportId)
      .select()
      .single()

    if (updateError) {
      console.error('[reports] Failed to update report:', updateError)
      return res.status(500).json({ error: 'Failed to update report' })
    }

    return res.json({
      report: {
        id: updatedReport.id,
        reporte_texto: updatedReport.reporte_texto,
        reporte_publicado: updatedReport.reporte_publicado,
      },
    })
  } catch (error) {
    console.error('[reports] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * PATCH /api/reports/:id/publish
 * Publish a report (sets reporte_publicado = true)
 * Idempotent - safe to call multiple times
 * Admin only
 */
router.patch('/:id/publish', async (req: Request, res: Response) => {
  try {
    const reportId = req.params.id

    // Get report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    // Publish report (idempotent - ok if already published)
    const { data: publishedReport, error: publishError } = await supabase
      .from('reports')
      .update({ reporte_publicado: true })
      .eq('id', reportId)
      .select()
      .single()

    if (publishError) {
      console.error('[reports] Failed to publish report:', publishError)
      return res.status(500).json({ error: 'Failed to publish report' })
    }

    return res.json({
      report: {
        id: publishedReport.id,
        reporte_publicado: publishedReport.reporte_publicado,
      },
    })
  } catch (error) {
    console.error('[reports] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
