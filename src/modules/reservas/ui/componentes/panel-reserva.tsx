import Link from 'next/link'
import { reservas } from '@/contenedor'
import type { ActorIdentificado } from '@/shared/domain/Actor'
import { aTextoISO, hoy } from '@/shared/domain/RangoFechas'
import { consultar } from '@/shared/ui/acciones'
import type { ComponentProps } from 'react'
import { Alerta, Boton, claseBoton, Tarjeta } from '@/shared/ui/componentes'
import { formatoMoneda } from '@/shared/ui/formato'
import { DesglosePrecio } from './desglose-precio'
import { FormularioReserva } from './formulario-reserva'

/** Celda del recuadro de fechas: etiqueta pequeña y campo sin borde propio. */
function Celda({ etiqueta, className = '', ...props }: ComponentProps<'input'> & { etiqueta: string }) {
  return (
    <label className={`block border-borde-control px-3 py-2 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-tinta ${className}`}>
      <span className="block text-xs font-semibold text-tinta">{etiqueta}</span>
      <input className="block w-full bg-transparent text-sm tabular-nums text-tinta focus:outline-hidden" {...props} />
    </label>
  )
}

export type ConsultaReserva = { llegada?: string; salida?: string; adultos?: string; ninos?: string }

/**
 * Caja lateral del detalle de apartamento: elegir fechas → ver precio → solicitar reserva.
 * Las fechas viajan en la URL, así la cotización se calcula en el servidor.
 */
export async function PanelReserva({
  apartamentoId,
  precioPorNoche,
  tarifaLimpieza,
  capacidad,
  consulta,
  actor,
}: {
  apartamentoId: string
  precioPorNoche: number
  tarifaLimpieza: number
  capacidad: number
  consulta: ConsultaReserva
  actor: ActorIdentificado | null
}) {
  const { llegada, salida } = consulta
  const adultos = consulta.adultos || '1'
  const ninos = consulta.ninos || '0'
  const numAdultos = Number(adultos)
  const numNinos = Number(ninos)
  const cotizacion =
    llegada && salida
      ? await consultar(() => reservas.cotizar.ejecutar({ apartamentoId, llegada, salida, numAdultos, numNinos }))
      : null
  const hoyISO = aTextoISO(hoy(new Date()))
  const urlActual = `/apartamentos/${apartamentoId}?${new URLSearchParams({ llegada: llegada ?? '', salida: salida ?? '', adultos, ninos })}`

  return (
    <Tarjeta className="h-fit space-y-5 shadow-flotante lg:sticky lg:top-24">
      <div>
        <p className="flex items-baseline gap-1.5">
          <span className="font-cifra text-3xl tabular-nums text-tinta">{formatoMoneda(precioPorNoche)}</span>
          <span className="text-sm text-tinta-suave">/ noche</span>
        </p>
        {tarifaLimpieza > 0 && (
          <p className="mt-1 text-sm text-tinta-suave">Más {formatoMoneda(tarifaLimpieza)} de limpieza por estadía</p>
        )}
      </div>

      {/* Fechas y huéspedes en un solo recuadro dividido en celdas */}
      <form className="space-y-3">
        <div className="grid grid-cols-2 overflow-hidden rounded-control border border-borde-control">
          <Celda etiqueta="Llegada" name="llegada" type="date" min={hoyISO} defaultValue={llegada} required className="border-r" />
          <Celda etiqueta="Salida" name="salida" type="date" min={hoyISO} defaultValue={salida} required />
          <Celda
            etiqueta="Adultos"
            name="adultos"
            type="number"
            inputMode="numeric"
            min={1}
            max={capacidad}
            defaultValue={adultos}
            required
            className="border-r border-t"
          />
          <Celda
            etiqueta="Niños"
            name="ninos"
            type="number"
            inputMode="numeric"
            min={0}
            max={capacidad - 1}
            defaultValue={ninos}
            required
            className="border-t"
          />
        </div>
        <p className="text-xs text-tinta-suave">
          Máximo {capacidad} {capacidad === 1 ? 'huésped' : 'huéspedes'} en total.
        </p>
        <Boton type="submit" variante="secundario" className="w-full">
          Ver precio
        </Boton>
      </form>

      {cotizacion?.error && <Alerta tipo="error">{cotizacion.error}</Alerta>}
      {cotizacion?.datos && !cotizacion.datos.disponible && <Alerta tipo="error">El apartamento ya está reservado en esas fechas.</Alerta>}
      {cotizacion?.datos?.disponible && llegada && salida && (
        <>
          {/* La solicitud usa los huéspedes de esta cotización: se muestran para que no haya sorpresas */}
          <p className="text-sm text-tinta-suave">
            Para {numAdultos} {numAdultos === 1 ? 'adulto' : 'adultos'}
            {numNinos > 0 && ` y ${numNinos} ${numNinos === 1 ? 'niño' : 'niños'}`}. Si cambias los huéspedes, vuelve a pulsar
            &quot;Ver precio&quot;.
          </p>
          <DesglosePrecio precio={cotizacion.datos.precio} />
          {actor ? (
            <FormularioReserva apartamentoId={apartamentoId} llegada={llegada} salida={salida} adultos={adultos} ninos={ninos} />
          ) : (
            <Link href={`/login?volverA=${encodeURIComponent(urlActual)}`} className={`${claseBoton()} w-full`}>
              Inicia sesión para reservar
            </Link>
          )}
        </>
      )}
    </Tarjeta>
  )
}
