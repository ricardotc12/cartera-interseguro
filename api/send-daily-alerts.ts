// Función serverless (Vercel Cron) que revisa, para cada asesora, pagos vencidos/por
// vencer, contactos a los que toca volver a escribir y cotizaciones por vencer, y le
// manda un correo-resumen por Resend. El cron en sí corre todos los días (ver "crons" en
// vercel.json) para poder revisar el estado al día, pero NO manda un correo diario: solo
// envía cuando algo cae justo en uno de los "momentos" de abajo, así que una asesora sin
// nada pendiente ese día simplemente no recibe nada. No depende de que la app esté abierta
// en ningún navegador.
//
// No importa nada de src/ a propósito: varios archivos de src/domain usan el alias "@/"
// que Vite resuelve para el frontend, pero el bundler de Vercel para funciones de /api no
// lo resuelve igual — para no arriesgar que eso se rompa en producción (no pasa por el
// mismo build/test que el resto del código de esta sesión), la lógica de fechas que
// necesita se copia aquí mismo, autocontenida.
//
// Variables de entorno que necesita (Vercel → Settings → Environment Variables):
//   VITE_SUPABASE_URL           (la misma que ya usa la app)
//   SUPABASE_SERVICE_ROLE_KEY   (Supabase → Settings → API → "service_role" — NUNCA exponerla en el cliente)
//   RESEND_API_KEY              (Resend → API Keys)
//   CRON_SECRET                 (cualquier texto largo al azar — Vercel lo manda solo en las llamadas de cron)

import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'edge' }

const RESEND_FROM = 'Cartera Interseguro <onboarding@resend.dev>'

/**
 * Momentos exactos (días respecto a la fecha límite) en los que se manda el correo de
 * cobranza — no "mientras siga sin pagar", sino puntual: un día antes, el mismo día que
 * vence, y 7 días después (ya cerrada la cobranza del mes, para que se ponga al día).
 */
const PAYMENT_ALERT_DAYS_BEFORE_DUE = [1, 0, -7]

/** Igual de puntual: un solo correo, 2 días antes de que venza la cotización. */
const QUOTE_EXPIRY_ALERT_DAYS_BEFORE = 2

/** Igual de puntual: un día antes y el mismo día acordado para recontactar. */
const CONTACT_ALERT_DAYS_BEFORE = [1, 0]

/** Días que faltan para dateStr (positivo = todavía falta, 0 = hoy, negativo = ya pasó). */
function daysUntil(dateStr: string, referenceDate: string): number {
  return Math.floor((new Date(dateStr).getTime() - new Date(referenceDate).getTime()) / 86_400_000)
}

/** Copia de src/domain/payments.ts:defaultDueDateForMonth. */
function defaultDueDateForMonth(yearMonth: string): string {
  return `${yearMonth.slice(0, 7)}-20`
}

/** Copia de src/domain/payments.ts:effectiveDueDate. */
function effectiveDueDate(yearMonth: string, dueDate: string | null): string {
  return dueDate ?? defaultDueDateForMonth(yearMonth)
}

// El cron está programado para correr en la mañana, hora Perú (ver vercel.json) — en esa
// ventana la fecha UTC del servidor siempre coincide con la fecha calendario en Perú
// (Perú nunca "adelanta" el día respecto a UTC), así que acá sí es seguro usar la fecha
// UTC directamente. Esto es distinto del cliente (src/lib/date.ts), que corre a
// cualquier hora del día y por eso arma la fecha con componentes locales.
function todayPeru(): string {
  return new Date().toISOString().slice(0, 10)
}

interface PaymentRow {
  year_month: string
  due_date: string | null
  expected_amount: number
  status: string
  created_by: string
  policies: { policy_number: string; affiliates: { first_name: string; last_name: string } | null } | null
}

interface ContactRow {
  full_name: string
  next_contact_date: string | null
  quote_expiry_date: string | null
  created_by: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(amount)
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${isoDate}T00:00:00Z`))
}

async function sendEmail(resendApiKey: string, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend respondió ${res.status}: ${body}`)
  }
}

