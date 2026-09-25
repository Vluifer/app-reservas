import Link from 'next/link'
import { redirect } from 'next/navigation'
import { claseEnlace } from '@/shared/ui/componentes'
import { obtenerActor } from '../sesion'
import { FormularioLogin } from '../componentes/formulario-login'

export default async function LoginPagina({ searchParams }: { searchParams: Promise<{ volverA?: string }> }) {
  if (await obtenerActor()) redirect('/')
  const { volverA } = await searchParams

  return (
    <div className="mx-auto w-full max-w-sm py-4 sm:py-12">
      <span aria-hidden className="block size-3 rounded-full bg-acento" />
      <h1 className="mt-6 font-display text-4xl leading-tight text-tinta sm:text-5xl">Iniciar sesión</h1>
      <p className="mt-2 text-tinta-suave">Accede para reservar y seguir tus estadías.</p>
      <div className="mt-8">
        <FormularioLogin volverA={volverA ?? '/'} />
      </div>
      <p className="mt-8 border-t border-borde pt-6 text-center text-sm text-tinta-suave">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className={claseEnlace}>
          Regístrate
        </Link>
      </p>
    </div>
  )
}
