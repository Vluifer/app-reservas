import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ApartamentoDTO } from '@/modules/apartamentos/application/ApartamentoDTO'
import { BotonEnviar, BotonEnviarConfirmando } from '@/shared/ui/boton-enviar'
import { claseBoton, claseEnlace, claseEnlaceVolver, EtiquetaEstado, RangoFechasTexto } from '@/shared/ui/componentes'
import { formatoDia, formatoDiaMes, formatoMoneda } from '@/shared/ui/formato'
import type { ReservaDTO } from '../../application/ReservaDTO'
import { confirmarReserva, rechazarReserva } from '../acciones'

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-tinta-suave">{termino}</dt>
      <dd className="relative text-right text-tinta">{children}</dd>
    </div>
  )
}

type Props = {
  reserva: ReservaDTO
  /** Ausente si el apartamento se eliminó: entonces solo se muestra la reserva */
  apartamento?: ApartamentoDTO
  dia: string
  /** Enlace "← Volver al día" */
  hrefDia: string
  /** Ruta a la que vuelven Confirmar y Rechazar (este mismo detalle) */
  volverA: string
}

export function DetalleReservaCalendario({ reserva: r, apartamento, dia, hrefDia, volverA }: Props) {
  const personas = r.numAdultos + r.numNinos
  return (
    <div>
      <Link href={hrefDia} className={claseEnlaceVolver}>
        <span aria-hidden>←</span> Volver al {formatoDiaMes(dia)}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="font-display text-xl text-tinta">{r.clienteNombre}</h2>
        <EtiquetaEstado estado={r.estado} />
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <Dato termino="Teléfono">
          {r.clienteTelefono ? (
            <a href={`tel:${r.clienteTelefono}`} className={claseEnlace}>
              {r.clienteTelefono}
            </a>
          ) : (
            'Sin teléfono'
          )}
        </Dato>
        <Dato termino="Correo">
          <a href={`mailto:${r.clienteEmail}`} className={`${claseEnlace} break-all`}>
            {r.clienteEmail}
          </a>
        </Dato>
        <Dato termino="Fechas">
          <RangoFechasTexto desde={formatoDia(r.llegada)} hasta={formatoDia(r.salida)} />
        </Dato>
        <Dato termino="Noches">{r.precio.noches}</Dato>
        <Dato termino="Personas">
          {personas} {personas === 1 ? 'huésped' : 'huéspedes'}
        </Dato>
        <Dato termino="Total">
          <span className="font-cifra">{formatoMoneda(r.precio.total)}</span>
        </Dato>
      </dl>

      {r.acciones.confirmar && (
        <div className="mt-5 flex flex-wrap gap-2">
          <form action={confirmarReserva.bind(null, r.id, volverA)}>
            <BotonEnviar>Confirmar</BotonEnviar>
          </form>
          <form action={rechazarReserva.bind(null, r.id, volverA)}>
            <BotonEnviarConfirmando variante="secundario" mensaje="¿Rechazar esta solicitud? No se puede deshacer.">
              Rechazar
            </BotonEnviarConfirmando>
          </form>
        </div>
      )}

      {apartamento && (
        <div className="mt-6 border-t border-borde pt-5">
          {apartamento.imagenPrincipal && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-control bg-hundido">
              <Image src={apartamento.imagenPrincipal} alt="" fill sizes="20rem" className="object-cover" />
            </div>
          )}
          <h3 className="mt-3 font-display text-lg text-tinta">{apartamento.nombre}</h3>
          <p className="text-sm text-tinta-suave">
            {apartamento.direccion}, {apartamento.ciudad}
          </p>
          <p className="mt-2 line-clamp-3 text-sm text-tinta-suave">{apartamento.descripcion}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/dashboard/apartamentos/${apartamento.id}`} className={claseBoton('secundario', 'sm')}>
              Administrar
            </Link>
            <Link href={`/apartamentos/${apartamento.id}`} className={claseBoton('secundario', 'sm')}>
              Ver página pública <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
