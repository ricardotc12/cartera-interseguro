import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface AuditEntry {
  id: string
  tableName: string
  recordId: string
  action: 'insert' | 'update' | 'delete'
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  changedAt: string
}

/** Auditoría de reglas y períodos (sección 12): qué cambió, cuándo. No se borra nunca. */
export function useAuditLog(tableNames: string[]) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('audit_log')
        .select('*')
        .in('table_name', tableNames)
        .order('changed_at', { ascending: false })
        .limit(100)

      if (cancelled) return
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setEntries(
          (data ?? []).map((row) => ({
            id: row.id,
            tableName: row.table_name,
            recordId: row.record_id,
            action: row.action,
            oldData: row.old_data,
            newData: row.new_data,
            changedAt: row.changed_at,
          })),
        )
        setError(null)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNames.join(',')])

  return { entries, loading, error }
}

/** Compara old_data vs new_data y devuelve solo las claves que cambiaron. */
export function diffAuditEntry(entry: AuditEntry): { field: string; before: unknown; after: unknown }[] {
  if (!entry.oldData || !entry.newData) return []
  const keys = new Set([...Object.keys(entry.oldData), ...Object.keys(entry.newData)])
  const diffs: { field: string; before: unknown; after: unknown }[] = []
  for (const key of keys) {
    if (key === 'updated_at' || key === 'created_at') continue
    const before = entry.oldData[key]
    const after = entry.newData[key]
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diffs.push({ field: key, before, after })
    }
  }
  return diffs
}
