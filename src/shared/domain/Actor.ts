export const ROLES = ['CLIENTE', 'PROPIETARIO', 'ADMIN'] as const
export type Rol = (typeof ROLES)[number]

/** Roles que pueden publicar y gestionar apartamentos. */
export const ROLES_ANFITRION: readonly Rol[] = ['PROPIETARIO', 'ADMIN']

/**
 * Quién ejecuta un caso de uso. Sale de la sesión y cada caso de uso lo usa para autorizar.
 */
export interface Actor {
  id: string
  rol: Rol
}

export interface ActorIdentificado extends Actor {
  nombre: string
  email: string
}

export function esAdmin(actor: Actor): boolean {
  return actor.rol === 'ADMIN'
}

export function esAnfitrion(actor: Actor): boolean {
  return ROLES_ANFITRION.includes(actor.rol)
}
