import { reservas } from '@/contenedor'

/**
 * Tarea programada (p. ej. Vercel Cron cada hora): expira las solicitudes vencidas
 * y avanza las estadías (CONFIRMADA → EN_CURSO → COMPLETADA).
 * Llamar con el header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }
  const expiradas = await reservas.expirarPendientes.ejecutar()
  const estadiasAvanzadas = await reservas.avanzarEstadias.ejecutar()
  return Response.json({ expiradas, estadiasAvanzadas })
}
