import type { PoliticaCancelacion } from '@/shared/domain/PoliticaCancelacion'
import { aTextoISO } from '@/shared/domain/RangoFechas'
import type { DesglosePrecio } from '../domain/CalculadoraPrecio'
import { esEstadiaAceptada, esEstadoFinal, type EstadoReserva } from '../domain/EstadoReserva'
import type { AccionesReserva, Reserva } from '../domain/Reserva'

export interface DesglosePrecioDTO {
  noches: number
  precioNoches: number
  tarifaLimpieza: number
  tarifaServicio: number
  impuestos: number
  total: number
}

export interface ReservaDTO {
  id: string
  codigo: string
  apartamentoId: string
  apartamentoNombre: string
  clienteNombre: string
  clienteEmail: string
  clienteTelefono: string | null
  llegada: string
  salida: string
  numAdultos: number
  numNinos: number
  precio: DesglosePrecioDTO
  politicaCancelacion: PoliticaCancelacion
  /** Estado vigente: una pendiente vencida se muestra como EXPIRADA. */
  estado: EstadoReserva
  /** Ya no cambiará: va al historial ("Anteriores"). */
  finalizada: boolean
  /** Confirmada, en curso o completada: suma al valor del propietario. */
  aceptada: boolean
  /** Qué botones ofrecer. Lo calcula el dominio; la interfaz no repite reglas de estado. */
  acciones: AccionesReserva
  notasCliente: string | null
  creadaEn: string
  expiraEn: string | null
  montoReembolso: number | null
}

export function aDesglosePrecioDTO(precio: DesglosePrecio): DesglosePrecioDTO {
  return {
    noches: precio.noches,
    precioNoches: precio.precioNoches.valor(),
    tarifaLimpieza: precio.tarifaLimpieza.valor(),
    tarifaServicio: precio.tarifaServicio.valor(),
    impuestos: precio.impuestos.valor(),
    total: precio.total.valor(),
  }
}

export function aReservaDTO(reserva: Reserva, ahora: Date): ReservaDTO {
  const r = reserva.instantanea()
  const estado = reserva.estadoVigente(ahora)
  return {
    id: r.id,
    codigo: r.codigo,
    apartamentoId: r.apartamentoId,
    apartamentoNombre: r.apartamentoNombre,
    clienteNombre: r.cliente.nombre,
    clienteEmail: r.cliente.email,
    clienteTelefono: r.cliente.telefono,
    llegada: aTextoISO(r.rango.inicio),
    salida: aTextoISO(r.rango.fin),
    numAdultos: r.numAdultos,
    numNinos: r.numNinos,
    precio: aDesglosePrecioDTO(r.precio),
    politicaCancelacion: r.politicaCancelacion,
    estado,
    finalizada: esEstadoFinal(estado),
    aceptada: esEstadiaAceptada(estado),
    acciones: reserva.accionesDisponibles(ahora),
    notasCliente: r.notasCliente,
    creadaEn: r.creadaEn.toISOString(),
    expiraEn: r.expiraEn?.toISOString() ?? null,
    montoReembolso: r.montoReembolso?.valor() ?? null,
  }
}
