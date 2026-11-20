# Calendario de reservas del propietario — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pestaña "Calendario" en el panel del propietario (`/dashboard/calendario`) con el mes completo, barras de reserva por apartamento y un panel lateral de día → detalle.

**Architecture:** Página de servidor con el estado en la URL (`?mes&dia&reserva`), sin estado en el cliente. El módulo `reservas` gana una regla de dominio (`seMuestraEnCalendario`), un método de repositorio por rango y el caso de uso `ConsultarCalendario`; la lógica de cuadrícula/barras es pura (`reservas/ui/calendario.ts`) y la página compone reservas + apartamentos como `MisReservasPagina`.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), TypeScript, Prisma 6 + PostgreSQL, Tailwind CSS v4, Vitest (proyectos `unit` e `integracion`).

**Spec:** `docs/superpowers/specs/2026-10-12-calendario-reservas-design.md`

## Global Constraints

- **No hacer commits ni preguntar por ellos:** los hace el usuario. Cada tarea termina con verificación, no con `git commit`.
- **No ejecutar `prettier`:** el proyecto no lo usa (reformatea a comillas dobles y punto y coma). Estilo: sin punto y coma, comillas simples, 2 espacios, líneas hasta ~140.
- Código, nombres y comentarios en español, como el resto del proyecto.
- Límites de módulos (ESLint `no-restricted-imports`): `domain`/`application` no importan otros módulos; `ui` no importa `domain` de otro módulo; `src/app` solo importa la `ui` de los módulos.
- Tailwind v4: los nombres de clase deben aparecer literales en el código (nada de `` `bg-apto-${n}` ``); `space-y-*` pone el margen **debajo** del elemento anterior.
- Paleta B (fondo / texto): pizarra `#D6DFEA`/`#1E3A5F`, salvia `#D9E4D2`/`#2F4A1F`, terracota `#F1D6CB`/`#7C2D12`, arena `#EDE3D1`/`#5B4321`, ciruela `#E6D8E6`/`#4A2545`, petróleo `#D3E5E3`/`#134E4A`; eliminado `#E7E5E4`/`#57534E`.
- Rango del calendario: máximo **42 días** (6 semanas), fechas como texto `AAAA-MM-DD`; el día de salida cuenta como parte de la reserva en el calendario.
- El usuario corre su propio `npm run dev` en `:3000`: no arrancar otro. Si tras editar `globals.css` los estilos nuevos no aparecen, pedirle que reinicie su servidor (Turbopack).
- Pruebas de integración: usan `TEST_DATABASE_URL`; no usar esa base como shadow de `prisma migrate diff`. Esta funcionalidad no tiene migraciones.

## Review Focus

1. **Acción enlazada sin `volverA`:** `confirmarReserva.bind(null, id)` (Reservas recibidas) hace que Next pase el `FormData` como segundo argumento → debe volver a `/dashboard/reservas`, no fallar ni redirigir a "[object FormData]". Prueba en Tarea 3.
2. **`volverA` externo o fuera del panel** (`https://…`, `//malo.com/dashboard/`, `/mis-reservas`, `/dashboard`) → vuelve a `/dashboard/reservas`. Prueba en Tarea 3.
3. **URL manipulada** (`mes=2026-13`, `dia=2026-02-30`, `dia` de otro mes, parámetros repetidos como arreglo, `reserva=` vacía) → mes/día por defecto sin error. Prueba en Tarea 2.
4. **Reserva que cruza semanas o el borde de la cuadrícula** → tramos recortados a la semana con `continuaAntes/continuaDespues` correctos. Prueba en Tarea 2.
5. **Salida y llegada el mismo día en el mismo apartamento** → dos carriles distintos (no se montan). Prueba en Tarea 2.

---

## Estructura de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/modules/reservas/domain/Reserva.ts` | Modificar | `seMuestraEnCalendario(ahora)` |
| `src/modules/reservas/domain/puertos.ts` | Modificar | `listarPorPropietarioEnRango` en `ReservaRepository` |
| `src/modules/reservas/infrastructure/memoria.ts` | Modificar | Implementación en memoria |
| `src/modules/reservas/infrastructure/PrismaReservaRepository.ts` | Modificar | Implementación Prisma |
| `src/modules/reservas/application/ConsultasReservas.ts` | Modificar | Caso de uso `ConsultarCalendario` |
| `src/contenedor.ts` | Modificar | `reservas.calendario` |
| `src/modules/reservas/reservas.test.ts` | Modificar | Pruebas de regla y caso de uso |
| `src/modules/reservas/infrastructure/PrismaReservaRepository.integracion.test.ts` | Modificar | Prueba del rango en Postgres |
| `src/modules/reservas/ui/calendario.ts` | Crear | Lógica pura: parámetros, semanas, barras, día, colores, URLs |
| `src/modules/reservas/ui/calendario.test.ts` | Crear | Pruebas de la lógica pura |
| `src/shared/ui/formato.ts` | Modificar | `formatoDiaLargo`, `formatoDiaMes`, `formatoMes` |
| `src/modules/reservas/ui/ruta-de-vuelta.ts` | Crear | Validación de `volverA` |
| `src/modules/reservas/ui/ruta-de-vuelta.test.ts` | Crear | Pruebas de `rutaDeVuelta` |
| `src/modules/reservas/ui/acciones.ts` | Modificar | `volverA` en confirmar/rechazar |
| `src/app/globals.css` | Modificar | Tokens `apto-*` y utilidad `rayado-pendiente` |
| `docs/brand-guidelines.md` | Modificar | Documentar la paleta del calendario |
| `src/modules/reservas/ui/componentes/calendario-mes.tsx` | Crear | Cuadrícula, barras y leyenda |
| `src/modules/reservas/ui/componentes/panel-dia.tsx` | Crear | Lista Llegan / Salen / Alojados |
| `src/modules/reservas/ui/componentes/detalle-reserva-calendario.tsx` | Crear | Detalle de reserva + apartamento |
| `src/modules/reservas/ui/paginas/CalendarioPagina.tsx` | Crear | Página: compone datos y piezas |
| `src/app/dashboard/calendario/page.tsx` | Crear | Ruta |
| `src/app/dashboard/layout.tsx` | Modificar | Pestaña "Calendario" |

---

### Task 1: Datos del calendario (dominio, repositorios y caso de uso)

**Files:**
- Modify: `src/modules/reservas/domain/Reserva.ts` (junto a `estadoVigente`, ~línea 166)
- Modify: `src/modules/reservas/domain/puertos.ts:20-21`
- Modify: `src/modules/reservas/infrastructure/memoria.ts` (tras `listarPorPropietario`)
- Modify: `src/modules/reservas/infrastructure/PrismaReservaRepository.ts` (tras `listarPorPropietario`, ~línea 113)
- Modify: `src/modules/reservas/application/ConsultasReservas.ts`
- Modify: `src/contenedor.ts` (import de `ConsultasReservas` ~línea 30 y objeto `reservas` ~línea 78)
- Test: `src/modules/reservas/reservas.test.ts`, `src/modules/reservas/infrastructure/PrismaReservaRepository.integracion.test.ts`

**Interfaces:**
- Produces:
  - `Reserva.seMuestraEnCalendario(ahora: Date): boolean`
  - `ReservaRepository.listarPorPropietarioEnRango(propietarioId: string, desde: Date, hasta: Date): Promise<Reserva[]>` (ordenadas por llegada)
  - `export const MAXIMO_DIAS_CALENDARIO = 42`
  - `class ConsultarCalendario { ejecutar(actor: Actor, rango: { desde: string; hasta: string }): Promise<ReservaDTO[]> }`
  - Contenedor: `reservas.calendario: ConsultarCalendario`

