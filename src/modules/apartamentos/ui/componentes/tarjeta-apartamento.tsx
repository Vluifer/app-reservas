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

export function TarjetaApartamento({ apartamento, consulta = '' }: { apartamento: ApartamentoDTO; consulta?: string }) {
  return (
    <Link href={`/apartamentos/${apartamento.id}${consulta}`} className="group block rounded-tarjeta focus-visible:outline-offset-4">
      <ImagenApartamento
        url={apartamento.imagenPrincipal}
        alt={apartamento.nombre}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      <div className="mt-3 space-y-0.5">
        <h3 className="font-semibold tracking-tight text-tinta decoration-acento decoration-2 underline-offset-4 group-hover:underline">
          {apartamento.nombre}
        </h3>
        <p className="text-sm text-tinta-suave">
          {apartamento.ciudad}, {apartamento.region}
        </p>
        <p className="text-sm text-tinta-suave">Hasta {apartamento.capacidad} huéspedes</p>
        <p className="pt-1.5 text-sm text-tinta-suave">
          <span className="text-base font-semibold tabular-nums text-tinta">{formatoMoneda(apartamento.precioPorNoche)}</span> / noche
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
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {apartamentos.map((a) => (
        <TarjetaApartamento key={a.id} apartamento={a} consulta={consulta} />
      ))}
    </div>
  )
}
