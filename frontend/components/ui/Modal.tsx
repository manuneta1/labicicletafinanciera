'use client'

import React, { useEffect, useState } from 'react'
import { Button } from './Button'
import { ModalProps } from '@/lib/types'

export function Modal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  isLoading = false,
}: ModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  async function handleConfirm() {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-xl p-8 max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold text-bicicleta-text mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-bicicleta-text-muted mb-6">{description}</p>
        )}
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isConfirming || isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            loading={isConfirming || isLoading}
            disabled={isConfirming || isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
