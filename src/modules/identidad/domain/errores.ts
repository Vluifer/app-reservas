import { ErrorDeDominio } from '@/shared/domain/errores'

export class EmailYaRegistradoError extends ErrorDeDominio {
  constructor() {
    super('Ya existe una cuenta con este correo. Inicia sesión o usa otro.')
  }
}

/** Mismo mensaje exista o no el email, para no revelar qué cuentas existen. */
export class CredencialesInvalidasError extends ErrorDeDominio {
  constructor() {
    super('El correo o la contraseña no son correctos')
  }
}
