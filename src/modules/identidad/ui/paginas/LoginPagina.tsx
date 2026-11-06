import Link from 'next/link'
import { redirect } from 'next/navigation'
import { claseEnlace } from '@/shared/ui/componentes'
import { IMAGEN_LOGIN } from '@/shared/ui/imagenes'
import { obtenerActor } from '../sesion'
import { FormularioLogin } from '../componentes/formulario-login'
import { MarcoAcceso } from '../componentes/marco-acceso'

export default async function LoginPagina({ searchParams }: { searchParams: Promise<{ volverA?: string }> }) {
  if (await obtenerActor()) redirect('/')
  const { volverA } = await searchParams

  return (
    <MarcoAcceso
      titulo="Iniciar sesión"
      descripcion="Entra a Morada para reservar y seguir tus estadías."
      foto={IMAGEN_LOGIN}
      frase={{
        titulo: 'Tus estadías, siempre a mano',
        texto: 'Fechas, dirección y estado de cada reserva en un solo lugar.',
      }}
      pie={
        <>
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className={claseEnlace}>
            Regístrate
          </Link>
        </>
      }
    >
      <FormularioLogin volverA={volverA ?? '/'} />
    </MarcoAcceso>
  )
}
