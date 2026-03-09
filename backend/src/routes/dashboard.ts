import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { DashboardResponse } from '../lib/types'

const router = Router()

/**
 * GET /api/me/dashboard
 * Get cross-engagement dashboard data for the authenticated client
 * Returns latest published report, all objectives, all tasks, and engagement history
 * If no published report: report is null ("waiting" state)
 * Client only
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = req.user.id

    // Get latest published report (if exists)
    const { data: report } = await supabase
      .from('reports')
      .select('id, reporte_texto, engagement_id')
      .eq('user_id', userId)
      .eq('reporte_publicado', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get all objectives ordered by orden
    const { data: objectives, error: objectivesError } = await supabase
      .from('objetivos')
      .select('*')
      .eq('user_id', userId)
      .order('orden', { ascending: true })

    if (objectivesError) {
      console.error('[dashboard] Failed to fetch objectives:', objectivesError)
      return res.status(500).json({ error: 'Failed to fetch objectives' })
    }

    // Get all tasks: pending first (completada = false), then completed
    const { data: tasks, error: tasksError } = await supabase
      .from('tareas')
      .select('*')
      .eq('user_id', userId)
      .order('completada', { ascending: true })
      .order('orden', { ascending: true })

    if (tasksError) {
      console.error('[dashboard] Failed to fetch tasks:', tasksError)
      return res.status(500).json({ error: 'Failed to fetch tasks' })
    }

    // Get all engagements ordered by engagement_number
    const { data: engagements, error: engagementsError } = await supabase
      .from('engagements')
      .select('*')
      .eq('user_id', userId)
      .order('engagement_number', { ascending: true })

    if (engagementsError) {
      console.error('[dashboard] Failed to fetch engagements:', engagementsError)
      return res.status(500).json({ error: 'Failed to fetch engagements' })
    }

    const response: DashboardResponse = {
      report: report
        ? {
            id: report.id,
            reporte_texto: report.reporte_texto,
            engagement_id: report.engagement_id,
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
      engagements: (engagements || []).map((eng) => ({
        id: eng.id,
        engagement_number: eng.engagement_number,
        status: eng.status,
        engagement_date: eng.engagement_date,
      })),
    }

    return res.json(response)
  } catch (error) {
    console.error('[dashboard] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
