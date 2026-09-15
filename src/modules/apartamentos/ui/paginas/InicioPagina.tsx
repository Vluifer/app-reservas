import Link from 'next/link'
import { apartamentos } from '@/contenedor'
import { FormularioBusqueda } from '../componentes/formulario-busqueda'
import { RejillaApartamentos } from '../componentes/tarjeta-apartamento'

export default async function InicioPagina() {
  const recientes = await apartamentos.buscar.ejecutar({ pagina: 1 })

  return (
    <div className="space-y-16 sm:space-y-24">
      <section className="relative isolate overflow-hidden rounded-bloque bg-tinta px-5 pb-6 pt-14 sm:px-10 sm:pb-10 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 -z-10 size-96 rounded-full bg-acento/35 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-acento-claro">Sin intermediarios</p>
        <h1 className="mt-4 max-w-3xl text-balance font-display text-display text-fondo">
          Encuentra tu próximo <em className="italic text-acento-claro">apartamento</em>
        </h1>
        <p className="mt-5 max-w-xl text-base text-tinta-invertida-suave sm:text-lg">Reserva estadías directamente con los propietarios.</p>
        <div className="mt-10 sm:mt-14">
          <FormularioBusqueda />
        </div>
      </section>

      <section aria-labelledby="recientes">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="recientes" className="font-display text-3xl text-tinta sm:text-4xl">
            Publicados recientemente
          </h2>
          <Link
            href="/apartamentos"
            className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-tinta hover:text-acento-texto"
          >
            Ver todos <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
        <RejillaApartamentos apartamentos={recientes.items.slice(0, 6)} />
      </section>
    </div>
  )
}
