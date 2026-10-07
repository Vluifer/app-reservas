import { ContadorSolicitudes } from '@/modules/reservas/ui/componentes/contador-solicitudes'
import { EnlaceActivo } from '@/shared/ui/enlace-activo'

const PESTANA = 'group inline-flex min-h-11 items-center rounded-control px-4 text-sm font-medium transition-colors'
const ACTIVA = 'bg-tinta text-fondo'
const INACTIVA = 'text-tinta-suave hover:text-tinta'

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8">
      <nav aria-label="Panel de propietario" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1 rounded-bloque border border-borde bg-superficie p-1">
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
        </ul>
      </nav>
      {children}
    </div>
  )
}
