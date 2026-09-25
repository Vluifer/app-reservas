import Link from 'next/link'
import { redirect } from 'next/navigation'
import { claseEnlace } from '@/shared/ui/componentes'
import { obtenerActor } from '../sesion'
import { FormularioRegistro } from '../componentes/formulario-registro'

export default async function RegistroPagina() {
  if (await obtenerActor()) redirect('/')

  return (
    <div className="mx-auto w-full max-w-sm py-4 sm:py-12">
      <span aria-hidden className="block size-3 rounded-full bg-acento" />
      <h1 className="mt-6 font-display text-4xl leading-tight text-tinta sm:text-5xl">Crear cuenta</h1>
      <p className="mt-2 text-tinta-suave">Reserva o publica tu apartamento en minutos.</p>
      <div className="mt-8">
        <FormularioRegistro />
      </div>
      <p className="mt-8 border-t border-borde pt-6 text-center text-sm text-tinta-suave">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className={claseEnlace}>
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
