import Link from 'next/link'
import { apartamentos, reservas } from '@/contenedor'
import { requerirActor } from '@/modules/identidad/ui/sesion'
import { ROLES_ANFITRION } from '@/shared/domain/Actor'
import { aTextoISO, hoy } from '@/shared/domain/RangoFechas'
import { claseBoton, EstadoVacio, MensajesDeRuta } from '@/shared/ui/componentes'
import { FranjaPanel, PortadaPanel } from '@/shared/ui/portada-panel'
import { hrefCalendario, leerParametros, rangoDeCuadricula, semanasDelMes, type ParametrosRuta } from '../calendario'
import { CalendarioMes } from '../componentes/calendario-mes'
import { DetalleReservaCalendario } from '../componentes/detalle-reserva-calendario'
import { IrAlDetalle } from '../componentes/ir-al-detalle'
import { PanelDia } from '../componentes/panel-dia'

const unico = (valor: string | string[] | undefined) => (typeof valor === 'string' ? valor : undefined)

export default async function CalendarioPagina({ searchParams }: { searchParams: Promise<ParametrosRuta> }) {
  const actor = await requerirActor(ROLES_ANFITRION)
  const params = await searchParams
  const hoyTexto = aTextoISO(hoy(new Date()))
  const { mes, dia, reservaId } = leerParametros(params, hoyTexto)
  const semanas = semanasDelMes(mes)

  const [misApartamentos, lista] = await Promise.all([
    apartamentos.listarDePropietario.ejecutar(actor),
    reservas.calendario.ejecutar(actor, rangoDeCuadricula(semanas)),
  ])
  // La lista llega de la más reciente a la más antigua; el color se asigna por antigüedad
  const porAntiguedad = [...misApartamentos].reverse()
  const ids = porAntiguedad.map((a) => a.id)
  // Una reserva que ya no está en el mes (o se rechazó) vuelve a la vista del día
  const seleccionada = reservaId ? lista.find((r) => r.id === reservaId) : undefined
  const mensajes = <MensajesDeRuta error={unico(params.error)} exito={unico(params.exito)} />
  // Vuelta de Confirmar/Rechazar: el mensaje va dentro del panel, junto al botón que se pulsó
  const vueltaDeAccion = Boolean(reservaId && (unico(params.exito) || unico(params.error)))

  return (
    <div className="space-y-10">
      <PortadaPanel titulo="Calendario" descripcion="Llegadas, salidas y estadías de todos tus apartamentos." />
      <FranjaPanel>
        {!vueltaDeAccion && mensajes}
        {/* La redirección de la acción pierde #detalle, así que se baja al panel desde el cliente */}
        {vueltaDeAccion && <IrAlDetalle id="detalle" />}
        {misApartamentos.length === 0 ? (
          <EstadoVacio
            titulo="Todavía no has publicado apartamentos"
            descripcion="Cuando publiques uno, aquí verás sus reservas mes a mes."
            accion={
              <Link href="/dashboard/apartamentos/nuevo" className={claseBoton()}>
                Publicar el primero
              </Link>
            }
          />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <CalendarioMes mes={mes} semanas={semanas} dia={dia} hoy={hoyTexto} reservas={lista} apartamentosPorAntiguedad={porAntiguedad} />
            {/* La cabecera fija mide 5rem: el panel se pega debajo y el ancla #detalle no queda tapada */}
            <aside id="detalle" aria-label="Detalle del día" className="scroll-mt-28 rounded-tarjeta bg-superficie p-5 shadow-tarjeta lg:sticky lg:top-28">
              {vueltaDeAccion && mensajes}
              {seleccionada ? (
                <DetalleReservaCalendario
                  reserva={seleccionada}
                  apartamento={misApartamentos.find((a) => a.id === seleccionada.apartamentoId)}
                  dia={dia}
                  hrefDia={`${hrefCalendario({ mes, dia })}#detalle`}
                  volverA={`${hrefCalendario({ mes, dia, reserva: seleccionada.id })}#detalle`}
                />
              ) : (
                <PanelDia mes={mes} dia={dia} reservas={lista} ids={ids} />
              )}
            </aside>
          </div>
        )}
      </FranjaPanel>
    </div>
  )
}
