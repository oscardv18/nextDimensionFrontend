# Fase 3.4 — Modo claro y consolidación del sistema visual

Continúa [Shell 3.0](shell-3.0.md) e [integración 3.3](integracion-3.3.md). Capturas en [`capturas-3.4/`](capturas-3.4/) (`antes-*` es el estado de 3.3).

## 1. Qué se encontró

Fase 3.3 activó `data-tone='light'` redefiniendo solo superficies y texto. Todo lo que el Shell 3.0 había fijado pensando solo en el modo oscuro quedaba igual:

| Elemento                                                        | Problema en claro                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Menús (empresa, avisos, **apariencia**, perfil)                 | Fondo `rgba(16,18,24,.99)` fijo con texto oscuro: **ilegibles**.                            |
| Avisos «próxima entrega» (`data-hint`)                          | Mismo fondo negro con texto oscuro.                                                         |
| Avatar, botón «Mostrar diagnóstico», etapas futuras del proceso | Rellenos negros fijos (`#161c2a`, `rgba(13,15,20,.5)`, `#11141b`).                          |
| Título, migas y pie sobre la escena                             | Sombra de texto negra: halo sucio sobre fondo claro.                                        |
| «4 solicitudes por aprobar», puntos de estado                   | Ámbar `#f2b04f` sobre blanco: **1,8:1**.                                                    |
| Pestaña activa y «Revisar solicitud»                            | Blanco sobre `#4d8dff`: **3,2:1** (también en oscuro).                                      |
| «Ver interior» activo                                           | Solo tinte de acento translúcido: la escena se veía a través del texto.                     |
| Etiquetas y puntos de interior                                  | Colores fijos con un parche final de tono; acento azul escrito literalmente en cada brillo. |

## 2. Tokens

`control-center.css` sigue siendo la única fuente (`.cc-root`, sin sistemas paralelos). Ahora **ningún componente fija colores de un solo modo**: todo valor que cambia entre modos es un token y el bloque claro solo redefine tokens.

| Token nuevo                                                               | Oscuro                      | Claro                                | Uso                                                       |
| ------------------------------------------------------------------------- | --------------------------- | ------------------------------------ | --------------------------------------------------------- |
| `--cc-surface-menu`                                                       | `rgba(16,18,24,.99)`        | `#fbfbfd`                            | Menús y resultados de búsqueda                            |
| `--cc-surface-solid`                                                      | `#0f1116`                   | `#fff`                               | Etapas del proceso, recorte del logotipo, aro de avisos   |
| `--cc-card`, `--cc-card-shadow`                                           | `rgba(255,255,255,.045)`, — | `rgba(255,255,255,.66)`, sombra 1 px | Segundo nivel (detalle, proceso)                          |
| `--cc-track`                                                              | blanco 4,5 %                | tinta 5 %                            | Carril de pestañas                                        |
| `--cc-ghost`                                                              | `rgba(13,15,20,.5)`         | `rgba(255,255,255,.68)`              | Botones sueltos sobre la escena, etiqueta de demo         |
| `--cc-saturate`                                                           | 1,2                         | 1,5                                  | Saturación del cristal                                    |
| `--cc-halo`, `--cc-halo-soft`                                             | sombra negra                | halo blanco                          | Texto directamente sobre la escena                        |
| `--cc-hint-bg/-text/-line`                                                | negro / claro               | tinta `#1b1e27` / claro              | Avisos invertidos                                         |
| `--cc-accent-fill`, `--cc-on-accent`, `--cc-accent-gradient`              | `#2563eb`, blanco           | `#2563eb`, blanco                    | Rellenos con texto (pestaña, acción principal)            |
| `--cc-attention-text`                                                     | `#f2b04f`                   | `#8f5200`                            | Cifras y textos de estado (el punto usa `--cc-attention`) |
| `--cc-disabled`                                                           | 0,5                         | 0,6                                  | «Próxima entrega»                                         |
| `--cc-label-*` (superficie, línea, texto, icono, sombra), `--cc-stem-top` | cristal grafito             | cristal blanco 86 %                  | Etiquetas espaciales                                      |

Ajustados en claro: superficie `rgba(248,249,252,.82)` (antes `.72`: la escena clara competía con el texto), texto secundario `#3f4555` y terciario `#555c6d`, acento `#2563eb` y texto de acento `#1d4ed8` (los mismos que el acento azul claro de `tokens.css`), información `#1f9ccc`, sombras más frías y cortas. En oscuro solo cambian dos valores, ambos por contraste: el texto terciario (`#8a93a3` → `#959eae`) y el relleno de la acción principal y de la pestaña activa, que pasa de `#4d8dff→#2f72f0` a `--cc-accent-gradient` sobre `#2563eb`.

