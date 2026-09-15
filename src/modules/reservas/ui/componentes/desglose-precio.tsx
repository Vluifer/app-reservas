import { formatoMoneda } from '@/shared/ui/formato'
import type { DesglosePrecioDTO } from '../../application/ReservaDTO'

export function DesglosePrecio({ precio }: { precio: DesglosePrecioDTO }) {
  const filas = [
    [`Alojamiento (${precio.noches} ${precio.noches === 1 ? 'noche' : 'noches'})`, precio.precioNoches],
    ['Tarifa de limpieza', precio.tarifaLimpieza],
    ['Tarifa de servicio', precio.tarifaServicio],
    ['Impuestos', precio.impuestos],
  ] as const

  return (
    <dl className="space-y-2 text-sm">
      {filas.map(([concepto, valor]) => (
        <div key={concepto} className="flex justify-between gap-4 text-tinta-suave">
          <dt>{concepto}</dt>
          <dd className="tabular-nums text-tinta">{formatoMoneda(valor)}</dd>
        </div>
      ))}
      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-borde pt-3 text-tinta">
        <dt className="font-semibold">Total</dt>
        <dd className="text-xl font-semibold tabular-nums tracking-tight">{formatoMoneda(precio.total)}</dd>
      </div>
    </dl>
  )
}
