import { asegurar } from './errores'

/**
 * Valor monetario inmutable.
 * Se guarda en centavos (enteros) para evitar errores de redondeo de coma flotante.
 */
export class Dinero {
  private constructor(readonly centavos: number) {}

  static cero(): Dinero {
    return new Dinero(0)
  }

  static desde(valor: number | string): Dinero {
    const numero = typeof valor === 'string' ? Number(valor) : valor
    asegurar(Number.isFinite(numero), 'El monto no es un número válido')
    asegurar(numero >= 0, 'El monto no puede ser negativo')
    return new Dinero(Math.round(numero * 100))
  }

  sumar(otro: Dinero): Dinero {
    return new Dinero(this.centavos + otro.centavos)
  }

  multiplicar(factor: number): Dinero {
    return new Dinero(Math.round(this.centavos * factor))
  }

  porcentaje(porcentaje: number): Dinero {
    return this.multiplicar(porcentaje / 100)
  }

  esCero(): boolean {
    return this.centavos === 0
  }

  igualA(otro: Dinero): boolean {
    return this.centavos === otro.centavos
  }

  /** Valor en unidades (ej. 1500.5). */
  valor(): number {
    return this.centavos / 100
  }

  /** Representación con 2 decimales para columnas DECIMAL de la base de datos. */
  aTextoDecimal(): string {
    return (this.centavos / 100).toFixed(2)
  }
}
