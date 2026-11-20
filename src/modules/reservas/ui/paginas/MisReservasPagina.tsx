import Link from 'next/link'
import { apartamentos, reservas } from '@/contenedor'
import type { FichaApartamento as Ficha } from '@/modules/apartamentos/application/ConsultasApartamentos'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { EtiquetaEstado, RangoFechasTexto } from '@/shared/ui/componentes'
import { formatoDia, formatoMoneda } from '@/shared/ui/formato'
import { FranjaPanel } from '@/shared/ui/portada-panel'
import type { ReservaDTO } from '../../application/ReservaDTO'
import { FotoApartamento, mensajeParaHuesped } from '../componentes/estado-para-huesped'
import { PortadaProximoViaje, PortadaSinViajes } from '../componentes/portada-viaje'

const huespedes = (r: ReservaDTO) => {
  const total = r.numAdultos + r.numNinos
  return `${total} ${total === 1 ? 'huésped' : 'huéspedes'}`
}

/** Próximas: tarjeta ancha con foto, qué está pasando con la reserva y el total. */
function TarjetaProxima({ reserva, ficha }: { reserva: ReservaDTO; ficha?: Ficha }) {
  const { titulo, detalle } = mensajeParaHuesped(reserva)
  return (
    <Link
      href={`/mis-reservas/${reserva.id}`}
      className="group flex flex-col overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta transition-[translate,box-shadow] duration-300 hover:shadow-tarjeta-elevada motion-safe:hover:-translate-y-1 sm:flex-row"
    >
      <div className="aspect-[16/9] shrink-0 sm:aspect-auto sm:w-64 lg:w-80">
        <FotoApartamento url={ficha?.imagenPrincipal ?? null} sizes="(max-width: 640px) 100vw, 320px" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl text-tinta">
              {reserva.apartamentoNombre}
            </h3>
            {ficha && (
              <p className="text-sm text-tinta-suave">
                {ficha.ciudad}, {ficha.region}
              </p>
            )}
          </div>
          <EtiquetaEstado estado={reserva.estado} />
        </div>

        <div>
          <p className="font-medium text-tinta">{titulo}</p>
          {detalle && <p className="mt-0.5 text-sm text-tinta-suave">{detalle}</p>}
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t border-borde pt-4">
          <div>
            <p className="font-cifra text-xl tabular-nums text-tinta">
              <RangoFechasTexto desde={formatoDia(reserva.llegada)} hasta={formatoDia(reserva.salida)} />
            </p>
            <p className="mt-0.5 text-sm text-tinta-suave">
              {huespedes(reserva)}, código {reserva.codigo}
            </p>
          </div>
          <p className="text-sm text-tinta-suave">
            Total <span className="font-cifra text-lg tabular-nums text-tinta">{formatoMoneda(reserva.precio.total)}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}

/** Anteriores: tarjeta compacta, el historial pesa menos que lo que viene. */
function TarjetaAnterior({ reserva, ficha }: { reserva: ReservaDTO; ficha?: Ficha }) {
  return (
    <Link
      href={`/mis-reservas/${reserva.id}`}
      className="group flex h-full items-center gap-4 rounded-tarjeta bg-superficie p-3 shadow-tarjeta transition-[translate,box-shadow] duration-300 hover:shadow-tarjeta-elevada motion-safe:hover:-translate-y-0.5"
    >
      <div className="size-20 shrink-0 overflow-hidden rounded-control">
        <FotoApartamento url={ficha?.imagenPrincipal ?? null} sizes="80px" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="truncate font-semibold text-tinta">{reserva.apartamentoNombre}</p>
        {/* relative: el texto sr-only del rango (posición absoluta) queda dentro de la tarjeta */}
        <p className="relative text-sm tabular-nums text-tinta-suave">
          <RangoFechasTexto desde={formatoDia(reserva.llegada)} hasta={formatoDia(reserva.salida)} />
          {reserva.llegada.slice(0, 4) !== String(new Date().getFullYear()) && ` de ${reserva.llegada.slice(0, 4)}`}
        </p>
        <EtiquetaEstado estado={reserva.estado} />
      </div>
    </Link>
  )
}

export default async function MisReservasPagina() {
  const actor = await requerirActor()
  const lista = await reservas.listarDeCliente.ejecutar(actor)
  const fichas = await apartamentos.fichas.ejecutar(lista.map((r) => r.apartamentoId))

  // Las próximas, de la más cercana a la más lejana; el historial, de la más reciente a la más antigua
  const proximas = lista.filter((r) => !r.finalizada).sort((a, b) => a.llegada.localeCompare(b.llegada))
  const anteriores = lista.filter((r) => r.finalizada).sort((a, b) => b.llegada.localeCompare(a.llegada))

  const [siguiente, ...otrasProximas] = proximas

  return (
    <div className="space-y-12">
      <h1 className="sr-only">Mis reservas</h1>

      {siguiente ? <PortadaProximoViaje reserva={siguiente} ficha={fichas.get(siguiente.apartamentoId)} ahora={new Date()} /> : <PortadaSinViajes />}

      {(otrasProximas.length > 0 || anteriores.length > 0) && (
        <FranjaPanel>
          {otrasProximas.length > 0 && (
            <section aria-labelledby="proximas" className="space-y-5">
              <h2 id="proximas" className="font-display text-xl text-tinta sm:text-2xl">
                También próximas
              </h2>
              <ul className="space-y-5">
                {otrasProximas.map((r) => (
                  <li key={r.id}>
                    <TarjetaProxima reserva={r} ficha={fichas.get(r.apartamentoId)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {anteriores.length > 0 && (
            <section aria-labelledby="anteriores" className="space-y-5">
              <h2 id="anteriores" className="font-display text-xl text-tinta sm:text-2xl">
                Anteriores
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {anteriores.map((r) => (
                  // min-w-0: un nombre largo se recorta en vez de ensanchar la columna (y la página en móvil)
                  <li key={r.id} className="min-w-0">
                    <TarjetaAnterior reserva={r} ficha={fichas.get(r.apartamentoId)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </FranjaPanel>
      )}
    </div>
  )
}
