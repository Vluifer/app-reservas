/**
 * La política la elige el propietario al publicar el apartamento
 * y se copia en cada reserva (si luego cambia, las reservas existentes no se ven afectadas).
 */
export const POLITICAS_CANCELACION = ['FLEXIBLE', 'MODERADA', 'ESTRICTA'] as const
export type PoliticaCancelacion = (typeof POLITICAS_CANCELACION)[number]

export const DESCRIPCION_POLITICA: Record<PoliticaCancelacion, string> = {
  FLEXIBLE: 'Reembolso total si cancelas al menos 24 horas antes de la llegada',
  MODERADA: 'Reembolso del 50% si cancelas al menos 5 días antes de la llegada',
  ESTRICTA: 'Sin reembolso',
}
