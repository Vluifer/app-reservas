import Link from 'next/link'
import { reservas } from '@/contenedor'
import type { ActorIdentificado } from '@/shared/domain/Actor'
import { aTextoISO, hoy } from '@/shared/domain/RangoFechas'
import { consultar } from '@/shared/ui/acciones'
import { Alerta, Boton, Campo, claseBoton, Tarjeta } from '@/shared/ui/componentes'
import { formatoMoneda } from '@/shared/ui/formato'
import { DesglosePrecio } from './desglose-precio'
import { FormularioReserva } from './formulario-reserva'

export type ConsultaReserva = { llegada?: string; salida?: string; adultos?: string; ninos?: string }

/**
 * Caja lateral del detalle de apartamento: elegir fechas → ver precio → solicitar reserva.
 * Las fechas viajan en la URL, así la cotización se calcula en el servidor.
 */
export async function PanelReserva({
  apartamentoId,
  precioPorNoche,
  capacidad,
  consulta,
  actor,
}: {
  apartamentoId: string
  precioPorNoche: number
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
      <p className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-tinta">{formatoMoneda(precioPorNoche)}</span>
        <span className="text-sm text-tinta-suave">/ noche</span>
      </p>

      <form className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
        <Campo etiqueta="Llegada" name="llegada" type="date" min={hoyISO} defaultValue={llegada} required />
        <Campo etiqueta="Salida" name="salida" type="date" min={hoyISO} defaultValue={salida} required />
        <Campo etiqueta="Adultos" name="adultos" type="number" inputMode="numeric" min={1} max={capacidad} defaultValue={adultos} required />
        <Campo etiqueta="Niños" name="ninos" type="number" inputMode="numeric" min={0} max={capacidad - 1} defaultValue={ninos} required />
        <p className="col-span-full -mt-1 text-xs text-tinta-suave">
          Máximo {capacidad} {capacidad === 1 ? 'huésped' : 'huéspedes'} en total.
        </p>
        <Boton type="submit" variante="secundario" className="col-span-full">
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
