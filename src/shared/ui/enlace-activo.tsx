'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Enlace de navegación que marca la página actual con aria-current y una clase activa. */
export function EnlaceActivo({
  href,
  exacto = false,
  className = '',
  claseActiva = '',
  claseInactiva = '',
  children,
}: {
  href: string
  exacto?: boolean
  className?: string
  claseActiva?: string
  claseInactiva?: string
  children: React.ReactNode
}) {
  const ruta = usePathname()
  const activo = exacto ? ruta === href : ruta === href || ruta.startsWith(`${href}/`)
  return (
    <Link
      href={href}
      aria-current={activo ? 'page' : undefined}
      className={`${className} ${activo ? claseActiva : claseInactiva}`}
      // Cierra el menú móvil (<details>), que sigue abierto al navegar porque el layout persiste
      onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}
    >
      {children}
    </Link>
  )
}
