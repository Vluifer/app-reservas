import type { Prisma, PrismaClient } from '@prisma/client'
import { crearPagina, type Pagina } from '@/shared/domain/comunes'
import { Dinero } from '@/shared/domain/Dinero'
import { Apartamento } from '../domain/Apartamento'
import type { ApartamentoRepository, CriteriosBusqueda } from '../domain/puertos'

const CON_IMAGENES = { imagenes: { orderBy: { orden: 'asc' } } } satisfies Prisma.ApartamentoInclude
type FilaApartamento = Prisma.ApartamentoGetPayload<{ include: typeof CON_IMAGENES }>

export class PrismaApartamentoRepository implements ApartamentoRepository {
  constructor(private readonly db: PrismaClient) {}

  async buscarPorId(id: string): Promise<Apartamento | null> {
    const fila = await this.db.apartamento.findUnique({ where: { id }, include: CON_IMAGENES })
    return fila ? aDominio(fila) : null
  }

  async guardar(apartamento: Apartamento): Promise<void> {
    const a = apartamento.instantanea()
    const datos = {
      nombre: a.nombre,
      descripcion: a.descripcion,
      direccion: a.direccion,
      ciudad: a.ciudad,
      region: a.region,
      codigoPostal: a.codigoPostal,
      capacidad: a.capacidad,
      numHabitaciones: a.numHabitaciones,
      numBanos: a.numBanos,
      metrosCuadrados: a.metrosCuadrados,
      precioPorNoche: a.precioPorNoche.aTextoDecimal(),
      tarifaLimpieza: a.tarifaLimpieza.aTextoDecimal(),
      amenidades: a.amenidades,
      politicaCancelacion: a.politicaCancelacion,
      estadoApartamento: a.estado,
    }

    await this.db.$transaction(async (tx) => {
      await tx.apartamento.upsert({
        where: { id: a.id },
        create: { id: a.id, propietarioId: a.propietarioId, createdAt: a.creadoEn, ...datos },
        update: datos,
      })
      await tx.imagen.deleteMany({
        where: { apartamentoId: a.id, id: { notIn: a.imagenes.map((i) => i.id) } },
      })
      for (const imagen of a.imagenes) {
        await tx.imagen.upsert({
          where: { id: imagen.id },
          create: { ...imagen, apartamentoId: a.id },
          update: { orden: imagen.orden, esPrincipal: imagen.esPrincipal },
        })
      }
    })
  }

  async buscarActivos(criterios: CriteriosBusqueda): Promise<Pagina<Apartamento>> {
    const where: Prisma.ApartamentoWhereInput = {
      estadoApartamento: 'ACTIVO',
      ...(criterios.ciudad ? { ciudad: { contains: criterios.ciudad, mode: 'insensitive' } } : {}),
      ...(criterios.huespedes ? { capacidad: { gte: criterios.huespedes } } : {}),
      ...(criterios.precioMaximo ? { precioPorNoche: { lte: criterios.precioMaximo.aTextoDecimal() } } : {}),
      ...(criterios.excluirIds?.length ? { id: { notIn: criterios.excluirIds } } : {}),
    }
    const [filas, total] = await this.db.$transaction([
      this.db.apartamento.findMany({
        where,
        include: CON_IMAGENES,
        orderBy: { createdAt: 'desc' },
        skip: (criterios.pagina - 1) * criterios.porPagina,
        take: criterios.porPagina,
      }),
      this.db.apartamento.count({ where }),
    ])
    return crearPagina(filas.map(aDominio), total, criterios.pagina, criterios.porPagina)
  }

  async listarPorPropietario(propietarioId: string): Promise<Apartamento[]> {
    const filas = await this.db.apartamento.findMany({
      where: { propietarioId, estadoApartamento: { not: 'ELIMINADO' } },
      include: CON_IMAGENES,
      orderBy: { createdAt: 'desc' },
    })
    return filas.map(aDominio)
  }
}

function aDominio(fila: FilaApartamento): Apartamento {
  return Apartamento.reconstruir({
    id: fila.id,
    propietarioId: fila.propietarioId,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    direccion: fila.direccion,
    ciudad: fila.ciudad,
    region: fila.region,
    codigoPostal: fila.codigoPostal,
    capacidad: fila.capacidad,
    numHabitaciones: fila.numHabitaciones,
    numBanos: fila.numBanos,
    metrosCuadrados: fila.metrosCuadrados,
    precioPorNoche: Dinero.desde(fila.precioPorNoche.toString()),
    tarifaLimpieza: Dinero.desde(fila.tarifaLimpieza.toString()),
    amenidades: fila.amenidades,
    politicaCancelacion: fila.politicaCancelacion,
    estado: fila.estadoApartamento,
    creadoEn: fila.createdAt,
    imagenes: fila.imagenes.map(({ id, url, publicId, orden, esPrincipal }) => ({ id, url, publicId, orden, esPrincipal })),
  })
}
