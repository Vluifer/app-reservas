import { describe, expect, it } from 'vitest'
import { AHORA, apartamentoReservable, cliente, propietario } from '../../../../tests/fabricas'
import { Dinero } from '@/shared/domain/Dinero'
import { RangoFechas } from '@/shared/domain/RangoFechas'
import { calcularPrecio } from './CalculadoraPrecio'
import { TransicionInvalidaError } from './errores'
import { calcularReembolso } from './Reembolso'
import { HORAS_PARA_CONFIRMAR, Reserva } from './Reserva'

const datosCliente = { id: cliente.id, nombre: cliente.nombre, email: cliente.email, telefono: null }

function solicitar(cambios: Partial<Parameters<typeof Reserva.solicitar>[0]> = {}, ahora = AHORA) {
  return Reserva.solicitar(
    {
      apartamento: apartamentoReservable(),
      cliente: datosCliente,
      rango: RangoFechas.crear('2030-01-20', '2030-01-23'),
      numAdultos: 2,
      numNinos: 0,
      ...cambios,
    },
    ahora,
  )
}

describe('calcularPrecio', () => {
  it('suma noches, limpieza, 10% de servicio y 19% de impuestos', () => {
    const precio = calcularPrecio(Dinero.desde(100), Dinero.desde(50), RangoFechas.crear('2030-01-20', '2030-01-23'))

    expect(precio.noches).toBe(3)
    expect(precio.precioNoches.valor()).toBe(300)
    expect(precio.tarifaServicio.valor()).toBe(30)
    expect(precio.impuestos.valor()).toBe(72.2) // 19% de 380
    expect(precio.total.valor()).toBe(452.2)
  })
})

describe('calcularReembolso', () => {
  const total = Dinero.desde(1000)
  const llegada = new Date('2030-01-20T00:00:00Z')

  it('FLEXIBLE: reembolso total con 24 horas o más de antelación', () => {
    expect(calcularReembolso('FLEXIBLE', total, llegada, new Date('2030-01-19T00:00:00Z')).valor()).toBe(1000)
    expect(calcularReembolso('FLEXIBLE', total, llegada, new Date('2030-01-19T01:00:00Z')).valor()).toBe(0)
  })

  it('MODERADA: 50% con 5 días o más de antelación', () => {
    expect(calcularReembolso('MODERADA', total, llegada, new Date('2030-01-15T00:00:00Z')).valor()).toBe(500)
    expect(calcularReembolso('MODERADA', total, llegada, new Date('2030-01-16T00:00:00Z')).valor()).toBe(0)
  })

  it('ESTRICTA: nunca hay reembolso', () => {
    expect(calcularReembolso('ESTRICTA', total, llegada, new Date('2029-01-01T00:00:00Z')).esCero()).toBe(true)
  })
})

