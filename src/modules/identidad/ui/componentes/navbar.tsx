import Link from 'next/link'
import type { ReactNode } from 'react'
import { esAnfitrion } from '@/shared/domain/Actor'
import { claseBoton } from '@/shared/ui/componentes'
import { EnlaceActivo } from '@/shared/ui/enlace-activo'
import { cerrarSesion } from '../acciones'
import { obtenerActor } from '../sesion'

const ENLACE = 'inline-flex min-h-11 items-center rounded-control px-3.5 text-sm font-medium transition-colors'
const ACTIVO = 'bg-white/10 text-white'
const INACTIVO = 'text-white/75 hover:bg-white/10 hover:text-white'
const ENLACE_MOVIL = 'flex min-h-11 w-full items-center rounded-control px-3 text-left text-sm font-medium'

/** Casa con una llave dentro: lo que se reserva y lo que se entrega al llegar. */
function Logo() {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 14.5 16 5l11.5 9.5V26a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 26Z" />
      <circle cx="16" cy="16" r="3" />
      <path d="M16 19v5.5M16 22.5h2.25" />
    </svg>
  )
}

/**
 * `avisoPanel` lo compone el layout raíz (p. ej. cuántas solicitudes esperan respuesta),
 * así identidad no depende de otros módulos.
 */
export async function Navbar({ avisoPanel }: { avisoPanel?: ReactNode }) {
  const actor = await obtenerActor()
  const enlaces: { href: string; texto: string; aviso?: ReactNode }[] = [
    { href: '/apartamentos', texto: 'Apartamentos' },
    ...(actor ? [{ href: '/mis-reservas', texto: 'Mis reservas' }] : []),
    ...(actor && esAnfitrion(actor) ? [{ href: '/dashboard', texto: 'Panel', aviso: avisoPanel }] : []),
  ]

  return (
    // El foco negro no se ve sobre el gris oscuro: dentro de la cabecera, contorno blanco
    <header className="sticky top-0 z-40 bg-cabecera text-white [&_:focus-visible]:outline-white">
      {/* A todo el ancho: el logo va pegado a la izquierda y la navegación a la derecha */}
      <nav aria-label="Principal" className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="-ml-1 inline-flex min-h-11 items-center gap-2.5 rounded-control px-1 transition-opacity hover:opacity-80">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Reservas</span>
        </Link>

        {/* Escritorio */}
        <div className="hidden items-center gap-1 md:flex">
          {enlaces.map((e) => (
            <EnlaceActivo key={e.href} href={e.href} className={ENLACE} claseActiva={ACTIVO} claseInactiva={INACTIVO}>
              {e.texto}
              {e.aviso}
            </EnlaceActivo>
          ))}
          <span aria-hidden className="mx-2 h-5 w-px bg-white/20" />
          {actor ? (
            <>
              <span className="max-w-40 truncate px-2 text-sm text-white/75">{actor.nombre}</span>
              <form action={cerrarSesion}>
                <button type="submit" className={`${ENLACE} ${INACTIVO}`}>
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={`${ENLACE} ${INACTIVO}`}>
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="inline-flex min-h-11 items-center rounded-control bg-white px-5 text-sm font-semibold text-cabecera transition-colors hover:bg-white/90"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Móvil */}
        <details className="relative md:hidden">
          <summary className="inline-flex size-11 list-none items-center justify-center rounded-full text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Abrir menú</span>
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M4 8h16M4 16h16" />
            </svg>
          </summary>
          <div className="absolute right-0 top-full mt-2 w-64 rounded-tarjeta border border-borde bg-superficie p-2 text-tinta shadow-flotante [&_:focus-visible]:outline-acento [&_[data-aviso]]:bg-tinta [&_[data-aviso]]:text-white">
            {enlaces.map((e) => (
              <EnlaceActivo
                key={e.href}
                href={e.href}
                className={ENLACE_MOVIL}
                claseActiva="bg-hundido text-tinta"
                claseInactiva="text-tinta-suave hover:bg-hundido"
              >
                {e.texto}
                {e.aviso}
              </EnlaceActivo>
            ))}
            <div className="my-2 h-px bg-borde" />
            {actor ? (
              <>
                <p className="truncate px-3 py-2 text-xs text-tinta-suave">{actor.nombre}</p>
                <form action={cerrarSesion}>
                  <button type="submit" className={`${ENLACE_MOVIL} text-tinta-suave hover:bg-hundido`}>
                    Salir
                  </button>
                </form>
              </>
            ) : (
              <div className="grid gap-2 p-1">
                <Link href="/login" className={claseBoton('secundario')}>
                  Iniciar sesión
                </Link>
                <Link href="/registro" className={claseBoton()}>
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </details>
      </nav>
    </header>
  )
}
