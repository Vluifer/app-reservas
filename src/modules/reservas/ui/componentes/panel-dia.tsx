import Link from 'next/link'
import { EtiquetaEstado, RangoFechasTexto } from '@/shared/ui/componentes'
import { formatoDia, formatoDiaLargo } from '@/shared/ui/formato'
import type { ReservaDTO } from '../../application/ReservaDTO'
import { agruparDia, CLASES_COLOR, colorDeApartamento, hrefCalendario } from '../calendario'

/** Lo que pasa un día: quién llega, quién sale y quién sigue alojado. Cada fila abre el detalle. */
export function PanelDia({ mes, dia, reservas, ids }: { mes: string; dia: string; reservas: ReservaDTO[]; ids: string[] }) {
  const { llegan, salen, alojados } = agruparDia(reservas, dia)
  const grupos = [
    { titulo: 'Llegan', lista: llegan },
    { titulo: 'Salen', lista: salen },
    { titulo: 'Alojados', lista: alojados },
  ].filter((g) => g.lista.length > 0)

  return (
    <div>
      <h2 className="font-display text-xl text-tinta">{formatoDiaLargo(dia)}</h2>
      {grupos.length === 0 ? (
        <p className="mt-3 text-sm text-tinta-suave">No hay llegadas ni salidas este día.</p>
      ) : (
        grupos.map(({ titulo, lista }) => (
          <section key={titulo} aria-label={titulo} className="mt-5">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-dorado">{titulo}</h3>
            <ul className="divide-y divide-borde">
              {lista.map((r) => (
                <li key={r.id}>
                  <Link href={`${hrefCalendario({ mes, dia, reserva: r.id })}#detalle`} className="flex items-start gap-3 py-3 transition-colors hover:bg-hundido">
                    <span aria-hidden className={`mt-1.5 size-3 shrink-0 rounded-sm ${CLASES_COLOR[colorDeApartamento(r.apartamentoId, ids)]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-tinta">{r.clienteNombre}</span>
                      <span className="block truncate text-sm text-tinta-suave">{r.apartamentoNombre}</span>
                      {/* relative: el texto sr-only del rango (posición absoluta) queda dentro de la fila */}
                      <span className="relative block text-xs tabular-nums text-tinta-suave">
                        <RangoFechasTexto desde={formatoDia(r.llegada)} hasta={formatoDia(r.salida)} />
                      </span>
                    </span>
                    {r.estado !== 'CONFIRMADA' && <EtiquetaEstado estado={r.estado} />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
