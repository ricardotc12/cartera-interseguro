import { useLocation } from 'react-router-dom'
import { navItems } from '@/routes/navItems'
import { BrandLogo } from './BrandLogo'

function currentTitle(pathname: string): string {
  const match = navItems.find((item) => (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)))
  return match?.label ?? 'Cartera Interseguro'
}

export function TopBar() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-primary-700 px-4 md:h-16 md:px-6">
      <BrandLogo variant="compact" className="h-7 w-7 md:hidden" />
      <h1 className="text-base font-semibold text-white md:text-lg">{currentTitle(location.pathname)}</h1>
    </header>
  )
}
