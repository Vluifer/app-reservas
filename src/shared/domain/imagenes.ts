import { asegurar } from './errores'

/** Almacén de imágenes compartido por los módulos (fotos de apartamentos, foto de perfil). */

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

/** Imagen ya guardada en el almacén. */
export interface ImagenAlmacenada {
  url: string
  publicId: string
}

export const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024

export function validarArchivoImagen(archivo: ArchivoImagen): void {
  asegurar(TIPOS_IMAGEN_PERMITIDOS.includes(archivo.tipo), `${archivo.nombre}: formato no permitido (usa JPG, PNG o WebP)`)
  asegurar(archivo.tamano <= TAMANO_MAXIMO_IMAGEN, `${archivo.nombre}: supera el máximo de 5 MB`)
}
