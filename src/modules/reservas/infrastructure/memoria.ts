import { ConflictoDeConcurrenciaError } from '@/shared/domain/errores'
import { hoy, type RangoFechas } from '@/shared/domain/RangoFechas'
import { RegistroDeVersiones } from '@/shared/infrastructure/versiones'
import { FechasNoDisponiblesError } from '../domain/errores'
import type { CatalogoApartamentos, ReservaRepository } from '../domain/puertos'
import { Reserva, type ApartamentoReservable, type ReservaProps } from '../domain/Reserva'

/** Implementaciones en memoria para pruebas unitarias (sin base de datos). Mismo bloqueo optimista que Prisma. */

export class EnMemoriaReservaRepository implements ReservaRepository {
  private readonly registros = new Map<string, { props: ReservaProps; version: number }>()
  private readonly versiones = new RegistroDeVersiones<Reserva>()

  private cargar({ props, version }: { props: ReservaProps; version: number }): Reserva {
    return this.versiones.anotar(Reserva.reconstruir(props), version)
  }

  private todas(): Reserva[] {
    return [...this.registros.values()]
      .map((registro) => this.cargar(registro))
      .sort((a, b) => b.creadaEn.getTime() - a.creadaEn.getTime())
  }

  async buscarPorId(id: string) {
    const registro = this.registros.get(id)
    return registro ? this.cargar(registro) : null
  }

  async crearSiHayDisponibilidad(reserva: Reserva) {
    if (await this.hayConflicto(reserva.apartamentoId, reserva.rango, reserva.creadaEn)) {
      throw new FechasNoDisponiblesError()
    }
    this.registros.set(reserva.id, { props: reserva.instantanea(), version: 0 })
    this.versiones.anotar(reserva, 0)
  }

  async guardar(reserva: Reserva) {
    const version = this.versiones.versionDe(reserva)
    if (version === undefined) throw new Error('Una reserva nueva se guarda con crearSiHayDisponibilidad()')
    if (this.registros.get(reserva.id)?.version !== version) throw new ConflictoDeConcurrenciaError()

    this.registros.set(reserva.id, { props: reserva.instantanea(), version: version + 1 })
    this.versiones.anotar(reserva, version + 1)
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

  async listarPorPropietarioEnRango(propietarioId: string, desde: Date, hasta: Date) {
    return this.todas()
      .filter((r) => r.propietarioId === propietarioId && r.rango.inicio <= hasta && r.rango.fin >= desde)
      .sort((a, b) => a.rango.inicio.getTime() - b.rango.inicio.getTime())
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
