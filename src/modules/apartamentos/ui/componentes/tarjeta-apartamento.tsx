import Image from 'next/image'
import Link from 'next/link'
import { claseBoton, EstadoVacio } from '@/shared/ui/componentes'
import { formatoMoneda } from '@/shared/ui/formato'
import type { ApartamentoDTO } from '../../application/ApartamentoDTO'

export function ImagenApartamento({ url, alt, sizes }: { url: string | null; alt: string; sizes: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-tarjeta bg-hundido">
      {url ? (
        <Image src={url} alt={alt} fill sizes={sizes} className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
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

const TAMANOS_REJILLA = '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'

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
    <Link href={`/apartamentos/${apartamento.id}${consulta}`} className="group block rounded-tarjeta focus-visible:outline-offset-4">
      <ImagenApartamento
        url={apartamento.imagenPrincipal}
        alt={apartamento.nombre}
        sizes={sizes}
      />
      <div className="mt-3 space-y-0.5">
        <h3 className="font-semibold tracking-tight text-tinta decoration-tinta/40 decoration-1 underline-offset-4 group-hover:underline">
          {apartamento.nombre}
        </h3>
        <p className="text-sm text-tinta-suave">
          {apartamento.ciudad}, {apartamento.region}
        </p>
        <p className="text-sm text-tinta-suave">Hasta {apartamento.capacidad} huéspedes</p>
        <p className="pt-1.5 text-sm text-tinta-suave">
          <span className="font-display text-base tabular-nums tracking-normal text-tinta">{formatoMoneda(apartamento.precioPorNoche)}</span> / noche
        </p>
      </div>
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
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {apartamentos.map((a) => (
        <TarjetaApartamento key={a.id} apartamento={a} consulta={consulta} />
      ))}
    </div>
  )
}

/** Fila con desplazamiento horizontal para la portada: en móvil asoma la siguiente tarjeta para invitar a deslizar. */
export function FilaApartamentos({ apartamentos, etiqueta }: { apartamentos: ApartamentoDTO[]; etiqueta: string }) {
  return (
    <ul
      aria-label={etiqueta}
      className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 max-sm:sin-barra overflow-x-auto px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:px-0"
    >
      {apartamentos.map((a) => (
        <li key={a.id} className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] xl:w-[calc((100%-3.75rem)/4)]">
          <TarjetaApartamento apartamento={a} sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw" />
        </li>
      ))}
    </ul>
  )
}
