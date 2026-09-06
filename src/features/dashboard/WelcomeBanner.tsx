import { useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { fieldClass } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'

const monthFormatter = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' })

function currentMonthLabel(): string {
  const text = monthFormatter.format(new Date())
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function WelcomeBanner() {
  const { profile, loading, setFullName } = useProfile()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading || !profile) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    await setFullName(name.trim())
    setSubmitting(false)
    setEditing(false)
  }

  if (!profile.fullName && !editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hola 👋</h1>
          <p className="text-sm text-slate-500">Aquí están tus avances de {currentMonthLabel()}.</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" />
          Agregar mi nombre
        </button>
      </div>
    )
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className={`${fieldClass()} max-w-[220px]`}
        />
        <Button type="submit" size="sm" disabled={submitting}>
          Guardar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </form>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Hola, {profile.fullName} 👋</h1>
      <p className="text-sm text-slate-500">Aquí están tus avances de {currentMonthLabel()}.</p>
    </div>
  )
}
