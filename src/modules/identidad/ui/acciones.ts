'use server'

import { AuthError } from 'next-auth'
import { autenticacion, identidad } from '@/contenedor'
import { manejarErrores, type EstadoAccion } from '@/shared/ui/acciones'
import { rutaInterna, texto, textoOpcional, valor } from '@/shared/ui/formulario'

export async function iniciarSesion(_estado: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  try {
    await autenticacion.signIn('credentials', {
      email: texto(datos, 'email'),
      password: valor(datos, 'password'),
      redirectTo: rutaInterna(texto(datos, 'volverA')),
    })
  } catch (error) {
    // signIn redirige lanzando una excepción especial de Next: solo capturamos errores de autenticación.
    if (error instanceof AuthError) return { error: 'Email o contraseña incorrectos' }
    throw error
  }
  return null
}

export async function cerrarSesion() {
  await autenticacion.signOut({ redirectTo: '/' })
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
