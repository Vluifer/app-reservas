import { ErrorDeDominio } from '@/shared/domain/errores'

export class EmailYaRegistradoError extends ErrorDeDominio {
  constructor() {
    super('Este email ya está registrado')
  }
}

/** Mismo mensaje exista o no el email, para no revelar qué cuentas existen. */
export class CredencialesInvalidasError extends ErrorDeDominio {
  constructor() {
    super('Email o contraseña incorrectos')
  }
}
