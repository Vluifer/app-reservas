import Link from 'next/link'
import { Marca } from './logo'

/** Solo enlaces a páginas que existen; las protegidas llevan a iniciar sesión si hace falta. */
const COLUMNAS: { titulo: string; enlaces: { href: string; texto: string }[] }[] = [
  {
    titulo: 'Explora',
    enlaces: [
      { href: '/', texto: 'Inicio' },
      { href: '/apartamentos', texto: 'Apartamentos' },
    ],
  },
  {
    titulo: 'Huéspedes',
    enlaces: [
      { href: '/mis-reservas', texto: 'Mis reservas' },
      { href: '/perfil', texto: 'Mi perfil' },
      { href: '/registro', texto: 'Crear cuenta' },
    ],
  },
  {
    titulo: 'Propietarios',
    enlaces: [
      { href: '/dashboard/apartamentos/nuevo', texto: 'Publicar apartamento' },
      { href: '/dashboard', texto: 'Panel' },
      { href: '/dashboard/reservas', texto: 'Reservas recibidas' },
    ],
  },
]

/** Pie de todas las páginas, en piedra como la cabecera. */
export function PiePagina() {
  return (
    <footer className="bg-cabecera text-white [&_:focus-visible]:outline-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="-ml-1 inline-flex min-h-11 items-center gap-3 rounded-control px-1 transition-opacity hover:opacity-80">
              <Marca />
            </Link>
            <p className="mt-4 max-w-xs text-white/70">
              Tu casa por unos días. Apartamentos por noches en Colombia, reservados directamente con quien los alquila.
            </p>
          </div>

          {COLUMNAS.map(({ titulo, enlaces }) => (
            <nav key={titulo} aria-label={titulo}>
              <h2 className="mb-4 font-display text-base tracking-wider">{titulo}</h2>
              <ul className="space-y-1">
                {enlaces.map(({ href, texto }) => (
                  <li key={href}>
                    <Link href={href} className="inline-flex min-h-9 items-center text-white/70 transition-colors hover:text-white">
                      {texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/15 pt-8 text-sm text-white/70">
          <p>© {new Date().getFullYear()} Morada. Todos los derechos reservados.</p>
          <p className="inline-flex items-center gap-2">
            <span aria-hidden className="size-1.5 rounded-full bg-dorado-claro" />
            Hecho en Colombia
          </p>
        </div>
      </div>
    </footer>
  )
}
