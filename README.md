# Reservas de apartamentos

Plataforma para publicar apartamentos y reservarlos por noches. Hecha con **Next.js 16**, **React 19**, **Prisma + PostgreSQL** y **Auth.js**, organizada con **DDD (Domain-Driven Design)** por módulos.

## Puesta en marcha

```bash
npm install                 # instala dependencias y genera el cliente de Prisma
cp .env.example .env        # completa DATABASE_URL, TEST_DATABASE_URL y AUTH_SECRET
npm run db:migrar           # aplica las migraciones
npm run db:seed             # (opcional) datos demo: propietario@demo.com / cliente@demo.com, contraseña demo12345
npm run dev                 # http://localhost:3000
```

| Comando | Qué hace |
|---|---|
| `npm test` | Pruebas unitarias (sin base de datos, ~2 s) |
| `npm run test:integracion` | Pruebas contra PostgreSQL real (usa `TEST_DATABASE_URL`) |
| `npm run test:todo` | Todas las pruebas |
| `npm run typecheck` / `npm run lint` | Tipos y estilo |

## Arquitectura

### La regla principal: todo lo de un tema vive en su módulo

```
src/
├─ app/                  Rutas de Next.js. Solo archivos de 1 línea que apuntan a una página del módulo.
├─ contenedor.ts         Conecta los casos de uso con sus implementaciones reales (Prisma, Cloudinary…).
├─ modules/
│  ├─ identidad/         Usuarios, registro, login, sesión
│  ├─ apartamentos/      Catálogo: publicar, editar, buscar, imágenes
│  └─ reservas/          Cotizar, reservar, confirmar, cancelar, expirar
└─ shared/
   ├─ domain/            Piezas de negocio comunes: Dinero, RangoFechas, Actor, errores
   ├─ infrastructure/    Cliente de Prisma
   └─ ui/                Botones, campos, navbar y helpers de formularios
```

Cada módulo tiene siempre las mismas 4 carpetas:

```
modules/reservas/
├─ domain/           REGLAS DE NEGOCIO. TypeScript puro: sin Next, sin Prisma, sin React.
│  ├─ Reserva.ts         Entidad con su ciclo de vida (solicitar, confirmar, cancelar…)
│  ├─ CalculadoraPrecio.ts, Reembolso.ts, EstadoReserva.ts
│  └─ puertos.ts         Interfaces que el dominio necesita (ReservaRepository…)
├─ application/      CASOS DE USO. Lo que un usuario puede hacer. Orquestan el dominio.
│  ├─ SolicitudReserva.ts  (CotizarReserva, CrearReserva)
│  ├─ GestionReservas.ts   (Confirmar, Rechazar, Cancelar, Expirar)
│  └─ ReservaDTO.ts        Datos planos que salen hacia la interfaz
├─ infrastructure/   DETALLES TÉCNICOS. Implementan los puertos.
│  ├─ PrismaReservaRepository.ts   (+ su prueba de integración)
│  └─ memoria.ts                   Versiones en memoria para pruebas unitarias
└─ ui/               INTERFAZ del módulo.
   ├─ paginas/       Páginas completas (las usan las rutas de src/app)
   ├─ componentes/   Formularios y piezas visuales
   └─ acciones.ts    Server Actions (lo que ejecutan los formularios)
```

### Dependencias permitidas

```
ui  ──►  application  ──►  domain  ◄──  infrastructure
                                   (implementa los puertos)
```

- `domain/` **no importa nada** de las otras capas ni de librerías externas.
- `application/` solo conoce el dominio y los puertos (interfaces), nunca Prisma.
- `contenedor.ts` es el único lugar donde se decide "el repositorio real es Prisma".
- Un módulo no usa el modelo interno de otro. Ejemplo: `reservas` consulta apartamentos a través de `CatalogoApartamentosDesdeRepositorio` (capa anticorrupción).

### ¿Dónde pongo…?

| Quiero… | Va en |
|---|---|
| Una regla de negocio ("máximo 90 noches") | `modules/<modulo>/domain/` |
| Algo nuevo que el usuario puede hacer | Un caso de uso en `application/`, registrarlo en `contenedor.ts` |
| Cambiar cómo se guarda algo | `infrastructure/` (el dominio no cambia) |
| Un formulario o componente del módulo | `modules/<modulo>/ui/componentes/` |
| Una página nueva | `modules/<modulo>/ui/paginas/` + un archivo de 1 línea en `src/app/<ruta>/page.tsx` |
| Un botón o campo genérico | `shared/ui/componentes.tsx` |

### Flujo de una petición (ejemplo: cancelar reserva)

1. `src/app/mis-reservas/[id]/page.tsx` → `modules/reservas/ui/paginas/DetalleReservaPagina.tsx`
2. El botón llama a la Server Action `cancelarReserva` en `modules/reservas/ui/acciones.ts`
3. La acción obtiene el usuario de la sesión y llama a `reservas.cancelar.ejecutar(actor, id)` (desde `contenedor.ts`)
4. El caso de uso `CancelarReserva` carga la reserva, verifica permisos y llama a `reserva.cancelar(ahora)`
5. La entidad `Reserva` valida la transición de estado y calcula el reembolso según la política
6. `PrismaReservaRepository` guarda el cambio

Los errores de negocio (`ErrorDeDominio`) se muestran al usuario; cualquier otro error se propaga.

## Reglas de negocio implementadas

- **Sin dobles reservas:** la creación bloquea la fila del apartamento (`SELECT … FOR UPDATE`) dentro de una transacción. Hay una prueba de integración que lanza 8 reservas simultáneas y verifica que solo entra una.
- **Precio calculado en el servidor:** noches + limpieza + 10% de servicio + 19% de impuestos.
- **Ciclo de vida:** `PENDIENTE → CONFIRMADA | RECHAZADA | CANCELADA | EXPIRADA`, `CONFIRMADA → CANCELADA | EN_CURSO → COMPLETADA`.
- **Solicitudes con vencimiento:** el propietario tiene 24 h para confirmar. Las vencidas dejan de bloquear fechas de inmediato y la tarea `GET /api/cron/expirar-reservas` (header `Authorization: Bearer $CRON_SECRET`) las marca como `EXPIRADA`.
- **Política de cancelación** por apartamento: flexible (100% hasta 24 h antes), moderada (50% hasta 5 días antes), estricta (sin reembolso).
- **Seguridad:** el rol ADMIN no se puede elegir al registrarse; cada caso de uso verifica permisos con el `Actor` de la sesión; los errores de login no revelan si el email existe.

## Pendiente / siguientes pasos

- Pagos (Stripe) y confirmación automática al pagar
- Emails (verificación de cuenta, recuperación de contraseña, avisos de reserva)
- Pruebas end-to-end con Playwright
- Precios por temporada y bloqueo manual de fechas
