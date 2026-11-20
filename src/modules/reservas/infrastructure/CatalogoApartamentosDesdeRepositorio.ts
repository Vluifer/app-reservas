import type { ApartamentoRepository } from '@/modules/apartamentos/domain/puertos'
import type { CatalogoApartamentos } from '../domain/puertos'
import type { ApartamentoReservable } from '../domain/Reserva'

/**
 * Capa anticorrupción: traduce el agregado Apartamento (de otro módulo)
 * a lo mínimo que reservas necesita. Así reservas no depende del modelo interno de apartamentos.
 */
export class CatalogoApartamentosDesdeRepositorio implements CatalogoApartamentos {
  constructor(private readonly apartamentos: ApartamentoRepository) {}

  async obtenerReservable(apartamentoId: string): Promise<ApartamentoReservable | null> {
    const apartamento = await this.apartamentos.buscarPorId(apartamentoId)
    if (!apartamento) return null
    return {
      id: apartamento.id,
      nombre: apartamento.nombre,
      propietarioId: apartamento.propietarioId,
      capacidad: apartamento.capacidad,
      activo: apartamento.estaActivo(),
      precioPorNoche: apartamento.precioPorNoche,
      tarifaLimpieza: apartamento.tarifaLimpieza,
      politicaCancelacion: apartamento.politicaCancelacion,
    }
  }
}
