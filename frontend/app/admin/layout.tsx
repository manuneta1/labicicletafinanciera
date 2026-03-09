import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get authenticated user (verifies JWT with Supabase)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/auth/login')
  }

  // Query profiles table to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Redirect non-admins to dashboard
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-bicicleta-bg">
      {/* Navigation bar */}
      <nav className="border-b-2 border-bicicleta-border bg-bicicleta-surface px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚲</span>
          <h1 className="text-xl font-bold text-bicicleta-text">Panel Admin</h1>
        </div>
        <LogoutButton />
      </nav>

      {/* Main content */}
      <main className="p-6">{children}</main>
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
