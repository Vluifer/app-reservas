import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Límites de la arquitectura (ver README, "Dependencias permitidas"):
 *   ui ──► application ──► domain ◄── infrastructure
 * Solo contenedor.ts conecta los casos de uso con la infraestructura.
 */
const librerias = (nombres) =>
  nombres.map((nombre) => ({ group: [nombre, `${nombre}/**`], message: 'El dominio y los casos de uso no dependen de librerías externas.' }))

const capa = (carpeta, mensaje) => ({ group: [`**/${carpeta}/**`, `**/${carpeta}`], message: mensaje })

const CONTENEDOR = { group: ['@/contenedor'], message: 'Solo las capas de entrada (ui, src/app) usan el contenedor.' }
const LIBRERIAS_TECNICAS = ['next', 'react', 'react-dom', 'next-auth', '@prisma/client', 'cloudinary', 'bcryptjs']

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    files: ['src/modules/*/domain/**', 'src/shared/domain/**'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            capa('application', 'El dominio no conoce los casos de uso.'),
            capa('infrastructure', 'El dominio no conoce la infraestructura: define un puerto.'),
            capa('ui', 'El dominio no conoce la interfaz.'),
            CONTENEDOR,
            ...librerias(LIBRERIAS_TECNICAS),
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/*/application/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            capa('infrastructure', 'Los casos de uso dependen de puertos, no de implementaciones.'),
            capa('ui', 'Los casos de uso no conocen la interfaz.'),
            CONTENEDOR,
            ...librerias(LIBRERIAS_TECNICAS),
          ],
        },
      ],
    },
  },
  {
    files: ['src/modules/*/infrastructure/**'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [capa('ui', 'La infraestructura no conoce la interfaz.'), CONTENEDOR] },
      ],
    },
  },
  {
    files: ['src/modules/*/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [capa('infrastructure', 'La interfaz usa los casos de uso a través de @/contenedor.')] },
      ],
    },
  },
  {
    files: ['src/shared/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/modules/**'], message: 'shared no depende de ningún módulo.' }, CONTENEDOR] },
      ],
    },
  },
])
