import React from 'react'
import { BadgeProps } from '@/lib/types'

export function Badge({ variant, children }: BadgeProps) {
  const variantStyles = {
    pending: 'bg-bicicleta-text-dim/20 text-bicicleta-text-muted border border-bicicleta-text-dim',
    active:
      'bg-yellow-500/20 text-yellow-600 border border-yellow-500',
    completed: 'bg-bicicleta-success/20 text-bicicleta-success border border-bicicleta-success',
    published:
      'bg-bicicleta-success/20 text-bicicleta-success border border-bicicleta-success',
    error: 'bg-bicicleta-error/20 text-bicicleta-error border border-bicicleta-error',
    info: 'bg-bicicleta-accent/20 text-bicicleta-accent border border-bicicleta-accent',
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]}`}
    >
      {variant === 'completed' || variant === 'published' ? '✓ ' : ''}{children}
    </span>
  )
}
