import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import type { PeriodHistoryPoint } from '@/hooks/usePeriodsHistory'
import { formatCurrency, formatPoints } from '@/lib/format'

export function PeriodsHistoryCharts({ history }: { history: PeriodHistoryPoint[] }) {
  if (history.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución mensual</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-slate-400">
            Necesitas al menos 2 períodos configurados para ver la evolución. Por ahora solo hay {history.length}.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Emisión Vida vs Meta por período</CardTitle>
        </CardHeader>
        <CardBody className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={80} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="vidaEmission" name="Emisión Vida" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="vidaEmissionGoal" name="Meta" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ratio de Cobranza por período</CardTitle>
        </CardHeader>
        <CardBody className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={50} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value: number) => formatPoints(value)} />
              <Line type="monotone" dataKey="collectionRatio" name="Ratio Cobranza" stroke="#6366f1" strokeWidth={2} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  )
}
