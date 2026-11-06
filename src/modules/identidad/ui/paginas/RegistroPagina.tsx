import Link from 'next/link'
import { redirect } from 'next/navigation'
import { claseEnlace } from '@/shared/ui/componentes'
import { IMAGEN_REGISTRO } from '@/shared/ui/imagenes'
import { obtenerActor } from '../sesion'
import { FormularioRegistro } from '../componentes/formulario-registro'
import { MarcoAcceso } from '../componentes/marco-acceso'

export default async function RegistroPagina() {
  if (await obtenerActor()) redirect('/')

  return (
    <MarcoAcceso
      titulo="Crear cuenta"
      descripcion="Crea tu cuenta en Morada para reservar o publicar tu apartamento."
      foto={IMAGEN_REGISTRO}
      frase={{
        titulo: 'Tu casa por unos días',
        texto: 'Reserva directamente con quien alquila el apartamento, sin intermediarios.',
      }}
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className={claseEnlace}>
            Inicia sesión
          </Link>
        </>
      }
    >
      <FormularioRegistro />
    </MarcoAcceso>
  )
}
