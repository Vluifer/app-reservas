import { reservas } from '@/contenedor'
import { RangoFechasTexto } from '@/shared/ui/componentes'
import { formatoFecha } from '@/shared/ui/formato'

export async function FechasOcupadas({ apartamentoId }: { apartamentoId: string }) {
  const fechas = await reservas.fechasOcupadas.ejecutar(apartamentoId)
  if (fechas.length === 0) return null

  return (
    <section className="border-t border-borde pt-10">
      <h2 className="font-display text-xl text-tinta sm:text-2xl">Fechas no disponibles</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {fechas.map((f) => (
          <li key={f.llegada} className="rounded-control bg-hundido px-3 py-1.5 text-sm tabular-nums text-tinta-suave">
            <RangoFechasTexto desde={formatoFecha(f.llegada)} hasta={formatoFecha(f.salida)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
