import Link from 'next/link'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { claseEnlaceVolver } from '@/shared/ui/componentes'
import { publicarApartamento } from '../acciones'
import { FormularioApartamento } from '../componentes/formularios-propietario'

export default async function NuevoApartamentoPagina() {
  await requerirActor(ROLES_ANFITRION)

  return (
    <div className="space-y-10">
      <div>
        <Link href="/dashboard" className={claseEnlaceVolver}>
          <span aria-hidden>←</span> Panel
        </Link>
        <h1 className="mt-2 font-display text-3xl text-tinta sm:text-4xl">Publicar apartamento</h1>
        <p className="mt-2 text-tinta-suave">Completa los datos; las fotos las agregas justo después.</p>
      </div>
      <FormularioApartamento accion={publicarApartamento} textoBoton="Publicar apartamento" />
    </div>
  )
}
