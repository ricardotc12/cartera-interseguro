import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut, KeyRound } from 'lucide-react'
import { navItems } from '@/routes/navItems'
import { useAuth } from '@/hooks/useAuth'
import { clsx } from '@/lib/clsx'
import { BrandLogo } from './BrandLogo'
import { ChangePasswordModal } from './ChangePasswordModal'

export function Sidebar() {
  const { signOut, user } = useAuth()
  const [changingPassword, setChangingPassword] = useState(false)

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center bg-primary-700 px-5">
        <BrandLogo variant="full" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 before:absolute before:left-0 before:h-6 before:w-1 before:rounded-r-full before:bg-secondary-500'
                  : 'text-slate-600 hover:bg-slate-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={clsx('h-5 w-5', isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 truncate px-3 text-xs text-slate-400">{user?.email}</div>
        <button
          onClick={() => setChangingPassword(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <KeyRound className="h-5 w-5" />
          Cambiar contraseña
        </button>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>

      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
    </aside>
  )
}
