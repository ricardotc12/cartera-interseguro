import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface Profile {
  id: string
  fullName: string | null
  showCollectionRatio: boolean
  showIcv: boolean
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, show_collection_ratio, show_icv')
      .eq('id', user.id)
      .maybeSingle()
    setProfile(
      data
        ? { id: data.id, fullName: data.full_name, showCollectionRatio: data.show_collection_ratio, showIcv: data.show_icv }
        : { id: user.id, fullName: null, showCollectionRatio: false, showIcv: false },
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function setFullName(fullName: string) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() || null }).eq('id', user.id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function setShowCollectionRatio(value: boolean) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error } = await supabase.from('profiles').update({ show_collection_ratio: value }).eq('id', user.id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  async function setShowIcv(value: boolean) {
    if (!user) return { error: 'Debes iniciar sesión.' }
    const { error } = await supabase.from('profiles').update({ show_icv: value }).eq('id', user.id)
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }

  return { profile, loading, setFullName, setShowCollectionRatio, setShowIcv }
}
