import { reservas } from '@/contenedor'

/**
 * Tarea programada (p. ej. Vercel Cron cada hora).
 * Llamar con el header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }
  const expiradas = await reservas.expirarPendientes.ejecutar()
  return Response.json({ expiradas })
}
