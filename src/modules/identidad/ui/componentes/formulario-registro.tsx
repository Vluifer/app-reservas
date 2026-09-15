'use client'

import { useActionState } from 'react'
import { BotonEnviar } from '@/shared/ui/boton-enviar'
import { Alerta, Campo } from '@/shared/ui/componentes'
import { registrarse } from '../acciones'

const ROLES = [
  { valor: 'CLIENTE', texto: 'Reservar apartamentos' },
  { valor: 'PROPIETARIO', texto: 'Publicar mis apartamentos' },
]

export function FormularioRegistro() {
  const [estado, accion] = useActionState(registrarse, null)

  return (
    <form action={accion} className="space-y-5">
      <Campo etiqueta="Nombre" name="nombre" autoComplete="name" required minLength={2} />
      <Campo etiqueta="Email" name="email" type="email" autoComplete="email" required />
      <Campo etiqueta="Teléfono (opcional)" name="telefono" type="tel" autoComplete="tel" />
      <div>
        <Campo
          etiqueta="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="ayuda-password"
        />
        <p id="ayuda-password" className="mt-1.5 text-xs text-tinta-suave">
          Mínimo 8 caracteres.
        </p>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-tinta">Quiero</legend>
        <div className="grid gap-2 min-[400px]:grid-cols-2">
          {ROLES.map((o) => (
            <label
              key={o.valor}
              className="flex min-h-11 items-center gap-2.5 rounded-control border border-borde-control bg-superficie px-3.5 py-2.5 text-sm text-tinta transition-colors hover:border-tinta-suave has-checked:border-acento has-checked:bg-acento-suave has-checked:text-acento-texto has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-acento"
            >
              <input
                type="radio"
                name="rol"
                value={o.valor}
                defaultChecked={o.valor === 'CLIENTE'}
                className="size-4 accent-acento focus-visible:outline-none"
              />
              {o.texto}
            </label>
          ))}
        </div>
      </fieldset>

      {estado?.error && <Alerta tipo="error">{estado.error}</Alerta>}
      <BotonEnviar className="mt-2 w-full">Crear cuenta</BotonEnviar>
    </form>
  )
}
