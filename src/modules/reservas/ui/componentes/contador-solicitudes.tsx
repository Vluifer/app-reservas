import { reservas } from '@/contenedor'
import { obtenerActor } from '@/modules/identidad/ui/sesion'
import { esAnfitrion } from '@/shared/domain/Actor'

const TONOS = {
  /** Sobre la cabecera gris oscuro */
  claro: 'bg-white text-cabecera',
  /** Sobre fondo blanco o sobre la pestaña activa (negra) */
  oscuro: 'bg-tinta text-white group-aria-[current=page]:bg-white group-aria-[current=page]:text-tinta',
}

/**
 * Pastilla con cuántas solicitudes esperan respuesta del propietario.
 * No muestra nada a quien no es anfitrión o no tiene solicitudes pendientes.
 */
export async function ContadorSolicitudes({ tono = 'oscuro' }: { tono?: keyof typeof TONOS }) {
  const actor = await obtenerActor()
  if (!actor || !esAnfitrion(actor)) return null
  const pendientes = (await reservas.listarDePropietario.ejecutar(actor)).filter((r) => r.acciones.confirmar).length
  if (pendientes === 0) return null

  return (
    <span data-aviso className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold leading-5 tabular-nums ${TONOS[tono]}`}>
      {pendientes}
      <span className="sr-only"> {pendientes === 1 ? 'solicitud por responder' : 'solicitudes por responder'}</span>
    </span>
  )
}
