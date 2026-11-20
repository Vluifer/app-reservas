import { defineConfig } from 'prisma/config'

// Con este archivo Prisma ya no lee .env por su cuenta. Sin .env (CI, despliegue) se usan las variables del entorno.
try {
  process.loadEnvFile()
} catch {}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
