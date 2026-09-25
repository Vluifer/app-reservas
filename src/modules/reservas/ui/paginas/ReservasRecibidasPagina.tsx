import { reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { BotonEnviar, BotonEnviarConfirmando } from '@/shared/ui/boton-enviar'
import { EstadoVacio, EtiquetaEstado, MensajesDeRuta, RangoFechasTexto, Tarjeta } from '@/shared/ui/componentes'
import { formatoFecha, formatoMoneda } from '@/shared/ui/formato'
import { cancelarReservaComoPropietario, confirmarReserva, rechazarReserva } from '../acciones'

const ENLACE_CONTACTO = 'text-tinta-suave underline decoration-borde-control underline-offset-4 hover:text-tinta hover:decoration-acento'

export default async function ReservasRecibidasPagina({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; exito?: string }>
}) {
  const actor = await requerirActor(ROLES_ANFITRION)
  const [lista, mensajes] = await Promise.all([reservas.listarDePropietario.ejecutar(actor), searchParams])

  return (
    <div className="space-y-8">
      <MensajesDeRuta {...mensajes} />
      <h1 className="font-display text-4xl text-tinta sm:text-5xl">Reservas recibidas</h1>

      {lista.length === 0 ? (
        <EstadoVacio titulo="Aún no has recibido reservas" />
      ) : (
        <ul className="space-y-3">
          {lista.map((r) => {
            const huespedes = r.numAdultos + r.numNinos
            return (
              <li key={r.id}>
                <Tarjeta className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <h2 className="font-semibold text-tinta">{r.apartamentoNombre}</h2>
                      <p className="text-sm tabular-nums text-tinta-suave">
                        <RangoFechasTexto desde={formatoFecha(r.llegada)} hasta={formatoFecha(r.salida)} /> · {huespedes}{' '}
                        {huespedes === 1 ? 'huésped' : 'huéspedes'}
                      </p>
                      <p className="font-mono text-xs uppercase tracking-wider text-tinta-suave">{r.codigo}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <EtiquetaEstado estado={r.estado} />
                      <p className="text-lg font-semibold tabular-nums text-tinta">{formatoMoneda(r.precio.total)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-control bg-hundido px-4 py-3 text-sm">
                    <span className="font-medium text-tinta">{r.clienteNombre}</span>
                    <a href={`mailto:${r.clienteEmail}`} className={ENLACE_CONTACTO}>
                      {r.clienteEmail}
                    </a>
                    {r.clienteTelefono && (
                      <a href={`tel:${r.clienteTelefono}`} className={ENLACE_CONTACTO}>
                        {r.clienteTelefono}
                      </a>
                    )}
                  </div>

                  {r.notasCliente && (
                    <blockquote className="border-l-2 border-acento pl-4 text-sm italic text-tinta-suave">{r.notasCliente}</blockquote>
                  )}

                  {/* Una solicitud se responde (confirmar/rechazar); una reserva ya aceptada solo se puede cancelar */}
                  {(r.acciones.confirmar || r.acciones.rechazar || r.acciones.cancelar) && (
                    <div className="flex flex-wrap justify-end gap-2 border-t border-borde pt-4">
                      {r.acciones.rechazar && (
                        <form action={rechazarReserva.bind(null, r.id)}>
                          <BotonEnviarConfirmando variante="secundario" mensaje="¿Rechazar esta solicitud? No se puede deshacer.">
                            Rechazar
                          </BotonEnviarConfirmando>
                        </form>
                      )}
                      {r.acciones.confirmar && (
                        <form action={confirmarReserva.bind(null, r.id)}>
                          <BotonEnviar>Confirmar</BotonEnviar>
                        </form>
                      )}
                      {r.acciones.cancelar && !r.acciones.rechazar && (
                        <form action={cancelarReservaComoPropietario.bind(null, r.id)}>
                          <BotonEnviarConfirmando mensaje="¿Cancelar esta reserva confirmada? No se puede deshacer.">
                            Cancelar
                          </BotonEnviarConfirmando>
                        </form>
                      )}
                    </div>
                  )}
                </Tarjeta>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
