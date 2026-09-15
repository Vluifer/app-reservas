import Link from 'next/link'
import { reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/infrastructure/sesion'
import { claseBoton, EstadoVacio, EtiquetaEstado, RangoFechasTexto, Tarjeta } from '@/shared/ui/componentes'
import { formatoFecha, formatoMoneda } from '@/shared/ui/formato'

export default async function MisReservasPagina() {
  const actor = await requerirActor()
  const lista = await reservas.listarDeCliente.ejecutar(actor)

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl text-tinta sm:text-5xl">Mis reservas</h1>

      {lista.length === 0 ? (
        <EstadoVacio
          titulo="Aún no tienes reservas"
          descripcion="Cuando solicites una estadía aparecerá aquí."
          accion={
            <Link href="/apartamentos" className={claseBoton()}>
              Explorar apartamentos
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {lista.map((r) => (
            <li key={r.id}>
              <Link href={`/mis-reservas/${r.id}`} className="group block rounded-tarjeta">
                <Tarjeta className="flex flex-col gap-4 transition-colors group-hover:border-tinta-suave sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-tinta">{r.apartamentoNombre}</p>
                    <p className="mt-1 text-sm tabular-nums text-tinta-suave">
                      <RangoFechasTexto desde={formatoFecha(r.llegada)} hasta={formatoFecha(r.salida)} />
                    </p>
                    <p className="mt-1 font-mono text-xs uppercase tracking-wider text-tinta-suave">{r.codigo}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <EtiquetaEstado estado={r.estado} />
                    <span className="font-semibold tabular-nums text-tinta">{formatoMoneda(r.precio.total)}</span>
                  </div>
                </Tarjeta>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
