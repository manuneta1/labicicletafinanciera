import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
// This uses the SERVICE_KEY which bypasses Row Level Security (RLS)
// Only use this for admin operations on the backend
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Type definitions for common operations
export type Tables = any
export type User = any
export type Profile = any
