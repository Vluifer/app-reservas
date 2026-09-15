import { ErrorDeValidacion } from './errores'

const MS_POR_DIA = 24 * 60 * 60 * 1000

/** Zona horaria en la que opera el negocio: define qué día es "hoy". */
export const ZONA_HORARIA_NEGOCIO = 'America/Bogota'

/**
 * Periodo de estadía [inicio, fin): se cuentan las noches entre llegada y salida.
 * Las fechas no tienen hora (medianoche UTC), igual que las columnas DATE de la base de datos.
 */
export class RangoFechas {
  private constructor(
    readonly inicio: Date,
    readonly fin: Date,
  ) {}

  static crear(inicio: Date | string, fin: Date | string): RangoFechas {
    const fechaInicio = aFechaSinHora(inicio)
    const fechaFin = aFechaSinHora(fin)
    if (fechaFin <= fechaInicio) {
      throw new ErrorDeValidacion('La fecha de salida debe ser posterior a la de llegada')
    }
    return new RangoFechas(fechaInicio, fechaFin)
  }

  get noches(): number {
    return Math.round((this.fin.getTime() - this.inicio.getTime()) / MS_POR_DIA)
  }

  seSolapaCon(otro: RangoFechas): boolean {
    return this.inicio < otro.fin && otro.inicio < this.fin
  }
}

/** Convierte "YYYY-MM-DD" o un Date a medianoche UTC de ese día. */
export function aFechaSinHora(valor: Date | string): Date {
  if (typeof valor === 'string') {
    const fecha = new Date(`${valor}T00:00:00.000Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(fecha.getTime()) || aTextoISO(fecha) !== valor) {
      throw new ErrorDeValidacion(`Fecha inválida: ${valor}`)
    }
    return fecha
  }
  if (Number.isNaN(valor.getTime())) throw new ErrorDeValidacion('Fecha inválida')
  return new Date(Date.UTC(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate()))
}

/** Fecha de hoy (sin hora) según la zona horaria del negocio. */
export function hoy(ahora: Date, zonaHoraria = ZONA_HORARIA_NEGOCIO): Date {
  const texto = new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
  return aFechaSinHora(texto)
}

export function aTextoISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}
