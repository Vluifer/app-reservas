import Image from 'next/image'
import { ImagenApartamento } from './tarjeta-apartamento'
import { TodasLasFotos } from './todas-las-fotos'

/** Máximo de fotos en el mosaico; el resto se ve con "Ver las N fotos". */
const FOTOS_EN_MOSAICO = 5

/**
 * Posición de cada foto en pantallas medianas y grandes según cuántas hay:
 * 1 → a todo el ancho; 2 → dos mitades; 3 o más → la portada grande a la izquierda y el resto a la derecha.
 */
function claseCelda(i: number, total: number): string {
  if (total <= 2) return ''
  if (i === 0) return 'sm:col-span-2 sm:row-span-2'
  if (i >= FOTOS_EN_MOSAICO) return 'sm:hidden'
  if (total === 3 || (total === 4 && i === 1)) return 'sm:col-span-2'
  return ''
}

function tamanos(i: number, total: number): string {
  if (total === 1) return '(max-width: 1152px) 100vw, 1152px'
  if (i === 0 || total === 2) return '(max-width: 640px) 88vw, (max-width: 1152px) 50vw, 576px'
  return '(max-width: 640px) 88vw, (max-width: 1152px) 25vw, 288px'
}

const COLUMNAS = { 1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2' } as Record<number, string>

/**
 * Galería del detalle. En móvil es un carrusel deslizable con todas las fotos;
 * desde sm es un bloque de altura fija con solo las esquinas exteriores redondeadas.
 */
export function GaleriaFotos({ imagenes, nombre }: { imagenes: { id: string; url: string }[]; nombre: string }) {
  if (imagenes.length === 0) {
    return (
      <div className="[&>div]:aspect-auto [&>div]:h-48 [&>div]:rounded-bloque sm:[&>div]:h-64">
        <ImagenApartamento url={null} alt="" sizes="100vw" />
      </div>
    )
  }

  const total = imagenes.length
  const columnas = COLUMNAS[total] ?? 'sm:grid-cols-4 sm:grid-rows-2'

  return (
    <div className="relative">
      <ul
        aria-label="Fotos del apartamento"
        tabIndex={0}
        className={`-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 max-sm:sin-barra sm:mx-0 sm:grid sm:h-[26rem] sm:overflow-hidden sm:rounded-bloque sm:px-0 lg:h-[30rem] ${columnas}`}
      >
        {imagenes.map((imagen, i) => (
          <li
            key={imagen.id}
            className={`relative aspect-[4/3] shrink-0 snap-start overflow-hidden rounded-tarjeta bg-hundido sm:aspect-auto sm:w-auto sm:rounded-none ${
              total === 1 ? 'w-full' : 'w-[88%]'
            } ${claseCelda(i, total)}`}
          >
            <Image
              src={imagen.url}
              alt={`${nombre}, foto ${i + 1} de ${total}`}
              fill
              priority={i === 0}
              sizes={tamanos(i, total)}
              className="object-cover"
            />
          </li>
        ))}
      </ul>
      {total > 1 && <TodasLasFotos imagenes={imagenes} nombre={nombre} />}
    </div>
  )
}
