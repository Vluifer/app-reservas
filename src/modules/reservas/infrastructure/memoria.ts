import { hoy, type RangoFechas } from '@/shared/domain/RangoFechas'
import { FechasNoDisponiblesError } from '../domain/errores'
import type { CatalogoApartamentos, ReservaRepository } from '../domain/puertos'
import { Reserva, type ApartamentoReservable, type ReservaProps } from '../domain/Reserva'

/** Implementaciones en memoria para pruebas unitarias (sin base de datos). */

export class EnMemoriaReservaRepository implements ReservaRepository {
  private readonly registros = new Map<string, ReservaProps>()

  private todas(): Reserva[] {
    return [...this.registros.values()]
      .map((props) => Reserva.reconstruir(props))
      .sort((a, b) => b.creadaEn.getTime() - a.creadaEn.getTime())
  }

  async buscarPorId(id: string) {
    const props = this.registros.get(id)
    return props ? Reserva.reconstruir(props) : null
  }

  async crearSiHayDisponibilidad(reserva: Reserva) {
    if (await this.hayConflicto(reserva.apartamentoId, reserva.rango, reserva.creadaEn)) {
      throw new FechasNoDisponiblesError()
    }
    this.registros.set(reserva.id, reserva.instantanea())
  }

  async guardar(reserva: Reserva) {
    this.registros.set(reserva.id, reserva.instantanea())
  }

  async hayConflicto(apartamentoId: string, rango: RangoFechas, ahora: Date) {
    return this.todas().some(
      (r) => r.apartamentoId === apartamentoId && r.ocupaFechas(ahora) && r.rango.seSolapaCon(rango),
    )
  }

  async listarPorCliente(clienteId: string) {
    return this.todas().filter((r) => r.clienteId === clienteId)
  }

  async listarPorPropietario(propietarioId: string) {
    return this.todas().filter((r) => r.propietarioId === propietarioId)
  }

  async listarPendientesVencidas(ahora: Date) {
    return this.todas().filter((r) => r.estaVencida(ahora))
  }

  async listarEstadiasPorAvanzar(ahora: Date) {
    return this.todas().filter(
      (r) =>
        (r.estado === 'CONFIRMADA' && r.estadiaEmpezada(ahora)) || (r.estado === 'EN_CURSO' && r.estadiaTerminada(ahora)),
    )
  }

  async fechasOcupadas(apartamentoId: string, ahora: Date) {
    return this.todas()
      .filter((r) => r.apartamentoId === apartamentoId && r.ocupaFechas(ahora) && r.rango.fin > hoy(ahora))
      .map((r) => r.rango)
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
  }

  async apartamentosOcupados(rango: RangoFechas, ahora: Date) {
    const ids = this.todas()
      .filter((r) => r.ocupaFechas(ahora) && r.rango.seSolapaCon(rango))
      .map((r) => r.apartamentoId)
    return [...new Set(ids)]
  }
}

export class CatalogoApartamentosFalso implements CatalogoApartamentos {
  constructor(private readonly apartamentos: ApartamentoReservable[] = []) {}

  async obtenerReservable(apartamentoId: string) {
    return this.apartamentos.find((a) => a.id === apartamentoId) ?? null
  }
}
