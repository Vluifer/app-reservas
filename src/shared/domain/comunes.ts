/** Piezas pequeñas compartidas por todos los módulos. */

export const nuevoId = (): string => crypto.randomUUID()

export interface Reloj {
  ahora(): Date
}

export const relojDelSistema: Reloj = { ahora: () => new Date() }

export interface Pagina<T> {
  items: T[]
  total: number
  pagina: number
  porPagina: number
  totalPaginas: number
}

export function crearPagina<T>(items: T[], total: number, pagina: number, porPagina: number): Pagina<T> {
  return { items, total, pagina, porPagina, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) }
}

export function mapearPagina<T, U>(pagina: Pagina<T>, transformar: (item: T) => U): Pagina<U> {
  return { ...pagina, items: pagina.items.map(transformar) }
}
