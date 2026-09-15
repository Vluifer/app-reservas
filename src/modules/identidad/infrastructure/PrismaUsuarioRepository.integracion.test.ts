import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { AHORA } from '../../../../tests/fabricas'
import { bd, limpiarBaseDeDatos } from '../../../../tests/integracion/bd'
import { Email } from '../domain/Email'
import { EmailYaRegistradoError } from '../domain/errores'
import { Usuario } from '../domain/Usuario'
import { BcryptPasswordHasher } from './BcryptPasswordHasher'
import { PrismaUsuarioRepository } from './PrismaUsuarioRepository'

describe('PrismaUsuarioRepository (PostgreSQL real)', () => {
  const repo = new PrismaUsuarioRepository(bd)

  beforeEach(() => limpiarBaseDeDatos())
  afterAll(() => bd.$disconnect())

  it('guarda un usuario y lo encuentra por email', async () => {
    const hasher = new BcryptPasswordHasher(4)
    const usuario = Usuario.registrar(
      { nombre: 'Laura', email: 'laura@correo.com', passwordHash: await hasher.hash('secreta123'), rol: 'PROPIETARIO' },
      AHORA,
    )
    await repo.guardar(usuario)

    const leido = await repo.buscarPorEmail(Email.crear('LAURA@correo.com'))
    expect(leido?.comoActor()).toEqual({ id: usuario.id, rol: 'PROPIETARIO', nombre: 'Laura', email: 'laura@correo.com' })
    expect(await hasher.coincide('secreta123', leido!.passwordHash)).toBe(true)
  })

  it('traduce el email duplicado de la base de datos a un error de dominio', async () => {
    const datos = { nombre: 'Laura', email: 'laura@correo.com', passwordHash: 'x' }
    await repo.guardar(Usuario.registrar(datos, AHORA))
    await expect(repo.guardar(Usuario.registrar(datos, AHORA))).rejects.toThrow(EmailYaRegistradoError)
  })
})
