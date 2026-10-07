import { describe, expect, it } from 'vitest'
import { claveCiudad, escrituraLegible, unificarCiudades } from './Ciudad'

describe('Ciudades', () => {
  it('compara sin mayúsculas, tildes ni espacios sobrantes', () => {
    expect(claveCiudad(' BOGOTÁ ')).toBe(claveCiudad('bogota'))
  })

  it('muestra en forma normal los nombres escritos todo en mayúsculas y respeta los demás', () => {
    expect(escrituraLegible('SAN ANDRÉS DE SOTAVENTO')).toBe('San Andrés de Sotavento')
    expect(escrituraLegible('Bogotá D.C.')).toBe('Bogotá D.C.')
  })

  it('une la misma ciudad escrita distinto y la nombra sin mayúsculas sostenidas', () => {
    const ciudades = unificarCiudades(
      [
        { ciudad: 'CARTAGENA', total: 2 },
        { ciudad: 'Cartagena', total: 1 },
        { ciudad: 'Medellín', total: 2 },
        { ciudad: 'Cali', total: 1 },
      ],
      2,
    )
    expect(ciudades).toEqual([
      { ciudad: 'Cartagena', total: 3 },
      { ciudad: 'Medellín', total: 2 },
    ])
  })
})
