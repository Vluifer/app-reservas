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
const formatoFechaHoraLocal = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: ZONA_HORARIA_NEGOCIO })

const aFecha = (fecha: string) => new Date(fecha.length === 10 ? `${fecha}T00:00:00Z` : fecha)

/** "vie, 3 oct" — para fechas destacadas de una estadía. Recibe "YYYY-MM-DD". */
export function formatoDia(fecha: string): string {
  return formatoDiaLocal.format(aFecha(fecha))
}

/** Un instante (ISO completo) en hora de Colombia: "mar, 13 de oct, 5:13 p. m.". */
export function formatoFechaHora(instante: string): string {
  return formatoFechaHoraLocal.format(new Date(instante))
}

/** Recibe "YYYY-MM-DD" o ISO completo. */
export function formatoFecha(fecha: string): string {
  const iso = fecha.length === 10 ? `${fecha}T00:00:00Z` : fecha
  return formatoFechaLocal.format(new Date(iso))
}

const formatoDiaLargoLocal = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const formatoDiaMesLocal = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const formatoMesLocal = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "martes, 13 de octubre". Recibe "YYYY-MM-DD". */
export function formatoDiaLargo(fecha: string): string {
  return formatoDiaLargoLocal.format(aFecha(fecha))
}

/** "13 de octubre". Recibe "YYYY-MM-DD". */
export function formatoDiaMes(fecha: string): string {
  return formatoDiaMesLocal.format(aFecha(fecha))
}

/** "octubre de 2026". Recibe "YYYY-MM". */
export function formatoMes(mes: string): string {
  return formatoMesLocal.format(aFecha(`${mes}-01`))
}
