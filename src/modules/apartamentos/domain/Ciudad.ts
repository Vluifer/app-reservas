import type { CiudadConOferta } from './puertos'

/** Clave para comparar ciudades: "CARTAGENA", "cartagena" y "Cartagéna" son la misma. */
export function claveCiudad(ciudad: string): string {
  return ciudad
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

const estaEnMayusculas = (texto: string) => texto === texto.toLocaleUpperCase('es') && texto !== texto.toLocaleLowerCase('es')

const PALABRAS_MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y'])

/**
 * Un nombre de lugar escrito todo en mayúsculas ("SAN ANDRÉS DE SOTAVENTO") se muestra en forma normal
 * ("San Andrés de Sotavento"). Cualquier otra escritura se respeta tal cual.
 */
export function escrituraLegible(lugar: string): string {
  const texto = lugar.trim()
  if (!estaEnMayusculas(texto)) return texto
  return texto
    .toLocaleLowerCase('es')
    .split(/\s+/)
    .map((palabra, i) => (i > 0 && PALABRAS_MENORES.has(palabra) ? palabra : palabra.charAt(0).toLocaleUpperCase('es') + palabra.slice(1)))
    .join(' ')
}

/**
 * Une los conteos de una misma ciudad escrita de distintas formas y la nombra con la escritura
 * más usada, prefiriendo la que no está toda en mayúsculas. Devuelve de la ciudad con más oferta a la de menos.
 */
export function unificarCiudades(grupos: CiudadConOferta[], limite?: number): CiudadConOferta[] {
  const porClave = new Map<string, { total: number; escrituras: CiudadConOferta[] }>()
  for (const grupo of grupos) {
    const clave = claveCiudad(grupo.ciudad)
    const actual = porClave.get(clave) ?? { total: 0, escrituras: [] }
    actual.total += grupo.total
    actual.escrituras.push(grupo)
    porClave.set(clave, actual)
  }
  return [...porClave.values()]
    .map(({ total, escrituras }) => {
      const [preferida] = [...escrituras].sort(
        (a, b) => Number(estaEnMayusculas(a.ciudad)) - Number(estaEnMayusculas(b.ciudad)) || b.total - a.total,
      )
      return { ciudad: escrituraLegible(preferida.ciudad), total }
    })
    .sort((a, b) => b.total - a.total || a.ciudad.localeCompare(b.ciudad, 'es'))
    .slice(0, limite)
}
