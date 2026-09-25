import Link from 'next/link'
import { reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { DESCRIPCION_POLITICA } from '@/shared/domain/PoliticaCancelacion'
import { siNoExiste404 } from '@/shared/ui/acciones'
import { BotonEnviarConfirmando } from '@/shared/ui/boton-enviar'
import { claseEnlaceVolver, EtiquetaEstado, MensajesDeRuta, Tarjeta } from '@/shared/ui/componentes'
import { formatoFecha, formatoMoneda } from '@/shared/ui/formato'
import { cancelarReserva } from '../acciones'
import { DesglosePrecio } from '../componentes/desglose-precio'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; exito?: string }> }

export default async function DetalleReservaPagina({ params, searchParams }: Props) {
  const actor = await requerirActor()
  const [{ id }, mensajes] = await Promise.all([params, searchParams])
  const reserva = await reservas.obtener.ejecutar(actor, id).catch(siNoExiste404)

  const datos = [
    ['Llegada', formatoFecha(reserva.llegada)],
    ['Salida', formatoFecha(reserva.salida)],
    [
      'Huéspedes',
      `${reserva.numAdultos} ${reserva.numAdultos === 1 ? 'adulto' : 'adultos'}, ${reserva.numNinos} ${reserva.numNinos === 1 ? 'niño' : 'niños'}`,
    ],
    ['Cancelación', DESCRIPCION_POLITICA[reserva.politicaCancelacion]],
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <MensajesDeRuta {...mensajes} />

      <div>
        <Link href="/mis-reservas" className={claseEnlaceVolver}>
          <span aria-hidden>←</span> Mis reservas
        </Link>
        <header className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-tinta-suave">Reserva {reserva.codigo}</p>
            <h1 className="mt-2 font-display text-4xl leading-tight text-tinta">
              <Link
                href={`/apartamentos/${reserva.apartamentoId}`}
                className="decoration-acento decoration-2 underline-offset-4 hover:underline"
              >
                {reserva.apartamentoNombre}
              </Link>
            </h1>
          </div>
          <EtiquetaEstado estado={reserva.estado} />
        </header>
      </div>

      <Tarjeta className="space-y-6">
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta}>
              <dt className="text-sm text-tinta-suave">{etiqueta}</dt>
              <dd className="mt-1 font-medium text-tinta">{valor}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t border-borde pt-6">
          <DesglosePrecio precio={reserva.precio} />
        </div>
        {reserva.montoReembolso !== null && (
          <p className="rounded-control bg-exito-suave px-4 py-3 text-sm text-exito-texto">
            Reembolso: <strong className="font-semibold tabular-nums">{formatoMoneda(reserva.montoReembolso)}</strong>
          </p>
        )}
        {reserva.notasCliente && (
          <blockquote className="border-l-2 border-acento pl-4 text-sm italic text-tinta-suave">{reserva.notasCliente}</blockquote>
        )}
      </Tarjeta>

      {reserva.acciones.cancelar && (
        <Tarjeta tono="peligro" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-tinta">Cancelar reserva</h2>
            <p className="mt-1 text-sm text-tinta-suave">{DESCRIPCION_POLITICA[reserva.politicaCancelacion]}</p>
          </div>
          <form action={cancelarReserva.bind(null, reserva.id)} className="shrink-0">
            <BotonEnviarConfirmando mensaje="¿Seguro que quieres cancelar esta reserva? No se puede deshacer.">
              Cancelar reserva
            </BotonEnviarConfirmando>
          </form>
        </Tarjeta>
      )}
    </div>
  )
}
