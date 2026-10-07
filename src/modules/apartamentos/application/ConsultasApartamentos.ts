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

export interface FilaVitrina {
  ciudad: string
  /** Apartamentos activos en la ciudad (puede ser mayor que los que trae la fila). */
  total: number
  apartamentos: ApartamentoDTO[]
}

export interface Vitrina {
  recientes: ApartamentoDTO[]
  ciudades: FilaVitrina[]
}

/** Portada del catálogo: lo más reciente y una fila por cada ciudad con más oferta. */
export class ObtenerVitrina {
  constructor(private readonly apartamentos: ApartamentoRepository) {}

  async ejecutar({ ciudades = 3, porFila = 8 }: { ciudades?: number; porFila?: number } = {}): Promise<Vitrina> {
    const [recientes, conOferta] = await Promise.all([
      this.apartamentos.buscarActivos({ pagina: 1, porPagina: porFila }),
      this.apartamentos.ciudadesConOferta(ciudades),
    ])
    const filas = await Promise.all(
      conOferta.map(async ({ ciudad, total }) => {
        const pagina = await this.apartamentos.buscarActivos({ ciudad, pagina: 1, porPagina: porFila })
        return { ciudad, total, apartamentos: pagina.items.map(aApartamentoDTO) }
      }),
    )
    return { recientes: recientes.items.map(aApartamentoDTO), ciudades: filas }
  }
}

/** Lo mínimo para acompañar una reserva: nombre, ubicación y foto de portada. */
export interface FichaApartamento {
  id: string
  nombre: string
  ciudad: string
  region: string
  direccion: string
  imagenPrincipal: string | null
}

/** Fichas de varios apartamentos a la vez, en cualquier estado (una reserva antigua sigue mostrando su foto). */
export class ObtenerFichasApartamentos {
  constructor(private readonly apartamentos: ApartamentoRepository) {}

  async ejecutar(ids: string[]): Promise<Map<string, FichaApartamento>> {
    const encontrados = await this.apartamentos.buscarPorIds([...new Set(ids)])
    return new Map(
      encontrados.map((a) => {
        const { id, nombre, ciudad, region, direccion, imagenPrincipal } = aApartamentoDTO(a)
        return [id, { id, nombre, ciudad, region, direccion, imagenPrincipal }]
      }),
    )
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
