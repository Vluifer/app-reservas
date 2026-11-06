import type { Prisma, PrismaClient } from '@prisma/client'
import { Dinero } from '@/shared/domain/Dinero'
import { ConflictoDeConcurrenciaError } from '@/shared/domain/errores'
import { hoy, RangoFechas } from '@/shared/domain/RangoFechas'
import { RegistroDeVersiones } from '@/shared/infrastructure/versiones'
import { ESTADOS_QUE_OCUPAN } from '../domain/EstadoReserva'
import { FechasNoDisponiblesError } from '../domain/errores'
import type { ReservaRepository } from '../domain/puertos'
import { Reserva } from '../domain/Reserva'

const CON_APARTAMENTO = { apartamento: { select: { nombre: true, propietarioId: true } } } satisfies Prisma.ReservaInclude
type FilaReserva = Prisma.ReservaGetPayload<{ include: typeof CON_APARTAMENTO }>

export class PrismaReservaRepository implements ReservaRepository {
  private readonly versiones = new RegistroDeVersiones<Reserva>()

  constructor(private readonly db: PrismaClient) {}

  private cargar = (fila: FilaReserva): Reserva => this.versiones.anotar(aDominio(fila), fila.version)

  async buscarPorId(id: string) {
    const fila = await this.db.reserva.findUnique({ where: { id }, include: CON_APARTAMENTO })
    return fila ? this.cargar(fila) : null
  }

  async crearSiHayDisponibilidad(reserva: Reserva) {
    const r = reserva.instantanea()

    await this.db.$transaction(async (tx) => {
      // Bloquea la fila del apartamento hasta terminar la transacción:
      // dos reservas simultáneas del mismo apartamento se procesan una después de la otra.
      await tx.$queryRaw`SELECT id FROM "Apartamento" WHERE id = ${r.apartamentoId} FOR UPDATE`

      const conflicto = await tx.reserva.findFirst({
        where: { apartamentoId: r.apartamentoId, AND: [ocupaFechas(r.creadaEn), seSolapaCon(r.rango)] },
        select: { id: true },
      })
      if (conflicto) throw new FechasNoDisponiblesError()

      await tx.reserva.create({
        data: {
          id: r.id,
          codigoReserva: r.codigo,
          apartamentoId: r.apartamentoId,
          clienteId: r.cliente.id,
          clienteNombre: r.cliente.nombre,
          clienteEmail: r.cliente.email,
          clienteTelefono: r.cliente.telefono,
          fechaInicio: r.rango.inicio,
          fechaFin: r.rango.fin,
          numAdultos: r.numAdultos,
          numNinos: r.numNinos,
          precioNoches: r.precio.precioNoches.aTextoDecimal(),
          tarifaLimpieza: r.precio.tarifaLimpieza.aTextoDecimal(),
          tarifaServicio: r.precio.tarifaServicio.aTextoDecimal(),
          impuestos: r.precio.impuestos.aTextoDecimal(),
          precioTotal: r.precio.total.aTextoDecimal(),
          politicaCancelacion: r.politicaCancelacion,
          estado: r.estado,
          notasCliente: r.notasCliente,
          createdAt: r.creadaEn,
          expiraEn: r.expiraEn,
        },
      })
    })
    this.versiones.anotar(reserva, 0)
  }

  async guardar(reserva: Reserva) {
    const version = this.versiones.versionDe(reserva)
    if (version === undefined) throw new Error('Una reserva nueva se guarda con crearSiHayDisponibilidad()')

    const r = reserva.instantanea()
    // Solo actualiza si nadie la cambió desde que se leyó; si no, no toca ninguna fila.
    const { count } = await this.db.reserva.updateMany({
      where: { id: r.id, version },
      data: {
        estado: r.estado,
        confirmadaEn: r.confirmadaEn,
        canceladaEn: r.canceladaEn,
        montoReembolso: r.montoReembolso?.aTextoDecimal() ?? null,
        version: { increment: 1 },
      },
    })
    if (count === 0) throw new ConflictoDeConcurrenciaError()
    this.versiones.anotar(reserva, version + 1)
  }

  async hayConflicto(apartamentoId: string, rango: RangoFechas, ahora: Date) {
    const conflicto = await this.db.reserva.findFirst({
      where: { apartamentoId, AND: [ocupaFechas(ahora), seSolapaCon(rango)] },
      select: { id: true },
    })
    return conflicto !== null
  }

  async listarPorCliente(clienteId: string) {
    const filas = await this.db.reserva.findMany({
      where: { clienteId },
      include: CON_APARTAMENTO,
      orderBy: { createdAt: 'desc' },
    })
    return filas.map(this.cargar)
  }

