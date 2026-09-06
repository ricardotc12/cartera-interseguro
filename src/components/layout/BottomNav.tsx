import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { navItems } from '@/routes/navItems'
import { clsx } from '@/lib/clsx'
import { MoreDrawer } from './MoreDrawer'

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const primaryItems = navItems.filter((item) => item.primaryMobile)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                isActive ? 'text-secondary-600' : 'text-slate-500 active:text-slate-700',
              )
            }
          >
            <item.icon className="h-6 w-6" />
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-slate-500"
        >
          <Menu className="h-6 w-6" />
          Más
        </button>
      </nav>

      <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
