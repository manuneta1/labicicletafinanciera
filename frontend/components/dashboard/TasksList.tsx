'use client'

import { useState } from 'react'
import { Tarea } from '@/lib/types'
import { completeTask } from '@/lib/dashboard/mutations'

interface TasksListProps {
  tasks: Tarea[]
}

export function TasksList({ tasks }: TasksListProps) {
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>(
    tasks.reduce(
      (acc, task) => ({
        ...acc,
        [task.id]: task.completada,
      }),
      {}
    )
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleToggleTask(taskId: string, currentState: boolean) {
    if (currentState) return // Already completed, can't uncomplete

    // Optimistic update
    setTaskStates((prev) => ({
      ...prev,
      [taskId]: true,
    }))
    setErrors((prev) => ({
      ...prev,
      [taskId]: '',
    }))

    try {
      await completeTask(taskId)
    } catch (error) {
      // Revert on error
      setTaskStates((prev) => ({
        ...prev,
        [taskId]: false,
      }))
      setErrors((prev) => ({
        ...prev,
        [taskId]: 'No pudimos marcar la tarea como completada',
      }))
    }
  }

  // Separate pending and completed tasks
  const pendingTasks = tasks.filter((t) => !taskStates[t.id])
  const completedTasks = tasks.filter((t) => taskStates[t.id])

  return (
    <div className="space-y-3">
      {/* Pending tasks */}
      {pendingTasks.map((task) => (
        <div key={task.id} className="flex items-start gap-3">
          <button
            onClick={() => handleToggleTask(task.id, false)}
            className="mt-1 w-5 h-5 border-2 border-bicicleta-border rounded hover:border-bicicleta-accent transition-colors"
            aria-label={`Complete task: ${task.descripcion}`}
          />
          <div className="flex-1">
            <p className="text-bicicleta-text">{task.descripcion}</p>
            {errors[task.id] && (
              <p className="text-xs text-bicicleta-error mt-1">{errors[task.id]}</p>
            )}
          </div>
        </div>
      ))}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <>
          {pendingTasks.length > 0 && <div className="h-px bg-bicicleta-border my-4" />}
          {completedTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 border-2 border-bicicleta-success rounded bg-bicicleta-success flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-bicicleta-bg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-bicicleta-text-muted line-through">
                  {task.descripcion}
                </p>
                <p className="text-xs text-bicicleta-success font-semibold mt-1">
                  Completada ✓
                </p>
              </div>
            </div>
          ))}
        </>
      )}

      {tasks.length === 0 && (
        <p className="text-center text-bicicleta-text-muted py-4">
          Sin tareas pendientes
        </p>
      )}
    </div>
  )
}
