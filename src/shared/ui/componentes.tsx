import Image from 'next/image'
import type { ComponentProps, ReactNode } from 'react'

/** Componentes visuales básicos compartidos por todos los módulos. Sin lógica de negocio. */

const VARIANTES_BOTON = {
  primario: 'bg-acento text-white hover:bg-acento-hover',
  secundario: 'border border-borde-control bg-superficie text-tinta hover:border-tinta hover:bg-hundido',
  peligro: 'bg-peligro text-white hover:bg-peligro-hover',
  /** Acción destructiva que no debe dominar la página: borde y texto rojos sobre blanco */
  peligroSuave: 'border border-peligro/40 bg-superficie text-peligro-texto hover:border-peligro hover:bg-peligro-suave',
  fantasma: 'text-tinta-suave hover:bg-hundido hover:text-tinta',
  /** Sobre fondo piedra (portadas del panel): botón principal blanco */
  claro: 'bg-white text-tinta hover:bg-white/90',
  /** Sobre fondo piedra: acción secundaria con contorno */
  contornoClaro: 'border border-white/30 text-white hover:border-white hover:bg-white/10',
}
export type VarianteBoton = keyof typeof VARIANTES_BOTON

const TAMANOS_BOTON = {
  md: 'min-h-11 px-5 text-sm', // 44px
  sm: 'min-h-9 px-3.5 text-sm', // 36px: solo en tablas densas
}
export type TamanoBoton = keyof typeof TAMANOS_BOTON

export function claseBoton(variante: VarianteBoton = 'primario', tamano: TamanoBoton = 'md'): string {
  return `inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ${TAMANOS_BOTON[tamano]} ${VARIANTES_BOTON[variante]}`
}

export function Boton({ variante, className = '', ...props }: ComponentProps<'button'> & { variante?: VarianteBoton }) {
  return <button className={`${claseBoton(variante)} ${className}`} {...props} />
}

/** Enlace de texto en línea con subrayado de acento. */
export const claseEnlace =
  'font-medium text-tinta underline decoration-tinta/25 decoration-1 underline-offset-4 transition-colors hover:decoration-tinta'

/** Enlace "← Volver" de las cabeceras de página. */
export const claseEnlaceVolver = '-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-sm text-tinta-suave hover:text-tinta'

export const CLASE_CONTROL =
  'block min-h-11 w-full rounded-control border border-borde-control bg-superficie px-3.5 py-2.5 text-base text-tinta ' +
  'placeholder:text-tinta-tenue transition-[border-color,box-shadow] hover:border-tinta-suave ' +
  'focus:border-acento focus:outline-hidden focus:ring-4 focus:ring-acento/15 ' +
  'disabled:cursor-not-allowed disabled:bg-hundido aria-invalid:border-peligro sm:text-sm'

export const CLASE_ETIQUETA = 'mb-1.5 block text-sm font-medium text-tinta'

export function Campo({ etiqueta, className = '', ...props }: ComponentProps<'input'> & { etiqueta: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={CLASE_ETIQUETA}>{etiqueta}</span>
      <input className={CLASE_CONTROL} {...props} />
    </label>
  )
}

export function AreaTexto({ etiqueta, className = '', ...props }: ComponentProps<'textarea'> & { etiqueta: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={CLASE_ETIQUETA}>{etiqueta}</span>
      <textarea className={`${CLASE_CONTROL} resize-y leading-6`} {...props} />
    </label>
  )
}

export function Selector({
  etiqueta,
  opciones,
  className = '',
  ...props
}: ComponentProps<'select'> & { etiqueta: string; opciones: { valor: string; texto: string }[] }) {
  return (
    <label className={`block ${className}`}>
      <span className={CLASE_ETIQUETA}>{etiqueta}</span>
      <select className={CLASE_CONTROL} {...props}>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  )
}

const TIPOS_ALERTA = {
  error: 'bg-peligro-suave text-peligro-texto',
  exito: 'bg-exito-suave text-exito-texto',
  info: 'bg-hundido text-tinta',
}

