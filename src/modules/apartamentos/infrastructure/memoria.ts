import { crearPagina } from '@/shared/domain/comunes'
import { ConflictoDeConcurrenciaError } from '@/shared/domain/errores'
import { RegistroDeVersiones } from '@/shared/infrastructure/versiones'
import { Apartamento, type ApartamentoProps } from '../domain/Apartamento'
import type { AlmacenImagenes, ApartamentoRepository, ArchivoImagen, CriteriosBusqueda } from '../domain/puertos'

/** Implementaciones en memoria para pruebas unitarias (sin base de datos ni Cloudinary). Mismo bloqueo optimista que Prisma. */

export class EnMemoriaApartamentoRepository implements ApartamentoRepository {
  private readonly registros = new Map<string, ApartamentoProps>()
  private readonly versionesGuardadas = new Map<string, number>()
  private readonly versiones = new RegistroDeVersiones<Apartamento>()

  private cargar(props: ApartamentoProps): Apartamento {
    return this.versiones.anotar(Apartamento.reconstruir(props), this.versionesGuardadas.get(props.id) ?? 0)
  }

  async buscarPorId(id: string) {
    const props = this.registros.get(id)
    return props ? this.cargar(props) : null
  }

  async guardar(apartamento: Apartamento) {
    const version = this.versiones.versionDe(apartamento)
    if (version === undefined) {
      if (this.registros.has(apartamento.id)) throw new Error(`El apartamento ${apartamento.id} ya existe`)
    } else if (this.versionesGuardadas.get(apartamento.id) !== version) {
      throw new ConflictoDeConcurrenciaError()
    }
    const nueva = version === undefined ? 0 : version + 1
    this.registros.set(apartamento.id, apartamento.instantanea())
    this.versionesGuardadas.set(apartamento.id, nueva)
    this.versiones.anotar(apartamento, nueva)
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
    const items = coincidencias.slice(inicio, inicio + criterios.porPagina).map((p) => this.cargar(p))
    return crearPagina(items, coincidencias.length, criterios.pagina, criterios.porPagina)
  }

  async listarPorPropietario(propietarioId: string) {
    return [...this.registros.values()]
      .filter((a) => a.propietarioId === propietarioId && a.estado !== 'ELIMINADO')
      .map((p) => this.cargar(p))
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
