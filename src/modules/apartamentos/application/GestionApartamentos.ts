import { esAnfitrion, type Actor } from '@/shared/domain/Actor'
import { relojDelSistema, type Reloj } from '@/shared/domain/comunes'
import { NoAutorizadoError, NoEncontradoError } from '@/shared/domain/errores'
import { Apartamento, type EstadoApartamento } from '../domain/Apartamento'
import type { ApartamentoRepository } from '../domain/puertos'
import { aApartamentoDTO, aDatosApartamento, type ApartamentoDTO, type DatosApartamentoInput } from './ApartamentoDTO'

/** Casos de uso del propietario sobre sus apartamentos. */

export class PublicarApartamento {
  constructor(
    private readonly apartamentos: ApartamentoRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor, input: DatosApartamentoInput): Promise<ApartamentoDTO> {
    if (!esAnfitrion(actor)) throw new NoAutorizadoError('Solo los propietarios pueden publicar apartamentos')
    const apartamento = Apartamento.publicar(actor.id, aDatosApartamento(input), this.reloj.ahora())
    await this.apartamentos.guardar(apartamento)
    return aApartamentoDTO(apartamento)
  }
}

export class ActualizarApartamento {
  constructor(private readonly apartamentos: ApartamentoRepository) {}

  async ejecutar(actor: Actor, apartamentoId: string, input: DatosApartamentoInput): Promise<ApartamentoDTO> {
    const apartamento = await cargarGestionable(this.apartamentos, actor, apartamentoId)
    apartamento.actualizar(aDatosApartamento(input))
    await this.apartamentos.guardar(apartamento)
    return aApartamentoDTO(apartamento)
  }
}

export class CambiarEstadoApartamento {
  constructor(private readonly apartamentos: ApartamentoRepository) {}

  async ejecutar(actor: Actor, apartamentoId: string, estado: EstadoApartamento): Promise<ApartamentoDTO> {
    const apartamento = await cargarGestionable(this.apartamentos, actor, apartamentoId)
    apartamento.cambiarEstado(estado)
    await this.apartamentos.guardar(apartamento)
    return aApartamentoDTO(apartamento)
  }
}

export class ListarApartamentosDePropietario {
  constructor(private readonly apartamentos: ApartamentoRepository) {}

  async ejecutar(actor: Actor): Promise<ApartamentoDTO[]> {
    const lista = await this.apartamentos.listarPorPropietario(actor.id)
    return lista.map(aApartamentoDTO)
  }
}

/** Carga el apartamento y verifica que el actor sea su propietario (o admin). */
export async function cargarGestionable(
  apartamentos: ApartamentoRepository,
  actor: Actor,
  apartamentoId: string,
): Promise<Apartamento> {
  const apartamento = await apartamentos.buscarPorId(apartamentoId)
  if (!apartamento || apartamento.estado === 'ELIMINADO') throw new NoEncontradoError('Apartamento no encontrado')
  if (!apartamento.puedeSerGestionadoPor(actor)) throw new NoAutorizadoError()
  return apartamento
}