- [ ] **Step 1: Escribir las pruebas unitarias que fallan**

En `src/modules/reservas/reservas.test.ts`:

1. Cambiar el import de fábricas para incluir `otroPropietario`:

```ts
import { apartamentoReservable, admin, cliente, otroCliente, otroPropietario, propietario, RelojFijo } from '../../../tests/fabricas'
```

2. Añadir `ConsultarCalendario` al import de `./application/ConsultasReservas`:

```ts
import {
  ConsultarCalendario,
  ConsultarFechasOcupadas,
  ListarReservasDeCliente,
  ListarReservasDePropietario,
  ObtenerReserva,
} from './application/ConsultasReservas'
```

3. Añadir este bloque dentro de `describe('Módulo reservas', ...)`, después del bloque `describe('Gestión', ...)`:

```ts
  describe('Calendario', () => {
    it('se muestran las aceptadas y las pendientes vigentes; no las canceladas, rechazadas ni vencidas', async () => {
      const visible = async (id: string) => (await repo.buscarPorId(id))!.seMuestraEnCalendario(reloj.ahora())

      const pendiente = await crear.ejecutar(cliente, solicitud())
      const confirmada = await crear.ejecutar(cliente, solicitud({ llegada: '2030-02-01', salida: '2030-02-03' }))
      await new ConfirmarReserva(repo, reloj).ejecutar(propietario, confirmada.id)
      const rechazada = await crear.ejecutar(cliente, solicitud({ llegada: '2030-02-05', salida: '2030-02-07' }))
      await new RechazarReserva(repo, reloj).ejecutar(propietario, rechazada.id)
      const cancelada = await crear.ejecutar(cliente, solicitud({ llegada: '2030-02-10', salida: '2030-02-12' }))
      await new CancelarReserva(repo, reloj).ejecutar(cliente, cancelada.id)

      expect(await visible(pendiente.id)).toBe(true)
      expect(await visible(confirmada.id)).toBe(true)
      expect(await visible(rechazada.id)).toBe(false)
      expect(await visible(cancelada.id)).toBe(false)

      reloj.avanzarHoras(25) // la pendiente vence sin respuesta
      expect(await visible(pendiente.id)).toBe(false)

      reloj.irA('2030-02-01T15:00:00Z')
      await new AvanzarEstadias(repo, reloj).ejecutar()
      expect((await repo.buscarPorId(confirmada.id))?.estado).toBe('EN_CURSO')
      expect(await visible(confirmada.id)).toBe(true)

      reloj.irA('2030-02-03T15:00:00Z')
      await new AvanzarEstadias(repo, reloj).ejecutar()
      expect((await repo.buscarPorId(confirmada.id))?.estado).toBe('COMPLETADA')
      expect(await visible(confirmada.id)).toBe(true)
    })

    it('muestra las reservas del propietario que tocan el rango, con los bordes incluidos', async () => {
      const catalogoDos = new CatalogoApartamentosFalso([
        apartamentoReservable(),
        apartamentoReservable({ id: 'apto-2', propietarioId: otroPropietario.id }),
      ])
      const crearDos = new CrearReserva(repo, catalogoDos, reloj)
      const sale = await crearDos.ejecutar(cliente, solicitud({ llegada: '2030-01-15', salida: '2030-01-20' }))
      const llega = await crearDos.ejecutar(cliente, solicitud({ llegada: '2030-01-27', salida: '2030-01-29' }))
      await crearDos.ejecutar(cliente, solicitud({ llegada: '2030-01-12', salida: '2030-01-14' })) // termina antes del rango
      await crearDos.ejecutar(cliente, solicitud({ apartamentoId: 'apto-2', llegada: '2030-01-21', salida: '2030-01-23' })) // de otro propietario

      const calendario = new ConsultarCalendario(repo, reloj)
      const ids = (await calendario.ejecutar(propietario, { desde: '2030-01-20', hasta: '2030-01-27' })).map((r) => r.id)

      expect(ids.sort()).toEqual([sale.id, llega.id].sort())
    })

    it('no muestra las rechazadas ni las solicitudes vencidas', async () => {
      const vencera = await crear.ejecutar(cliente, solicitud())
      const rechazada = await crear.ejecutar(otroCliente, solicitud({ llegada: '2030-01-25', salida: '2030-01-27' }))
      await new RechazarReserva(repo, reloj).ejecutar(propietario, rechazada.id)
      const calendario = new ConsultarCalendario(repo, reloj)
      const rango = { desde: '2030-01-14', hasta: '2030-02-24' }

      expect((await calendario.ejecutar(propietario, rango)).map((r) => r.id)).toEqual([vencera.id])
      reloj.avanzarHoras(25)
      expect(await calendario.ejecutar(propietario, rango)).toEqual([])
    })

    it('rechaza rangos invertidos o de más de 6 semanas', async () => {
      const calendario = new ConsultarCalendario(repo, reloj)

      await expect(calendario.ejecutar(propietario, { desde: '2030-01-20', hasta: '2030-01-19' })).rejects.toThrow('6 semanas')
      await expect(calendario.ejecutar(propietario, { desde: '2030-01-01', hasta: '2030-02-12' })).rejects.toThrow('6 semanas')
      await expect(calendario.ejecutar(propietario, { desde: '2030-01-01', hasta: '2030-02-11' })).resolves.toEqual([])
    })
  })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npx vitest run --project unit src/modules/reservas/reservas.test.ts`
Expected: FAIL — `ConsultarCalendario` no está exportado y `seMuestraEnCalendario is not a function`.

- [ ] **Step 3: Regla de dominio**

En `src/modules/reservas/domain/Reserva.ts`, cambiar el import de `EstadoReserva` para incluir `esEstadiaAceptada`:

```ts
import { esEstadiaAceptada, ESTADOS_QUE_OCUPAN, puedeTransicionar, type EstadoReserva } from './EstadoReserva'
```

y añadir este método justo después de `estadoVigente(ahora)`:

```ts
  /**
   * Aparece en el calendario del propietario: estadías aceptadas (confirmada, en curso, completada)
   * y solicitudes pendientes que aún no vencen. Canceladas, rechazadas y expiradas no.
   */
  seMuestraEnCalendario(ahora: Date): boolean {
    const estado = this.estadoVigente(ahora)
    return esEstadiaAceptada(estado) || estado === 'PENDIENTE'
  }
```

- [ ] **Step 4: Puerto**

En `src/modules/reservas/domain/puertos.ts`, después de `listarPorPropietario(propietarioId: string): Promise<Reserva[]>`:

```ts
  /**
   * Reservas de los apartamentos del propietario cuya estadía toca [desde, hasta], ambos incluidos:
   * llegada <= hasta y salida >= desde (el día de salida cuenta). Ordenadas por llegada.
   */
  listarPorPropietarioEnRango(propietarioId: string, desde: Date, hasta: Date): Promise<Reserva[]>
```

- [ ] **Step 5: Implementación en memoria**

En `src/modules/reservas/infrastructure/memoria.ts`, después de `listarPorPropietario`:

```ts
  async listarPorPropietarioEnRango(propietarioId: string, desde: Date, hasta: Date) {
    return this.todas()
      .filter((r) => r.propietarioId === propietarioId && r.rango.inicio <= hasta && r.rango.fin >= desde)
      .sort((a, b) => a.rango.inicio.getTime() - b.rango.inicio.getTime())
  }
```

- [ ] **Step 6: Implementación Prisma**

En `src/modules/reservas/infrastructure/PrismaReservaRepository.ts`, después de `listarPorPropietario`:

