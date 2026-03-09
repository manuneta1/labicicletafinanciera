'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { OtpInput } from '@/components/auth/OtpInput'
import {
  sendOtp,
  verifyOtp,
  signUpWithPassword,
  createProfile,
} from '@/lib/auth/actions'

type AuthMethod = 'choice' | 'otp' | 'password'
type Step = 'form' | 'verify'

interface RegisterState {
  method: AuthMethod
  step: Step
  email: string
  password: string
  passwordConfirm: string
  fullName: string
  error: string
  loading: boolean
}

export default function RegisterPage() {
  const router = useRouter()
  const [state, setState] = useState<RegisterState>({
    method: 'choice',
    step: 'form',
    email: '',
    password: '',
    passwordConfirm: '',
    fullName: '',
    error: '',
    loading: false,
  })

  const selectAuthMethod = (method: 'otp' | 'password') => {
    setState((prev) => ({
      ...prev,
      method,
      error: '',
      email: '',
      password: '',
      passwordConfirm: '',
      fullName: '',
      step: 'form',
    }))
  }

  // OTP Registration Flow
  const handleOtpFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState((prev) => ({ ...prev, error: '', loading: true }))

    try {
      if (!state.email || !state.email.includes('@')) {
        setState((prev) => ({
          ...prev,
          error: 'Por favor ingresa un correo válido',
          loading: false,
        }))
        return
      }

      if (!state.fullName.trim()) {
        setState((prev) => ({
          ...prev,
          error: 'Por favor ingresa tu nombre completo',
          loading: false,
        }))
        return
      }

      await sendOtp(state.email, true)
      setState((prev) => ({ ...prev, step: 'verify', loading: false }))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al enviar el código'
      setState((prev) => ({
        ...prev,
        error: errorMessage.includes('rate limit')
          ? 'Demasiados intentos. Intenta en unos minutos.'
          : 'Error al registrarse',
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

      await createProfile(
        data.user.id,
        state.email,
        state.fullName,
        'client'
      )

      router.push('/auth/onboarding')
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: 'Código incorrecto o expirado',
        step: 'form',
        loading: false,
      }))
    }
  }

  // Password Registration Flow
  const handlePasswordFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState((prev) => ({ ...prev, error: '', loading: true }))

    try {
      if (!state.email || !state.email.includes('@')) {
        setState((prev) => ({
          ...prev,
          error: 'Por favor ingresa un correo válido',
          loading: false,
        }))
        return
      }

      if (!state.fullName.trim()) {
        setState((prev) => ({
          ...prev,
          error: 'Por favor ingresa tu nombre completo',
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

      if (state.password !== state.passwordConfirm) {
        setState((prev) => ({
          ...prev,
          error: 'Las contraseñas no coinciden',
          loading: false,
        }))
        return
      }

      const { data } = await signUpWithPassword(state.email, state.password)

      if (!data.user?.id) {
        setState((prev) => ({
          ...prev,
          error: 'Error al registrarse',
          loading: false,
        }))
        return
      }

      // Create profile
      await createProfile(
        data.user.id,
        state.email,
        state.fullName,
        'client'
      )

      router.push('/auth/onboarding')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al registrarse'
      setState((prev) => ({
        ...prev,
        error: errorMessage.includes('already')
          ? 'Este correo ya está registrado'
          : errorMessage,
        loading: false,
      }))
    }
  }

  // Choice screen
  if (state.method === 'choice') {
    return (
      <AuthCard
        title="Crea tu cuenta"
        subtitle="Elige tu método de registro"
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
              Verifica tu identidad con un código de 6 dígitos
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
              Crea una cuenta con contraseña
            </p>
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-bicicleta-text-muted">
          ¿Ya tienes cuenta?{' '}
          <a
            href="/auth/login"
            className="text-bicicleta-accent hover:underline font-medium"
          >
            Inicia sesión
          </a>
        </div>
      </AuthCard>
    )
  }

  // OTP Registration
  if (state.method === 'otp') {
    if (state.step === 'form') {
      return (
        <AuthCard
          title="Crea tu cuenta"
          subtitle="Con código por correo"
        >
          <form onSubmit={handleOtpFormSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-bicicleta-text mb-2"
              >
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                value={state.fullName}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Tu nombre"
                disabled={state.loading}
                className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>

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
              {state.loading ? 'Enviando código...' : 'Continuar'}
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

    // OTP Verification
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
                  step: 'form',
                  error: '',
                }))
              }
              disabled={state.loading}
              className="text-sm text-bicicleta-accent hover:underline disabled:opacity-50"
            >
              Volver
            </button>
          </div>

          <p className="text-xs text-bicicleta-text/50 text-center">
            El código expira en 15 minutos
          </p>
        </div>
      </AuthCard>
    )
  }

  // Password Registration
  return (
    <AuthCard
      title="Crea tu cuenta"
      subtitle="Con correo y contraseña"
    >
      <form onSubmit={handlePasswordFormSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-bicicleta-text mb-2"
          >
            Nombre completo
          </label>
          <input
            id="fullName"
            type="text"
            value={state.fullName}
            onChange={(e) =>
              setState((prev) => ({ ...prev, fullName: e.target.value }))
            }
            placeholder="Tu nombre"
            disabled={state.loading}
            className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

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
            placeholder="Mínimo 6 caracteres"
            disabled={state.loading}
            className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
        </div>

        <div>
          <label
            htmlFor="passwordConfirm"
            className="block text-sm font-medium text-bicicleta-text mb-2"
          >
            Confirmar contraseña
          </label>
          <input
            id="passwordConfirm"
            type="password"
            value={state.passwordConfirm}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                passwordConfirm: e.target.value,
              }))
            }
            placeholder="Confirma tu contraseña"
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
          {state.loading ? 'Creando cuenta...' : 'Crear cuenta'}
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
        ¿Ya tienes cuenta?{' '}
        <a
          href="/auth/login"
          className="text-bicicleta-accent hover:underline font-medium"
        >
          Inicia sesión
        </a>
      </div>
    </AuthCard>
  )
}
