# Shell cinematográfico del centro de control — Fase 3.0

Continúa [composición inmersiva](composicion-inmersiva.md). Referencia artística: `references/arxnet-approved-mockup.png` (vista general y Compras enfocado). Capturas de esta fase en [`capturas-3.0/`](capturas-3.0/).

`/campus-3d` deja de ser un visor técnico y pasa a ser el **centro de control espacial**: la escena 3D ocupa todo el viewport y el Shell flota encima. El canvas nunca se redimensiona; cada capa del Shell comunica su superficie a la cámara como margen (la misma vía que dejó preparada la fase anterior).

## 1. Componentes

| Capa                     | Archivo                                                                            | Qué hace                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Orquestación             | `campus-page.tsx`                                                                  | Conserva el estado de Fase 2.x (selección, revisión, cubierta, diagnóstico) y compone el Shell en ranuras medidas (`cc-slot-*`).          |
| Barra superior           | `control-center/command-bar.tsx`                                                   | Marca, empresa, buscador (⌘K/Ctrl+K), avisos, apariencia y perfil, en tres islas de cristal.                                              |
| Carril lateral           | `control-center/side-rail.tsx`                                                     | Centro de control, aplicaciones, documentos, organización (`/mapa`) y configuración (`/settings/appearance`).                             |
| Título contextual        | `control-center/view-heading.tsx`                                                  | «Centro de control» o migas + nombre del departamento, «Volver a vista general» y, en Compras, «Ver interior».                            |
| Panel contextual         | `control-center/context-panel.tsx`                                                 | «Atención ahora», panel operativo de Compras (pestañas, lista, detalle, proceso) y resumen del resto de departamentos.                    |
| Dock de modos            | `control-center/mode-dock.tsx`                                                     | Control, Aplicaciones, Actividad · Espacios, Líneas, Flujos.                                                                              |
| Pie                      | `control-center/status-strip.tsx`                                                  | Frescura de datos, diagnóstico plegable e indicadores rápidos.                                                                            |
| Etiquetas espaciales     | `control-center/spatial-label.tsx`                                                 | Tarjeta (icono, nombre, punto de estado, cantidad) con tallo hacia el ancla; puntos del interior de Compras.                              |
| Escena (Codex, ampliada) | `campus-scene.tsx`                                                                 | Nuevas props `renderLabel` y `annotations`; hover sobre proxies; iluminación nocturna. Cámara, perfiles y amortiguación **sin cambios**.  |
| Iluminación cálida       | `night-lighting.ts`                                                                | Emisión cálida en `site.deck-lights` y resplandor tenue en suelos interiores, sobre los materiales ya clonados.                           |
| Medición de capas        | `use-overlay-insets.ts`                                                            | Generalizado a cuatro bordes; el panel deduce su borde (columna o franja inferior) y una capa puede flotar sin reservar con `--cc-inset`. |
| Datos simulados          | `control-center/demo-data.ts`                                                      | Tipados, sin JSX, con claves i18n. Rotulados «Datos de demostración» en la interfaz.                                                      |
| Tokens, estilos, motion  | `control-center/control-center.css`                                                | Tokens `--cc-*`, material de cristal, componentes, animaciones y responsive. Todo bajo `.cc-root`.                                        |
| Utilidades               | `prototype-control.tsx`, `use-dismiss.ts`, `use-swap.ts`, `icons.tsx`, `format.ts` | Control «próxima entrega», cierre de menús, salida/entrada coordinada del panel, iconografía única e importes.                            |

## 2. Sistema visual

