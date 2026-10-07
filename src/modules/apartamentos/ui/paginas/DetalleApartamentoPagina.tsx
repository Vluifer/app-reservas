import { apartamentos } from '@/contenedor'
import { obtenerActor } from '@/modules/identidad/ui/sesion'
import { FechasOcupadas } from '@/modules/reservas/ui/componentes/fechas-ocupadas'
import { PanelReserva, type ConsultaReserva } from '@/modules/reservas/ui/componentes/panel-reserva'
import { DESCRIPCION_POLITICA, type PoliticaCancelacion } from '@/shared/domain/PoliticaCancelacion'
import { siNoExiste404 } from '@/shared/ui/acciones'
import { claseBoton } from '@/shared/ui/componentes'
import { formatoMoneda } from '@/shared/ui/formato'
import { GaleriaFotos } from '../componentes/galeria-fotos'
import { ListaComodidades } from '../componentes/lista-comodidades'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<ConsultaReserva> }

const TITULO_SECCION = 'font-display text-xl text-tinta sm:text-2xl'
const SECCION = 'border-t border-borde pt-10'

const NOMBRE_POLITICA: Record<PoliticaCancelacion, string> = {
  FLEXIBLE: 'Cancelación flexible',
  MODERADA: 'Cancelación moderada',
  ESTRICTA: 'Cancelación estricta',
}

const plural = (n: number, singular: string, varios: string) => `${n} ${n === 1 ? singular : varios}`

export default async function DetalleApartamentoPagina({ params, searchParams }: Props) {
  const [{ id }, consulta, actor] = await Promise.all([params, searchParams, obtenerActor()])
  const apartamento = await apartamentos.obtener.ejecutar(id, actor).catch(siNoExiste404)

  const resumen = [
    plural(apartamento.capacidad, 'huésped', 'huéspedes'),
    plural(apartamento.numHabitaciones, 'habitación', 'habitaciones'),
    plural(apartamento.numBanos, 'baño', 'baños'),
    ...(apartamento.metrosCuadrados ? [`${apartamento.metrosCuadrados} m²`] : []),
  ]

  return (
    <div className="space-y-8 pb-24 lg:space-y-10 lg:pb-0">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="max-w-3xl">
          <h1 className="text-balance font-display text-3xl leading-[1.05] text-tinta sm:text-4xl">{apartamento.nombre}</h1>
          <p className="mt-3 text-tinta-suave">
            {apartamento.ciudad}, {apartamento.region}
          </p>
        </div>
        {/* Dirección como placa de nomenclatura, igual que el logo */}
        <p className="inline-block rounded-[3px] bg-tinta px-2.5 py-1 text-sm font-semibold text-white">{apartamento.direccion}</p>
      </header>

      <GaleriaFotos imagenes={apartamento.imagenes} nombre={apartamento.nombre} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16">
        <div className="space-y-10">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-tinta">Apartamento entero en {apartamento.ciudad}</h2>
            <p className="mt-1 text-tinta-suave">{resumen.join(' · ')}</p>
          </div>

          <section className={SECCION}>
            <h2 className={TITULO_SECCION}>Sobre el apartamento</h2>
            <p className="mt-4 max-w-prose whitespace-pre-line leading-7 text-tinta-suave">{apartamento.descripcion}</p>
          </section>

          {apartamento.amenidades.length > 0 && (
            <section className={SECCION}>
              <h2 className={TITULO_SECCION}>Lo que ofrece</h2>
              <div className="mt-6">
                <ListaComodidades comodidades={apartamento.amenidades} />
              </div>
            </section>
          )}

          <FechasOcupadas apartamentoId={id} />

          <section className={SECCION}>
            <h2 className={TITULO_SECCION}>Política de cancelación</h2>
            <p className="mt-4 font-semibold text-tinta">{NOMBRE_POLITICA[apartamento.politicaCancelacion]}</p>
            <p className="mt-1 max-w-prose text-tinta-suave">{DESCRIPCION_POLITICA[apartamento.politicaCancelacion]}.</p>
          </section>
        </div>

        <aside id="reservar" aria-label="Reservar" className="scroll-mt-24">
          <PanelReserva
            apartamentoId={id}
            precioPorNoche={apartamento.precioPorNoche}
            tarifaLimpieza={apartamento.tarifaLimpieza}
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