```ts
  async listarPorPropietarioEnRango(propietarioId: string, desde: Date, hasta: Date) {
    const filas = await this.db.reserva.findMany({
      where: { apartamento: { propietarioId }, fechaInicio: { lte: hasta }, fechaFin: { gte: desde } },
      include: CON_APARTAMENTO,
      orderBy: { fechaInicio: 'asc' },
    })
    return filas.map(this.cargar)
  }
```

- [ ] **Step 7: Caso de uso**

En `src/modules/reservas/application/ConsultasReservas.ts`:

1. Cambiar los imports de la cabecera a:

```ts
import type { Actor } from '@/shared/domain/Actor'
import { relojDelSistema, type Reloj } from '@/shared/domain/comunes'
import { asegurar } from '@/shared/domain/errores'
import { aFechaSinHora, aTextoISO } from '@/shared/domain/RangoFechas'
```

2. Añadir al final del archivo:

```ts
/** La cuadrícula del calendario cubre como máximo 6 semanas (un mes con sus días vecinos). */
export const MAXIMO_DIAS_CALENDARIO = 42

const MS_POR_DIA = 24 * 60 * 60 * 1000

/** Reservas que el propietario ve en su calendario entre dos días ("AAAA-MM-DD", ambos incluidos). */
export class ConsultarCalendario {
  constructor(
    private readonly reservas: ReservaRepository,
    private readonly reloj: Reloj = relojDelSistema,
  ) {}

  async ejecutar(actor: Actor, { desde, hasta }: { desde: string; hasta: string }): Promise<ReservaDTO[]> {
    const inicio = aFechaSinHora(desde)
    const fin = aFechaSinHora(hasta)
    const dias = Math.round((fin.getTime() - inicio.getTime()) / MS_POR_DIA) + 1
    asegurar(dias >= 1 && dias <= MAXIMO_DIAS_CALENDARIO, 'El calendario muestra como máximo 6 semanas')

    const ahora = this.reloj.ahora()
    const lista = await this.reservas.listarPorPropietarioEnRango(actor.id, inicio, fin)
    return lista.filter((r) => r.seMuestraEnCalendario(ahora)).map((r) => aReservaDTO(r, ahora))
  }
}
```

(`aTextoISO` ya se importaba: lo sigue usando `ConsultarFechasOcupadas`.)

- [ ] **Step 8: Contenedor**

En `src/contenedor.ts`, añadir `ConsultarCalendario` al import de `@/modules/reservas/application/ConsultasReservas` (en orden alfabético con los demás nombres) y, en el objeto `reservas`, después de `listarDePropietario`:

```ts
  calendario: new ConsultarCalendario(reservasRepo),
```

- [ ] **Step 9: Ejecutar las pruebas unitarias**

Run: `npx vitest run --project unit src/modules/reservas/reservas.test.ts`
Expected: PASS (todas, incluidas las 4 nuevas).

- [ ] **Step 10: Prueba de integración que falla y pasa**

En `src/modules/reservas/infrastructure/PrismaReservaRepository.integracion.test.ts`, añadir dentro del `describe` principal:

```ts
  it('lista las reservas del propietario que tocan el rango, con los bordes incluidos', async () => {
    const segundo = Apartamento.publicar(propietario.id, aDatosApartamento(datosApartamento({ nombre: 'Segundo' })), AHORA)
    await apartamentosRepo.crear(segundo)
    const otroPropietario = await crearUsuario('PROPIETARIO')
    const ajeno = Apartamento.publicar(otroPropietario.id, aDatosApartamento(datosApartamento({ nombre: 'Ajeno' })), AHORA)
    await apartamentosRepo.crear(ajeno)

    const sale = await crear.ejecutar(cliente, solicitud({ llegada: '2030-01-15', salida: '2030-01-20' }))
    const llega = await crear.ejecutar(cliente, solicitud({ llegada: '2030-01-27', salida: '2030-01-29' }))
    const abarca = await crear.ejecutar(cliente, solicitud({ apartamentoId: segundo.id, llegada: '2030-01-18', salida: '2030-02-02' }))
    await crear.ejecutar(cliente, solicitud({ llegada: '2030-01-11', salida: '2030-01-14' })) // termina antes
    await crear.ejecutar(cliente, solicitud({ apartamentoId: ajeno.id, llegada: '2030-01-21', salida: '2030-01-23' }))

    const lista = await repo.listarPorPropietarioEnRango(
      propietario.id,
      new Date('2030-01-20T00:00:00.000Z'),
      new Date('2030-01-27T00:00:00.000Z'),
    )

    expect(lista.map((r) => r.id)).toEqual([sale.id, abarca.id, llega.id])
  })
```

Run: `npx vitest run --project integracion src/modules/reservas/infrastructure/PrismaReservaRepository.integracion.test.ts`
Expected: PASS (requiere `TEST_DATABASE_URL` en `.env`; si falta, avisar al usuario en vez de cambiar la configuración).

- [ ] **Step 11: Verificar el conjunto**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: sin errores; todas las pruebas unitarias pasan.

---

### Task 2: Lógica pura del calendario y formatos de fecha

**Files:**
- Create: `src/modules/reservas/ui/calendario.ts`
- Create: `src/modules/reservas/ui/calendario.test.ts`
- Modify: `src/shared/ui/formato.ts` (al final)

