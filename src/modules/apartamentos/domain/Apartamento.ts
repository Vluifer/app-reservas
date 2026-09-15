import { esAdmin, type Actor } from '@/shared/domain/Actor'
import { nuevoId } from '@/shared/domain/comunes'
import type { Dinero } from '@/shared/domain/Dinero'
import { asegurar, ErrorDeValidacion, NoEncontradoError } from '@/shared/domain/errores'
import { POLITICAS_CANCELACION, type PoliticaCancelacion } from '@/shared/domain/PoliticaCancelacion'

export const ESTADOS_APARTAMENTO = ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO', 'ELIMINADO'] as const
export type EstadoApartamento = (typeof ESTADOS_APARTAMENTO)[number]

export const MAXIMO_IMAGENES = 10
export const CAPACIDAD_MAXIMA = 50

export interface DatosApartamento {
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
  precioPorNoche: Dinero
  tarifaLimpieza: Dinero
  amenidades: string[]
  politicaCancelacion: PoliticaCancelacion
}

export interface Imagen {
  id: string
  url: string
  publicId: string | null
  orden: number
  esPrincipal: boolean
}

export interface ApartamentoProps extends DatosApartamento {
  id: string
  propietarioId: string
  estado: EstadoApartamento
  imagenes: Imagen[]
  creadoEn: Date
}

/** Agregado raíz: un apartamento publicado con sus imágenes. */
export class Apartamento {
  private constructor(private props: ApartamentoProps) {}

  static publicar(propietarioId: string, datos: DatosApartamento, ahora: Date): Apartamento {
    return new Apartamento({
      ...validarDatos(datos),
      id: nuevoId(),
      propietarioId,
      estado: 'ACTIVO',
      imagenes: [],
      creadoEn: ahora,
    })
  }

  static reconstruir(props: ApartamentoProps): Apartamento {
    return new Apartamento(copiar(props))
  }

  get id() { return this.props.id }
  get nombre() { return this.props.nombre }
  get propietarioId() { return this.props.propietarioId }
  get estado() { return this.props.estado }
  get capacidad() { return this.props.capacidad }
  get precioPorNoche() { return this.props.precioPorNoche }
  get tarifaLimpieza() { return this.props.tarifaLimpieza }
  get politicaCancelacion() { return this.props.politicaCancelacion }
  get imagenes(): readonly Imagen[] { return this.props.imagenes }

  /** Copia de todos los datos, para persistir o convertir a DTO. */
  instantanea(): ApartamentoProps {
    return copiar(this.props)
  }

  estaActivo(): boolean {
    return this.props.estado === 'ACTIVO'
  }

  puedeSerGestionadoPor(actor: Actor): boolean {
    return esAdmin(actor) || actor.id === this.props.propietarioId
  }

  actualizar(datos: DatosApartamento): void {
    this.asegurarNoEliminado()
    this.props = { ...this.props, ...validarDatos(datos) }
  }

  cambiarEstado(estado: EstadoApartamento): void {
    this.asegurarNoEliminado()
    asegurar(ESTADOS_APARTAMENTO.includes(estado), 'Estado de apartamento inválido')
    this.props.estado = estado
  }

  asegurarEspacioParaImagenes(cantidad: number): void {
    asegurar(
      this.props.imagenes.length + cantidad <= MAXIMO_IMAGENES,
      `Un apartamento puede tener máximo ${MAXIMO_IMAGENES} imágenes`,
    )
  }

  agregarImagenes(nuevas: { url: string; publicId: string | null }[]): void {
    this.asegurarNoEliminado()
    this.asegurarEspacioParaImagenes(nuevas.length)
    for (const imagen of nuevas) {
      this.props.imagenes.push({ id: nuevoId(), ...imagen, orden: 0, esPrincipal: false })
    }
    this.reordenarImagenes()
  }

  quitarImagen(imagenId: string): Imagen {
    const imagen = this.props.imagenes.find((i) => i.id === imagenId)
    if (!imagen) throw new NoEncontradoError('Imagen no encontrada')
    this.props.imagenes = this.props.imagenes.filter((i) => i.id !== imagenId)
    this.reordenarImagenes()
    return imagen
  }

  /** La primera imagen siempre es la principal. */
  private reordenarImagenes(): void {
    this.props.imagenes = this.props.imagenes.map((imagen, indice) => ({
      ...imagen,
      orden: indice,
      esPrincipal: indice === 0,
    }))
  }

  private asegurarNoEliminado(): void {
    if (this.props.estado === 'ELIMINADO') throw new ErrorDeValidacion('El apartamento fue eliminado')
  }
}

function validarDatos(datos: DatosApartamento): DatosApartamento {
  const texto = (valor: string | null) => valor?.trim() ?? ''
  const nombre = texto(datos.nombre)
  const descripcion = texto(datos.descripcion)

  asegurar(nombre.length >= 3, 'El nombre debe tener al menos 3 caracteres')
  asegurar(descripcion.length >= 20, 'La descripción debe tener al menos 20 caracteres')
  asegurar(texto(datos.direccion), 'La dirección es obligatoria')
  asegurar(texto(datos.ciudad), 'La ciudad es obligatoria')
  asegurar(texto(datos.region), 'La región es obligatoria')
  asegurar(
    Number.isInteger(datos.capacidad) && datos.capacidad >= 1 && datos.capacidad <= CAPACIDAD_MAXIMA,
    `La capacidad debe ser un número entero entre 1 y ${CAPACIDAD_MAXIMA}`,
  )
  asegurar(Number.isInteger(datos.numHabitaciones) && datos.numHabitaciones >= 0, 'Número de habitaciones inválido')
  asegurar(Number.isInteger(datos.numBanos) && datos.numBanos >= 0, 'Número de baños inválido')
  asegurar(datos.metrosCuadrados === null || datos.metrosCuadrados > 0, 'Los metros cuadrados deben ser mayores a 0')
  asegurar(!datos.precioPorNoche.esCero(), 'El precio por noche debe ser mayor a 0')
  asegurar(POLITICAS_CANCELACION.includes(datos.politicaCancelacion), 'Política de cancelación inválida')

  return {
    ...datos,
    nombre,
    descripcion,
    direccion: texto(datos.direccion),
    ciudad: texto(datos.ciudad),
    region: texto(datos.region),
    codigoPostal: texto(datos.codigoPostal) || null,
    amenidades: [...new Set(datos.amenidades.map((a) => a.trim()).filter(Boolean))],
  }
}

function copiar(props: ApartamentoProps): ApartamentoProps {
  return { ...props, amenidades: [...props.amenidades], imagenes: props.imagenes.map((i) => ({ ...i })) }
}
