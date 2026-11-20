import { execSync } from 'node:child_process'

/**
 * Se ejecuta UNA vez antes de las pruebas de integración:
 * crea la base de pruebas si no existe y le aplica las migraciones pendientes.
 * Cada test deja la base limpia con limpiarBaseDeDatos() (tests/integracion/bd.ts).
 */
export default function prepararBaseDeDatos() {
  const urlPruebas = process.env.TEST_DATABASE_URL
  if (!urlPruebas) {
    throw new Error('Define TEST_DATABASE_URL en .env para correr las pruebas de integración (ver .env.example)')
  }
  if (urlPruebas === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL debe apuntar a una base distinta de DATABASE_URL: se borra en cada corrida')
  }
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: urlPruebas },
  })
}