export function Alerta({ tipo, children }: { tipo: keyof typeof TIPOS_ALERTA; children: ReactNode }) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-control px-4 py-3 text-sm leading-6 ${TIPOS_ALERTA[tipo]}`}
    >
      <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-current" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Muestra ?error= y ?exito= que dejan las Server Actions al redirigir. */
export function MensajesDeRuta({ error, exito }: { error?: string; exito?: string }) {
  if (!error && !exito) return null
  return <div className="mb-6">{error ? <Alerta tipo="error">{error}</Alerta> : <Alerta tipo="exito">{exito}</Alerta>}</div>
}

const TONOS_TARJETA = { normal: 'border-borde', peligro: 'border-peligro/30' }

/** No sobrescribas bg-* ni border-* por className: usa `tono`. */
export function Tarjeta({
  children,
  className = '',
  tono = 'normal',
}: {
  children: ReactNode
  className?: string
  tono?: keyof typeof TONOS_TARJETA
}) {
  return <div className={`rounded-tarjeta border bg-superficie p-5 sm:p-6 ${TONOS_TARJETA[tono]} ${className}`}>{children}</div>
}

/** Rectángulo punteado para listas vacías, con acción opcional. */
export function EstadoVacio({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: ReactNode }) {
  return (
    <div className="rounded-tarjeta border border-dashed border-borde-control px-6 py-16 text-center">
      <p className="font-display text-xl text-tinta">{titulo}</p>
      {descripcion && <p className="mt-2 text-sm text-tinta-suave">{descripcion}</p>}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  )
}

/** "12 mar. → 15 mar." con texto legible para lectores de pantalla. */
export function RangoFechasTexto({ desde, hasta }: { desde: string; hasta: string }) {
  return (
    <>
      {desde} <span aria-hidden>→</span>
      <span className="sr-only"> al </span> {hasta}
    </>
  )
}

const TONOS = {
  exito: 'bg-exito-suave text-exito-texto',
  aviso: 'bg-aviso-suave text-aviso-texto',
  acento: 'bg-acento-suave text-acento-texto',
  peligro: 'bg-peligro-suave text-peligro-texto',
  neutro: 'bg-hundido text-tinta-suave',
}
const TONO_ESTADO: Record<string, keyof typeof TONOS> = {
  ACTIVO: 'exito',
  CONFIRMADA: 'exito',
  PENDIENTE: 'aviso',
  MANTENIMIENTO: 'aviso',
  EN_CURSO: 'acento',
  COMPLETADA: 'neutro',
  INACTIVO: 'neutro',
  EXPIRADA: 'neutro',
  CANCELADA: 'peligro',
  RECHAZADA: 'peligro',
}

export function EtiquetaEstado({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium first-letter:uppercase ${TONOS[TONO_ESTADO[estado] ?? 'neutro']}`}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {estado.replace('_', ' ').toLowerCase()}
    </span>
  )
}

const TAMANOS_AVATAR = { sm: 'size-9 text-xs', md: 'size-11 text-sm', lg: 'size-28 text-3xl' }
const PIXELES_AVATAR = { sm: 36, md: 44, lg: 112 }

/** Círculo con la foto de la persona o, si no tiene, sus iniciales ("Paula Gómez" → "PG"). Decorativo: el nombre va al lado. */
export function Avatar({ nombre, foto, tamano = 'md' }: { nombre: string; foto?: string | null; tamano?: keyof typeof TAMANOS_AVATAR }) {
  if (foto) {
    return (
      <Image
        src={foto}
        alt=""
        width={PIXELES_AVATAR[tamano]}
        height={PIXELES_AVATAR[tamano]}
        className={`shrink-0 rounded-full bg-hundido object-cover ${TAMANOS_AVATAR[tamano]}`}
      />
    )
  }
  const iniciales = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]!.toUpperCase())
    .join('')
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full bg-hundido font-semibold text-tinta-suave ${TAMANOS_AVATAR[tamano]}`}>
      {iniciales || '?'}
    </span>
  )
}
