import Link from 'next/link'
import { apartamentos } from '@/contenedor'
import { consultar } from '@/shared/ui/acciones'
import { Alerta } from '@/shared/ui/componentes'
import { formatoFecha, formatoMoneda } from '@/shared/ui/formato'
import { numeroDeParametro } from '@/shared/ui/formulario'
import { FormularioBusqueda } from '../componentes/formulario-busqueda'
import { RejillaApartamentos } from '../componentes/tarjeta-apartamento'

type Filtros = { ciudad?: string; llegada?: string; salida?: string; huespedes?: string; precioMaximo?: string; pagina?: string }

/** Topes del filtro de precio por noche (COP). */
const TOPES_PRECIO = [150_000, 250_000, 400_000]

const claseChip = (activo: boolean) =>
  `inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
    activo ? 'border-tinta bg-tinta text-white' : 'border-borde-control/50 text-tinta hover:border-tinta'
  }`

/** Páginas a mostrar: la primera, la última y las vecinas de la actual; los saltos se marcan con null. */
function paginasVisibles(actual: number, total: number): (number | null)[] {
  const paginas: (number | null)[] = []
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - actual) <= 1) paginas.push(p)
    else if (paginas.at(-1) !== null) paginas.push(null)
  }
  return paginas
}

function resumenBusqueda(filtros: Filtros, total: number): string {
  const partes = [`${total} ${total === 1 ? 'disponible' : 'disponibles'}`]
  if (filtros.llegada && filtros.salida) partes.push(`del ${formatoFecha(filtros.llegada)} al ${formatoFecha(filtros.salida)}`)
  const huespedes = numeroDeParametro(filtros.huespedes)
  if (huespedes) partes.push(`para ${huespedes} ${huespedes === 1 ? 'huésped' : 'huéspedes'}`)
  return partes.join(' ')
}

export default async function BuscarApartamentosPagina({ searchParams }: { searchParams: Promise<Filtros> }) {
  const filtros = await searchParams
  const precioMaximo = numeroDeParametro(filtros.precioMaximo)
  const { datos: resultado, error } = await consultar(() =>
    apartamentos.buscar.ejecutar({
      ciudad: filtros.ciudad,
      llegada: filtros.llegada,
      salida: filtros.salida,
      huespedes: numeroDeParametro(filtros.huespedes),
      precioMaximo,
      pagina: numeroDeParametro(filtros.pagina),
    }),
  )

  // Cualquier cambio de filtro vuelve a la primera página; solo la paginación la cambia
  const conFiltros = (cambios: Filtros) => {
    const parametros = new URLSearchParams(
      Object.entries({ ...filtros, pagina: undefined, ...cambios }).filter((par): par is [string, string] => Boolean(par[1])),
    )
    const consulta = parametros.toString()
    return consulta ? `?${consulta}` : '/apartamentos'
  }
  // Al abrir un apartamento se llevan las fechas elegidas para cotizar de una vez
  const consultaDetalle = filtros.llegada && filtros.salida ? `?llegada=${filtros.llegada}&salida=${filtros.salida}` : ''
  const ciudad = filtros.ciudad?.trim()
  const hayFiltros = Boolean(ciudad || filtros.llegada || filtros.salida || filtros.huespedes || precioMaximo)

  return (
    <div className="space-y-8">
      <FormularioBusqueda valores={filtros} variante="compacta" />

      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="font-display text-3xl text-tinta sm:text-4xl">{ciudad ? `Apartamentos en ${ciudad}` : 'Todos los apartamentos'}</h1>
          {resultado && (
            <p className="mt-2 text-tinta-suave" aria-live="polite">
              {resumenBusqueda(filtros, resultado.total)}
            </p>
          )}
        </div>
        {hayFiltros && (
          <Link href="/apartamentos" className="inline-flex min-h-11 items-center text-sm font-medium text-tinta underline decoration-tinta/25 decoration-1 underline-offset-4 transition-colors hover:decoration-tinta">
            Quitar filtros
          </Link>
        )}
      </header>

      <nav aria-label="Precio por noche" className="-mx-4 flex gap-2 max-sm:sin-barra overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={conFiltros({ precioMaximo: undefined })} aria-current={!precioMaximo ? 'true' : undefined} className={claseChip(!precioMaximo)}>
          Cualquier precio
        </Link>
        {TOPES_PRECIO.map((tope) => (
          <Link
            key={tope}
            href={conFiltros({ precioMaximo: String(tope) })}
            aria-current={precioMaximo === tope ? 'true' : undefined}
            className={claseChip(precioMaximo === tope)}
          >
            Hasta {formatoMoneda(tope)}
          </Link>
        ))}
      </nav>

      {error && <Alerta tipo="error">{error}</Alerta>}

      {resultado && (
        /* Franja gris a todo el ancho hasta el pie (anula el margen inferior de main): deja ver la sombra de las tarjetas */
        <div className="!mt-10 -mb-16 ml-[calc(50%-50vw)] w-screen bg-banda sm:-mb-24">
          <section aria-label="Resultados" className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6 sm:py-16">
            <RejillaApartamentos apartamentos={resultado.items} consulta={consultaDetalle} />

            {resultado.totalPaginas > 1 && (
              <nav aria-label="Paginación" className="flex flex-wrap items-center justify-center gap-1 border-t border-borde pt-8">
                {resultado.pagina > 1 && (
                  <Link
                    href={conFiltros({ pagina: String(resultado.pagina - 1) })}
                    className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-tinta underline-offset-4 hover:underline"
                  >
                    Anterior
                  </Link>
                )}
                {paginasVisibles(resultado.pagina, resultado.totalPaginas).map((p, i) =>
                  p === null ? (
                    <span key={`salto-${i}`} aria-hidden className="px-1 text-tinta-suave">
                      …
                    </span>
                  ) : (
                    <Link
                      key={p}
                      href={conFiltros({ pagina: String(p) })}
                      aria-current={p === resultado.pagina ? 'page' : undefined}
                      aria-label={`Página ${p}`}
                      className={`inline-flex size-11 items-center justify-center rounded-full text-sm tabular-nums transition-colors ${
                        p === resultado.pagina ? 'bg-tinta font-semibold text-white' : 'text-tinta hover:bg-hundido'
                      }`}
                    >
                      {p}
                    </Link>
                  ),
                )}
                {resultado.pagina < resultado.totalPaginas && (
                  <Link
                    href={conFiltros({ pagina: String(resultado.pagina + 1) })}
                    className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-tinta underline-offset-4 hover:underline"
                  >
                    Siguiente
                  </Link>
                )}
              </nav>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
