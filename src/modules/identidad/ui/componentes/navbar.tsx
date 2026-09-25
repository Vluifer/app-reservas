import Link from 'next/link'
import { esAnfitrion } from '@/shared/domain/Actor'
import { claseBoton } from '@/shared/ui/componentes'
import { EnlaceActivo } from '@/shared/ui/enlace-activo'
import { cerrarSesion } from '../acciones'
import { obtenerActor } from '../sesion'

const ENLACE = 'inline-flex min-h-11 items-center rounded-full px-3.5 text-sm font-medium transition-colors'
const ACTIVO = 'bg-hundido text-tinta'
const INACTIVO = 'text-tinta-suave hover:bg-hundido hover:text-tinta'
const ENLACE_MOVIL = 'flex min-h-11 w-full items-center rounded-control px-3 text-left text-sm font-medium'

export async function Navbar() {
  const actor = await obtenerActor()
  const enlaces = [
    { href: '/apartamentos', texto: 'Apartamentos' },
    ...(actor ? [{ href: '/mis-reservas', texto: 'Mis reservas' }] : []),
    ...(actor && esAnfitrion(actor) ? [{ href: '/dashboard', texto: 'Panel' }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-borde bg-fondo/90 backdrop-blur-md">
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 rounded-full font-display text-2xl leading-none text-tinta">
          <span aria-hidden className="size-2.5 rounded-full bg-acento" />
          Reservas
        </Link>

        {/* Escritorio */}
        <div className="hidden items-center gap-1 md:flex">
          {enlaces.map((e) => (
            <EnlaceActivo key={e.href} href={e.href} className={ENLACE} claseActiva={ACTIVO} claseInactiva={INACTIVO}>
              {e.texto}
            </EnlaceActivo>
          ))}
          <span aria-hidden className="mx-2 h-5 w-px bg-borde" />
          {actor ? (
            <>
              <span className="max-w-40 truncate px-2 text-sm text-tinta-suave">{actor.nombre}</span>
              <form action={cerrarSesion}>
                <button type="submit" className={claseBoton('fantasma')}>
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={`${ENLACE} ${INACTIVO}`}>
                Iniciar sesión
              </Link>
              <Link href="/registro" className={claseBoton('secundario')}>
                Registrarse
              </Link>
            </>
          )}
        </div>

        {/* Móvil */}
        <details className="relative md:hidden">
          <summary className="inline-flex size-11 list-none items-center justify-center rounded-full text-tinta hover:bg-hundido [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Abrir menú</span>
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M4 8h16M4 16h16" />
            </svg>
          </summary>
          <div className="absolute right-0 top-full mt-2 w-64 rounded-tarjeta border border-borde bg-superficie p-2 shadow-flotante">
            {enlaces.map((e) => (
              <EnlaceActivo
                key={e.href}
                href={e.href}
                className={ENLACE_MOVIL}
                claseActiva="bg-hundido text-tinta"
                claseInactiva="text-tinta-suave hover:bg-hundido"
              >
                {e.texto}
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
