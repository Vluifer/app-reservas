import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { AHORA, datosApartamento } from '../../../../tests/fabricas'
import { bd, crearUsuario, limpiarBaseDeDatos } from '../../../../tests/integracion/bd'
import { Dinero } from '@/shared/domain/Dinero'
import { ConflictoDeConcurrenciaError } from '@/shared/domain/errores'
import { aDatosApartamento, type DatosApartamentoInput } from '../application/ApartamentoDTO'
import { Apartamento } from '../domain/Apartamento'
import { PrismaApartamentoRepository } from './PrismaApartamentoRepository'

describe('PrismaApartamentoRepository (PostgreSQL real)', () => {
  const repo = new PrismaApartamentoRepository(bd)
  let propietarioId: string

  async function publicar(cambios: Partial<DatosApartamentoInput> = {}, minutosDespues = 0) {
    const creado = new Date(AHORA.getTime() + minutosDespues * 60_000)
    const apartamento = Apartamento.publicar(propietarioId, aDatosApartamento(datosApartamento(cambios)), creado)
    await repo.guardar(apartamento)
    return apartamento
  }

  beforeEach(async () => {
    await limpiarBaseDeDatos()
    propietarioId = (await crearUsuario('PROPIETARIO')).id
  })

  afterAll(() => bd.$disconnect())

  it('guarda y reconstruye el agregado completo, sincronizando las imágenes', async () => {
    const apartamento = await publicar({ precioPorNoche: 150.5, amenidades: ['wifi', 'piscina'], politicaCancelacion: 'MODERADA' })
    apartamento.agregarImagenes([
      { url: 'https://img/1.jpg', publicId: 'p1' },
      { url: 'https://img/2.jpg', publicId: 'p2' },
    ])
    await repo.guardar(apartamento)

    const leido = await repo.buscarPorId(apartamento.id)
    expect(leido?.instantanea()).toEqual(apartamento.instantanea())

    leido!.quitarImagen(leido!.imagenes[0].id)
    await repo.guardar(leido!)

    const imagenes = await bd.imagen.findMany({ where: { apartamentoId: apartamento.id } })
    expect(imagenes).toHaveLength(1)
    expect(imagenes[0]).toMatchObject({ publicId: 'p2', orden: 0, esPrincipal: true })
  })

  it('busca por varios ids en cualquier estado', async () => {
    const uno = await publicar()
    const otro = await publicar()
    otro.cambiarEstado('ELIMINADO')
    await repo.guardar(otro)

    const encontrados = await repo.buscarPorIds([uno.id, otro.id, 'no-existe'])
    expect(encontrados.map((a) => a.id).sort()).toEqual([uno.id, otro.id].sort())
    expect(await repo.buscarPorIds([])).toEqual([])
  })

  it('cuenta las ciudades con oferta activa, de más a menos', async () => {
    await publicar({ ciudad: 'Cali' })
    await publicar({ ciudad: 'Bogotá' })
    await publicar({ ciudad: 'BOGOTÁ' })
    const inactivo = await publicar({ ciudad: 'Cartagena' })
    inactivo.cambiarEstado('INACTIVO')
    await repo.guardar(inactivo)

    expect(await repo.ciudadesConOferta(5)).toEqual([
      { ciudad: 'Bogotá', total: 2 },
      { ciudad: 'Cali', total: 1 },
    ])
    expect(await repo.ciudadesConOferta(1)).toHaveLength(1)
  })

  it('busca activos con filtros, exclusiones y paginación', async () => {
    const barato = await publicar({ ciudad: 'Medellín', capacidad: 2, precioPorNoche: 80 }, 1)
    const grande = await publicar({ ciudad: 'MEDELLÍN', capacidad: 6, precioPorNoche: 200 }, 2)
    const cali = await publicar({ ciudad: 'Cali', capacidad: 6, precioPorNoche: 150 }, 3)
    const inactivo = await publicar({ ciudad: 'Medellín' }, 4)
    inactivo.cambiarEstado('INACTIVO')
    await repo.guardar(inactivo)

    const ids = async (criterios: Parameters<typeof repo.buscarActivos>[0]) =>
      (await repo.buscarActivos(criterios)).items.map((a) => a.id)

    expect(await ids({ pagina: 1, porPagina: 10 })).toEqual([cali.id, grande.id, barato.id])
    expect(await ids({ ciudad: 'medell', pagina: 1, porPagina: 10 })).toEqual([grande.id, barato.id])
    expect(await ids({ huespedes: 5, pagina: 1, porPagina: 10 })).toEqual([cali.id, grande.id])
    expect(await ids({ precioMaximo: Dinero.desde(100), pagina: 1, porPagina: 10 })).toEqual([barato.id])
    expect(await ids({ excluirIds: [cali.id], pagina: 1, porPagina: 10 })).toEqual([grande.id, barato.id])

    const segundaPagina = await repo.buscarActivos({ pagina: 2, porPagina: 2 })
    expect(segundaPagina).toMatchObject({ total: 3, totalPaginas: 2 })
    expect(segundaPagina.items.map((a) => a.id)).toEqual([barato.id])
  })

  it('el listado del propietario excluye los eliminados', async () => {
    const visible = await publicar()
    const eliminado = await publicar()
    eliminado.cambiarEstado('ELIMINADO')
    await repo.guardar(eliminado)

    expect((await repo.listarPorPropietario(propietarioId)).map((a) => a.id)).toEqual([visible.id])
  })

  it('bloqueo optimista: de dos copias leídas a la vez, solo la primera en guardar gana', async () => {
    const { id } = await publicar()
    const [a, b] = [(await repo.buscarPorId(id))!, (await repo.buscarPorId(id))!]

    a.agregarImagenes([{ url: 'https://img/a.jpg', publicId: 'a' }])
    await repo.guardar(a)
    b.agregarImagenes([{ url: 'https://img/b.jpg', publicId: 'b' }])
    await expect(repo.guardar(b)).rejects.toThrow(ConflictoDeConcurrenciaError)

    expect((await bd.imagen.findMany({ where: { apartamentoId: id } })).map((i) => i.publicId)).toEqual(['a'])
    const version = async () => (await bd.apartamento.findUniqueOrThrow({ where: { id } })).version
    expect(await version()).toBe(1)

    // La copia que ganó puede seguir guardando: el repositorio actualizó su versión
    a.cambiarEstado('INACTIVO')
    await repo.guardar(a)
    expect(await version()).toBe(2)
  })

  it('bloqueo optimista: dos guardados realmente simultáneos no se pisan', async () => {
    const { id } = await publicar()
    const copias = await Promise.all(Array.from({ length: 5 }, () => repo.buscarPorId(id)))
    copias.forEach((copia, i) => copia!.agregarImagenes([{ url: `https://img/${i}.jpg`, publicId: `p${i}` }]))

    const resultados = await Promise.allSettled(copias.map((copia) => repo.guardar(copia!)))

    const rechazados = resultados.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(rechazados).toHaveLength(4)
    rechazados.forEach((r) => expect(r.reason).toBeInstanceOf(ConflictoDeConcurrenciaError))
    expect(await bd.imagen.count({ where: { apartamentoId: id } })).toBe(1)
  })
})
