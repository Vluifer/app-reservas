import { ErrorDeValidacion } from '@/shared/domain/errores'

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Email normalizado (sin espacios y en minúsculas) con formato válido. */
export class Email {
  private constructor(readonly valor: string) {}

  static crear(valor: string): Email {
    const normalizado = valor.trim().toLowerCase()
    if (!FORMATO_EMAIL.test(normalizado)) {
      throw new ErrorDeValidacion('El email no tiene un formato válido')
    }
    return new Email(normalizado)
  }
}
