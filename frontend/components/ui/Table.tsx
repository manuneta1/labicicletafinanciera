'use client'

import React from 'react'
import { TableProps, TableColumn } from '@/lib/types'

export function Table<T extends { id?: string } = any>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
}: TableProps<T>) {
  const getValue = (row: T, accessor: keyof T | string) => {
    if (typeof accessor === 'string') {
      return (row as any)[accessor]
    }
    return row[accessor]
  }

  return (
    <div className="overflow-x-auto border-2 border-bicicleta-border rounded-lg">
      {data.length === 0 ? (
        <div className="p-8 text-center text-bicicleta-text-muted">
          {emptyMessage}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bicicleta-surface2 border-b-2 border-bicicleta-border">
              {columns.map((col) => (
                <th
                  key={col.name}
                  className="px-6 py-4 text-left font-semibold text-bicicleta-text"
                  style={{ width: col.width }}
                >
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-bicicleta-border ${
                  onRowClick ? 'cursor-pointer hover:bg-bicicleta-surface2' : ''
                } transition-colors`}
              >
                {columns.map((col) => {
                  const value = getValue(row, col.accessor)
                  const rendered = col.render ? col.render(value, row) : value
                  return (
                    <td
                      key={`${col.name}-${row.id || idx}`}
                      className="px-6 py-4 text-bicicleta-text"
                    >
                      {rendered}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
