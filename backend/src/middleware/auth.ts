import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
      }
    }
  }
}

/**
 * Middleware to validate JWT token from Authorization header
 * Extracts Bearer token, verifies with Supabase, and attaches user to req.user
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.slice(7) // Remove "Bearer " prefix

    // Verify token with Supabase
    const { data: user, error } = await supabase.auth.getUser(token)

    if (error || !user?.user) {
      console.error('[auth] Token validation failed:', error?.message)
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Attach user to request
    req.user = {
      id: user.user.id,
      email: user.user.email || '',
    }

    next()
  } catch (err) {
    console.error('[auth] Unexpected error:', err)
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

/**
 * Middleware to check if user has admin role
 * Must be used after requireAuth
 * Queries profiles table to verify role = 'admin'
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Query profiles table to check role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single()

    if (error || !profile) {
      console.error('[auth] Profile lookup failed:', error?.message)
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    next()
  } catch (err) {
    console.error('[auth] Role check error:', err)
    return res.status(403).json({ error: 'Forbidden' })
  }
}
