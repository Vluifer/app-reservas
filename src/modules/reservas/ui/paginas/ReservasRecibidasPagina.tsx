import { reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { BotonEnviar, BotonEnviarConfirmando } from '@/shared/ui/boton-enviar'
import { Avatar, EstadoVacio, EtiquetaEstado, MensajesDeRuta, RangoFechasTexto } from '@/shared/ui/componentes'
import { formatoDia, formatoFecha, formatoFechaHora, formatoMoneda } from '@/shared/ui/formato'
import { FranjaPanel, PortadaPanel } from '@/shared/ui/portada-panel'
import type { ReservaDTO } from '../../application/ReservaDTO'
import { cancelarReservaComoPropietario, confirmarReserva, rechazarReserva } from '../acciones'
import { DesglosePrecio } from '../componentes/desglose-precio'

const ENLACE_CONTACTO = 'text-tinta-suave underline decoration-borde-control underline-offset-4 hover:text-tinta hover:decoration-tinta'
const TITULO_SECCION = 'font-display text-xl text-tinta sm:text-2xl'

function huespedes(r: ReservaDTO): string {
  const total = r.numAdultos + r.numNinos
  return `${total} ${total === 1 ? 'huésped' : 'huéspedes'}`
}

function TarjetaRecibida({ reserva: r }: { reserva: ReservaDTO }) {
  const tieneAcciones = r.acciones.confirmar || r.acciones.rechazar || r.acciones.cancelar
  return (
    <article className="space-y-5 rounded-tarjeta bg-superficie p-5 shadow-tarjeta sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar nombre={r.clienteNombre} />
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-tinta">{r.clienteNombre}</h3>
            <p className="flex flex-wrap gap-x-3 text-sm">
              <a href={`mailto:${r.clienteEmail}`} className={ENLACE_CONTACTO}>
                {r.clienteEmail}
              </a>
              {r.clienteTelefono && (
                <a href={`tel:${r.clienteTelefono}`} className={ENLACE_CONTACTO}>
                  {r.clienteTelefono}
                </a>
              )}
            </p>
          </div>
        </div>
        <EtiquetaEstado estado={r.estado} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t border-borde pt-5">
        <div>
          <p className="text-sm text-tinta-suave">{r.apartamentoNombre}</p>
          <p className="mt-1 font-cifra text-xl tabular-nums text-tinta">
            <RangoFechasTexto desde={formatoDia(r.llegada)} hasta={formatoDia(r.salida)} />
          </p>
          <p className="mt-0.5 text-sm text-tinta-suave">
            {huespedes(r)}, {r.precio.noches} {r.precio.noches === 1 ? 'noche' : 'noches'}, código {r.codigo}
          </p>
        </div>
        <p className="text-sm text-tinta-suave">
          Total <span className="text-lg font-semibold tabular-nums text-tinta">{formatoMoneda(r.precio.total)}</span>
        </p>
      </div>

      {r.acciones.confirmar && r.expiraEn && (
        <p className="text-sm font-medium text-tinta">Responde antes del {formatoFechaHora(r.expiraEn)}</p>
      )}

      {r.notasCliente && <blockquote className="border-l-2 border-borde-control pl-4 text-sm text-tinta-suave">{r.notasCliente}</blockquote>}

      <details className="group rounded-tarjeta bg-hundido">
        <summary className="flex min-h-11 list-none items-center justify-between gap-2 px-4 text-sm font-medium text-tinta [&::-webkit-details-marker]:hidden">
          Ver desglose del precio
          <svg aria-hidden viewBox="0 0 24 24" className="size-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div className="space-y-3 px-4 pb-4">
          <DesglosePrecio precio={r.precio} />
          {r.montoReembolso !== null && (
            <p className="text-sm text-tinta-suave">
              Reembolsado al huésped: <span className="font-medium tabular-nums text-tinta">{formatoMoneda(r.montoReembolso)}</span>
            </p>
          )}
        </div>
      </details>

      {/* Una solicitud se responde (confirmar/rechazar); una reserva ya aceptada solo se puede cancelar */}
      {tieneAcciones && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-borde pt-5">
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
              <BotonEnviarConfirmando mensaje="¿Cancelar esta reserva confirmada? No se puede deshacer.">Cancelar reserva</BotonEnviarConfirmando>
            </form>
          )}
        </div>
      )}
    </article>
  )
}

