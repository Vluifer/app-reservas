import { Dinero } from '@/shared/domain/Dinero'
import type { PoliticaCancelacion } from '@/shared/domain/PoliticaCancelacion'

const MS_POR_HORA = 60 * 60 * 1000

/**
 * Cuánto se devuelve al cancelar una reserva confirmada.
 * La antelación se mide contra el inicio del día de llegada.
 */
export function calcularReembolso(
  politica: PoliticaCancelacion,
  totalPagado: Dinero,
  fechaLlegada: Date,
  ahora: Date,
): Dinero {
  const horasDeAntelacion = (fechaLlegada.getTime() - ahora.getTime()) / MS_POR_HORA

  switch (politica) {
    case 'FLEXIBLE':
      return horasDeAntelacion >= 24 ? totalPagado : Dinero.cero()
    case 'MODERADA':
      return horasDeAntelacion >= 5 * 24 ? totalPagado.porcentaje(50) : Dinero.cero()
    case 'ESTRICTA':
      return Dinero.cero()
  }
}
