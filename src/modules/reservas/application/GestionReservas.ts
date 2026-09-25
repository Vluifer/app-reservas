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
    const ahora = this.reloj.ahora()
    const reserva = await cargarReserva(this.reservas, reservaId, actor)
    if (!reserva.puedeSerGestionadaPor(actor)) throw new NoAutorizadoError('Solo el propietario puede confirmar la reserva')
    reserva.confirmar(ahora)
    await this.reservas.guardar(reserva)
    return aReservaDTO(reserva, ahora)
  }
}

export class RechazarReserva {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor, reservaId: string): Promise<ReservaDTO> {
    const ahora = this.reloj.ahora()
    const reserva = await cargarReserva(this.reservas, reservaId, actor)
    if (!reserva.puedeSerGestionadaPor(actor)) throw new NoAutorizadoError('Solo el propietario puede rechazar la reserva')
    reserva.rechazar(ahora)
    await this.reservas.guardar(reserva)
    return aReservaDTO(reserva, ahora)
  }
}

/** Puede cancelar el huésped, el propietario o un admin. */
export class CancelarReserva {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor, reservaId: string): Promise<ReservaDTO> {
    const ahora = this.reloj.ahora()
    const reserva = await cargarReserva(this.reservas, reservaId, actor)
    reserva.cancelar(ahora)
    await this.reservas.guardar(reserva)
    return aReservaDTO(reserva, ahora)
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

/** Tarea programada: pasa las reservas confirmadas a EN_CURSO al llegar el huésped y a COMPLETADA al salir. */
export class AvanzarEstadias {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(): Promise<number> {
    const ahora = this.reloj.ahora()
    const porAvanzar = await this.reservas.listarEstadiasPorAvanzar(ahora)
    for (const reserva of porAvanzar) {
      reserva.avanzarEstadia(ahora)
      await this.reservas.guardar(reserva)
    }
    return porAvanzar.length
  }
}

/** Carga la reserva y verifica que el actor pueda verla (si no, responde "no encontrada"). */
export async function cargarReserva(reservas: ReservaRepository, reservaId: string, actor: Actor): Promise<Reserva> {
  const reserva = await reservas.buscarPorId(reservaId)
  if (!reserva || !reserva.puedeSerVistaPor(actor)) throw new NoEncontradoError('Reserva no encontrada')
  return reserva
}
