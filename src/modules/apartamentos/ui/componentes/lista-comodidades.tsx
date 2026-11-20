import type { ReactNode } from 'react'

/**
 * Las comodidades son texto libre que escribe el propietario ("wifi", "Aire acondicionado"...).
 * Se reconoce cada una por palabras clave para darle icono; si no coincide, lleva una marca de verificación.
 */
const ICONOS: { claves: string[]; icono: ReactNode }[] = [
  {
    claves: ['wifi', 'internet'],
    icono: (
      <>
        <path d="M2.5 9a14 14 0 0 1 19 0" />
        <path d="M5.5 12.5a9.5 9.5 0 0 1 13 0" />
        <path d="M8.75 16a5 5 0 0 1 6.5 0" />
        <circle cx="12" cy="19" r="0.75" fill="currentColor" />
      </>
    ),
  },
  {
    claves: ['tv', 'television', 'televisor'],
    icono: (
      <>
        <rect x="3" y="5" width="18" height="12" rx="1.5" />
        <path d="M8 21h8" />
      </>
    ),
  },
  {
    claves: ['cocina', 'horno', 'estufa'],
    icono: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <path d="M4 9h16" />
        <circle cx="8.5" cy="6" r="0.75" fill="currentColor" />
        <circle cx="12" cy="6" r="0.75" fill="currentColor" />
        <rect x="8" y="12.5" width="8" height="5" rx="1" />
      </>
    ),
  },
  {
    claves: ['lavadora', 'lavanderia', 'secadora'],
    icono: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <circle cx="12" cy="13" r="4.5" />
        <path d="M7.5 6.5h2" />
      </>
    ),
  },
  {
    claves: ['parking', 'parqueadero', 'estacionamiento', 'garaje'],
    icono: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
        <path d="M9.5 16.5v-9h3.25a2.75 2.75 0 0 1 0 5.5H9.5" />
      </>
    ),
  },
  {
    claves: ['piscina'],
    icono: (
      <>
        <path d="M2.5 17c1.6 0 1.6 1.2 3.2 1.2S7.3 17 8.9 17s1.6 1.2 3.2 1.2 1.6-1.2 3.2-1.2 1.6 1.2 3.2 1.2 1.6-1.2 3-1.2" />
        <path d="M8 14V5.5a2 2 0 0 1 4 0M16 14V5.5a2 2 0 0 0-4 0" />
        <path d="M8 8.5h8M8 11.5h8" />
      </>
    ),
  },
  {
    claves: ['aire', 'ventilador', 'climatizado'],
    icono: <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 6.5l2.5-2M9.5 19.5 12 17.5l2.5 2" />,
  },
  {
    claves: ['balcon', 'terraza', 'vista'],
    icono: (
      <>
        <path d="M6 12V4.5h12V12" />
        <path d="M3 12h18M5 12v8M9.5 12v8M14.5 12v8M19 12v8M3 20h18" />
      </>
    ),
  },
  {
    claves: ['gimnasio', 'gym'],
    icono: <path d="M3 12h18M5.5 8v8M8.5 6.5v11M15.5 6.5v11M18.5 8v8" />,
  },
  {
    claves: ['ascensor'],
    icono: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <path d="m9 9 3-3 3 3M9 15l3 3 3-3" />
      </>
    ),
  },
  {
    claves: ['mascota', 'perro', 'gato'],
    icono: (
      <>
        <circle cx="6" cy="10" r="1.75" />
        <circle cx="9.5" cy="6" r="1.75" />
        <circle cx="14.5" cy="6" r="1.75" />
        <circle cx="18" cy="10" r="1.75" />
        <path d="M12 12c-2.8 0-5 3.2-5 5.4 0 1.5 1.2 2.1 2.6 2.1 1 0 1.5-.5 2.4-.5s1.4.5 2.4.5c1.4 0 2.6-.6 2.6-2.1 0-2.2-2.2-5.4-5-5.4Z" />
      </>
    ),
  },
]

const VERIFICACION = <path d="m5 12.5 4.5 4.5L19 7.5" />

/** Minúsculas y sin tildes, para comparar comodidades escritas a mano. */
export const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

function iconoDe(comodidad: string): ReactNode {
  const texto = normalizar(comodidad)
  return ICONOS.find(({ claves }) => claves.some((c) => texto.includes(c)))?.icono ?? VERIFICACION
}

/** Icono de una comodidad según sus palabras clave (marca de verificación si no se reconoce). */
export function IconoComodidad({ comodidad, className = 'size-6' }: { comodidad: string; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconoDe(comodidad)}
    </svg>
  )
}

export function ListaComodidades({ comodidades }: { comodidades: string[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {comodidades.map((comodidad) => (
        <li key={comodidad} className="flex items-center gap-4 text-tinta">
          <IconoComodidad comodidad={comodidad} />
          <span className="first-letter:uppercase">{comodidad}</span>
        </li>
      ))}
    </ul>
  )
}
