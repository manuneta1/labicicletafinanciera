'use client'

import { apiFetch } from '@/lib/api/client'
import type { CreateObjectiveInput, CreateTaskInput, Report } from '@/lib/types'

/**
 * Generate a report for a client using Claude AI
 */
export async function generateReport(
  clientId: string,
  engagementId: string
): Promise<{ report: Report }> {
  try {
    const data = await apiFetch<{ report: Report }>(
      '/api/reports/generate',
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          engagement_id: engagementId,
        }),
      }
    )
    return data
  } catch (error) {
    console.error('[generateReport] Error:', error)
    throw new Error('No pudimos generar el reporte. Por favor, intentá más tarde.')
  }
}

/**
 * Update report text (auto-save)
 */
export async function updateReport(
  reportId: string,
  text: string
): Promise<{ report: Report }> {
  try {
    const data = await apiFetch<{ report: Report }>(
      `/api/reports/${reportId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ reporte_texto: text }),
      }
    )
    return data
  } catch (error) {
    console.error('[updateReport] Error:', error)
    throw new Error('No pudimos guardar el reporte.')
  }
}

/**
 * Publish a report (make it visible to client)
 */
export async function publishReport(
  reportId: string
): Promise<{ report: Report }> {
  try {
    const data = await apiFetch<{ report: Report }>(
      `/api/reports/${reportId}/publish`,
      {
        method: 'PATCH',
      }
    )
    return data
  } catch (error) {
    console.error('[publishReport] Error:', error)
    throw new Error('No pudimos publicar el reporte.')
  }
}

/**
 * Create objectives for a client in a specific engagement
 */
export async function createObjectives(
  clientId: string,
  engagementId: string,
  objectives: CreateObjectiveInput[]
): Promise<{ objectives: any[] }> {
  try {
    const data = await apiFetch<{ objectives: any[] }>(
      `/api/clients/${clientId}/objectives`,
      {
        method: 'POST',
        body: JSON.stringify({
          engagement_id: engagementId,
          objectives,
        }),
      }
    )
    return data
  } catch (error) {
    console.error('[createObjectives] Error:', error)
    throw new Error('No pudimos guardar los objetivos.')
  }
}

/**
 * Create tasks for a client in a specific engagement
 */
export async function createTasks(
  clientId: string,
  engagementId: string,
  tasks: CreateTaskInput[]
): Promise<{ tasks: any[] }> {
  try {
    const data = await apiFetch<{ tasks: any[] }>(
      `/api/clients/${clientId}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify({
          engagement_id: engagementId,
          tasks,
        }),
      }
    )
    return data
  } catch (error) {
    console.error('[createTasks] Error:', error)
    throw new Error('No pudimos guardar las tareas.')
  }
}
