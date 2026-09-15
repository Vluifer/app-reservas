import { beforeEach, describe, expect, it } from 'vitest'
import { apartamentoReservable, admin, cliente, otroCliente, propietario, RelojFijo } from '../../../tests/fabricas'
import { NoAutorizadoError, NoEncontradoError } from '@/shared/domain/errores'
import { ConsultarFechasOcupadas, ListarReservasDePropietario, ObtenerReserva } from './application/ConsultasReservas'
import {
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
      expect((await new RechazarReserva(repo).ejecutar(admin, otra.id)).estado).toBe('RECHAZADA')
    })

    it('el cliente cancela y recibe el reembolso según la política', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())
      await new ConfirmarReserva(repo, reloj).ejecutar(propietario, id)

      const cancelada = await new CancelarReserva(repo, reloj).ejecutar(cliente, id)
      expect(cancelada).toMatchObject({ estado: 'CANCELADA', montoReembolso: 452.2 })
    })

    it('una reserva cancelada libera las fechas', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())
      await new CancelarReserva(repo, reloj).ejecutar(cliente, id)
      await expect(crear.ejecutar(otroCliente, solicitud())).resolves.toBeDefined()
    })

    it('otro cliente no puede ver ni cancelar una reserva ajena', async () => {
      const { id } = await crear.ejecutar(cliente, solicitud())

      await expect(new ObtenerReserva(repo).ejecutar(otroCliente, id)).rejects.toThrow(NoEncontradoError)
      await expect(new CancelarReserva(repo, reloj).ejecutar(otroCliente, id)).rejects.toThrow(NoEncontradoError)
      expect((await new ObtenerReserva(repo).ejecutar(propietario, id)).id).toBe(id)
    })

    it('el propietario ve las reservas de sus apartamentos', async () => {
      await crear.ejecutar(cliente, solicitud())
      expect(await new ListarReservasDePropietario(repo).ejecutar(propietario)).toHaveLength(1)
      expect(await new ListarReservasDePropietario(repo).ejecutar(admin)).toHaveLength(0)
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