/** Historial: una fila por reserva, sin acciones. */
function FilaAnterior({ reserva: r }: { reserva: ReservaDTO }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
      <Avatar nombre={r.clienteNombre} tamano="sm" />
      {/* basis-48: en móvil el nombre conserva su ancho y el precio y el estado bajan a otra línea */}
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate font-medium text-tinta">{r.clienteNombre}</p>
        {/* relative: el texto sr-only del rango (posición absoluta) queda recortado aquí y no ensancha la página */}
        <p className="relative truncate text-sm text-tinta-suave">
          {r.apartamentoNombre}, <RangoFechasTexto desde={formatoFecha(r.llegada)} hasta={formatoFecha(r.salida)} />
        </p>
      </div>
      <div className="flex items-center gap-3 max-sm:w-full max-sm:pl-13">
        <span className="text-sm tabular-nums text-tinta">{formatoMoneda(r.precio.total)}</span>
        <EtiquetaEstado estado={r.estado} />
      </div>
    </li>
  )
}

export default async function ReservasRecibidasPagina({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; exito?: string }>
}) {
  const actor = await requerirActor(ROLES_ANFITRION)
  const [lista, mensajes] = await Promise.all([reservas.listarDePropietario.ejecutar(actor), searchParams])

  const porResponder = lista.filter((r) => r.acciones.confirmar).sort((a, b) => (a.expiraEn ?? '').localeCompare(b.expiraEn ?? ''))
  const confirmadas = lista.filter((r) => r.aceptada && !r.finalizada).sort((a, b) => a.llegada.localeCompare(b.llegada))
  const anteriores = lista.filter((r) => r.finalizada).sort((a, b) => b.llegada.localeCompare(a.llegada))

  const secciones = [
    { id: 'por-responder', titulo: 'Por responder', reservas: porResponder, vacio: 'No tienes solicitudes esperando respuesta.' },
    { id: 'confirmadas', titulo: 'Confirmadas', reservas: confirmadas, vacio: 'No tienes estadías confirmadas por venir.' },
  ]

  return (
    <div className="space-y-12">
      <PortadaPanel titulo="Reservas recibidas" descripcion="Responde las solicitudes a tiempo y sigue tus estadías confirmadas." />

      <FranjaPanel>
        <MensajesDeRuta {...mensajes} />

        {lista.length === 0 ? (
          <EstadoVacio titulo="Aún no has recibido reservas" descripcion="Cuando un huésped solicite una estadía, aparecerá aquí para que la confirmes." />
        ) : (
          <>
            {secciones.map((s) => (
              <section key={s.id} aria-labelledby={s.id} className="space-y-5">
                <h2 id={s.id} className={TITULO_SECCION}>
                  {s.titulo} <span className="font-sans text-base font-normal tabular-nums text-tinta-suave">({s.reservas.length})</span>
                </h2>
                {s.reservas.length === 0 ? (
                  <p className="text-tinta-suave">{s.vacio}</p>
                ) : (
                  <ul className="space-y-5">
                    {s.reservas.map((r) => (
                      <li key={r.id}>
                        <TarjetaRecibida reserva={r} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {anteriores.length > 0 && (
              <section aria-labelledby="anteriores" className="space-y-5 border-t border-borde-control/30 pt-10">
                <h2 id="anteriores" className={TITULO_SECCION}>
                  Anteriores <span className="font-sans text-base font-normal tabular-nums text-tinta-suave">({anteriores.length})</span>
                </h2>
                <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta">
                  {anteriores.map((r) => (
                    <FilaAnterior key={r.id} reserva={r} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </FranjaPanel>
    </div>
  )
}
