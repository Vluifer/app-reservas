import { beforeEach, describe, expect, it } from 'vitest'
import { AutenticarUsuario } from './application/AutenticarUsuario'
import { RegistrarUsuario } from './application/RegistrarUsuario'
import { CredencialesInvalidasError, EmailYaRegistradoError } from './domain/errores'
import { EnMemoriaUsuarioRepository, PasswordHasherFalso } from './infrastructure/memoria'

describe('Módulo identidad', () => {
  let usuarios: EnMemoriaUsuarioRepository
  let registrar: RegistrarUsuario
  let autenticar: AutenticarUsuario

  beforeEach(() => {
    usuarios = new EnMemoriaUsuarioRepository()
    const hasher = new PasswordHasherFalso()
    registrar = new RegistrarUsuario(usuarios, hasher)
    autenticar = new AutenticarUsuario(usuarios, hasher)
  })

  const datos = { nombre: 'Laura', email: '  Laura@Correo.com ', password: 'secreta123' }

  describe('RegistrarUsuario', () => {
    it('crea un CLIENTE por defecto con el email normalizado y la contraseña cifrada', async () => {
      const usuario = await registrar.ejecutar(datos)

      expect(usuario).toMatchObject({ email: 'laura@correo.com', rol: 'CLIENTE' })
      expect(usuario).not.toHaveProperty('passwordHash')
      expect((await usuarios.buscarPorId(usuario.id))?.passwordHash).toBe('hash:secreta123')
    })

    it('permite registrarse como PROPIETARIO', async () => {
      expect((await registrar.ejecutar({ ...datos, rol: 'PROPIETARIO' })).rol).toBe('PROPIETARIO')
    })

    it('no permite auto-asignarse el rol ADMIN', async () => {
      await expect(registrar.ejecutar({ ...datos, rol: 'ADMIN' })).rejects.toThrow('Rol no permitido')
    })

    it('rechaza emails repetidos sin importar mayúsculas', async () => {
      await registrar.ejecutar(datos)
      await expect(registrar.ejecutar({ ...datos, email: 'LAURA@correo.com' })).rejects.toThrow(EmailYaRegistradoError)
    })

    it('exige contraseñas de al menos 8 caracteres', async () => {
      await expect(registrar.ejecutar({ ...datos, password: '1234567' })).rejects.toThrow('al menos 8')
    })
  })

  describe('AutenticarUsuario', () => {
    beforeEach(async () => {
      await registrar.ejecutar(datos)
    })

    it('devuelve el usuario con credenciales correctas', async () => {
      const usuario = await autenticar.ejecutar({ email: 'laura@correo.com', password: 'secreta123' })
      expect(usuario.nombre).toBe('Laura')
    })

    it('responde el mismo error si la contraseña es incorrecta o el email no existe', async () => {
      await expect(autenticar.ejecutar({ email: 'laura@correo.com', password: 'otra' })).rejects.toThrow(
        CredencialesInvalidasError,
      )
      await expect(autenticar.ejecutar({ email: 'nadie@correo.com', password: 'secreta123' })).rejects.toThrow(
        CredencialesInvalidasError,
      )
      await expect(autenticar.ejecutar({ email: 'no-es-email', password: 'x' })).rejects.toThrow(
        CredencialesInvalidasError,
      )
    })
  })
})
