/**
 * A dónde vuelve una acción del panel. Solo acepta rutas internas del panel ("/dashboard/..."); cualquier otra
 * cosa usa `porDefecto`. Incluye el FormData que Next pasa como último argumento cuando la acción se enlaza
 * solo con el id (`confirmarReserva.bind(null, id)`), por eso el parámetro es `unknown`.
 */
export function rutaDeVuelta(volverA: unknown, porDefecto: string): string {
  return typeof volverA === 'string' && volverA.startsWith('/dashboard/') ? volverA : porDefecto
}
