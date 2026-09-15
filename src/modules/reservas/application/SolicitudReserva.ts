import type { ActorIdentificado } from '@/shared/domain/Actor'
import { relojDelSistema, type Reloj } from '@/shared/domain/comunes'
import { NoEncontradoError } from '@/shared/domain/errores'
import { RangoFechas } from '@/shared/domain/RangoFechas'
import { calcularPrecio } from '../domain/CalculadoraPrecio'
import type { CatalogoApartamentos, ReservaRepository } from '../domain/puertos'
import { Reserva, validarFechasReservables, validarHuespedes, type ApartamentoReservable } from '../domain/Reserva'
import { aDesglosePrecioDTO, aReservaDTO, type DesglosePrecioDTO, type ReservaDTO } from './ReservaDTO'

/** Casos de uso del huésped: cotizar y solicitar una reserva. */

export interface CotizacionDTO {
  disponible: boolean
  precio: DesglosePrecioDTO
}

export class CotizarReserva {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly catalogo: CatalogoApartamentos,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(input: {
    apartamentoId: string
    llegada: string
    salida: string
    numAdultos: number
    numNinos: number
  }): Promise<CotizacionDTO> {
    const apartamento = await cargarReservable(this.catalogo, input.apartamentoId)
    const rango = RangoFechas.crear(input.llegada, input.salida)
    const ahora = this.reloj.ahora()
    // Mismas reglas que al reservar: así el error aparece al cotizar y no al final
    validarHuespedes(apartamento.capacidad, input.numAdultos, input.numNinos)
    validarFechasReservables(rango, ahora)

    return {
      disponible: !(await this.reservas.hayConflicto(apartamento.id, rango, ahora)),
      precio: aDesglosePrecioDTO(calcularPrecio(apartamento.precioPorNoche, apartamento.tarifaLimpieza, rango)),
    }
  }
}

export interface CrearReservaInput {
  apartamentoId: string
  llegada: string
  salida: string
  numAdultos: number
  numNinos: number
  telefono?: string | null
  notas?: string | null
}

export class CrearReserva {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly catalogo: CatalogoApartamentos,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(cliente: ActorIdentificado, input: CrearReservaInput): Promise<ReservaDTO> {
    const apartamento = await cargarReservable(this.catalogo, input.apartamentoId)
    const reserva = Reserva.solicitar(
      {
        apartamento,
        cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email, telefono: input.telefono ?? null },
        rango: RangoFechas.crear(input.llegada, input.salida),
        numAdultos: input.numAdultos,
        numNinos: input.numNinos,
        notas: input.notas,
      },
      this.reloj.ahora(),
    )
    await this.reservas.crearSiHayDisponibilidad(reserva)
    return aReservaDTO(reserva)
  }
}

async function cargarReservable(catalogo: CatalogoApartamentos, apartamentoId: string): Promise<ApartamentoReservable> {
  const apartamento = await catalogo.obtenerReservable(apartamentoId)
  if (!apartamento || !apartamento.activo) throw new NoEncontradoError('Apartamento no encontrado')
  return apartamento
}
