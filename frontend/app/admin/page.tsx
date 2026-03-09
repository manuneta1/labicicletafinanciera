import { getAllClients } from '@/lib/admin/actions'
import { ClientsTable } from '@/components/admin/ClientsTable'

export default async function AdminPage() {
  const { clients } = await getAllClients()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-bicicleta-text">Clientes</h1>
        <div className="text-sm text-bicicleta-text-muted">
          {clients.length} cliente{clients.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <ClientsTable clients={clients} />
    </div>
  )
}
