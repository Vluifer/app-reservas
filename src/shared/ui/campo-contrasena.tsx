'use client'

import { useState, type ComponentProps } from 'react'
import { CLASE_CONTROL, CLASE_ETIQUETA } from './componentes'

/** Campo de contraseña con botón para mostrar u ocultar lo escrito. */
export function CampoContrasena({ etiqueta, className = '', ...props }: Omit<ComponentProps<'input'>, 'type'> & { etiqueta: string }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={className}>
      <label htmlFor={props.id ?? props.name} className={CLASE_ETIQUETA}>
        {etiqueta}
      </label>
      <div className="relative">
        <input id={props.id ?? props.name} type={visible ? 'text' : 'password'} className={`${CLASE_CONTROL} pr-24`} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls={props.id ?? props.name}
          className="absolute inset-y-0 right-0 inline-flex min-w-11 items-center px-3.5 text-sm font-medium text-tinta-suave underline decoration-tinta/25 underline-offset-4 hover:text-tinta hover:decoration-tinta"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    </div>
  )
}
