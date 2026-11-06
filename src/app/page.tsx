import InicioPagina from '@/modules/apartamentos/ui/paginas/InicioPagina'
import { HORAS_PARA_CONFIRMAR } from '@/modules/reservas/ui/reglas'

/** La portada es de apartamentos, pero el plazo de respuesta es una regla de reservas: se compone aquí. */
export default function Inicio() {
  return <InicioPagina horasParaConfirmar={HORAS_PARA_CONFIRMAR} />
}
