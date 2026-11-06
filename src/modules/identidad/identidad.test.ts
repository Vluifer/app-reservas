import { beforeEach, describe, expect, it } from 'vitest'
import type { Actor } from '@/shared/domain/Actor'
import { NoEncontradoError } from '@/shared/domain/errores'
import type { ArchivoImagen } from '@/shared/domain/imagenes'
import { AlmacenImagenesFalso } from '@/shared/infrastructure/memoria'
import { AutenticarUsuario } from './application/AutenticarUsuario'
import { ActualizarPerfil, CambiarFotoPerfil, ObtenerPerfil, QuitarFotoPerfil } from './application/Perfil'
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

  describe('Perfil', () => {
    let almacen: AlmacenImagenesFalso
    let actor: Actor

    const foto = (nombre: string, cambios: Partial<ArchivoImagen> = {}): ArchivoImagen => ({
      nombre,
      tipo: 'image/jpeg',
      tamano: 1000,
      contenido: new ArrayBuffer(8),
      ...cambios,
    })

    beforeEach(async () => {
      almacen = new AlmacenImagenesFalso()
      const usuario = await registrar.ejecutar({ ...datos, telefono: '300 123 4567' })
      actor = { id: usuario.id, rol: usuario.rol }
    })

    it('devuelve el perfil propio sin foto al principio', async () => {
      expect(await new ObtenerPerfil(usuarios).ejecutar(actor)).toMatchObject({ nombre: 'Laura', fotoUrl: null })
    })

    it('falla si la cuenta de la sesión ya no existe', async () => {
      await expect(new ObtenerPerfil(usuarios).ejecutar({ id: 'otro', rol: 'CLIENTE' })).rejects.toThrow(NoEncontradoError)
    })

    it('actualiza nombre (sin espacios de más) y teléfono, y deja vacío el teléfono en blanco', async () => {
      const perfil = await new ActualizarPerfil(usuarios).ejecutar(actor, { nombre: '  Laura   Gómez ', telefono: '  ' })
      expect(perfil).toMatchObject({ nombre: 'Laura Gómez', telefono: null, email: 'laura@correo.com' })
      expect((await usuarios.buscarPorId(actor.id))?.nombre).toBe('Laura Gómez')
    })

    it('exige un nombre de al menos 2 caracteres', async () => {
      await expect(new ActualizarPerfil(usuarios).ejecutar(actor, { nombre: ' L ' })).rejects.toThrow('al menos 2')
    })

    it('sube la foto y, al cambiarla, borra la anterior del almacén', async () => {
      const cambiar = new CambiarFotoPerfil(usuarios, almacen)
      await cambiar.ejecutar(actor, foto('a.jpg'))
      const perfil = await cambiar.ejecutar(actor, foto('b.jpg'))

      expect(perfil.fotoUrl).toBe(`https://imagenes.test/usuarios/${actor.id}/b.jpg`)
      expect(almacen.eliminadas).toEqual([`usuarios/${actor.id}/a.jpg`])
    })

    it('rechaza formatos no permitidos y archivos de más de 5 MB sin subir nada', async () => {
      const cambiar = new CambiarFotoPerfil(usuarios, almacen)
      await expect(cambiar.ejecutar(actor, foto('a.gif', { tipo: 'image/gif' }))).rejects.toThrow('formato no permitido')
      await expect(cambiar.ejecutar(actor, foto('a.jpg', { tamano: 6 * 1024 * 1024 }))).rejects.toThrow('5 MB')
      expect(almacen.subidas).toEqual([])
    })

    it('si no se puede guardar, borra del almacén la foto recién subida', async () => {
      const cambiar = new CambiarFotoPerfil(usuarios, almacen)
      await cambiar.ejecutar(actor, foto('a.jpg'))
      usuarios.guardar = async () => {
        throw new Error('Fallo simulado de la base de datos')
      }

      await expect(cambiar.ejecutar(actor, foto('b.jpg'))).rejects.toThrow('Fallo simulado')
      expect(almacen.eliminadas).toEqual([`usuarios/${actor.id}/b.jpg`])
    })

    it('quita la foto y la borra del almacén', async () => {
      await new CambiarFotoPerfil(usuarios, almacen).ejecutar(actor, foto('a.jpg'))
      const perfil = await new QuitarFotoPerfil(usuarios, almacen).ejecutar(actor)

      expect(perfil.fotoUrl).toBeNull()
      expect(almacen.eliminadas).toEqual([`usuarios/${actor.id}/a.jpg`])
    })
  })
})
