/**
 * Error base para cualquier regla de negocio incumplida.
 * Su mensaje está pensado para mostrarse tal cual al usuario.
 */
export class ErrorDeDominio extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = new.target.name
  }
}

export class ErrorDeValidacion extends ErrorDeDominio {}

export class NoEncontradoError extends ErrorDeDominio {}

export class NoAutorizadoError extends ErrorDeDominio {
  constructor(mensaje = 'No tienes permiso para realizar esta acción') {
    super(mensaje)
  }
}

/** Lanza un ErrorDeValidacion con `mensaje` si la condición no se cumple. */
export function asegurar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new ErrorDeValidacion(mensaje)
}

/** Otra petición modificó el mismo agregado entre que se leyó y se guardó (bloqueo optimista). */
export class ConflictoDeConcurrenciaError extends ErrorDeDominio {
  constructor() {
    super('Alguien más modificó estos datos al mismo tiempo. Recarga la página e inténtalo de nuevo.')
  }
}
