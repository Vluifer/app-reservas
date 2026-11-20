import { beforeEach, describe, expect, it } from 'vitest'
import { AHORA, datosApartamento, propietario } from '../../../../tests/fabricas'
import { aDatosApartamento } from '@/modules/apartamentos/application/ApartamentoDTO'
import { Apartamento } from '@/modules/apartamentos/domain/Apartamento'
import { EnMemoriaApartamentoRepository } from '@/modules/apartamentos/infrastructure/memoria'
import { CatalogoApartamentosDesdeRepositorio } from './CatalogoApartamentosDesdeRepositorio'

describe('CatalogoApartamentosDesdeRepositorio (capa anticorrupción)', () => {
  let repo: EnMemoriaApartamentoRepository
  let catalogo: CatalogoApartamentosDesdeRepositorio

  async function publicar(cambios = {}) {
    const apartamento = Apartamento.publicar(propietario.id, aDatosApartamento(datosApartamento(cambios)), AHORA)
    await repo.crear(apartamento)
    return apartamento
  }

  beforeEach(() => {
    repo = new EnMemoriaApartamentoRepository()
    catalogo = new CatalogoApartamentosDesdeRepositorio(repo)
  })

  it('traduce el apartamento a lo mínimo que necesita reservas', async () => {
    const { id } = await publicar({ politicaCancelacion: 'MODERADA' })
    const reservable = await catalogo.obtenerReservable(id)

    expect(reservable).toMatchObject({
      id,
      nombre: 'Loft en el centro',
      propietarioId: propietario.id,
      capacidad: 4,
      activo: true,
      politicaCancelacion: 'MODERADA',
    })
    expect(reservable?.precioPorNoche.valor()).toBe(100)
    expect(reservable?.tarifaLimpieza.valor()).toBe(50)
    // No se filtran datos internos del catálogo (dirección, imágenes, etc.)
    expect(Object.keys(reservable ?? {}).sort()).toEqual(
      ['activo', 'capacidad', 'id', 'nombre', 'politicaCancelacion', 'precioPorNoche', 'propietarioId', 'tarifaLimpieza'],
    )
  })

  it('un apartamento no activo se marca como no reservable', async () => {
    const apartamento = await publicar()
    apartamento.cambiarEstado('MANTENIMIENTO')
    await repo.guardar(apartamento)

    expect((await catalogo.obtenerReservable(apartamento.id))?.activo).toBe(false)
  })

  it('devuelve null si el apartamento no existe', async () => {
    expect(await catalogo.obtenerReservable('no-existe')).toBeNull()
  })
})
