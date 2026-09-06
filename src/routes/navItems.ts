import {
  LayoutDashboard,
  Users,
  Wallet,
  Target,
  TrendingUp,
  Percent,
  Gauge,
  Calculator,
  FileBarChart,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Aparece directamente en la barra inferior móvil (máximo 4, sección 39: acciones frecuentes accesibles rápidamente). */
  primaryMobile?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, primaryMobile: true },
  { to: '/afiliados', label: 'Afiliados', icon: Users, primaryMobile: true },
  { to: '/cobranza', label: 'Cobranza', icon: Wallet, primaryMobile: true },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/incentivos', label: 'Ingresos / Incentivos', icon: TrendingUp },
  { to: '/factor-cobranza', label: 'Factor Cobranza', icon: Percent },
  { to: '/icv', label: 'ICV', icon: Gauge },
  { to: '/simulador', label: 'Simulador', icon: Calculator },
  { to: '/reportes', label: 'Reportes', icon: FileBarChart },
  { to: '/configuracion/periodos', label: 'Configuración', icon: Settings },
]
