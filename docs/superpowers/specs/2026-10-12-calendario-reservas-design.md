# Calendario de reservas del propietario — Diseño

> Fecha: 2026-10-12 · Estado: aprobado por partes, pendiente de revisión escrita
> Rama: `refactor/ddd-rediseno-ui` · Marca: Morada (`docs/brand-guidelines.md`)

## 1. Objetivo

Un propietario con varios apartamentos ve en un solo calendario mensual cómo están ocupados y organiza su
día a día (quién llega, quién sale, quién está alojado). Éxito: de un vistazo al mes sabe qué está ocupado,
y con uno o dos toques llega al detalle de una reserva o de un apartamento para actuar (confirmar, rechazar,
llamar al huésped).

## 2. Alcance

**Incluye**
- Pestaña nueva **Calendario** en el panel del propietario: `/dashboard/calendario`.
- Vista de **mes completo** (semanas de lunes a domingo) con navegación **← Hoy →**.
- **Barras continuas** de llegada a salida, un color por apartamento, con el nombre del huésped.
- Reservas **aceptadas** (CONFIRMADA, EN_CURSO, COMPLETADA) y **pendientes vigentes** (rayadas, borde punteado).
- **Leyenda** con todos los apartamentos del propietario, también los que no tienen reservas ese mes.
- **Panel lateral** (debajo en móvil): lista del día (Llegan / Salen / Alojados) → detalle de una reserva.
- **Detalle**: reserva (huésped, teléfono, fechas, noches, personas, total, estado, Confirmar/Rechazar si
  está pendiente) + apartamento (foto, dirección, descripción, enlaces a Administrar y a la página pública).

**No incluye**
- Vista semanal o de línea de tiempo por apartamento (descartadas).
- Crear, mover o editar reservas desde el calendario.
- Bloquear fechas manualmente.
- Ver apartamentos de otros propietarios (ni siquiera un ADMIN: solo ve los suyos).

## 3. Pantalla

Boceto aprobado: `.superpowers/brainstorm/796-1791836004/content/pantalla-calendario.html`.

- Usa la estructura del panel: franja de pestañas (`bg-panel`), `PortadaPanel` con título **Calendario** y
  descripción "Llegadas, salidas y estadías de todos tus apartamentos.", y `FranjaPanel` (gris `banda`) debajo.
- **Escritorio (≥ lg):** rejilla de dos columnas. Izquierda: tarjeta blanca con el mes (encabezado en Cinzel,
  ← Hoy → a la derecha), cuadrícula y leyenda. Derecha (~20 rem): tarjeta blanca fija (`sticky`) con el panel.
- **Móvil:** el mes arriba y el panel debajo. Los enlaces de día y de reserva llevan el ancla `#detalle`,
  así la página baja sola al panel.
- **Celda de día:** número arriba a la izquierda; "hoy" en círculo piedra; el día elegido con fondo
  `dorado-suave`. Los días de los meses vecinos que completan las semanas se ven atenuados y no son enlaces.
- **Barras:** fondo y texto del color del apartamento, radio pequeño, nombre del huésped truncado. Una barra
  que cruza semanas se corta en tramos (uno por fila). Pendientes: rayado diagonal + borde punteado.
  Cada barra es un enlace a su detalle.
- **Panel del día:** título "Martes 13 de octubre" y grupos **Llegan / Salen / Alojados** (se ocultan los vacíos);
  cada fila: cuadrito de color, huésped · apartamento, fechas, pastilla de estado si no está confirmada.
  Sin reservas: "No hay llegadas ni salidas este día."
- **Detalle:** "← Volver al 13 de octubre", datos de la reserva, botones Confirmar (principal) y Rechazar
  (secundario) si `acciones.confirmar`, y debajo el bloque del apartamento.
- Al entrar sin `dia`, el panel muestra **hoy** (si hoy pertenece al mes visible; si no, el primer día del mes).

### Colores por apartamento (paleta B, tonos tierra)

| # | Nombre | Fondo | Texto | Contraste |
|---|---|---|---|---|
| 1 | Pizarra | `#D6DFEA` | `#1E3A5F` | 8.55:1 |
| 2 | Salvia | `#D9E4D2` | `#2F4A1F` | 7.54:1 |
| 3 | Terracota | `#F1D6CB` | `#7C2D12` | 6.79:1 |
| 4 | Arena | `#EDE3D1` | `#5B4321` | 7.27:1 |
| 5 | Ciruela | `#E6D8E6` | `#4A2545` | 9.34:1 |
| 6 | Petróleo | `#D3E5E3` | `#134E4A` | 7.26:1 |
| — | Apartamento eliminado | `#E7E5E4` | `#57534E` | 6.08:1 |

El color se asigna por **antigüedad**: el apartamento más antiguo toma el 1, el siguiente el 2, y así; con más
de 6 se repiten. Publicar uno nuevo no cambia los colores de los existentes. Se definen como tokens en
`globals.css` (`--color-apto-1` … `--color-apto-6` con su `-texto`) y se documentan en la guía de marca.

## 4. Estado en la URL

`/dashboard/calendario?mes=2026-10&dia=2026-10-13&reserva=<id>`

| Parámetro | Formato | Si falta o es inválido |
|---|---|---|
| `mes` | `AAAA-MM` | mes actual |
| `dia` | `AAAA-MM-DD` dentro del mes visible | hoy si está en el mes; si no, día 1 |
| `reserva` | id de una reserva visible ese mes | se ignora y se muestra el día |

Las flechas ← → cambian `mes` y quitan `dia` y `reserva`; **Hoy** lleva a `/dashboard/calendario`.
Todo es navegación con enlaces (página de servidor); no hay estado en el cliente.

## 5. Arquitectura y datos

