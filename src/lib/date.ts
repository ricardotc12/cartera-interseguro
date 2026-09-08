/**
 * Fecha de hoy en formato ISO ('YYYY-MM-DD'), en la zona horaria LOCAL del
 * dispositivo. `new Date().toISOString()` convierte a UTC antes de recortar
 * la fecha — en Perú (UTC-5) eso hace que, entre las 7pm y la medianoche,
 * la app ya "vea" el día siguiente 5 horas antes de que empiece
 * localmente, adelantando por error pagos de "Al día"/"Pendiente" a
 * "Pendiente"/"No pagado". Por eso se arma la fecha a mano con los
 * componentes locales (año/mes/día), nunca con toISOString().
 */
export function today(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