**Interfaces:**
- Consumes: `ReservaDTO` (`id`, `apartamentoId`, `llegada`, `salida`, `estado`, `clienteNombre`) de `../application/ReservaDTO`
- Produces (todas exportadas desde `calendario.ts`):
  - `RUTA_CALENDARIO = '/dashboard/calendario'`
  - `interface DiaCalendario { fecha: string; numero: number; delMes: boolean }`, `type SemanaCalendario = DiaCalendario[]`
  - `interface TramoBarra { reserva: ReservaDTO; inicioCol: number; finCol: number; carril: number; continuaAntes: boolean; continuaDespues: boolean }`
  - `type ParametrosRuta = Record<string, string | string[] | undefined>`
  - `leerParametros(params: ParametrosRuta, hoy: string): { mes: string; dia: string; reservaId: string | null }`
  - `mesVecino(mes: string, delta: number): string`
  - `semanasDelMes(mes: string): SemanaCalendario[]`
  - `rangoDeCuadricula(semanas: SemanaCalendario[]): { desde: string; hasta: string }`
  - `barrasDeSemana(reservas: ReservaDTO[], semana: SemanaCalendario): TramoBarra[]`
  - `agruparDia(reservas: ReservaDTO[], dia: string): { llegan: ReservaDTO[]; salen: ReservaDTO[]; alojados: ReservaDTO[] }`
  - `type ColorApartamento = 1 | 2 | 3 | 4 | 5 | 6 | 'eliminado'`
  - `colorDeApartamento(apartamentoId: string, idsPorAntiguedad: string[]): ColorApartamento`
  - `CLASES_COLOR: Record<ColorApartamento, string>`
  - `hrefCalendario(estado: { mes: string; dia?: string; reserva?: string }): string`
  - En `formato.ts`: `formatoDiaLargo(fecha)` → "martes, 13 de octubre", `formatoDiaMes(fecha)` → "13 de octubre", `formatoMes(mes)` → "octubre de 2026"

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `src/modules/reservas/ui/calendario.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { ReservaDTO } from '../application/ReservaDTO'
import {
  agruparDia,
  barrasDeSemana,
  colorDeApartamento,
  hrefCalendario,
  leerParametros,
  mesVecino,
  rangoDeCuadricula,
  semanasDelMes,
} from './calendario'

/** Solo los campos que usa la lógica del calendario. */
const reserva = (id: string, llegada: string, salida: string, cambios: Partial<ReservaDTO> = {}): ReservaDTO =>
  ({ id, apartamentoId: 'apto-1', llegada, salida, estado: 'CONFIRMADA', clienteNombre: id, ...cambios }) as ReservaDTO

/** Lunes 14 a domingo 20 de enero de 2030. */
const semana = semanasDelMes('2030-01').find((s) => s[0].fecha === '2030-01-14')!

describe('Calendario: lógica pura', () => {
  describe('leerParametros', () => {
    const HOY = '2026-10-13'

    it('sin parámetros muestra el mes y el día de hoy', () => {
      expect(leerParametros({}, HOY)).toEqual({ mes: '2026-10', dia: '2026-10-13', reservaId: null })
    })

    it('en otro mes, el día por defecto es el primero', () => {
      expect(leerParametros({ mes: '2026-12' }, HOY)).toEqual({ mes: '2026-12', dia: '2026-12-01', reservaId: null })
    })

    it('corrige en silencio un mes o un día inválidos', () => {
      expect(leerParametros({ mes: '2026-13', dia: 'hola' }, HOY)).toMatchObject({ mes: '2026-10', dia: '2026-10-13' })
      expect(leerParametros({ mes: '2026-02', dia: '2026-02-30' }, HOY)).toMatchObject({ mes: '2026-02', dia: '2026-02-01' })
    })

    it('ignora un día que no es del mes visible', () => {
      expect(leerParametros({ mes: '2026-10', dia: '2026-11-02' }, HOY)).toMatchObject({ dia: '2026-10-13' })
    })

    it('ignora parámetros repetidos y una reserva vacía', () => {
      expect(leerParametros({ mes: ['2026-11', '2026-12'], reserva: 'abc' }, HOY)).toEqual({ mes: '2026-10', dia: '2026-10-13', reservaId: 'abc' })
      expect(leerParametros({ reserva: '' }, HOY).reservaId).toBeNull()
    })
  })

  it('mesVecino cruza los cambios de año', () => {
    expect(mesVecino('2026-12', 1)).toBe('2027-01')
    expect(mesVecino('2026-01', -1)).toBe('2025-12')
  })

  describe('semanasDelMes', () => {
    it('un mes que empieza en domingo arranca la cuadrícula el lunes anterior', () => {
      const semanas = semanasDelMes('2026-02')
      expect(semanas).toHaveLength(5)
      expect(semanas[0][0]).toEqual({ fecha: '2026-01-26', numero: 26, delMes: false })
      expect(semanas[0][6]).toEqual({ fecha: '2026-02-01', numero: 1, delMes: true })
      expect(semanas[4][6]).toEqual({ fecha: '2026-03-01', numero: 1, delMes: false })
    })

    it('incluye el 29 de febrero de un año bisiesto', () => {
      const dias = semanasDelMes('2028-02').flat()
      expect(dias.find((d) => d.fecha === '2028-02-29')).toEqual({ fecha: '2028-02-29', numero: 29, delMes: true })
    })

    it('un mes puede ocupar 6 semanas, y la cuadrícula cubre exactamente 42 días', () => {
      const semanas = semanasDelMes('2026-03')
      expect(semanas).toHaveLength(6)
      expect(rangoDeCuadricula(semanas)).toEqual({ desde: '2026-02-23', hasta: '2026-04-05' })
    })
  })

  describe('barrasDeSemana', () => {
    it('recorta a la semana las reservas que empiezan antes o terminan después', () => {
      const [antes, despues] = barrasDeSemana([reserva('a', '2030-01-10', '2030-01-16'), reserva('b', '2030-01-19', '2030-01-22')], semana)
      expect(antes).toMatchObject({ inicioCol: 1, finCol: 3, continuaAntes: true, continuaDespues: false })
      expect(despues).toMatchObject({ inicioCol: 6, finCol: 7, continuaAntes: false, continuaDespues: true })
    })

    it('deja fuera las reservas que no tocan la semana', () => {
      expect(barrasDeSemana([reserva('a', '2030-01-21', '2030-01-23'), reserva('b', '2030-01-08', '2030-01-13')], semana)).toEqual([])
    })

    it('reparte en carriles las reservas que se cruzan y reutiliza un carril libre', () => {
      const tramos = barrasDeSemana(
        [reserva('a', '2030-01-14', '2030-01-17'), reserva('b', '2030-01-16', '2030-01-18'), reserva('c', '2030-01-18', '2030-01-20')],
        semana,
      )
      expect(tramos.map((t) => [t.reserva.id, t.carril])).toEqual([
        ['a', 0],
        ['b', 1],
        ['c', 0],
      ])
    })

    it('si un huésped sale y otro llega el mismo día, no se montan', () => {
      const tramos = barrasDeSemana([reserva('sale', '2030-01-14', '2030-01-16'), reserva('llega', '2030-01-16', '2030-01-18')], semana)
      expect(tramos.map((t) => t.carril)).toEqual([0, 1])
    })
  })

  it('agruparDia separa llegadas, salidas y alojados', () => {
    const sale = reserva('sale', '2030-01-10', '2030-01-13')
    const llega = reserva('llega', '2030-01-13', '2030-01-15')
    const alojado = reserva('alojado', '2030-01-11', '2030-01-16')
    expect(agruparDia([sale, llega, alojado, reserva('otra', '2030-01-20', '2030-01-22')], '2030-01-13')).toEqual({
      llegan: [llega],
      salen: [sale],
      alojados: [alojado],
    })
  })

  it('colorDeApartamento asigna por antigüedad, repite después de 6 y marca los eliminados', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    expect(colorDeApartamento('a', ids)).toBe(1)
    expect(colorDeApartamento('f', ids)).toBe(6)
    expect(colorDeApartamento('g', ids)).toBe(1)
    expect(colorDeApartamento('x', ids)).toBe('eliminado')
  })

  it('hrefCalendario arma la URL solo con los parámetros dados', () => {
    expect(hrefCalendario({ mes: '2026-10' })).toBe('/dashboard/calendario?mes=2026-10')
    expect(hrefCalendario({ mes: '2026-10', dia: '2026-10-13', reserva: 'r1' })).toBe('/dashboard/calendario?mes=2026-10&dia=2026-10-13&reserva=r1')
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npx vitest run --project unit src/modules/reservas/ui/calendario.test.ts`
Expected: FAIL — no existe el módulo `./calendario`.

- [ ] **Step 3: Implementar `calendario.ts`**

Crear `src/modules/reservas/ui/calendario.ts`:

