import { crearPagina } from '@/shared/domain/comunes'
import { Apartamento, type ApartamentoProps } from '../domain/Apartamento'
import type { AlmacenImagenes, ApartamentoRepository, ArchivoImagen, CriteriosBusqueda } from '../domain/puertos'

/** Implementaciones en memoria para pruebas unitarias (sin base de datos ni Cloudinary). */

export class EnMemoriaApartamentoRepository implements ApartamentoRepository {
  private readonly registros = new Map<string, ApartamentoProps>()

  async buscarPorId(id: string) {
    const props = this.registros.get(id)
    return props ? Apartamento.reconstruir(props) : null
  }

  async guardar(apartamento: Apartamento) {
    this.registros.set(apartamento.id, apartamento.instantanea())
  }

  async buscarActivos(criterios: CriteriosBusqueda) {
    const coincidencias = [...this.registros.values()]
      .filter((a) => a.estado === 'ACTIVO')
      .filter((a) => !criterios.ciudad || a.ciudad.toLowerCase().includes(criterios.ciudad.toLowerCase()))
      .filter((a) => !criterios.huespedes || a.capacidad >= criterios.huespedes)
      .filter((a) => !criterios.precioMaximo || a.precioPorNoche.centavos <= criterios.precioMaximo.centavos)
      .filter((a) => !criterios.excluirIds?.includes(a.id))
      .sort((a, b) => b.creadoEn.getTime() - a.creadoEn.getTime())

    const inicio = (criterios.pagina - 1) * criterios.porPagina
    const items = coincidencias.slice(inicio, inicio + criterios.porPagina).map((p) => Apartamento.reconstruir(p))
    return crearPagina(items, coincidencias.length, criterios.pagina, criterios.porPagina)
  }

  async listarPorPropietario(propietarioId: string) {
    return [...this.registros.values()]
      .filter((a) => a.propietarioId === propietarioId && a.estado !== 'ELIMINADO')
      .map((p) => Apartamento.reconstruir(p))
  }
}

export class AlmacenImagenesFalso implements AlmacenImagenes {
  readonly subidas: string[] = []
  readonly eliminadas: string[] = []
  fallarDespuesDe = Infinity

  async subir(archivo: ArchivoImagen, carpeta: string) {
    if (this.subidas.length >= this.fallarDespuesDe) throw new Error('Fallo simulado del almacén')
    const publicId = `${carpeta}/${archivo.nombre}`
    this.subidas.push(publicId)
    return { url: `https://imagenes.test/${publicId}`, publicId }
  }

  async eliminar(publicId: string) {
    this.eliminadas.push(publicId)
  }
}
