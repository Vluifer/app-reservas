import { requerirActor } from '@/modules/identidad/ui/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { FranjaPanel, PortadaPanel } from '@/shared/ui/portada-panel'
import { publicarApartamento } from '../acciones'
import { FormularioApartamento } from '../componentes/formularios-propietario'

export default async function NuevoApartamentoPagina() {
  await requerirActor(ROLES_ANFITRION)

  return (
    <div className="space-y-10">
      <PortadaPanel titulo="Publicar apartamento" descripcion="Completa los datos; las fotos las agregas justo después." volver />
      <FranjaPanel>
        <div className="rounded-tarjeta bg-superficie p-5 shadow-tarjeta sm:p-8 lg:p-10">
          <FormularioApartamento accion={publicarApartamento} textoBoton="Publicar apartamento" />
        </div>
      </FranjaPanel>
    </div>
  )
}
