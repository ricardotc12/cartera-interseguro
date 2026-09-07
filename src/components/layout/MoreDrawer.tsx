import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut, KeyRound } from 'lucide-react'
import { createPortal } from 'react-dom'
import { navItems } from '@/routes/navItems'
import { useAuth } from '@/hooks/useAuth'
import { clsx } from '@/lib/clsx'
import { ChangePasswordModal } from './ChangePasswordModal'

export function MoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signOut, user } = useAuth()
  const secondaryItems = navItems.filter((item) => !item.primaryMobile)
  const [changingPassword, setChangingPassword] = useState(false)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:hidden">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 pb-8 shadow-xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="mb-1 space-y-1">
          {secondaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="mb-2 truncate px-3 text-xs text-slate-400">{user?.email}</div>
          <button
            onClick={() => setChangingPassword(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <KeyRound className="h-5 w-5" />
            Cambiar contraseña
          </button>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </div>

      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
    </div>,
    document.body,
  )
}
