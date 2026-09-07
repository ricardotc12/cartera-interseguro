import { useEffect, useState } from 'react'

/** Dólares por 1 Sol, referencial, usado solo si no hay caché ni internet (aprox. S/ 3.70 por USD). */
const FALLBACK_RATE = 0.27
const CACHE_KEY = 'usd_pen_rate_v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface CachedRate {
  rate: number
  fetchedAt: number
}

function readCache(): CachedRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CachedRate>
    if (typeof parsed.rate !== 'number' || typeof parsed.fetchedAt !== 'number') return null
    return { rate: parsed.rate, fetchedAt: parsed.fetchedAt }
  } catch {
    return null
  }
}

function writeCache(rate: number) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, fetchedAt: Date.now() }))
  } catch {
    // localStorage puede fallar (modo privado, cuota llena); no es crítico, solo no se cachea.
  }
}

/**
 * Tipo de cambio Sol → Dólar, referencial (no oficial). Se consulta una vez al
 * día a una API gratuita sin llave (open.er-api.com) y se cachea en el
 * dispositivo; si no hay internet o la API falla, se usa el último valor
 * cacheado o, en su defecto, un aproximado fijo.
 */
export function useUsdRate(): number {
  const [rate, setRate] = useState<number>(() => readCache()?.rate ?? FALLBACK_RATE)

  useEffect(() => {
    const cached = readCache()
    const isFresh = cached != null && Date.now() - cached.fetchedAt < CACHE_TTL_MS
    if (isFresh) return

    let cancelled = false
    fetch('https://open.er-api.com/v6/latest/PEN')
      .then((res) => res.json())
      .then((data: { rates?: { USD?: number } }) => {
        const usdRate = data.rates?.USD
        if (!cancelled && typeof usdRate === 'number' && usdRate > 0) {
          setRate(usdRate)
          writeCache(usdRate)
        }
      })
      .catch(() => {
        // Sin internet o la API no respondió: se mantiene el valor de respaldo/caché anterior.
      })

    return () => {
      cancelled = true
    }
  }, [])

  return rate
}
