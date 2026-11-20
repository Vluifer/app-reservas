import Image from 'next/image'
import { formatoFechaHora } from '@/shared/ui/formato'
import type { EstadoReserva } from '../../domain/EstadoReserva'
import type { ReservaDTO } from '../../application/ReservaDTO'

/** Qué significa cada estado para quien reservó, en sus palabras. */
const MENSAJES: Record<EstadoReserva, string> = {
  PENDIENTE: 'Esperando que el propietario confirme',
  CONFIRMADA: 'Tu estadía está confirmada',
  EN_CURSO: 'Estás hospedado aquí',
  COMPLETADA: 'Estadía terminada',
  CANCELADA: 'Reserva cancelada',
  RECHAZADA: 'El propietario no aceptó la solicitud',
  EXPIRADA: 'El propietario no respondió a tiempo',
}

export function mensajeParaHuesped(reserva: Pick<ReservaDTO, 'estado' | 'expiraEn'>): { titulo: string; detalle?: string } {
  const titulo = MENSAJES[reserva.estado]
  if (reserva.estado === 'PENDIENTE' && reserva.expiraEn) {
    return { titulo, detalle: `Tiene hasta el ${formatoFechaHora(reserva.expiraEn)} para responder` }
  }
  if (reserva.estado === 'RECHAZADA' || reserva.estado === 'EXPIRADA') {
    return { titulo, detalle: 'Puedes buscar otras fechas u otro apartamento.' }
  }
  return { titulo }
}

/** Foto de portada del apartamento reservado; ocupa todo su contenedor (que fija el tamaño). */
export function FotoApartamento({ url, sizes }: { url: string | null; sizes: string }) {
  return (
    <div className="relative size-full bg-hundido">
      {url ? (
        <Image src={url} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-tinta-suave">
          <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </svg>
        </div>
      )}
    </div>
  )
}
