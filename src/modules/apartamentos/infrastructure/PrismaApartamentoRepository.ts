import type { Prisma, PrismaClient } from '@prisma/client'
import { crearPagina, type Pagina } from '@/shared/domain/comunes'
import { Dinero } from '@/shared/domain/Dinero'
import { ConflictoDeConcurrenciaError } from '@/shared/domain/errores'
import { RegistroDeVersiones } from '@/shared/infrastructure/versiones'
import { Apartamento, type ApartamentoProps } from '../domain/Apartamento'
import { unificarCiudades } from '../domain/Ciudad'
import type { ApartamentoRepository, CiudadConOferta, CriteriosBusqueda } from '../domain/puertos'

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

  async crear(apartamento: Apartamento): Promise<void> {
    const a = apartamento.instantanea()
    await this.db.$transaction(async (tx) => {
      await tx.apartamento.create({ data: { id: a.id, propietarioId: a.propietarioId, createdAt: a.creadoEn, ...columnas(a) } })
      await sincronizarImagenes(tx, a)
    })
    this.versiones.anotar(apartamento, 0)
  }

  async guardar(apartamento: Apartamento): Promise<void> {
    const version = this.versiones.versionDe(apartamento)
    if (version === undefined) throw new Error('Un apartamento nuevo se guarda con crear()')

    const a = apartamento.instantanea()
    await this.db.$transaction(async (tx) => {
      // Solo actualiza si nadie lo cambió desde que se leyó. Además bloquea la fila hasta el final
      // de la transacción, así dos cambios de imágenes simultáneos no se pisan.
      const { count } = await tx.apartamento.updateMany({
        where: { id: a.id, version },
        data: { ...columnas(a), version: { increment: 1 } },
      })
      if (count === 0) throw new ConflictoDeConcurrenciaError()
      await sincronizarImagenes(tx, a)
    })
    this.versiones.anotar(apartamento, version + 1)
  }

  async buscarPorIds(ids: string[]): Promise<Apartamento[]> {
    if (ids.length === 0) return []
    const filas = await this.db.apartamento.findMany({ where: { id: { in: ids } }, include: CON_IMAGENES })
    return filas.map(this.cargar)
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

  async ciudadesConOferta(limite?: number): Promise<CiudadConOferta[]> {
    // Sin límite en la consulta: "Cartagena" y "CARTAGENA" se unen después, y el límite va sobre el resultado unido
    const grupos = await this.db.apartamento.groupBy({
      by: ['ciudad'],
      where: { estadoApartamento: 'ACTIVO' },
      _count: { _all: true },
    })
    return unificarCiudades(
      grupos.map((g) => ({ ciudad: g.ciudad, total: g._count._all })),
      limite,
    )
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

/** Columnas propias del apartamento (sin id, propietario ni versión). */
function columnas(a: ApartamentoProps) {
  return {
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
}

/** Deja en la base de datos exactamente las imágenes del agregado (borra las quitadas, crea o reordena el resto). */
async function sincronizarImagenes(tx: Prisma.TransactionClient, a: ApartamentoProps) {
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
