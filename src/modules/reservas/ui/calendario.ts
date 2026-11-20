import { aFechaSinHora, aTextoISO } from '@/shared/domain/RangoFechas'
import type { ReservaDTO } from '../application/ReservaDTO'

/** Lógica pura del calendario del propietario. Fechas como texto "AAAA-MM-DD"; sin E/S ni estado. */

export const RUTA_CALENDARIO = '/dashboard/calendario'

export interface DiaCalendario {
  fecha: string
  numero: number
  /** Falso en los días de los meses vecinos que completan la primera y la última semana */
  delMes: boolean
}
export type SemanaCalendario = DiaCalendario[]

export interface TramoBarra {
  reserva: ReservaDTO
  /** Columnas de inicio y de fin dentro de la semana (1 = lunes, 7 = domingo), ambas incluidas */
  inicioCol: number
  finCol: number
  /** Fila dentro de la semana (0 = la primera). Dos tramos que se cruzan nunca comparten carril */
  carril: number
  continuaAntes: boolean
  continuaDespues: boolean
}

export type ParametrosRuta = Record<string, string | string[] | undefined>

const MS_POR_DIA = 24 * 60 * 60 * 1000
/** Años 1970–2099: fuera de ahí Date.UTC confunde los años 0–99 con 1900–1999 y la cuadrícula se rompe o tarda segundos */
const PATRON_MES = /^(19[7-9]\d|20\d{2})-(0[1-9]|1[0-2])$/

function sumarDias(fecha: string, dias: number): string {
  return aTextoISO(new Date(aFechaSinHora(fecha).getTime() + dias * MS_POR_DIA))
}

function esFecha(texto: string): boolean {
  try {
    aFechaSinHora(texto)
    return true
  } catch {
    return false
  }
}

/** Un parámetro de la URL solo vale si llegó una vez (Next entrega un arreglo si se repite). */
const unico = (valor: string | string[] | undefined) => (typeof valor === 'string' ? valor : undefined)

/** Lee mes, día y reserva de la URL; lo inválido se reemplaza en silencio por valores por defecto. */
export function leerParametros(params: ParametrosRuta, hoy: string): { mes: string; dia: string; reservaId: string | null } {
  const mesPedido = unico(params.mes)
  const mes = mesPedido && PATRON_MES.test(mesPedido) ? mesPedido : hoy.slice(0, 7)
  const diaPedido = unico(params.dia)
  const diaPorDefecto = hoy.slice(0, 7) === mes ? hoy : `${mes}-01`
  const dia = diaPedido && esFecha(diaPedido) && diaPedido.slice(0, 7) === mes ? diaPedido : diaPorDefecto
  return { mes, dia, reservaId: unico(params.reserva) || null }
}

export function mesVecino(mes: string, delta: number): string {
  const [anio, numero] = mes.split('-').map(Number)
  return aTextoISO(new Date(Date.UTC(anio, numero - 1 + delta, 1))).slice(0, 7)
}

/** Semanas de lunes a domingo que cubren el mes completo. */
export function semanasDelMes(mes: string): SemanaCalendario[] {
  const [anio, numero] = mes.split('-').map(Number)
  const primero = `${mes}-01`
  const ultimo = aTextoISO(new Date(Date.UTC(anio, numero, 0)))
  const diasDesdeLunes = (aFechaSinHora(primero).getUTCDay() + 6) % 7

  const semanas: SemanaCalendario[] = []
  for (let lunes = sumarDias(primero, -diasDesdeLunes); lunes <= ultimo; lunes = sumarDias(lunes, 7)) {
    semanas.push(
      Array.from({ length: 7 }, (_, i) => {
        const fecha = sumarDias(lunes, i)
        return { fecha, numero: Number(fecha.slice(8)), delMes: fecha.slice(0, 7) === mes }
      }),
    )
  }
  return semanas
}

/** Primer y último día que pinta la cuadrícula: el rango que se pide al caso de uso. */
export function rangoDeCuadricula(semanas: SemanaCalendario[]): { desde: string; hasta: string } {
  return { desde: semanas[0][0].fecha, hasta: semanas[semanas.length - 1][6].fecha }
}

/**
 * Tramos de barra de una semana. Una reserva ocupa desde su llegada hasta su salida, ambas incluidas,
 * así que quien sale y quien llega el mismo día quedan en carriles distintos.
 */
export function barrasDeSemana(reservas: ReservaDTO[], semana: SemanaCalendario): TramoBarra[] {
  const primero = semana[0].fecha
  const ultimo = semana[6].fecha
  const columna = (fecha: string) => semana.findIndex((d) => d.fecha === fecha) + 1

  const tramos: TramoBarra[] = reservas
    .filter((r) => r.llegada <= ultimo && r.salida >= primero)
    .sort((a, b) => a.llegada.localeCompare(b.llegada) || b.salida.localeCompare(a.salida))
    .map((r) => ({
      reserva: r,
      inicioCol: columna(r.llegada < primero ? primero : r.llegada),
      finCol: columna(r.salida > ultimo ? ultimo : r.salida),
      carril: 0,
      continuaAntes: r.llegada < primero,
      continuaDespues: r.salida > ultimo,
    }))

  // Voraz: cada tramo va al primer carril cuya última columna ocupada quede antes de su inicio
  const finDeCarril: number[] = []
  for (const tramo of tramos) {
    let carril = finDeCarril.findIndex((fin) => fin < tramo.inicioCol)
    if (carril === -1) carril = finDeCarril.length
    finDeCarril[carril] = tramo.finCol
    tramo.carril = carril
  }
  return tramos
}

export function agruparDia(reservas: ReservaDTO[], dia: string) {
  return {
    llegan: reservas.filter((r) => r.llegada === dia),
    salen: reservas.filter((r) => r.salida === dia),
    alojados: reservas.filter((r) => r.llegada < dia && r.salida > dia),
  }
}

export type ColorApartamento = 1 | 2 | 3 | 4 | 5 | 6 | 'eliminado'

const COLORES: readonly ColorApartamento[] = [1, 2, 3, 4, 5, 6]

/** Color por antigüedad: el apartamento más antiguo toma el 1. Uno que ya no está en la lista (eliminado) va en gris. */
export function colorDeApartamento(apartamentoId: string, idsPorAntiguedad: string[]): ColorApartamento {
  const posicion = idsPorAntiguedad.indexOf(apartamentoId)
  return posicion === -1 ? 'eliminado' : COLORES[posicion % COLORES.length]
}

/** Clases literales para que Tailwind las genere (tokens `apto-*` en globals.css). */
export const CLASES_COLOR: Record<ColorApartamento, string> = {
  1: 'bg-apto-1 text-apto-1-texto',
  2: 'bg-apto-2 text-apto-2-texto',
  3: 'bg-apto-3 text-apto-3-texto',
  4: 'bg-apto-4 text-apto-4-texto',
  5: 'bg-apto-5 text-apto-5-texto',
  6: 'bg-apto-6 text-apto-6-texto',
  eliminado: 'bg-apto-eliminado text-apto-eliminado-texto',
}

export function hrefCalendario({ mes, dia, reserva }: { mes: string; dia?: string; reserva?: string }): string {
  const parametros = new URLSearchParams({ mes })
  if (dia) parametros.set('dia', dia)
  if (reserva) parametros.set('reserva', reserva)
  return `${RUTA_CALENDARIO}?${parametros}`
}
