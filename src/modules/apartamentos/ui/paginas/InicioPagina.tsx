import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { apartamentos } from '@/contenedor'
import { IMAGEN_PORTADA } from '@/shared/ui/imagenes'
import { FormularioBusqueda } from '../componentes/formulario-busqueda'
import { PorQueMorada } from '../componentes/por-que-morada'
import { FilaApartamentos } from '../componentes/tarjeta-apartamento'

/** Una fila de ciudad con una o dos tarjetas se ve vacía y repite lo de "Recién publicados". */
const MINIMO_POR_FILA = 3

const listaCiudades = new Intl.ListFormat('es', { type: 'conjunction' })

const claseEnlaceFila =
  'inline-flex min-h-11 items-center text-sm font-medium text-tinta underline decoration-tinta/25 decoration-1 underline-offset-4 transition-colors hover:decoration-tinta'

const hrefCiudad = (ciudad: string) => `/apartamentos?${new URLSearchParams({ ciudad })}`

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

/** `horasParaConfirmar` es regla del módulo de reservas: la pasa la ruta, así apartamentos no depende de él. */
export default async function InicioPagina({ horasParaConfirmar }: { horasParaConfirmar: number }) {
  const { recientes, ciudades, totalApartamentos, totalCiudades } = await apartamentos.vitrina.ejecutar({ ciudades: 4, porFila: 4 })
  const nombresCiudades = ciudades.map((c) => c.ciudad)
  const filasCiudad = ciudades.filter((c) => c.apartamentos.length >= MINIMO_POR_FILA)
  const cifras = [
    { valor: totalApartamentos, texto: totalApartamentos === 1 ? 'Apartamento' : 'Apartamentos' },
    { valor: totalCiudades, texto: totalCiudades === 1 ? 'Ciudad' : 'Ciudades' },
    { valor: `${horasParaConfirmar} h`, texto: 'Para que el propietario responda' },
  ]

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Portada a todo el ancho de la pantalla (sale del contenedor de la página), pegada a la cabecera */}
      <section className="relative isolate -mt-8 mb-0 ml-[calc(50%-50vw)] w-screen overflow-hidden sm:-mt-12">
        <Image src={IMAGEN_PORTADA} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
        {/* Oscurece de izquierda a derecha, donde va el texto; en móvil el texto ocupa todo el ancho y oscurece parejo */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-black/75 via-black/55 to-black/35 lg:to-transparent" />

        <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl items-center px-4 py-16 sm:px-6 lg:py-24">
          <div className="w-full max-w-4xl">
            <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
              <span aria-hidden className="size-2 rounded-full bg-dorado-claro" />
              Directamente con el propietario
            </p>
            <h1 className="max-w-3xl font-display text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Tu casa
              <br />
              <span className="text-dorado-claro">por unos días</span>
            </h1>
            <p className="mb-10 mt-6 max-w-lg text-lg text-white/80">
              {nombresCiudades.length > 0
                ? `Apartamentos por noches en ${listaCiudades.format(nombresCiudades.slice(0, 3))}, reservados directamente con quien los alquila.`
                : 'Apartamentos por noches, reservados directamente con quien los alquila.'}
            </p>
            <FormularioBusqueda variante="portada" />
            {totalApartamentos > 0 && (
              <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4 sm:gap-x-12">
                {cifras.map(({ valor, texto }) => (
                  <div key={texto} className="flex flex-col-reverse">
                    <dt className="text-sm text-white/70">{texto}</dt>
                    <dd className="font-cifra text-3xl tabular-nums text-white">{valor}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {recientes.length > 0 && (
        /* Franja gris a todo el ancho, pegada a la portada (que no deja margen debajo): sobre ella se ve la sombra y la elevación de las tarjetas */
        <div className="ml-[calc(50%-50vw)] w-screen bg-banda">
          <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 sm:py-20">
            <section aria-labelledby="recientes">
              <EncabezadoFila id="recientes" titulo="Recién publicados">
                <Link href="/apartamentos" className={claseEnlaceFila}>
                  Ver todos
                </Link>
              </EncabezadoFila>
              <FilaApartamentos apartamentos={recientes} etiqueta="Recién publicados" />
            </section>

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
          </div>
        </div>
      )}

      <PorQueMorada horasParaConfirmar={horasParaConfirmar} />
    </div>
  )
}
