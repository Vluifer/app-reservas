'use client'

import { useFormStatus } from 'react-dom'
import { Boton, type VarianteBoton } from './componentes'

type Props = {
  children: React.ReactNode
  variante?: VarianteBoton
  className?: string
}

function Indicador() {
  return <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
}

/** Botón de envío que se deshabilita mientras la Server Action está en curso. */
export function BotonEnviar({ children, variante, className }: Props) {
  const { pending } = useFormStatus()
  return (
    <Boton type="submit" variante={variante} className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <Indicador />
          Procesando…
        </>
      ) : (
        children
      )}
    </Boton>
  )
}

function confirmarAntesDeEnviar(mensaje: string) {
  return (e: React.MouseEvent) => {
    if (!window.confirm(mensaje)) e.preventDefault()
  }
}

/** Igual que BotonEnviar, pero pide confirmación antes de enviar (acciones destructivas). */
export function BotonEnviarConfirmando({ mensaje, children, variante = 'peligro', className }: Props & { mensaje: string }) {
  const { pending } = useFormStatus()
  return (
    <Boton
      type="submit"
      variante={variante}
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={confirmarAntesDeEnviar(mensaje)}
    >
      {pending ? (
        <>
          <Indicador />
          Procesando…
        </>
      ) : (
        children
      )}
    </Boton>
  )
}

/** Botón-icono con confirmación, para acciones destructivas sobre imágenes u otros elementos compactos. */
export function BotonIconoConfirmando({
  mensaje,
  etiqueta,
  className,
  children,
}: {
  mensaje: string
  etiqueta: string
  className: string
  children: React.ReactNode
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      aria-label={etiqueta}
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={confirmarAntesDeEnviar(mensaje)}
    >
      {pending ? <Indicador /> : children}
    </button>
  )
}