- **Superficies:** negro `#07090d` de fondo; cristal grafito `rgba(13,15,20,.66)` con `blur(18px) saturate(1.2)`, filo superior de 1 px y sombra profunda. Sin cristal (`html.sin-vidrio`) la superficie pasa a casi opaca.
- **Acento azul controlado:** un único grupo (`--cc-accent*`) para selección, pestaña activa, acción principal, progreso y contornos. El brillo se limita a selección y foco.
- **Estados:** ámbar `--cc-attention` (pendiente), cian `--cc-info` (actividad), gris neutro. **Sin verde** como color principal.
- **Luz arquitectónica cálida:** luz principal `#ffe4c4`, contraluz azul tenue, niebla al fondo y emisión ámbar en balizas y suelos. Viñeta CSS para integrar el Shell con la escena.
- **Tipografía:** Figtree variable (la del proyecto). Títulos 22–40 px según vista, cuerpo 13 px, metadatos 11–12 px.
- **Forma:** radios 10/14/20 px y pastillas de 999 px para barras flotantes.
- **Preparado para el futuro:** `.cc-root[data-tone='light']` define el modo claro y el acento se cambia en un solo grupo de tokens. **No se activa**: la dirección aprobada es oscura y el selector lo muestra como próxima entrega.
- **Fase 3.4:** el modo claro está activo y refinado; ver [modo claro 3.4](modo-claro-3.4.md).

## 3. Interacciones

| Acción                                                                                                                       | Resultado                                                                                                                        | Estado            |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| Clic en un edificio (proxy)                                                                                                  | Vuelo de cámara al departamento; panel y título cambian coordinados.                                                             | real              |
| Pasar sobre un edificio                                                                                                      | Su etiqueta se ilumina y el cursor indica selección.                                                                             | real              |
| Avisos de «Atención ahora» y del menú de notificaciones                                                                      | Enfocan Compras, Almacén o Administración.                                                                                       | real              |
| Buscador                                                                                                                     | Filtra los seis departamentos (sin acentos), flechas + Enter enfocan. Escape solo cierra la búsqueda.                            | real              |
| Control (dock), carril, migas, «Volver», Escape                                                                              | Vista general.                                                                                                                   | real              |
| «Ver interior» (Compras)                                                                                                     | Oculta la cubierta (`procurement.roof`) y muestra Solicitudes · 12, Órdenes · 8, Recepción · 3 en nodos reales.                  | real              |
| Pestañas de Compras (clic, ← →, o los puntos 3D)                                                                             | Cambian lista, detalle y proceso.                                                                                                | real (datos demo) |
| «Revisar solicitud»                                                                                                          | Avisa de que es un prototipo y que no se modificó nada.                                                                          | prototipo         |
| Movimiento reducido (menú de apariencia)                                                                                     | Preferencia real de la app: cámara sin vuelo y sin animaciones.                                                                  | real              |
| Organización, Configuración, Perfil                                                                                          | `/mapa`, `/settings/appearance`, `/settings/profile`.                                                                            | real              |
| Aplicaciones, Actividad, Líneas, Flujos, Documentos, Abrir pendientes, Ver cotizaciones, Añadir empresa, modo claro, acentos | Atenuados, `aria-disabled`, aviso «disponible en una próxima entrega».                                                           | próxima entrega   |
| Diagnóstico de la escena                                                                                                     | Pie izquierdo o menú de perfil: los controles técnicos de Fase 2.x intactos (departamentos, cubierta, reserva, órbita, SHA-256). | real              |

Animaciones: aparición escalonada de barras (arriba, izquierda, abajo), panel con salida de 180 ms y entrada con desenfoque, listas escalonadas (40 ms), detalle y proceso con transición, etiquetas que desaparecen al enfocar otro edificio. `prefers-reduced-motion` o la preferencia de la app las anulan todas.

## 4. Responsive

| Ancho                              | Composición                                                                                                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≥ 1280 px                          | Como la referencia. «Atención ahora» flota sobre el cielo sin alejar la cámara; el panel de departamento reserva hasta 440 px.                                                                                       |
| 760–1279                           | Indicadores rápidos ocultos (< 1180), dock compacto, «Atención ahora» plegado a su cabecera (desplegable). Panel de departamento hasta el 40% del ancho.                                                             |
| < 760                              | Sin carril (sus destinos siguen en perfil y dock); marca reducida al logotipo; panel como franja inferior plegable de hasta 38dvh que la cámara reserva; etiquetas como pines con icono (el nombre sigue accesible). |
| Horizontal bajo (< 480 px de alto) | Panel lateral estrecho y título sin migas.                                                                                                                                                                           |

## 5. Validación

