import type { Actor, ActorIdentificado, Rol } from '@/shared/domain/Actor'
import { nuevoId } from '@/shared/domain/comunes'
import { asegurar } from '@/shared/domain/errores'
import type { ImagenAlmacenada } from '@/shared/domain/imagenes'
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
  foto: ImagenAlmacenada | null
  creadoEn: Date
}

export class Usuario {
  private constructor(private readonly props: UsuarioProps) {}

  static registrar(
    datos: { nombre: string; email: string; passwordHash: string; telefono?: string | null; rol?: Rol },
    ahora: Date,
  ): Usuario {
    const rol = datos.rol ?? 'CLIENTE'
    asegurar(ROLES_REGISTRABLES.includes(rol), 'Rol no permitido en el registro')

    return new Usuario({
      id: nuevoId(),
      nombre: nombreValido(datos.nombre),
      email: Email.crear(datos.email),
      passwordHash: datos.passwordHash,
      telefono: telefonoNormalizado(datos.telefono),
      rol,
      foto: null,
      creadoEn: ahora,
    })
  }

  static reconstruir(props: UsuarioProps): Usuario {
    return new Usuario({ ...props, foto: props.foto ? { ...props.foto } : null })
  }

  get id() { return this.props.id }
  get nombre() { return this.props.nombre }
  get email() { return this.props.email }
  get passwordHash() { return this.props.passwordHash }
  get telefono() { return this.props.telefono }
  get rol() { return this.props.rol }
  get foto() { return this.props.foto }
  get creadoEn() { return this.props.creadoEn }

  /** Datos que la persona puede corregir en su perfil. El email y el rol no se cambian aquí. */
  actualizarPerfil(datos: { nombre: string; telefono?: string | null }): void {
    this.props.nombre = nombreValido(datos.nombre)
    this.props.telefono = telefonoNormalizado(datos.telefono)
  }

  /** Pone una foto nueva y devuelve la anterior (para borrarla del almacén), si había. */
  cambiarFoto(foto: ImagenAlmacenada): ImagenAlmacenada | null {
    const anterior = this.props.foto
    this.props.foto = { ...foto }
    return anterior
  }

  /** Quita la foto y la devuelve (para borrarla del almacén), si había. */
  quitarFoto(): ImagenAlmacenada | null {
    const anterior = this.props.foto
    this.props.foto = null
    return anterior
  }

  comoActor(): Actor & ActorIdentificado {
    return { id: this.id, rol: this.rol, nombre: this.nombre, email: this.email.valor }
  }
}

function nombreValido(nombre: string): string {
  const limpio = nombre.trim().replace(/\s+/g, ' ')
  asegurar(limpio.length >= 2, 'El nombre debe tener al menos 2 caracteres')
  return limpio
}

function telefonoNormalizado(telefono?: string | null): string | null {
  return telefono?.trim() || null
}

/** La contraseña se valida en texto plano, antes de convertirla en hash. */
export function validarPassword(password: string): void {
  asegurar(
    password.length >= LONGITUD_MINIMA_PASSWORD,
    `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres`,
  )
}
