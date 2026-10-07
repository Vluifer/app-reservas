import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { apartamentos } from '@/contenedor'
import { IMAGEN_PORTADA } from '@/shared/ui/imagenes'
import { FormularioBusqueda } from '../componentes/formulario-busqueda'
import { FilaApartamentos } from '../componentes/tarjeta-apartamento'


/** Una fila de ciudad con una o dos tarjetas se ve vacía y repite lo de "Recién publicados". */
const MINIMO_POR_FILA = 3

const listaCiudades = new Intl.ListFormat('es', { type: 'conjunction' })

const claseEnlaceFila =
  'inline-flex min-h-11 items-center text-sm font-medium text-tinta underline decoration-tinta/25 decoration-1 underline-offset-4 transition-colors hover:decoration-tinta'

const hrefCiudad = (ciudad: string) => `/apartamentos?${new URLSearchParams({ ciudad })}`

const cantidad = (total: number) => `${total} ${total === 1 ? 'apartamento' : 'apartamentos'}`

function EncabezadoFila({ id, titulo, children }: { id: string; titulo: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
      <h2 id={id} className="font-display text-2xl text-tinta sm:text-3xl">
        {titulo}
      </h2>
      {children}
    </div>
  )
}

export default async function InicioPagina() {
  const { recientes, ciudades } = await apartamentos.vitrina.ejecutar({ ciudades: 4 })
  const nombresCiudades = ciudades.map((c) => c.ciudad)
  const filasCiudad = ciudades.filter((c) => c.apartamentos.length >= MINIMO_POR_FILA)

  return (
    <div className="space-y-16 sm:space-y-20">
      <section className="relative isolate overflow-hidden rounded-bloque">
        <Image src={IMAGEN_PORTADA} alt="" fill priority sizes="(max-width: 1152px) 100vw, 1152px" className="-z-20 object-cover" />
        {/* Oscurece la foto de abajo hacia arriba para que el texto blanco se lea sobre cualquier imagen */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/80 via-black/45 to-black/15" />

        <div className="flex min-h-[30rem] flex-col justify-end gap-8 p-4 pt-24 sm:min-h-[34rem] sm:p-8 lg:p-10">
          <div>
            <h1 className="max-w-3xl text-balance font-display text-display text-white">
              {nombresCiudades.length > 0
                ? `Apartamentos por noches en ${listaCiudades.format(nombresCiudades.slice(0, 3))}`
                : 'Apartamentos por noches, directo con el propietario'}
            </h1>
            <p className="mt-4 max-w-md text-lg text-white/90">Reserva directamente con quien lo alquila, sin intermediarios.</p>
          </div>
          <FormularioBusqueda />
        </div>
      </section>

      {recientes.length > 0 && (
        <section aria-labelledby="recientes">
          <EncabezadoFila id="recientes" titulo="Recién publicados">
            <Link href="/apartamentos" className={claseEnlaceFila}>
              Ver todos
            </Link>
          </EncabezadoFila>
          <FilaApartamentos apartamentos={recientes} etiqueta="Recién publicados" />
        </section>
      )}

      {filasCiudad.map(({ ciudad, total, apartamentos: deLaCiudad }, i) => (
        <section key={ciudad} aria-labelledby={`ciudad-${i}`}>
          <EncabezadoFila id={`ciudad-${i}`} titulo={`Quédate en ${ciudad}`}>
            {total > deLaCiudad.length && (
              <Link href={hrefCiudad(ciudad)} className={claseEnlaceFila}>
                Ver los {total} en {ciudad}
              </Link>
            )}
          </EncabezadoFila>
          <FilaApartamentos apartamentos={deLaCiudad} etiqueta={`Apartamentos en ${ciudad}`} />
        </section>
      ))}

      {ciudades.length > 1 && (
        <section aria-labelledby="explora" className="border-t border-borde pt-12 sm:pt-16">
          <h2 id="explora" className="text-sm font-medium text-tinta-suave">
            Explora por ciudad
          </h2>
          <ul className="mt-4">
            {ciudades.map(({ ciudad, total }) => (
              <li key={ciudad}>
                <Link
                  href={hrefCiudad(ciudad)}
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 py-2 sm:py-3"
                >
                  <span className="font-display text-4xl text-tinta decoration-tinta/20 decoration-2 underline-offset-8 group-hover:underline sm:text-6xl">
                    {ciudad}
                  </span>
                  <span className="text-sm tabular-nums text-tinta-suave">{cantidad(total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