- `pnpm check` (Prettier, ESLint, `tsc -b`): **aprobado**.
- `pnpm test`: **72 pruebas aprobadas** (3 nuevas del Shell: panel, pestañas, prototipo, buscador y Escape; insets generalizados).
- `pnpm build`: **aprobado**, GLB verificado (SHA-256 sin cambios). El aviso de tamaño del bundle 3D (≈ 948 kB / 255 kB gzip) es previo.
- `pnpm test:e2e`: **37 aprobadas** (14 del campus, una nueva: «Atención ahora» → Compras → interior → pestañas → regreso, y comprobación de que el encuadre termina antes del panel).
- Inspección visual con Chrome del sistema (WebGL por software) a 1440×900, 1024×768, 390×844 y 820×1180.

Cambios en pruebas existentes: el regreso con el diagnóstico plegado usa «Control» (el antiguo botón suelto «Vista general» pasa a la lista del diagnóstico); las etiquetas secundarias llegan a opacidad 0 en lugar de 0,16; la guía de reserva móvil se apila sobre el panel real; dos pruebas de siete vuelos tienen 60 s porque con SwiftShader y capas con desenfoque superan los 30 s.

**Corrección previa encontrada:** en desarrollo, la etiqueta de Compras salía vacía (también en Fase 2.1). `<Html>` de drei desmonta su raíz durante el render de Fiber bajo StrictMode y el desmontaje diferido vaciaba la primera etiqueta. Ahora las etiquetas se montan un fotograma después; la advertencia de consola desaparece y la prueba nueva comprueba las seis.

## 6. Diferencias respecto a la referencia

- **La escena es un blockout**: volúmenes grises sin mobiliario, vegetación, camiones ni iluminación horneada. La calidez se aproxima con emisión y luces; la riqueza visual de la referencia depende del activo final, no del Shell.
- Sin **profundidad de campo** en Compras (requiere posprocesado, una dependencia nueva) ni **línea de conexión** entre la fila seleccionada y el edificio.
- La cubierta de Compras **no se retira sola** al enfocar (la referencia muestra el interior): conserva la decisión de Fase 2.x y se ofrece «Ver interior».
- Iconos de Lucide equivalentes, no idénticos (Operaciones usa gorro de cocina, como la referencia).
- El encuadre general es el calculado por Codex: deja margen inferior porque incluye el zócalo de la terraza, que con fondo oscuro casi no se ve.
- Panel de Compras algo más estrecho (440 px) para conservar el edificio visible en portátiles.
- En tabletas «Atención ahora» empieza plegado y la etiqueta de Administración puede rozar su cabecera.

## 7. Recomendaciones para la siguiente iteración

1. **Activo:** iluminación horneada o luces emisivas por estancia, mobiliario y vegetación; nodos contractuales para los puntos de interior (hoy se usan los centros de `office-furniture`, `storage-racks` y `dock`).
2. **Cámara:** recalibrar el encuadre general excluyendo el zócalo inferior y valorar un perfil de Compras con cubierta retirada por defecto (decisión de producto).
3. **Posprocesado:** profundidad de campo y bloom suave, si se aprueba la dependencia y su coste en GPU.
4. **Datos:** contrato del ERP para indicadores, avisos y procesos de compra (ver `docs/pendientes-backend.md`) y sustituir `demo-data.ts` por el `DataSource`.
5. **Etiquetas:** resolución de colisiones en pantalla (desplazar o agrupar tarjetas cercanas) y conexión visual panel → edificio.
6. **Rendimiento:** medir en GPU reales el coste de `backdrop-filter` sobre un canvas en movimiento; si hace falta, reducir el desenfoque durante los vuelos.
7. **Modo claro y acentos:** iluminación propia de la escena antes de activar `data-tone='light'`.

## Evolución en Fase 3.1

Este informe y sus capturas conservan la evidencia histórica de Fase 3.0. La Fase 3.1 sustituye las etiquetas informativas por tarjetas seleccionables con resolución de colisiones, amplía las medidas del Shell y elimina el margen superior fijo de etiquetas. Consulta [integración espacial, comparación de encuadres y validación 3.1](integracion-espacial-3.1.md). Las pruebas de navegador de esa fase están pendientes por restricciones del entorno; las 37 aprobadas aquí corresponden exclusivamente a Fase 3.0.
