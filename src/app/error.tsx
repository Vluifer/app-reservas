'use client'

import { Boton } from '@/shared/ui/componentes'

export default function ErrorRuta({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md py-20 text-center">
      <h1 className="font-display text-2xl text-tinta">Algo salió mal</h1>
      <p className="mt-2 text-tinta-suave">No pudimos cargar esta página. Inténtalo de nuevo.</p>
      <Boton variante="secundario" className="mt-8" onClick={reset}>
        Reintentar
      </Boton>
    </div>
  )
}
