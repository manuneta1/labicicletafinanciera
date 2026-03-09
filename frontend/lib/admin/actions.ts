'use server'

import { apiFetch } from '@/lib/api/client'
import type {
  ClientListItem,
  ClientDetailResponse,
  EngagementDetailResponse,
} from '@/lib/types'

/**
 * Fetch list of all clients with their latest engagement status
 */
export async function getAllClients(): Promise<{ clients: ClientListItem[] }> {
  try {
    const data = await apiFetch<{ clients: ClientListItem[] }>('/api/clients')
    return data
  } catch (error) {
    console.error('[getAllClients] Error:', error)
    throw new Error('No pudimos cargar los clientes. Por favor, recargá la página.')
  }
}

/**
 * Fetch detailed profile of a specific client
 */
export async function getClientDetail(
  clientId: string
): Promise<ClientDetailResponse> {
  try {
    const data = await apiFetch<ClientDetailResponse>(
      `/api/clients/${clientId}`
    )
    return data
  } catch (error) {
    console.error('[getClientDetail] Error:', error)
    throw new Error('No pudimos cargar el perfil del cliente.')
  }
}

/**
 * Fetch full details of a specific engagement
 */
export async function getEngagementDetail(
  clientId: string,
  engagementId: string
): Promise<EngagementDetailResponse> {
  try {
    const data = await apiFetch<EngagementDetailResponse>(
      `/api/clients/${clientId}/engagements/${engagementId}`
    )
    return data
  } catch (error) {
    console.error('[getEngagementDetail] Error:', error)
    throw new Error('No pudimos cargar los detalles de la sesión.')
  }
}
