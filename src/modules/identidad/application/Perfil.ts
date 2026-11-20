import type { Actor } from '@/shared/domain/Actor'
import { NoEncontradoError } from '@/shared/domain/errores'
import { validarArchivoImagen, type AlmacenImagenes, type ArchivoImagen, type ImagenAlmacenada } from '@/shared/domain/imagenes'
import type { UsuarioRepository } from '../domain/puertos'
import type { Usuario } from '../domain/Usuario'
import { aUsuarioDTO, type UsuarioDTO } from './UsuarioDTO'

/**
 * Borrar del almacén una foto que ya no se usa es limpieza: si falla, la foto queda huérfana en Cloudinary,
 * pero el cambio de perfil ya está guardado y no debe mostrarse como error.
 */
const borrarSinFallar = (almacen: AlmacenImagenes, publicId: string) => almacen.eliminar(publicId).catch(() => {})

/** Cada persona solo ve y edita su propio perfil: el usuario siempre es el actor de la sesión. */
async function cargarPropio(usuarios: UsuarioRepository, actor: Actor): Promise<Usuario> {
  const usuario = await usuarios.buscarPorId(actor.id)
  if (!usuario) throw new NoEncontradoError('No encontramos tu cuenta. Vuelve a iniciar sesión.')
  return usuario
}

export class ObtenerPerfil {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async ejecutar(actor: Actor): Promise<UsuarioDTO> {
    return aUsuarioDTO(await cargarPropio(this.usuarios, actor))
  }
}

export class ActualizarPerfil {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async ejecutar(actor: Actor, datos: { nombre: string; telefono?: string | null }): Promise<UsuarioDTO> {
    const usuario = await cargarPropio(this.usuarios, actor)
    usuario.actualizarPerfil(datos)
    await this.usuarios.guardar(usuario)
    return aUsuarioDTO(usuario)
  }
}

export class CambiarFotoPerfil {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly almacen: AlmacenImagenes,
  ) {}

  async ejecutar(actor: Actor, archivo: ArchivoImagen): Promise<UsuarioDTO> {
    const usuario = await cargarPropio(this.usuarios, actor)
    validarArchivoImagen(archivo)

    const nueva = await this.almacen.subir(archivo, `usuarios/${usuario.id}`)
    let anterior: ImagenAlmacenada | null
    try {
      anterior = usuario.cambiarFoto(nueva)
      await this.usuarios.guardar(usuario)
    } catch (error) {
      // Si no se pudo guardar, la foto recién subida no debe quedar huérfana en el almacén.
      await borrarSinFallar(this.almacen, nueva.publicId)
      throw error
    }
    // La anterior se borra solo cuando la nueva ya quedó guardada.
    if (anterior) await borrarSinFallar(this.almacen, anterior.publicId)
    return aUsuarioDTO(usuario)
  }
}

export class QuitarFotoPerfil {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly almacen: AlmacenImagenes,
  ) {}

  async ejecutar(actor: Actor): Promise<UsuarioDTO> {
    const usuario = await cargarPropio(this.usuarios, actor)
    const anterior = usuario.quitarFoto()
    if (anterior) {
      await this.usuarios.guardar(usuario)
      await borrarSinFallar(this.almacen, anterior.publicId)
    }
    return aUsuarioDTO(usuario)
  }
}
