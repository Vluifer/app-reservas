import { reservas } from '@/contenedor'

type Tarea = () => Promise<{ procesadas: number; omitidas: number }>

/** Corre una tarea sin que su fallo impida correr las demás. */
async function correr(nombre: string, tarea: Tarea) {
  try {
    return await tarea()
  } catch (error) {
    console.error(`[cron] Falló la tarea "${nombre}"`, error)
    return { error: 'Falló; ver los logs del servidor' }
  }
}

/**
 * Tarea programada (p. ej. Vercel Cron cada hora): expira las solicitudes vencidas
 * y avanza las estadías (CONFIRMADA → EN_CURSO → COMPLETADA).
 * Llamar con el header: Authorization: Bearer <CRON_SECRET>
 *
 * Responde { expiradas, estadiasAvanzadas }, cada una con { procesadas, omitidas } o { error }.
 * "omitidas" son reservas que otra petición cambió a la vez; la próxima corrida las vuelve a evaluar.
 */
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET
  if (!secreto || request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }
  const expiradas = await correr('expirar pendientes', () => reservas.expirarPendientes.ejecutar())
  const estadiasAvanzadas = await correr('avanzar estadías', () => reservas.avanzarEstadias.ejecutar())
  const huboError = 'error' in expiradas || 'error' in estadiasAvanzadas
  return Response.json({ expiradas, estadiasAvanzadas }, { status: huboError ? 500 : 200 })
}
