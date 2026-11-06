# Morada — Guía de marca v1.0

> Última actualización: 2026-10-12
> Estado: vigente. Los tokens viven en `src/app/globals.css`; si cambias algo aquí, cámbialo allí.

## Referencia rápida

| Elemento | Valor |
|---|---|
| Nombre | **Morada** |
| Promesa | Tu casa por unos días |
| Acento | Piedra `#1C1917` |
| Detalle | Dorado `#A16207` (claro `#D9B26A` solo sobre piedra) |
| Titulares | Cinzel 600 |
| Texto | Josefin Sans 400–600 |
| Voz | Cercana, serena, clara |

## 1. Esencia

Morada alquila apartamentos por noches en Colombia, reservados directamente con el propietario.
Debe sentirse como una inmobiliaria de alto nivel: sobria, cuidada y con mucho aire. El color lo ponen
las fotos; la interfaz las enmarca.

## 2. Color

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `fondo` / `superficie` | `#FFFFFF` | Página y tarjetas | — |
| `hundido` | `#F5F5F4` | Chips, hover, esqueletos | — |
| `borde` | `#E7E5E4` | Divisores y tarjetas (decorativo) | — |
| `borde-control` | `#8A8580` | Campos y botón secundario | 3.65:1 |
| `tinta` | `#0C0A09` | Texto principal | 19.8:1 |
| `tinta-suave` | `#57534E` | Texto secundario | 7.6:1 |
| `tinta-tenue` | `#6B6560` | Placeholder y metadatos | 5.7:1 |
| `acento` | `#1C1917` | Botón primario, pestaña activa, foco | blanco 17.5:1 |
| `acento-hover` | `#292524` | Hover del primario | blanco 15.2:1 |
| `cabecera` | `#1C1917` | Cabecera | blanco/75 10.2:1 |
| `panel` | `#3B3531` | Pestañas y portadas del panel del propietario (se distingue de la cabecera) | blanco 12:1 · dorado-claro 6:1 |
| `dorado` | `#A16207` | Contador de pendientes | blanco 4.9:1 |
| `dorado-claro` | `#D9B26A` | Logo y filete activo, **solo sobre piedra** | 8.8:1 |
| `dorado-suave` | `#FBF3DB` | Selección de texto | — |

Reglas:
- El dorado es un **detalle**, nunca un fondo grande ni un botón. Si aparece en más de dos sitios por pantalla, sobra.
- Los estados (éxito, aviso, peligro) conservan sus colores semánticos; no se tiñen de dorado.
- Fondo siempre blanco: nada de cremas ni beiges de fondo.

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

## 3. Tipografía

Par "Real Estate Luxury" (catálogo ui-ux-pro-max): **Cinzel** para titulares, **Josefin Sans** para el texto.

| Utilidad | Fuente | Uso |
|---|---|---|
| `font-display` | Cinzel 600, `letter-spacing: .02em` | h1, h2, logo, ciudades grandes |
| `font-sans` (base) | Josefin Sans | Todo el texto, botones y formularios |
| `font-cifra` | Josefin Sans 600 | Precios, totales, fechas destacadas |

- Cinzel solo tiene mayúsculas: titulares **cortos** (máx. ~6 palabras). Nunca párrafos ni etiquetas.
- Cinzel no tiene cifras tabulares: los números van en `font-cifra`.
- Josefin Sans tiene una altura x baja; `html { font-size-adjust: .47 }` la iguala. No quitarlo.
- Enlaces de la cabecera: mayúsculas, `tracking-[0.14em]`, 13 px.

## 4. Logo

Casa con una llave dentro, trazo de 2 px, en `dorado-claro` sobre la cabecera piedra, seguido de
**MORADA** en Cinzel con `tracking-[0.16em]`. Sobre fondo blanco, el ícono va en `tinta`.

## 5. Cabecera

80 px de alto, piedra, a todo el ancho. Tres columnas: logo a la izquierda, secciones **centradas**,
cuenta a la derecha. La sección actual lleva un filete dorado de 1 px debajo; sin fondos de pastilla.

## 6. Portada del inicio

Basada en el hero de la demo "Real Estate". A todo el ancho de la pantalla, pegada a la cabecera y de alto
`100svh − cabecera`. Foto con degradado oscuro de izquierda a derecha (parejo en móvil).

- Píldora de vidrio con punto dorado: "Directamente con el propietario".
- Titular en dos líneas: "Tu casa" en blanco y "por unos días" en `dorado-claro`.
- Buscador en variante `portada`: vidrio blanco al 90 %, radio `tarjeta`, etiquetas en mayúsculas espaciadas y separadores finos.
- Cifras **reales** bajo el buscador: apartamentos activos, ciudades y "24 h" (plazo de respuesta del propietario). Nunca cifras inventadas.

### "Por qué Morada" y pie de página

- **Por qué Morada** (`PorQueMorada`), tras las tarjetas del inicio: etiqueta dorada en mayúsculas, titular centrado
  "Reservar sin rodeos" y 4 ventajas con ícono en cuadro `dorado-suave`. Cada ventaja es una regla real de la app
  (trato directo, respuesta en `HORAS_PARA_CONFIRMAR` horas, desglose de precio, política visible). Si cambia la regla, cambia el texto.
