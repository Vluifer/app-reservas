import type { ComponentProps } from 'react'

/** Segmento de la barra: etiqueta corta arriba y campo sin borde debajo. */
function Segmento({ etiqueta, className = '', ...props }: ComponentProps<'input'> & { etiqueta: string }) {
  return (
    <label
      className={`block min-w-0 rounded-[1.75rem] px-5 py-2.5 transition-colors group-data-[compacto]:py-1.5 hover:bg-hundido focus-within:bg-superficie focus-within:shadow-flotante focus-within:ring-1 focus-within:ring-borde ${className}`}
    >
      <span className="block text-xs font-semibold text-tinta">{etiqueta}</span>
      <input
        className="block w-full bg-transparent text-sm text-tinta placeholder:text-tinta-suave focus:outline-hidden"
        {...props}
      />
    </label>
  )
}

/** Formulario GET: los filtros quedan en la URL (se pueden compartir y paginar). */
export function FormularioBusqueda({
  valores = {},
  compacto = false,
}: {
  valores?: { ciudad?: string; llegada?: string; salida?: string; huespedes?: string; precioMaximo?: string }
  /** En la página de resultados: más baja y sin sombra flotante. */
  compacto?: boolean
}) {
  return (
    <form
      action="/apartamentos"
      role="search"
      data-compacto={compacto || undefined}
      className={`group grid gap-1 rounded-bloque border bg-superficie lg:grid-cols-[1.6fr_1fr_1fr_0.9fr_auto] lg:items-center lg:rounded-full ${
        compacto ? 'border-borde-control/50 p-1.5' : 'border-borde p-2 shadow-flotante'
      }`}
    >
      {/* Una nueva búsqueda conserva el filtro de precio elegido en los resultados */}
      {valores.precioMaximo && <input type="hidden" name="precioMaximo" value={valores.precioMaximo} />}
      <Segmento etiqueta="Dónde" name="ciudad" defaultValue={valores.ciudad} placeholder="Busca una ciudad" autoComplete="address-level2" />
      <div className="grid grid-cols-2 gap-1 lg:contents">
        <Segmento etiqueta="Llegada" name="llegada" type="date" defaultValue={valores.llegada} />
        <Segmento etiqueta="Salida" name="salida" type="date" defaultValue={valores.salida} />
      </div>
      <Segmento etiqueta="Huéspedes" name="huespedes" type="number" inputMode="numeric" min={1} defaultValue={valores.huespedes} placeholder="¿Cuántos?" />
      <button
        type="submit"
        className="inline-flex min-h-12 items-center group-data-[compacto]:min-h-11 justify-center gap-2 rounded-full bg-acento px-6 text-sm font-semibold text-white transition-colors hover:bg-acento-hover"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        Buscar
      </button>
    </form>
  )
}
