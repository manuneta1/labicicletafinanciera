import { AuthLayout } from '@/components/auth/AuthLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Autenticación | La Bicicleta Financiera',
  description: 'Inicia sesión o regístrate en La Bicicleta Financiera',
}

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayout>{children}</AuthLayout>
}
