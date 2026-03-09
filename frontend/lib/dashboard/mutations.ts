'use client'

import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * Mark a task as complete
 * Client-side only - uses browser client to get JWT directly
 */
export async function completeTask(taskId: string): Promise<{
  task: {
    id: string
    completada: boolean
    completada_at: string
  }
}> {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('No active session')
    }

    const res = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({
        error: 'Unknown error',
      }))
      throw new Error(error.error)
    }

    return res.json()
  } catch (error) {
    console.error('[completeTask] Error:', error)
    throw error
  }
}