**Derivados del acento.** `--cc-accent-soft/-line/-glow` y todos los brillos de etiquetas, selección, progreso y pulsos salen de `color-mix()` sobre `--cc-accent`. Un acento se define con cuatro valores (`accent`, `accent-fill`, `accent-text`, `on-accent`).

**Acentos preparados, sin activar.** `.cc-root[data-accent='purple'|'red']` (y sus variantes claras) toman los tonos de los acentos globales de `tokens.css`, con un relleno elegido para que el texto blanco cumpla AA (púrpura `#6d28d9` 7,1:1, rojo `#c81e4a` 5,6:1). Nada asigna todavía `data-accent` a `.cc-root` y «Color de acento» sigue como «próxima entrega».

## 3. shadcn/ui y Radix

- Correspondencia: `tokens.css` ya mapea `--background`, `--popover`, `--primary`, `--ring`… a los tokens de Arxnet (`--s1`, `--vidrio-fuerte`, `--acento`…), y Tailwind v4 los recibe con `@theme inline`. Los 12 componentes de `src/design/ui/` siguen ese sistema y no se modifican (regla de no reformatear).
- **Ningún componente shadcn se usa dentro del Shell espacial**: sus menús son propios (`use-dismiss.ts`). Un portal de Radix se monta en `<body>`, fuera de `.cc-root`, y no heredaría `--cc-*`; usar `DropdownMenu` aquí obligaría a duplicar el cristal en el tema global. Se mantiene la decisión y se documenta en el propio hook.
- Los portales de Radix del resto de la app heredan el tema porque `data-theme` vive en `<html>`; el Shell sigue la misma apariencia resuelta (`useAppearance`), así que un diálogo de Radix abierto desde el campus queda en el mismo modo.
- No se añaden componentes shadcn ni dependencias.

## 4. Componentes modificados

| Archivo                             | Cambio                                                                                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-center/control-center.css` | Tokens nuevos, bloque claro completo, presets de acento, colores fijos sustituidos por tokens. Etiquetas con material propio (`--cc-label-*`). Viñeta clara que aclara arriba y abajo. |
| `control-center/use-dismiss.ts`     | Teclado de los menús: foco inicial en la opción marcada, ↑ ↓ Inicio Fin, Escape cierra y devuelve el foco al botón.                                                                    |
| `campus.css`                        | Enlace y barra del diagnóstico con tokens y halo.                                                                                                                                      |
| `campus-page.test.tsx`              | Prueba nueva del teclado del menú de apariencia.                                                                                                                                       |

Sin cambios: estructura y componentes del Shell, `applyTheme`, `campus-theme*.ts`, cámaras, anclas, proxies, `adaptive-labels.tsx` (colisiones, proyección y prioridades), GLB 0.3.0 (SHA-256 `4ce11ad8…5c47`, verificado en el build), Blender.

## 5. Panel de Compras, etiquetas y microinteracciones

- **Jerarquía en tres niveles en claro:** cristal del panel → tarjetas blancas (detalle, proceso) con sombra de 1 px → carril gris de pestañas. En oscuro el segundo nivel conserva el velo blanco tenue.
- **Selección:** la fila activa añade una marca lateral de acento de 3 px, para que no dependa solo del tinte de fondo. La etapa actual del proceso va en negrita, y las etapas futuras usan un relleno opaco del modo en lugar de negro.
- **Pestañas:** el contador de las inactivas usa el texto terciario en vez de opacidad, y las inactivas oscurecen el texto al pasar por encima.
- **Desplazamiento:** el cuerpo del panel tiene una barra fina con el color de línea del modo.
- **Etiquetas:** cristal blanco al 86 % en claro, con una sombra fría corta. Al pasar por encima o al seleccionar, el icono toma el tinte del acento. El tallo va de tinta a acento y el punto lleva un aro del color de la tarjeta, así que se lee sobre suelos claros y oscuros.
- **Menús:** opción marcada en negrita con la marca en acento, y foco por teclado con anillo interior.
- **Transición de apariencia:** se usa la que ya existía (`transicion-tema`, 260 ms sobre colores) y el perfil 3D (320 ms). Con movimiento reducido ambas son inmediatas.

## 6. Contraste (WCAG 2.2 AA)

Medido componiendo la superficie translúcida sobre tres fondos de escena: blanco, gris verdoso `#7a8a6a` y estructura oscura `#2a2f38`. El oscuro es el peor caso para el claro; el desenfoque en la práctica promedia el fondo.

