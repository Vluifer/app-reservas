import Link from 'next/link'
import type { ApartamentoDTO } from '@/modules/apartamentos/application/ApartamentoDTO'
import { formatoDia, formatoDiaLargo, formatoMes } from '@/shared/ui/formato'
import type { ReservaDTO } from '../../application/ReservaDTO'
import {
  barrasDeSemana,
  CLASES_COLOR,
  colorDeApartamento,
  hrefCalendario,
  mesVecino,
  RUTA_CALENDARIO,
  type SemanaCalendario,
} from '../calendario'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const BOTON_MES =
  'inline-flex min-h-10 min-w-10 items-center justify-center rounded-control border border-borde-control/60 px-3 text-sm text-tinta transition-colors hover:border-tinta'

type Props = {
  mes: string
  semanas: SemanaCalendario[]
  dia: string
  hoy: string
  reservas: ReservaDTO[]
  /** Del más antiguo al más reciente: define el color de cada uno */
  apartamentosPorAntiguedad: ApartamentoDTO[]
}

/** Mes completo: semanas de lunes a domingo, con una barra por reserva y la leyenda de colores. */
export function CalendarioMes({ mes, semanas, dia, hoy, reservas, apartamentosPorAntiguedad }: Props) {
  const ids = apartamentosPorAntiguedad.map((a) => a.id)
  return (
    <section aria-labelledby="titulo-mes" className="rounded-tarjeta bg-superficie p-4 shadow-tarjeta sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-mes" className="font-display text-xl text-tinta sm:text-2xl">
          {formatoMes(mes)}
        </h2>
        <nav aria-label="Cambiar de mes" className="flex gap-1.5">
          <Link href={hrefCalendario({ mes: mesVecino(mes, -1) })} aria-label="Mes anterior" className={BOTON_MES}>
            ←
          </Link>
          <Link href={RUTA_CALENDARIO} className={BOTON_MES}>
            Hoy
          </Link>
          <Link href={hrefCalendario({ mes: mesVecino(mes, 1) })} aria-label="Mes siguiente" className={BOTON_MES}>
            →
          </Link>
        </nav>
      </div>

      <div aria-hidden className="grid grid-cols-7 pb-2 text-center text-[0.6875rem] font-semibold uppercase tracking-wider text-tinta-suave">
        {DIAS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="divide-y divide-borde border-y border-borde">
        {semanas.map((semana) => (
          <FilaSemana key={semana[0].fecha} semana={semana} mes={mes} dia={dia} hoy={hoy} reservas={reservas} ids={ids} />
        ))}
      </div>

      <ul aria-label="Apartamentos" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-tinta-suave">
        {apartamentosPorAntiguedad.map((a) => (
          <li key={a.id} className="inline-flex items-center gap-2">
            <span aria-hidden className={`size-3 rounded-sm ${CLASES_COLOR[colorDeApartamento(a.id, ids)]}`} />
            {a.nombre}
          </li>
        ))}
      </ul>
    </section>
  )
}

function FilaSemana({ semana, mes, dia, hoy, reservas, ids }: { semana: SemanaCalendario; mes: string; dia: string; hoy: string; reservas: ReservaDTO[]; ids: string[] }) {
  const tramos = barrasDeSemana(reservas, semana)
  const carriles = Math.max(1, ...tramos.map((t) => t.carril + 1))

  return (
    // Fila 1: números de día; una fila de 1.5rem por carril; un respiro al final. Los días ocupan todas las filas
    <div className="grid grid-cols-7" style={{ gridTemplateRows: `2rem repeat(${carriles}, 1.5rem) 0.5rem` }}>
      {semana.map((d, i) => {
        const numero = (
          <span
            className={`inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${d.fecha === hoy ? 'bg-acento font-semibold text-white' : ''}`}
          >
            {d.numero}
          </span>
        )
        const posicion = { gridColumn: i + 1, gridRow: '1 / -1' }
        if (!d.delMes) {
          return (
            <div key={d.fecha} aria-hidden style={posicion} className="border-l border-borde/70 bg-hundido/60 p-1 text-tinta-tenue first:border-l-0">
              {numero}
            </div>
          )
        }
        const elegido = d.fecha === dia
        return (
          <Link
            key={d.fecha}
            href={`${hrefCalendario({ mes, dia: d.fecha })}#detalle`}
            // "date" marca hoy (la fecha actual); el día abierto en el panel se anuncia en el nombre del enlace
            aria-label={`${formatoDiaLargo(d.fecha)}${elegido ? ', abierto en el detalle' : ''}`}
            aria-current={d.fecha === hoy ? 'date' : undefined}
            style={posicion}
            className={`border-l border-borde/70 p-1 text-tinta transition-colors first:border-l-0 ${elegido ? 'bg-dorado-suave' : 'hover:bg-hundido'}`}
          >
            {numero}
          </Link>
        )
      })}

      {tramos.map((t) => {
        const r = t.reserva
        const pendiente = r.estado === 'PENDIENTE'
        return (
          <Link
            key={r.id}
            href={`${hrefCalendario({ mes, dia, reserva: r.id })}#detalle`}
            style={{ gridColumn: `${t.inicioCol} / ${t.finCol + 1}`, gridRow: t.carril + 2 }}
            title={`${r.clienteNombre} · ${r.apartamentoNombre}`}
            className={`relative z-10 mx-0.5 my-px truncate px-1.5 text-[0.6875rem] font-semibold leading-[1.375rem] ${CLASES_COLOR[colorDeApartamento(r.apartamentoId, ids)]} ${pendiente ? 'rayado-pendiente' : ''} ${t.continuaAntes ? 'rounded-l-none' : 'rounded-l-md'} ${t.continuaDespues ? 'rounded-r-none' : 'rounded-r-md'}`}
          >
            {r.clienteNombre}
            {/* El apartamento también por texto, no solo por color (se recorta si la barra es corta) */}
            <span className="font-normal opacity-80"> · {r.apartamentoNombre}</span>
            <span className="sr-only">
              , del {formatoDia(r.llegada)} al {formatoDia(r.salida)}
              {pendiente ? ', pendiente de confirmar' : ''}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
