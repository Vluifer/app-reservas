import { ErrorDeValidacion } from '@/shared/domain/errores'

/** Lectura tipada de campos de FormData en las Server Actions. */

/** Valor tal cual (útil para contraseñas, que no deben recortarse). */
export function valor(datos: FormData, campo: string): string {
  const v = datos.get(campo)
  return typeof v === 'string' ? v : ''
}

export function texto(datos: FormData, campo: string): string {
  return valor(datos, campo).trim()
}

export function textoOpcional(datos: FormData, campo: string): string | null {
  return texto(datos, campo) || null
}

export function numero(datos: FormData, campo: string, etiqueta = campo): number {
  const v = texto(datos, campo)
  const n = Number(v)
  if (v === '' || !Number.isFinite(n)) throw new ErrorDeValidacion(`${etiqueta} debe ser un número`)
  return n
}

export function numeroOpcional(datos: FormData, campo: string, etiqueta = campo): number | null {
  return texto(datos, campo) === '' ? null : numero(datos, campo, etiqueta)
}

/** "wifi, piscina ,parking" → ["wifi", "piscina", "parking"] */
export function listaSeparadaPorComas(datos: FormData, campo: string): string[] {
  return texto(datos, campo)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Todos los valores de texto de un campo repetido (p. ej. casillas con el mismo name). */
export function textos(datos: FormData, campo: string): string[] {
  return datos
    .getAll(campo)
    .filter((v): v is string => typeof v === 'string')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function archivos(datos: FormData, campo: string): File[] {
  return datos.getAll(campo).filter((v): v is File => v instanceof File && v.size > 0)
}

/** Evita redirecciones abiertas: solo rutas internas. */
export function rutaInterna(ruta: string, porDefecto = '/'): string {
  return ruta.startsWith('/') && !ruta.startsWith('//') ? ruta : porDefecto
}

/** Convierte un parámetro de URL a número positivo, o undefined. */
export function numeroDeParametro(v: string | undefined): number | undefined {
  const n = Number(v)
  return v && Number.isFinite(n) && n > 0 ? n : undefined
}
