import Anthropic from '@anthropic-ai/sdk'
import { Profile, QuizAttempt, QuizQuestion, FormAnswer, FormQuestion } from './types'
import { env } from '../config/env'

const client = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})

interface ReportGenerationData {
  profile: Profile
  quizAttempt: QuizAttempt
  quizQuestions: Array<QuizQuestion & { clientAnswer?: string }>
  formAnswers: Array<{
    question: FormQuestion
    value: any
  }>
}

/**
 * Generate a personalized financial diagnosis report using Claude
 * System prompt and user data structured per CLAUDE.md specification
 * Report is generated in Argentine Spanish with direct, warm tone
 */
export async function generateReport(data: ReportGenerationData): Promise<string> {
  const { profile, quizAttempt, quizQuestions, formAnswers } = data

  // Build the structured user data section for the prompt
  const quizResultsSection = buildQuizResultsSection(
    quizAttempt,
    quizQuestions
  )
  const formResponsesSection = buildFormResponsesSection(formAnswers)

  const userPrompt = `
Cliente: ${profile.full_name}
Email: ${profile.email}

RESULTADOS DEL QUIZ:
${quizResultsSection}

RESPUESTAS DEL FORMULARIO:
${formResponsesSection}

Por favor, generá el reporte de diagnóstico financiero personalizado siguiendo la estructura solicitada.
`

  const systemPrompt = `Sos el asistente de Manu Celio, coach de finanzas personales de La Bicicleta Financiera. Tu tarea es escribir el reporte personalizado de diagnóstico financiero de un cliente.

Escribí en primera persona del coach, con voz directa, cálida, sin tecnicismos. Usá "vos" (español argentino). Sin emojis. Sin bullet points en el cuerpo del reporte.

El nivel del cliente es ${quizAttempt.level} — ajustá la complejidad del lenguaje en consecuencia:
- beginner: explicá los conceptos básicos cuando los uses
- intermediate: podés asumir conocimiento de conceptos base
- advanced: podés ir directo a estrategia y tradeoffs

El reporte debe incluir:
1. Diagnóstico de la situación actual
2. Relación emocional con el dinero (basado en las respuestas del formulario)
3. 3 prioridades para los próximos 3 meses
4. Hoja de ruta hacia sus objetivos declarados
5. Cierre personal

Recordá:
- Contexto: clientes argentinos en contexto de inflación alta
- Instrumentos locales: FCI, CEDEARs, plazo fijo, cripto, dólar MEP
- Tono: directo, cercano, sin jargon financiero, usa "vos"
- Estructura: párrafos coherentes, sin viñetas
- Longitud: 500-800 palabras`

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extract text from response
    if (response.content[0].type !== 'text') {
      throw new Error('Unexpected response type from Claude API')
    }

    return response.content[0].text
  } catch (error) {
    console.error('[anthropic] Report generation failed:', error)
    throw error
  }
}

/**
 * Format quiz results for the prompt
 */
function buildQuizResultsSection(
  attempt: QuizAttempt,
  questions: Array<QuizQuestion & { clientAnswer?: string }>
): string {
  const formattedQuestions = questions.map((q) => {
    const answer = attempt.answers[q.id]
    const isCorrect = answer === q.correct_option
    const optionMap: Record<string, string> = {
      a: q.option_a,
      b: q.option_b,
      c: q.option_c,
    }
    const clientAnswer = answer ? optionMap[answer] : 'No respondida'
    const correctAnswer = optionMap[q.correct_option]

    return `
Pregunta: ${q.question}
Tema: ${q.topic}
Respuesta del cliente: ${clientAnswer}
Respuesta correcta: ${correctAnswer}
Resultado: ${isCorrect ? 'CORRECTA' : 'INCORRECTA'}
Explicación: ${q.explanation}
`
  })

  return `Score: ${attempt.score}
Nivel: ${attempt.level}

Preguntas:
${formattedQuestions.join('\n')}`
}

/**
 * Format form responses for the prompt, organized by section
 */
function buildFormResponsesSection(
  formAnswers: Array<{
    question: FormQuestion
    value: any
  }>
): string {
  // Group by section (we don't have section info in FormAnswer, so just list them)
  const formatted = formAnswers
    .map((item) => {
      const value = formatValue(item.value)
      return `${item.question.label}: ${value}`
    })
    .join('\n')

  return formatted || 'Sin respuestas de formulario'
}

/**
 * Format various value types for display in prompt
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'No especificado'
  }
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
