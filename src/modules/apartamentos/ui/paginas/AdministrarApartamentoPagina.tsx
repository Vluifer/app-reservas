import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { apartamentos } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/infrastructure/sesion'
import { esAdmin, ROLES_ANFITRION } from '@/shared/domain/Actor'
import { siNoExiste404 } from '@/shared/ui/acciones'
import { BotonEnviar, BotonEnviarConfirmando, BotonIconoConfirmando } from '@/shared/ui/boton-enviar'
import { claseBoton, claseEnlaceVolver, MensajesDeRuta, Selector, Tarjeta } from '@/shared/ui/componentes'
import { actualizarApartamento, cambiarEstadoApartamento, eliminarImagen, subirImagenes } from '../acciones'
import { FormularioApartamento, FormularioImagenes } from '../componentes/formularios-propietario'
import { ImagenApartamento } from '../componentes/tarjeta-apartamento'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; exito?: string }> }

const ESTADOS_ELEGIBLES = [
  { valor: 'ACTIVO', texto: 'Activo (recibe reservas)' },
  { valor: 'INACTIVO', texto: 'Inactivo (oculto)' },
  { valor: 'MANTENIMIENTO', texto: 'En mantenimiento (oculto)' },
]

/** Tarjeta de ajustes: título y descripción a la izquierda, controles a la derecha. */
function SeccionAjustes({
  titulo,
  descripcion,
  tono,
  children,
}: {
  titulo: string
  descripcion: string
  tono?: 'peligro'
  children: ReactNode
}) {
  return (
    <Tarjeta tono={tono} className="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)]">
      <div>
        <h2 className={`font-semibold ${tono === 'peligro' ? 'text-peligro-texto' : 'text-tinta'}`}>{titulo}</h2>
        <p className="mt-1 text-sm text-tinta-suave">{descripcion}</p>
      </div>
      {children}
    </Tarjeta>
  )
}

export default async function AdministrarApartamentoPagina({ params, searchParams }: Props) {
  const actor = await requerirActor(ROLES_ANFITRION)
  const [{ id }, mensajes] = await Promise.all([params, searchParams])
  const apartamento = await apartamentos.obtener.ejecutar(id, actor).catch(siNoExiste404)
  if (apartamento.propietarioId !== actor.id && !esAdmin(actor)) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <MensajesDeRuta {...mensajes} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/dashboard" className={claseEnlaceVolver}>
            <span aria-hidden>←</span> Panel
          </Link>
          <h1 className="mt-2 font-display text-4xl text-tinta sm:text-5xl">{apartamento.nombre}</h1>
        </div>
        <Link href={`/apartamentos/${id}`} className={claseBoton('secundario')}>
          Ver página pública <span aria-hidden>↗</span>
        </Link>
      </div>

      <SeccionAjustes titulo="Estado" descripcion="Decide si aparece en las búsquedas.">
        <form action={cambiarEstadoApartamento.bind(null, id)} className="flex flex-wrap items-end gap-3">
          <Selector
            etiqueta="Visibilidad"
            name="estado"
            defaultValue={apartamento.estado}
            opciones={ESTADOS_ELEGIBLES}
            className="min-w-60 flex-1"
          />
          <BotonEnviar variante="secundario">Actualizar</BotonEnviar>
        </form>
      </SeccionAjustes>

      <SeccionAjustes titulo="Imágenes" descripcion="La primera es la portada.">
        <div className="space-y-6">
          {apartamento.imagenes.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {apartamento.imagenes.map((imagen, i) => (
                <li key={imagen.id} className="relative">
                  <ImagenApartamento url={imagen.url} alt={`${apartamento.nombre}, foto ${i + 1}`} sizes="(max-width: 640px) 50vw, 250px" />
                  {imagen.esPrincipal && (
                    <span className="absolute left-2 top-2 rounded-full bg-tinta px-2.5 py-1 text-xs font-medium text-fondo">Principal</span>
                  )}
                  <form action={eliminarImagen.bind(null, id, imagen.id)} className="absolute right-2 top-2">
                    <BotonIconoConfirmando
                      etiqueta={`Eliminar foto ${i + 1}`}
                      mensaje={`¿Eliminar la foto ${i + 1}? No se puede deshacer.`}
                      className="inline-flex size-11 items-center justify-center rounded-full bg-superficie/95 text-tinta shadow-flotante transition-colors hover:bg-peligro hover:text-white"
                    >
                      <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </BotonIconoConfirmando>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <FormularioImagenes accion={subirImagenes.bind(null, id)} />
        </div>
      </SeccionAjustes>

      <SeccionAjustes titulo="Información" descripcion="Lo que ven los huéspedes.">
        <FormularioApartamento accion={actualizarApartamento.bind(null, id)} valores={apartamento} textoBoton="Guardar cambios" />
      </SeccionAjustes>

      <SeccionAjustes tono="peligro" titulo="Eliminar apartamento" descripcion="Dejará de mostrarse. Las reservas existentes se conservan.">
        <form action={cambiarEstadoApartamento.bind(null, id)} className="md:self-center md:justify-self-end">
          <input type="hidden" name="estado" value="ELIMINADO" />
          <BotonEnviarConfirmando mensaje={`¿Eliminar "${apartamento.nombre}"? Dejará de mostrarse.`}>
            Eliminar apartamento
          </BotonEnviarConfirmando>
        </form>
      </SeccionAjustes>
    </div>
  )
}
