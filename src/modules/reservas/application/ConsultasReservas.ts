import type { Actor } from '@/shared/domain/Actor'
import { relojDelSistema, type Reloj } from '@/shared/domain/comunes'
import { aTextoISO } from '@/shared/domain/RangoFechas'
import type { ReservaRepository } from '../domain/puertos'
import { cargarReserva } from './GestionReservas'
import { aReservaDTO, type ReservaDTO } from './ReservaDTO'

export class ObtenerReserva {
  constructor(private readonly reservas: ReservaRepository) {}

  async ejecutar(actor: Actor, reservaId: string): Promise<ReservaDTO> {
    return aReservaDTO(await cargarReserva(this.reservas, reservaId, actor))
  }
}

export class ListarReservasDeCliente {
  constructor(private readonly reservas: ReservaRepository) {}

  async ejecutar(actor: Actor): Promise<ReservaDTO[]> {
    return (await this.reservas.listarPorCliente(actor.id)).map(aReservaDTO)
  }
}

export class ListarReservasDePropietario {
  constructor(private readonly reservas: ReservaRepository) {}

  async ejecutar(actor: Actor): Promise<ReservaDTO[]> {
    return (await this.reservas.listarPorPropietario(actor.id)).map(aReservaDTO)
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
