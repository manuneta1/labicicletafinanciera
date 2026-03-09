'use client'

import { DashboardResponse } from '@/lib/types'
import { TasksList } from './TasksList'

interface DashboardContentProps {
  dashboard: DashboardResponse
}

export function DashboardContent({ dashboard }: DashboardContentProps) {
  return (
    <div className="space-y-8">
      {/* Report Section */}
      {dashboard.report && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-bicicleta-text-muted tracking-widest uppercase">
              Tu diagnóstico
            </h2>
            <div className="flex-1 h-px bg-bicicleta-border" />
          </div>
          <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-xl p-6 space-y-4">
            <div className="text-bicicleta-text whitespace-pre-wrap leading-relaxed">
              {dashboard.report.reporte_texto}
            </div>
          </div>
        </section>
      )}

      {/* Objectives Section */}
      {dashboard.objectives.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-bicicleta-text-muted tracking-widest uppercase">
              Tus objetivos
            </h2>
            <div className="flex-1 h-px bg-bicicleta-border" />
          </div>
          <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-xl p-6 space-y-4">
            {dashboard.objectives.map((obj) => (
              <div key={obj.id} className="flex gap-3">
                <div className="text-bicicleta-accent pt-1">●</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-bicicleta-text">
                    {obj.titulo}
                  </h3>
                  <p className="text-bicicleta-text-muted text-sm mt-1">
                    {obj.descripcion}
                  </p>
                  {obj.eta && (
                    <p className="text-bicicleta-text-dim text-xs mt-2">
                      ETA: {new Date(obj.eta).toLocaleDateString('es-AR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tasks Section */}
      {dashboard.tasks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-bicicleta-text-muted tracking-widest uppercase">
              Tus tareas
            </h2>
            <div className="flex-1 h-px bg-bicicleta-border" />
          </div>
          <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-xl p-6">
            <TasksList tasks={dashboard.tasks} />
          </div>
        </section>
      )}

      {/* Engagement History */}
      {dashboard.engagements.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-bicicleta-text-muted tracking-widest uppercase">
              Tus sesiones
            </h2>
            <div className="flex-1 h-px bg-bicicleta-border" />
          </div>
          <div className="bg-bicicleta-surface border-2 border-bicicleta-border rounded-xl p-6 space-y-3">
            {dashboard.engagements.map((engagement) => (
              <div
                key={engagement.id}
                className="flex items-center justify-between py-2 border-b border-bicicleta-border last:border-0"
              >
                <div>
                  <p className="font-semibold text-bicicleta-text">
                    Sesión {engagement.engagement_number}
                  </p>
                  <p className="text-sm text-bicicleta-text-muted">
                    {engagement.engagement_date
                      ? new Date(engagement.engagement_date).toLocaleDateString(
                          'es-AR'
                        )
                      : 'Sin fecha'}{' '}
                    · {engagement.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
