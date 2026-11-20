import type { Rol } from '@/shared/domain/Actor'
import type { Usuario } from '../domain/Usuario'

/** Datos planos del usuario que salen del módulo (nunca incluye la contraseña). */
export interface UsuarioDTO {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: Rol
  fotoUrl: string | null
}

export function aUsuarioDTO(usuario: Usuario): UsuarioDTO {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email.valor,
    telefono: usuario.telefono,
    rol: usuario.rol,
    fotoUrl: usuario.foto?.url ?? null,
  }
}
