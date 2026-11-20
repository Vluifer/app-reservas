import Image from 'next/image'
import Link from 'next/link'
import { apartamentos, reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { Avatar, claseBoton, claseEnlace, EstadoVacio, EtiquetaEstado, RangoFechasTexto } from '@/shared/ui/componentes'
import { formatoDia, formatoFechaHora, formatoMoneda } from '@/shared/ui/formato'
import { FranjaPanel, PortadaPanel } from '@/shared/ui/portada-panel'

const TITULO_SECCION = 'font-display text-xl text-tinta sm:text-2xl'

const cantidad = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`
const sumaTotales = (lista: { precio: { total: number } }[]) => lista.reduce((suma, r) => suma + r.precio.total, 0)

/** Listas como tarjetas blancas que reposan sobre la franja gris */
const LISTA = 'divide-y divide-borde overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta'

/** Cifra sobre la portada piedra, al estilo de las cifras de la portada del inicio */
function Cifra({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle: string }) {
  return (
    // Subrejilla: etiqueta, cifra y detalle comparten fila con las demás cifras, así siguen alineadas
    // aunque una etiqueta ocupe dos líneas (en móvil)
    <div className="row-span-3 grid grid-rows-subgrid gap-y-0">
      <dt className="self-end text-sm text-white/70">{etiqueta}</dt>
      <dd className="mt-2 font-cifra text-2xl tabular-nums text-white sm:text-4xl">{valor}</dd>
      <dd className="mt-1 text-sm text-white/60">{detalle}</dd>
    </div>
  )
}

export default async function PanelPropietarioPagina() {
  const actor = await requerirActor(ROLES_ANFITRION)
  const [misApartamentos, recibidas] = await Promise.all([
    apartamentos.listarDePropietario.ejecutar(actor),
    reservas.listarDePropietario.ejecutar(actor),
  ])

  const porResponder = recibidas
    .filter((r) => r.acciones.confirmar)
    .sort((a, b) => (a.expiraEn ?? '').localeCompare(b.expiraEn ?? ''))
  const aceptadas = recibidas.filter((r) => r.aceptada)
  // Confirmadas que aún no terminan (incluye a quien está hospedado ahora), de la más cercana a la más lejana
  const proximas = aceptadas.filter((r) => !r.finalizada).sort((a, b) => a.llegada.localeCompare(b.llegada))
  const activos = misApartamentos.filter((a) => a.estado === 'ACTIVO').length
  const primerNombre = actor.nombre.split(' ')[0]

  return (
    <div className="space-y-12">
      <PortadaPanel
        titulo={`Hola, ${primerNombre}`}
        descripcion="Así van tus apartamentos y reservas."
        accion={
          <Link href="/dashboard/apartamentos/nuevo" className={claseBoton('claro')}>
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Publicar apartamento
          </Link>
        }
      >
        <dl aria-label="Resumen en cifras" className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/15 pt-8 lg:grid-cols-4">
          <Cifra etiqueta="Valor confirmado" valor={formatoMoneda(sumaTotales(aceptadas))} detalle={cantidad(aceptadas.length, 'estadía', 'estadías')} />
          <Cifra
            etiqueta="Por confirmar"
            valor={formatoMoneda(sumaTotales(porResponder))}
            detalle={cantidad(porResponder.length, 'solicitud', 'solicitudes')}
          />
          <Cifra etiqueta="Próximas llegadas" valor={String(proximas.length)} detalle="confirmadas o en curso" />
          <Cifra etiqueta="Apartamentos activos" valor={String(activos)} detalle={`de ${cantidad(misApartamentos.length, 'publicado', 'publicados')}`} />
        </dl>
        <p className="mt-8 text-xs text-white/60">Los valores son lo que paga el huésped en total (noches, limpieza, servicio e impuestos).</p>
      </PortadaPanel>

      <FranjaPanel>
        {porResponder.length > 0 && (
          <section
            aria-labelledby="aviso-solicitudes"
            className="flex flex-col gap-4 rounded-tarjeta border border-dorado/30 bg-dorado-suave p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          >
            <div className="flex gap-4">
              <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-dorado text-white">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5V12l3 2" />
                </svg>
              </span>
              <div>
                <h2 id="aviso-solicitudes" className="text-lg font-semibold tracking-tight text-tinta">
                  Tienes {cantidad(porResponder.length, 'solicitud por responder', 'solicitudes por responder')}
                </h2>
                {porResponder[0].expiraEn && (
                  <p className="mt-1 text-sm text-tinta-suave">
                    {porResponder.length === 1 ? 'Vence' : 'La primera vence'} el {formatoFechaHora(porResponder[0].expiraEn)}; si no respondes a
                    tiempo, las fechas quedan libres.
                  </p>
                )}
              </div>
            </div>
            <Link href="/dashboard/reservas" className={`${claseBoton()} shrink-0`}>
              Revisar solicitudes
            </Link>
          </section>
        )}

        <section aria-labelledby="proximas" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <h2 id="proximas" className={TITULO_SECCION}>
              Próximas llegadas
            </h2>
            {recibidas.length > 0 && (
              <Link href="/dashboard/reservas" className={`${claseEnlace} inline-flex min-h-11 items-center text-sm`}>
                Ver todas las reservas
              </Link>
            )}
          </div>
          {proximas.length === 0 ? (
            <p className="text-tinta-suave">No tienes llegadas confirmadas por ahora.</p>
          ) : (
            <ul className={LISTA}>
              {proximas.slice(0, 5).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                  <Avatar nombre={r.clienteNombre} />
                  {/* basis-40: en móvil el nombre conserva su ancho y la fecha y el estado bajan a otra línea */}
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate font-medium text-tinta">{r.clienteNombre}</p>
                    <p className="truncate text-sm text-tinta-suave">{r.apartamentoNombre}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 max-sm:w-full max-sm:pl-15">
                    <p className="text-sm tabular-nums text-tinta">
                      <RangoFechasTexto desde={formatoDia(r.llegada)} hasta={formatoDia(r.salida)} />
                    </p>
                    <EtiquetaEstado estado={r.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="mis-apartamentos" className="space-y-5">
          <h2 id="mis-apartamentos" className={TITULO_SECCION}>
            Mis apartamentos
          </h2>
          {misApartamentos.length === 0 ? (
            <EstadoVacio
              titulo="Todavía no has publicado apartamentos"
              accion={
                <Link href="/dashboard/apartamentos/nuevo" className={claseBoton('secundario')}>
                  Publicar el primero
                </Link>
              }
            />
          ) : (
            <ul className={LISTA}>
              {misApartamentos.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-control bg-hundido">
                    {a.imagenPrincipal && <Image src={a.imagenPrincipal} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate font-medium text-tinta">{a.nombre}</p>
                    <p className="text-sm text-tinta-suave">
                      {a.ciudad}, <span className="tabular-nums">{formatoMoneda(a.precioPorNoche)}</span> / noche
                    </p>
                  </div>
                  {/* En móvil el estado y el botón bajan a otra línea, alineados con el nombre */}
                  <div className="flex items-center gap-3 max-sm:w-full max-sm:justify-between max-sm:pl-20">
                    <EtiquetaEstado estado={a.estado} />
                    <Link href={`/dashboard/apartamentos/${a.id}`} className={claseBoton('secundario', 'sm')}>
                      Administrar<span className="sr-only"> {a.nombre}</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </FranjaPanel>
    </div>
  )
}
