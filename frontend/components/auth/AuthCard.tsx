interface AuthCardProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-primary-surface border-2 border-primary-border rounded-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-text mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-primary-text/70 text-sm">{subtitle}</p>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}
