import type { AlmacenImagenes, ArchivoImagen } from '@/shared/domain/imagenes'

/** Almacén de imágenes en memoria para pruebas unitarias (sin Cloudinary). */
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
