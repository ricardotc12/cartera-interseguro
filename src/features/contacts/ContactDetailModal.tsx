import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/format'
import type { Contact } from '@/types/domain'

interface ContactDetailModalProps {
  open: boolean
  onClose: () => void
  contact: Contact
}

export function ContactDetailModal({ open, onClose, contact }: ContactDetailModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={contact.fullName}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">DNI</p>
            <p className="font-medium text-slate-700">{contact.dni ?? '—'}</p>
          </div>
          <div>
            <p className="text-slate-400">Estado</p>
            <Badge tone="neutral" dot>
              {contact.status}
            </Badge>
          </div>
          <div className="min-w-0">
            <p className="text-slate-400">Celular</p>
            <p className="break-words font-medium text-slate-700">{contact.phone ?? '—'}</p>
          </div>
          <div className="min-w-0">
            <p className="text-slate-400">Correo</p>
            <p className="break-words font-medium text-slate-700">{contact.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-slate-400">Fecha de contacto</p>
            <p className="font-medium text-slate-700">{formatDate(contact.contactDate)}</p>
          </div>
          {contact.nextContactDate && (
            <div>
              <p className="text-slate-400">Volver a contactar</p>
              <p className="font-medium text-amber-600">{formatDate(contact.nextContactDate)}</p>
            </div>
          )}
          {contact.quoteExpiryDate && (
            <div>
              <p className="text-slate-400">La cotización vence</p>
              <p className="font-medium text-amber-600">{formatDate(contact.quoteExpiryDate)}</p>
            </div>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Observaciones</p>
          {contact.notes ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{contact.notes}</p>
          ) : (
            <p className="text-sm text-slate-400">Sin observaciones registradas.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
