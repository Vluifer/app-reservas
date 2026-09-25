import Link from 'next/link'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { claseEnlaceVolver, Tarjeta } from '@/shared/ui/componentes'
import { publicarApartamento } from '../acciones'
import { FormularioApartamento } from '../componentes/formularios-propietario'

export default async function NuevoApartamentoPagina() {
  await requerirActor(ROLES_ANFITRION)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard" className={claseEnlaceVolver}>
          <span aria-hidden>←</span> Panel
        </Link>
        <h1 className="mt-2 font-display text-4xl text-tinta sm:text-5xl">Publicar apartamento</h1>
        <p className="mt-2 text-tinta-suave">Podrás añadir fotos justo después de publicarlo.</p>
      </div>
      <Tarjeta>
        <FormularioApartamento accion={publicarApartamento} textoBoton="Publicar" />
      </Tarjeta>
    </div>
  )
}