describe('Reserva', () => {
  describe('solicitar', () => {
    it('queda PENDIENTE, con precio calculado y vencimiento para confirmar', () => {
      const r = solicitar().instantanea()

      expect(r.estado).toBe('PENDIENTE')
      expect(r.codigo).toMatch(/^R-[A-Z2-9]{8}$/)
      expect(r.precio.total.valor()).toBe(452.2)
      expect(r.politicaCancelacion).toBe('FLEXIBLE')
      expect(r.expiraEn?.getTime()).toBe(AHORA.getTime() + HORAS_PARA_CONFIRMAR * 3_600_000)
    })

    it('no permite superar la capacidad', () => {
      expect(() => solicitar({ numAdultos: 3, numNinos: 2 })).toThrow('máximo 4 huéspedes')
    })

    it('exige al menos un adulto', () => {
      expect(() => solicitar({ numAdultos: 0, numNinos: 2 })).toThrow('al menos un adulto')
    })

    it('no permite llegar en una fecha pasada', () => {
      expect(() => solicitar({ rango: RangoFechas.crear('2030-01-09', '2030-01-12') })).toThrow('pasado')
    })

    it('permite llegar hoy', () => {
      expect(() => solicitar({ rango: RangoFechas.crear('2030-01-10', '2030-01-12') })).not.toThrow()
    })

    it('el propietario no puede reservar su propio apartamento', () => {
      expect(() => solicitar({ cliente: { ...datosCliente, id: propietario.id } })).toThrow('propio apartamento')
    })

    it('no se puede reservar un apartamento inactivo', () => {
      expect(() => solicitar({ apartamento: apartamentoReservable({ activo: false }) })).toThrow('no está disponible')
    })
  })

  describe('ciclo de vida', () => {
    it('una pendiente vencida deja de ocupar las fechas y puede expirar', () => {
      const reserva = solicitar()
      const despues = new Date(AHORA.getTime() + (HORAS_PARA_CONFIRMAR + 1) * 3_600_000)

      expect(reserva.ocupaFechas(AHORA)).toBe(true)
      expect(reserva.ocupaFechas(despues)).toBe(false)
      expect(() => reserva.expirar(AHORA)).toThrow('no ha vencido')

      reserva.expirar(despues)
      expect(reserva.estado).toBe('EXPIRADA')
    })

    it('no se puede confirmar una solicitud vencida', () => {
      const reserva = solicitar()
      expect(() => reserva.confirmar(new Date('2030-01-15T00:00:00Z'))).toThrow('venció')
    })

    it('cancelar una pendiente no genera reembolso (no se había cobrado)', () => {
      const reserva = solicitar()
      reserva.cancelar(AHORA)
      expect(reserva.instantanea().montoReembolso?.esCero()).toBe(true)
    })

    it('cancelar una confirmada aplica la política de cancelación', () => {
      const reserva = solicitar()
      reserva.confirmar(AHORA)
      reserva.cancelar(AHORA)
      expect(reserva.instantanea().montoReembolso?.valor()).toBe(452.2)
    })

    it('impide transiciones no permitidas', () => {
      const reserva = solicitar()
      reserva.rechazar(AHORA)
      expect(() => reserva.confirmar(AHORA)).toThrow(TransicionInvalidaError)
      expect(() => reserva.cancelar(AHORA)).toThrow('rechazada no puede pasar a cancelada')
    })

    it('una pendiente vencida ya no se puede confirmar, rechazar ni cancelar: solo expirar', () => {
      const reserva = solicitar()
      const vencida = new Date(AHORA.getTime() + (HORAS_PARA_CONFIRMAR + 1) * 3_600_000)

      expect(reserva.estadoVigente(vencida)).toBe('EXPIRADA')
      expect(reserva.accionesDisponibles(vencida)).toEqual({ confirmar: false, rechazar: false, cancelar: false })
      expect(() => reserva.rechazar(vencida)).toThrow('venció')
      expect(() => reserva.cancelar(vencida)).toThrow('venció')
    })

    it('una confirmada no se puede cancelar desde el día de llegada (hora de Bogotá)', () => {
      const reserva = solicitar()
      reserva.confirmar(AHORA)
      const vispera = new Date('2030-01-20T04:59:00Z') // 19 de enero, 23:59 en Bogotá
      const diaDeLlegada = new Date('2030-01-20T05:00:00Z') // 20 de enero, 00:00 en Bogotá

      expect(reserva.accionesDisponibles(vispera).cancelar).toBe(true)
      expect(reserva.accionesDisponibles(diaDeLlegada).cancelar).toBe(false)
      expect(() => reserva.cancelar(diaDeLlegada)).toThrow('ya empezó')
    })

    it('las acciones disponibles coinciden con lo que la reserva acepta hacer', () => {
      // Pendiente vigente / pendiente vencida o confirmada antes de llegar / estadía empezada
      const momentos = [AHORA, new Date('2030-01-12T00:00:00Z'), new Date('2030-01-21T12:00:00Z')]
      const estadosIniciales: ((r: Reserva) => void)[] = [() => {}, (r) => r.confirmar(AHORA), (r) => r.rechazar(AHORA)]

      for (const preparar of estadosIniciales) {
        const nueva = () => {
          const r = solicitar()
          preparar(r)
          return r
        }
        const acepta = (accion: (r: Reserva) => void) => {
          try {
            accion(nueva())
            return true
          } catch {
            return false
          }
        }
        for (const ahora of momentos) {
          expect(nueva().accionesDisponibles(ahora)).toEqual({
            confirmar: acepta((r) => r.confirmar(ahora)),
            rechazar: acepta((r) => r.rechazar(ahora)),
            cancelar: acepta((r) => r.cancelar(ahora)),
          })
        }
      }
    })

    it('una confirmada pasa a EN_CURSO el día de llegada y a COMPLETADA el de salida', () => {
      const reserva = solicitar()
      reserva.confirmar(AHORA)

      reserva.avanzarEstadia(new Date('2030-01-19T12:00:00Z'))
      expect(reserva.estado).toBe('CONFIRMADA')
      reserva.avanzarEstadia(new Date('2030-01-20T12:00:00Z'))
      expect(reserva.estado).toBe('EN_CURSO')
      expect(reserva.ocupaFechas(new Date('2030-01-20T12:00:00Z'))).toBe(true)
      reserva.avanzarEstadia(new Date('2030-01-23T12:00:00Z'))
      expect(reserva.estado).toBe('COMPLETADA')
    })

    it('si la tarea no corrió durante la estadía, una confirmada pasa directo a COMPLETADA', () => {
      const reserva = solicitar()
      reserva.confirmar(AHORA)
      reserva.avanzarEstadia(new Date('2030-02-01T12:00:00Z'))
      expect(reserva.estado).toBe('COMPLETADA')
    })

    it('avanzar la estadía no afecta a reservas que no están confirmadas', () => {
      const reserva = solicitar()
      reserva.avanzarEstadia(new Date('2030-02-01T12:00:00Z'))
      expect(reserva.estado).toBe('PENDIENTE')
    })
  })
})
