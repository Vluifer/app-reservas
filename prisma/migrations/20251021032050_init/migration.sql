-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('CLIENTE', 'PROPIETARIO', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoApartamento" AS ENUM ('ACTIVO', 'INACTIVO', 'MANTENIMIENTO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'RECHAZADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "PoliticaCancelacion" AS ENUM ('FLEXIBLE', 'MODERADA', 'ESTRICTA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "RolUsuario" NOT NULL DEFAULT 'CLIENTE',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apartamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "codigoPostal" TEXT,
    "capacidad" INTEGER NOT NULL,
    "numHabitaciones" INTEGER NOT NULL,
    "numBanos" INTEGER NOT NULL,
    "metrosCuadrados" DOUBLE PRECISION,
    "precioPorNoche" DECIMAL(10,2) NOT NULL,
    "tarifaLimpieza" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amenidades" JSONB,
    "estadoApartamento" "EstadoApartamento" NOT NULL DEFAULT 'ACTIVO',
    "propietarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Apartamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Imagen" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "nombreArchivo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "apartamentoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Imagen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "codigoReserva" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "checkInHora" TEXT NOT NULL DEFAULT '15:00',
    "checkOutHora" TEXT NOT NULL DEFAULT '12:00',
    "numHuespedes" INTEGER NOT NULL,
    "numAdultos" INTEGER NOT NULL,
    "numNinos" INTEGER NOT NULL DEFAULT 0,
    "precioNoches" DECIMAL(10,2) NOT NULL,
    "tarifaLimpieza" DECIMAL(10,2) NOT NULL,
    "tarifaServicio" DECIMAL(10,2) NOT NULL,
    "impuestos" DECIMAL(10,2) NOT NULL,
    "precioTotal" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'PENDIENTE',
    "politicaCancelacion" "PoliticaCancelacion" NOT NULL DEFAULT 'FLEXIBLE',
    "clienteNombre" TEXT NOT NULL,
    "clienteEmail" TEXT NOT NULL,
    "clienteTelefono" TEXT NOT NULL,
    "notasCliente" TEXT,
    "notasInternas" TEXT,
    "apartamentoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "canceladaEn" TIMESTAMP(3),
    "confirmadaEn" TIMESTAMP(3),
    "expiraEn" TIMESTAMP(3),

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Apartamento_ciudad_estadoApartamento_idx" ON "Apartamento"("ciudad", "estadoApartamento");

-- CreateIndex
CREATE INDEX "Apartamento_precioPorNoche_idx" ON "Apartamento"("precioPorNoche");

-- CreateIndex
CREATE INDEX "Imagen_apartamentoId_orden_idx" ON "Imagen"("apartamentoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "Reserva_codigoReserva_key" ON "Reserva"("codigoReserva");

-- CreateIndex
CREATE INDEX "Reserva_apartamentoId_estado_idx" ON "Reserva"("apartamentoId", "estado");

-- CreateIndex
CREATE INDEX "Reserva_fechaInicio_fechaFin_idx" ON "Reserva"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "Reserva_clienteId_idx" ON "Reserva"("clienteId");

-- CreateIndex
CREATE INDEX "Reserva_estado_expiraEn_idx" ON "Reserva"("estado", "expiraEn");

-- AddForeignKey
ALTER TABLE "Apartamento" ADD CONSTRAINT "Apartamento_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Imagen" ADD CONSTRAINT "Imagen_apartamentoId_fkey" FOREIGN KEY ("apartamentoId") REFERENCES "Apartamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_apartamentoId_fkey" FOREIGN KEY ("apartamentoId") REFERENCES "Apartamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
