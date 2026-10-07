import { ZONA_HORARIA_NEGOCIO } from '@/shared/domain/RangoFechas'

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

const formatoDiaLocal = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const formatoFechaHoraLocal = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA_HORARIA_NEGOCIO })

const aFecha = (fecha: string) => new Date(fecha.length === 10 ? `${fecha}T00:00:00Z` : fecha)

/** "vie, 3 oct" — para fechas destacadas de una estadía. Recibe "YYYY-MM-DD". */
export function formatoDia(fecha: string): string {
  return formatoDiaLocal.format(aFecha(fecha))
}

/** Un instante (ISO completo) en hora de Colombia: "3 oct 2026, 2:30 p. m.". */
export function formatoFechaHora(instante: string): string {
  return formatoFechaHoraLocal.format(new Date(instante))
}

/** Recibe "YYYY-MM-DD" o ISO completo. */
export function formatoFecha(fecha: string): string {
  const iso = fecha.length === 10 ? `${fecha}T00:00:00Z` : fecha
  return formatoFechaLocal.format(new Date(iso))
}
