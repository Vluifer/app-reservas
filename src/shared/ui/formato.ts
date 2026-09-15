export const MONEDA = 'COP'

const formatoMonedaLocal = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: MONEDA,
  maximumFractionDigits: 0,
})

const formatoFechaLocal = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' })

export function formatoMoneda(valor: number): string {
  return formatoMonedaLocal.format(valor)
}

/** Recibe "YYYY-MM-DD" o ISO completo. */
export function formatoFecha(fecha: string): string {
  const iso = fecha.length === 10 ? `${fecha}T00:00:00Z` : fecha
  return formatoFechaLocal.format(new Date(iso))
}
