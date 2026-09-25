import type { Prisma, PrismaClient } from '@prisma/client'
import { crearPagina, type Pagina } from '@/shared/domain/comunes'
import { Dinero } from '@/shared/domain/Dinero'
import { ConflictoDeConcurrenciaError } from '@/shared/domain/errores'
import { RegistroDeVersiones } from '@/shared/infrastructure/versiones'
import { Apartamento } from '../domain/Apartamento'
import type { ApartamentoRepository, CriteriosBusqueda } from '../domain/puertos'

const CON_IMAGENES = { imagenes: { orderBy: { orden: 'asc' } } } satisfies Prisma.ApartamentoInclude
type FilaApartamento = Prisma.ApartamentoGetPayload<{ include: typeof CON_IMAGENES }>

export class PrismaApartamentoRepository implements ApartamentoRepository {
  private readonly versiones = new RegistroDeVersiones<Apartamento>()

  constructor(private readonly db: PrismaClient) {}

  private cargar = (fila: FilaApartamento): Apartamento => this.versiones.anotar(aDominio(fila), fila.version)

  async buscarPorId(id: string): Promise<Apartamento | null> {
    const fila = await this.db.apartamento.findUnique({ where: { id }, include: CON_IMAGENES })
    return fila ? this.cargar(fila) : null
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

    const version = this.versiones.versionDe(apartamento)

    await this.db.$transaction(async (tx) => {
      if (version === undefined) {
        await tx.apartamento.create({ data: { id: a.id, propietarioId: a.propietarioId, createdAt: a.creadoEn, ...datos } })
      } else {
        // Solo actualiza si nadie lo cambió desde que se leyó. Además bloquea la fila hasta el final
        // de la transacción, así dos cambios de imágenes simultáneos no se pisan.
        const { count } = await tx.apartamento.updateMany({
          where: { id: a.id, version },
          data: { ...datos, version: { increment: 1 } },
        })
        if (count === 0) throw new ConflictoDeConcurrenciaError()
      }
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
    this.versiones.anotar(apartamento, version === undefined ? 0 : version + 1)
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
    return crearPagina(filas.map(this.cargar), total, criterios.pagina, criterios.porPagina)
  }

  async listarPorPropietario(propietarioId: string): Promise<Apartamento[]> {
    const filas = await this.db.apartamento.findMany({
      where: { propietarioId, estadoApartamento: { not: 'ELIMINADO' } },
      include: CON_IMAGENES,
      orderBy: { createdAt: 'desc' },
    })
    return filas.map(this.cargar)
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