- **Pie** (`shared/ui/pie-pagina.tsx`), en todas las páginas: piedra, marca + promesa, columnas Explora / Huéspedes /
  Propietarios con enlaces a páginas existentes, y "© año Morada · Hecho en Colombia". Sin redes ni páginas legales hasta que existan.

### Panel del propietario

- Las pestañas (Resumen / Reservas recibidas) van en una franja `panel` (piedra media) pegada a la cabecera: son su submenú.
  Cabecera y panel no comparten color, para que la cabecera no se funda con la portada.
  Activa: `bg-white/10` con filete `ring-white/15`.
- Cada página del panel abre con `PortadaPanel` (`shared/ui/portada-panel.tsx`): etiqueta dorada "Panel de propietario",
  título en Cinzel y acción en botón blanco. El resumen añade las 4 cifras en blanco, como la portada del inicio.
- Debajo, `FranjaPanel`: franja `banda` hasta el pie con listas y tarjetas blancas (`shadow-tarjeta`, sin borde).
- Publicar y Administrar apartamento usan `PortadaPanel volver` (la etiqueta dorada es el enlace "← Panel de propietario");
  el formulario va en una tarjeta blanca y cada sección de Administrar es una tarjeta. Botones sobre piedra:
  `claseBoton('claro')` (principal) y `claseBoton('contornoClaro')` (secundario).
- El aviso de solicitudes por responder va en `dorado-suave` con ícono de reloj en dorado.
- Ojo con Tailwind v4: `space-y` pone el margen **debajo** del elemento anterior; para pegar una franja a una portada,
  la portada lleva `mb-0`.

## 7. Tarjeta de apartamento

Basada en la demo "Real Estate" de ui-ux-pro-max (uupm.cc/demo/real-estate). Componente `FichaApartamento`
(`apartamentos/ui/componentes/tarjeta-apartamento.tsx`), compartido por resultados, inicio y la vista previa del formulario.

- Blanca, radio `tarjeta` (16 px), `shadow-tarjeta` + filete `ring-borde/60` (el fondo de la página es blanco).
- Al pasar el ratón: sube 8 px y pasa a `shadow-tarjeta-elevada` (0,3 s); la foto se amplía al 110 % (0,5 s). Solo con `motion-safe`.
- Foto 4:3 sin radio propio. Píldora dorada arriba a la izquierda **solo con datos reales** (hoy: "Cancelación flexible").
- Cuerpo `p-5`: 📍 ciudad, nombre en Cinzel (máx. 2 líneas), huéspedes · hab. · baños con íconos, filete, precio `font-cifra` + "Ver detalles".
- Sin corazón de favoritos mientras no exista la función.
- Resultados: rejilla de 3 columnas sobre la franja `banda`, que llega hasta el pie (buscador y filtros quedan sobre blanco). Inicio: filas fijas de 4 tarjetas (sin desplazamiento) sobre la
  franja `banda` (`#EBE9E6`) a todo el ancho, para que se note la sombra y la elevación.
- La tarjeta es un contenedor (`@container`): por debajo de 20rem los datos muestran solo ícono y número (la unidad
  queda en el tooltip y para lectores de pantalla) y se oculta "Ver detalles".

## 8. Voz y tono

**Personalidad:** cercana, serena y clara. Hablamos de tú, como un buen anfitrión.

| Somos | No somos |
|---|---|
| Cálidos ("Tu casa por unos días") | Empalagosos ("¡¡Increíble!!") |
| Claros ("Llegas mañana") | Técnicos ("Estado: PENDIENTE") |
| Serenos, sin prisa | Urgentes o vendedores ("¡Últimas unidades!") |
| Útiles: decimos qué hacer después | Culpables ("Error del usuario") |

Por contexto:

| Contexto | Tono | Ejemplo |
|---|---|---|
| Portadas | Evocador, corto | "¿A dónde vas ahora?" |
| Botones | Verbo + objeto | "Solicitar reserva", "Guardar cambios" |
| Vacíos | Invitan a actuar | "No tienes viajes próximos. Busca tu siguiente apartamento." |
| Errores | Qué pasó + qué hacer | "Alguien más modificó estos datos. Recarga la página e inténtalo de nuevo." |
| Éxito | Breve | "Cambios guardados" |

Vocabulario:

| Usar | Evitar |
|---|---|
| correo electrónico, correo | email, mail |
| propietario (quien publica), huésped (quien reserva) | host, usuario, cliente |
| estadía | booking, alojamiento (salvo en el desglose de precio) |
| directamente | directo (como adverbio) |
| noche, por noche | night, tarifa nocturna |

Sin signos de exclamación en la interfaz. Mayúscula solo al inicio de frase (los titulares en Cinzel ya salen en mayúsculas).

## 9. Imágenes

Fotos reales, luz natural, interiores amplios y ordenados. Sin filtros de color: el dorado de la marca
no se aplica sobre las fotos. Las de Unsplash en `shared/ui/imagenes.ts` son temporales.
