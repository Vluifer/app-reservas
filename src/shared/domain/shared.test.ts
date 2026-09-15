import { describe, expect, it } from 'vitest'
import { Dinero } from './Dinero'
import { ErrorDeValidacion } from './errores'
import { hoy, RangoFechas } from './RangoFechas'

describe('Dinero', () => {
  it('opera en centavos sin errores de coma flotante', () => {
    expect(Dinero.desde(0.1).sumar(Dinero.desde(0.2)).valor()).toBe(0.3)
  })

  it('calcula porcentajes redondeando al centavo', () => {
    expect(Dinero.desde(99.99).porcentaje(19).aTextoDecimal()).toBe('19.00')
  })

  it('rechaza montos negativos o inválidos', () => {
    expect(() => Dinero.desde(-1)).toThrow(ErrorDeValidacion)
    expect(() => Dinero.desde('abc')).toThrow(ErrorDeValidacion)
  })
})

describe('RangoFechas', () => {
  it('cuenta las noches entre llegada y salida', () => {
    expect(RangoFechas.crear('2030-01-20', '2030-01-23').noches).toBe(3)
  })

  it('exige que la salida sea posterior a la llegada', () => {
    expect(() => RangoFechas.crear('2030-01-20', '2030-01-20')).toThrow('posterior')
  })

  it('rechaza fechas que no existen', () => {
    expect(() => RangoFechas.crear('2030-02-30', '2030-03-02')).toThrow('Fecha inválida')
  })

  it('no considera solapados rangos donde uno sale el día que el otro llega', () => {
    const primero = RangoFechas.crear('2030-01-20', '2030-01-23')
    expect(primero.seSolapaCon(RangoFechas.crear('2030-01-23', '2030-01-25'))).toBe(false)
    expect(primero.seSolapaCon(RangoFechas.crear('2030-01-22', '2030-01-25'))).toBe(true)
  })

  it('calcula "hoy" en la zona horaria del negocio', () => {
    // 23 de enero 02:00 UTC = 22 de enero 21:00 en Bogotá
    expect(hoy(new Date('2030-01-23T02:00:00Z')).toISOString()).toBe('2030-01-22T00:00:00.000Z')
  })
})
