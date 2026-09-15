import { Boton, Campo } from '@/shared/ui/componentes'

/** Formulario GET: los filtros quedan en la URL (se pueden compartir y paginar). */
export function FormularioBusqueda({
  valores = {},
}: {
  valores?: { ciudad?: string; llegada?: string; salida?: string; huespedes?: string }
}) {
  return (
    <form
      action="/apartamentos"
      role="search"
      className="grid gap-3 rounded-tarjeta border border-borde bg-superficie p-4 text-tinta shadow-flotante sm:grid-cols-2 sm:p-5 lg:grid-cols-[1.6fr_1fr_1fr_0.8fr_auto] lg:items-end"
    >
      <Campo etiqueta="Ciudad" name="ciudad" defaultValue={valores.ciudad} placeholder="¿A dónde vas?" autoComplete="address-level2" />
      <Campo etiqueta="Llegada" name="llegada" type="date" defaultValue={valores.llegada} />
      <Campo etiqueta="Salida" name="salida" type="date" defaultValue={valores.salida} />
      <Campo etiqueta="Huéspedes" name="huespedes" type="number" inputMode="numeric" min={1} defaultValue={valores.huespedes} />
      <div className="sm:col-span-2 lg:col-span-1">
        <Boton type="submit" className="w-full lg:w-auto lg:px-7">
          Buscar
        </Boton>
      </div>
    </form>
  )
}
