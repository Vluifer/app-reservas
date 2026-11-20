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

/**
 * Entre módulos. Dentro de un módulo se importa con rutas relativas, así que un import `@/modules/...`
 * siempre cruza a otro módulo. Excepciones permitidas a propósito:
 *  - infrastructure → domain/ de otro módulo: capa anticorrupción (p. ej. CatalogoApartamentosDesdeRepositorio usa ApartamentoRepository).
 *  - ui → ui/ de otro módulo (sesión, componentes) y DTO de su application/ (solo tipos de datos planos).
 */
const OTRO_MODULO = { group: ['@/modules/**'], message: 'Un módulo no usa el modelo interno de otro: define un puerto en tu dominio.' }
const OTRO_MODULO_SALVO_PUERTOS = {
  group: ['@/modules/*/application/**', '@/modules/*/infrastructure/**', '@/modules/*/ui/**'],
  message: 'Entre módulos, la infraestructura solo usa los puertos (domain/) del otro, como capa anticorrupción.',
}
const DOMINIO_DE_OTRO_MODULO = {
  group: ['@/modules/*/domain/**'],
  message: 'La interfaz no usa el dominio de otro módulo: usa sus DTO (application/) o sus componentes (ui/).',
}
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
            OTRO_MODULO,
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
            OTRO_MODULO,
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
        { patterns: [capa('ui', 'La infraestructura no conoce la interfaz.'), CONTENEDOR, OTRO_MODULO_SALVO_PUERTOS] },
      ],
    },
  },
  {
    files: ['src/modules/*/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [capa('infrastructure', 'La interfaz usa los casos de uso a través de @/contenedor.'), DOMINIO_DE_OTRO_MODULO] },
      ],
    },
  },
  {
    // src/app solo enruta: reexporta páginas de modules/*/ui, compone layouts y expone rutas de API vía el contenedor
    files: ['src/app/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            capa('infrastructure', 'src/app llega a los casos de uso a través de @/contenedor.'),
            {
              group: ['@/modules/*/domain/**', '@/modules/*/application/**'],
              message: 'src/app solo importa la ui de los módulos (páginas, componentes) o el contenedor.',
            },
          ],
        },
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
