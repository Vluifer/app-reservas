import Link from 'next/link'
import type { ReactNode } from 'react'
import { apartamentos } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { siNoExiste404 } from '@/shared/ui/acciones'
import { BotonEnviar, BotonEnviarConfirmando, BotonIconoConfirmando } from '@/shared/ui/boton-enviar'
import { claseBoton, EtiquetaEstado, MensajesDeRuta, Tarjeta } from '@/shared/ui/componentes'
import { FranjaPanel, PortadaPanel } from '@/shared/ui/portada-panel'
import { actualizarApartamento, cambiarEstadoApartamento, eliminarImagen, subirImagenes } from '../acciones'
import { FormularioApartamento, FormularioImagenes } from '../componentes/formularios-propietario'
import { ImagenApartamento } from '../componentes/tarjeta-apartamento'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; exito?: string }> }

const ESTADOS_ELEGIBLES = [
  { valor: 'ACTIVO', titulo: 'Activo', texto: 'Aparece en las búsquedas y recibe reservas.' },
  { valor: 'INACTIVO', titulo: 'Inactivo', texto: 'Oculto hasta que lo vuelvas a activar.' },
  { valor: 'MANTENIMIENTO', titulo: 'En mantenimiento', texto: 'Oculto mientras lo arreglas.' },
]

/** Bloque de la página como tarjeta blanca sobre la franja gris: título y una línea de ayuda encima del contenido. */
function Seccion({ id, titulo, descripcion, children }: { id: string; titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-tarjeta bg-superficie p-5 shadow-tarjeta sm:p-8">
      <h2 id={id} className="font-display text-xl text-tinta sm:text-2xl">
        {titulo}
      </h2>
      <p className="mt-1 text-sm text-tinta-suave">{descripcion}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default async function AdministrarApartamentoPagina({ params, searchParams }: Props) {
  const actor = await requerirActor(ROLES_ANFITRION)
  const [{ id }, mensajes] = await Promise.all([params, searchParams])
  const apartamento = await apartamentos.obtenerParaGestion.ejecutar(actor, id).catch(siNoExiste404)

  return (
    <div className="space-y-10">
      <PortadaPanel
        titulo={apartamento.nombre}
        volver
        descripcion={
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <EtiquetaEstado estado={apartamento.estado} />
            <span>
              {apartamento.ciudad}, {apartamento.region}
            </span>
          </div>
        }
        accion={
          <Link href={`/apartamentos/${id}`} className={claseBoton('contornoClaro')}>
            Ver página pública <span aria-hidden>↗</span>
          </Link>
        }
      />

      <FranjaPanel>
        <MensajesDeRuta {...mensajes} />

        <Seccion id="fotos" titulo="Fotos" descripcion="La primera es la portada del anuncio.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {apartamento.imagenes.map((imagen, i) => (
              <div key={imagen.id} className="relative">
                <ImagenApartamento url={imagen.url} alt={`${apartamento.nombre}, foto ${i + 1}`} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px" />
                {imagen.esPrincipal && (
                  <span className="absolute left-2 top-2 rounded-full bg-superficie/95 px-2.5 py-1 text-xs font-semibold text-tinta shadow-flotante">Portada</span>
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
              </div>
            ))}
            <div className={apartamento.imagenes.length === 0 ? 'sm:col-span-2' : ''}>
              <FormularioImagenes accion={subirImagenes.bind(null, id)} />
            </div>
          </div>
        </Seccion>

        <Seccion id="visibilidad" titulo="Visibilidad" descripcion="Decide si el apartamento aparece en las búsquedas.">
          <form action={cambiarEstadoApartamento.bind(null, id)} className="space-y-4">
            <fieldset>
              <legend className="sr-only">Estado del apartamento</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {ESTADOS_ELEGIBLES.map((e) => (
                  <label
                    key={e.valor}
                    className="relative flex flex-col gap-1 rounded-tarjeta border border-borde-control p-4 transition-[border-color,box-shadow] hover:border-tinta has-checked:border-acento has-checked:shadow-[inset_0_0_0_1px_var(--color-acento)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-acento"
                  >
                    <input type="radio" name="estado" value={e.valor} defaultChecked={e.valor === apartamento.estado} className="sr-only" />
                    <span className="font-semibold text-tinta">{e.titulo}</span>
                    <span className="text-sm text-tinta-suave">{e.texto}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <BotonEnviar variante="secundario">Guardar visibilidad</BotonEnviar>
          </form>
        </Seccion>

        <Seccion id="informacion" titulo="Información" descripcion="Lo que ven los huéspedes en el anuncio.">
          <FormularioApartamento accion={actualizarApartamento.bind(null, id)} valores={apartamento} textoBoton="Guardar cambios" />
        </Seccion>

        <Tarjeta tono="peligro" className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-peligro-texto">Eliminar apartamento</h2>
            <p className="mt-1 text-sm text-tinta-suave">Dejará de mostrarse. Las reservas existentes se conservan.</p>
          </div>
          <form action={cambiarEstadoApartamento.bind(null, id)}>
            <input type="hidden" name="estado" value="ELIMINADO" />
            <BotonEnviarConfirmando mensaje={`¿Eliminar "${apartamento.nombre}"? Dejará de mostrarse.`}>Eliminar apartamento</BotonEnviarConfirmando>
          </form>
        </Tarjeta>
      </FranjaPanel>
    </div>
  )
}
