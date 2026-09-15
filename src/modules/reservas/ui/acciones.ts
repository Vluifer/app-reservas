'use server'

import { redirect } from 'next/navigation'
import { reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/infrastructure/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { conParametro, ejecutarYVolver, manejarErrores, type EstadoAccion } from '@/shared/ui/acciones'
import { numero, texto, textoOpcional } from '@/shared/ui/formulario'

// --- Huésped ---

export async function reservar(_estado: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const actor = await requerirActor()
  return manejarErrores(async () => {
    const reserva = await reservas.crear.ejecutar(actor, {
      apartamentoId: texto(datos, 'apartamentoId'),
      llegada: texto(datos, 'llegada'),
      salida: texto(datos, 'salida'),
      numAdultos: numero(datos, 'adultos', 'Adultos'),
      numNinos: numero(datos, 'ninos', 'Niños'),
      telefono: textoOpcional(datos, 'telefono'),
      notas: textoOpcional(datos, 'notas'),
    })
    redirect(conParametro(`/mis-reservas/${reserva.id}`, 'exito', 'Solicitud enviada. Te avisaremos cuando el propietario responda.'))
  })
}

export async function cancelarReserva(reservaId: string) {
  const actor = await requerirActor()
  await ejecutarYVolver(`/mis-reservas/${reservaId}`, 'Reserva cancelada', () => reservas.cancelar.ejecutar(actor, reservaId))
}

// --- Propietario ---

const RUTA_RECIBIDAS = '/dashboard/reservas'

export async function confirmarReserva(reservaId: string) {
  const actor = await requerirActor(ROLES_ANFITRION)
  await ejecutarYVolver(RUTA_RECIBIDAS, 'Reserva confirmada', () => reservas.confirmar.ejecutar(actor, reservaId))
}

export async function rechazarReserva(reservaId: string) {
  const actor = await requerirActor(ROLES_ANFITRION)
  await ejecutarYVolver(RUTA_RECIBIDAS, 'Reserva rechazada', () => reservas.rechazar.ejecutar(actor, reservaId))
}

export async function cancelarReservaComoPropietario(reservaId: string) {
  const actor = await requerirActor(ROLES_ANFITRION)
  await ejecutarYVolver(RUTA_RECIBIDAS, 'Reserva cancelada', () => reservas.cancelar.ejecutar(actor, reservaId))
}
