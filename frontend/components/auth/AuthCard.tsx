interface AuthCardProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-bicicleta-text mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-bicicleta-text-muted text-sm">{subtitle}</p>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}
