import Image from 'next/image'
import type { ReactNode } from 'react'

/**
 * Página de acceso (login, registro): formulario a la izquierda y una foto grande a la derecha.
 * En pantallas pequeñas solo se muestra el formulario.
 */
export function MarcoAcceso({
  titulo,
  descripcion,
  foto,
  frase,
  pie,
  children,
}: {
  titulo: string
  descripcion: string
  foto: string
  /** Texto sobre la foto */
  frase: { titulo: string; texto: string }
  /** Enlace a la otra página de acceso */
  pie: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      <div className="mx-auto flex w-full max-w-sm flex-col justify-center lg:mx-0 lg:max-w-none lg:py-6">
        <h1 className="font-display text-3xl leading-tight text-tinta sm:text-4xl">{titulo}</h1>
        <p className="mt-2 text-tinta-suave">{descripcion}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-8 border-t border-borde pt-6 text-sm text-tinta-suave">{pie}</p>
      </div>

      {/* Fija mientras se desplaza un formulario largo (registro), para que la frase siga a la vista */}
      <div className="relative isolate hidden overflow-hidden rounded-bloque lg:sticky lg:top-24 lg:flex lg:h-[min(40rem,calc(100dvh-8rem))] lg:flex-col lg:justify-end lg:self-start">
        <Image src={foto} alt="" fill sizes="(max-width: 1152px) 55vw, 640px" className="-z-20 object-cover" priority />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
        <div className="p-10">
          <p className="max-w-md text-balance font-display text-3xl leading-tight text-white">{frase.titulo}</p>
          <p className="mt-3 max-w-sm text-white/85">{frase.texto}</p>
        </div>
      </div>
    </div>
  )
}
