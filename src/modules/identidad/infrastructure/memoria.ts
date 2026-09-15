import type { Email } from '../domain/Email'
import { EmailYaRegistradoError } from '../domain/errores'
import type { PasswordHasher, UsuarioRepository } from '../domain/puertos'
import { Usuario } from '../domain/Usuario'

/** Implementaciones en memoria para pruebas unitarias (sin base de datos). */

export class EnMemoriaUsuarioRepository implements UsuarioRepository {
  readonly usuarios = new Map<string, Usuario>()

  async buscarPorId(id: string) {
    return this.usuarios.get(id) ?? null
  }

  async buscarPorEmail(email: Email) {
    return [...this.usuarios.values()].find((u) => u.email.valor === email.valor) ?? null
  }

  async guardar(usuario: Usuario) {
    const otro = await this.buscarPorEmail(usuario.email)
    if (otro && otro.id !== usuario.id) throw new EmailYaRegistradoError()
    this.usuarios.set(usuario.id, usuario)
  }
}

/** Hash reversible y rápido: solo para pruebas. */
export class PasswordHasherFalso implements PasswordHasher {
  async hash(password: string) {
    return `hash:${password}`
  }

  async coincide(password: string, hash: string) {
    return hash === `hash:${password}`
  }
}
