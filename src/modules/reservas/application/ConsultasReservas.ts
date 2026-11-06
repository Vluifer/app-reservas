import type { Actor } from '@/shared/domain/Actor'
import { relojDelSistema, type Reloj } from '@/shared/domain/comunes'
import { asegurar } from '@/shared/domain/errores'
import { aFechaSinHora, aTextoISO } from '@/shared/domain/RangoFechas'
import type { ReservaRepository } from '../domain/puertos'
import { cargarReserva } from './GestionReservas'
import { aReservaDTO, type ReservaDTO } from './ReservaDTO'

export class ObtenerReserva {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor, reservaId: string): Promise<ReservaDTO> {
    return aReservaDTO(await cargarReserva(this.reservas, reservaId, actor), this.reloj.ahora())
  }
}

export class ListarReservasDeCliente {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor): Promise<ReservaDTO[]> {
    const ahora = this.reloj.ahora()
    return (await this.reservas.listarPorCliente(actor.id)).map((r) => aReservaDTO(r, ahora))
  }
}

export class ListarReservasDePropietario {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor): Promise<ReservaDTO[]> {
    const ahora = this.reloj.ahora()
    return (await this.reservas.listarPorPropietario(actor.id)).map((r) => aReservaDTO(r, ahora))
  }
}

export class ConsultarFechasOcupadas {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(apartamentoId: string): Promise<{ llegada: string; salida: string }[]> {
    const rangos = await this.reservas.fechasOcupadas(apartamentoId, this.reloj.ahora())
    return rangos.map((r) => ({ llegada: aTextoISO(r.inicio), salida: aTextoISO(r.fin) }))
  }
}

/** La cuadrícula del calendario cubre como máximo 6 semanas (un mes con sus días vecinos). */
export const MAXIMO_DIAS_CALENDARIO = 42

const MS_POR_DIA = 24 * 60 * 60 * 1000

/** Reservas que el propietario ve en su calendario entre dos días ("AAAA-MM-DD", ambos incluidos). */
export class ConsultarCalendario {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor, { desde, hasta }: { desde: string; hasta: string }): Promise<ReservaDTO[]> {
    const inicio = aFechaSinHora(desde)
    const fin = aFechaSinHora(hasta)
    const dias = Math.round((fin.getTime() - inicio.getTime()) / MS_POR_DIA) + 1
    asegurar(dias >= 1 && dias <= MAXIMO_DIAS_CALENDARIO, 'El calendario muestra como máximo 6 semanas')

    const ahora = this.reloj.ahora()
    const lista = await this.reservas.listarPorPropietarioEnRango(actor.id, inicio, fin)
    return lista.filter((r) => r.seMuestraEnCalendario(ahora)).map((r) => aReservaDTO(r, ahora))
  }
}
