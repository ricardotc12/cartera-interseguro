import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {/* pb incluye el alto real del BottomNav (que ahora crece con el área segura inferior en iPhones), para que el contenido nunca quede tapado detrás. */}
        <main className="flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-6">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
