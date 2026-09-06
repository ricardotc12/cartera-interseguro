type ClassValue = string | number | null | undefined | false

/** Concatenación mínima de clases, sin dependencia externa. */
export function clsx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
