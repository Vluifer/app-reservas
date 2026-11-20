'use client'

import Image from 'next/image'
import { useActionState, useState, type ReactNode } from 'react'
import { DESCRIPCION_POLITICA, POLITICAS_CANCELACION } from '@/shared/domain/PoliticaCancelacion'
import type { EstadoAccion } from '@/shared/ui/acciones'
import { BotonEnviar } from '@/shared/ui/boton-enviar'
import { Alerta, AreaTexto, Campo, CLASE_CONTROL, CLASE_ETIQUETA } from '@/shared/ui/componentes'
import { formatoMoneda, MONEDA } from '@/shared/ui/formato'
import type { ApartamentoDTO } from '../../application/ApartamentoDTO'
import { IconoComodidad, normalizar } from './lista-comodidades'
import { FichaApartamento } from './tarjeta-apartamento'

type AccionFormulario = (estado: EstadoAccion, datos: FormData) => Promise<EstadoAccion>

/** Comodidades que se marcan con un toque; las demás se escriben a mano. */
const COMODIDADES_COMUNES = [
  'Wifi',
  'Cocina',
  'Aire acondicionado',
  'TV',
  'Lavadora',
  'Parqueadero',
  'Piscina',
  'Balcón',
  'Gimnasio',
  'Ascensor',
  'Se admiten mascotas',
]

const NOMBRE_POLITICA = { FLEXIBLE: 'Flexible', MODERADA: 'Moderada', ESTRICTA: 'Estricta' }

/** Grupo del formulario con título y una línea de ayuda. */
function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-borde pt-8 first:border-t-0 first:pt-0">
      <legend className="float-left w-full">
        <span className="block text-lg font-semibold text-tinta">{titulo}</span>
        {descripcion && <span className="mt-1 block text-sm text-tinta-suave">{descripcion}</span>}
      </legend>
      <div className="clear-left grid gap-4 pt-5">{children}</div>
    </fieldset>
  )
}

