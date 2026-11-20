import { describe, expect, it } from 'vitest'
import type { ReservaDTO } from '../application/ReservaDTO'
import {
  agruparDia,
  barrasDeSemana,
  colorDeApartamento,
  hrefCalendario,
  leerParametros,
  mesVecino,
  rangoDeCuadricula,
  semanasDelMes,
} from './calendario'

/** Solo los campos que usa la lógica del calendario. */
const reserva = (id: string, llegada: string, salida: string, cambios: Partial<ReservaDTO> = {}): ReservaDTO =>
  ({ id, apartamentoId: 'apto-1', llegada, salida, estado: 'CONFIRMADA', clienteNombre: id, ...cambios }) as ReservaDTO

/** Lunes 14 a domingo 20 de enero de 2030. */
const semana = semanasDelMes('2030-01').find((s) => s[0].fecha === '2030-01-14')!

describe('Calendario: lógica pura', () => {
  describe('leerParametros', () => {
    const HOY = '2026-10-13'

    it('sin parámetros muestra el mes y el día de hoy', () => {
      expect(leerParametros({}, HOY)).toEqual({ mes: '2026-10', dia: '2026-10-13', reservaId: null })
    })

    it('en otro mes, el día por defecto es el primero', () => {
      expect(leerParametros({ mes: '2026-12' }, HOY)).toEqual({ mes: '2026-12', dia: '2026-12-01', reservaId: null })
    })

    it('corrige en silencio un mes o un día inválidos', () => {
      expect(leerParametros({ mes: '2026-13', dia: 'hola' }, HOY)).toMatchObject({ mes: '2026-10', dia: '2026-10-13' })
      expect(leerParametros({ mes: '2026-02', dia: '2026-02-30' }, HOY)).toMatchObject({ mes: '2026-02', dia: '2026-02-01' })
    })

    it('ignora años fuera de rango, que romperían la cuadrícula o tardarían segundos en armarla', () => {
      for (const mes of ['0050-03', '0000-01', '9999-12']) {
        expect(leerParametros({ mes }, HOY)).toMatchObject({ mes: '2026-10', dia: '2026-10-13' })
      }
    })

    it('ignora un día que no es del mes visible', () => {
      expect(leerParametros({ mes: '2026-10', dia: '2026-11-02' }, HOY)).toMatchObject({ dia: '2026-10-13' })
    })

    it('ignora parámetros repetidos y una reserva vacía', () => {
      expect(leerParametros({ mes: ['2026-11', '2026-12'], reserva: 'abc' }, HOY)).toEqual({ mes: '2026-10', dia: '2026-10-13', reservaId: 'abc' })
      expect(leerParametros({ reserva: '' }, HOY).reservaId).toBeNull()
    })
  })

  it('mesVecino cruza los cambios de año', () => {
    expect(mesVecino('2026-12', 1)).toBe('2027-01')
    expect(mesVecino('2026-01', -1)).toBe('2025-12')
  })

  describe('semanasDelMes', () => {
    it('un mes que empieza en domingo arranca la cuadrícula el lunes anterior', () => {
      const semanas = semanasDelMes('2026-02')
      expect(semanas).toHaveLength(5)
      expect(semanas[0][0]).toEqual({ fecha: '2026-01-26', numero: 26, delMes: false })
      expect(semanas[0][6]).toEqual({ fecha: '2026-02-01', numero: 1, delMes: true })
      expect(semanas[4][6]).toEqual({ fecha: '2026-03-01', numero: 1, delMes: false })
    })

    it('incluye el 29 de febrero de un año bisiesto', () => {
      const dias = semanasDelMes('2028-02').flat()
      expect(dias.find((d) => d.fecha === '2028-02-29')).toEqual({ fecha: '2028-02-29', numero: 29, delMes: true })
    })

    it('un mes puede ocupar 6 semanas, y la cuadrícula cubre exactamente 42 días', () => {
      const semanas = semanasDelMes('2026-03')
      expect(semanas).toHaveLength(6)
      expect(rangoDeCuadricula(semanas)).toEqual({ desde: '2026-02-23', hasta: '2026-04-05' })
    })
  })

  describe('barrasDeSemana', () => {
    it('recorta a la semana las reservas que empiezan antes o terminan después', () => {
      const [antes, despues] = barrasDeSemana([reserva('a', '2030-01-10', '2030-01-16'), reserva('b', '2030-01-19', '2030-01-22')], semana)
      expect(antes).toMatchObject({ inicioCol: 1, finCol: 3, continuaAntes: true, continuaDespues: false })
      expect(despues).toMatchObject({ inicioCol: 6, finCol: 7, continuaAntes: false, continuaDespues: true })
    })

    it('deja fuera las reservas que no tocan la semana', () => {
      expect(barrasDeSemana([reserva('a', '2030-01-21', '2030-01-23'), reserva('b', '2030-01-08', '2030-01-13')], semana)).toEqual([])
    })

    it('reparte en carriles las reservas que se cruzan y reutiliza un carril libre', () => {
      const tramos = barrasDeSemana(
        [reserva('a', '2030-01-14', '2030-01-17'), reserva('b', '2030-01-16', '2030-01-18'), reserva('c', '2030-01-18', '2030-01-20')],
        semana,
      )
      expect(tramos.map((t) => [t.reserva.id, t.carril])).toEqual([
        ['a', 0],
        ['b', 1],
        ['c', 0],
      ])
    })

    it('si un huésped sale y otro llega el mismo día, no se montan', () => {
      const tramos = barrasDeSemana([reserva('sale', '2030-01-14', '2030-01-16'), reserva('llega', '2030-01-16', '2030-01-18')], semana)
      expect(tramos.map((t) => t.carril)).toEqual([0, 1])
    })
  })

  it('agruparDia separa llegadas, salidas y alojados', () => {
    const sale = reserva('sale', '2030-01-10', '2030-01-13')
    const llega = reserva('llega', '2030-01-13', '2030-01-15')
    const alojado = reserva('alojado', '2030-01-11', '2030-01-16')
    expect(agruparDia([sale, llega, alojado, reserva('otra', '2030-01-20', '2030-01-22')], '2030-01-13')).toEqual({
      llegan: [llega],
      salen: [sale],
      alojados: [alojado],
    })
  })

  it('colorDeApartamento asigna por antigüedad, repite después de 6 y marca los eliminados', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    expect(colorDeApartamento('a', ids)).toBe(1)
    expect(colorDeApartamento('f', ids)).toBe(6)
    expect(colorDeApartamento('g', ids)).toBe(1)
    expect(colorDeApartamento('x', ids)).toBe('eliminado')
  })

  it('hrefCalendario arma la URL solo con los parámetros dados', () => {
    expect(hrefCalendario({ mes: '2026-10' })).toBe('/dashboard/calendario?mes=2026-10')
    expect(hrefCalendario({ mes: '2026-10', dia: '2026-10-13', reserva: 'r1' })).toBe('/dashboard/calendario?mes=2026-10&dia=2026-10-13&reserva=r1')
  })
})
