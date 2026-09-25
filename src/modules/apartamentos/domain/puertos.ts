import type { Pagina } from '@/shared/domain/comunes'
import type { Dinero } from '@/shared/domain/Dinero'
import type { RangoFechas } from '@/shared/domain/RangoFechas'
import type { Apartamento } from './Apartamento'

/** Puertos: lo que el módulo necesita del exterior. Las implementaciones viven en infrastructure/. */

export interface CriteriosBusqueda {
  ciudad?: string
  huespedes?: number
  precioMaximo?: Dinero
  /** Apartamentos que no deben aparecer (p. ej. ocupados en las fechas buscadas). */
  excluirIds?: string[]
  pagina: number
  porPagina: number
}

export interface ApartamentoRepository {
  buscarPorId(id: string): Promise<Apartamento | null>
  /**
   * Crea el apartamento si es nuevo o actualiza uno leído de este repositorio (con sus imágenes).
   * Lanza ConflictoDeConcurrenciaError si otra petición lo guardó entretanto (bloqueo optimista).
   */
  guardar(apartamento: Apartamento): Promise<void>
  /** Solo apartamentos ACTIVOS, del más reciente al más antiguo. */
  buscarActivos(criterios: CriteriosBusqueda): Promise<Pagina<Apartamento>>
  /** Todos los del propietario excepto los eliminados. */
  listarPorPropietario(propietarioId: string): Promise<Apartamento[]>
}

export interface ArchivoImagen {
  nombre: string
  tipo: string
  tamano: number
  contenido: ArrayBuffer
}

export interface AlmacenImagenes {
  subir(archivo: ArchivoImagen, carpeta: string): Promise<{ url: string; publicId: string }>
  eliminar(publicId: string): Promise<void>
}

/** Lo implementa el módulo de reservas: qué apartamentos están ocupados en un rango. */
export interface ConsultaOcupacion {
  apartamentosOcupados(rango: RangoFechas, ahora: Date): Promise<string[]>
}
