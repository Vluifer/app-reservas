import Image from 'next/image'
import Link from 'next/link'
import { apartamentos, reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { Avatar, claseBoton, claseEnlace, EstadoVacio, EtiquetaEstado, RangoFechasTexto } from '@/shared/ui/componentes'
import { formatoDia, formatoFechaHora, formatoMoneda } from '@/shared/ui/formato'

const TITULO_SECCION = 'font-display text-xl text-tinta sm:text-2xl'

const cantidad = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`
const sumaTotales = (lista: { precio: { total: number } }[]) => lista.reduce((suma, r) => suma + r.precio.total, 0)

function Cifra({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle: string }) {
  return (
    <div className="bg-superficie px-5 py-5 sm:px-6">
      <p className="text-sm text-tinta-suave">{etiqueta}</p>
      <p className="mt-2 font-display text-2xl tabular-nums text-tinta sm:text-3xl">{valor}</p>
      <p className="mt-1 text-sm text-tinta-suave">{detalle}</p>
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl text-tinta sm:text-4xl">Hola, {primerNombre}</h1>
        <Link href="/dashboard/apartamentos/nuevo" className={claseBoton()}>
          Publicar apartamento
        </Link>
      </div>

      {porResponder.length > 0 && (
        <section
          aria-labelledby="aviso-solicitudes"
          className="flex flex-col gap-4 rounded-bloque border border-borde-control/50 bg-hundido p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
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
          <Link href="/dashboard/reservas" className={`${claseBoton()} shrink-0`}>
            Revisar solicitudes
          </Link>
        </section>
      )}

      <section aria-label="Resumen en cifras">
        {/* Las líneas entre cifras son el fondo que asoma por el hueco de 1px */}
        <div className="grid gap-px overflow-hidden rounded-bloque border border-borde bg-borde sm:grid-cols-2 lg:grid-cols-4">
          <Cifra etiqueta="Valor confirmado" valor={formatoMoneda(sumaTotales(aceptadas))} detalle={cantidad(aceptadas.length, 'estadía', 'estadías')} />
          <Cifra
            etiqueta="Por confirmar"
            valor={formatoMoneda(sumaTotales(porResponder))}
            detalle={cantidad(porResponder.length, 'solicitud', 'solicitudes')}
          />
          <Cifra etiqueta="Próximas llegadas" valor={String(proximas.length)} detalle="confirmadas o en curso" />
          <Cifra etiqueta="Apartamentos activos" valor={String(activos)} detalle={`de ${cantidad(misApartamentos.length, 'publicado', 'publicados')}`} />
        </div>
        <p className="mt-3 text-sm text-tinta-suave">Los valores son lo que paga el huésped en total (noches, limpieza, servicio e impuestos).</p>
      </section>

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
          <ul className="divide-y divide-borde rounded-bloque border border-borde">
            {proximas.slice(0, 5).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                <Avatar nombre={r.clienteNombre} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-tinta">{r.clienteNombre}</p>
                  <p className="truncate text-sm text-tinta-suave">{r.apartamentoNombre}</p>
                </div>
                <p className="text-sm tabular-nums text-tinta">
                  <RangoFechasTexto desde={formatoDia(r.llegada)} hasta={formatoDia(r.salida)} />
                </p>
                <EtiquetaEstado estado={r.estado} />
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
          <ul className="divide-y divide-borde rounded-bloque border border-borde">
            {misApartamentos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-control bg-hundido">
                  {a.imagenPrincipal && <Image src={a.imagenPrincipal} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-tinta">{a.nombre}</p>
                  <p className="text-sm text-tinta-suave">
                    {a.ciudad}, <span className="tabular-nums">{formatoMoneda(a.precioPorNoche)}</span> / noche
                  </p>
                </div>
                <EtiquetaEstado estado={a.estado} />
                <Link href={`/dashboard/apartamentos/${a.id}`} className={claseBoton('secundario', 'sm')}>
                  Administrar<span className="sr-only"> {a.nombre}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
