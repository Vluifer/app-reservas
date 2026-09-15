import { apartamentos } from '@/contenedor'
import { obtenerActor } from '@/modules/identidad/infrastructure/sesion'
import { FechasOcupadas } from '@/modules/reservas/ui/componentes/fechas-ocupadas'
import { PanelReserva, type ConsultaReserva } from '@/modules/reservas/ui/componentes/panel-reserva'
import { DESCRIPCION_POLITICA } from '@/shared/domain/PoliticaCancelacion'
import { siNoExiste404 } from '@/shared/ui/acciones'
import { claseBoton } from '@/shared/ui/componentes'
import { formatoMoneda } from '@/shared/ui/formato'
import { ImagenApartamento } from '../componentes/tarjeta-apartamento'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<ConsultaReserva> }

const TITULO_SECCION = 'font-display text-2xl text-tinta sm:text-3xl'

export default async function DetalleApartamentoPagina({ params, searchParams }: Props) {
  const [{ id }, consulta, actor] = await Promise.all([params, searchParams, obtenerActor()])
  const apartamento = await apartamentos.obtener.ejecutar(id, actor).catch(siNoExiste404)

  const imagenes = apartamento.imagenes
  // Con 5 o más fotos, mosaico: la portada ocupa la mitad y 4 miniaturas al lado
  const mosaico = imagenes.length >= 5
  const datos: [string, number][] = [
    ['Huéspedes', apartamento.capacidad],
    ['Habitaciones', apartamento.numHabitaciones],
    ['Baños', apartamento.numBanos],
    ...(apartamento.metrosCuadrados ? [['m²', apartamento.metrosCuadrados] as [string, number]] : []),
  ]

  return (
    <div className="space-y-8 pb-24 lg:space-y-10 lg:pb-0">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-acento-texto">
          {apartamento.ciudad}, {apartamento.region}
        </p>
        <h1 className="mt-2 text-balance font-display text-4xl leading-[1.05] text-tinta sm:text-5xl">{apartamento.nombre}</h1>
        <p className="mt-3 text-tinta-suave">{apartamento.direccion}</p>
      </header>

      {imagenes.length === 0 ? (
        <div className="max-w-2xl">
          <ImagenApartamento url={null} alt="" sizes="100vw" />
        </div>
      ) : (
        <ul
          aria-label="Fotos del apartamento"
          tabIndex={0}
          className={`-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 ${
            mosaico ? 'sm:h-[28rem] sm:grid-cols-4 sm:grid-rows-2 lg:h-[32rem]' : 'sm:grid-cols-2'
          }`}
        >
          {imagenes.map((imagen, i) => (
            <li
              key={imagen.id}
              className={[
                'w-[85%] shrink-0 snap-start sm:w-auto',
                mosaico && 'sm:[&>div]:aspect-auto sm:[&>div]:h-full',
                mosaico && i === 0 && 'sm:col-span-2 sm:row-span-2',
                mosaico && i >= 5 && 'sm:hidden',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <ImagenApartamento
                url={imagen.url}
                alt={`${apartamento.nombre}, foto ${i + 1} de ${imagenes.length}`}
                sizes={i === 0 ? '(max-width: 640px) 85vw, 50vw' : '(max-width: 640px) 85vw, 25vw'}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16">
        <div className="space-y-10">
          <dl className="grid grid-cols-2 gap-3 sm:auto-cols-fr sm:grid-flow-col">
            {datos.map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex flex-col-reverse rounded-control bg-hundido px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-tinta-suave">{etiqueta}</dt>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight text-tinta">{valor}</dd>
              </div>
            ))}
          </dl>

          <section className="border-t border-borde pt-10">
            <h2 className={TITULO_SECCION}>Sobre el apartamento</h2>
            <p className="mt-4 max-w-prose whitespace-pre-line leading-7 text-tinta-suave">{apartamento.descripcion}</p>
          </section>

          {apartamento.amenidades.length > 0 && (
            <section className="border-t border-borde pt-10">
              <h2 className={TITULO_SECCION}>Comodidades</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {apartamento.amenidades.map((a) => (
                  <li key={a} className="rounded-full border border-borde bg-superficie px-3.5 py-1.5 text-sm text-tinta first-letter:uppercase">
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="border-t border-borde pt-10">
            <h2 className={TITULO_SECCION}>Política de cancelación</h2>
            <p className="mt-3 max-w-prose text-tinta-suave">{DESCRIPCION_POLITICA[apartamento.politicaCancelacion]}</p>
          </section>

          <FechasOcupadas apartamentoId={id} />
        </div>

        <aside id="reservar" aria-label="Reservar" className="scroll-mt-24">
          <PanelReserva
            apartamentoId={id}
            precioPorNoche={apartamento.precioPorNoche}
            capacidad={apartamento.capacidad}
            consulta={consulta}
            actor={actor}
          />
        </aside>
      </div>

      {/* Barra fija en móvil: precio y acceso directo al panel de reserva */}
      <div id="barra-reserva" className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-superficie/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <p className="text-sm text-tinta-suave">
            <span className="text-lg font-semibold tabular-nums text-tinta">{formatoMoneda(apartamento.precioPorNoche)}</span> / noche
          </p>
          <a href="#reservar" className={claseBoton()}>
            Reservar
          </a>
        </div>
      </div>
    </div>
  )
}
