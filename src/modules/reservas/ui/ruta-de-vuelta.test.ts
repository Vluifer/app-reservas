import { describe, expect, it } from 'vitest'
import { rutaDeVuelta } from './ruta-de-vuelta'

const POR_DEFECTO = '/dashboard/reservas'

describe('rutaDeVuelta', () => {
  it('acepta rutas internas del panel, con su consulta', () => {
    expect(rutaDeVuelta('/dashboard/calendario?mes=2026-10&dia=2026-10-13&reserva=r1', POR_DEFECTO)).toBe(
      '/dashboard/calendario?mes=2026-10&dia=2026-10-13&reserva=r1',
    )
  })

  it('sin volverA (o con el FormData que Next añade al final) usa la ruta por defecto', () => {
    expect(rutaDeVuelta(undefined, POR_DEFECTO)).toBe(POR_DEFECTO)
    expect(rutaDeVuelta(new FormData(), POR_DEFECTO)).toBe(POR_DEFECTO)
  })

  it('rechaza destinos externos o fuera del panel', () => {
    for (const destino of ['https://malo.com/dashboard/', '//malo.com/dashboard/', '/mis-reservas', '/dashboard', '']) {
      expect(rutaDeVuelta(destino, POR_DEFECTO)).toBe(POR_DEFECTO)
    }
  })
})
