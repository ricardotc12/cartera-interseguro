import { useContacts } from '@/hooks/useContacts'
import { today } from '@/lib/date'
import type { Contact } from '@/types/domain'

/** Mismo horizonte que las alertas de cobranza: recién avisa desde un día antes de la fecha acordada. */
export const REMINDER_WINDOW_DAYS = 1

export interface ContactReminder {
  contact: Contact
  /** Días hasta la fecha de recontacto: negativo = ya pasó, 0 = hoy, positivo = faltan días. */
  daysUntil: number
}

function daysUntil(dateStr: string, referenceDate: string): number {
  return Math.round((new Date(dateStr).getTime() - new Date(referenceDate).getTime()) / 86_400_000)
}

/** Contactos con una fecha de "volver a contactar" vencida o próxima (un día antes), para el modal de recordatorio del Dashboard. */
export function useContactReminders() {
  const { contacts, loading } = useContacts()

  const withReminder: ContactReminder[] = contacts
    .filter((c) => c.nextContactDate != null)
    .map((c) => ({ contact: c, daysUntil: daysUntil(c.nextContactDate as string, today()) }))

  const overdue = withReminder.filter((r) => r.daysUntil < 0).sort((a, b) => a.daysUntil - b.daysUntil)
  const upcoming = withReminder.filter((r) => r.daysUntil >= 0 && r.daysUntil <= REMINDER_WINDOW_DAYS).sort((a, b) => a.daysUntil - b.daysUntil)

  return { overdue, upcoming, total: overdue.length + upcoming.length, loading }
}
