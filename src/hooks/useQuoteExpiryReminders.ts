import { useContacts } from '@/hooks/useContacts'
import { today } from '@/lib/date'
import type { Contact } from '@/types/domain'

/** Avisa desde 2 días antes de que venza la cotización, para dar tiempo a renovarla. */
export const QUOTE_EXPIRY_WINDOW_DAYS = 2

export interface QuoteExpiryReminder {
  contact: Contact
  /** Días hasta el vencimiento: negativo = ya venció, 0 = hoy, positivo = faltan días. */
  daysUntil: number
}

function daysUntil(dateStr: string, referenceDate: string): number {
  return Math.round((new Date(dateStr).getTime() - new Date(referenceDate).getTime()) / 86_400_000)
}

/** Cotizaciones enviadas con fecha de vencimiento vencida o próxima (2 días antes), para el aviso del Dashboard. */
export function useQuoteExpiryReminders() {
  const { contacts, loading } = useContacts()

  const withReminder: QuoteExpiryReminder[] = contacts
    .filter((c) => c.quoteExpiryDate != null)
    .map((c) => ({ contact: c, daysUntil: daysUntil(c.quoteExpiryDate as string, today()) }))

  const overdue = withReminder.filter((r) => r.daysUntil < 0).sort((a, b) => a.daysUntil - b.daysUntil)
  const upcoming = withReminder
    .filter((r) => r.daysUntil >= 0 && r.daysUntil <= QUOTE_EXPIRY_WINDOW_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  return { overdue, upcoming, total: overdue.length + upcoming.length, loading }
}
