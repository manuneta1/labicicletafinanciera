'use server'

import { apiFetch } from '@/lib/api/client'
import type { DashboardResponse } from '@/lib/types'

/**
 * Fetch dashboard data for the authenticated client
 */
export async function getDashboardData(): Promise<DashboardResponse> {
  try {
    const data = await apiFetch<DashboardResponse>('/api/me/dashboard')
    return data
  } catch (error) {
    console.error('[getDashboardData] Error:', error)
    throw new Error('No pudimos cargar tus datos. Por favor, recargá la página.')
  }
}
