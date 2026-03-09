import { DM_Sans } from 'next/font/google'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] })

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={`${dmSans.className} min-h-screen bg-primary-bg flex flex-col items-center justify-center px-4`}>
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold text-primary-accent mb-2">
          🚴 La Bicicleta Financiera
        </h2>
        <p className="text-primary-text/60">
          Acompañamiento de finanzas personales
        </p>
      </div>

      {children}
    </div>
  )
}