```ts
import { aFechaSinHora, aTextoISO } from '@/shared/domain/RangoFechas'
import type { ReservaDTO } from '../application/ReservaDTO'

/** Lógica pura del calendario del propietario. Fechas como texto "AAAA-MM-DD"; sin E/S ni estado. */

export const RUTA_CALENDARIO = '/dashboard/calendario'

export interface DiaCalendario {
  fecha: string
  numero: number
  /** Falso en los días de los meses vecinos que completan la primera y la última semana */
  delMes: boolean
}
export type SemanaCalendario = DiaCalendario[]

export interface TramoBarra {
  reserva: ReservaDTO
  /** Columnas de inicio y de fin dentro de la semana (1 = lunes, 7 = domingo), ambas incluidas */
  inicioCol: number
  finCol: number
  /** Fila dentro de la semana (0 = la primera). Dos tramos que se cruzan nunca comparten carril */
  carril: number
  continuaAntes: boolean
  continuaDespues: boolean
}

export type ParametrosRuta = Record<string, string | string[] | undefined>

const MS_POR_DIA = 24 * 60 * 60 * 1000
const PATRON_MES = /^\d{4}-(0[1-9]|1[0-2])$/

function sumarDias(fecha: string, dias: number): string {
  return aTextoISO(new Date(aFechaSinHora(fecha).getTime() + dias * MS_POR_DIA))
}

function esFecha(texto: string): boolean {
  try {
    aFechaSinHora(texto)
    return true
  } catch {
    return false
  }
}

/** Un parámetro de la URL solo vale si llegó una vez (Next entrega un arreglo si se repite). */
const unico = (valor: string | string[] | undefined) => (typeof valor === 'string' ? valor : undefined)

/** Lee mes, día y reserva de la URL; lo inválido se reemplaza en silencio por valores por defecto. */
export function leerParametros(params: ParametrosRuta, hoy: string): { mes: string; dia: string; reservaId: string | null } {
  const mesPedido = unico(params.mes)
  const mes = mesPedido && PATRON_MES.test(mesPedido) ? mesPedido : hoy.slice(0, 7)
  const diaPedido = unico(params.dia)
  const diaPorDefecto = hoy.slice(0, 7) === mes ? hoy : `${mes}-01`
  const dia = diaPedido && esFecha(diaPedido) && diaPedido.slice(0, 7) === mes ? diaPedido : diaPorDefecto
  return { mes, dia, reservaId: unico(params.reserva) || null }
}

export function mesVecino(mes: string, delta: number): string {
  const [anio, numero] = mes.split('-').map(Number)
  return aTextoISO(new Date(Date.UTC(anio, numero - 1 + delta, 1))).slice(0, 7)
}

/** Semanas de lunes a domingo que cubren el mes completo. */
export function semanasDelMes(mes: string): SemanaCalendario[] {
  const [anio, numero] = mes.split('-').map(Number)
  const primero = `${mes}-01`
  const ultimo = aTextoISO(new Date(Date.UTC(anio, numero, 0)))
  const diasDesdeLunes = (aFechaSinHora(primero).getUTCDay() + 6) % 7

  const semanas: SemanaCalendario[] = []
  for (let lunes = sumarDias(primero, -diasDesdeLunes); lunes <= ultimo; lunes = sumarDias(lunes, 7)) {
    semanas.push(
      Array.from({ length: 7 }, (_, i) => {
        const fecha = sumarDias(lunes, i)
        return { fecha, numero: Number(fecha.slice(8)), delMes: fecha.slice(0, 7) === mes }
      }),
    )
  }
  return semanas
}

/** Primer y último día que pinta la cuadrícula: el rango que se pide al caso de uso. */
export function rangoDeCuadricula(semanas: SemanaCalendario[]): { desde: string; hasta: string } {
  return { desde: semanas[0][0].fecha, hasta: semanas[semanas.length - 1][6].fecha }
}

/**
 * Tramos de barra de una semana. Una reserva ocupa desde su llegada hasta su salida, ambas incluidas,
 * así que quien sale y quien llega el mismo día quedan en carriles distintos.
 */
export function barrasDeSemana(reservas: ReservaDTO[], semana: SemanaCalendario): TramoBarra[] {
  const primero = semana[0].fecha
  const ultimo = semana[6].fecha
  const columna = (fecha: string) => semana.findIndex((d) => d.fecha === fecha) + 1

  const tramos: TramoBarra[] = reservas
    .filter((r) => r.llegada <= ultimo && r.salida >= primero)
    .sort((a, b) => a.llegada.localeCompare(b.llegada) || b.salida.localeCompare(a.salida))
    .map((r) => ({
      reserva: r,
      inicioCol: columna(r.llegada < primero ? primero : r.llegada),
      finCol: columna(r.salida > ultimo ? ultimo : r.salida),
      carril: 0,
      continuaAntes: r.llegada < primero,
      continuaDespues: r.salida > ultimo,
    }))

  // Voraz: cada tramo va al primer carril cuya última columna ocupada quede antes de su inicio
  const finDeCarril: number[] = []
  for (const tramo of tramos) {
    let carril = finDeCarril.findIndex((fin) => fin < tramo.inicioCol)
    if (carril === -1) carril = finDeCarril.length
    finDeCarril[carril] = tramo.finCol
    tramo.carril = carril
  }
  return tramos
}

export function agruparDia(reservas: ReservaDTO[], dia: string) {
  return {
    llegan: reservas.filter((r) => r.llegada === dia),
    salen: reservas.filter((r) => r.salida === dia),
    alojados: reservas.filter((r) => r.llegada < dia && r.salida > dia),
  }
}

export type ColorApartamento = 1 | 2 | 3 | 4 | 5 | 6 | 'eliminado'

const COLORES: readonly ColorApartamento[] = [1, 2, 3, 4, 5, 6]

/** Color por antigüedad: el apartamento más antiguo toma el 1. Uno que ya no está en la lista (eliminado) va en gris. */
export function colorDeApartamento(apartamentoId: string, idsPorAntiguedad: string[]): ColorApartamento {
  const posicion = idsPorAntiguedad.indexOf(apartamentoId)
  return posicion === -1 ? 'eliminado' : COLORES[posicion % COLORES.length]
}

/** Clases literales para que Tailwind las genere (tokens `apto-*` en globals.css). */
export const CLASES_COLOR: Record<ColorApartamento, string> = {
  1: 'bg-apto-1 text-apto-1-texto',
  2: 'bg-apto-2 text-apto-2-texto',
  3: 'bg-apto-3 text-apto-3-texto',
  4: 'bg-apto-4 text-apto-4-texto',
  5: 'bg-apto-5 text-apto-5-texto',
  6: 'bg-apto-6 text-apto-6-texto',
  eliminado: 'bg-apto-eliminado text-apto-eliminado-texto',
}

export function hrefCalendario({ mes, dia, reserva }: { mes: string; dia?: string; reserva?: string }): string {
  const parametros = new URLSearchParams({ mes })
  if (dia) parametros.set('dia', dia)
  if (reserva) parametros.set('reserva', reserva)
  return `${RUTA_CALENDARIO}?${parametros}`
}
```

- [ ] **Step 4: Formatos de fecha**

Al final de `src/shared/ui/formato.ts`:

```ts
const formatoDiaLargoLocal = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const formatoDiaMesLocal = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' })
const formatoMesLocal = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "martes, 13 de octubre". Recibe "YYYY-MM-DD". */
export function formatoDiaLargo(fecha: string): string {
  return formatoDiaLargoLocal.format(aFecha(fecha))
}

/** "13 de octubre". Recibe "YYYY-MM-DD". */
export function formatoDiaMes(fecha: string): string {
  return formatoDiaMesLocal.format(aFecha(fecha))
}

/** "octubre de 2026". Recibe "YYYY-MM". */
export function formatoMes(mes: string): string {
  return formatoMesLocal.format(aFecha(`${mes}-01`))
}
```

- [ ] **Step 5: Ejecutar las pruebas**

Run: `npx vitest run --project unit src/modules/reservas/ui/calendario.test.ts`
Expected: PASS.

- [ ] **Step 6: Verificar el conjunto**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: sin errores.

---

### Task 3: Confirmar y rechazar vuelven al calendario

**Files:**
- Create: `src/modules/reservas/ui/ruta-de-vuelta.ts`
- Create: `src/modules/reservas/ui/ruta-de-vuelta.test.ts`
- Modify: `src/modules/reservas/ui/acciones.ts:36-44`

