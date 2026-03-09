'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ClientListItem } from '@/lib/types'

interface ClientsTableProps {
  clients: ClientListItem[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  function getStatusBadge(client: ClientListItem) {
    if (!client.latest_engagement) {
      return <Badge variant="pending">Sin actividad</Badge>
    }

    if (client.latest_engagement.status === 'active') {
      return <Badge variant="active">En onboarding</Badge>
    }

    if (client.latest_engagement.status === 'completed' && !client.has_published_report) {
      return <Badge variant="pending">Esperando reporte</Badge>
    }

    if (client.has_published_report) {
      return <Badge variant="published">Reporte publicado</Badge>
    }

    return <Badge variant="pending">Sin actividad</Badge>
  }

  function getLastActivity(client: ClientListItem) {
    if (!client.latest_engagement?.engagement_date) {
      return 'nunca'
    }
    const date = new Date(client.latest_engagement.engagement_date)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'hoy'
    if (diffDays === 1) return 'ayer'
    return `hace ${diffDays} días`
  }

  return (
    <div className="overflow-x-auto border-2 border-bicicleta-border rounded-lg">
      {clients.length === 0 ? (
        <div className="p-8 text-center text-bicicleta-text-muted">
          Todavía no hay clientes registrados
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-bicicleta-surface2 border-b-2 border-bicicleta-border">
              <th className="px-6 py-4 text-left font-semibold text-bicicleta-text">Nombre</th>
              <th className="px-6 py-4 text-left font-semibold text-bicicleta-text">Email</th>
              <th className="px-6 py-4 text-left font-semibold text-bicicleta-text">Sesiones</th>
              <th className="px-6 py-4 text-left font-semibold text-bicicleta-text">Estado</th>
              <th className="px-6 py-4 text-left font-semibold text-bicicleta-text">Última actividad</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
              >
                <tr className="border-b border-bicicleta-border hover:bg-bicicleta-surface2 cursor-pointer transition-colors">
                  <td className="px-6 py-4 text-bicicleta-text font-medium">
                    {client.full_name}
                  </td>
                  <td className="px-6 py-4 text-bicicleta-text-muted">{client.email}</td>
                  <td className="px-6 py-4 text-bicicleta-text">
                    {client.latest_engagement?.engagement_number || 0} sesiones
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(client)}</td>
                  <td className="px-6 py-4 text-bicicleta-text-muted">
                    {getLastActivity(client)}
                  </td>
                </tr>
              </Link>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
