import React from 'react'
import { TextareaProps } from '@/lib/types'

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-bicicleta-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 bg-bicicleta-bg border-2 border-bicicleta-border rounded-lg text-bicicleta-text placeholder-bicicleta-text-dim focus:outline-none focus:border-bicicleta-accent focus:ring-2 focus:ring-bicicleta-accent/30 transition-all resize-none ${
            error ? 'border-bicicleta-error' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-bicicleta-error">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
