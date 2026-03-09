import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { CreateTasksRequest } from '../lib/types'

const router = Router()

/**
 * POST /api/clients/:id/tasks
 * Load tasks for a client in a specific engagement
 * Creates multiple task records with completada = false and orden based on array index
 * Admin only
 */
router.post('/clients/:id/tasks', async (req: Request, res: Response) => {
  try {
    const clientId = req.params.id
    const { engagement_id, tasks } = req.body as CreateTasksRequest

    if (!engagement_id || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        error: 'engagement_id and tasks array are required',
      })
    }

    // Validate engagement belongs to client
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('id')
      .eq('id', engagement_id)
      .eq('user_id', clientId)
      .single()

    if (engagementError || !engagement) {
      return res.status(404).json({ error: 'Engagement not found' })
    }

    // Prepare tasks with orden
    const tasksToInsert = tasks.map((task, index) => ({
      user_id: clientId,
      engagement_id: engagement_id,
      descripcion: task.descripcion,
      completada: false,
      completada_at: null,
      orden: index,
    }))

    // Insert tasks
    const { data: createdTasks, error: insertError } = await supabase
      .from('tareas')
      .insert(tasksToInsert)
      .select()

    if (insertError) {
      console.error('[tasks] Failed to create tasks:', insertError)
      return res.status(500).json({ error: 'Failed to create tasks' })
    }

    return res.status(201).json({
      tasks: (createdTasks || []).map((task) => ({
        id: task.id,
        descripcion: task.descripcion,
        completada: task.completada,
        orden: task.orden,
      })),
    })
  } catch (error) {
    console.error('[tasks] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * PATCH /api/tasks/:id/complete
 * Mark a task as completed by the client who owns it
 * Sets completada = true and completada_at = now
 * Client only - verifies task belongs to req.user.id
 */
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const taskId = req.params.id
    const userId = req.user.id

    // Get task and verify it belongs to the user
    const { data: task, error: taskError } = await supabase
      .from('tareas')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single()

    if (taskError || !task) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Mark task as completed
    const now = new Date().toISOString()
    const { data: completedTask, error: updateError } = await supabase
      .from('tareas')
      .update({ completada: true, completada_at: now })
      .eq('id', taskId)
      .select()
      .single()

    if (updateError) {
      console.error('[tasks] Failed to complete task:', updateError)
      return res.status(500).json({ error: 'Failed to complete task' })
    }

    return res.json({
      task: {
        id: completedTask.id,
        completada: completedTask.completada,
        completada_at: completedTask.completada_at,
      },
    })
  } catch (error) {
    console.error('[tasks] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
