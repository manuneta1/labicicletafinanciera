'use client'

import { useEffect, useRef, useState } from 'react'

interface OtpInputProps {
  length?: number
  onComplete: (otp: string) => void
  disabled?: boolean
}

export function OtpInput({ length = 6, onComplete, disabled = false }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(length).fill(null))

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    // Check if all digits are filled
    if (otp.every((digit) => digit !== '')) {
      onComplete(otp.join(''))
    }
  }, [otp, onComplete])

  const handleChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Move focus to next input if digit entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault()

      const newOtp = [...otp]
      if (otp[index]) {
        // Clear current input
        newOtp[index] = ''
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtp[index - 1] = ''
        inputRefs.current[index - 1]?.focus()
      }
      setOtp(newOtp)
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')

    // Only accept numeric input
    if (!/^\d*$/.test(pastedData)) return

    const pastedDigits = pastedData.slice(0, length).split('')
    const newOtp = [...otp]

    pastedDigits.forEach((digit, index) => {
      newOtp[index] = digit
    })

    setOtp(newOtp)

    // Focus last filled input or next empty input
    const nextEmptyIndex = newOtp.findIndex((d) => d === '')
    const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-14 h-14 text-center text-2xl font-bold bg-primary-surface border-2 border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label={`Dígito ${index + 1}`}
        />
      ))}
    </div>
  )
}
