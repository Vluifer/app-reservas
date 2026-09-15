import { Dinero } from '@/shared/domain/Dinero'
import type { PoliticaCancelacion } from '@/shared/domain/PoliticaCancelacion'
import type { Apartamento, DatosApartamento, EstadoApartamento } from '../domain/Apartamento'

/** Datos planos que salen del módulo hacia la interfaz (serializables). */
export interface ApartamentoDTO {
  id: string
  propietarioId: string
  nombre: string
  descripcion: string
  direccion: string
  ciudad: string
  region: string
  codigoPostal: string | null
  capacidad: number
  numHabitaciones: number
  numBanos: number
  metrosCuadrados: number | null
  precioPorNoche: number
  tarifaLimpieza: number
  amenidades: string[]
  politicaCancelacion: PoliticaCancelacion
  estado: EstadoApartamento
  imagenes: { id: string; url: string; esPrincipal: boolean }[]
  imagenPrincipal: string | null
}

/** Datos que entran desde formularios o APIs (números simples en lugar de Dinero). */
export interface DatosApartamentoInput {
  nombre: string
  descripcion: string
  direccion: string
  ciudad: string
  region: string
  codigoPostal?: string | null
  capacidad: number
  numHabitaciones: number
  numBanos: number
  metrosCuadrados?: number | null
  precioPorNoche: number
  tarifaLimpieza?: number
  amenidades?: string[]
  politicaCancelacion?: PoliticaCancelacion
}

export function aDatosApartamento(input: DatosApartamentoInput): DatosApartamento {
  return {
    ...input,
    codigoPostal: input.codigoPostal ?? null,
    metrosCuadrados: input.metrosCuadrados ?? null,
    precioPorNoche: Dinero.desde(input.precioPorNoche),
    tarifaLimpieza: Dinero.desde(input.tarifaLimpieza ?? 0),
    amenidades: input.amenidades ?? [],
    politicaCancelacion: input.politicaCancelacion ?? 'FLEXIBLE',
  }
}

export function aApartamentoDTO(apartamento: Apartamento): ApartamentoDTO {
  const a = apartamento.instantanea()
  return {
    id: a.id,
    propietarioId: a.propietarioId,
    nombre: a.nombre,
    descripcion: a.descripcion,
    direccion: a.direccion,
    ciudad: a.ciudad,
    region: a.region,
    codigoPostal: a.codigoPostal,
    capacidad: a.capacidad,
    numHabitaciones: a.numHabitaciones,
    numBanos: a.numBanos,
    metrosCuadrados: a.metrosCuadrados,
    precioPorNoche: a.precioPorNoche.valor(),
    tarifaLimpieza: a.tarifaLimpieza.valor(),
    amenidades: a.amenidades,
    politicaCancelacion: a.politicaCancelacion,
    estado: a.estado,
    imagenes: a.imagenes.map(({ id, url, esPrincipal }) => ({ id, url, esPrincipal })),
    imagenPrincipal: a.imagenes[0]?.url ?? null,
  }
}
