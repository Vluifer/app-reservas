import { identidad } from '@/contenedor'
import type { Rol } from '@/shared/domain/Actor'
import { FormularioDatos, FormularioFoto } from '../componentes/formularios-perfil'
import { requerirActor } from '../sesion'

const NOMBRE_ROL: Record<Rol, string> = { CLIENTE: 'Huésped', PROPIETARIO: 'Anfitrión', ADMIN: 'Administrador' }

export default async function PerfilPagina() {
  const actor = await requerirActor()
  const perfil = await identidad.obtenerPerfil.ejecutar(actor)

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl text-tinta sm:text-4xl">Mi perfil</h1>

      <div className="mt-10 grid gap-10 md:grid-cols-[18rem_minmax(0,1fr)] md:gap-16">
        <section aria-label="Foto de perfil" className="md:self-start">
          <div className="rounded-bloque border border-borde p-6">
            <FormularioFoto nombre={perfil.nombre} foto={perfil.fotoUrl} />
            <div className="mt-6 border-t border-borde pt-5 text-center">
              <p className="font-display text-xl text-tinta">{perfil.nombre}</p>
              <p className="mt-1 text-sm text-tinta-suave">{NOMBRE_ROL[perfil.rol]}</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="datos">
          <h2 id="datos" className="text-lg font-semibold text-tinta">
            Datos personales
          </h2>
          <p className="mt-1 text-sm text-tinta-suave">Se usan en tus próximas reservas; las que ya hiciste conservan los datos con que se crearon.</p>
          <div className="mt-6">
            <FormularioDatos nombre={perfil.nombre} telefono={perfil.telefono} email={perfil.email} />
          </div>
        </section>
      </div>
    </div>
  )
}
