import type { Actor } from '@/shared/domain/Actor'
import { asegurar } from '@/shared/domain/errores'
import { validarArchivoImagen, type AlmacenImagenes, type ArchivoImagen } from '@/shared/domain/imagenes'
import type { ApartamentoRepository } from '../domain/puertos'
import { aApartamentoDTO, type ApartamentoDTO } from './ApartamentoDTO'
import { cargarGestionable } from './GestionApartamentos'

export class SubirImagenesApartamento {
  constructor(
    private readonly apartamentos: ApartamentoRepository,
    private readonly almacen: AlmacenImagenes,
  ) {}

  async ejecutar(actor: Actor, apartamentoId: string, archivos: ArchivoImagen[]): Promise<ApartamentoDTO> {
    const apartamento = await cargarGestionable(this.apartamentos, actor, apartamentoId)

    asegurar(archivos.length > 0, 'Selecciona al menos una imagen')
    archivos.forEach(validarArchivoImagen)
    apartamento.asegurarEspacioParaImagenes(archivos.length)

    const subidas: { url: string; publicId: string }[] = []
    try {
      for (const archivo of archivos) {
        subidas.push(await this.almacen.subir(archivo, `apartamentos/${apartamento.id}`))
      }
      apartamento.agregarImagenes(subidas)
      await this.apartamentos.guardar(apartamento)
    } catch (error) {
      // Si algo falla no dejamos imágenes huérfanas en el almacén.
      await Promise.allSettled(subidas.map((s) => this.almacen.eliminar(s.publicId)))
      throw error
    }
    return aApartamentoDTO(apartamento)
  }
}

export class EliminarImagenApartamento {
  constructor(
    private readonly apartamentos: ApartamentoRepository,
    private readonly almacen: AlmacenImagenes,
  ) {}

  async ejecutar(actor: Actor, apartamentoId: string, imagenId: string): Promise<ApartamentoDTO> {
    const apartamento = await cargarGestionable(this.apartamentos, actor, apartamentoId)
    const imagen = apartamento.quitarImagen(imagenId)
    await this.apartamentos.guardar(apartamento)
    if (imagen.publicId) await this.almacen.eliminar(imagen.publicId)
    return aApartamentoDTO(apartamento)
  }
}
