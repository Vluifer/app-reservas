import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { FichaApartamento } from '@/modules/apartamentos/application/ConsultasApartamentos'
import { FormularioBusqueda } from '@/modules/apartamentos/ui/componentes/formulario-busqueda'
import { hoy } from '@/shared/domain/RangoFechas'
import { claseBoton } from '@/shared/ui/componentes'
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

/**
 * Portada a todo el ancho de la pantalla, pegada a la cabecera, como la del inicio: foto con degradado
 * de izquierda a derecha (parejo en móvil) y el contenido abajo a la izquierda.
 */
export function PortadaConFoto({ imagen, compacta = false, children }: { imagen: string | null; compacta?: boolean; children: ReactNode }) {
  return (
    // Sin foto (apartamento sin imágenes): piedra media, como las portadas del panel; nunca una foto ajena que confunda
    <section className={`relative isolate -mt-8 mb-0 ml-[calc(50%-50vw)] w-screen overflow-hidden sm:-mt-12 ${imagen ? 'bg-cabecera' : 'bg-panel'}`}>
      {imagen && (
        <>
          <Image src={imagen} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-black/75 via-black/55 to-black/35 lg:to-black/5" />
        </>
      )}
      <div
        className={`mx-auto flex max-w-6xl flex-col justify-end gap-8 px-4 py-12 text-white sm:px-6 lg:py-16 ${compacta ? 'min-h-[22rem] sm:min-h-[26rem]' : 'min-h-[28rem] sm:min-h-[32rem]'}`}
      >
        {children}
      </div>
    </section>
  )
}

/** Píldora de vidrio con punto dorado, la misma de la portada del inicio. */
export function Pildora({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
      <span aria-hidden className="size-2 rounded-full bg-dorado-claro" />
      {children}
    </p>
  )
}

export function PortadaProximoViaje({ reserva, ficha, ahora }: { reserva: ReservaDTO; ficha?: FichaApartamento; ahora: Date }) {
  const { titulo } = mensajeParaHuesped(reserva)
  const alojado = reserva.estado === 'EN_CURSO'
  return (
    <PortadaConFoto imagen={ficha?.imagenPrincipal ?? null}>
      <div className="max-w-3xl">
        <Pildora>{cuentaRegresiva(reserva, ahora)}</Pildora>
        <p className="mt-6 text-sm font-medium uppercase tracking-wider text-dorado-claro">{alojado ? 'Tu estadía' : 'Tu próximo viaje'}</p>
        <h2 className="mt-2 text-balance font-display text-4xl leading-tight text-white sm:text-5xl">
          {ficha ? (alojado ? `Estás en ${ficha.ciudad}` : `Rumbo a ${ficha.ciudad}`) : reserva.apartamentoNombre}
        </h2>
        <p className="mt-4 text-lg text-white/80">
          {reserva.apartamentoNombre}, del {formatoDia(reserva.llegada)} al {formatoDia(reserva.salida)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link href={`/mis-reservas/${reserva.id}`} className={claseBoton('claro')}>
          Ver reserva
        </Link>
        <p className="text-sm text-white/80">{titulo}</p>
      </div>
    </PortadaConFoto>
  )
}

export function PortadaSinViajes() {
  return (
    <PortadaConFoto imagen={IMAGEN_PORTADA}>
      <div className="max-w-3xl">
        <Pildora>Mis reservas</Pildora>
        <h2 className="mt-6 text-balance font-display text-4xl leading-tight text-white sm:text-5xl">
          ¿A dónde vas
          <br />
          <span className="text-dorado-claro">ahora?</span>
        </h2>
        <p className="mt-4 text-lg text-white/80">No tienes viajes próximos. Busca tu siguiente apartamento.</p>
      </div>
      <div className="w-full max-w-4xl text-tinta">
        <FormularioBusqueda variante="portada" />
      </div>
    </PortadaConFoto>
  )
}
