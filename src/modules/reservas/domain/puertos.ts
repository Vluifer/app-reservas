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
  /** Actualiza el estado de una reserva existente. */
  guardar(reserva: Reserva): Promise<void>
  hayConflicto(apartamentoId: string, rango: RangoFechas, ahora: Date): Promise<boolean>
  listarPorCliente(clienteId: string): Promise<Reserva[]>
  listarPorPropietario(propietarioId: string): Promise<Reserva[]>
  listarPendientesVencidas(ahora: Date): Promise<Reserva[]>
  /** Rangos ocupados de un apartamento desde hoy en adelante. */
  fechasOcupadas(apartamentoId: string, ahora: Date): Promise<RangoFechas[]>
  apartamentosOcupados(rango: RangoFechas, ahora: Date): Promise<string[]>
}

/** Acceso al catálogo de apartamentos, traducido a lo que reservas necesita. */
export interface CatalogoApartamentos {
  obtenerReservable(apartamentoId: string): Promise<ApartamentoReservable | null>
}
