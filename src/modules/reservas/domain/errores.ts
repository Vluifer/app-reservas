import { ErrorDeDominio } from '@/shared/domain/errores'
import { ETIQUETA_ESTADO, type EstadoReserva } from './EstadoReserva'

export class FechasNoDisponiblesError extends ErrorDeDominio {
  constructor() {
    super('El apartamento ya está reservado en esas fechas')
  }
}

export class TransicionInvalidaError extends ErrorDeDominio {
  constructor(desde: EstadoReserva, hacia: EstadoReserva) {
    super(`Una reserva ${ETIQUETA_ESTADO[desde]} no puede pasar a ${ETIQUETA_ESTADO[hacia]}`)
  }
}
