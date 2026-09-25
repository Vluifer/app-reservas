import { beforeEach, describe, expect, it } from 'vitest'
import { apartamentoReservable, admin, cliente, otroCliente, propietario, RelojFijo } from '../../../tests/fabricas'
import { ConflictoDeConcurrenciaError, NoAutorizadoError, NoEncontradoError } from '@/shared/domain/errores'
import {
  ConsultarFechasOcupadas,
  ListarReservasDeCliente,
  ListarReservasDePropietario,
  ObtenerReserva,
} from './application/ConsultasReservas'
import {
  AvanzarEstadias,
  CancelarReserva,
  ConfirmarReserva,
  ExpirarReservasPendientes,
  RechazarReserva,
} from './application/GestionReservas'
import { CotizarReserva, CrearReserva, type CrearReservaInput } from './application/SolicitudReserva'
import { FechasNoDisponiblesError } from './domain/errores'
import { CatalogoApartamentosFalso, EnMemoriaReservaRepository } from './infrastructure/memoria'

describe('Módulo reservas', () => {
  let reloj: RelojFijo
  let repo: EnMemoriaReservaRepository
  let catalogo: CatalogoApartamentosFalso
  let crear: CrearReserva

  const solicitud = (cambios: Partial<CrearReservaInput> = {}): CrearReservaInput => ({
    apartamentoId: 'apto-1',
    llegada: '2030-01-20',
    salida: '2030-01-23',
    numAdultos: 2,
    numNinos: 0,
    ...cambios,
  })

  beforeEach(() => {
    reloj = new RelojFijo()
    repo = new EnMemoriaReservaRepository()
    catalogo = new CatalogoApartamentosFalso([apartamentoReservable()])
    crear = new CrearReserva(repo, catalogo, reloj)
  })

  describe('Crear y cotizar', () => {
    it('crea una reserva pendiente con los datos del cliente y el precio del servidor', async () => {
      const reserva = await crear.ejecutar(cliente, solicitud({ telefono: '3001234567', notas: 'Llegamos tarde' }))

      expect(reserva).toMatchObject({
        estado: 'PENDIENTE',
        clienteNombre: cliente.nombre,
        clienteTelefono: '3001234567',
        llegada: '2030-01-20',
        salida: '2030-01-23',
        precio: { noches: 3, total: 452.2 },
      })
    })

    it('impide la doble reserva de fechas que se solapan', async () => {
      await crear.ejecutar(cliente, solicitud())
      await expect(crear.ejecutar(otroCliente, solicitud({ llegada: '2030-01-22', salida: '2030-01-25' }))).rejects.toThrow(
        FechasNoDisponiblesError,
      )
    })

    it('permite reservar desde el mismo día en que sale el huésped anterior', async () => {
      await crear.ejecutar(cliente, solicitud())
      await expect(crear.ejecutar(otroCliente, solicitud({ llegada: '2030-01-23', salida: '2030-01-25' }))).resolves.toBeDefined()
    })

    it('una solicitud vencida sin confirmar libera las fechas', async () => {
      await crear.ejecutar(cliente, solicitud())
      reloj.avanzarHoras(25)
      await expect(crear.ejecutar(otroCliente, solicitud())).resolves.toBeDefined()
    })

    it('la cotización indica si las fechas están disponibles', async () => {
      const cotizar = new CotizarReserva(repo, catalogo, reloj)
      const fechas = { apartamentoId: 'apto-1', llegada: '2030-01-20', salida: '2030-01-23', numAdultos: 2, numNinos: 0 }

      expect(await cotizar.ejecutar(fechas)).toMatchObject({ disponible: true, precio: { total: 452.2 } })
      await crear.ejecutar(cliente, solicitud())
      expect((await cotizar.ejecutar(fechas)).disponible).toBe(false)
    })

    it('la cotización valida la capacidad, igual que la reserva', async () => {
      const cotizar = new CotizarReserva(repo, catalogo, reloj)
      const consulta = { apartamentoId: 'apto-1', llegada: '2030-01-20', salida: '2030-01-23' }

      await expect(cotizar.ejecutar({ ...consulta, numAdultos: 3, numNinos: 2 })).rejects.toThrow('máximo 4 huéspedes')
      await expect(cotizar.ejecutar({ ...consulta, numAdultos: 3, numNinos: 1 })).resolves.toMatchObject({ disponible: true })
    })

    it('la cotización rechaza fechas inválidas y apartamentos inexistentes', async () => {
      const cotizar = new CotizarReserva(repo, catalogo, reloj)
      const consulta = (cambios: object) => ({
        apartamentoId: 'apto-1',
        llegada: '2030-01-20',
        salida: '2030-01-23',
        numAdultos: 2,
        numNinos: 0,
        ...cambios,
      })

      await expect(cotizar.ejecutar(consulta({ llegada: '2030-01-05' }))).rejects.toThrow('pasado')
      await expect(cotizar.ejecutar(consulta({ salida: '2030-01-20' }))).rejects.toThrow('posterior a la de llegada')
      await expect(cotizar.ejecutar(consulta({ salida: '2030-04-21' }))).rejects.toThrow('máxima es de 90 noches')
      await expect(cotizar.ejecutar(consulta({ llegada: '2030-02-30' }))).rejects.toThrow('Fecha inválida')
      await expect(cotizar.ejecutar(consulta({ apartamentoId: 'no-existe' }))).rejects.toThrow(NoEncontradoError)
    })

    it('falla si el apartamento no existe o no está activo', async () => {
      await expect(crear.ejecutar(cliente, solicitud({ apartamentoId: 'no-existe' }))).rejects.toThrow(NoEncontradoError)

      catalogo = new CatalogoApartamentosFalso([apartamentoReservable({ activo: false })])
      await expect(new CrearReserva(repo, catalogo, reloj).ejecutar(cliente, solicitud())).rejects.toThrow(
        NoEncontradoError,
      )
    })

    it('muestra las fechas ocupadas del apartamento', async () => {
      await crear.ejecutar(cliente, solicitud())
      expect(await new ConsultarFechasOcupadas(repo, reloj).ejecutar('apto-1')).toEqual([
        { llegada: '2030-01-20', salida: '2030-01-23' },
      ])
    })
  })

  describe('Gestión', () => {
    it('solo el propietario (o un admin) confirma o rechaza', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())
      const confirmar = new ConfirmarReserva(repo, reloj)

      await expect(confirmar.ejecutar(cliente, id)).rejects.toThrow(NoAutorizadoError)
      expect((await confirmar.ejecutar(propietario, id)).estado).toBe('CONFIRMADA')

      const otra = await crear.ejecutar(otroCliente, solicitud({ llegada: '2030-02-01', salida: '2030-02-03' }))
      expect((await new RechazarReserva(repo, reloj).ejecutar(admin, otra.id)).estado).toBe('RECHAZADA')
    })

    it('el cliente cancela y recibe el reembolso según la política', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())
      await new ConfirmarReserva(repo, reloj).ejecutar(propietario, id)

      const cancelada = await new CancelarReserva(repo, reloj).ejecutar(cliente, id)
      expect(cancelada).toMatchObject({ estado: 'CANCELADA', montoReembolso: 452.2 })
    })

    it('el propietario también puede cancelar una reserva confirmada, con el mismo reembolso', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())
      await new ConfirmarReserva(repo, reloj).ejecutar(propietario, id)

      const cancelada = await new CancelarReserva(repo, reloj).ejecutar(propietario, id)
      expect(cancelada).toMatchObject({ estado: 'CANCELADA', montoReembolso: 452.2 })
    })

    it('no se puede cancelar una reserva cuya estadía ya empezó', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())
      await new ConfirmarReserva(repo, reloj).ejecutar(propietario, id)

      reloj.irA('2030-01-21T15:00:00Z')
      await expect(new CancelarReserva(repo, reloj).ejecutar(cliente, id)).rejects.toThrow('ya empezó')
      expect((await repo.buscarPorId(id))?.estado).toBe('CONFIRMADA')
    })

    it('los listados dicen qué acciones ofrecer y muestran las vencidas como expiradas', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())
      const listar = new ListarReservasDePropietario(repo, reloj)

      expect((await listar.ejecutar(propietario))[0]).toMatchObject({
        estado: 'PENDIENTE',
        acciones: { confirmar: true, rechazar: true, cancelar: true },
      })

      reloj.avanzarHoras(25)
      expect((await listar.ejecutar(propietario))[0]).toMatchObject({
        estado: 'EXPIRADA',
        acciones: { confirmar: false, rechazar: false, cancelar: false },
      })
      await expect(new ConfirmarReserva(repo, reloj).ejecutar(propietario, id)).rejects.toThrow('venció')
    })

    it('una reserva cancelada libera las fechas', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())
      await new CancelarReserva(repo, reloj).ejecutar(cliente, id)
      await expect(crear.ejecutar(otroCliente, solicitud())).resolves.toBeDefined()
    })

    it('otro cliente no puede ver ni cancelar una reserva ajena', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())

      await expect(new ObtenerReserva(repo, reloj).ejecutar(otroCliente, id)).rejects.toThrow(NoEncontradoError)
      await expect(new CancelarReserva(repo, reloj).ejecutar(otroCliente, id)).rejects.toThrow(NoEncontradoError)
      expect((await new ObtenerReserva(repo, reloj).ejecutar(propietario, id)).id).toBe(id)
    })

    it('el propietario ve las reservas de sus apartamentos', async () => {
      await crear.ejecutar(cliente, solicitud())
      expect(await new ListarReservasDePropietario(repo, reloj).ejecutar(propietario)).toHaveLength(1)
      expect(await new ListarReservasDePropietario(repo, reloj).ejecutar(admin)).toHaveLength(0)
    })

    it('el huésped solo ve sus propias reservas', async () => {
      const mia = await crear.ejecutar(cliente, solicitud())
      const ajena = await crear.ejecutar(otroCliente, solicitud({ llegada: '2030-02-01', salida: '2030-02-03' }))
      const listar = new ListarReservasDeCliente(repo, reloj)

      expect((await listar.ejecutar(cliente)).map((r) => r.id)).toEqual([mia.id])
      expect((await listar.ejecutar(otroCliente)).map((r) => r.id)).toEqual([ajena.id])
      expect(await listar.ejecutar(propietario)).toEqual([])
    })

    it('la tarea programada avanza las estadías confirmadas', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())
      await new ConfirmarReserva(repo, reloj).ejecutar(propietario, id)
      const avanzar = new AvanzarEstadias(repo, reloj)

      expect(await avanzar.ejecutar()).toBe(0)
      reloj.irA('2030-01-20T15:00:00Z')
      expect(await avanzar.ejecutar()).toBe(1)
      expect((await repo.buscarPorId(id))?.estado).toBe('EN_CURSO')

      reloj.irA('2030-01-23T15:00:00Z')
      expect(await avanzar.ejecutar()).toBe(1)
      expect((await repo.buscarPorId(id))?.estado).toBe('COMPLETADA')
      expect(await avanzar.ejecutar()).toBe(0)
    })

    it('si el propietario confirma y el huésped cancela a la vez, solo se guarda uno de los dos cambios', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())

      // Ambos casos de uso leen la reserva PENDIENTE antes de que cualquiera guarde
      const [confirmada, cancelada] = await Promise.allSettled([
        new ConfirmarReserva(repo, reloj).ejecutar(propietario, id),
        new CancelarReserva(repo, reloj).ejecutar(cliente, id),
      ])

      expect(confirmada).toMatchObject({ status: 'fulfilled', value: { estado: 'CONFIRMADA' } })
      expect(cancelada).toMatchObject({ status: 'rejected', reason: expect.any(ConflictoDeConcurrenciaError) })
      expect((await repo.buscarPorId(id))?.estado).toBe('CONFIRMADA')
    })

    it('la tarea programada expira solo las solicitudes vencidas', async () => {
      const vencera = await crear.ejecutar(cliente, solicitud())
      const confirmada = await crear.ejecutar(otroCliente, solicitud({ llegada: '2030-02-01', salida: '2030-02-03' }))
      await new ConfirmarReserva(repo, reloj).ejecutar(propietario, confirmada.id)
      const expirar = new ExpirarReservasPendientes(repo, reloj)

      expect(await expirar.ejecutar()).toBe(0)
      reloj.avanzarHoras(25)
      expect(await expirar.ejecutar()).toBe(1)
      expect((await repo.buscarPorId(vencera.id))?.estado).toBe('EXPIRADA')
      expect((await repo.buscarPorId(confirmada.id))?.estado).toBe('CONFIRMADA')
    })
  })
})