/** Fila "Huéspedes (−) 4 (+)": se puede usar con los botones o escribir el número. */
function Contador({
  etiqueta,
  name,
  valor,
  minimo,
  onChange,
}: {
  etiqueta: string
  name: string
  valor: number
  minimo: number
  onChange: (valor: number) => void
}) {
  const id = `contador-${name}`
  const boton =
    'inline-flex size-11 items-center justify-center rounded-full border border-borde-control text-tinta transition-colors hover:border-tinta disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-borde-control'
  return (
    <div className="flex items-center justify-between gap-4 border-b border-borde py-3 last:border-b-0">
      <label htmlFor={id} className="text-tinta">
        {etiqueta}
      </label>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`${etiqueta}: uno menos`} className={boton} disabled={valor <= minimo} onClick={() => onChange(valor - 1)}>
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 12h12" />
          </svg>
        </button>
        <input
          id={id}
          name={name}
          type="number"
          inputMode="numeric"
          min={minimo}
          required
          value={Number.isNaN(valor) ? '' : valor}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className="w-12 [appearance:textfield] rounded-control bg-transparent py-2 text-center font-semibold tabular-nums text-tinta [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button type="button" aria-label={`${etiqueta}: uno más`} className={boton} onClick={() => onChange((Number.isNaN(valor) ? minimo : valor) + 1)}>
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 12h12M12 6v12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/** Campo de dinero con "$" delante y la unidad detrás. */
function CampoDinero({
  etiqueta,
  unidad,
  className = '',
  ...props
}: React.ComponentProps<'input'> & { etiqueta: string; unidad: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={CLASE_ETIQUETA}>{etiqueta}</span>
      <span className="relative block">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-tinta-suave">
          $
        </span>
        <input type="number" inputMode="decimal" step="any" className={`${CLASE_CONTROL} pl-8 pr-32 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`} {...props} />
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-tinta-suave">{unidad}</span>
      </span>
    </label>
  )
}

/** Separa las comodidades guardadas en las que tienen ficha y las escritas a mano. */
function repartirComodidades(guardadas: string[]) {
  const comunes = new Map(COMODIDADES_COMUNES.map((c) => [normalizar(c), c]))
  const marcadas = new Set<string>()
  const otras: string[] = []
  for (const comodidad of guardadas) {
    const comun = comunes.get(normalizar(comodidad))
    if (comun) marcadas.add(comun)
    else otras.push(comodidad)
  }
  return { marcadas, otras }
}

type Vista = {
  nombre: string
  ciudad: string
  region: string
  precio: string
  capacidad: number
  habitaciones: number
  banos: number
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** "Así se verá tu anuncio": la misma ficha de los resultados de búsqueda, con los datos que se van escribiendo. */
function VistaPrevia({ vista, foto }: { vista: Vista; foto: string | null }) {
  const precio = Number(vista.precio)
  const vacio = 'text-tinta-tenue'
  return (
    <div aria-hidden className="rounded-bloque border border-borde p-5">
      <p className="text-sm font-medium text-tinta-suave">Así se verá tu anuncio</p>
      <div className="mt-4">
        <FichaApartamento
          foto={
            <div className="relative aspect-[4/3] overflow-hidden bg-hundido">
              {foto ? (
                <Image src={foto} alt="" fill sizes="20rem" className="object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-tinta-suave">
                  <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                    <path d="M3.5 8.5a2 2 0 0 1 2-2h2l1.5-2h6l1.5 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
                    <circle cx="12" cy="12.5" r="3.5" />
                  </svg>
                  Agregarás las fotos al publicar
                </div>
              )}
            </div>
          }
          nombre={vista.nombre || <span className={vacio}>Nombre del apartamento</span>}
          ubicacion={
            <span className={vista.ciudad ? undefined : vacio}>{[vista.ciudad || 'Ciudad', vista.region].filter(Boolean).join(', ')}</span>
          }
          capacidad={vista.capacidad || 0}
          habitaciones={vista.habitaciones || 0}
          banos={vista.banos || 0}
          precio={precio > 0 ? formatoMoneda(precio) : '$ —'}
        />
      </div>
    </div>
  )
}

export function FormularioApartamento({
  accion,
  valores,
  textoBoton,
}: {
  accion: AccionFormulario
  valores?: ApartamentoDTO
  textoBoton: string
}) {
  const [estado, enviar] = useActionState(accion, null)
  const [vista, setVista] = useState<Vista>({
    nombre: valores?.nombre ?? '',
    ciudad: valores?.ciudad ?? '',
    region: valores?.region ?? '',
    precio: valores ? String(valores.precioPorNoche) : '',
    capacidad: valores?.capacidad ?? 2,
    habitaciones: valores?.numHabitaciones ?? 1,
    banos: valores?.numBanos ?? 1,
  })
  const cambiar = (campo: keyof Vista) => (valor: string | number) => setVista((v) => ({ ...v, [campo]: valor }))
  const alEscribir = (campo: keyof Vista) => (e: React.ChangeEvent<HTMLInputElement>) => cambiar(campo)(e.target.value)
  const { marcadas, otras } = repartirComodidades(valores?.amenidades ?? [])

  return (
    <form action={enviar} className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
      <div className="space-y-10">
        <Seccion titulo="Lo básico" descripcion="Un nombre corto y una descripción de cómo es el lugar.">
          <Campo etiqueta="Nombre" name="nombre" value={vista.nombre} onChange={alEscribir('nombre')} required minLength={3} placeholder="Ej.: Apartamento con vista al mar" />
          <AreaTexto etiqueta="Descripción" name="descripcion" defaultValue={valores?.descripcion} rows={5} required minLength={20} />
        </Seccion>

        <Seccion titulo="Ubicación" descripcion="Se muestra en la página del apartamento.">
          <Campo etiqueta="Dirección" name="direccion" defaultValue={valores?.direccion} autoComplete="street-address" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Ciudad" name="ciudad" value={vista.ciudad} onChange={alEscribir('ciudad')} autoComplete="address-level2" required />
            <Campo etiqueta="Región / departamento" name="region" value={vista.region} onChange={alEscribir('region')} autoComplete="address-level1" required />
          </div>
          <Campo etiqueta="Código postal (opcional)" name="codigoPostal" defaultValue={valores?.codigoPostal ?? ''} autoComplete="postal-code" className="sm:max-w-[calc(50%-0.5rem)]" />
        </Seccion>

        <Seccion titulo="Espacio">
          <div>
            <Contador etiqueta="Huéspedes" name="capacidad" valor={vista.capacidad} minimo={1} onChange={cambiar('capacidad')} />
            <Contador etiqueta="Habitaciones" name="numHabitaciones" valor={vista.habitaciones} minimo={0} onChange={cambiar('habitaciones')} />
            <Contador etiqueta="Baños" name="numBanos" valor={vista.banos} minimo={0} onChange={cambiar('banos')} />
          </div>
          <Campo
            etiqueta="Metros cuadrados (opcional)"
            name="metrosCuadrados"
            type="number"
            inputMode="decimal"
            min={1}
            step="any"
            defaultValue={valores?.metrosCuadrados ?? ''}
            className="sm:max-w-[calc(50%-0.5rem)]"
          />
        </Seccion>

        <Seccion titulo="Comodidades" descripcion="Marca lo que ofrece el apartamento.">
          <div className="flex flex-wrap gap-2">
            {COMODIDADES_COMUNES.map((c) => (
              <label
                key={c}
                className="relative inline-flex min-h-11 items-center gap-2.5 rounded-full border border-borde-control px-4 text-sm text-tinta transition-colors hover:border-tinta has-checked:border-acento has-checked:bg-acento has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-acento"
              >
                <input type="checkbox" name="comodidad" value={c} defaultChecked={marcadas.has(c)} className="sr-only" />
                <IconoComodidad comodidad={c} className="size-5" />
                {c}
              </label>
            ))}
          </div>
          <Campo
            etiqueta="Otras (separadas por comas)"
            name="amenidades"
            defaultValue={otras.join(', ')}
            placeholder="Ej.: cafetera, secador de pelo"
          />
        </Seccion>

        <Seccion titulo="Precio">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoDinero
              etiqueta="Precio por noche"
              unidad={`${MONEDA} por noche`}
              name="precioPorNoche"
              min={1}
              value={vista.precio}
              onChange={alEscribir('precio')}
              required
            />
            <CampoDinero
              etiqueta="Tarifa de limpieza"
              unidad={`${MONEDA} por estadía`}
              name="tarifaLimpieza"
              min={0}
              defaultValue={valores?.tarifaLimpieza ?? 0}
            />
          </div>
        </Seccion>

        <Seccion titulo="Política de cancelación" descripcion="Se aplica a las reservas nuevas; las que ya existen conservan la suya.">
          <div className="grid gap-3 sm:grid-cols-3">
            {POLITICAS_CANCELACION.map((p) => (
              <label
                key={p}
                className="relative flex flex-col gap-1 rounded-tarjeta border border-borde-control p-4 transition-[border-color,box-shadow] hover:border-tinta has-checked:border-acento has-checked:shadow-[inset_0_0_0_1px_var(--color-acento)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-acento"
              >
                <input
                  type="radio"
                  name="politicaCancelacion"
                  value={p}
                  defaultChecked={p === (valores?.politicaCancelacion ?? 'FLEXIBLE')}
                  className="sr-only"
                />
                <span className="font-semibold text-tinta">{NOMBRE_POLITICA[p]}</span>
                <span className="text-sm text-tinta-suave">{DESCRIPCION_POLITICA[p]}</span>
              </label>
            ))}
          </div>
        </Seccion>

        <div className="space-y-4 border-t border-borde pt-6">
          {estado?.error && <Alerta tipo="error">{estado.error}</Alerta>}
          {estado?.exito && <Alerta tipo="exito">{estado.exito}</Alerta>}
          <div className="flex justify-end">
            <BotonEnviar className="w-full sm:w-auto">{textoBoton}</BotonEnviar>
          </div>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <VistaPrevia vista={vista} foto={valores?.imagenPrincipal ?? null} />
        </div>
      </aside>
    </form>
  )
}

export function FormularioImagenes({ accion }: { accion: AccionFormulario }) {
  const [estado, enviar] = useActionState(accion, null)
  const [elegidas, setElegidas] = useState(0)
  // Tras subir, el formulario se vacía: el contador también
  const [estadoVisto, setEstadoVisto] = useState(estado)
  if (estado !== estadoVisto) {
    setEstadoVisto(estado)
    if (estado?.exito) setElegidas(0)
  }

  return (
    <form action={enviar} className="space-y-3">
      <label
        htmlFor="campo-imagenes"
        className="relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-tarjeta border border-dashed border-borde-control px-6 py-8 text-center transition-colors hover:border-tinta hover:bg-hundido has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-acento"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-7 text-tinta" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15" />
        </svg>
        <span className="font-semibold text-tinta">
          {elegidas > 0 ? `${plural(elegidas, 'foto elegida', 'fotos elegidas')}` : 'Elige fotos para subir'}
        </span>
        <span id="ayuda-imagenes" className="text-sm text-tinta-suave">
          JPG, PNG o WebP. Máximo 5 MB por foto y 10 fotos en total.
        </span>
        <input
          id="campo-imagenes"
          type="file"
          name="imagenes"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          aria-describedby="ayuda-imagenes"
          onChange={(e) => setElegidas(e.target.files?.length ?? 0)}
          className="sr-only"
        />
      </label>
      {estado?.error && <Alerta tipo="error">{estado.error}</Alerta>}
      {estado?.exito && <Alerta tipo="exito">{estado.exito}</Alerta>}
      <BotonEnviar variante={elegidas > 0 ? 'primario' : 'secundario'}>Subir fotos</BotonEnviar>
    </form>
  )
}
