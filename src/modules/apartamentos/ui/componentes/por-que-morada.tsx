import type { ReactNode } from 'react'

const TRAZO = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function Ventaja({ icono, titulo, children }: { icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <li className="text-center">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-dorado-suave text-dorado">{icono}</div>
      <h3 className="mb-2 font-display text-lg text-tinta">{titulo}</h3>
      <p className="mx-auto max-w-64 text-sm text-tinta-suave">{children}</p>
    </li>
  )
}

/**
 * "Por qué Morada", al estilo de la sección de ventajas de la demo "Real Estate".
 * Solo promesas que la aplicación cumple: cada una corresponde a una regla o pantalla real.
 */
export function PorQueMorada({ horasParaConfirmar }: { horasParaConfirmar: number }) {
  return (
    <section aria-labelledby="por-que" className="py-4 sm:py-8">
      <div className="mb-10 text-center sm:mb-16">
        <p className="text-sm font-medium uppercase tracking-wider text-dorado">Por qué Morada</p>
        <h2 id="por-que" className="mb-4 mt-2 font-display text-2xl text-tinta sm:text-3xl md:text-4xl">
          Reservar sin rodeos
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-tinta-suave">
          Lo que esperas de un buen anfitrión, desde la primera búsqueda hasta que recibes la llave.
        </p>
      </div>
      <ul className="grid gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
        <Ventaja
          titulo="Trato directo"
          icono={
            <svg aria-hidden viewBox="0 0 24 24" className="size-7" {...TRAZO}>
              <circle cx="8" cy="8" r="3" />
              <circle cx="16.5" cy="9.5" r="2.5" />
              <path d="M2.5 19a5.5 5.5 0 0 1 11 0M13.5 15.2a4.5 4.5 0 0 1 7.5 3.8" />
            </svg>
          }
        >
          Reservas con el propietario del apartamento, sin agencias ni intermediarios.
        </Ventaja>
        <Ventaja
          titulo={`Respuesta en ${horasParaConfirmar} h`}
          icono={
            <svg aria-hidden viewBox="0 0 24 24" className="size-7" {...TRAZO}>
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7.5V12l3 2" />
            </svg>
          }
        >
          El propietario confirma o rechaza tu solicitud en máximo {horasParaConfirmar} horas.
        </Ventaja>
        <Ventaja
          titulo="Precio claro"
          icono={
            <svg aria-hidden viewBox="0 0 24 24" className="size-7" {...TRAZO}>
              <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2ZM9 8h6M9 11.5h6M9 15h3" />
            </svg>
          }
        >
          Ves noches, limpieza, servicio e impuestos antes de enviar la solicitud.
        </Ventaja>
        <Ventaja
          titulo="Cancelación a la vista"
          icono={
            <svg aria-hidden viewBox="0 0 24 24" className="size-7" {...TRAZO}>
              <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
        >
          Cada apartamento muestra su política, flexible, moderada o estricta, antes de reservar.
        </Ventaja>
      </ul>
    </section>
  )
}
