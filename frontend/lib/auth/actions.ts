'use client'

import { createClient as createBrowserClient } from '@/lib/supabase/client'

/**
 * Send OTP code to user's email
 * @param email User email address
 * @param shouldCreateUser Whether to create a new user if not exists (for registration)
 */
export async function sendOtp(
  email: string,
  shouldCreateUser: boolean = false
) {
  const supabase = createBrowserClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

/**
 * Verify OTP code and establish session
 * @param email User email
 * @param token 6-digit OTP code
 */
export async function verifyOtp(email: string, token: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    throw new Error(error.message)
  }

  return { data, success: true }
}

/**
 * Fetch user profile from profiles table
 * @param userId Authenticated user ID
 */
export async function getUserProfile(userId: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  return data
}

/**
 * Create user profile in profiles table
 * @param userId User ID from auth
 * @param email User email
 * @param fullName User full name
 * @param role User role (client or admin)
 */
export async function createProfile(
  userId: string,
  email: string,
  fullName: string,
  role: string = 'client'
) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.from('profiles').insert([
    {
      id: userId,
      email,
      full_name: fullName,
      role,
    },
  ])

  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`)
  }

  return data
}

/**
 * Sign out user and redirect to login
 */
export async function signOut() {
  const supabase = createBrowserClient()

  await supabase.auth.signOut()
  window.location.href = '/auth/login'
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = createBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Sign up with email and password
 * @param email User email
 * @param password User password
 */
export async function signUpWithPassword(email: string, password: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { data, success: true }
}

/**
 * Sign in with email and password
 * @param email User email
 * @param password User password
 */
export async function signInWithPassword(email: string, password: string) {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { data, success: true }
}
