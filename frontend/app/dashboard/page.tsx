import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/dashboard/actions'
import { WaitingState } from '@/components/dashboard/WaitingState'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get authenticated user (verifies JWT with Supabase)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/auth/login')
  }

  // Query profiles table to get role and name
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // Redirect admins to admin panel
  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  // Fetch dashboard data
  const dashboard = await getDashboardData()

  return (
    <div className="min-h-screen bg-bicicleta-bg">
      {/* Navigation bar */}
      <nav className="border-b-2 border-bicicleta-border bg-bicicleta-surface px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚲</span>
          <h1 className="text-xl font-bold text-bicicleta-text">La Bicicleta Financiera</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-bicicleta-text-muted">
            Hola, {profile?.full_name} 👋
          </div>
          <LogoutButton />
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-4xl mx-auto p-6">
        {!dashboard.report ? (
          <WaitingState />
        ) : (
          <DashboardContent dashboard={dashboard} />
        )}
      </main>
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="px-4 py-2 bg-bicicleta-surface2 border-2 border-bicicleta-border rounded-lg text-bicicleta-text hover:border-bicicleta-accent transition-colors"
      >
        Cerrar sesión
      </button>
    </form>
  )
}
