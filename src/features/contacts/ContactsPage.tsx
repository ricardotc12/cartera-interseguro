import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Download, Phone, MessageCircle, Mail, Eye } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { fieldClass } from '@/components/ui/FormField'
import { TableRowsSkeleton } from '@/components/ui/Skeleton'
import { downloadCsv } from '@/lib/csv'
import { formatDate } from '@/lib/format'
import { today } from '@/lib/date'
import type { Contact } from '@/types/domain'
import { ContactFormModal } from './ContactFormModal'
import { ContactDetailModal } from './ContactDetailModal'

function matchesSearch(contact: Contact, query: string): boolean {
  if (!query) return true
  const haystack = `${contact.fullName} ${contact.dni ?? ''} ${contact.phone ?? ''}`.toLowerCase()
  return haystack.includes(query.toLowerCase())
}

/** Enlace de Gmail (no mailto:) para que siempre abra Gmail a redactar, en vez del cliente de correo que tenga el teléfono/navegador por defecto. */
function gmailComposeUrl(email: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`
}

function ContactActions({ contact }: { contact: Contact }) {
  return (
    <>
      {contact.phone && (
        <>
          <a
            href={`tel:${contact.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="rounded p-1.5 text-blue-500 hover:bg-blue-50"
            title="Llamar" aria-label="Llamar"
          >
            <Phone className="h-4 w-4" />
          </a>
          <a
            href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50"
            title="WhatsApp" aria-label="WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </>
      )}
      {contact.email && (
        <a
          href={gmailComposeUrl(contact.email)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="rounded p-1.5 text-red-500 hover:bg-red-50"
          title="Enviar correo (Gmail)" aria-label="Enviar correo (Gmail)"
        >
          <Mail className="h-4 w-4" />
        </a>
      )}
    </>
  )
}

export function ContactsPage() {
  const { contacts, loading, error, createContact, updateContact, deleteContact } = useContacts()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState<Contact | undefined>(undefined)
  const [editing, setEditing] = useState<Contact | undefined>(undefined)
  const [deleting, setDeleting] = useState<Contact | undefined>(undefined)

  const statusOptions = useMemo(() => Array.from(new Set(contacts.map((c) => c.status))).sort(), [contacts])

  const filtered = useMemo(
    () => contacts.filter((c) => matchesSearch(c, search) && (statusFilter === 'todos' || c.status === statusFilter)),
    [contacts, search, statusFilter],
  )

  function exportCsv() {
    downloadCsv(
      `contactos_${today()}`,
      filtered.map((c) => ({
        Nombre: c.fullName,
        DNI: c.dni ?? '',
        Celular: c.phone ?? '',
        Correo: c.email ?? '',
        Estado: c.status,
        'Fecha de contacto': c.contactDate,
        'Volver a contactar': c.nextContactDate ?? '',
        Observaciones: c.notes ?? '',
      })),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Seguimiento de contactos</h1>
          <p className="text-sm text-slate-500">Prospección: personas contactadas que todavía no son afiliadas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Nuevo contacto
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, DNI o celular…"
            className={`${fieldClass()} pl-9`}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${fieldClass()} sm:w-56`}>
          <option value="todos">Todos los estados</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="text-sm text-red-700">{error}</CardBody>
        </Card>
      )}

      {loading ? (
        <Card className="overflow-hidden">
          <TableRowsSkeleton rows={6} columns={5} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-sm text-slate-500">
            {contacts.length === 0
              ? 'Aún no has registrado ningún contacto. Agrega el primero para empezar a llevar el seguimiento.'
              : 'Ningún contacto coincide con los filtros seleccionados.'}
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Desktop: tabla */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha de contacto</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {contact.fullName}
                      {contact.phone && <div className="text-xs font-normal text-slate-400">{contact.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{contact.dni ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral" dot>
                        {contact.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(contact.contactDate)}
                      {contact.nextContactDate && (
                        <div className="text-xs font-normal text-amber-600">Recontactar: {formatDate(contact.nextContactDate)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <ContactActions contact={contact} />
                        <button
                          onClick={() => setViewing(contact)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Ver detalle" aria-label="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditing(contact)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Editar" aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(contact)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar" aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Móvil: cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((contact) => (
              <Card key={contact.id} onClick={() => setViewing(contact)} className="cursor-pointer active:bg-slate-50">
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{contact.fullName}</p>
                      {contact.dni && <p className="text-xs text-slate-500">DNI {contact.dni}</p>}
                    </div>
                    <Badge tone="neutral" dot>
                      {contact.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Contactado el {formatDate(contact.contactDate)}</p>
                  {contact.nextContactDate && (
                    <p className="text-xs font-medium text-amber-600">Recontactar: {formatDate(contact.nextContactDate)}</p>
                  )}
                  {contact.quoteExpiryDate && (
                    <p className="text-xs font-medium text-amber-600">Cotización vence: {formatDate(contact.quoteExpiryDate)}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                    <div className="flex gap-1">
                      <ContactActions contact={contact} />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditing(contact)
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar" aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleting(contact)
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar" aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      {creating && (
        <ContactFormModal open={creating} onClose={() => setCreating(false)} statusSuggestions={statusOptions} onSubmit={createContact} />
      )}

      {viewing && <ContactDetailModal open={!!viewing} contact={viewing} onClose={() => setViewing(undefined)} />}

      {editing && (
        <ContactFormModal
          open={!!editing}
          contact={editing}
          statusSuggestions={statusOptions}
          onClose={() => setEditing(undefined)}
          onSubmit={(input) => updateContact(editing.id, input)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          title="Eliminar contacto"
          description={`Se eliminará el registro de ${deleting.fullName}. Esta acción no se puede deshacer.`}
          onClose={() => setDeleting(undefined)}
          onConfirm={() => deleteContact(deleting.id)}
        />
      )}
    </div>
  )
}
