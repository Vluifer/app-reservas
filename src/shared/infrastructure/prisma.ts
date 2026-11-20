import { PrismaClient } from '@prisma/client'

// En desarrollo Next recarga módulos: reutilizamos una sola instancia para no agotar conexiones.
const globalConPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalConPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] })

if (process.env.NODE_ENV !== 'production') globalConPrisma.prisma = prisma
