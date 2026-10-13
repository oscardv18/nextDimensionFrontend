# Fase C.2 — Integración experimental de company-world, variante B

Fecha: 2026-10-13. Estado: **integración comprobada sin WebGL; aprobación visual y rendimiento pendientes**. `campus-pilot@0.4.0` continúa como predeterminado. No se inicia la siguiente fase artística.

## Activación y reversión para revisión

Ejecutar `pnpm dev` y abrir en Brave:

```text
http://localhost:5173/campus-3d?world=company-world&fov=20
http://localhost:5173/campus-3d?world=company-world&fov=15
```

Para desactivar, abrir **`http://localhost:5173/campus-3d`** sin parámetros. La selección no se guarda en localStorage; se elige un bundle completo al cargar y no se intercambia GLB dentro del canvas montado. Producción ignora el flag `world`; tampoco acepta FOV experimental para el campus antiguo. Para comparar, usar dos pestañas del mismo viewport, con el mismo tema y perfil; ambas usan el mismo Shell.

Se conservan opciones de calidad de desarrollo:

```text
/campus-3d?world=company-world&fov=20&quality=high
/campus-3d?world=company-world&fov=20&quality=balanced
/campus-3d?world=company-world&fov=20&quality=low
```

El formulario de diagnóstico conserva mundo y FOV al cambiar calidad. Los controles de apariencia existentes alternan oscuro/claro. No usar flags de calibración 3.7-B al comparar la composición base: añadirían variables de iluminación ajenas a esta fase.

## Inspección, procedencia e integridad

Se leyeron `CLAUDE.md`, convenciones de capas/apariencia, migración frontend y documentos del productor `company-world-migration.md`, `company-world-handoff-c1.md` y sus anotaciones reales. Se revisaron selector de bundle, loader, bounds, perfiles/cámara temporal, entrada manual, temas, detalle, hotspots y probe.

El paquete real **no está en exports ni en el catálogo**: procede de `/home/oddv/Renders/arxnet-3d/validation/reports/phase-4c/handoff-c1/`. Se verificaron los ocho registros de su `SHA256SUMS` antes de copiar. Es c1, variante B, estado blockout, activo 0.1.0, contrato 1.0.0 y perfil provisional 1.0.0. No se integró el anterior b1 ni la candidata artística campus 0.5.0.

Copias literales:

- GLB: `public/assets/arxnet.scene.company-world/0.1.0/asset.glb`.
- Manifest/build/themes/cámaras/aceptación/validación/README/hashes: `src/features/campus/assets/company-world/0.1.0/`.
- [Procedencia, tamaños y hashes](provenance-company-world-c1.json).

GLB: **691.784 bytes**, SHA-256 `960b51fd24a8eb56fcdc835f3bd744276e52f79d1920553589ff8b7a343e467f`. No se modifica el paquete fuente, Blender ni copias anteriores. `assets:verify` comprueba copias, identidad, versión, variante, 199 nodos, jerarquía, primitivas, materiales e interacciones, además de las verificaciones anteriores.

El contrato compartido no significa geometría intercambiable. c1 tiene grupos de cubierta/fachada, 17 materiales distintos, otro emplazamiento y anclas diferentes. Se conservaron las seis identidades semánticas departamentales, no se exige que los 99 nodos arquitectónicos antiguos existan en este activo nuevo.

## Adaptaciones y conservación del consumidor

