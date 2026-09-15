import Link from 'next/link'
import { apartamentos } from '@/contenedor'
import { consultar } from '@/shared/ui/acciones'
import { Alerta, claseBoton } from '@/shared/ui/componentes'
import { numeroDeParametro } from '@/shared/ui/formulario'
import { FormularioBusqueda } from '../componentes/formulario-busqueda'
import { RejillaApartamentos } from '../componentes/tarjeta-apartamento'

type Filtros = { ciudad?: string; llegada?: string; salida?: string; huespedes?: string; pagina?: string }

export default async function BuscarApartamentosPagina({ searchParams }: { searchParams: Promise<Filtros> }) {
  const filtros = await searchParams
  const { datos: resultado, error } = await consultar(() =>
    apartamentos.buscar.ejecutar({
      ciudad: filtros.ciudad,
      llegada: filtros.llegada,
      salida: filtros.salida,
      huespedes: numeroDeParametro(filtros.huespedes),
      pagina: numeroDeParametro(filtros.pagina),
    }),
  )

  const conFiltros = (cambios: Filtros) => {
    const parametros = new URLSearchParams(
      Object.entries({ ...filtros, ...cambios }).filter((par): par is [string, string] => Boolean(par[1])),
    )
    return `?${parametros.toString()}`
  }
  // Al abrir un apartamento se llevan las fechas elegidas para cotizar de una vez
  const consultaDetalle = filtros.llegada && filtros.salida ? `?llegada=${filtros.llegada}&salida=${filtros.salida}` : ''

  return (
    <div className="space-y-8">
      <header className="space-y-6">
        <h1 className="font-display text-4xl text-tinta sm:text-5xl">Apartamentos</h1>
        <FormularioBusqueda valores={filtros} />
      </header>

      {error && <Alerta tipo="error">{error}</Alerta>}

      {resultado && (
        <section aria-labelledby="titulo-resultados" className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-borde pb-3">
            <h2 id="titulo-resultados" className="text-sm font-medium text-tinta">
              Resultados
            </h2>
            <p className="text-sm tabular-nums text-tinta-suave" aria-live="polite">
              {resultado.total} {resultado.total === 1 ? 'apartamento' : 'apartamentos'}
            </p>
          </div>

          <RejillaApartamentos apartamentos={resultado.items} consulta={consultaDetalle} />

          {resultado.totalPaginas > 1 && (
            <nav aria-label="Paginación" className="flex items-center justify-between gap-4 border-t border-borde pt-6">
              {resultado.pagina > 1 ? (
                <Link href={conFiltros({ pagina: String(resultado.pagina - 1) })} className={claseBoton('secundario')}>
                  <span aria-hidden>←</span> Anterior
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm tabular-nums text-tinta-suave">
                Página {resultado.pagina} de {resultado.totalPaginas}
              </span>
              {resultado.pagina < resultado.totalPaginas ? (
                <Link href={conFiltros({ pagina: String(resultado.pagina + 1) })} className={claseBoton('secundario')}>
                  Siguiente <span aria-hidden>→</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      )}
    </div>
  )
}
