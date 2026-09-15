import { esAdmin, type Actor } from '@/shared/domain/Actor'
import { nuevoId } from '@/shared/domain/comunes'
import { Dinero } from '@/shared/domain/Dinero'
import { asegurar } from '@/shared/domain/errores'
import type { PoliticaCancelacion } from '@/shared/domain/PoliticaCancelacion'
import { hoy, type RangoFechas } from '@/shared/domain/RangoFechas'
import { calcularPrecio, type DesglosePrecio } from './CalculadoraPrecio'
import { ESTADOS_QUE_OCUPAN, puedeTransicionar, type EstadoReserva } from './EstadoReserva'
import { TransicionInvalidaError } from './errores'
import { calcularReembolso } from './Reembolso'

/** Tiempo que tiene el propietario para confirmar una solicitud antes de que expire. */
export const HORAS_PARA_CONFIRMAR = 24
export const MAXIMO_NOCHES = 90

/** Lo que el módulo de reservas necesita saber de un apartamento (no depende del agregado Apartamento). */
export interface ApartamentoReservable {
  id: string
  nombre: string
  propietarioId: string
  capacidad: number
  activo: boolean
  precioPorNoche: Dinero
  tarifaLimpieza: Dinero
  politicaCancelacion: PoliticaCancelacion
}

export interface DatosCliente {
  id: string
  nombre: string
  email: string
  telefono: string | null
}

export interface ReservaProps {
  id: string
  codigo: string
  apartamentoId: string
  apartamentoNombre: string
  propietarioId: string
  cliente: DatosCliente
  rango: RangoFechas
  numAdultos: number
  numNinos: number
  precio: DesglosePrecio
  politicaCancelacion: PoliticaCancelacion
  estado: EstadoReserva
  notasCliente: string | null
  creadaEn: Date
  expiraEn: Date | null
  confirmadaEn: Date | null
  canceladaEn: Date | null
  montoReembolso: Dinero | null
}

/** Reglas de fechas comunes a cotizar y reservar. */
export function validarFechasReservables(rango: RangoFechas, ahora: Date): void {
  asegurar(rango.inicio >= hoy(ahora), 'La fecha de llegada no puede estar en el pasado')
  asegurar(rango.noches <= MAXIMO_NOCHES, `La estadía máxima es de ${MAXIMO_NOCHES} noches`)
}

/** Reglas de huéspedes comunes a cotizar y reservar. */
export function validarHuespedes(capacidad: number, numAdultos: number, numNinos: number): void {
  asegurar(Number.isInteger(numAdultos) && numAdultos >= 1, 'Debe haber al menos un adulto')
  asegurar(Number.isInteger(numNinos) && numNinos >= 0, 'Número de niños inválido')
  asegurar(numAdultos + numNinos <= capacidad, `El apartamento admite máximo ${capacidad} huéspedes`)
}

/** Agregado raíz: una reserva y su ciclo de vida. */
export class Reserva {
  private constructor(private props: ReservaProps) {}

  static solicitar(
    datos: {
      apartamento: ApartamentoReservable
      cliente: DatosCliente
      rango: RangoFechas
      numAdultos: number
      numNinos: number
      notas?: string | null
    },
    ahora: Date,
  ): Reserva {
    const { apartamento, cliente, rango, numAdultos, numNinos } = datos

    asegurar(apartamento.activo, 'El apartamento no está disponible para reservas')
    asegurar(apartamento.propietarioId !== cliente.id, 'No puedes reservar tu propio apartamento')
    validarHuespedes(apartamento.capacidad, numAdultos, numNinos)
    validarFechasReservables(rango, ahora)

    return new Reserva({
      id: nuevoId(),
      codigo: generarCodigo(),
      apartamentoId: apartamento.id,
      apartamentoNombre: apartamento.nombre,
      propietarioId: apartamento.propietarioId,
      cliente: { ...cliente, telefono: cliente.telefono?.trim() || null },
      rango,
      numAdultos,
      numNinos,
      precio: calcularPrecio(apartamento.precioPorNoche, apartamento.tarifaLimpieza, rango),
      politicaCancelacion: apartamento.politicaCancelacion,
      estado: 'PENDIENTE',
      notasCliente: datos.notas?.trim() || null,
      creadaEn: ahora,
      expiraEn: new Date(ahora.getTime() + HORAS_PARA_CONFIRMAR * 60 * 60 * 1000),
      confirmadaEn: null,
      canceladaEn: null,
      montoReembolso: null,
    })
  }

  static reconstruir(props: ReservaProps): Reserva {
    return new Reserva(copiar(props))
  }

  get id() { return this.props.id }
  get codigo() { return this.props.codigo }
  get apartamentoId() { return this.props.apartamentoId }
  get clienteId() { return this.props.cliente.id }
  get propietarioId() { return this.props.propietarioId }
  get rango() { return this.props.rango }
  get estado() { return this.props.estado }
  get creadaEn() { return this.props.creadaEn }

  instantanea(): ReservaProps {
    return copiar(this.props)
  }

  puedeSerVistaPor(actor: Actor): boolean {
    return esAdmin(actor) || actor.id === this.props.cliente.id || actor.id === this.props.propietarioId
  }

  puedeSerGestionadaPor(actor: Actor): boolean {
    return esAdmin(actor) || actor.id === this.props.propietarioId
  }

  estaVencida(ahora: Date): boolean {
    return this.props.estado === 'PENDIENTE' && this.props.expiraEn !== null && this.props.expiraEn <= ahora
  }

  ocupaFechas(ahora: Date): boolean {
    return ESTADOS_QUE_OCUPAN.includes(this.props.estado) && !this.estaVencida(ahora)
  }

  confirmar(ahora: Date): void {
    asegurar(!this.estaVencida(ahora), 'La solicitud ya venció y no puede confirmarse')
    this.cambiarA('CONFIRMADA')
    this.props.confirmadaEn = ahora
  }

  rechazar(): void {
    this.cambiarA('RECHAZADA')
  }

  /** Solo hay reembolso si la reserva estaba confirmada (una pendiente aún no se ha cobrado). */
  cancelar(ahora: Date): void {
    const estabaConfirmada = this.props.estado === 'CONFIRMADA'
    this.cambiarA('CANCELADA')
    this.props.canceladaEn = ahora
    this.props.montoReembolso = estabaConfirmada
      ? calcularReembolso(this.props.politicaCancelacion, this.props.precio.total, this.props.rango.inicio, ahora)
      : Dinero.cero()
  }

  expirar(ahora: Date): void {
    asegurar(this.estaVencida(ahora), 'La reserva todavía no ha vencido')
    this.cambiarA('EXPIRADA')
  }

  private cambiarA(estado: EstadoReserva): void {
    if (!puedeTransicionar(this.props.estado, estado)) {
      throw new TransicionInvalidaError(this.props.estado, estado)
    }
    this.props.estado = estado
  }
}

const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin 0/O ni 1/I para evitar confusiones

function generarCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return 'R-' + Array.from(bytes, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('')
}

function copiar(props: ReservaProps): ReservaProps {
  return { ...props, cliente: { ...props.cliente }, precio: { ...props.precio } }
}
