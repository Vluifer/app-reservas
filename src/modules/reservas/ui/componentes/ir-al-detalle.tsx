'use client'

import { useEffect } from 'react'

/**
 * Tras Confirmar o Rechazar, la redirección de la Server Action pierde el ancla (#detalle) y la página queda arriba.
 * En móvil el panel está debajo del mes, así que se baja a él al cargar. En escritorio (lg) el panel ya está a la vista.
 */
export function IrAlDetalle({ id }: { id: string }) {
  useEffect(() => {
    if (window.matchMedia('(min-width: 64rem)').matches) return
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [id])
  return null
}
