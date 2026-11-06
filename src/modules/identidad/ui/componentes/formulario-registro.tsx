'use client'

import { useActionState, type ReactNode } from 'react'
import { BotonEnviar } from '@/shared/ui/boton-enviar'
import { CampoContrasena } from '@/shared/ui/campo-contrasena'
import { Alerta, Campo } from '@/shared/ui/componentes'
import { registrarse } from '../acciones'

const ROLES: { valor: string; titulo: string; texto: string; icono: ReactNode }[] = [
  {
    valor: 'CLIENTE',
    titulo: 'Quiero viajar',
    texto: 'Busca y reserva apartamentos.',
    icono: (
      <>
        <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
        <path d="M9 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5v2M8 7.5v12M16 7.5v12" />
      </>
    ),
  },
  {
    valor: 'PROPIETARIO',
    titulo: 'Quiero publicar',
    texto: 'Recibe reservas de tu apartamento.',
    icono: (
      <>
        <path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z" />
        <circle cx="12" cy="12.5" r="2.25" />
        <path d="M12 14.75v4M12 17.25h1.75" />
      </>
    ),
  },
]

export function FormularioRegistro() {
  const [estado, accion] = useActionState(registrarse, null)

  return (
    <form action={accion} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-tinta">¿Para qué usarás tu cuenta?</legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <label
              key={r.valor}
              className="relative flex flex-col gap-3 rounded-tarjeta border border-borde-control bg-superficie p-4 text-tinta transition-[border-color,box-shadow] hover:border-tinta has-checked:border-acento has-checked:shadow-[inset_0_0_0_1px_var(--color-acento)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-acento"
            >
              <input type="radio" name="rol" value={r.valor} defaultChecked={r.valor === 'CLIENTE'} className="sr-only" />
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {r.icono}
              </svg>
              <span>
                <span className="block font-semibold">{r.titulo}</span>
                <span className="mt-0.5 block text-sm text-tinta-suave">{r.texto}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Campo etiqueta="Nombre" name="nombre" autoComplete="name" required minLength={2} />
      <Campo etiqueta="Correo electrónico" name="email" type="email" autoComplete="email" required />
      <Campo etiqueta="Teléfono (opcional)" name="telefono" type="tel" autoComplete="tel" />
      <div>
        <CampoContrasena
          etiqueta="Contraseña"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="ayuda-password"
        />
        <p id="ayuda-password" className="mt-1.5 text-xs text-tinta-suave">
          Mínimo 8 caracteres.
        </p>
      </div>

      {estado?.error && <Alerta tipo="error">{estado.error}</Alerta>}
      <BotonEnviar className="mt-2 w-full">Crear cuenta</BotonEnviar>
    </form>
  )
}
