import { useLocation } from 'react-router-dom'
import { navItems } from '@/routes/navItems'
import { BrandLogo } from './BrandLogo'
import { NotificationsBell } from './NotificationsBell'

function currentTitle(pathname: string): string {
  const match = navItems.find((item) => (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)))
  return match?.label ?? 'Cartera Interseguro'
}

export function TopBar() {
  const location = useLocation()

  return (
    // El padding-top absorbe el área segura (notch / barra de estado): el navy se extiende
    // debajo de ella en vez de que el contenido (título, campana) quede tapado o comprimido.
    <header className="sticky top-0 z-30 bg-primary-700" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex h-14 items-center gap-3 px-4 md:h-16 md:px-6">
        <BrandLogo variant="compact" className="h-7 w-7 md:hidden" />
        <h1 className="flex-1 text-base font-semibold text-white md:text-lg">{currentTitle(location.pathname)}</h1>
        <NotificationsBell />
      </div>
    </header>
  )
}
