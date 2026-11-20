import { reservas } from '@/contenedor'
import { obtenerActor } from '@/modules/identidad/ui/sesion'
import { esAnfitrion } from '@/shared/domain/Actor'

/**
 * Pastilla con cuántas solicitudes esperan respuesta del propietario.
 * En dorado: se distingue sobre blanco y sobre piedra (cabecera y pestaña activa).
 * No muestra nada a quien no es anfitrión o no tiene solicitudes pendientes.
 */
export async function ContadorSolicitudes() {
  const actor = await obtenerActor()
  if (!actor || !esAnfitrion(actor)) return null
  const pendientes = (await reservas.listarDePropietario.ejecutar(actor)).filter((r) => r.acciones.confirmar).length
  if (pendientes === 0) return null

  return (
    <span data-aviso className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-dorado px-1.5 text-xs font-semibold leading-5 tabular-nums tracking-normal text-white">
      {pendientes}
      <span className="sr-only"> {pendientes === 1 ? 'solicitud por responder' : 'solicitudes por responder'}</span>
    </span>
  )
}