export default async function handler(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response('No autorizado', { status: 401 })
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendApiKey = process.env.RESEND_API_KEY
  const appUrl = process.env.APP_URL ?? 'https://cartera-interseguro.vercel.app'

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return new Response('Faltan variables de entorno (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY)', { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const today = todayPeru()

  const [paymentsResult, contactsResult, usersResult] = await Promise.all([
    supabase
      .from('payments')
      .select('year_month, due_date, expected_amount, status, created_by, policies(policy_number, affiliates(first_name, last_name))'),
    supabase
      .from('contacts')
      .select('full_name, next_contact_date, quote_expiry_date, created_by')
      .or('next_contact_date.not.is.null,quote_expiry_date.not.is.null'),
    supabase.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (paymentsResult.error) return new Response(`Error leyendo pagos: ${paymentsResult.error.message}`, { status: 500 })
  if (contactsResult.error) return new Response(`Error leyendo contactos: ${contactsResult.error.message}`, { status: 500 })
  if (usersResult.error) return new Response(`Error leyendo usuarios: ${usersResult.error.message}`, { status: 500 })

  const payments = (paymentsResult.data ?? []) as unknown as PaymentRow[]
  const contacts = (contactsResult.data ?? []) as ContactRow[]
  const userEmailById = new Map(
    usersResult.data.users.filter((u) => !!u.email).map((u) => [u.id, u.email as string]),
  )

  const userIds = new Set([...payments.map((p) => p.created_by), ...contacts.map((c) => c.created_by)])

  let sent = 0
  const errors: string[] = []

  for (const userId of userIds) {
    const email = userEmailById.get(userId)
    if (!email) continue

    const userPayments = payments.filter((p) => p.created_by === userId)
    const duePayments = userPayments.filter((p) => {
      if (p.status !== 'no_pagado' && p.status !== 'pendiente_confirmar') return false
      const dueDate = effectiveDueDate(p.year_month, p.due_date)
      return PAYMENT_ALERT_DAYS_BEFORE_DUE.includes(daysUntil(dueDate, today))
    })

    const userContacts = contacts.filter((c) => c.created_by === userId && c.next_contact_date)
    const dueContacts = userContacts.filter((c) => CONTACT_ALERT_DAYS_BEFORE.includes(daysUntil(c.next_contact_date as string, today)))

    const userQuotes = contacts.filter((c) => c.created_by === userId && c.quote_expiry_date)
    const dueQuotes = userQuotes.filter((c) => daysUntil(c.quote_expiry_date as string, today) === QUOTE_EXPIRY_ALERT_DAYS_BEFORE)

    if (duePayments.length === 0 && dueContacts.length === 0 && dueQuotes.length === 0) continue

    const paymentRows = duePayments
      .map((p) => {
        const dueDate = effectiveDueDate(p.year_month, p.due_date)
        const days = daysUntil(dueDate, today)
        const text = days === 1 ? 'vence mañana' : days === 0 ? 'vence hoy' : `sin pagar desde hace ${Math.abs(days)} días (cobranza cerrada)`
        const name = p.policies?.affiliates ? `${p.policies.affiliates.first_name} ${p.policies.affiliates.last_name}` : 'Afiliado'
        return `<li>${name} — ${formatCurrency(p.expected_amount)} — ${text} (${formatDate(dueDate)})</li>`
      })
      .join('')

    const contactRows = dueContacts
      .map((c) => {
        const days = daysUntil(c.next_contact_date as string, today)
        const text = days === 1 ? 'mañana' : 'hoy'
        return `<li>${c.full_name} — contactar ${text} (${formatDate(c.next_contact_date as string)})</li>`
      })
      .join('')

    const quoteRows = dueQuotes
      .map((c) => `<li>${c.full_name} — vence en ${QUOTE_EXPIRY_ALERT_DAYS_BEFORE} días (${formatDate(c.quote_expiry_date as string)})</li>`)
      .join('')

    const html = `
      <h2>Resumen de Cartera Interseguro</h2>
      ${duePayments.length > 0 ? `<h3>Cobranza (${duePayments.length})</h3><ul>${paymentRows}</ul>` : ''}
      ${dueContacts.length > 0 ? `<h3>Contactos para hoy/mañana (${dueContacts.length})</h3><ul>${contactRows}</ul>` : ''}
      ${dueQuotes.length > 0 ? `<h3>Cotizaciones por vencer (${dueQuotes.length})</h3><ul>${quoteRows}</ul>` : ''}
      <p><a href="${appUrl}">Ingresar al portal</a></p>
    `

    try {
      await sendEmail(resendApiKey, email, 'Tienes pendientes en Cartera Interseguro', html)
      sent += 1
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return new Response(JSON.stringify({ usersChecked: userIds.size, emailsSent: sent, errors }), {
    status: errors.length > 0 ? 207 : 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
