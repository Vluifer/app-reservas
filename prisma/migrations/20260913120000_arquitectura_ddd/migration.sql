-- Reestructuración a arquitectura por módulos (DDD).
-- Escrita a mano a partir de `prisma migrate diff`: conserva región y amenidades.
--
-- ATENCIÓN: esta migración DESCARTA datos. Se aceptó porque ninguna base de datos con datos reales
-- tenía aplicada 20251021032050_init (solo entornos de desarrollo):
--   - Usuario.emailVerified, Imagen.nombreArchivo
--   - Reserva.checkInHora, checkOutHora, notasInternas, numHuespedes
--   - Reserva.fechaInicio/fechaFin pasan de TIMESTAMP a DATE: se pierde la hora
--     (si hubiera horas distintas de 00:00 UTC, el día podría cambiar).

-- Usuario: se elimina emailVerified (no se usaba)
ALTER TABLE "Usuario" DROP COLUMN "emailVerified";

-- Apartamento: "estado" (región geográfica) pasa a llamarse "region" para no confundirse con estadoApartamento
ALTER TABLE "Apartamento" RENAME COLUMN "estado" TO "region";

-- Apartamento: amenidades pasa de JSON a arreglo de texto, conservando los valores
ALTER TABLE "Apartamento" RENAME COLUMN "amenidades" TO "amenidades_json";
ALTER TABLE "Apartamento" ADD COLUMN "amenidades" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "Apartamento"
SET "amenidades" = ARRAY(SELECT jsonb_array_elements_text("amenidades_json"::jsonb))
WHERE "amenidades_json" IS NOT NULL AND jsonb_typeof("amenidades_json"::jsonb) = 'array';
ALTER TABLE "Apartamento" DROP COLUMN "amenidades_json";

-- Apartamento: la política de cancelación la define el propietario
ALTER TABLE "Apartamento" ADD COLUMN "politicaCancelacion" "PoliticaCancelacion" NOT NULL DEFAULT 'FLEXIBLE';

-- Apartamento: borrar un usuario ya no borra sus apartamentos en cascada (se usa borrado lógico)
ALTER TABLE "Apartamento" DROP CONSTRAINT "Apartamento_propietarioId_fkey";
ALTER TABLE "Apartamento" ADD CONSTRAINT "Apartamento_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Apartamento_propietarioId_idx" ON "Apartamento"("propietarioId");

-- Imagen: nombreArchivo no se usaba
ALTER TABLE "Imagen" DROP COLUMN "nombreArchivo";

-- Reserva: fechas sin hora, reembolso, teléfono opcional y limpieza de columnas sin uso
ALTER TABLE "Reserva" DROP COLUMN "checkInHora",
DROP COLUMN "checkOutHora",
DROP COLUMN "notasInternas",
DROP COLUMN "numHuespedes",
ADD COLUMN "montoReembolso" DECIMAL(10,2),
ALTER COLUMN "fechaInicio" SET DATA TYPE DATE,
ALTER COLUMN "fechaFin" SET DATA TYPE DATE,
ALTER COLUMN "politicaCancelacion" DROP DEFAULT,
ALTER COLUMN "clienteTelefono" DROP NOT NULL;

-- Reserva: índice para la búsqueda de solapamiento de fechas
DROP INDEX "Reserva_apartamentoId_estado_idx";
DROP INDEX "Reserva_fechaInicio_fechaFin_idx";
CREATE INDEX "Reserva_apartamentoId_fechaInicio_fechaFin_idx" ON "Reserva"("apartamentoId", "fechaInicio", "fechaFin");
