import { beforeEach, describe, expect, it } from 'vitest'
import { AHORA, admin, cliente, datosApartamento, otroPropietario, propietario, RelojFijo } from '../../../tests/fabricas'
import { ConflictoDeConcurrenciaError, NoAutorizadoError, NoEncontradoError } from '@/shared/domain/errores'
import { BuscarApartamentos, ObtenerApartamento, ObtenerFichasApartamentos, ObtenerVitrina } from './application/ConsultasApartamentos'
import {
  ActualizarApartamento,
  CambiarEstadoApartamento,
  ListarApartamentosDePropietario,
  ObtenerApartamentoParaGestion,
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

    it('la pantalla de administración solo la abre el dueño o un admin (a los demás: "no encontrado")', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      const obtener = new ObtenerApartamentoParaGestion(repo)

      expect((await obtener.ejecutar(propietario, id)).id).toBe(id)
      expect((await obtener.ejecutar(admin, id)).id).toBe(id)
      await expect(obtener.ejecutar(otroPropietario, id)).rejects.toThrow(NoEncontradoError)
      await expect(obtener.ejecutar(propietario, 'no-existe')).rejects.toThrow(NoEncontradoError)

      await new CambiarEstadoApartamento(repo).ejecutar(propietario, id, 'ELIMINADO')
      await expect(obtener.ejecutar(propietario, id)).rejects.toThrow(NoEncontradoError)
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

    it('las fichas incluyen apartamentos eliminados (el historial de reservas sigue mostrándolos)', async () => {
      const activo = await publicar.ejecutar(propietario, datosApartamento({ nombre: 'Activo' }))
      const eliminado = await publicar.ejecutar(propietario, datosApartamento({ nombre: 'Eliminado', ciudad: 'Cali' }))
      await new CambiarEstadoApartamento(repo).ejecutar(propietario, eliminado.id, 'ELIMINADO')

      const fichas = await new ObtenerFichasApartamentos(repo).ejecutar([activo.id, eliminado.id, activo.id, 'no-existe'])

      expect(fichas.size).toBe(2)
      expect(fichas.get(eliminado.id)).toMatchObject({ nombre: 'Eliminado', ciudad: 'Cali', imagenPrincipal: null })
    })

    it('la vitrina agrupa por las ciudades con más oferta activa', async () => {
      await publicar.ejecutar(propietario, datosApartamento({ ciudad: 'Cali' }))
      await publicar.ejecutar(propietario, datosApartamento({ ciudad: 'Medellín' }))
      await publicar.ejecutar(propietario, datosApartamento({ ciudad: 'Medellín' }))
      const oculto = await publicar.ejecutar(propietario, datosApartamento({ ciudad: 'Bogotá' }))
      await new CambiarEstadoApartamento(repo).ejecutar(propietario, oculto.id, 'INACTIVO')

      const vitrina = await new ObtenerVitrina(repo).ejecutar({ ciudades: 3, porFila: 1 })

      expect(vitrina.ciudades.map(({ ciudad, total }) => [ciudad, total])).toEqual([
        ['Medellín', 2],
        ['Cali', 1],
      ])
      expect(vitrina.ciudades[0].apartamentos).toHaveLength(1)
      expect(vitrina.recientes).toHaveLength(1)
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

    it('no permite pasar de 10 imágenes y lo verifica antes de subir nada', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      const subir = new SubirImagenesApartamento(repo, almacen)
      const varias = (n: number, prefijo: string) => Array.from({ length: n }, (_, i) => imagen(`${prefijo}${i}.jpg`))

      await expect(subir.ejecutar(propietario, id, varias(11, 'a'))).rejects.toThrow('máximo 10 imágenes')
      expect(almacen.subidas).toEqual([])

      await subir.ejecutar(propietario, id, varias(9, 'b'))
      await expect(subir.ejecutar(propietario, id, varias(2, 'c'))).rejects.toThrow('máximo 10 imágenes')
      expect(almacen.subidas).toHaveLength(9)
      expect((await subir.ejecutar(propietario, id, varias(1, 'd'))).imagenes).toHaveLength(10)
    })

    it('dos subidas simultáneas no superan el límite ni dejan imágenes huérfanas en el almacén', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      const subir = new SubirImagenesApartamento(repo, almacen)
      await subir.ejecutar(propietario, id, Array.from({ length: 9 }, (_, i) => imagen(`base${i}.jpg`)))

      // Las dos leen el apartamento con 9 imágenes: cada una, por separado, cabría
      const resultados = await Promise.allSettled([
        subir.ejecutar(propietario, id, [imagen('primera.jpg')]),
        subir.ejecutar(propietario, id, [imagen('segunda.jpg')]),
      ])

      expect(resultados.map((r) => r.status)).toEqual(['fulfilled', 'rejected'])
      expect(resultados[1]).toMatchObject({ reason: expect.any(ConflictoDeConcurrenciaError) })
      expect((await repo.buscarPorId(id))?.imagenes).toHaveLength(10)
      expect(almacen.eliminadas).toEqual([`apartamentos/${id}/segunda.jpg`])
    })

    it('rechaza imágenes de más de 5 MB y la subida vacía', async () => {
      const { id } = await publicar.ejecutar(propietario, datosApartamento())
      const subir = new SubirImagenesApartamento(repo, almacen)

      await expect(subir.ejecutar(propietario, id, [imagen('grande.jpg', { tamano: 5 * 1024 * 1024 + 1 })])).rejects.toThrow(
        '5 MB',
      )
      await expect(subir.ejecutar(propietario, id, [])).rejects.toThrow('al menos una imagen')
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