| Dependencia anterior                             | Adaptación aislada                                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Bundle inferido solo desde JSON 0.4.0            | Tipos estructurales para manifest/build/perfil; bundle candidato separado; selector de desarrollo                        |
| General usa IDs arquitectónicos 0.3.0            | Mundo nuevo usa sus siete `overviewFramingNodeIds`: seis hits y pabellón; el antiguo conserva su algoritmo               |
| Caja departamental por mallas antiguas           | Mundo nuevo usa caja real de cada hit, validada por productor y pruebas; estable con capas abiertas/cerradas             |
| FOV 45° y direcciones distintas por departamento | Nuevo usa C20/C15 y dirección constante declarada; distancias/objetivos se calculan con `fitCamera` y regiones del Shell |
| Cubierta exclusiva de Compras                    | Estado existente `roofHidden` habilita revelar cualquier departamento del nuevo mundo                                    |
| Hotspots de Compras con tres nodos antiguos      | Desactivados solo en company-world: esos nodos no existen y `zones` está vacío                                           |
| Catorce luces locales fijadas en diagnóstico     | El contador usa longitud real del rig; c1 tiene cero                                                                     |
| Detalle progresivo con categorías anteriores     | En el nuevo mundo las capas declaradas gobiernan los grupos vacíos; no se aplica la clasificación antigua                |

No se reemplaza el controlador de cámara ni el de entrada. Se conservan vuelos temporales de 1.200 ms, interrupción desde posición visible, retorno exacto, arrastre con umbral, zoom al cursor/plano horizontal, tacto, movimiento reducido y selección por seis proxies. El pabellón es visual y no seleccionable; las mallas visuales mantienen raycast desactivado. Etiquetas se proyectan desde las nuevas anclas usando el algoritmo existente.

El canvas sigue ocupando el viewport completo. No se cambian estilos, estructura o distribución del Shell, ni se crean rutas. El control existente «Ver interior» aparece para cualquiera de los seis departamentos del nuevo activo; el antiguo mantiene su comportamiento de Compras. El diagnóstico conserva acciones accesibles.

## Sistema de capas

`reveal-layers.ts` valida propietarios, descendencia e IDs de `revealLayers` y aplica `visibilityStates`. No genera listas paralelas de nodos ni modifica transformaciones.

| Estado                          | Seleccionado                                                           | Vecinos                                           |
| ------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| General                         | Cubiertas/fachadas visibles; contornos ocultos                         | Cerrados                                          |
| Selección                       | Cubierta y fachada frontal ocultas; interior visible; contorno visible | Cubiertas/fachadas restauradas; contornos ocultos |
| «Ver interior» al estar abierto | Restaura cubierta y fachada frontal; conserva selección/panel          | Sin cambios                                       |
| Regreso / Escape                | Todos cerrados; ningún contorno residual                               | Restaurados                                       |

El interior permanece bajo la cubierta en general según la tabla del productor: no se oculta en Alta/Equilibrada. Baja oculta interiores de vecinos cerrados, pero **conserva siempre el interior del seleccionado**. No se aplica una reducción global que vacíe el foco. Se conserva suelo/contexto como soporte visual; no se oculta todo `environmentNodeIds` con la sugerencia `lowQuality.environment=false` sin revisión visual.

Las capas cambian discretamente, sin trasladar edificios, sin fades sobre materiales compartidos y sin introducir defines de transparencia. La cámara mantiene su transición suave. Cambio rápido A→B restaura A y revela B; cierre/retorno restauran cubiertas y fachadas. Cada cambio invalida el mapa de sombras cacheado. En movimiento reducido, ambos comportamientos llegan inmediatamente al estado final.

`focused` se usa también mientras se explora manualmente una selección: el interior queda revelado. En c1 `detail` y `zones` están vacíos; la diferencia declarada de `explore` solo afecta a esas zonas reservadas. No se implementan interacciones de zonas inexistentes. No hay controles independientes para animar fachadas y cubiertas: el control de interior opera ambas capas; valorar esa separación después de comprobar el caso real.

## FOV y comparación geométrica

Se recomienda **20° como punto inicial de revisión**, no como aprobación definitiva. Da más perspectiva y menor distancia que 15°, facilita lectura de volumen y reduce la ampliación del rango de navegación. Ambos utilizan dirección del productor `[-0.6409, 0.4226, 0.6409]`; no se copian sus posiciones/objetivos de referencia, pensados para otro viewport/lens shift.

