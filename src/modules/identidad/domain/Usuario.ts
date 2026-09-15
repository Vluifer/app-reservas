import type { Actor, ActorIdentificado, Rol } from '@/shared/domain/Actor'
import { nuevoId } from '@/shared/domain/comunes'
import { asegurar } from '@/shared/domain/errores'
import { Email } from './Email'

/** Roles que una persona puede elegir al registrarse. ADMIN solo se asigna manualmente. */
export const ROLES_REGISTRABLES: readonly Rol[] = ['CLIENTE', 'PROPIETARIO']

export const LONGITUD_MINIMA_PASSWORD = 8

export interface UsuarioProps {
  id: string
  nombre: string
  email: Email
  passwordHash: string
  telefono: string | null
  rol: Rol
  creadoEn: Date
}

export class Usuario {
  private constructor(private readonly props: UsuarioProps) {}

  static registrar(
    datos: { nombre: string; email: string; passwordHash: string; telefono?: string | null; rol?: Rol },
    ahora: Date,
  ): Usuario {
    const nombre = datos.nombre.trim()
    const rol = datos.rol ?? 'CLIENTE'
    asegurar(nombre.length >= 2, 'El nombre debe tener al menos 2 caracteres')
    asegurar(ROLES_REGISTRABLES.includes(rol), 'Rol no permitido en el registro')

    return new Usuario({
      id: nuevoId(),
      nombre,
      email: Email.crear(datos.email),
      passwordHash: datos.passwordHash,
      telefono: datos.telefono?.trim() || null,
      rol,
      creadoEn: ahora,
    })
  }

  static reconstruir(props: UsuarioProps): Usuario {
    return new Usuario({ ...props })
  }

  get id() { return this.props.id }
  get nombre() { return this.props.nombre }
  get email() { return this.props.email }
  get passwordHash() { return this.props.passwordHash }
  get telefono() { return this.props.telefono }
  get rol() { return this.props.rol }
  get creadoEn() { return this.props.creadoEn }

  comoActor(): Actor & ActorIdentificado {
    return { id: this.id, rol: this.rol, nombre: this.nombre, email: this.email.valor }
  }
}

/** La contraseña se valida en texto plano, antes de convertirla en hash. */
export function validarPassword(password: string): void {
  asegurar(
    password.length >= LONGITUD_MINIMA_PASSWORD,
    `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`,
  )
}
