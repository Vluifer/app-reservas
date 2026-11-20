import { describe, expect, it } from 'vitest'
import { conParametro } from './acciones'

describe('conParametro', () => {
  it('añade el parámetro con ? o con & según la ruta', () => {
    expect(conParametro('/dashboard/reservas', 'exito', 'Reserva confirmada')).toBe('/dashboard/reservas?exito=Reserva%20confirmada')
    expect(conParametro('/dashboard/calendario?mes=2026-10', 'error', 'No')).toBe('/dashboard/calendario?mes=2026-10&error=No')
  })

  it('deja el ancla al final, para que el navegador siga bajando a ella', () => {
    expect(conParametro('/dashboard/calendario?mes=2026-10&reserva=r1#detalle', 'exito', 'ok')).toBe(
      '/dashboard/calendario?mes=2026-10&reserva=r1&exito=ok#detalle',
    )
    expect(conParametro('/dashboard/calendario#detalle', 'exito', 'ok')).toBe('/dashboard/calendario?exito=ok#detalle')
  })
})
