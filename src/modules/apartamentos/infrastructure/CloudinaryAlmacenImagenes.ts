import { v2 as cloudinary } from 'cloudinary'
import { ErrorDeDominio } from '@/shared/domain/errores'
import type { AlmacenImagenes, ArchivoImagen } from '../domain/puertos'

export class CloudinaryAlmacenImagenes implements AlmacenImagenes {
  constructor(config: { cloudName: string; apiKey: string; apiSecret: string }) {
    cloudinary.config({ cloud_name: config.cloudName, api_key: config.apiKey, api_secret: config.apiSecret, secure: true })
  }

  subir(archivo: ArchivoImagen, carpeta: string): Promise<{ url: string; publicId: string }> {
    return new Promise((resolver, rechazar) => {
      const subida = cloudinary.uploader.upload_stream(
        {
          folder: carpeta,
          resource_type: 'image',
          transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        },
        (error, resultado) => {
          if (error || !resultado) return rechazar(error ?? new Error('Cloudinary no devolvió resultado'))
          resolver({ url: resultado.secure_url, publicId: resultado.public_id })
        },
      )
      subida.end(Buffer.from(archivo.contenido))
    })
  }

  async eliminar(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId)
  }
}

/** Se usa cuando faltan las variables de Cloudinary: la app funciona, pero sin subir imágenes. */
export class AlmacenImagenesNoConfigurado implements AlmacenImagenes {
  async subir(): Promise<never> {
    throw new ErrorDeDominio('La subida de imágenes no está configurada (faltan variables CLOUDINARY_*)')
  }

  async eliminar(): Promise<void> {}
}

export function crearAlmacenImagenes(): AlmacenImagenes {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) return new AlmacenImagenesNoConfigurado()
  return new CloudinaryAlmacenImagenes({ cloudName, apiKey, apiSecret })
}