Resultados calculados con GLB real y regiones de prueba (top 64, bottom 90, left 70 en escritorio / 0 móvil). Son **proyecciones analíticas, no capturas del navegador ni dimensiones reales medidas del Shell**:

| Viewport  | Distancia general C20 | Distancia general C15 |
| --------- | --------------------- | --------------------- |
| 1440×900  | 200,02 m              | 270,21 m              |
| 1920×1080 | 192,22 m              | 259,65 m              |
| 390×844   | 648,61 m              | 875,50 m              |

Los 42 encuadres (dos FOV × tres tamaños × general/seis departamentos) mantienen las esquinas dentro del área útil; foco departamental reserva panel. Se verifica que abrir capas no altera cajas/posición calculada y que regresar recupera exactamente general. Datos completos: [company-world-framing-c2.json](company-world-framing-c2.json).

En móvil ambos necesitan alejarse para incluir el conjunto: la silueta general ocupará menos altura. No compensarlo aumentando escala ni escoger C15 únicamente por su error menor contra el mockup. Revisar lectura de departamentos, cubiertas y etiquetas en Brave antes de decidir.

Se detectó que el límite máximo antiguo de zoom, proporcional a la diagonal navegable, puede ser menor que la cámara general C15 en móvil. Solo para el nuevo bundle se permite al menos 1,6 veces la distancia general calculada para el viewport; evita un salto de acercamiento al primer gesto. Los límites horizontales siguen derivados de arquitectura/pabellón, no suelo/contexto.

Recorte inicial experimental: near 0,5 / far 10.000 para el mundo nuevo; antiguo sigue 0,1 / 1.500. Permite comprobar encuadres estrechos y zoom sin truncar el mundo, pero el rango amplio necesita inspección de z-fighting y ajuste posterior si aparece. Las sugerencias near/far del productor son para sus encuadres de referencia y no se aplican globalmente al consumidor.

## Temas y rendimiento

Se reutiliza `CampusTheme`, `useAppearance`, Neutral/sRGB, PMREM y sombras cacheadas. Perfil propio de blockout: oscuro/claro con patches autorizados, cero luces puntuales, sin texturas ni efectos. Cambiar tema conserva materiales y escena, y respeta 320 ms/movimiento reducido. No se intentan materiales o luz finales del mockup.

| Estadística estática | Campus 0.4.0 | Company c1/B                                 |
| -------------------- | ------------ | -------------------------------------------- |
| Bytes GLB            | 3.159.924    | 691.784                                      |
| Materiales           | 26           | 17                                           |
| Triángulos visuales  | 60.398       | 11.304 (11.376 con proxies)                  |
| Primitivas visuales  | 110          | 134; 128 visibles en general según productor |
| PNG                  | 4            | 0                                            |
| Luces locales        | 14           | 0                                            |

Menos triángulos no demuestra mejor rendimiento: **más primitivas** pueden aumentar llamadas de dibujo. Las cifras de general del productor son estadísticas del activo, no valores `gl.info` observados. Se conservan perfiles DPR 1,5/1,25/1 y sombras 2048/1024/512, con sombras arquitectónicas en todos. No hay densidad de vegetación que reducir en el blockout ni nuevo menú público de calidad.

El probe ahora informa `assetId` además de versión. Se conserva separación entre métricas de frames/CPU wall/contadores, estimaciones de buffers/texturas y GPU ms/bytes residentes no disponibles. No se han medido FPS ni GPU del nuevo mundo. Las máscaras de shaders y blur del Shell pueden seguir costando aunque no haya texturas GLB.

Build: visor aproximadamente 981,25 kB / 266,30 kB gzip; metadata/calidad compartida 129,21 / 17,20 kB frente a 74,17 / 10,07 anteriores. El bundle sincronizado añade metadatos del candidato incluso a esta compilación; su GLB solo se solicita al activar el flag en desarrollo. Revisar carga diferida de metadata antes de producción si se conservan más candidatos. Se mantiene el aviso >500 kB y no se eleva el límite.

## Validación real y pendiente

