import { ErrorDeValidacion } from '@/shared/domain/errores'
import { Email } from '../domain/Email'
import { CredencialesInvalidasError } from '../domain/errores'
import type { PasswordHasher, UsuarioRepository } from '../domain/puertos'
import { aUsuarioDTO, type UsuarioDTO } from './UsuarioDTO'

export class AutenticarUsuario {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async ejecutar(credenciales: { email: string; password: string }): Promise<UsuarioDTO> {
    let email: Email
    try {
      email = Email.crear(credenciales.email)
    } catch (error) {
      if (error instanceof ErrorDeValidacion) throw new CredencialesInvalidasError()
      throw error
    }

    const usuario = await this.usuarios.buscarPorEmail(email)
    const passwordCorrecta = usuario !== null && (await this.hasher.coincide(credenciales.password, usuario.passwordHash))
    if (!usuario || !passwordCorrecta) throw new CredencialesInvalidasError()

    return aUsuarioDTO(usuario)
  }
}
