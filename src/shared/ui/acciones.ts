import { notFound, redirect } from 'next/navigation'
import { ErrorDeDominio, NoEncontradoError } from '@/shared/domain/errores'

/**
 * Patrón único para Server Actions y páginas:
 * - Errores de negocio (ErrorDeDominio) → se muestran al usuario.
 * - Cualquier otro error → se propaga (Next muestra la página de error y queda en logs).
 */

export type EstadoAccion = { error?: string; exito?: string } | null

/** Para formularios con useActionState: devuelve el error como estado. */
export async function manejarErrores(accion: () => Promise<EstadoAccion | void>): Promise<EstadoAccion> {
  try {
    return (await accion()) ?? null
  } catch (error) {
    if (error instanceof ErrorDeDominio) return { error: error.message }
    throw error
  }
}

/** Para botones simples (confirmar, cancelar...): ejecuta y vuelve a `ruta` con ?exito= o ?error=. */
export async function ejecutarYVolver(ruta: string, mensajeExito: string, accion: () => Promise<unknown>): Promise<never> {
  let destino: string
  try {
    await accion()
    destino = conParametro(ruta, 'exito', mensajeExito)
  } catch (error) {
    if (!(error instanceof ErrorDeDominio)) throw error
    destino = conParametro(ruta, 'error', error.message)
  }
  redirect(destino)
}

/** Para páginas: ejecuta una consulta y convierte los errores de negocio en un mensaje. */
export async function consultar<T>(consulta: () => Promise<T>): Promise<{ datos: T; error: null } | { datos: null; error: string }> {
  try {
    return { datos: await consulta(), error: null }
  } catch (error) {
    if (error instanceof ErrorDeDominio) return { datos: null, error: error.message }
    throw error
  }
}

/** Uso: `await casoDeUso.ejecutar(...).catch(siNoExiste404)` */
export function siNoExiste404(error: unknown): never {
  if (error instanceof NoEncontradoError) notFound()
  throw error
}

export function conParametro(ruta: string, clave: string, valor: string): string {
  const separador = ruta.includes('?') ? '&' : '?'
  return `${ruta}${separador}${clave}=${encodeURIComponent(valor)}`
}
