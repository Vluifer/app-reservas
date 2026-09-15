import { beforeEach, describe, expect, it } from 'vitest'
import { AHORA, admin, cliente, datosApartamento, otroPropietario, propietario, RelojFijo } from '../../../tests/fabricas'
import { NoAutorizadoError, NoEncontradoError } from '@/shared/domain/errores'
import { BuscarApartamentos, ObtenerApartamento } from './application/ConsultasApartamentos'
import {
  ActualizarApartamento,
  CambiarEstadoApartamento,
  ListarApartamentosDePropietario,
  PublicarApartamento,
} from './application/GestionApartamentos'
import { EliminarImagenApartamento, SubirImagenesApartamento } from './application/ImagenesApartamento'
import type { ArchivoImagen, ConsultaOcupacion } from './domain/puertos'
import { AlmacenImagenesFalso, EnMemoriaApartamentoRepository } from './infrastructure/memoria'

function imagen(nombre: string, cambios: Partial<ArchivoImagen> = {}): ArchivoImagen {
  return { nombre, tipo: 'image/jpeg', tamano: 1000, contenido: new ArrayBuffer(8), ...cambios }
}

describe('Módulo apartamentos', () => {
  let repo: EnMemoriaApartamentoRepository
  let almacen: AlmacenImagenesFalso
  let ocupados: string[]
  const ocupacion: ConsultaOcupacion = { apartamentosOcupados: async () => ocupados }

  let publicar: PublicarApartamento

  beforeEach(() => {
    repo = new EnMemoriaApartamentoRepository()
    almacen = new AlmacenImagenesFalso()
    ocupados = []
    publicar = new PublicarApartamento(repo, new RelojFijo(AHORA))
  })

  describe('Publicar y editar', () => {
    it('un propietario publica un apartamento activo', async () => {
      const apartamento = await publicar.ejecutar(propietario, datosApartamento())
      expect(apartamento).toMatchObject({ estado: 'ACTIVO', propietarioId: propietario.id, precioPorNoche: 100 })
    })

    it('un cliente no puede publicar', async () => {
      await expect(publicar.ejecutar(cliente, datosApartamento())).rejects.toThrow(NoAutorizadoError)
    })

    it('valida las reglas del apartamento', async () => {
      await expect(publicar.ejecutar(propietario, datosApartamento({ capacidad: 0 }))).rejects.toThrow('capacidad')
      await expect(publicar.ejecutar(propietario, datosApartamento({ precioPorNoche: 0 }))).rejects.toThrow('precio')
      await expect(publicar.ejecutar(propietario, datosApartamento({ descripcion: 'corta' }))).rejects.toThrow(
        'descripción',
      )
    })

    it('limpia y quita duplicados de las amenidades', async () => {
      const a = await publicar.ejecutar(propietario, datosApartamento({ amenidades: [' wifi', 'wifi', '', 'tv'] }))
      expect(a.amenidades).toEqual(['wifi', 'tv'])
    })

    it('solo el dueño o un admin pueden editarlo', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      const actualizar = new ActualizarApartamento(repo)

      await expect(actualizar.ejecutar(otroPropietario, id, datosApartamento({ nombre: 'Hackeado' }))).rejects.toThrow(
        NoAutorizadoError,
      )
      expect((await actualizar.ejecutar(admin, id, datosApartamento({ nombre: 'Editado por admin' }))).nombre).toBe(
        'Editado por admin',
      )
    })

    it('un apartamento eliminado desaparece del listado del propietario', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      await new CambiarEstadoApartamento(repo).ejecutar(propietario, id, 'ELIMINADO')

      expect(await new ListarApartamentosDePropietario(repo).ejecutar(propietario)).toEqual([])
      await expect(new CambiarEstadoApartamento(repo).ejecutar(propietario, id, 'ACTIVO')).rejects.toThrow(
        NoEncontradoError,
      )
    })
  })

  describe('Consultas', () => {
    it('un apartamento inactivo solo lo ve su propietario', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      await new CambiarEstadoApartamento(repo).ejecutar(propietario, id, 'INACTIVO')
      const obtener = new ObtenerApartamento(repo)

      await expect(obtener.ejecutar(id, null)).rejects.toThrow(NoEncontradoError)
      await expect(obtener.ejecutar(id, cliente)).rejects.toThrow(NoEncontradoError)
      expect((await obtener.ejecutar(id, propietario)).estado).toBe('INACTIVO')
    })

    it('busca por ciudad y huéspedes, y excluye los ocupados en las fechas pedidas', async () => {
      const medellin = await publicar.ejecutar(propietario, datosApartamento({ ciudad: 'Medellín', capacidad: 2 }))
      const grande = await publicar.ejecutar(propietario, datosApartamento({ ciudad: 'Medellín', capacidad: 6 }))
      await publicar.ejecutar(propietario, datosApartamento({ ciudad: 'Cali', capacidad: 6 }))
      const buscar = new BuscarApartamentos(repo, ocupacion, new RelojFijo())

      const porCiudad = await buscar.ejecutar({ ciudad: 'medellín' })
      expect(porCiudad.total).toBe(2)

      const porHuespedes = await buscar.ejecutar({ ciudad: 'medellín', huespedes: 4 })
      expect(porHuespedes.items.map((a) => a.id)).toEqual([grande.id])

      ocupados = [grande.id]
      const disponibles = await buscar.ejecutar({ ciudad: 'medellín', llegada: '2030-02-01', salida: '2030-02-03' })
      expect(disponibles.items.map((a) => a.id)).toEqual([medellin.id])
    })
  })

  describe('Imágenes', () => {
    it('sube imágenes y la primera queda como principal', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      const resultado = await new SubirImagenesApartamento(repo, almacen).ejecutar(propietario, id, [
        imagen('a.jpg'),
        imagen('b.jpg'),
      ])

      expect(resultado.imagenes.map((i) => i.esPrincipal)).toEqual([true, false])
      expect(resultado.imagenPrincipal).toContain('a.jpg')
    })

    it('rechaza formatos no permitidos antes de subir nada', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      await expect(
        new SubirImagenesApartamento(repo, almacen).ejecutar(propietario, id, [imagen('doc.pdf', { tipo: 'application/pdf' })]),
      ).rejects.toThrow('formato no permitido')
      expect(almacen.subidas).toEqual([])
    })

    it('si falla una subida, borra del almacén las que sí se subieron', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      almacen.fallarDespuesDe = 1

      await expect(
        new SubirImagenesApartamento(repo, almacen).ejecutar(propietario, id, [imagen('a.jpg'), imagen('b.jpg')]),
      ).rejects.toThrow('Fallo simulado')
      expect(almacen.eliminadas).toEqual(almacen.subidas)
      expect((await repo.buscarPorId(id))?.imagenes).toHaveLength(0)
    })

    it('al eliminar la imagen principal, la siguiente pasa a ser principal', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      const conImagenes = await new SubirImagenesApartamento(repo, almacen).ejecutar(propietario, id, [
        imagen('a.jpg'),
        imagen('b.jpg'),
      ])

      const resultado = await new EliminarImagenApartamento(repo, almacen).ejecutar(
        propietario,
        id,
        conImagenes.imagenes[0].id,
      )
      expect(resultado.imagenes).toHaveLength(1)
      expect(resultado.imagenes[0]).toMatchObject({ id: conImagenes.imagenes[1].id, esPrincipal: true })
      expect(almacen.eliminadas).toHaveLength(1)
    })
  })
})
