/**
 * Centralized TypeScript type definitions
 * Matches backend response shapes from backend/src/lib/types.ts
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

// ============ Response Types ============

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

export interface QuizQuestion {
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
}

export interface FormResponseAnswer {
  question_id: string
  label: string
  field_type: string
  value: any
}

export interface FormResponseGrouped {
  section_title: string
  section_position: number
  answers: FormResponseAnswer[]
}

export interface EngagementDetailResponse {
  engagement: {
    id: string
    engagement_number: number
    status: string
    engagement_date: string | null
  }
  quiz_attempt: {
    score: number
    level: string
    questions: QuizQuestion[]
  } | null
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

export interface CreateObjectiveInput {
  titulo: string
  descripcion: string
  eta: string | null
}

export interface CreateTaskInput {
  descripcion: string
}

// ============ UI Component Props Types ============

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export interface CardProps {
  children: React.ReactNode
  className?: string
}

export interface BadgeProps {
  variant: 'pending' | 'active' | 'completed' | 'published' | 'error' | 'info'
  children: React.ReactNode
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export interface ModalProps {
  isOpen: boolean
  title: string
  description?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'error'
  isLoading?: boolean
}

export interface TableColumn<T> {
  name: string
  accessor: keyof T | string
  render?: (value: any, row: T) => React.ReactNode
  width?: string
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
}
