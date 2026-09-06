import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const AffiliatesPage = lazy(() => import('@/features/affiliates/AffiliatesPage').then((m) => ({ default: m.AffiliatesPage })))
const CollectionPage = lazy(() => import('@/features/collection/CollectionPage').then((m) => ({ default: m.CollectionPage })))
const GoalsPage = lazy(() => import('@/features/goals/GoalsPage').then((m) => ({ default: m.GoalsPage })))
const IncentivesPage = lazy(() => import('@/features/incentives/IncentivesPage').then((m) => ({ default: m.IncentivesPage })))
const CollectionFactorPage = lazy(() =>
  import('@/features/incentives/CollectionFactorPage').then((m) => ({ default: m.CollectionFactorPage })),
)
const IcvPage = lazy(() => import('@/features/icv/IcvPage').then((m) => ({ default: m.IcvPage })))
const SimulatorPage = lazy(() => import('@/features/simulator/SimulatorPage').then((m) => ({ default: m.SimulatorPage })))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const PeriodsSettingsPage = lazy(() =>
  import('@/features/settings/periods/PeriodsSettingsPage').then((m) => ({ default: m.PeriodsSettingsPage })),
)

function PageFallback() {
  return <p className="text-sm text-slate-500">Cargando…</p>
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/afiliados" element={<ProtectedRoute><AffiliatesPage /></ProtectedRoute>} />
          <Route path="/cobranza" element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
          <Route path="/metas" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
          <Route path="/incentivos" element={<ProtectedRoute><IncentivesPage /></ProtectedRoute>} />
          <Route path="/factor-cobranza" element={<ProtectedRoute><CollectionFactorPage /></ProtectedRoute>} />
          <Route path="/icv" element={<ProtectedRoute><IcvPage /></ProtectedRoute>} />
          <Route path="/simulador" element={<ProtectedRoute><SimulatorPage /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/configuracion/periodos" element={<ProtectedRoute><PeriodsSettingsPage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
