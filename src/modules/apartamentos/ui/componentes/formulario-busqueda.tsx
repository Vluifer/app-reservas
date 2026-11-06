import type { ComponentProps } from 'react'

/** Segmento de la barra: etiqueta corta en versalitas arriba y campo sin borde debajo. */
function Segmento({ etiqueta, className = '', ...props }: ComponentProps<'input'> & { etiqueta: string }) {
  return (
    <label
      className={`block min-w-0 rounded-[1.75rem] px-5 py-2.5 transition-colors group-data-[variante=compacta]:py-1.5 group-data-[variante=portada]:rounded-control group-data-[variante=portada]:px-4 hover:bg-hundido focus-within:bg-superficie focus-within:shadow-flotante focus-within:ring-1 focus-within:ring-borde ${className}`}
    >
      <span className="mb-0.5 block text-[0.6875rem] font-semibold uppercase tracking-wider text-tinta-suave">{etiqueta}</span>
      <input
        className="block w-full bg-transparent text-sm text-tinta placeholder:text-tinta-tenue focus:outline-hidden"
        {...props}
      />
    </label>
  )
}

/** Separador vertical entre segmentos, solo en la barra horizontal de la portada */
const SEPARADO = 'lg:group-data-[variante=portada]:relative lg:group-data-[variante=portada]:before:absolute lg:group-data-[variante=portada]:before:inset-y-3 lg:group-data-[variante=portada]:before:-left-0.5 lg:group-data-[variante=portada]:before:w-px lg:group-data-[variante=portada]:before:bg-borde'

const VARIANTES = {
  /** Barra redondeada con sombra flotante */
  barra: 'rounded-bloque border border-borde bg-superficie p-2 shadow-flotante lg:rounded-full',
  /** Resultados de búsqueda: más baja y sin sombra flotante */
  compacta: 'rounded-bloque border border-borde-control/50 bg-superficie p-1.5 lg:rounded-full',
  /** Sobre la foto de portada: tarjeta de vidrio esmerilado, como en la demo "Real Estate" */
  portada: 'rounded-tarjeta border border-white/50 bg-white/90 p-3 shadow-[0_8px_32px_rgb(0_0_0/0.08)] backdrop-blur-xl',
}

/** Formulario GET: los filtros quedan en la URL (se pueden compartir y paginar). */
export function FormularioBusqueda({
  valores = {},
  variante = 'barra',
}: {
  valores?: { ciudad?: string; llegada?: string; salida?: string; huespedes?: string; precioMaximo?: string }
  variante?: keyof typeof VARIANTES
}) {
  return (
    <form
      action="/apartamentos"
      role="search"
      data-variante={variante}
      className={`group grid gap-1 lg:grid-cols-[1.6fr_1fr_1fr_0.9fr_auto] lg:items-center ${VARIANTES[variante]}`}
    >
      {/* Una nueva búsqueda conserva el filtro de precio elegido en los resultados */}
      {valores.precioMaximo && <input type="hidden" name="precioMaximo" value={valores.precioMaximo} />}
      <Segmento etiqueta="Dónde" name="ciudad" defaultValue={valores.ciudad} placeholder="Busca una ciudad" autoComplete="address-level2" />
      <div className="grid grid-cols-2 gap-1 lg:contents">
        <Segmento etiqueta="Llegada" name="llegada" type="date" defaultValue={valores.llegada} className={SEPARADO} />
        <Segmento etiqueta="Salida" name="salida" type="date" defaultValue={valores.salida} className={SEPARADO} />
      </div>
      <Segmento
        etiqueta="Huéspedes"
        name="huespedes"
        type="number"
        inputMode="numeric"
        min={1}
        defaultValue={valores.huespedes}
        placeholder="¿Cuántos?"
        className={SEPARADO}
      />
      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-acento px-6 text-sm font-semibold text-white transition-colors group-data-[variante=compacta]:min-h-11 group-data-[variante=portada]:rounded-control group-data-[variante=portada]:px-8 hover:bg-acento-hover"
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