  async listarPorPropietario(propietarioId: string) {
    const filas = await this.db.reserva.findMany({
      where: { apartamento: { propietarioId } },
      include: CON_APARTAMENTO,
      orderBy: { createdAt: 'desc' },
    })
    return filas.map(this.cargar)
  }

  async listarPorPropietarioEnRango(propietarioId: string, desde: Date, hasta: Date) {
    const filas = await this.db.reserva.findMany({
      where: { apartamento: { propietarioId }, fechaInicio: { lte: hasta }, fechaFin: { gte: desde } },
      include: CON_APARTAMENTO,
      orderBy: { fechaInicio: 'asc' },
    })
    return filas.map(this.cargar)
  }

  async listarPendientesVencidas(ahora: Date) {
    const filas = await this.db.reserva.findMany({
      where: { estado: 'PENDIENTE', expiraEn: { lte: ahora } },
      include: CON_APARTAMENTO,
    })
    return filas.map(this.cargar)
  }

  async listarEstadiasPorAvanzar(ahora: Date) {
    const dia = hoy(ahora)
    const filas = await this.db.reserva.findMany({
      where: {
        OR: [
          { estado: 'CONFIRMADA', fechaInicio: { lte: dia } },
          { estado: 'EN_CURSO', fechaFin: { lte: dia } },
        ],
      },
      include: CON_APARTAMENTO,
    })
    return filas.map(this.cargar)
  }

  async fechasOcupadas(apartamentoId: string, ahora: Date) {
    const filas = await this.db.reserva.findMany({
      where: { apartamentoId, fechaFin: { gt: hoy(ahora) }, AND: [ocupaFechas(ahora)] },
      select: { fechaInicio: true, fechaFin: true },
      orderBy: { fechaInicio: 'asc' },
    })
    return filas.map((f) => RangoFechas.crear(f.fechaInicio, f.fechaFin))
  }

  async apartamentosOcupados(rango: RangoFechas, ahora: Date) {
    const filas = await this.db.reserva.findMany({
      where: { AND: [ocupaFechas(ahora), seSolapaCon(rango)] },
      select: { apartamentoId: true },
      distinct: ['apartamentoId'],
    })
    return filas.map((f) => f.apartamentoId)
  }
}

/** Traducción a SQL de Reserva.ocupaFechas(): estados activos, y las pendientes solo si no han vencido. */
function ocupaFechas(ahora: Date): Prisma.ReservaWhereInput {
  return {
    OR: [
      { estado: { in: ESTADOS_QUE_OCUPAN.filter((e) => e !== 'PENDIENTE') } },
      { estado: 'PENDIENTE', expiraEn: { gt: ahora } },
    ],
  }
}

function seSolapaCon(rango: RangoFechas): Prisma.ReservaWhereInput {
  return { fechaInicio: { lt: rango.fin }, fechaFin: { gt: rango.inicio } }
}

function aDominio(fila: FilaReserva): Reserva {
  return Reserva.reconstruir({
    id: fila.id,
    codigo: fila.codigoReserva,
    apartamentoId: fila.apartamentoId,
    apartamentoNombre: fila.apartamento.nombre,
    propietarioId: fila.apartamento.propietarioId,
    cliente: {
      id: fila.clienteId,
      nombre: fila.clienteNombre,
      email: fila.clienteEmail,
      telefono: fila.clienteTelefono,
    },
    rango: RangoFechas.crear(fila.fechaInicio, fila.fechaFin),
    numAdultos: fila.numAdultos,
    numNinos: fila.numNinos,
    precio: {
      noches: RangoFechas.crear(fila.fechaInicio, fila.fechaFin).noches,
      precioNoches: Dinero.desde(fila.precioNoches.toString()),
      tarifaLimpieza: Dinero.desde(fila.tarifaLimpieza.toString()),
      tarifaServicio: Dinero.desde(fila.tarifaServicio.toString()),
      impuestos: Dinero.desde(fila.impuestos.toString()),
      total: Dinero.desde(fila.precioTotal.toString()),
    },
    politicaCancelacion: fila.politicaCancelacion,
    estado: fila.estado,
    notasCliente: fila.notasCliente,
    creadaEn: fila.createdAt,
    expiraEn: fila.expiraEn,
    confirmadaEn: fila.confirmadaEn,
    canceladaEn: fila.canceladaEn,
    montoReembolso: fila.montoReembolso ? Dinero.desde(fila.montoReembolso.toString()) : null,
  })
}