| Modo   | Par                                               | Peor caso                 | Antes     |
| ------ | ------------------------------------------------- | ------------------------- | --------- |
| Claro  | Texto principal / panel                           | 12,3:1                    | —         |
| Claro  | Texto secundario / panel                          | 6,5:1                     | 4,7:1     |
| Claro  | Texto terciario / panel                           | 4,6:1                     | 3,4:1     |
| Claro  | Cifra de atención / panel                         | 4,2:1 (5,96 sobre blanco) | 1,3:1     |
| Claro  | Texto de acento / panel                           | 4,6:1                     | 4,3:1     |
| Claro  | Blanco / relleno de acento (centro del degradado) | 4,8:1                     | 3,2:1     |
| Claro  | Texto secundario / menú                           | 9,3:1                     | ilegible  |
| Claro  | Aviso emergente                                   | 15,3:1                    | ilegible  |
| Claro  | Nombre / estado de etiqueta                       | 13,4 / 7,1:1              | — / 5,4:1 |
| Oscuro | Texto terciario / panel sobre muro iluminado      | 4,5:1                     | 3,9:1     |
| Oscuro | Blanco / relleno de acento                        | 4,8:1                     | 3,2:1     |

Los controles «próxima entrega» (0,6 de opacidad, unos 3,2:1) son controles deshabilitados y la norma los exime; se mantienen distinguibles y su nombre accesible incluye «próximamente». El peor caso de la cifra de atención en claro (4,2:1) se da solo si una estructura negra queda completa bajo el texto; sobre la escena real, que se ve desenfocada, supera 4,5:1.

## 7. Responsive y revisión visual

Revisión con Chrome del sistema y WebGL por software, en claro y oscuro: 1920×1080, 1440×900, 1366×768, 820×1180 (tableta) y 390×844 (móvil). Se revisaron vista general, Compras, interior, menú de apariencia y avisos. No se cambió ninguna distribución: los puntos de corte de 3.0 funcionan igual en claro.

Con WebGL por software, las animaciones CSS de entrada pueden quedarse en el fotograma 0 mientras el compositor está saturado (el panel y los menús se ven con opacidad 0). Es un artefacto del entorno: `getAnimations()` muestra `currentTime: 0` con la línea de tiempo avanzando. Las capturas se toman con las animaciones finalizadas. Conviene confirmarlo con GPU real.

### Pruebas

| Comprobación    | Resultado                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`    | Prettier, ESLint y TypeScript aprobados                                                                                                                                 |
| `pnpm test`     | 110 aprobadas en 13 archivos (una nueva: teclado del menú de apariencia)                                                                                                |
| `pnpm build`    | Aprobado; activo 0.3.0 verificado; aviso de chunk previo                                                                                                                |
| `pnpm test:e2e` | 28 aprobadas, 19 fallidas. Todas las fallidas son del campus y esperan a que la cámara se asiente (`data-camera`, `data-manual-settled`) o agotan el plazo de la prueba |

Causa de las 19: con WebGL por software el GLB 0.3.0 con sombras rinde unos 2 fotogramas/s (`data-frames` avanza de 12 a 22 en 5 s), y los vuelos avanzan por fotograma. Ninguna falla en un selector, un texto o un estilo. Pasan las del campus que no vuelan (sin WebGL, GLB corrupto, movimiento reducido, canvas 320×568 y 640×360) y todas las de la app. Es la primera vez que la batería se ejecuta tras 3.2 y 3.3 (allí estaba bloqueada) y con 0.2.0 pasaba entera. Hay que repetirla con GPU real antes de dar por buenos los vuelos; no se suben los plazos para ocultarlo.

## 8. Diferencias con la referencia y pendientes

- La referencia aprobada solo muestra el modo oscuro. El claro sigue su composición y su lenguaje (cristal, una sola línea de acento, ámbar para lo pendiente), pero no tiene una referencia propia que comparar.
- El perfil de tema 3D sigue siendo provisional (1.0.0): en claro, la escena es luminosa y de bajo contraste, y los árboles verdes dominan las zonas vacías. La legibilidad del Shell ya no depende de eso, pero el equilibrio final requiere ajustar el perfil con el productor.
- Sin medición del coste de `backdrop-filter` con saturación 1,5 en GPU reales.
- «Ver cotizaciones» y las demás «próxima entrega» siguen atenuadas, como manda la regla 2.

## 9. Recomendaciones

1. Revisar el modo claro en Brave/Chrome con GPU real y en un portátil con pantalla brillante. Si el cristal se ve lechoso, bajar `--cc-saturate` antes que la opacidad.
2. Ajustar con el productor el perfil claro de la escena: algo más de contraste en el suelo y menos exposición en las cubiertas de madera.
3. Cuando el acento sea configurable, asignar `data-accent` en `.cc-root` desde el mismo almacén de apariencia. Los tokens ya están listos.
4. Si algún día el Shell necesita diálogos de Radix, crear un contenedor de portal dentro de `.cc-root`, para que hereden `--cc-*`, en lugar de copiar el cristal en el tema global.
