'use client'

import { useActionState } from 'react'
import { BotonEnviar } from '@/shared/ui/boton-enviar'
import { Alerta, AreaTexto, Campo } from '@/shared/ui/componentes'
import { reservar } from '../acciones'

type Props = { apartamentoId: string; llegada: string; salida: string; adultos: string; ninos: string }

export function FormularioReserva({ apartamentoId, llegada, salida, adultos, ninos }: Props) {
  const [estado, accion] = useActionState(reservar, null)

  return (
    <form action={accion} className="space-y-4 border-t border-borde pt-5">
      <input type="hidden" name="apartamentoId" value={apartamentoId} />
      <input type="hidden" name="llegada" value={llegada} />
      <input type="hidden" name="salida" value={salida} />
      <input type="hidden" name="adultos" value={adultos} />
      <input type="hidden" name="ninos" value={ninos} />

      <Campo etiqueta="Teléfono de contacto" name="telefono" type="tel" autoComplete="tel" inputMode="tel" />
      <AreaTexto etiqueta="Mensaje para el propietario (opcional)" name="notas" rows={3} />

      {estado?.error && <Alerta tipo="error">{estado.error}</Alerta>}
      <BotonEnviar className="w-full">Solicitar reserva</BotonEnviar>
      <p className="text-center text-xs leading-5 text-tinta-suave">El propietario tiene 24 horas para confirmarla.</p>
    </form>
  )
}
