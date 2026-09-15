import type { Actor } from '@/shared/domain/Actor'
import { mapearPagina, relojDelSistema, type Pagina, type Reloj } from '@/shared/domain/comunes'
import { Dinero } from '@/shared/domain/Dinero'
import { NoEncontradoError } from '@/shared/domain/errores'
import { RangoFechas } from '@/shared/domain/RangoFechas'
import type { ApartamentoRepository, ConsultaOcupacion } from '../domain/puertos'
import { aApartamentoDTO, type ApartamentoDTO } from './ApartamentoDTO'

/** Consultas públicas del catálogo. */

export const RESULTADOS_POR_PAGINA = 12

export interface FiltrosBusqueda {
  ciudad?: string
  huespedes?: number
  precioMaximo?: number
  llegada?: string
  salida?: string
  pagina?: number
}

export class BuscarApartamentos {
  constructor(
    private readonly apartamentos: ApartamentoRepository,
    private readonly ocupacion: ConsultaOcupacion,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(filtros: FiltrosBusqueda): Promise<Pagina<ApartamentoDTO>> {
    const rango = filtros.llegada && filtros.salida ? RangoFechas.crear(filtros.llegada, filtros.salida) : null
    const excluirIds = rango ? await this.ocupacion.apartamentosOcupados(rango, this.reloj.ahora()) : undefined

    const resultado = await this.apartamentos.buscarActivos({
      ciudad: filtros.ciudad?.trim() || undefined,
      huespedes: filtros.huespedes && filtros.huespedes > 0 ? filtros.huespedes : undefined,
      precioMaximo: filtros.precioMaximo && filtros.precioMaximo > 0 ? Dinero.desde(filtros.precioMaximo) : undefined,
      excluirIds,
      pagina: Math.max(1, Math.floor(filtros.pagina ?? 1)),
      porPagina: RESULTADOS_POR_PAGINA,
    })
    return mapearPagina(resultado, aApartamentoDTO)
  }
}

export class ObtenerApartamento {
  constructor(private readonly apartamentos: ApartamentoRepository) {}

  /** Los apartamentos no activos solo los ve su propietario (o un admin). */
  async ejecutar(apartamentoId: string, actor: Actor | null): Promise<ApartamentoDTO> {
    const apartamento = await this.apartamentos.buscarPorId(apartamentoId)
    const visible =
      apartamento &&
      apartamento.estado !== 'ELIMINADO' &&
      (apartamento.estaActivo() || (actor !== null && apartamento.puedeSerGestionadoPor(actor)))
    if (!visible) throw new NoEncontradoError('Apartamento no encontrado')
    return aApartamentoDTO(apartamento)
  }
}
