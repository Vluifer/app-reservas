import Link from 'next/link'
import { apartamentos, reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { DESCRIPCION_POLITICA } from '@/shared/domain/PoliticaCancelacion'
import { siNoExiste404 } from '@/shared/ui/acciones'
import { BotonEnviarConfirmando } from '@/shared/ui/boton-enviar'
import { EtiquetaEstado, MensajesDeRuta, Tarjeta } from '@/shared/ui/componentes'
import { aTextoISO, hoy } from '@/shared/domain/RangoFechas'
import { formatoDia, formatoMoneda } from '@/shared/ui/formato'
import { FranjaPanel } from '@/shared/ui/portada-panel'
import { cancelarReserva } from '../acciones'
import { DesglosePrecio } from '../componentes/desglose-precio'
import { mensajeParaHuesped } from '../componentes/estado-para-huesped'
import { PortadaConFoto } from '../componentes/portada-viaje'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; exito?: string }> }

const TITULO_SECCION = 'font-display text-xl text-tinta'

/** "lun, 12 de oct", con el año solo si no es el actual (como en "Mis reservas"). */
const diaConAnio = (fecha: string) =>
  `${formatoDia(fecha)}${fecha.slice(0, 4) === String(new Date().getFullYear()) ? '' : ` de ${fecha.slice(0, 4)}`}`

/** Mitad del "pasabordo": el día grande y el año debajo. */
function DiaEstadia({ etiqueta, fecha }: { etiqueta: string; fecha: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-sm text-tinta-suave">{etiqueta}</p>
      <p className="mt-1 font-cifra text-2xl tabular-nums text-tinta first-letter:uppercase">{formatoDia(fecha)}</p>
      <p className="text-sm tabular-nums text-tinta-suave">{fecha.slice(0, 4)}</p>
    </div>
  )
}

export default async function DetalleReservaPagina({ params, searchParams }: Props) {
  const actor = await requerirActor()
  const [{ id }, mensajes] = await Promise.all([params, searchParams])
  const reserva = await reservas.obtener.ejecutar(actor, id).catch(siNoExiste404)
  const ficha = (await apartamentos.fichas.ejecutar([reserva.apartamentoId])).get(reserva.apartamentoId)
  const { titulo, detalle } = mensajeParaHuesped(reserva)

  const huespedes = [
    `${reserva.numAdultos} ${reserva.numAdultos === 1 ? 'adulto' : 'adultos'}`,
    ...(reserva.numNinos > 0 ? [`${reserva.numNinos} ${reserva.numNinos === 1 ? 'niño' : 'niños'}`] : []),
  ].join(' y ')

  const datos: [string, string][] = [
    ['Huéspedes', huespedes],
    ...(ficha ? ([['Dirección', `${ficha.direccion}, ${ficha.ciudad}`]] as [string, string][]) : []),
    ['Solicitada el', diaConAnio(aTextoISO(hoy(new Date(reserva.creadaEn))))],
  ]

  return (
    <div className="space-y-10">
      <PortadaConFoto imagen={ficha?.imagenPrincipal ?? null} compacta>
        <div className="max-w-3xl">
          <Link
            href="/mis-reservas"
            className="-ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-control px-1 text-sm font-medium uppercase tracking-wider text-dorado-claro transition-colors hover:text-white"
          >
            <span aria-hidden>←</span> Mis reservas
          </Link>
          <h1 className="mt-3 text-balance font-display text-4xl leading-tight text-white sm:text-5xl">
            <Link href={`/apartamentos/${reserva.apartamentoId}`} className="decoration-white/40 decoration-1 underline-offset-8 hover:underline">
              {reserva.apartamentoNombre}
            </Link>
          </h1>
          <p className="mt-4 text-lg text-white/80">
            {ficha && `${ficha.ciudad}, ${ficha.region} · `}Código <span className="whitespace-nowrap font-medium tabular-nums text-white">{reserva.codigo}</span>
          </p>
        </div>
        {/* El mensaje del estado va en el recuadro de la estadía; aquí solo la pastilla */}
        <div>
          <EtiquetaEstado estado={reserva.estado} />
        </div>
      </PortadaConFoto>

      <FranjaPanel>
        <MensajesDeRuta {...mensajes} />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section aria-label="Tu estadía" className="space-y-8 rounded-tarjeta bg-superficie p-5 shadow-tarjeta sm:p-8">
            <div role="status" className="rounded-tarjeta bg-hundido px-5 py-4">
              <p className="font-semibold text-tinta">{titulo}</p>
              {detalle && <p className="mt-0.5 text-sm text-tinta-suave">{detalle}</p>}
            </div>

            <div className="grid grid-cols-2 divide-x divide-borde rounded-tarjeta border border-borde">
              <DiaEstadia etiqueta="Llegada" fecha={reserva.llegada} />
              <DiaEstadia etiqueta="Salida" fecha={reserva.salida} />
            </div>

            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {datos.map(([etiqueta, valor]) => (
                <div key={etiqueta}>
                  <dt className="text-sm text-tinta-suave">{etiqueta}</dt>
                  <dd className="mt-1 font-medium text-tinta">{valor}</dd>
                </div>
              ))}
            </dl>

            {reserva.notasCliente && (
              <section className="border-t border-borde pt-8">
                <h2 className={TITULO_SECCION}>Tu mensaje al propietario</h2>
                <blockquote className="mt-4 max-w-prose border-l-2 border-dorado-claro pl-4 text-tinta-suave">{reserva.notasCliente}</blockquote>
              </section>
            )}

            <section className="border-t border-borde pt-8">
              <h2 className={TITULO_SECCION}>Política de cancelación</h2>
              <p className="mt-3 max-w-prose text-tinta-suave">{DESCRIPCION_POLITICA[reserva.politicaCancelacion]}.</p>
            </section>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-28">
            <div className="space-y-5 rounded-tarjeta bg-superficie p-5 shadow-tarjeta sm:p-6">
              <h2 className={TITULO_SECCION}>Detalle del precio</h2>
              <DesglosePrecio precio={reserva.precio} />
              {reserva.montoReembolso !== null && (
                <p className="rounded-control bg-exito-suave px-4 py-3 text-sm text-exito-texto">
                  Reembolso: <strong className="font-semibold tabular-nums">{formatoMoneda(reserva.montoReembolso)}</strong>
                </p>
              )}
            </div>

            {reserva.acciones.cancelar && (
              <Tarjeta tono="peligro" className="space-y-4 shadow-tarjeta">
                <div>
                  <h2 className="font-semibold text-tinta">Cancelar reserva</h2>
                  <p className="mt-1 text-sm text-tinta-suave">{DESCRIPCION_POLITICA[reserva.politicaCancelacion]}.</p>
                </div>
                <form action={cancelarReserva.bind(null, reserva.id)}>
                  <BotonEnviarConfirmando
                    mensaje="¿Seguro que quieres cancelar esta reserva? No se puede deshacer."
                    variante="peligroSuave"
                    className="w-full"
                  >
                    Cancelar reserva
                  </BotonEnviarConfirmando>
                </form>
              </Tarjeta>
            )}
          </aside>
        </div>
      </FranjaPanel>
    </div>
  )
}
