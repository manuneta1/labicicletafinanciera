import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { CreateObjectivesRequest } from '../lib/types'

const router = Router()

/**
 * POST /api/clients/:id/objectives
 * Load objectives for a client in a specific engagement
 * Creates multiple objective records with orden based on array index
 * Admin only
 */
router.post('/:id/objectives', async (req: Request, res: Response) => {
  try {
    const clientId = req.params.id
    const { engagement_id, objectives } = req.body as CreateObjectivesRequest

    if (!engagement_id || !objectives || !Array.isArray(objectives)) {
      return res.status(400).json({
        error: 'engagement_id and objectives array are required',
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

    // Prepare objectives with orden
    const objectivesToInsert = objectives.map((obj, index) => ({
      user_id: clientId,
      engagement_id: engagement_id,
      titulo: obj.titulo,
      descripcion: obj.descripcion,
      eta: obj.eta || null,
      orden: index,
    }))

    // Insert objectives
    const { data: createdObjectives, error: insertError } = await supabase
      .from('objetivos')
      .insert(objectivesToInsert)
      .select()

    if (insertError) {
      console.error('[objectives] Failed to create objectives:', insertError)
      return res.status(500).json({ error: 'Failed to create objectives' })
    }

    return res.status(201).json({
      objectives: (createdObjectives || []).map((obj) => ({
        id: obj.id,
        titulo: obj.titulo,
        descripcion: obj.descripcion,
        eta: obj.eta,
        orden: obj.orden,
      })),
    })
  } catch (error) {
    console.error('[objectives] Unexpected error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