| Verificación                  | Resultado                                                    |
| ----------------------------- | ------------------------------------------------------------ |
| Paquete fuente y copias       | Hashes aprobados, bundle versionado independiente            |
| TypeScript, ESLint y Prettier | Aprobados                                                    |
| Unitarias                     | 139 aprobadas en 19 archivos; 133 anteriores + 6 nuevas      |
| Build e integridad            | Aprobados con exit 0; ambos activos verificados              |
| E2E C.2                       | 37 casos descubiertos; intento bloqueado al iniciar servidor |
| Capturas WebGL / FPS / GPU    | No obtenidos, aprobación visual pendiente                    |

Las nuevas unitarias cargan el GLB real con GLTFLoader y comprueban flag/reversión, hash/jerarquía, metadatos de capas, seis raycasts, estabilidad de transformaciones/cajas, visibilidad por calidad, temas e identidad material, proyecciones y primer gesto sin salto por límites. Como en pruebas anteriores, jsdom simula la decodificación de imágenes; no renderiza píxeles WebGL.

Se intentó Playwright con `/usr/bin/brave`, filtrando el caso C20/oscuro/Alta/1440. El servidor configurado no pudo arrancar; no se llegó a renderizar el campus. En esta sesión el entorno sigue restringiendo el servidor local, como las fases anteriores. No se aumentan timeouts ni se desactivan casos. Las 37 nuevas preparan las 36 combinaciones de FOV/tema/calidad/viewport, general/Compras/Almacén, cierre/retorno, screenshots y muestras activas; la adicional comprueba exploración, cambios rápidos, movimiento reducido y reversión.

Se inspeccionaron imágenes **Blender** del productor de general oscuro y Compras abierta clara. Muestran volumen de Almacén y cortes de interior previstos, pero no validan composición dentro del Shell ni el vidrio WebGL. No se presentan como capturas del frontend.

Ejecutar fuera del entorno restringido:

```sh
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/brave pnpm exec playwright test e2e/company-world.spec.ts
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/brave pnpm exec playwright test e2e/renderer-calibration.spec.ts --grep 'referencia real'
```

La segunda genera referencias del campus antiguo dentro del mismo Shell. Comparar tema/tamaño/perfil iguales. Confirmar GPU mediante renderer del probe y `brave://gpu`; registrar software por separado. No usar el promedio de sesiones hardware/software. Guardar p50/p95/máximo, draw calls, triángulos, resolución, programas/texturas y estimaciones; no llamar a esas estimaciones memoria GPU medida.

## Problemas y pendientes para dirección artística

1. Aprobar composición C20/C15 dentro del Shell, especialmente móvil, panel abierto y relación visual del pabellón no interactivo. 20° sigue siendo recomendación provisional.
2. Revisar z-fighting, suelo lejano y vidrio por la mayor distancia y rango de recorte; confirmar tacto/pan/zoom cercano y vuelos interrumpidos.
3. Los interiores son blockout, rótulos vacíos y zonas/detalle sin contenido. No reconstruir los hotspots antiguos con coordenadas inventadas.
4. Los materiales de acento siguen los colores provisionales del perfil; no se conecta todavía un selector azul/púrpura/rojo que el Shell mantiene pendiente. Acordar el binding semántico después de composición.
5. El techo/fachada cambian sin fade; evaluar percepción y decidir si se requieren transiciones de capas y controles independientes. No habilitar alphaHash u otras técnicas sin medición.
6. Verificar sombras cuando se abren capas y lectura interior en Baja. La sugerencia de ocultar todo entorno o todo interior en ese perfil se mantiene deliberadamente limitada.
7. Medir GPU real y software; no aceptar rendimiento por estadísticas de Blender o unitarias.

Las anotaciones de c1 se consumen como metadata experimental, no formalizan contrato 1.1.0 ni esquema de temas 1.1.0. Se documentan las diferencias respecto al productor en el plan de migración. No publicar el activo en su repositorio ni cambiar el predeterminado hasta aprobación explícita.
