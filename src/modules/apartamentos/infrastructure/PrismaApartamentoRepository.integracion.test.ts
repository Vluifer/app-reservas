import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { AHORA, datosApartamento } from '../../../../tests/fabricas'
import { bd, crearUsuario, limpiarBaseDeDatos } from '../../../../tests/integracion/bd'
import { Dinero } from '@/shared/domain/Dinero'
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
})
