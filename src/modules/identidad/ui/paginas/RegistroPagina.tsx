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
      descripcion="Reserva o publica tu apartamento en minutos."
      foto={IMAGEN_REGISTRO}
      frase={{
        titulo: 'Reserva directo con el propietario',
        texto: 'Sin intermediarios entre tú y quien alquila el apartamento.',
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
