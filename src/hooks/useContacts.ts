import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Contact } from '@/types/domain'

interface ContactRow {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  dni: string | null
  status: string
  contact_date: string
  next_contact_date: string | null
  notes: string | null
}

export interface ContactInput {
  fullName: string
  phone: string | null
  email: string | null
  dni: string | null
  status: string
  contactDate: string
  nextContactDate: string | null
  notes: string | null
}

function mapContact(row: ContactRow): Contact {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    dni: row.dni,
    status: row.status,
    contactDate: row.contact_date,
    nextContactDate: row.next_contact_date,
    notes: row.notes,
  }
}

/** CRUD del registro de seguimiento de contactos (prospección), aparte de la cartera de afiliados. */
export function useContacts() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: fetchError } = await supabase.from('contacts').select('*').order('contact_date', { ascending: false })
    if (fetchError) {
      setError(fetchError.message)
    } else {
      setContacts((data ?? []).map(mapContact))
      setError(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createContact(input: ContactInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: insertError } = await supabase.from('contacts').insert({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      dni: input.dni,
      status: input.status,
      contact_date: input.contactDate,
      next_contact_date: input.nextContactDate,
      notes: input.notes,
      created_by: user.id,
    })
    if (insertError) return { error: insertError.message }
    await refresh()
    return { error: null }
  }

  async function updateContact(id: string, input: ContactInput) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        full_name: input.fullName,
        phone: input.phone,
        email: input.email,
        dni: input.dni,
        status: input.status,
        contact_date: input.contactDate,
        next_contact_date: input.nextContactDate,
        notes: input.notes,
        updated_by: user.id,
      })
      .eq('id', id)
    if (updateError) return { error: updateError.message }
    await refresh()
    return { error: null }
  }

  async function deleteContact(id: string) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error: deleteError } = await supabase.from('contacts').delete().eq('id', id)
    if (deleteError) return { error: deleteError.message }
    await refresh()
    return { error: null }
  }

  return { contacts, loading, error, createContact, updateContact, deleteContact }
}
