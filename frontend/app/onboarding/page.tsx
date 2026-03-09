'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, getUserProfile } from '@/lib/auth/actions'
import {
  getActiveQuiz,
  getActiveForm,
  getOrCreateEngagement,
  hasCompletedEngagement,
  saveQuizAttempt,
  saveFormAnswers,
  completeEngagement,
  Quiz,
  Form,
  Engagement,
  QuizQuestion,
} from '@/lib/onboarding/actions'

interface OnboardingState {
  currentStep: number
  loading: boolean
  error: string
  quiz: Quiz | null
  form: Form | null
  engagement: Engagement | null
  quizAnswers: Record<string, string>
  formAnswers: Record<string, unknown>
  showWelcome: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    loading: true,
    error: '',
    quiz: null,
    form: null,
    engagement: null,
    quizAnswers: {},
    formAnswers: {},
    showWelcome: true,
  })

  // Initial load - check auth and load quiz/form
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check authentication
        const session = await getSession()
        if (!session?.user?.id) {
          console.log('No session, redirecting to login')
          router.push('/auth/login')
          return
        }

        console.log('Fetching quiz and form...')
        // Fetch quiz and form
        const quiz = await getActiveQuiz()
        const form = await getActiveForm()

        console.log('Quiz loaded:', quiz ? `${quiz.questions.length} questions` : 'null')
        console.log('Form loaded:', form ? `${form.sections.length} sections` : 'null')

        if (!quiz || !form) {
          setState((prev) => ({
            ...prev,
            error: 'No pudimos cargar los datos de la evaluación. Por favor, intenta más tarde.',
            loading: false,
          }))
          return
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          quiz,
          form,
        }))
      } catch (error) {
        console.error('Error initializing:', error)
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false,
        }))
      }
    }

    initialize()
  }, [router])

  if (state.loading) {
    return (
      <div className="min-h-screen bg-bicicleta-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-bicicleta-accent/20 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-bicicleta-accent animate-spin"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-bicicleta-text-muted">Cargando...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-bicicleta-bg flex items-center justify-center p-4">
        <div className="bg-bicicleta-surface border-2 border-bicicleta-error rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-bicicleta-error mb-4">Error</h1>
          <p className="text-bicicleta-text mb-6">{state.error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-3 bg-bicicleta-accent text-bicicleta-bg font-semibold rounded-lg hover:bg-bicicleta-accent-light transition-all"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  // Only require quiz and form initially. Engagement is created on welcome screen.
  if (!state.quiz || !state.form) {
    return (
      <div className="min-h-screen bg-bicicleta-bg flex items-center justify-center p-4">
        <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-bicicleta-text mb-4">
            Datos no disponibles
          </h1>
          <p className="text-bicicleta-text-muted mb-6">
            No pudimos cargar los datos necesarios. Por favor, intenta más tarde.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 bg-bicicleta-accent text-bicicleta-bg font-semibold rounded-lg hover:bg-bicicleta-accent-light transition-all"
          >
            Ir al panel
          </button>
        </div>
      </div>
    )
  }

  // After welcome screen is dismissed, engagement must exist
  if (!state.showWelcome && !state.engagement) {
    return (
      <div className="min-h-screen bg-bicicleta-bg flex items-center justify-center p-4">
        <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-bicicleta-text mb-4">
            Error al crear sesión
          </h1>
          <p className="text-bicicleta-text-muted mb-6">
            No pudimos crear tu sesión. Por favor, intenta de nuevo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-bicicleta-accent text-bicicleta-bg font-semibold rounded-lg hover:bg-bicicleta-accent-light transition-all"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const totalSteps = 4 // Quiz + 3 form sections
  const canAdvance = () => {
    if (state.currentStep === 0) {
      // Quiz: all questions answered
      if (!state.quiz) return false
      return state.quiz.questions.every((q) => state.quizAnswers[q.id])
    } else {
      // Form: all required fields filled for current section
      if (!state.form) return false
      const sectionIndex = state.currentStep - 1
      const section = state.form.sections[sectionIndex]
      if (!section) return false
      return section.questions.every((q) => !q.required || state.formAnswers[q.id])
    }
  }

  const handleQuizAnswer = (questionId: string, optionIndex: number) => {
    setState((prev) => ({
      ...prev,
      quizAnswers: { ...prev.quizAnswers, [questionId]: optionIndex.toString() },
    }))
  }

  const handleFormFieldChange = (questionId: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      formAnswers: { ...prev.formAnswers, [questionId]: value },
    }))
  }

  const handleNext = async () => {
    if (state.currentStep === 0) {
      // Quiz complete - save and advance
      const quiz = state.quiz!
      const answers = state.quizAnswers
      let correctCount = 0

      const optionLetters = ['a', 'b', 'c'] as const
      quiz.questions.forEach((question) => {
        const answer = answers[question.id]
        if (answer !== undefined) {
          const selectedIndex = parseInt(answer)
          const selectedLetter = optionLetters[selectedIndex]
          if (selectedLetter === question.correctOption) {
            correctCount++
          }
        }
      })

      const session = await getSession()
      const userId = session?.user?.id
      if (!userId) {
        setState((prev) => ({
          ...prev,
          error: 'Tu sesión expiró. Por favor, inicia sesión de nuevo.',
        }))
        return
      }

      const success = await saveQuizAttempt(
        userId,
        state.engagement!.id,
        quiz.id,
        answers,
        quiz.questions.length,
        correctCount
      )

      if (!success) {
        setState((prev) => ({
          ...prev,
          error: 'Error al guardar la evaluación. Por favor, intenta de nuevo.',
        }))
        return
      }
    }

    setState((prev) => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }))
  }

  const handleBack = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }))
  }

  const handleSubmit = async () => {
    try {
      const session = await getSession()
      if (!session?.user?.id) {
        setState((prev) => ({
          ...prev,
          error: 'Tu sesión expiró. Por favor, inicia sesión de nuevo.',
        }))
        return
      }

      // Convert formAnswers to array format for database
      const answersArray = Object.entries(state.formAnswers).map(
        ([question_id, value]) => ({
          question_id,
          value,
        })
      )

      const success = await saveFormAnswers(
        session.user.id,
        state.engagement!.id,
        answersArray
      )

      if (!success) {
        setState((prev) => ({
          ...prev,
          error: 'Error al guardar los datos del formulario. Por favor, intenta de nuevo.',
        }))
        return
      }

      // Mark engagement as completed
      const completed = await completeEngagement(state.engagement!.id)
      if (!completed) {
        setState((prev) => ({
          ...prev,
          error: 'Error al completar la evaluación. Por favor, intenta de nuevo.',
        }))
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      }))
    }
  }

  // Welcome screen
  if (state.showWelcome) {
    const handleEmpecemos = async () => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const session = await getSession()
        const userId = session?.user?.id
        if (!userId) {
          setState((prev) => ({
            ...prev,
            error: 'Session expired',
            loading: false,
          }))
          return
        }

        console.log('Creating engagement for user:', userId)
        // Create engagement
        const engagement = await getOrCreateEngagement(userId)
        console.log('Engagement result:', engagement)

        if (!engagement) {
          setState((prev) => ({
            ...prev,
            error: 'Error al crear la sesión. Intenta de nuevo.',
            loading: false,
          }))
          return
        }

        console.log('Engagement created successfully, hiding welcome screen')
        setState((prev) => ({
          ...prev,
          showWelcome: false,
          engagement,
          loading: false,
        }))
      } catch (err) {
        console.error('Error in handleEmpecemos:', err)
        setState((prev) => ({
          ...prev,
          error: 'Error al crear la sesión. Intenta de nuevo.',
          loading: false,
        }))
      }
    }

    return (
      <div className="min-h-screen bg-bicicleta-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-xl p-8 text-center">
            <div className="mb-6 text-6xl">🚴</div>
            <h1 className="text-3xl font-bold text-bicicleta-text mb-4">
              Welcome to La Bicicleta Financiera!
            </h1>
            <p className="text-bicicleta-text-muted mb-8 leading-relaxed">
              You're about to start a transformation journey in your personal finances.
              Answer these questions so we can personalize your experience.
            </p>
            {state.error && (
              <div className="p-3 bg-bicicleta-error/20 border-2 border-bicicleta-error rounded-lg text-bicicleta-error text-sm mb-4">
                {state.error}
              </div>
            )}
            <button
              onClick={handleEmpecemos}
              disabled={state.loading}
              className="w-full py-3 bg-bicicleta-accent text-bicicleta-bg font-semibold rounded-lg hover:bg-bicicleta-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {state.loading ? 'Cargando...' : 'Empecemos'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bicicleta-bg">
      {/* Header */}
      <div className="bg-bicicleta-surface border-b-2 border-bicicleta-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-bicicleta-text mb-1">
            🚴 La Bicicleta Financiera
          </h1>
          <p className="text-bicicleta-text-muted text-sm">Evaluación inicial</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Step Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    index === state.currentStep
                      ? 'bg-bicicleta-accent text-bicicleta-bg'
                      : index < state.currentStep
                        ? 'bg-bicicleta-success text-bicicleta-bg'
                        : 'bg-bicicleta-surface border-2 border-bicicleta-border text-bicicleta-text'
                  }`}
                >
                  {index < state.currentStep ? '✓' : index + 1}
                </div>
                {index < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < state.currentStep
                        ? 'bg-bicicleta-success'
                        : 'bg-bicicleta-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-bicicleta-text-muted">
            <span>Evaluación</span>
            <span>Sección 1</span>
            <span>Sección 2</span>
            <span>Sección 3</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-xl p-8">
          {/* Quiz Step */}
          {state.currentStep === 0 && state.quiz && (
            <QuizStep
              quiz={state.quiz}
              answers={state.quizAnswers}
              onAnswer={handleQuizAnswer}
            />
          )}

          {/* Form Steps */}
          {state.currentStep > 0 &&
            state.currentStep <= state.form.sections.length && (
              <FormStep
                section={state.form.sections[state.currentStep - 1]}
                answers={state.formAnswers}
                onFieldChange={handleFormFieldChange}
              />
            )}

          {/* Error Message */}
          {state.error && (
            <div className="mt-6 p-4 bg-bicicleta-error/20 border-2 border-bicicleta-error rounded-lg text-bicicleta-error">
              {state.error}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              disabled={state.currentStep === 0}
              className="px-6 py-3 bg-bicicleta-surface2 border-2 border-bicicleta-border text-bicicleta-text font-semibold rounded-lg hover:border-bicicleta-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Atrás
            </button>

            {state.currentStep < totalSteps - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canAdvance()}
                className="px-6 py-3 bg-bicicleta-accent text-bicicleta-bg font-semibold rounded-lg hover:bg-bicicleta-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canAdvance()}
                className="px-6 py-3 bg-bicicleta-success text-bicicleta-bg font-semibold rounded-lg hover:bg-bicicleta-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Completar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Quiz Step Component
 */
function QuizStep({
  quiz,
  answers,
  onAnswer,
}: {
  quiz: Quiz
  answers: Record<string, string>
  onAnswer: (questionId: string, optionIndex: number) => void
}) {
  const optionLetters = ['a', 'b', 'c'] as const
  const getOptionLetter = (index: number): 'a' | 'b' | 'c' => {
    const letter = optionLetters[index]
    if (!letter) throw new Error(`Invalid option index: ${index}`)
    return letter
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-bicicleta-text">
        Evaluación de conocimientos financieros
      </h2>
      <p className="text-bicicleta-text-muted">
        Responde las siguientes preguntas para ayudarnos a entender tu nivel de
        conocimiento financiero.
      </p>

      {quiz.questions.map((question, questionIndex) => {
        const answered = !!answers[question.id]
        const selectedIndex = parseInt(answers[question.id] || '-1')
        const selectedOptionLetter = answered ? getOptionLetter(selectedIndex) : null
        const isAnswerCorrect = selectedOptionLetter === question.correctOption

        const options = [
          { letter: 'A' as const, text: question.optionA },
          { letter: 'B' as const, text: question.optionB },
          { letter: 'C' as const, text: question.optionC },
        ]

        return (
          <div key={question.id} className="space-y-4">
            <h3 className="text-lg font-semibold text-bicicleta-text">
              Pregunta {questionIndex + 1}: {question.question}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  onClick={() => !answered && onAnswer(question.id, optionIndex)}
                  disabled={answered}
                  className={`p-4 text-left border-2 rounded-lg transition-all ${
                    answered && selectedIndex === optionIndex
                      ? isAnswerCorrect
                        ? 'bg-bicicleta-success/20 border-bicicleta-success text-bicicleta-text'
                        : 'bg-bicicleta-error/20 border-bicicleta-error text-bicicleta-text'
                      : 'border-bicicleta-border bg-bicicleta-bg hover:border-bicicleta-accent text-bicicleta-text'
                  } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="font-semibold">{option.letter}. {option.text}</div>
                </button>
              ))}
            </div>

            {answered && (
              <div
                className={`p-4 rounded-lg border-l-4 ${
                  isAnswerCorrect
                    ? 'bg-bicicleta-success/10 border-bicicleta-success text-bicicleta-text'
                    : 'bg-bicicleta-error/10 border-bicicleta-error text-bicicleta-text'
                }`}
              >
                <p className="font-semibold mb-2">
                  {isAnswerCorrect ? '✓ Correcto' : '✗ Incorrecto'}
                </p>
                <p className="text-sm">{question.explanation}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Form Step Component
 */
function FormStep({
  section,
  answers,
  onFieldChange,
}: {
  section: any
  answers: Record<string, unknown>
  onFieldChange: (questionId: string, value: unknown) => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-bicicleta-text mb-2">
          {section.title}
        </h2>
        <p className="text-bicicleta-text-muted">
          {section.description || 'Completa la información solicitada'}
        </p>
      </div>

      <div className="space-y-6">
        {section.questions.map((question: any) => (
          <FormField
            key={question.id}
            question={question}
            value={answers[question.id] || ''}
            onChange={(value) => onFieldChange(question.id, value)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Form Field Component
 */
function FormField({
  question,
  value,
  onChange,
}: {
  question: any
  value: any
  onChange: (value: unknown) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-bicicleta-text font-medium">
        {question.label}
        {question.required && <span className="text-bicicleta-error ml-1">*</span>}
      </label>

      {question.fieldType === 'text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || 'Ingresa tu respuesta'}
          className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 transition-all"
        />
      )}

      {question.fieldType === 'number' && (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
          placeholder={question.placeholder || 'Ingresa un número'}
          className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 transition-all"
        />
      )}

      {question.fieldType === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || 'Ingresa tu respuesta'}
          rows={4}
          className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 transition-all"
        />
      )}

      {question.fieldType === 'radio' && question.options && (
        <div className="flex flex-wrap gap-3">
          {question.options.map((option: any) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`px-4 py-2 rounded-full font-medium transition-all border-2 ${
                value === option.value
                  ? 'bg-bicicleta-accent text-bicicleta-bg border-bicicleta-accent'
                  : 'bg-bicicleta-bg border-bicicleta-border text-bicicleta-text hover:border-bicicleta-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {question.fieldType === 'checkbox' && question.options && (
        <div className="flex flex-wrap gap-3">
          {question.options.map((option: any) => {
            const selected = Array.isArray(value) ? value.includes(option.value) : false
            return (
              <button
                key={option.value}
                onClick={() => {
                  const newValue = Array.isArray(value) ? [...value] : []
                  if (selected) {
                    newValue.splice(newValue.indexOf(option.value), 1)
                  } else {
                    newValue.push(option.value)
                  }
                  onChange(newValue)
                }}
                className={`px-4 py-2 rounded-full font-medium transition-all border-2 ${
                  selected
                    ? 'bg-bicicleta-accent text-bicicleta-bg border-bicicleta-accent'
                    : 'bg-bicicleta-bg border-bicicleta-border text-bicicleta-text hover:border-bicicleta-accent'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}

      {question.fieldType === 'select' && question.options && (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 transition-all"
        >
          <option value="">Selecciona una opción</option>
          {question.options.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
