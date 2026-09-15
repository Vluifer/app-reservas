export const ESTADOS_RESERVA = [
  'PENDIENTE', // Esperando que el propietario la confirme
  'CONFIRMADA',
  'EN_CURSO', // El huésped ya llegó
  'COMPLETADA',
  'CANCELADA',
  'RECHAZADA', // El propietario no la aceptó
  'EXPIRADA', // Nadie la confirmó a tiempo
] as const
export type EstadoReserva = (typeof ESTADOS_RESERVA)[number]

/** Estados en los que la reserva bloquea las fechas (PENDIENTE solo mientras no venza). */
export const ESTADOS_QUE_OCUPAN: readonly EstadoReserva[] = ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO']

export const ETIQUETA_ESTADO: Record<EstadoReserva, string> = {
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
  EN_CURSO: 'en curso',
  COMPLETADA: 'completada',
  CANCELADA: 'cancelada',
  RECHAZADA: 'rechazada',
  EXPIRADA: 'expirada',
}

/** Ciclo de vida permitido. Cualquier otro cambio de estado es un error. */
const TRANSICIONES: Record<EstadoReserva, readonly EstadoReserva[]> = {
  PENDIENTE: ['CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'EXPIRADA'],
  CONFIRMADA: ['EN_CURSO', 'CANCELADA'],
  EN_CURSO: ['COMPLETADA'],
  COMPLETADA: [],
  CANCELADA: [],
  RECHAZADA: [],
  EXPIRADA: [],
}

export function puedeTransicionar(desde: EstadoReserva, hacia: EstadoReserva): boolean {
  return TRANSICIONES[desde].includes(hacia)
}
