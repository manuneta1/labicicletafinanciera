import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

// Initialize Supabase admin client
// This uses the SERVICE_KEY which bypasses Row Level Security (RLS)
// Only use this for admin operations on the backend
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Type definitions for common operations
export type Tables = any
export type User = any
export type Profile = any
