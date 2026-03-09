'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, getUserProfile, signOut } from '@/lib/auth/actions'

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
}

export default function AdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const session = await getSession()

        if (!session?.user?.id) {
          router.push('/auth/login')
          return
        }

        const userProfile = await getUserProfile(session.user.id)

        if (userProfile.role !== 'admin') {
          router.push('/dashboard')
          return
        }

        setProfile(userProfile)
      } catch (err) {
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
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
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <nav className="bg-primary-surface border-b-2 border-primary-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-accent">
            🚴 Panel de Administración
          </h1>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-primary-accent text-primary-bg font-semibold rounded-lg hover:bg-primary-accent/90 transition-all"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-primary-surface border-2 border-primary-border rounded-xl p-8">
          <h2 className="text-3xl font-bold text-primary-text mb-4">
            ¡Bienvenido, Administrador!
          </h2>
          <p className="text-primary-text/70 mb-6">
            Tu panel administrativo está en desarrollo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-primary-bg border-2 border-primary-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary-text mb-2">
                Mi perfil
              </h3>
              <p className="text-primary-text/70 text-sm">
                {profile?.email}
              </p>
            </div>

            <div className="bg-primary-bg border-2 border-primary-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary-text mb-2">
                Permisos
              </h3>
              <p className="text-primary-accent font-semibold">
                Acceso total
              </p>
            </div>

            <div className="bg-primary-bg border-2 border-primary-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary-text mb-2">
                Estado
              </h3>
              <p className="text-green-400 font-semibold">
                ✓ Activo
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
