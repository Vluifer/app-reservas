import Link from 'next/link'
import type { ReactNode } from 'react'

/** Ancho completo de la pantalla: sale del contenedor de la página */
const A_TODO_EL_ANCHO = 'ml-[calc(50%-50vw)] w-screen'

/**
 * Portada piedra media de las páginas del panel del propietario. Continúa la franja de pestañas del layout
 * (anula su separación) con la etiqueta dorada, el título en Cinzel y, opcionalmente, una acción y cifras.
 * En las páginas internas (`volver`), la etiqueta es además el enlace de regreso al resumen.
 */
export function PortadaPanel({
  titulo,
  descripcion,
  accion,
  volver = false,
  children,
}: {
  titulo: ReactNode
  descripcion: ReactNode
  accion?: ReactNode
  volver?: boolean
  /** Contenido bajo el título (p. ej. las cifras del resumen) */
  children?: ReactNode
}) {
  return (
    <section aria-labelledby="titulo-panel" className={`-mt-8 mb-0 bg-panel text-white [&_:focus-visible]:outline-white ${A_TODO_EL_ANCHO}`}>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            {volver ? (
              <Link
                href="/dashboard"
                className="-ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-control px-1 text-sm font-medium uppercase tracking-wider text-dorado-claro transition-colors hover:text-white"
              >
                <span aria-hidden>←</span> Panel de propietario
              </Link>
            ) : (
              <p className="text-sm font-medium uppercase tracking-wider text-dorado-claro">Panel de propietario</p>
            )}
            <h1 id="titulo-panel" className="mt-2 text-balance font-display text-4xl text-white sm:text-5xl">
              {titulo}
            </h1>
            <div className="mt-3 text-white/70">{descripcion}</div>
          </div>
          {accion}
        </div>
        {children}
      </div>
    </section>
  )
}

/**
 * Franja gris a todo el ancho hasta el pie (anula el margen inferior de main): ahí reposan las tarjetas blancas.
 * La usan el panel del propietario y "Mis reservas".
 * Va justo después de `PortadaPanel`, que no deja margen debajo (en Tailwind v4 `space-y` pone el margen abajo del anterior).
 */
export function FranjaPanel({ children }: { children: ReactNode }) {
  return (
    <div className={`-mb-16 bg-banda sm:-mb-24 ${A_TODO_EL_ANCHO}`}>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">{children}</div>
    </div>
  )
}
