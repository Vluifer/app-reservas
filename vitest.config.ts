import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Carga .env (TEST_DATABASE_URL) si existe; las pruebas unitarias no lo necesitan.
try {
  process.loadEnvFile('.env')
} catch {}

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.integracion.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integracion',
          include: ['src/**/*.integracion.test.ts'],
          globalSetup: ['tests/integracion/preparar-base-de-datos.ts'],
          // Un solo proceso: los archivos comparten la base de pruebas
          pool: 'forks',
          poolOptions: { forks: { singleFork: true } },
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
})
