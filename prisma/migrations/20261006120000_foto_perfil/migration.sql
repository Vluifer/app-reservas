-- Foto de perfil del usuario (opcional). Las filas existentes quedan sin foto.

ALTER TABLE "Usuario" ADD COLUMN "fotoUrl" TEXT,
ADD COLUMN "fotoPublicId" TEXT;
