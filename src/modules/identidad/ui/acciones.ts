'use server'

import { AuthError } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { autenticacion, identidad } from '@/contenedor'
import { ErrorDeValidacion } from '@/shared/domain/errores'
import { manejarErrores, type EstadoAccion } from '@/shared/ui/acciones'
import { archivos, rutaInterna, texto, textoOpcional, valor } from '@/shared/ui/formulario'
import { requerirActor } from './sesion'

export async function iniciarSesion(_estado: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  try {
    await autenticacion.signIn('credentials', {
      email: texto(datos, 'email'),
      password: valor(datos, 'password'),
      redirectTo: rutaInterna(texto(datos, 'volverA')),
    })
  } catch (error) {
    // signIn redirige lanzando una excepción especial de Next: solo capturamos errores de autenticación.
    if (error instanceof AuthError) return { error: 'El correo o la contraseña no son correctos' }
    throw error
  }
  return null
}

export async function cerrarSesion() {
  await autenticacion.signOut({ redirectTo: '/' })
}

export async function actualizarPerfil(_estado: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const actor = await requerirActor()
  return manejarErrores(async () => {
    const perfil = await identidad.actualizarPerfil.ejecutar(actor, {
      nombre: texto(datos, 'nombre'),
      telefono: textoOpcional(datos, 'telefono'),
    })
    // El nombre también vive en la sesión (JWT): se refresca para que todas las páginas lo vean
    await autenticacion.unstable_update({ user: { name: perfil.nombre } })
    revalidatePath('/', 'layout')
    return { exito: 'Datos guardados' }
  })
}

export async function cambiarFotoPerfil(_estado: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const actor = await requerirActor()
  return manejarErrores(async () => {
    const [archivo] = archivos(datos, 'foto')
    if (!archivo) throw new ErrorDeValidacion('Elige una foto')
    await identidad.cambiarFotoPerfil.ejecutar(actor, {
      nombre: archivo.name,
      tipo: archivo.type,
      tamano: archivo.size,
      contenido: await archivo.arrayBuffer(),
    })
    revalidatePath('/', 'layout')
    return { exito: 'Foto actualizada' }
  })
}

export async function quitarFotoPerfil(): Promise<EstadoAccion> {
  const actor = await requerirActor()
  return manejarErrores(async () => {
    await identidad.quitarFotoPerfil.ejecutar(actor)
    revalidatePath('/', 'layout')
    return { exito: 'Foto quitada' }
  })
}

export async function registrarse(_estado: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  return manejarErrores(async () => {
    const usuario = await identidad.registrarUsuario.ejecutar({
      nombre: texto(datos, 'nombre'),
      email: texto(datos, 'email'),
      password: valor(datos, 'password'),
      telefono: textoOpcional(datos, 'telefono'),
      rol: texto(datos, 'rol') === 'PROPIETARIO' ? 'PROPIETARIO' : 'CLIENTE',
    })
    // Inicia sesión automáticamente tras registrarse
    await autenticacion.signIn('credentials', {
      email: usuario.email,
      password: valor(datos, 'password'),
      redirectTo: usuario.rol === 'PROPIETARIO' ? '/dashboard' : '/',
    })
  })
}
