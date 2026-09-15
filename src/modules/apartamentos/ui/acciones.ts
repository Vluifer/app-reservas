'use server'

import { redirect } from 'next/navigation'
import { apartamentos } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/infrastructure/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import type { PoliticaCancelacion } from '@/shared/domain/PoliticaCancelacion'
import { conParametro, ejecutarYVolver, manejarErrores, type EstadoAccion } from '@/shared/ui/acciones'
import { archivos, listaSeparadaPorComas, numero, numeroOpcional, texto, textoOpcional } from '@/shared/ui/formulario'
import type { DatosApartamentoInput } from '../application/ApartamentoDTO'
import type { EstadoApartamento } from '../domain/Apartamento'

function leerDatosApartamento(datos: FormData): DatosApartamentoInput {
  return {
    nombre: texto(datos, 'nombre'),
    descripcion: texto(datos, 'descripcion'),
    direccion: texto(datos, 'direccion'),
    ciudad: texto(datos, 'ciudad'),
    region: texto(datos, 'region'),
    codigoPostal: textoOpcional(datos, 'codigoPostal'),
    capacidad: numero(datos, 'capacidad', 'Capacidad'),
    numHabitaciones: numero(datos, 'numHabitaciones', 'Habitaciones'),
    numBanos: numero(datos, 'numBanos', 'Baños'),
    metrosCuadrados: numeroOpcional(datos, 'metrosCuadrados', 'Metros cuadrados'),
    precioPorNoche: numero(datos, 'precioPorNoche', 'Precio por noche'),
    tarifaLimpieza: numeroOpcional(datos, 'tarifaLimpieza', 'Tarifa de limpieza') ?? 0,
    amenidades: listaSeparadaPorComas(datos, 'amenidades'),
    politicaCancelacion: texto(datos, 'politicaCancelacion') as PoliticaCancelacion,
  }
}

export async function publicarApartamento(_estado: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const actor = await requerirActor(ROLES_ANFITRION)
  return manejarErrores(async () => {
    const apartamento = await apartamentos.publicar.ejecutar(actor, leerDatosApartamento(datos))
    redirect(conParametro(`/dashboard/apartamentos/${apartamento.id}`, 'exito', 'Apartamento publicado. Ahora agrega imágenes.'))
  })
}

export async function actualizarApartamento(id: string, _estado: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const actor = await requerirActor(ROLES_ANFITRION)
  return manejarErrores(async () => {
    await apartamentos.actualizar.ejecutar(actor, id, leerDatosApartamento(datos))
    return { exito: 'Cambios guardados' }
  })
}

export async function cambiarEstadoApartamento(id: string, datos: FormData) {
  const actor = await requerirActor(ROLES_ANFITRION)
  const estado = texto(datos, 'estado') as EstadoApartamento
  const eliminado = estado === 'ELIMINADO'
  await ejecutarYVolver(
    eliminado ? '/dashboard' : `/dashboard/apartamentos/${id}`,
    eliminado ? 'Apartamento eliminado' : 'Estado actualizado',
    () => apartamentos.cambiarEstado.ejecutar(actor, id, estado),
  )
}

export async function subirImagenes(id: string, _estado: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const actor = await requerirActor(ROLES_ANFITRION)
  return manejarErrores(async () => {
    const seleccionadas = await Promise.all(
      archivos(datos, 'imagenes').map(async (archivo) => ({
        nombre: archivo.name,
        tipo: archivo.type,
        tamano: archivo.size,
        contenido: await archivo.arrayBuffer(),
      })),
    )
    await apartamentos.subirImagenes.ejecutar(actor, id, seleccionadas)
    return { exito: 'Imágenes subidas' }
  })
}

export async function eliminarImagen(apartamentoId: string, imagenId: string) {
  const actor = await requerirActor(ROLES_ANFITRION)
  await ejecutarYVolver(`/dashboard/apartamentos/${apartamentoId}`, 'Imagen eliminada', () =>
    apartamentos.eliminarImagen.ejecutar(actor, apartamentoId, imagenId),
  )
}