Sigue los límites de módulos del proyecto (ESLint `no-restricted-imports`): la página de `src/app` solo importa
la `ui` de los módulos; la composición entre reservas y apartamentos ocurre en la página de `reservas/ui`, como
en `MisReservasPagina`.

### Módulo reservas

- **Dominio** — `Reserva.seMuestraEnCalendario(ahora): boolean`: verdadero si `estadoVigente(ahora)` es aceptada
  (`esEstadiaAceptada`) o es `PENDIENTE` (vigente, porque una vencida ya es `EXPIRADA`).
- **Puerto** — `ReservaRepository.listarPorPropietarioEnRango(propietarioId, desde: Date, hasta: Date)`:
  reservas de apartamentos del propietario con `llegada <= hasta` y `salida >= desde` (el día de salida cuenta,
  porque ese día la reserva aparece en "Salen"). Implementaciones: Prisma y memoria.
- **Caso de uso** — `ConsultarCalendario` (en `application/ConsultasReservas.ts`):
  `ejecutar(actor, { desde, hasta }): Promise<ReservaDTO[]>`, con `desde` y `hasta` como texto `AAAA-MM-DD`
  (igual que las fechas de `ReservaDTO`); valida el rango (`desde <= hasta`, máximo 42 días;
  si no, `ErrorDeDominio`), consulta el repositorio con `actor.id` y filtra con `seMuestraEnCalendario(ahora)`.
  Se registra en el contenedor como `reservas.calendario`.
- **Acciones** — `confirmarReserva` y `rechazarReserva` aceptan un segundo parámetro opcional `volverA`. Solo se usa
  si empieza por `/dashboard/`; en otro caso vuelven a `/dashboard/reservas` como hoy.

### Módulo apartamentos

Sin cambios. La página usa `apartamentos.listarDePropietario` (nombre, foto principal, dirección, ciudad,
descripción, estado). La lista llega ordenada de la más reciente a la más antigua; para los colores se usa en
orden inverso. Un apartamento eliminado no está en la lista: sus reservas se pintan en gris con
`ReservaDTO.apartamentoNombre` y el detalle omite el bloque del apartamento.

### Lógica de presentación pura — `reservas/ui/calendario.ts`

- `leerParametros(searchParams, hoy)` → `{ mes, dia, reservaId }` ya validados (sección 4).
- `semanasDelMes(mes)` → semanas de lunes a domingo que cubren el mes, con cada día marcado como del mes o vecino.
- `barrasDeSemana(reservas, semana)` → tramos `{ reserva, inicioCol, finCol, carril, continuaAntes, continuaDespues }`;
  el carril se asigna de forma voraz para que dos tramos que se cruzan no compartan fila. Una reserva ocupa
  desde el día de llegada hasta el de salida inclusive.
- `agruparDia(reservas, dia)` → `{ llegan, salen, alojados }` (llegada = día; salida = día; entre ambas).
- `colorDeApartamento(apartamentoId, idsPorAntiguedad)` → índice 1–6 o `eliminado`.

### Componentes — `reservas/ui`

- `paginas/CalendarioPagina.tsx`: exige anfitrión, lee parámetros, pide en paralelo apartamentos y reservas del
  rango de la cuadrícula, y compone `PortadaPanel` + `FranjaPanel` con las piezas.
- `componentes/calendario-mes.tsx`: cuadrícula, barras y leyenda (servidor, solo enlaces).
- `componentes/panel-dia.tsx` y `componentes/detalle-reserva-calendario.tsx`.
- `src/app/dashboard/calendario/page.tsx` reexporta la página; `src/app/dashboard/layout.tsx` añade la pestaña.

Sin migraciones ni dependencias nuevas.

## 6. Casos límite y errores

- Parámetros inválidos: se corrigen en silencio según la sección 4 (nunca error 500 ni 404).
- La reserva de otro propietario nunca llega: el caso de uso filtra por `actor.id`.
- Sin apartamentos: `EstadoVacio` "Todavía no has publicado apartamentos" con botón para publicar el primero.
- Mes sin reservas: cuadrícula y leyenda normales; panel con el mensaje de día vacío.
- Varias reservas el mismo día: más carriles y la celda crece; el panel del día siempre muestra la lista completa.
- Confirmar/Rechazar: éxito o error del dominio (p. ej. solicitud vencida) vuelven al mismo `mes`/`dia`/`reserva`
  con `?exito=` o `?error=` y `MensajesDeRuta`; `ConflictoDeConcurrenciaError` muestra su mensaje existente.
- Fechas: los días se manejan como fecha local con las utilidades actuales de `RangoFechas` y `formato`, así "hoy"
  coincide con el resto de la aplicación.

## 7. Pruebas

- **Dominio:** `seMuestraEnCalendario` en cada estado, incluida una pendiente vencida.
- **Caso de uso** (repositorio en memoria): filtra por propietario y por rango; aplica la regla del calendario;
  rechaza rangos invertidos o mayores de 42 días.
- **Integración** (Postgres real): `listarPorPropietarioEnRango` con bordes — reserva cuya salida es `desde`,
  reserva cuya llegada es `hasta`, reserva que abarca todo el rango, reserva de otro propietario.
- **Presentación:** `semanasDelMes` (mes que empieza en domingo, febrero bisiesto, mes de 6 semanas);
  `barrasDeSemana` (tramo partido entre semanas, cruces en carriles, salida y llegada el mismo día en el mismo
  apartamento); `agruparDia`; `leerParametros` con valores inválidos; `colorDeApartamento` con más de 6.
- **Acciones:** `volverA` solo acepta rutas `/dashboard/...`.
- **Manual:** revisión en navegador en escritorio y en móvil (390 px).
