-- Bloqueo optimista en los agregados que se modifican después de creados.
-- Cada guardado hace UPDATE ... WHERE id = ? AND version = ? e incrementa la versión:
-- si otra petición guardó antes, no se actualiza ninguna fila y el cambio se rechaza.
-- Las filas existentes empiezan en 0; no se pierden datos.

ALTER TABLE "Apartamento" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Reserva" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
