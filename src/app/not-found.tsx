import Link from 'next/link'
import { claseBoton } from '@/shared/ui/componentes'

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-md py-20 text-center sm:py-28">
      <p className="font-display text-8xl leading-none text-tinta">404</p>
      <h1 className="mt-6 font-display text-2xl text-tinta">Página no encontrada</h1>
      <p className="mt-2 text-tinta-suave">Lo que buscas no existe o no tienes acceso.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={claseBoton('secundario')}>
          Volver al inicio
        </Link>
        <Link href="/apartamentos" className={claseBoton()}>
          Ver apartamentos
        </Link>
      </div>
    </div>
  )
}
