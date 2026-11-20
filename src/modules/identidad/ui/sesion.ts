import { redirect } from 'next/navigation'
import { autenticacion } from '@/contenedor'
import type { ActorIdentificado, Rol } from '@/shared/domain/Actor'

/** Usuario de la sesión actual, o null si no ha iniciado sesión. */
export async function obtenerActor(): Promise<ActorIdentificado | null> {
  const sesion = await autenticacion.auth()
  if (!sesion?.user?.id) return null
  return {
    id: sesion.user.id,
    rol: sesion.user.rol,
    nombre: sesion.user.name ?? '',
    email: sesion.user.email ?? '',
  }
}

/** Exige sesión (y opcionalmente un rol). Si no se cumple, redirige. */
export async function requerirActor(roles?: readonly Rol[]): Promise<ActorIdentificado> {
  const actor = await obtenerActor()
  if (!actor) redirect('/login')
  if (roles && !roles.includes(actor.rol)) redirect('/')
  return actor
}
