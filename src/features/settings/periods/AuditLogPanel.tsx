import { useAuditLog, diffAuditEntry } from '@/hooks/useAuditLog'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const TABLE_LABELS: Record<string, string> = {
  incentive_periods: 'Período',
  incentive_rules: 'Regla de incentivo',
  collection_factor_rules: 'Regla de Factor Cobranza',
  icv_factor_rules: 'Regla de Factor ICV',
}

const ACTION_LABELS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  insert: { label: 'Creado', tone: 'success' },
  update: { label: 'Modificado', tone: 'warning' },
  delete: { label: 'Eliminado', tone: 'danger' },
}

export function AuditLogPanel() {
  const { entries, loading, error } = useAuditLog(['incentive_periods', 'incentive_rules', 'collection_factor_rules', 'icv_factor_rules'])

  if (loading) return <p className="text-sm text-slate-500">Cargando historial…</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (entries.length === 0) return <p className="text-sm text-slate-400">Aún no hay cambios registrados.</p>

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const diffs = diffAuditEntry(entry)
        const action = ACTION_LABELS[entry.action] ?? { label: entry.action, tone: 'warning' as const }
        return (
          <Card key={entry.id}>
            <CardBody className="py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={action.tone} dot>{action.label}</Badge>
                  <span className="text-sm font-medium text-slate-700">{TABLE_LABELS[entry.tableName] ?? entry.tableName}</span>
                </div>
                <span className="text-xs text-slate-400">{new Date(entry.changedAt).toLocaleString('es-PE')}</span>
              </div>
              {diffs.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-slate-500">
                  {diffs.map((d) => (
                    <li key={d.field}>
                      <span className="font-medium text-slate-600">{d.field}</span>: {String(d.before ?? '—')} → {String(d.after ?? '—')}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
