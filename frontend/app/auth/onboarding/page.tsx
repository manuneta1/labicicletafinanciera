'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { getSession, getUserProfile } from '@/lib/auth/actions'

export default function OnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        const session = await getSession()

        if (!session?.user?.id) {
          router.push('/auth/login')
          return
        }

        // Get user profile to determine destination
        const profile = await getUserProfile(session.user.id)

        // Redirect to appropriate page
        if (profile.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } catch (err) {
        router.push('/auth/login')
      }
    }

    const timer = setTimeout(checkSessionAndRedirect, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <AuthCard
      title="¡Bienvenido!"
      subtitle="Preparando tu cuenta..."
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-accent/20 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-primary-accent animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>

          <p className="text-primary-text/70">
            Estamos preparando tu cuenta...
          </p>
        </div>
      </div>
    </AuthCard>
  )
}
