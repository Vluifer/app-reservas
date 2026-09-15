import type { Actor } from '@/shared/domain/Actor'
import { relojDelSistema, type Reloj } from '@/shared/domain/comunes'
import { NoAutorizadoError, NoEncontradoError } from '@/shared/domain/errores'
import type { ReservaRepository } from '../domain/puertos'
import type { Reserva } from '../domain/Reserva'
import { aReservaDTO, type ReservaDTO } from './ReservaDTO'

/** Cambios de estado de una reserva. */

export class ConfirmarReserva {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor, reservaId: string): Promise<ReservaDTO> {
    const reserva = await cargarReserva(this.reservas, reservaId, actor)
    if (!reserva.puedeSerGestionadaPor(actor)) throw new NoAutorizadoError('Solo el propietario puede confirmar la reserva')
    reserva.confirmar(this.reloj.ahora())
    await this.reservas.guardar(reserva)
    return aReservaDTO(reserva)
  }
}

export class RechazarReserva {
  constructor(private readonly reservas: ReservaRepository) {}

  async ejecutar(actor: Actor, reservaId: string): Promise<ReservaDTO> {
    const reserva = await cargarReserva(this.reservas, reservaId, actor)
    if (!reserva.puedeSerGestionadaPor(actor)) throw new NoAutorizadoError('Solo el propietario puede rechazar la reserva')
    reserva.rechazar()
    await this.reservas.guardar(reserva)
    return aReservaDTO(reserva)
  }
}

/** Puede cancelar el huésped, el propietario o un admin. */
export class CancelarReserva {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor, reservaId: string): Promise<ReservaDTO> {
    const reserva = await cargarReserva(this.reservas, reservaId, actor)
    reserva.cancelar(this.reloj.ahora())
    await this.reservas.guardar(reserva)
    return aReservaDTO(reserva)
  }
}

/** Tarea programada: marca como EXPIRADAS las solicitudes que nadie confirmó a tiempo. */
export class ExpirarReservasPendientes {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(): Promise<number> {
    const ahora = this.reloj.ahora()
    const vencidas = await this.reservas.listarPendientesVencidas(ahora)
    for (const reserva of vencidas) {
      reserva.expirar(ahora)
      await this.reservas.guardar(reserva)
    }
    return vencidas.length
  }
}

/** Carga la reserva y verifica que el actor pueda verla (si no, responde "no encontrada"). */
export async function cargarReserva(reservas: ReservaRepository, reservaId: string, actor: Actor): Promise<Reserva> {
  const reserva = await reservas.buscarPorId(reservaId)
  if (!reserva || !reserva.puedeSerVistaPor(actor)) throw new NoEncontradoError('Reserva no encontrada')
  return reserva
}
