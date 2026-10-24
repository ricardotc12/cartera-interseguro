import { type ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from '@/lib/clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /**
   * 'sheet' (por defecto): hoja que sube desde abajo en móvil, pensada para formularios
   * largos. 'alert': alerta corta — siempre centrada y angosta, también en móvil (sección
   * "alertas de cobranza"/"período por terminar"), para que no ocupe todo el ancho de la
   * pantalla como una hoja.
   */
  size?: 'sheet' | 'alert'
}

export function Modal({ open, onClose, title, children, size = 'sheet' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Con el fondo todavía desplazable detrás del modal, arrastrar sobre la parte oscurecida
  // seguía moviendo la pantalla (la lista de atrás se ve correr debajo). Mientras el modal
  // esté abierto, el fondo queda fijo — solo se mueve el contenido del propio modal.
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  const isAlert = size === 'alert'

  return createPortal(
    <div
      className={clsx(
        'fixed inset-0 z-50 flex justify-center bg-slate-900/40 backdrop-blur-sm',
        isAlert ? 'items-center p-4' : 'items-end sm:items-center',
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx(
          'max-h-[90vh] w-full overscroll-contain overflow-y-auto bg-white shadow-xl',
          isAlert
            ? 'max-w-sm rounded-2xl p-4'
            : 'rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-2xl sm:p-6',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            title="Cerrar" aria-label="Cerrar"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
