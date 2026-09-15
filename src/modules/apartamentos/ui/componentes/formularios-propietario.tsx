'use client'

import { useActionState } from 'react'
import { DESCRIPCION_POLITICA, POLITICAS_CANCELACION } from '@/shared/domain/PoliticaCancelacion'
import type { EstadoAccion } from '@/shared/ui/acciones'
import { BotonEnviar } from '@/shared/ui/boton-enviar'
import { Alerta, AreaTexto, Campo, Selector } from '@/shared/ui/componentes'
import { MONEDA } from '@/shared/ui/formato'
import type { ApartamentoDTO } from '../../application/ApartamentoDTO'

type AccionFormulario = (estado: EstadoAccion, datos: FormData) => Promise<EstadoAccion>

// float-left + w-full hace que la legend participe en el grid del fieldset
const LEYENDA = 'float-left col-span-full mb-1 w-full text-base font-semibold text-tinta'
const GRUPO = 'grid gap-4 border-t border-borde pt-8'

export function FormularioApartamento({
  accion,
  valores,
  textoBoton,
}: {
  accion: AccionFormulario
  valores?: ApartamentoDTO
  textoBoton: string
}) {
  const [estado, enviar] = useActionState(accion, null)

  return (
    <form action={enviar} className="space-y-8">
      <fieldset className="grid gap-4">
        <legend className={LEYENDA}>Lo básico</legend>
        <Campo etiqueta="Nombre" name="nombre" defaultValue={valores?.nombre} required minLength={3} />
        <AreaTexto etiqueta="Descripción" name="descripcion" defaultValue={valores?.descripcion} rows={5} required minLength={20} />
      </fieldset>

      <fieldset className={`${GRUPO} sm:grid-cols-2`}>
        <legend className={LEYENDA}>Ubicación</legend>
        <Campo etiqueta="Dirección" name="direccion" defaultValue={valores?.direccion} autoComplete="street-address" required />
        <Campo etiqueta="Ciudad" name="ciudad" defaultValue={valores?.ciudad} autoComplete="address-level2" required />
        <Campo etiqueta="Región / departamento" name="region" defaultValue={valores?.region} autoComplete="address-level1" required />
        <Campo
          etiqueta="Código postal (opcional)"
          name="codigoPostal"
          defaultValue={valores?.codigoPostal ?? ''}
          autoComplete="postal-code"
        />
      </fieldset>

      <fieldset className={`${GRUPO} grid-cols-2 lg:grid-cols-4`}>
        <legend className={LEYENDA}>Espacio</legend>
        <Campo etiqueta="Huéspedes" name="capacidad" type="number" inputMode="numeric" min={1} defaultValue={valores?.capacidad} required />
        <Campo
          etiqueta="Habitaciones"
          name="numHabitaciones"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={valores?.numHabitaciones}
          required
        />
        <Campo etiqueta="Baños" name="numBanos" type="number" inputMode="numeric" min={0} defaultValue={valores?.numBanos} required />
        <Campo
          etiqueta="m² (opcional)"
          name="metrosCuadrados"
          type="number"
          inputMode="decimal"
          min={1}
          step="any"
          defaultValue={valores?.metrosCuadrados ?? ''}
        />
      </fieldset>

      <fieldset className={`${GRUPO} sm:grid-cols-2`}>
        <legend className={LEYENDA}>Precio y condiciones</legend>
        <Campo
          etiqueta={`Precio por noche (${MONEDA})`}
          name="precioPorNoche"
          type="number"
          inputMode="decimal"
          min={1}
          step="any"
          defaultValue={valores?.precioPorNoche}
          required
        />
        <Campo
          etiqueta={`Tarifa de limpieza (${MONEDA})`}
          name="tarifaLimpieza"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          defaultValue={valores?.tarifaLimpieza ?? 0}
        />
        <Campo
          etiqueta="Comodidades (separadas por comas)"
          name="amenidades"
          defaultValue={valores?.amenidades.join(', ')}
          placeholder="wifi, cocina, parqueadero"
          className="sm:col-span-2"
        />
        <Selector
          etiqueta="Política de cancelación"
          name="politicaCancelacion"
          defaultValue={valores?.politicaCancelacion ?? 'FLEXIBLE'}
          className="sm:col-span-2"
          opciones={POLITICAS_CANCELACION.map((p) => ({
            valor: p,
            texto: `${p.charAt(0)}${p.slice(1).toLowerCase()}: ${DESCRIPCION_POLITICA[p]}`,
          }))}
        />
      </fieldset>

      {estado?.error && <Alerta tipo="error">{estado.error}</Alerta>}
      {estado?.exito && <Alerta tipo="exito">{estado.exito}</Alerta>}
      <div className="flex justify-end border-t border-borde pt-6">
        <BotonEnviar className="w-full sm:w-auto">{textoBoton}</BotonEnviar>
      </div>
    </form>
  )
}

export function FormularioImagenes({ accion }: { accion: AccionFormulario }) {
  const [estado, enviar] = useActionState(accion, null)

  return (
    <form action={enviar} className="space-y-3">
      <label htmlFor="campo-imagenes" className="block text-sm font-medium text-tinta">
        Añadir imágenes
      </label>
      <input
        id="campo-imagenes"
        type="file"
        name="imagenes"
        accept="image/jpeg,image/png,image/webp"
        multiple
        required
        aria-describedby="ayuda-imagenes"
        className="block w-full rounded-control border border-dashed border-borde-control bg-fondo p-3 text-sm text-tinta-suave file:mr-4 file:min-h-10 file:cursor-pointer file:rounded-full file:border-0 file:bg-tinta file:px-4 file:text-sm file:font-semibold file:text-fondo hover:file:bg-tinta/85"
      />
      <p id="ayuda-imagenes" className="text-xs text-tinta-suave">
        JPG, PNG o WebP. Máximo 5 MB por imagen y 10 imágenes en total.
      </p>
      {estado?.error && <Alerta tipo="error">{estado.error}</Alerta>}
      {estado?.exito && <Alerta tipo="exito">{estado.exito}</Alerta>}
      <BotonEnviar variante="secundario">Subir imágenes</BotonEnviar>
    </form>
  )
}
