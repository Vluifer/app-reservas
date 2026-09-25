import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { AHORA, datosApartamento, RelojFijo } from '../../../../tests/fabricas'
import { bd, crearUsuario, limpiarBaseDeDatos } from '../../../../tests/integracion/bd'
import { aDatosApartamento } from '@/modules/apartamentos/application/ApartamentoDTO'
import { Apartamento } from '@/modules/apartamentos/domain/Apartamento'
import { PrismaApartamentoRepository } from '@/modules/apartamentos/infrastructure/PrismaApartamentoRepository'
import type { ActorIdentificado } from '@/shared/domain/Actor'
import { ConflictoDeConcurrenciaError } from '@/shared/domain/errores'
import { RangoFechas } from '@/shared/domain/RangoFechas'
import { AvanzarEstadias, CancelarReserva, ConfirmarReserva } from '../application/GestionReservas'
import { CrearReserva, type CrearReservaInput } from '../application/SolicitudReserva'
import { FechasNoDisponiblesError } from '../domain/errores'
import { CatalogoApartamentosDesdeRepositorio } from './CatalogoApartamentosDesdeRepositorio'
import { PrismaReservaRepository } from './PrismaReservaRepository'

describe('PrismaReservaRepository (PostgreSQL real)', () => {
  const repo = new PrismaReservaRepository(bd)
  const apartamentosRepo = new PrismaApartamentoRepository(bd)
  const reloj = new RelojFijo(AHORA)
  const crear = new CrearReserva(repo, new CatalogoApartamentosDesdeRepositorio(apartamentosRepo), reloj)

  let apartamentoId: string
  let propietario: ActorIdentificado
  let cliente: ActorIdentificado

  const solicitud = (cambios: Partial<CrearReservaInput> = {}): CrearReservaInput => ({
    apartamentoId,
    llegada: '2030-01-20',
    salida: '2030-01-23',
    numAdultos: 2,
    numNinos: 1,
    ...cambios,
  })

  beforeEach(async () => {
    await limpiarBaseDeDatos()
    propietario = await crearUsuario('PROPIETARIO')
    cliente = await crearUsuario('CLIENTE')
    const apartamento = Apartamento.publicar(propietario.id, aDatosApartamento(datosApartamento()), AHORA)
    await apartamentosRepo.guardar(apartamento)
    apartamentoId = apartamento.id
  })

  afterAll(() => bd.$disconnect())

  it('guarda y recupera la reserva con fechas y precios exactos', async () => {
    const creada = await crear.ejecutar(cliente, solicitud({ telefono: '3001234567', notas: 'Hola' }))
    const leida = await repo.buscarPorId(creada.id)

    expect(leida?.instantanea()).toMatchObject({
      codigo: creada.codigo,
      estado: 'PENDIENTE',
      apartamentoNombre: 'Loft en el centro',
      propietarioId: propietario.id,
      cliente: { id: cliente.id, telefono: '3001234567' },
      notasCliente: 'Hola',
    })
    expect(leida?.rango.inicio.toISOString()).toBe('2030-01-20T00:00:00.000Z')
    expect(leida?.instantanea().precio.total.valor()).toBe(452.2)
  })

  it('NO permite dobles reservas aunque las solicitudes lleguen al mismo tiempo', async () => {
    const clientes = await Promise.all(Array.from({ length: 8 }, () => crearUsuario('CLIENTE')))

    const resultados = await Promise.allSettled(clientes.map((c) => crear.ejecutar(c, solicitud())))

    const exitosas = resultados.filter((r) => r.status === 'fulfilled')
    const rechazadas = resultados.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(exitosas).toHaveLength(1)
    expect(rechazadas).toHaveLength(7)
    rechazadas.forEach((r) => expect(r.reason).toBeInstanceOf(FechasNoDisponiblesError))
    expect(await bd.reserva.count()).toBe(1)
  })

  it('considera ocupadas las confirmadas y las pendientes vigentes, pero no las vencidas', async () => {
    const pendiente = await crear.ejecutar(cliente, solicitud())
    const rango = RangoFechas.crear('2030-01-21', '2030-01-22')
    const mananaPasado = new Date(AHORA.getTime() + 48 * 3_600_000)

    expect(await repo.hayConflicto(apartamentoId, rango, AHORA)).toBe(true)
    expect(await repo.hayConflicto(apartamentoId, rango, mananaPasado)).toBe(false)
    expect(await repo.apartamentosOcupados(rango, AHORA)).toEqual([apartamentoId])
    expect((await repo.listarPendientesVencidas(mananaPasado)).map((r) => r.id)).toEqual([pendiente.id])

    await new ConfirmarReserva(repo, reloj).ejecutar(propietario, pendiente.id)
    expect(await repo.hayConflicto(apartamentoId, rango, mananaPasado)).toBe(true)
  })

  it('persiste la cancelación con su reembolso y libera las fechas', async () => {
    const { id } = await crear.ejecutar(cliente, solicitud())
    await new ConfirmarReserva(repo, reloj).ejecutar(propietario, id)
    await new CancelarReserva(repo, reloj).ejecutar(cliente, id)

    const fila = await bd.reserva.findUniqueOrThrow({ where: { id } })
    expect(fila.estado).toBe('CANCELADA')
    expect(fila.montoReembolso?.toString()).toBe('452.2')
    expect(fila.confirmadaEn).not.toBeNull()
    expect(await repo.fechasOcupadas(apartamentoId, AHORA)).toEqual([])
  })

  it('lista reservas por cliente y por propietario', async () => {
    await crear.ejecutar(cliente, solicitud())
    expect(await repo.listarPorCliente(cliente.id)).toHaveLength(1)
    expect(await repo.listarPorPropietario(propietario.id)).toHaveLength(1)
    expect(await repo.listarPorPropietario(cliente.id)).toHaveLength(0)
  })

  it('lista las estadías por avanzar según el día de llegada y de salida (hora de Bogotá)', async () => {
    const { id } = await crear.ejecutar(cliente, solicitud())
    await new ConfirmarReserva(repo, reloj).ejecutar(propietario, id)
    const vispera = new Date('2030-01-20T04:59:00Z') // 19 de enero, 23:59 en Bogotá
    const llegada = new Date('2030-01-20T15:00:00Z')
    const salida = new Date('2030-01-23T15:00:00Z')

    expect(await repo.listarEstadiasPorAvanzar(vispera)).toEqual([])
    expect((await repo.listarEstadiasPorAvanzar(llegada)).map((r) => r.id)).toEqual([id])

    await new AvanzarEstadias(repo, new RelojFijo(llegada)).ejecutar()
    expect((await bd.reserva.findUniqueOrThrow({ where: { id } })).estado).toBe('EN_CURSO')
    expect(await repo.listarEstadiasPorAvanzar(llegada)).toEqual([])
    expect(await repo.hayConflicto(apartamentoId, RangoFechas.crear('2030-01-21', '2030-01-22'), llegada)).toBe(true)
    expect((await repo.listarEstadiasPorAvanzar(salida)).map((r) => r.id)).toEqual([id])
  })

  it('bloqueo optimista: una confirmación y una cancelación simultáneas no se pisan', async () => {
    const { id } = await crear.ejecutar(cliente, solicitud())
    const [paraConfirmar, paraCancelar] = [(await repo.buscarPorId(id))!, (await repo.buscarPorId(id))!]

    paraConfirmar.confirmar(AHORA)
    paraCancelar.cancelar(AHORA)
    const resultados = await Promise.allSettled([repo.guardar(paraConfirmar), repo.guardar(paraCancelar)])

    const rechazados = resultados.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(rechazados).toHaveLength(1)
    expect(rechazados[0].reason).toBeInstanceOf(ConflictoDeConcurrenciaError)

    const fila = await bd.reserva.findUniqueOrThrow({ where: { id } })
    expect(fila.version).toBe(1)
    // Queda un estado coherente: o confirmada (con fecha) o cancelada (sin fecha de confirmación)
    expect(fila.estado === 'CONFIRMADA' ? fila.canceladaEn : fila.confirmadaEn).toBeNull()
  })

  it('bloqueo optimista: la copia que ganó puede seguir guardando', async () => {
    const { id } = await crear.ejecutar(cliente, solicitud())
    const reserva = (await repo.buscarPorId(id))!

    reserva.confirmar(AHORA)
    await repo.guardar(reserva)
    reserva.cancelar(AHORA)
    await repo.guardar(reserva)

    expect(await bd.reserva.findUniqueOrThrow({ where: { id } })).toMatchObject({ estado: 'CANCELADA', version: 2 })
  })
})
