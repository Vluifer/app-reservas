import type { DatosApartamentoInput } from '@/modules/apartamentos/application/ApartamentoDTO'
import type { ApartamentoReservable } from '@/modules/reservas/domain/Reserva'
import type { ActorIdentificado } from '@/shared/domain/Actor'
import type { Reloj } from '@/shared/domain/comunes'
import { Dinero } from '@/shared/domain/Dinero'

/** Datos de prueba reutilizables. Cada test cambia solo lo que le importa. */

/** 10 de enero de 2030, 10:00 en Bogotá. */
export const AHORA = new Date('2030-01-10T15:00:00Z')

export class RelojFijo implements Reloj {
  constructor(private fecha: Date = AHORA) {}

  ahora() {
    return this.fecha
  }

  avanzarHoras(horas: number) {
    this.fecha = new Date(this.fecha.getTime() + horas * 60 * 60 * 1000)
  }
}

export const propietario: ActorIdentificado = {
  id: 'propietario-1',
  rol: 'PROPIETARIO',
  nombre: 'Paula Propietaria',
  email: 'paula@test.com',
}

export const otroPropietario: ActorIdentificado = {
  id: 'propietario-2',
  rol: 'PROPIETARIO',
  nombre: 'Pedro Propietario',
  email: 'pedro@test.com',
}

export const cliente: ActorIdentificado = { id: 'cliente-1', rol: 'CLIENTE', nombre: 'Carlos Cliente', email: 'carlos@test.com' }
export const otroCliente: ActorIdentificado = { id: 'cliente-2', rol: 'CLIENTE', nombre: 'Clara Cliente', email: 'clara@test.com' }
export const admin: ActorIdentificado = { id: 'admin-1', rol: 'ADMIN', nombre: 'Ana Admin', email: 'ana@test.com' }

export function datosApartamento(cambios: Partial<DatosApartamentoInput> = {}): DatosApartamentoInput {
  return {
    nombre: 'Loft en el centro',
    descripcion: 'Apartamento luminoso a dos cuadras del parque principal.',
    direccion: 'Calle 10 # 5-20',
    ciudad: 'Medellín',
    region: 'Antioquia',
    capacidad: 4,
    numHabitaciones: 2,
    numBanos: 1,
    precioPorNoche: 100,
    tarifaLimpieza: 50,
    amenidades: ['wifi', 'cocina'],
    politicaCancelacion: 'FLEXIBLE',
    ...cambios,
  }
}

export function apartamentoReservable(cambios: Partial<ApartamentoReservable> = {}): ApartamentoReservable {
  return {
    id: 'apto-1',
    nombre: 'Loft en el centro',
    propietarioId: propietario.id,
    capacidad: 4,
    activo: true,
    precioPorNoche: Dinero.desde(100),
    tarifaLimpieza: Dinero.desde(50),
    politicaCancelacion: 'FLEXIBLE',
    ...cambios,
  }
}
