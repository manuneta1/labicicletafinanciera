'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { OtpInput } from '@/components/auth/OtpInput'
import {
  sendOtp,
  verifyOtp,
  signInWithPassword,
  getUserProfile,
} from '@/lib/auth/actions'

type AuthMethod = 'choice' | 'otp' | 'password'
type Step = 'email' | 'verify'

interface LoginState {
  method: AuthMethod
  step: Step
  email: string
  password: string
  error: string
  loading: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const [state, setState] = useState<LoginState>({
    method: 'choice',
    step: 'email',
    email: '',
    password: '',
    error: '',
    loading: false,
  })

  // Handle method selection
  const selectAuthMethod = (method: 'otp' | 'password') => {
    setState((prev) => ({
      ...prev,
      method,
      error: '',
      email: '',
      password: '',
      step: 'email',
    }))
  }

  // Handle OTP flow
  const handleOtpEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState((prev) => ({ ...prev, error: '', loading: true }))

    try {
      if (!state.email || !state.email.includes('@')) {
        setState((prev) => ({
          ...prev,
          error: 'Por favor ingresa un correo electrónico válido',
          loading: false,
        }))
        return
      }

      await sendOtp(state.email, false)
      setState((prev) => ({ ...prev, step: 'verify', loading: false }))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al enviar el código'
      setState((prev) => ({
        ...prev,
        error: errorMessage.includes('rate limit')
          ? 'Demasiados intentos. Intenta en unos minutos.'
          : 'El correo no está registrado',
        loading: false,
      }))
    }
  }

  const handleOtpVerify = async (otp: string) => {
    setState((prev) => ({ ...prev, error: '', loading: true }))

    try {
      const { data } = await verifyOtp(state.email, otp)

      if (!data.user?.id) {
        setState((prev) => ({
          ...prev,
          error: 'Error al verificar el código',
          loading: false,
        }))
        return
      }

      const profile = await getUserProfile(data.user.id)

      if (profile.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: 'Código incorrecto o expirado',
        step: 'email',
        loading: false,
      }))
    }
  }

  // Handle password login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState((prev) => ({ ...prev, error: '', loading: true }))

    try {
      if (!state.email || !state.email.includes('@')) {
        setState((prev) => ({
          ...prev,
          error: 'Por favor ingresa un correo electrónico válido',
          loading: false,
        }))
        return
      }

      if (!state.password || state.password.length < 6) {
        setState((prev) => ({
          ...prev,
          error: 'La contraseña debe tener al menos 6 caracteres',
          loading: false,
        }))
        return
      }

      const { data } = await signInWithPassword(state.email, state.password)

      if (!data.user?.id) {
        setState((prev) => ({
          ...prev,
          error: 'Error al iniciar sesión',
          loading: false,
        }))
        return
      }

      const profile = await getUserProfile(data.user.id)

      if (profile.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Correo o contraseña incorrectos'
      setState((prev) => ({
        ...prev,
        error: 'Correo o contraseña incorrectos',
        loading: false,
      }))
    }
  }

  // Choice screen
  if (state.method === 'choice') {
    return (
      <AuthCard
        title="Inicia sesión"
        subtitle="Elige tu método de autenticación"
      >
        <div className="space-y-4">
          <button
            onClick={() => selectAuthMethod('otp')}
            className="w-full p-4 border-2 border-bicicleta-border bg-bicicleta-bg rounded-lg hover:border-bicicleta-accent hover:bg-bicicleta-surface transition-all text-left"
          >
            <h3 className="text-bicicleta-accent font-semibold mb-1">
              Código por correo
            </h3>
            <p className="text-bicicleta-text-muted text-sm">
              Recibe un código de 6 dígitos en tu correo
            </p>
          </button>

          <button
            onClick={() => selectAuthMethod('password')}
            className="w-full p-4 border-2 border-bicicleta-border bg-bicicleta-bg rounded-lg hover:border-bicicleta-accent hover:bg-bicicleta-surface transition-all text-left"
          >
            <h3 className="text-bicicleta-accent font-semibold mb-1">
              Correo y contraseña
            </h3>
            <p className="text-bicicleta-text-muted text-sm">
              Acceso rápido con tu contraseña
            </p>
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-bicicleta-text-muted">
          ¿No tienes cuenta?{' '}
          <a
            href="/auth/register"
            className="text-bicicleta-accent hover:underline font-medium"
          >
            Regístrate aquí
          </a>
        </div>
      </AuthCard>
    )
  }

  // OTP flow
  if (state.method === 'otp') {
    if (state.step === 'email') {
      return (
        <AuthCard
          title="Inicia sesión"
          subtitle="Ingresa tu correo electrónico"
        >
          <form onSubmit={handleOtpEmailSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-bicicleta-text mb-2"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={state.email}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="tu@correo.com"
                disabled={state.loading}
                className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {state.error && (
              <div className="p-3 bg-red-500/20 border-2 border-red-500/40 rounded-lg text-red-200 text-sm">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={state.loading}
              className="w-full py-3 bg-bicicleta-accent text-bicicleta-bg font-semibold rounded-lg hover:bg-bicicleta-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {state.loading ? 'Enviando código...' : 'Enviar código'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => selectAuthMethod('password')}
              className="text-sm text-bicicleta-accent hover:underline"
            >
              Usar contraseña en su lugar
            </button>
          </div>
        </AuthCard>
      )
    }

    // OTP verification
    return (
      <AuthCard
        title="Verificar código"
        subtitle="Ingresa el código de 6 dígitos"
      >
        <div className="space-y-6">
          <div>
            <p className="text-sm text-bicicleta-text-muted mb-6 text-center">
              Código enviado a:{' '}
              <span className="text-bicicleta-accent font-medium">
                {state.email}
              </span>
            </p>

            <OtpInput
              length={6}
              onComplete={handleOtpVerify}
              disabled={state.loading}
            />
          </div>

          {state.error && (
            <div className="p-3 bg-red-500/20 border-2 border-red-500/40 rounded-lg text-red-200 text-sm">
              {state.error}
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  step: 'email',
                  error: '',
                }))
              }
              disabled={state.loading}
              className="text-sm text-bicicleta-accent hover:underline disabled:opacity-50"
            >
              Usar otro correo
            </button>
          </div>

          <p className="text-xs text-bicicleta-text/50 text-center">
            El código expira en 15 minutos
          </p>
        </div>
      </AuthCard>
    )
  }

  // Password flow
  return (
    <AuthCard
      title="Inicia sesión"
      subtitle="Con correo y contraseña"
    >
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-bicicleta-text mb-2"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={state.email}
            onChange={(e) =>
              setState((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="tu@correo.com"
            disabled={state.loading}
            className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-bicicleta-text mb-2"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={state.password}
            onChange={(e) =>
              setState((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Tu contraseña"
            disabled={state.loading}
            className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        {state.error && (
          <div className="p-3 bg-red-500/20 border-2 border-red-500/40 rounded-lg text-red-200 text-sm">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={state.loading}
          className="w-full py-3 bg-bicicleta-accent text-bicicleta-bg font-semibold rounded-lg hover:bg-bicicleta-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {state.loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => selectAuthMethod('otp')}
          className="text-sm text-bicicleta-accent hover:underline"
        >
          Usar código por correo en su lugar
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-bicicleta-text-muted">
        ¿No tienes cuenta?{' '}
        <a
          href="/auth/register"
          className="text-bicicleta-accent hover:underline font-medium"
        >
          Regístrate aquí
        </a>
      </div>
    </AuthCard>
  )
}
