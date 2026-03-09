/**
 * API client utility for calling backend endpoints
 * Automatically includes JWT from server session in Authorization header
 * Used only in server components and server actions
 */

import { createClient } from '@/lib/supabase/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error('Missing NEXT_PUBLIC_API_URL environment variable')
}

/**
 * Fetch wrapper that automatically includes JWT from server session
 * @param path - API endpoint path (e.g., '/api/clients')
 * @param options - Fetch RequestInit options
 * @returns Parsed response data
 * @throws Error if request fails or returns non-200 status
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    // Get server session to extract JWT
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('No active session')
    }

    // Prepare headers with JWT
    const headers = new Headers(options.headers || {})
    headers.set('Content-Type', 'application/json')
    headers.set('Authorization', `Bearer ${session.access_token}`)

    // Make the request
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })

    // Parse response
    if (!res.ok) {
      const error = await res.json().catch(() => ({
        error: `HTTP ${res.status}`,
      }))
      throw new Error(error.error || `Request failed with status ${res.status}`)
    }

    return res.json() as Promise<T>
  } catch (error) {
    console.error(`[apiFetch] Error calling ${path}:`, error)
    throw error
  }
}