**Interfaces:**
- Produces:
  - `rutaDeVuelta(volverA: unknown, porDefecto: string): string`
  - `confirmarReserva(reservaId: string, volverA?: unknown)` y `rechazarReserva(reservaId: string, volverA?: unknown)` (Server Actions)

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `src/modules/reservas/ui/ruta-de-vuelta.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { rutaDeVuelta } from './ruta-de-vuelta'

const POR_DEFECTO = '/dashboard/reservas'

describe('rutaDeVuelta', () => {
  it('acepta rutas internas del panel, con su consulta', () => {
    expect(rutaDeVuelta('/dashboard/calendario?mes=2026-10&dia=2026-10-13&reserva=r1', POR_DEFECTO)).toBe(
      '/dashboard/calendario?mes=2026-10&dia=2026-10-13&reserva=r1',
    )
  })

  it('sin volverA (o con el FormData que Next añade al final) usa la ruta por defecto', () => {
    expect(rutaDeVuelta(undefined, POR_DEFECTO)).toBe(POR_DEFECTO)
    expect(rutaDeVuelta(new FormData(), POR_DEFECTO)).toBe(POR_DEFECTO)
  })

  it('rechaza destinos externos o fuera del panel', () => {
    for (const destino of ['https://malo.com/dashboard/', '//malo.com/dashboard/', '/mis-reservas', '/dashboard', '']) {
      expect(rutaDeVuelta(destino, POR_DEFECTO)).toBe(POR_DEFECTO)
    }
  })
})
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npx vitest run --project unit src/modules/reservas/ui/ruta-de-vuelta.test.ts`
Expected: FAIL — no existe `./ruta-de-vuelta`.

- [ ] **Step 3: Implementar**

Crear `src/modules/reservas/ui/ruta-de-vuelta.ts`:

```ts
/**
 * A dónde vuelve una acción del panel. Solo acepta rutas internas del panel ("/dashboard/..."); cualquier otra
 * cosa usa `porDefecto`. Incluye el FormData que Next pasa como último argumento cuando la acción se enlaza
 * solo con el id (`confirmarReserva.bind(null, id)`), por eso el parámetro es `unknown`.
 */
export function rutaDeVuelta(volverA: unknown, porDefecto: string): string {
  return typeof volverA === 'string' && volverA.startsWith('/dashboard/') ? volverA : porDefecto
}
```

En `src/modules/reservas/ui/acciones.ts`, añadir el import junto a los demás:

```ts
import { rutaDeVuelta } from './ruta-de-vuelta'
```

y reemplazar `confirmarReserva` y `rechazarReserva` por:

```ts
/** `volverA`: ruta del panel a la que volver (p. ej. el calendario en el mismo día); por defecto, Reservas recibidas. */
export async function confirmarReserva(reservaId: string, volverA?: unknown) {
  const actor = await requerirActor(ROLES_ANFITRION)
  await ejecutarYVolver(rutaDeVuelta(volverA, RUTA_RECIBIDAS), 'Reserva confirmada', () => reservas.confirmar.ejecutar(actor, reservaId))
}

export async function rechazarReserva(reservaId: string, volverA?: unknown) {
  const actor = await requerirActor(ROLES_ANFITRION)
  await ejecutarYVolver(rutaDeVuelta(volverA, RUTA_RECIBIDAS), 'Reserva rechazada', () => reservas.rechazar.ejecutar(actor, reservaId))
}
```

`ReservasRecibidasPagina` sigue usando `confirmarReserva.bind(null, r.id)` sin cambios.

- [ ] **Step 4: Ejecutar las pruebas y verificar**

Run: `npx vitest run --project unit src/modules/reservas/ui/ruta-de-vuelta.test.ts && npx tsc --noEmit && npm run lint && npm test`
Expected: PASS y sin errores.

---

### Task 4: Pantalla del calendario

**Files:**
- Modify: `src/app/globals.css` (bloque `@theme`, tras `--color-panel`; y nueva `@utility` tras `sin-barra`)
- Modify: `docs/brand-guidelines.md` (sección 2, tras la tabla de color)
- Create: `src/modules/reservas/ui/componentes/calendario-mes.tsx`
- Create: `src/modules/reservas/ui/componentes/panel-dia.tsx`
- Create: `src/modules/reservas/ui/componentes/detalle-reserva-calendario.tsx`
- Create: `src/modules/reservas/ui/paginas/CalendarioPagina.tsx`
- Create: `src/app/dashboard/calendario/page.tsx`
- Modify: `src/app/dashboard/layout.tsx` (lista de pestañas)

**Interfaces:**
- Consumes: todo lo de `calendario.ts` (Tarea 2), `reservas.calendario` (Tarea 1), `confirmarReserva`/`rechazarReserva` con `volverA` (Tarea 3), `formatoDiaLargo`/`formatoDiaMes`/`formatoMes` (Tarea 2), `apartamentos.listarDePropietario.ejecutar(actor): Promise<ApartamentoDTO[]>` (existente, ordenada de la más reciente a la más antigua por `createdAt desc` en Prisma), `PortadaPanel`/`FranjaPanel` (`@/shared/ui/portada-panel`), `claseBoton`, `claseEnlace`, `claseEnlaceVolver`, `EstadoVacio`, `EtiquetaEstado`, `MensajesDeRuta`, `RangoFechasTexto` (`@/shared/ui/componentes`), `BotonEnviar`, `BotonEnviarConfirmando` (`@/shared/ui/boton-enviar`).
- Produces: ruta `/dashboard/calendario` y la pestaña "Calendario".

- [ ] **Step 1: Tokens de color y utilidad de pendientes**

En `src/app/globals.css`, dentro de `@theme`, después de `--color-panel: #3b3531;`:

```css

  /* Calendario: un color por apartamento (paleta B, tonos tierra). Texto sobre fondo ≥ 6:1 */
  --color-apto-1: #d6dfea; /* pizarra */
  --color-apto-1-texto: #1e3a5f; /* 8.55:1 */
  --color-apto-2: #d9e4d2; /* salvia */
  --color-apto-2-texto: #2f4a1f; /* 7.54:1 */
  --color-apto-3: #f1d6cb; /* terracota */
  --color-apto-3-texto: #7c2d12; /* 6.79:1 */
  --color-apto-4: #ede3d1; /* arena */
  --color-apto-4-texto: #5b4321; /* 7.27:1 */
  --color-apto-5: #e6d8e6; /* ciruela */
  --color-apto-5-texto: #4a2545; /* 9.34:1 */
  --color-apto-6: #d3e5e3; /* petróleo */
  --color-apto-6-texto: #134e4a; /* 7.26:1 */
  --color-apto-eliminado: #e7e5e4;
  --color-apto-eliminado-texto: #57534e; /* 6.08:1 */
```

Después del bloque `@utility sin-barra { ... }`:

```css

/* Solicitud pendiente en el calendario: rayado diagonal y borde punteado del color del texto */
@utility rayado-pendiente {
  background-image: repeating-linear-gradient(135deg, rgb(255 255 255 / 0.6) 0 5px, transparent 5px 10px);
  outline: 1.5px dashed currentColor;
  outline-offset: -1.5px;
}
```

- [ ] **Step 2: Guía de marca**

En `docs/brand-guidelines.md`, al final de la sección "## 2. Color" (antes de "## 3. Tipografía"):

