import type { Dinero } from '@/shared/domain/Dinero'
import type { RangoFechas } from '@/shared/domain/RangoFechas'

/** Comisión de la plataforma sobre el valor de las noches. */
export const TARIFA_SERVICIO_PORCENTAJE = 10
/** Impuesto sobre el subtotal (noches + limpieza + servicio). */
export const IMPUESTOS_PORCENTAJE = 19

export interface DesglosePrecio {
  noches: number
  precioNoches: Dinero
  tarifaLimpieza: Dinero
  tarifaServicio: Dinero
  impuestos: Dinero
  total: Dinero
}

/** El precio siempre se calcula en el servidor; nunca se acepta desde el cliente. */
export function calcularPrecio(precioPorNoche: Dinero, tarifaLimpieza: Dinero, rango: RangoFechas): DesglosePrecio {
  const precioNoches = precioPorNoche.multiplicar(rango.noches)
  const tarifaServicio = precioNoches.porcentaje(TARIFA_SERVICIO_PORCENTAJE)
  const subtotal = precioNoches.sumar(tarifaLimpieza).sumar(tarifaServicio)
  const impuestos = subtotal.porcentaje(IMPUESTOS_PORCENTAJE)

  return {
    noches: rango.noches,
    precioNoches,
    tarifaLimpieza,
    tarifaServicio,
    impuestos,
    total: subtotal.sumar(impuestos),
  }
}
