/**
 * Logo oficial de Interseguro. En desktop se muestra el lockup completo
 * (proporción y colores originales, sin deformar); en espacios reducidos se
 * usa solo el símbolo cuadrado, recortado del mismo archivo fuente sin
 * alterar su identidad (sección 2 del rediseño).
 */
export function BrandLogo({ variant = 'full', className = '' }: { variant?: 'full' | 'compact'; className?: string }) {
  if (variant === 'compact') {
    return (
      <img
        src="/icons/icon-192.png"
        alt="Interseguro"
        className={`h-8 w-8 rounded-md ${className}`}
        width={32}
        height={32}
      />
    )
  }

  return (
    <img
      src="/brand/logo-full.webp"
      alt="Interseguro"
      className={`h-9 w-auto rounded-md ${className}`}
      style={{ aspectRatio: '1000 / 336' }}
    />
  )
}
