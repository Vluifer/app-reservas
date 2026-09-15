import { PrismaClient } from '@prisma/client'
import type { ActorIdentificado, Rol } from '@/shared/domain/Actor'

/** Cliente de Prisma conectado a la base de PRUEBAS. */
export const bd = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL })

export async function limpiarBaseDeDatos() {
  await bd.$executeRawUnsafe('TRUNCATE TABLE "Reserva", "Imagen", "Apartamento", "Usuario" CASCADE')
}

/** Crea un usuario real en la base (las reservas y apartamentos necesitan la clave foránea). */
export async function crearUsuario(rol: Rol = 'CLIENTE'): Promise<ActorIdentificado> {
  const id = crypto.randomUUID()
  const usuario = { id, nombre: `Usuario ${rol.toLowerCase()}`, email: `${id}@prueba.com`, rol }
  await bd.usuario.create({ data: { ...usuario, password: 'no-usado' } })
  return usuario
}
