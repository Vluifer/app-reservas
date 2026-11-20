import Link from 'next/link'
import type { ReactNode } from 'react'
import { identidad } from '@/contenedor'
import { esAnfitrion } from '@/shared/domain/Actor'
import { NoEncontradoError } from '@/shared/domain/errores'
import { Avatar, claseBoton } from '@/shared/ui/componentes'
import { EnlaceActivo } from '@/shared/ui/enlace-activo'
import { Marca } from '@/shared/ui/logo'
import { MenuDesplegable } from '@/shared/ui/menu-desplegable'
import { cerrarSesion } from '../acciones'
import { obtenerActor } from '../sesion'

const ENLACE =
  'relative inline-flex min-h-11 items-center rounded-control px-4 text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors'
/** Filete dorado bajo la sección actual: el único toque de color de la cabecera */
const ACTIVO = 'text-white after:absolute after:inset-x-4 after:bottom-1 after:h-px after:bg-dorado-claro'
const INACTIVO = 'text-white/75 hover:text-white'
const ENLACE_MOVIL = 'flex min-h-11 w-full items-center rounded-control px-3 text-left text-sm font-medium'
const ENLACE_MENU = `${ENLACE_MOVIL} text-tinta hover:bg-hundido`
/** Panel blanco que se despliega bajo la cabecera piedra */
const PANEL =
  'absolute right-0 top-full z-50 mt-2 w-72 rounded-tarjeta border border-borde bg-superficie p-2 text-tinta shadow-flotante [&_:focus-visible]:outline-acento'

/** Foto, nombre y email de la cuenta, arriba de los menús. */
function Cuenta({ nombre, email, foto }: { nombre: string; email: string; foto: string | null }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Avatar nombre={nombre} foto={foto} />
      <div className="min-w-0">
        <p className="truncate font-semibold">{nombre}</p>
        <p className="truncate text-sm text-tinta-suave">{email}</p>
      </div>
    </div>
  )
}

function Salir() {
  return (
    <form action={cerrarSesion}>
      <button type="submit" className={ENLACE_MENU}>
        Salir
      </button>
    </form>
  )
}

/**
 * `avisoPanel` lo compone el layout raíz (p. ej. cuántas solicitudes esperan respuesta),
 * así identidad no depende de otros módulos.
 */
export async function Navbar({ avisoPanel }: { avisoPanel?: ReactNode }) {
  const actor = await obtenerActor()
  // Nombre y foto salen de la base de datos (no del JWT), para que se vean al instante tras editar el perfil
  const perfil = actor
    ? await identidad.obtenerPerfil.ejecutar(actor).catch((error) => {
        if (error instanceof NoEncontradoError) return null
        throw error
      })
    : null
  const cuenta = actor && { nombre: perfil?.nombre ?? actor.nombre, email: actor.email, foto: perfil?.fotoUrl ?? null }
  const enlaces: { href: string; texto: string; aviso?: ReactNode }[] = [
    { href: '/apartamentos', texto: 'Apartamentos' },
    ...(actor ? [{ href: '/mis-reservas', texto: 'Mis reservas' }] : []),
    ...(actor && esAnfitrion(actor) ? [{ href: '/dashboard', texto: 'Panel', aviso: avisoPanel }] : []),
  ]

  return (
    // El foco piedra no se ve sobre la cabecera piedra: dentro de ella, contorno blanco
    <header className="sticky top-0 z-40 bg-cabecera text-white [&_:focus-visible]:outline-white">
      {/* Tres columnas: logo a la izquierda, secciones centradas y cuenta a la derecha */}
      <nav aria-label="Principal" className="grid h-20 grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-10">
        <Link
          href="/"
          className="-ml-1 inline-flex min-h-11 items-center gap-3 justify-self-start rounded-control px-1 transition-opacity hover:opacity-80"
        >
          <Marca />
        </Link>

        {/* Escritorio: secciones */}
        <div className="hidden items-center gap-2 md:flex">
          {enlaces.map((e) => (
            <EnlaceActivo key={e.href} href={e.href} className={ENLACE} claseActiva={ACTIVO} claseInactiva={INACTIVO}>
              {e.texto}
              {e.aviso}
            </EnlaceActivo>
          ))}
        </div>

        {/* Escritorio: cuenta */}
        <div className="hidden items-center gap-2 justify-self-end md:flex">
          {cuenta ? (
            <MenuDesplegable
              etiqueta={`Menú de ${cuenta.nombre}`}
              boton={
                <span className="flex rounded-full p-1 transition-colors hover:bg-white/10">
                  <span className="flex rounded-full ring-2 ring-white/25">
                    <Avatar nombre={cuenta.nombre} foto={cuenta.foto} tamano="sm" />
                  </span>
                </span>
              }
            >
              <div className={PANEL}>
                <Cuenta {...cuenta} />
                <div className="my-2 h-px bg-borde" />
                <Link href="/perfil" className={ENLACE_MENU}>
                  Mi perfil
                </Link>
                <Salir />
              </div>
            </MenuDesplegable>
          ) : (
            <>
              <Link href="/login" className="inline-flex min-h-11 items-center rounded-control px-3.5 text-sm font-medium text-white/75 transition-colors hover:text-white">
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
        <MenuDesplegable
          etiqueta="Abrir menú"
          className="justify-self-end md:hidden"
          boton={
            <span className="inline-flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10">
              {cuenta ? (
                <Avatar nombre={cuenta.nombre} foto={cuenta.foto} tamano="sm" />
              ) : (
                <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M4 8h16M4 16h16" />
                </svg>
              )}
            </span>
          }
        >
          <div className={PANEL}>
            {cuenta && (
              <>
                <Cuenta {...cuenta} />
                <div className="my-2 h-px bg-borde" />
              </>
            )}
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
            {cuenta ? (
              <>
                <Link href="/perfil" className={ENLACE_MENU}>
                  Mi perfil
                </Link>
                <Salir />
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
        </MenuDesplegable>
      </nav>
    </header>
  )
}
