import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { FichaApartamento } from '@/modules/apartamentos/application/ConsultasApartamentos'
import { FormularioBusqueda } from '@/modules/apartamentos/ui/componentes/formulario-busqueda'
import { hoy } from '@/shared/domain/RangoFechas'
import { formatoDia } from '@/shared/ui/formato'
import { IMAGEN_PORTADA } from '@/shared/ui/imagenes'
import type { ReservaDTO } from '../../application/ReservaDTO'
import { mensajeParaHuesped } from './estado-para-huesped'

const DIA_MS = 86_400_000

/** "Faltan 3 días", "Llegas mañana"... contado en días calendario de la zona horaria del negocio. */
function cuentaRegresiva(reserva: ReservaDTO, ahora: Date): string {
  if (reserva.estado === 'EN_CURSO') return 'Estás hospedado aquí'
  const dias = Math.round((Date.parse(`${reserva.llegada}T00:00:00Z`) - hoy(ahora).getTime()) / DIA_MS)
  if (dias <= 0) return 'Llegas hoy'
  if (dias === 1) return 'Llegas mañana'
  return `Faltan ${dias} días`
}

/** Bloque de foto con degradado oscuro y contenido blanco abajo, igual que la portada del inicio. */
function Portada({ imagen, children }: { imagen: string | null; children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden rounded-bloque bg-cabecera">
      {imagen && <Image src={imagen} alt="" fill priority sizes="(max-width: 1152px) 100vw, 1152px" className="-z-20 object-cover" />}
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/80 via-black/40 to-black/10" />
      <div className="flex min-h-[22rem] flex-col justify-end gap-6 p-5 pt-20 text-white sm:min-h-[26rem] sm:p-8 lg:p-10">{children}</div>
    </section>
  )
}

export function PortadaProximoViaje({ reserva, ficha, ahora }: { reserva: ReservaDTO; ficha?: FichaApartamento; ahora: Date }) {
  const { titulo } = mensajeParaHuesped(reserva)
  return (
    <Portada imagen={ficha?.imagenPrincipal ?? null}>
      <div>
        <p className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-tinta">{cuentaRegresiva(reserva, ahora)}</p>
        <h2 className="mt-4 max-w-3xl text-balance font-display text-display text-white">
          {ficha ? `Tu próximo viaje es a ${ficha.ciudad}` : 'Tu próximo viaje'}
        </h2>
        <p className="mt-3 text-lg text-white/90">
          {reserva.apartamentoNombre}, del {formatoDia(reserva.llegada)} al {formatoDia(reserva.salida)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href={`/mis-reservas/${reserva.id}`}
          className="inline-flex min-h-11 items-center rounded-control bg-white px-5 text-sm font-semibold text-tinta transition-colors hover:bg-white/90"
        >
          Ver reserva
        </Link>
        <p className="text-sm text-white/90">{titulo}</p>
      </div>
    </Portada>
  )
}

export function PortadaSinViajes() {
  return (
    <Portada imagen={IMAGEN_PORTADA}>
      <div>
        <h2 className="max-w-3xl text-balance font-display text-display text-white">¿A dónde vas ahora?</h2>
        <p className="mt-3 text-lg text-white/90">No tienes viajes próximos. Busca tu siguiente apartamento.</p>
      </div>
      <div className="text-tinta">
        <FormularioBusqueda />
      </div>
    </Portada>
  )
}