```markdown
### Calendario del propietario

Un color por apartamento (tokens `apto-1` … `apto-6`, con su `-texto`), asignado por antigüedad y repetido
después del sexto. Las solicitudes pendientes llevan la utilidad `rayado-pendiente`.

| Token | Fondo | Texto | Contraste |
|---|---|---|---|
| `apto-1` pizarra | `#D6DFEA` | `#1E3A5F` | 8.55:1 |
| `apto-2` salvia | `#D9E4D2` | `#2F4A1F` | 7.54:1 |
| `apto-3` terracota | `#F1D6CB` | `#7C2D12` | 6.79:1 |
| `apto-4` arena | `#EDE3D1` | `#5B4321` | 7.27:1 |
| `apto-5` ciruela | `#E6D8E6` | `#4A2545` | 9.34:1 |
| `apto-6` petróleo | `#D3E5E3` | `#134E4A` | 7.26:1 |
| `apto-eliminado` | `#E7E5E4` | `#57534E` | 6.08:1 |
```

- [ ] **Step 3: Cuadrícula del mes**

Crear `src/modules/reservas/ui/componentes/calendario-mes.tsx`:

```tsx
import Link from 'next/link'
import type { ApartamentoDTO } from '@/modules/apartamentos/application/ApartamentoDTO'
import { formatoDia, formatoDiaLargo, formatoMes } from '@/shared/ui/formato'
import type { ReservaDTO } from '../../application/ReservaDTO'
import {
  barrasDeSemana,
  CLASES_COLOR,
  colorDeApartamento,
  hrefCalendario,
  mesVecino,
  RUTA_CALENDARIO,
  type SemanaCalendario,
} from '../calendario'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const BOTON_MES =
  'inline-flex min-h-10 min-w-10 items-center justify-center rounded-control border border-borde-control/60 px-3 text-sm text-tinta transition-colors hover:border-tinta'

type Props = {
  mes: string
  semanas: SemanaCalendario[]
  dia: string
  hoy: string
  reservas: ReservaDTO[]
  /** Del más antiguo al más reciente: define el color de cada uno */
  apartamentosPorAntiguedad: ApartamentoDTO[]
}

