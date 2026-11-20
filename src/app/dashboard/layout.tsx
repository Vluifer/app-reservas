import { ContadorSolicitudes } from '@/modules/reservas/ui/componentes/contador-solicitudes'
import { EnlaceActivo } from '@/shared/ui/enlace-activo'

const PESTANA = 'group inline-flex min-h-11 items-center rounded-control px-4 text-sm font-medium transition-colors'
const ACTIVA = 'bg-white/10 text-white ring-1 ring-white/15'
const INACTIVA = 'text-white/70 hover:bg-white/5 hover:text-white'

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8">
      {/* Franja piedra media a todo el ancho, pegada a la cabecera (más oscura): las pestañas son el submenú del panel */}
      <div className="-mt-8 ml-[calc(50%-50vw)] w-screen bg-panel sm:-mt-12 [&_:focus-visible]:outline-white">
        <nav aria-label="Panel de propietario" className="mx-auto max-w-6xl overflow-x-auto px-4 py-3 sm:px-6">
          <ul className="flex w-max gap-1">
            <li>
              <EnlaceActivo href="/dashboard" exacto className={PESTANA} claseActiva={ACTIVA} claseInactiva={INACTIVA}>
                Resumen
              </EnlaceActivo>
            </li>
            <li>
              <EnlaceActivo href="/dashboard/reservas" className={PESTANA} claseActiva={ACTIVA} claseInactiva={INACTIVA}>
                Reservas recibidas
                <ContadorSolicitudes />
              </EnlaceActivo>
            </li>
            <li>
              <EnlaceActivo href="/dashboard/calendario" className={PESTANA} claseActiva={ACTIVA} claseInactiva={INACTIVA}>
                Calendario
              </EnlaceActivo>
            </li>
          </ul>
        </nav>
      </div>
      {children}
    </div>
  )
}
