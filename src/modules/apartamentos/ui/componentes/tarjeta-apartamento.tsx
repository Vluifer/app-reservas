import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { claseBoton, EstadoVacio } from '@/shared/ui/componentes'
import { formatoMoneda } from '@/shared/ui/formato'
import type { ApartamentoDTO } from '../../application/ApartamentoDTO'

export function ImagenApartamento({
  url,
  alt,
  sizes,
  redondeada = true,
}: {
  url: string | null
  alt: string
  sizes: string
  /** Dentro de una tarjeta la foto no lleva radio propio: la recorta la tarjeta */
  redondeada?: boolean
}) {
  return (
    <div className={`relative aspect-[4/3] overflow-hidden bg-hundido ${redondeada ? 'rounded-tarjeta' : ''}`}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-110"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-tinta-suave">
          <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </svg>
          Sin imagen
        </div>
      )}
    </div>
  )
}

const ICONO = 'size-4 shrink-0'
const TRAZO = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/**
 * Ícono + número + unidad. En tarjetas estrechas (rejilla de 4) solo se ven ícono y número;
 * la unidad completa sigue en el tooltip y para lectores de pantalla.
 */
function Dato({ icono, valor, unidad, corta = unidad }: { icono: ReactNode; valor: number; unidad: string; corta?: string }) {
  return (
    <li className="inline-flex items-center gap-1" title={`${valor} ${unidad}`}>
      {icono}
      {valor}
      <span className="sr-only">{` ${unidad}`}</span>
      <span aria-hidden className="hidden @[20rem]:inline">{` ${corta}`}</span>
    </li>
  )
}

/**
 * Tarjeta de apartamento al estilo "Real Estate Luxury": foto arriba, ubicación, nombre en Cinzel,
 * datos con íconos y precio separado por un filete. Solo presentación: la usan los resultados
 * (dentro de un enlace) y la vista previa del formulario del propietario.
 */
export function FichaApartamento({
  foto,
  nombre,
  ubicacion,
  capacidad,
  habitaciones,
  banos,
  precio,
  insignia,
}: {
  foto: ReactNode
  nombre: ReactNode
  ubicacion: ReactNode
  capacidad: number
  habitaciones: number
  banos: number
  precio: ReactNode
  insignia?: string | null
}) {
  return (
    <article className="@container flex h-full flex-col overflow-hidden rounded-tarjeta bg-superficie shadow-tarjeta ring-1 ring-borde/60 transition-[translate,box-shadow] duration-300 group-hover:shadow-tarjeta-elevada motion-safe:group-hover:-translate-y-2">
      <div className="relative">
        {foto}
        {insignia && (
          <span className="absolute left-4 top-4 rounded-full bg-dorado px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            {insignia}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 @[20rem]:p-5">
        <p className="mb-2 flex items-center gap-2 text-sm text-tinta-suave">
          <svg aria-hidden viewBox="0 0 24 24" className={ICONO} {...TRAZO}>
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
            <circle cx="12" cy="10" r="2.25" />
          </svg>
          {ubicacion}
        </p>
        <h3 className="mb-3 line-clamp-2 font-display text-xl leading-snug text-tinta">{nombre}</h3>
        <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] whitespace-nowrap text-tinta-suave @[20rem]:gap-x-3">
          <Dato
            icono={
              <svg aria-hidden viewBox="0 0 24 24" className={ICONO} {...TRAZO}>
                <circle cx="9" cy="8" r="3" />
                <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.5M17.5 14.5a5.5 5.5 0 0 1 3 4.5" />
              </svg>
            }
            valor={capacidad}
            unidad={capacidad === 1 ? 'huésped' : 'huéspedes'}
          />
          <Dato
            icono={
              <svg aria-hidden viewBox="0 0 24 24" className={ICONO} {...TRAZO}>
                <path d="M3 18.5v-11M3 14h18v4.5M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5" />
                <circle cx="7" cy="11" r="1.75" />
              </svg>
            }
            valor={habitaciones}
            unidad={habitaciones === 1 ? 'habitación' : 'habitaciones'}
            corta="hab."
          />
          <Dato
            icono={
              <svg aria-hidden viewBox="0 0 24 24" className={ICONO} {...TRAZO}>
                <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5ZM6 12V6a2 2 0 0 1 3.5-1.3M7 19l-1 2M17 19l1 2" />
              </svg>
            }
            valor={banos}
            unidad={banos === 1 ? 'baño' : 'baños'}
          />
        </ul>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-borde pt-4">
          <p className="whitespace-nowrap text-sm text-tinta-suave">
            <span className="font-cifra text-xl tabular-nums text-tinta">{precio}</span> / noche
          </p>
          {/* En tarjetas estrechas (rejilla de 4) no cabe junto al precio: toda la tarjeta ya es el enlace */}
          <span className="hidden shrink-0 text-sm font-medium text-tinta decoration-tinta/40 underline-offset-4 group-hover:underline @[20rem]:inline">
            Ver detalles
          </span>
        </div>
      </div>
    </article>
  )
}

const TAMANOS_REJILLA = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'

export function TarjetaApartamento({
  apartamento,
  consulta = '',
  sizes = TAMANOS_REJILLA,
}: {
  apartamento: ApartamentoDTO
  consulta?: string
  sizes?: string
}) {
  return (
    <Link href={`/apartamentos/${apartamento.id}${consulta}`} className="group block h-full rounded-tarjeta focus-visible:outline-offset-4">
      <FichaApartamento
        foto={<ImagenApartamento url={apartamento.imagenPrincipal} alt={apartamento.nombre} sizes={sizes} redondeada={false} />}
        nombre={apartamento.nombre}
        ubicacion={`${apartamento.ciudad}, ${apartamento.region}`}
        capacidad={apartamento.capacidad}
        habitaciones={apartamento.numHabitaciones}
        banos={apartamento.numBanos}
        precio={formatoMoneda(apartamento.precioPorNoche)}
        insignia={apartamento.politicaCancelacion === 'FLEXIBLE' ? 'Cancelación flexible' : null}
      />
    </Link>
  )
}

export function RejillaApartamentos({ apartamentos, consulta }: { apartamentos: ApartamentoDTO[]; consulta?: string }) {
  if (apartamentos.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin coincidencias"
        descripcion="No encontramos apartamentos con esos criterios. Prueba otras fechas o ciudad."
        accion={
          <Link href="/apartamentos" className={claseBoton('secundario')}>
            Quitar filtros
          </Link>
        }
      />
    )
  }
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {apartamentos.map((a) => (
        <TarjetaApartamento key={a.id} apartamento={a} consulta={consulta} />
      ))}
    </div>
  )
}

/** Fila de la portada: una rejilla fija de hasta 4 tarjetas, sin desplazamiento. */
export function FilaApartamentos({ apartamentos, etiqueta }: { apartamentos: ApartamentoDTO[]; etiqueta: string }) {
  return (
    <ul aria-label={etiqueta} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {apartamentos.slice(0, 4).map((a) => (
        <li key={a.id}>
          <TarjetaApartamento apartamento={a} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
        </li>
      ))}
    </ul>
  )
}
