'use client'

import Image from 'next/image'
import { useRef } from 'react'

/** Botón sobre la galería que abre todas las fotos en un diálogo a pantalla completa (Esc lo cierra). */
export function TodasLasFotos({ imagenes, nombre }: { imagenes: { id: string; url: string }[]; nombre: string }) {
  const dialogo = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        className="absolute bottom-4 right-4 hidden min-h-11 items-center gap-2 rounded-control border border-tinta bg-superficie px-4 text-sm font-semibold text-tinta transition-colors hover:bg-hundido sm:inline-flex"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
        Ver las {imagenes.length} fotos
      </button>

      <dialog
        ref={dialogo}
        aria-label={`Fotos de ${nombre}`}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-superficie backdrop:bg-black/40"
      >
        <div className="sticky top-0 z-10 border-b border-borde bg-superficie/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm text-tinta-suave">{imagenes.length} fotos</p>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              autoFocus
              className="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold text-tinta hover:bg-hundido"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
              Cerrar
            </button>
          </div>
        </div>
        <ul className="mx-auto max-w-3xl space-y-2 px-4 py-6">
          {imagenes.map((imagen, i) => (
            <li key={imagen.id} className="relative aspect-[3/2] overflow-hidden rounded-tarjeta bg-hundido">
              <Image
                src={imagen.url}
                alt={`${nombre}, foto ${i + 1} de ${imagenes.length}`}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      </dialog>
    </>
  )
}
