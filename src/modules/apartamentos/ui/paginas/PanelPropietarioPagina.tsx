import Link from 'next/link'
import { apartamentos, reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/infrastructure/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { claseBoton, EstadoVacio, EtiquetaEstado, Tarjeta } from '@/shared/ui/componentes'
import { formatoMoneda } from '@/shared/ui/formato'

const CELDA_CABECERA = 'px-4 py-3 text-xs font-medium uppercase tracking-wide text-tinta-suave'
const CIFRA = 'mt-3 font-display text-5xl leading-none tabular-nums'

export default async function PanelPropietarioPagina() {
  const actor = await requerirActor(ROLES_ANFITRION)
  const [misApartamentos, misReservas] = await Promise.all([
    apartamentos.listarDePropietario.ejecutar(actor),
    reservas.listarDePropietario.ejecutar(actor),
  ])
  const pendientes = misReservas.filter((r) => r.estado === 'PENDIENTE').length

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl text-tinta sm:text-5xl">Panel de propietario</h1>
        <Link href="/dashboard/apartamentos/nuevo" className={claseBoton()}>
          <span aria-hidden className="text-lg leading-none">
            +
          </span>{' '}
          Publicar apartamento
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tarjeta>
          <p className="text-sm text-tinta-suave">Apartamentos</p>
          <p className={`${CIFRA} text-tinta`}>{misApartamentos.length}</p>
        </Tarjeta>
        <Tarjeta>
          <p className="text-sm text-tinta-suave">Reservas recibidas</p>
          <p className={`${CIFRA} text-tinta`}>{misReservas.length}</p>
        </Tarjeta>
        <Link href="/dashboard/reservas" className="group block rounded-tarjeta">
          <Tarjeta className="h-full transition-colors group-hover:border-tinta-suave">
            <p className="flex items-center justify-between gap-2 text-sm text-tinta-suave">
              <span className="flex items-center gap-2">
                {pendientes > 0 && <span aria-hidden className="size-2 animate-pulse rounded-full bg-acento" />}
                Solicitudes por confirmar
              </span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </p>
            <p className={`${CIFRA} ${pendientes > 0 ? 'text-acento' : 'text-tinta'}`}>{pendientes}</p>
          </Tarjeta>
        </Link>
      </div>

      <section aria-labelledby="mis-apartamentos">
        <h2 id="mis-apartamentos" className="mb-4 font-display text-2xl text-tinta sm:text-3xl">
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
          <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-borde bg-hundido">
                <tr>
                  <th scope="col" className={CELDA_CABECERA}>
                    Nombre
                  </th>
                  <th scope="col" className={CELDA_CABECERA}>
                    Ciudad
                  </th>
                  <th scope="col" className={`${CELDA_CABECERA} text-right`}>
                    Precio / noche
                  </th>
                  <th scope="col" className={CELDA_CABECERA}>
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {misApartamentos.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-fondo">
                    <td className="px-4 py-3 font-medium text-tinta">{a.nombre}</td>
                    <td className="px-4 py-3 text-tinta-suave">{a.ciudad}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-tinta">{formatoMoneda(a.precioPorNoche)}</td>
                    <td className="px-4 py-3">
                      <EtiquetaEstado estado={a.estado} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/dashboard/apartamentos/${a.id}`} className={claseBoton('secundario', 'sm')}>
                        Administrar<span className="sr-only"> {a.nombre}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
