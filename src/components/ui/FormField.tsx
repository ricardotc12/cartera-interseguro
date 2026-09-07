import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string | null
  hint?: ReactNode
  children: ReactNode
}

export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

const fieldBaseClass =
  'h-11 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-1 disabled:bg-slate-50 disabled:text-slate-400'
const fieldValidClass = 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
const fieldInvalidClass = 'border-red-400 focus:border-red-500 focus:ring-red-500'

export function fieldClass(hasError?: boolean): string {
  return `${fieldBaseClass} ${hasError ? fieldInvalidClass : fieldValidClass}`
}
