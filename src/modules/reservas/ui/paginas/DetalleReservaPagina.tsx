import Link from 'next/link'
import { apartamentos, reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { DESCRIPCION_POLITICA } from '@/shared/domain/PoliticaCancelacion'
import { siNoExiste404 } from '@/shared/ui/acciones'
import { BotonEnviarConfirmando } from '@/shared/ui/boton-enviar'
import { claseEnlaceVolver, EtiquetaEstado, MensajesDeRuta, Tarjeta } from '@/shared/ui/componentes'
import { formatoDia, formatoFecha, formatoMoneda } from '@/shared/ui/formato'
import { cancelarReserva } from '../acciones'
import { DesglosePrecio } from '../componentes/desglose-precio'
import { FotoApartamento, mensajeParaHuesped } from '../componentes/estado-para-huesped'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; exito?: string }> }

const TITULO_SECCION = 'font-display text-xl text-tinta'

/** Mitad del "pasabordo": el día grande y el año debajo. */
function DiaEstadia({ etiqueta, fecha }: { etiqueta: string; fecha: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-sm text-tinta-suave">{etiqueta}</p>
      <p className="mt-1 font-display text-2xl tabular-nums text-tinta first-letter:uppercase">{formatoDia(fecha)}</p>
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
    ['Solicitada el', formatoFecha(reserva.creadaEn)],
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <MensajesDeRuta {...mensajes} />

      <div className="space-y-4">
        <Link href="/mis-reservas" className={claseEnlaceVolver}>
          <span aria-hidden>←</span> Mis reservas
        </Link>
        <div className="h-48 overflow-hidden rounded-bloque sm:h-64 lg:h-72">
          <FotoApartamento url={ficha?.imagenPrincipal ?? null} sizes="(max-width: 1024px) 100vw, 1024px" />
        </div>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl leading-tight text-tinta sm:text-4xl">
              <Link
                href={`/apartamentos/${reserva.apartamentoId}`}
                className="decoration-tinta/40 decoration-1 underline-offset-4 hover:underline"
              >
                {reserva.apartamentoNombre}
              </Link>
            </h1>
            <p className="mt-2 text-tinta-suave">
              {ficha && `${ficha.ciudad}, ${ficha.region}. `}Código de reserva <span className="font-medium tabular-nums text-tinta">{reserva.codigo}</span>
            </p>
          </div>
          <EtiquetaEstado estado={reserva.estado} />
        </header>
      </div>

      <div role="status" className="rounded-tarjeta bg-hundido px-5 py-4">
        <p className="font-semibold text-tinta">{titulo}</p>
        {detalle && <p className="mt-0.5 text-sm text-tinta-suave">{detalle}</p>}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="space-y-10">
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
            <section className="border-t border-borde pt-10">
              <h2 className={TITULO_SECCION}>Tu mensaje al propietario</h2>
              <blockquote className="mt-4 max-w-prose border-l-2 border-borde-control pl-4 text-tinta-suave">{reserva.notasCliente}</blockquote>
            </section>
          )}

          <section className="border-t border-borde pt-10">
            <h2 className={TITULO_SECCION}>Política de cancelación</h2>
            <p className="mt-3 max-w-prose text-tinta-suave">{DESCRIPCION_POLITICA[reserva.politicaCancelacion]}.</p>
          </section>
        </div>

        <aside className="space-y-5">
          <Tarjeta className="space-y-5">
            <h2 className={TITULO_SECCION}>Detalle del precio</h2>
            <DesglosePrecio precio={reserva.precio} />
            {reserva.montoReembolso !== null && (
              <p className="rounded-control bg-exito-suave px-4 py-3 text-sm text-exito-texto">
                Reembolso: <strong className="font-semibold tabular-nums">{formatoMoneda(reserva.montoReembolso)}</strong>
              </p>
            )}
          </Tarjeta>

          {reserva.acciones.cancelar && (
            <Tarjeta tono="peligro" className="space-y-4">
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
    </div>
  )
}
