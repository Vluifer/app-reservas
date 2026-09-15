import type { Rol } from '@/shared/domain/Actor'
import { relojDelSistema, type Reloj } from '@/shared/domain/comunes'
import { Email } from '../domain/Email'
import { EmailYaRegistradoError } from '../domain/errores'
import type { PasswordHasher, UsuarioRepository } from '../domain/puertos'
import { Usuario, validarPassword } from '../domain/Usuario'
import { aUsuarioDTO, type UsuarioDTO } from './UsuarioDTO'

export interface RegistrarUsuarioInput {
  nombre: string
  email: string
  password: string
  telefono?: string | null
  rol?: Rol
}

export class RegistrarUsuario {
  constructor(
    private readonly usuarios: UsuarioRepository,
    private readonly hasher: PasswordHasher,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(input: RegistrarUsuarioInput): Promise<UsuarioDTO> {
    validarPassword(input.password)
    if (await this.usuarios.buscarPorEmail(Email.crear(input.email))) {
      throw new EmailYaRegistradoError()
    }

    const usuario = Usuario.registrar(
      { ...input, passwordHash: await this.hasher.hash(input.password) },
      this.reloj.ahora(),
    )
    await this.usuarios.guardar(usuario)
    return aUsuarioDTO(usuario)
  }
}
