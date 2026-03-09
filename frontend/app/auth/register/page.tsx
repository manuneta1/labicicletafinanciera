'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { OtpInput } from '@/components/auth/OtpInput'
import { sendOtp, verifyOtp, createProfile } from '@/lib/auth/actions'

type Step = 'form' | 'otp'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate inputs
      if (!email || !email.includes('@')) {
        setError('Por favor ingresa un correo electrónico válido')
        setLoading(false)
        return
      }

      if (!fullName.trim()) {
        setError('Por favor ingresa tu nombre completo')
        setLoading(false)
        return
      }

      // Send OTP with shouldCreateUser=true
      await sendOtp(email, true)
      setStep('otp')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar el código'
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        setError('Este correo ya está registrado. ¿Deseas iniciar sesión?')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOtpComplete = async (otp: string) => {
    setError('')
    setLoading(true)

    try {
      // Verify OTP
      const { data } = await verifyOtp(email, otp)

      if (!data.user?.id) {
        setError('Error al verificar el código')
        return
      }

      // Create user profile
      await createProfile(data.user.id, email, fullName, 'client')

      // Redirect to onboarding
      router.push('/auth/onboarding')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al registrarse'
      setError(errorMessage)
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'form') {
    return (
      <AuthCard
        title="Crea tu cuenta"
        subtitle="Únete a La Bicicleta Financiera"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-primary-text mb-2">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary-bg border-2 border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary-text mb-2">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              disabled={loading}
              className="w-full px-4 py-3 bg-primary-bg border-2 border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border-2 border-red-500/40 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-accent text-primary-bg font-semibold rounded-lg hover:bg-primary-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Enviando código...' : 'Continuar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-primary-text/70">
          ¿Ya tienes cuenta?{' '}
          <a href="/auth/login" className="text-primary-accent hover:underline font-medium">
            Inicia sesión
          </a>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Verificar código"
      subtitle="Ingresa el código de 6 dígitos que recibiste en tu correo"
    >
      <div className="space-y-6">
        <div>
          <p className="text-sm text-primary-text/70 mb-6 text-center">
            Código enviado a: <span className="text-primary-accent font-medium">{email}</span>
          </p>

          <OtpInput
            length={6}
            onComplete={handleOtpComplete}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border-2 border-red-500/40 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setStep('form')
              setError('')
            }}
            disabled={loading}
            className="text-sm text-primary-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Volver
          </button>
        </div>

        <p className="text-xs text-primary-text/50 text-center">
          El código expira en 15 minutos
        </p>
      </div>
    </AuthCard>
  )
}
