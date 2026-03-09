import React from 'react'
import { CardProps } from '@/lib/types'

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-bicicleta-surface border-2 border-bicicleta-border rounded-xl p-6 ${className}`}
    >
      {children}
    </div>
  )
}
