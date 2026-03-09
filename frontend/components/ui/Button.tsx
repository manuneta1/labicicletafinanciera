import React from 'react'
import { ButtonProps } from '@/lib/types'

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseStyles =
    'font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary:
      'bg-bicicleta-accent text-white hover:bg-bicicleta-accent-light active:scale-95',
    secondary:
      'bg-bicicleta-surface2 border-2 border-bicicleta-border text-bicicleta-text hover:border-bicicleta-accent active:scale-95',
    success:
      'bg-bicicleta-success text-bicicleta-bg hover:bg-bicicleta-success/90 active:scale-95',
    error:
      'bg-bicicleta-error text-white hover:bg-bicicleta-error/90 active:scale-95',
    ghost:
      'bg-transparent text-bicicleta-accent hover:text-bicicleta-accent-light active:scale-95',
  }

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div
      className={`${sizeClass[size]} animate-spin rounded-full border-2 border-current border-t-transparent`}
    />
  )
}
