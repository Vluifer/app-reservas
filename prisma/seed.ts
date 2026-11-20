/**
 * Datos de demostración: `npm run db:seed`.
 * Usa los mismos casos de uso que la app, así que respeta todas las reglas de negocio.
 */
import { apartamentos, identidad } from '../src/contenedor'
import { EmailYaRegistradoError } from '../src/modules/identidad/domain/errores'
import { prisma } from '../src/shared/infrastructure/prisma'

const PASSWORD_DEMO = 'demo12345'

async function main() {
  let propietario
  try {
    propietario = await identidad.registrarUsuario.ejecutar({
      nombre: 'Paula Propietaria',
      email: 'propietario@demo.com',
      password: PASSWORD_DEMO,
      rol: 'PROPIETARIO',
    })
  } catch (error) {
    if (error instanceof EmailYaRegistradoError) {
      console.log('Los datos de demostración ya existen.')
      return
    }
    throw error
  }

  await identidad.registrarUsuario.ejecutar({
    nombre: 'Carlos Cliente',
    email: 'cliente@demo.com',
    password: PASSWORD_DEMO,
  })

  const demo = [
    {
      nombre: 'Loft moderno en El Poblado',
      descripcion: 'Loft luminoso con balcón, a pocas cuadras de restaurantes y del parque Lleras.',
      direccion: 'Carrera 37 # 8-40',
      ciudad: 'Medellín',
      region: 'Antioquia',
      capacidad: 2,
      numHabitaciones: 1,
      numBanos: 1,
      metrosCuadrados: 45,
      precioPorNoche: 180000,
      tarifaLimpieza: 40000,
      amenidades: ['wifi', 'aire acondicionado', 'cocina'],
    },
    {
      nombre: 'Casa colonial en el centro histórico',
      descripcion: 'Casa restaurada con patio interior y terraza con vista a las murallas.',
      direccion: 'Calle del Cuartel # 36-12',
      ciudad: 'Cartagena',
      region: 'Bolívar',
      capacidad: 6,
      numHabitaciones: 3,
      numBanos: 3,
      precioPorNoche: 650000,
      tarifaLimpieza: 90000,
      amenidades: ['wifi', 'piscina', 'terraza'],
      politicaCancelacion: 'MODERADA' as const,
    },
    {
      nombre: 'Apartamento familiar en Chapinero',
      descripcion: 'Amplio apartamento cerca de la zona G, ideal para familias o grupos de trabajo.',
      direccion: 'Calle 69 # 5-30',
      ciudad: 'Bogotá',
      region: 'Cundinamarca',
      capacidad: 4,
      numHabitaciones: 2,
      numBanos: 2,
      precioPorNoche: 280000,
      tarifaLimpieza: 50000,
      amenidades: ['wifi', 'parqueadero', 'lavadora'],
      politicaCancelacion: 'ESTRICTA' as const,
    },
  ]
  for (const datos of demo) {
    await apartamentos.publicar.ejecutar(propietario, datos)
  }

  console.log(`Datos de demostración creados. Usuarios (contraseña "${PASSWORD_DEMO}"):`)
  console.log('  propietario@demo.com  |  cliente@demo.com')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
