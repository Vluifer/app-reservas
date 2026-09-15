import type { Email } from './Email'
import type { Usuario } from './Usuario'

/** Puertos: lo que el dominio necesita del exterior. Las implementaciones viven en infrastructure/. */

export interface UsuarioRepository {
  buscarPorId(id: string): Promise<Usuario | null>
  buscarPorEmail(email: Email): Promise<Usuario | null>
  /** Crea o actualiza. Lanza EmailYaRegistradoError si el email ya pertenece a otro usuario. */
  guardar(usuario: Usuario): Promise<void>
}

export interface PasswordHasher {
  hash(password: string): Promise<string>
  coincide(password: string, hash: string): Promise<boolean>
}
