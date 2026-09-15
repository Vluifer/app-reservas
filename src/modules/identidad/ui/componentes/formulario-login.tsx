'use client'

import { useActionState } from 'react'
import { BotonEnviar } from '@/shared/ui/boton-enviar'
import { Alerta, Campo } from '@/shared/ui/componentes'
import { iniciarSesion } from '../acciones'

export function FormularioLogin({ volverA }: { volverA: string }) {
  const [estado, accion] = useActionState(iniciarSesion, null)

  return (
    <form action={accion} className="space-y-5">
      <input type="hidden" name="volverA" value={volverA} />
      <Campo etiqueta="Email" name="email" type="email" autoComplete="email" required />
      <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="current-password" required />
      {estado?.error && <Alerta tipo="error">{estado.error}</Alerta>}
      <BotonEnviar className="mt-2 w-full">Entrar</BotonEnviar>
    </form>
  )
}
