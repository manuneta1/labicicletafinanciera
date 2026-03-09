/**
 * TypeScript type definitions for database entities
 * All database columns use snake_case, types use camelCase
 */

// ============ Database Entity Types ============

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'client'
  created_at: string
}

export interface Engagement {
  id: string
  user_id: string
  title: string
  engagement_number: number
  status: 'pending' | 'active' | 'completed'
  engagement_date: string | null
  created_at?: string
}

export interface QuizAttempt {
  id: string
  user_id: string
  engagement_id: string
  quiz_id: string
  score: number
  level: 'beginner' | 'intermediate' | 'advanced'
  answers: Record<string, string> // { "question_id": "a" | "b" | "c" }
  created_at?: string
}

export interface QuizQuestion {
  id: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  correct_option: 'a' | 'b' | 'c'
  explanation: string
  topic: string
  created_at?: string
}

export interface QuizQuestionMap {
  quiz_id: string
  question_id: string
  position: number
}

export interface FormAnswer {
  id: string
  user_id: string
  engagement_id: string
  question_id: string
  value: any // can be string, number, array, boolean
  created_at?: string
}

export interface FormQuestion {
  id: string
  section_id: string
  label: string
  field_type: 'text' | 'number' | 'radio' | 'checkbox' | 'select' | 'textarea'
  options: Array<{ value: string; label: string }> | null
  placeholder: string | null
  required: boolean
  position: number
  created_at?: string
}

export interface FormSection {
  id: string
  form_id: string
  title: string
  description: string
  position: number
  created_at?: string
}

export interface Report {
  id: string
  user_id: string
  engagement_id: string
  reporte_texto: string
  reporte_publicado: boolean
  created_at?: string
  updated_at?: string
}

export interface Objetivo {
  id: string
  user_id: string
  engagement_id: string
  titulo: string
  descripcion: string
  eta: string | null
  orden: number
  created_at?: string
}

export interface Tarea {
  id: string
  user_id: string
  engagement_id: string
  descripcion: string
  completada: boolean
  completada_at: string | null
  orden: number
  created_at?: string
}

// ============ Response DTO Types ============

export interface QuizWithAnswers {
  score: number
  level: 'beginner' | 'intermediate' | 'advanced'
  questions: Array<{
    id: string
    question: string
    topic: string
    option_a: string
    option_b: string
    option_c: string
    correct_option: 'a' | 'b' | 'c'
    explanation: string
    client_answer: string
    is_correct: boolean
  }>
}

export interface FormResponseGrouped {
  section_title: string
  section_position: number
  answers: Array<{
    question_id: string
    label: string
    field_type: string
    value: any
  }>
}

export interface EngagementDetail {
  id: string
  engagement_number: number
  status: string
  engagement_date: string | null
}

export interface ClientListItem {
  id: string
  full_name: string
  email: string
  created_at: string
  latest_engagement: {
    id: string
    engagement_number: number
    status: 'pending' | 'active' | 'completed'
    engagement_date: string | null
  } | null
  has_published_report: boolean
}

export interface ClientDetailResponse {
  profile: {
    id: string
    full_name: string
    email: string
    created_at: string
  }
  engagements: Array<{
    id: string
    engagement_number: number
    status: string
    engagement_date: string | null
    quiz_attempt: {
      score: number
      level: string
      answers: Record<string, string>
    } | null
    has_published_report: boolean
  }>
  objectives: Array<{
    id: string
    titulo: string
    descripcion: string
    eta: string | null
    orden: number
    engagement_id: string
  }>
  tasks: Array<{
    id: string
    descripcion: string
    completada: boolean
    completada_at: string | null
    orden: number
    engagement_id: string
  }>
}

export interface EngagementDetailResponse {
  engagement: {
    id: string
    engagement_number: number
    status: string
    engagement_date: string | null
  }
  quiz_attempt: QuizWithAnswers | null
  form_responses: FormResponseGrouped[]
  report: {
    id: string
    reporte_texto: string
    reporte_publicado: boolean
  } | null
  objectives: Array<{
    id: string
    titulo: string
    descripcion: string
    eta: string | null
    orden: number
  }>
  tasks: Array<{
    id: string
    descripcion: string
    completada: boolean
    completada_at: string | null
    orden: number
  }>
}

export interface DashboardResponse {
  report: {
    id: string
    reporte_texto: string
    engagement_id: string
  } | null
  objectives: Array<{
    id: string
    titulo: string
    descripcion: string
    eta: string | null
    orden: number
  }>
  tasks: Array<{
    id: string
    descripcion: string
    completada: boolean
    completada_at: string | null
    orden: number
  }>
  engagements: Array<{
    id: string
    engagement_number: number
    status: string
    engagement_date: string | null
  }>
}

// ============ Request Body Types ============

export interface GenerateReportRequest {
  client_id: string
  engagement_id: string
}

export interface UpdateReportRequest {
  reporte_texto: string
}

export interface CreateObjectivesRequest {
  engagement_id: string
  objectives: Array<{
    titulo: string
    descripcion: string
    eta: string | null
  }>
}

export interface CreateTasksRequest {
  engagement_id: string
  tasks: Array<{
    descripcion: string
  }>
}
