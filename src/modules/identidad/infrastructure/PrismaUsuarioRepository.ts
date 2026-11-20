import { Prisma, type PrismaClient, type Usuario as FilaUsuario } from '@prisma/client'
import { Email } from '../domain/Email'
import { EmailYaRegistradoError } from '../domain/errores'
import type { UsuarioRepository } from '../domain/puertos'
import { Usuario } from '../domain/Usuario'

export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly db: PrismaClient) {}

  async buscarPorId(id: string): Promise<Usuario | null> {
    const fila = await this.db.usuario.findUnique({ where: { id } })
    return fila ? aDominio(fila) : null
  }

  async buscarPorEmail(email: Email): Promise<Usuario | null> {
    const fila = await this.db.usuario.findUnique({ where: { email: email.valor } })
    return fila ? aDominio(fila) : null
  }

  async guardar(usuario: Usuario): Promise<void> {
    const datos = {
      nombre: usuario.nombre,
      email: usuario.email.valor,
      password: usuario.passwordHash,
      telefono: usuario.telefono,
      rol: usuario.rol,
      fotoUrl: usuario.foto?.url ?? null,
      fotoPublicId: usuario.foto?.publicId ?? null,
    }
    try {
      await this.db.usuario.upsert({
        where: { id: usuario.id },
        create: { id: usuario.id, createdAt: usuario.creadoEn, ...datos },
        update: datos,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new EmailYaRegistradoError()
      }
      throw error
    }
  }
}

function aDominio(fila: FilaUsuario): Usuario {
  return Usuario.reconstruir({
    id: fila.id,
    nombre: fila.nombre,
    email: Email.crear(fila.email),
    passwordHash: fila.password,
    telefono: fila.telefono,
    rol: fila.rol,
    foto: fila.fotoUrl && fila.fotoPublicId ? { url: fila.fotoUrl, publicId: fila.fotoPublicId } : null,
    creadoEn: fila.createdAt,
  })
}