/** Mes completo: semanas de lunes a domingo, con una barra por reserva y la leyenda de colores. */
export function CalendarioMes({ mes, semanas, dia, hoy, reservas, apartamentosPorAntiguedad }: Props) {
  const ids = apartamentosPorAntiguedad.map((a) => a.id)
  return (
    <section aria-labelledby="titulo-mes" className="rounded-tarjeta bg-superficie p-4 shadow-tarjeta sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-mes" className="font-display text-xl text-tinta sm:text-2xl">
          {formatoMes(mes)}
        </h2>
        <nav aria-label="Cambiar de mes" className="flex gap-1.5">
          <Link href={hrefCalendario({ mes: mesVecino(mes, -1) })} aria-label="Mes anterior" className={BOTON_MES}>
            ←
          </Link>
          <Link href={RUTA_CALENDARIO} className={BOTON_MES}>
            Hoy
          </Link>
          <Link href={hrefCalendario({ mes: mesVecino(mes, 1) })} aria-label="Mes siguiente" className={BOTON_MES}>
            →
          </Link>
        </nav>
      </div>

      <div aria-hidden className="grid grid-cols-7 pb-2 text-center text-[0.6875rem] font-semibold uppercase tracking-wider text-tinta-suave">
        {DIAS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="divide-y divide-borde border-y border-borde">
        {semanas.map((semana) => (
          <FilaSemana key={semana[0].fecha} semana={semana} mes={mes} dia={dia} hoy={hoy} reservas={reservas} ids={ids} />
        ))}
      </div>

      <ul aria-label="Apartamentos" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-tinta-suave">
        {apartamentosPorAntiguedad.map((a) => (
          <li key={a.id} className="inline-flex items-center gap-2">
            <span aria-hidden className={`size-3 rounded-sm ${CLASES_COLOR[colorDeApartamento(a.id, ids)]}`} />
            {a.nombre}
          </li>
        ))}
      </ul>
    </section>
  )
}

function FilaSemana({ semana, mes, dia, hoy, reservas, ids }: { semana: SemanaCalendario; mes: string; dia: string; hoy: string; reservas: ReservaDTO[]; ids: string[] }) {
  const tramos = barrasDeSemana(reservas, semana)
  const carriles = Math.max(1, ...tramos.map((t) => t.carril + 1))

  return (
    // Fila 1: números de día; una fila de 1.5rem por carril; un respiro al final. Los días ocupan todas las filas
    <div className="grid grid-cols-7" style={{ gridTemplateRows: `2rem repeat(${carriles}, 1.5rem) 0.5rem` }}>
      {semana.map((d, i) => {
        const numero = (
          <span
            className={`inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums ${d.fecha === hoy ? 'bg-acento font-semibold text-white' : ''}`}
          >
            {d.numero}
          </span>
        )
        const posicion = { gridColumn: i + 1, gridRow: '1 / -1' }
        if (!d.delMes) {
          return (
            <div key={d.fecha} aria-hidden style={posicion} className="border-l border-borde/70 bg-hundido/60 p-1 text-tinta-tenue first:border-l-0">
              {numero}
            </div>
          )
        }
        const elegido = d.fecha === dia
        return (
          <Link
            key={d.fecha}
            href={`${hrefCalendario({ mes, dia: d.fecha })}#detalle`}
            aria-label={formatoDiaLargo(d.fecha)}
            aria-current={elegido ? 'date' : undefined}
            style={posicion}
            className={`border-l border-borde/70 p-1 text-tinta transition-colors first:border-l-0 ${elegido ? 'bg-dorado-suave' : 'hover:bg-hundido'}`}
          >
            {numero}
          </Link>
        )
      })}

      {tramos.map((t) => {
        const r = t.reserva
        const pendiente = r.estado === 'PENDIENTE'
        return (
          <Link
            key={r.id}
            href={`${hrefCalendario({ mes, dia, reserva: r.id })}#detalle`}
            style={{ gridColumn: `${t.inicioCol} / ${t.finCol + 1}`, gridRow: t.carril + 2 }}
            className={`relative z-10 mx-0.5 my-px truncate px-1.5 text-[0.6875rem] font-semibold leading-[1.375rem] ${CLASES_COLOR[colorDeApartamento(r.apartamentoId, ids)]} ${pendiente ? 'rayado-pendiente' : ''} ${t.continuaAntes ? 'rounded-l-none' : 'rounded-l-md'} ${t.continuaDespues ? 'rounded-r-none' : 'rounded-r-md'}`}
          >
            {r.clienteNombre}
            <span className="sr-only">
              , {r.apartamentoNombre}, del {formatoDia(r.llegada)} al {formatoDia(r.salida)}
              {pendiente ? ', pendiente de confirmar' : ''}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Panel del día**

Crear `src/modules/reservas/ui/componentes/panel-dia.tsx`:

```tsx
import Link from 'next/link'
import { EtiquetaEstado, RangoFechasTexto } from '@/shared/ui/componentes'
import { formatoDia, formatoDiaLargo } from '@/shared/ui/formato'
import type { ReservaDTO } from '../../application/ReservaDTO'
import { agruparDia, CLASES_COLOR, colorDeApartamento, hrefCalendario } from '../calendario'

/** Lo que pasa un día: quién llega, quién sale y quién sigue alojado. Cada fila abre el detalle. */
export function PanelDia({ mes, dia, reservas, ids }: { mes: string; dia: string; reservas: ReservaDTO[]; ids: string[] }) {
  const { llegan, salen, alojados } = agruparDia(reservas, dia)
  const grupos = [
    { titulo: 'Llegan', lista: llegan },
    { titulo: 'Salen', lista: salen },
    { titulo: 'Alojados', lista: alojados },
  ].filter((g) => g.lista.length > 0)

  return (
    <div>
      <h2 className="font-display text-xl text-tinta">{formatoDiaLargo(dia)}</h2>
      {grupos.length === 0 ? (
        <p className="mt-3 text-sm text-tinta-suave">No hay llegadas ni salidas este día.</p>
      ) : (
        grupos.map(({ titulo, lista }) => (
          <section key={titulo} aria-label={titulo} className="mt-5">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-dorado">{titulo}</h3>
            <ul className="divide-y divide-borde">
              {lista.map((r) => (
                <li key={r.id}>
                  <Link href={`${hrefCalendario({ mes, dia, reserva: r.id })}#detalle`} className="flex items-start gap-3 py-3 transition-colors hover:bg-hundido">
                    <span aria-hidden className={`mt-1.5 size-3 shrink-0 rounded-sm ${CLASES_COLOR[colorDeApartamento(r.apartamentoId, ids)]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-tinta">{r.clienteNombre}</span>
                      <span className="block truncate text-sm text-tinta-suave">{r.apartamentoNombre}</span>
                      {/* relative: el texto sr-only del rango (posición absoluta) queda dentro de la fila */}
                      <span className="relative block text-xs tabular-nums text-tinta-suave">
                        <RangoFechasTexto desde={formatoDia(r.llegada)} hasta={formatoDia(r.salida)} />
                      </span>
                    </span>
                    {r.estado !== 'CONFIRMADA' && <EtiquetaEstado estado={r.estado} />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 5: Detalle de la reserva**

Crear `src/modules/reservas/ui/componentes/detalle-reserva-calendario.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { ApartamentoDTO } from '@/modules/apartamentos/application/ApartamentoDTO'
import { BotonEnviar, BotonEnviarConfirmando } from '@/shared/ui/boton-enviar'
import { claseBoton, claseEnlace, claseEnlaceVolver, EtiquetaEstado, RangoFechasTexto } from '@/shared/ui/componentes'
import { formatoDia, formatoDiaMes, formatoMoneda } from '@/shared/ui/formato'
import type { ReservaDTO } from '../../application/ReservaDTO'
import { confirmarReserva, rechazarReserva } from '../acciones'

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-tinta-suave">{termino}</dt>
      <dd className="relative text-right text-tinta">{children}</dd>
    </div>
  )
}

type Props = {
  reserva: ReservaDTO
  /** Ausente si el apartamento se eliminó: entonces solo se muestra la reserva */
  apartamento?: ApartamentoDTO
  dia: string
  /** Enlace "← Volver al día" */
  hrefDia: string
  /** Ruta a la que vuelven Confirmar y Rechazar (este mismo detalle) */
  volverA: string
}

export function DetalleReservaCalendario({ reserva: r, apartamento, dia, hrefDia, volverA }: Props) {
  const personas = r.numAdultos + r.numNinos
  return (
    <div>
      <Link href={hrefDia} className={claseEnlaceVolver}>
        <span aria-hidden>←</span> Volver al {formatoDiaMes(dia)}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="font-display text-xl text-tinta">{r.clienteNombre}</h2>
        <EtiquetaEstado estado={r.estado} />
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <Dato termino="Teléfono">
          {r.clienteTelefono ? (
            <a href={`tel:${r.clienteTelefono}`} className={claseEnlace}>
              {r.clienteTelefono}
            </a>
          ) : (
            'Sin teléfono'
          )}
        </Dato>
        <Dato termino="Correo">
          <a href={`mailto:${r.clienteEmail}`} className={`${claseEnlace} break-all`}>
            {r.clienteEmail}
          </a>
        </Dato>
        <Dato termino="Fechas">
          <RangoFechasTexto desde={formatoDia(r.llegada)} hasta={formatoDia(r.salida)} />
        </Dato>
        <Dato termino="Noches">{r.precio.noches}</Dato>
        <Dato termino="Personas">
          {personas} {personas === 1 ? 'huésped' : 'huéspedes'}
        </Dato>
        <Dato termino="Total">
          <span className="font-cifra">{formatoMoneda(r.precio.total)}</span>
        </Dato>
      </dl>

      {r.acciones.confirmar && (
        <div className="mt-5 flex flex-wrap gap-2">
          <form action={confirmarReserva.bind(null, r.id, volverA)}>
            <BotonEnviar>Confirmar</BotonEnviar>
          </form>
          <form action={rechazarReserva.bind(null, r.id, volverA)}>
            <BotonEnviarConfirmando variante="secundario" mensaje="¿Rechazar esta solicitud? No se puede deshacer.">
              Rechazar
            </BotonEnviarConfirmando>
          </form>
        </div>
      )}

      {apartamento && (
        <div className="mt-6 border-t border-borde pt-5">
          {apartamento.imagenPrincipal && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-control bg-hundido">
              <Image src={apartamento.imagenPrincipal} alt="" fill sizes="20rem" className="object-cover" />
            </div>
          )}
          <h3 className="mt-3 font-display text-lg text-tinta">{apartamento.nombre}</h3>
          <p className="text-sm text-tinta-suave">
            {apartamento.direccion}, {apartamento.ciudad}
          </p>
          <p className="mt-2 line-clamp-3 text-sm text-tinta-suave">{apartamento.descripcion}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/dashboard/apartamentos/${apartamento.id}`} className={claseBoton('secundario', 'sm')}>
              Administrar
            </Link>
            <Link href={`/apartamentos/${apartamento.id}`} className={claseBoton('secundario', 'sm')}>
              Ver página pública <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Página, ruta y pestaña**

Crear `src/modules/reservas/ui/paginas/CalendarioPagina.tsx`:

```tsx
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

  return (
    <div className="space-y-10">
      <PortadaPanel titulo="Calendario" descripcion="Llegadas, salidas y estadías de todos tus apartamentos." />
      <FranjaPanel>
        <MensajesDeRuta error={unico(params.error)} exito={unico(params.exito)} />
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
              {seleccionada ? (
                <DetalleReservaCalendario
                  reserva={seleccionada}
                  apartamento={misApartamentos.find((a) => a.id === seleccionada.apartamentoId)}
                  dia={dia}
                  hrefDia={`${hrefCalendario({ mes, dia })}#detalle`}
                  volverA={hrefCalendario({ mes, dia, reserva: seleccionada.id })}
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
```

Crear `src/app/dashboard/calendario/page.tsx`:

```tsx
export { default } from '@/modules/reservas/ui/paginas/CalendarioPagina'
```

En `src/app/dashboard/layout.tsx`, añadir un tercer `<li>` después del de "Reservas recibidas":

```tsx
            <li>
              <EnlaceActivo href="/dashboard/calendario" className={PESTANA} claseActiva={ACTIVA} claseInactiva={INACTIVA}>
                Calendario
              </EnlaceActivo>
            </li>
```

- [ ] **Step 7: Verificar compilación, lint y pruebas**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: sin errores.

- [ ] **Step 8: Verificación en el navegador**

Con el `npm run dev` del usuario en `:3000` (si `bg-apto-*` o `rayado-pendiente` no aparecen, pedirle que reinicie su servidor), entrar como `propietario@demo.com` (credenciales del seed) en `http://localhost:3000/dashboard/calendario` y comprobar:

1. La pestaña "Calendario" aparece activa; portada piedra media con el título.
2. El mes actual: hoy en círculo piedra; las reservas como barras del color de su apartamento; la leyenda lista todos los apartamentos (también los que no tienen reservas).
3. Tocar un día → URL con `dia=` y el panel muestra Llegan / Salen / Alojados; un día vacío muestra "No hay llegadas ni salidas este día."
4. Tocar una barra → detalle con "← Volver al …", datos, y bloque del apartamento; "Volver" regresa al día.
5. ← y → cambian de mes; "Hoy" vuelve al mes actual; `?mes=2026-13&dia=hola` no da error.
6. Con una solicitud pendiente (crear una como `cliente@demo.com`): barra rayada; Confirmar → vuelve al mismo detalle con "Reserva confirmada"; en otra, Rechazar → vuelve al día (la rechazada ya no aparece).
7. Vista móvil (iframe de 390 px, ver memoria del proyecto): el panel queda debajo del mes, el enlace de un día baja hasta `#detalle`, sin desbordamiento horizontal propio de la página.
