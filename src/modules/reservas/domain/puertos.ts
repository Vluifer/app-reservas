import type { RangoFechas } from '@/shared/domain/RangoFechas'
import type { ApartamentoReservable, Reserva } from './Reserva'

/** Puertos: lo que el módulo necesita del exterior. Las implementaciones viven en infrastructure/. */

export interface ReservaRepository {
  buscarPorId(id: string): Promise<Reserva | null>
  /**
   * Guarda una reserva NUEVA solo si nadie ocupa esas fechas.
   * Debe ser atómico: dos solicitudes simultáneas para las mismas fechas no pueden entrar ambas.
   * Lanza FechasNoDisponiblesError.
   */
  crearSiHayDisponibilidad(reserva: Reserva): Promise<void>
  /**
   * Actualiza una reserva que se leyó de este repositorio. Lanza ConflictoDeConcurrenciaError
   * si otra petición la guardó entretanto (bloqueo optimista).
   */
  guardar(reserva: Reserva): Promise<void>
  hayConflicto(apartamentoId: string, rango: RangoFechas, ahora: Date): Promise<boolean>
  listarPorCliente(clienteId: string): Promise<Reserva[]>
  listarPorPropietario(propietarioId: string): Promise<Reserva[]>
  /**
   * Reservas de los apartamentos del propietario cuya estadía toca [desde, hasta], ambos incluidos:
   * llegada <= hasta y salida >= desde (el día de salida cuenta). Ordenadas por llegada.
   */
  listarPorPropietarioEnRango(propietarioId: string, desde: Date, hasta: Date): Promise<Reserva[]>
  listarPendientesVencidas(ahora: Date): Promise<Reserva[]>
  /** CONFIRMADAS cuyo día de llegada ya llegó y EN_CURSO cuyo día de salida ya llegó. */
  listarEstadiasPorAvanzar(ahora: Date): Promise<Reserva[]>
  /** Rangos ocupados de un apartamento desde hoy en adelante. */
  fechasOcupadas(apartamentoId: string, ahora: Date): Promise<RangoFechas[]>
  apartamentosOcupados(rango: RangoFechas, ahora: Date): Promise<string[]>
}

/** Acceso al catálogo de apartamentos, traducido a lo que reservas necesita. */
export interface CatalogoApartamentos {
  obtenerReservable(apartamentoId: string): Promise<ApartamentoReservable | null>
}
