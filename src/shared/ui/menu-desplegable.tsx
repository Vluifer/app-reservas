'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Menú con <details>/<summary> (funciona sin JavaScript) que además se cierra
 * al cambiar de página, al hacer clic fuera y con Escape.
 */
export function MenuDesplegable({ boton, etiqueta, className = '', children }: { boton: ReactNode; etiqueta: string; className?: string; children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null)
  const ruta = usePathname()

  useEffect(() => {
    menu.current?.removeAttribute('open')
  }, [ruta])

  useEffect(() => {
    const alHacerClic = (e: MouseEvent) => {
      if (menu.current?.open && !menu.current.contains(e.target as Node)) menu.current.removeAttribute('open')
    }
    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menu.current?.open) {
        menu.current.removeAttribute('open')
        menu.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('click', alHacerClic)
    document.addEventListener('keydown', alPulsarTecla)
    return () => {
      document.removeEventListener('click', alHacerClic)
      document.removeEventListener('keydown', alPulsarTecla)
    }
  }, [])

  return (
    <details ref={menu} className={`relative ${className}`}>
      <summary aria-label={etiqueta} className="list-none rounded-full [&::-webkit-details-marker]:hidden">
        {boton}
      </summary>
      {children}
    </details>
  )
}
