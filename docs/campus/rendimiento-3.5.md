# Fase 3.5 — Rendimiento, cámara temporal y estabilidad WebGL

## Diagnóstico previo y evidencia

Se revisaron renderer, cámaras, resorte, entrada manual, etiquetas, `CampusTheme`, PMREM, materiales, perfiles del productor, sombras, luces interiores, regiones del Shell y sus filtros. Se leyeron los informes 3.2, 3.3 y 3.4 y los 19 contextos de error disponibles. La línea base volvió a aprobar `pnpm check` y las **110 pruebas unitarias** antes de los cambios.

| Hallazgo                                       | Evidencia y alcance                                                                                                                                                                      |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La cámara descartaba tiempo                    | `advanceSpring` limitaba delta a 0,05 s. A 2 FPS cada frame real tarda 0,5 s: se pierde el 90 % del tiempo. La fórmula era temporal, pero su límite la hacía dependiente de la cadencia. |
| Las etiquetas también tardaban más a pocos FPS | Su suavizado limitaba delta a 0,05 s; el estado `data-labels-settled` podía demorarse aun después del vuelo.                                                                             |
| Sombras regeneradas durante navegación         | `gl.shadowMap.autoUpdate` estaba activo. Three regenera el mapa en cada render. La cámara se mueve, pero edificios, vegetación y dirección de luz permanecen estáticos durante un vuelo. |
| Una sola luz con sombras                       | Direccional principal, mapa 2048² y PCF suave. Las 14 PointLight interiores, hemisferio y relleno no proyectan sombras. No son 14 mapas de sombra.                                       |
| Costes adicionales posibles                    | PBR, PMREM, 14 luces locales, cristaleras, píxeles del suelo y filtros CSS. Su importancia relativa requiere comparación real; no se atribuye todo a triángulos.                         |
| FPS históricos                                 | El informe 3.4 observó aproximadamente 2 FPS en software mediante `data-frames`. No es una medición nueva de esta fase.                                                                  |

La política de sombras se verificó también en `node_modules/three/src/renderers/webgl/WebGLShadowMap.js`: retorna sin renderizar cuando `autoUpdate=false` y `needsUpdate=false`. En `WebGLRenderer.js`, `info.reset()` ocurre **después** del pase de sombras; por eso los contadores del pase principal no sirven para contabilizar por sí solos todo el trabajo.

El blur aparece en superficies `.cc-glass`, etiquetas y menús/avisos mediante `backdrop-filter`. No se cambia su apariencia predeterminada. El layout espacial usa refs y escrituras DOM, no estado React por fotograma; sus medidas se invalidan con ResizeObserver. El hook de regiones compara resultados antes de actualizar React. No hay evidencia de que renders de React sean la causa dominante. El cambio de tema tampoco vuelve a parsear el GLB.

## Análisis del activo

[Inventario reproducido desde el JSON del GLB](geometry-analysis-3.5.json):

| Recurso                                                 | Cantidad                                          |
| ------------------------------------------------------- | ------------------------------------------------- |
| Nodos / mallas                                          | 99 / 79                                           |
| Mallas visuales / proxies                               | 73 / 6                                            |
| Triángulos totales / visuales / proxies                 | 19.454 / 19.382 / 72                              |
| Materiales                                              | 23                                                |
| Imágenes PNG incrustadas / descriptores glTF de textura | 4 / 9                                             |
| Vegetación                                              | Dos mallas: copas 8.740 triángulos, troncos 1.056 |
| Mallas visuales transparentes                           | 8                                                 |
| Candidatos a proyectar sombras en Alta                  | 64, con 18.300 triángulos                         |
| Candidatos en Baja                                      | 62, con 8.504 triángulos                          |

Las cifras de candidatos son **inventario estático**, no draw calls medidos: el frustum de sombras puede descartar objetos. No hay referencias de mesh compartidas entre nodos. La vegetación ya está agrupada en dos primitivas/mallas: convertirla a instancias no reduciría significativamente los draw calls actuales. Su geometría sí constituye aproximadamente la mitad de los triángulos visuales.

Cuatro imágenes no equivalen a cuatro texturas residentes: los descriptores, canales, color spaces y PMREM pueden generar otros recursos. Se informa el contador real de Three cuando hay navegador.

No se modifica el GLB, su contrato, geometría, identificadores, archivos Blender ni perfiles de tema copiados. El SHA-256 sigue siendo `4ce11ad8dc6fd67264d77b35b2feefa87d2c49ac7c4085bb4f87d515eaaa5c47`. Los cinco nodos de entorno siguen excluidos de los límites navegables.

## Corrección de cámara

`CameraFlight` es un segmento matemático del **controlador existente**, sin cámara, controles o loop propios. Los vuelos guiados usan un reloj monotónico (`performance.now`) y duración de **1.200 ms**, con interpolación quintic de velocidad/aceleración nulas en extremos. El reloj empieza al recibir el objetivo, sin contar el reposo previo del canvas demand.

Cada frame muestrea la posición correspondiente al tiempo real; al alcanzar el final copia exactamente posición y target y publica el estado asentado. A 2 FPS se alcanza el destino en el primer frame posterior a 1.200 ms, normalmente a 1.500 ms, no después de un número fijo de frames. El comienzo inicial y movimiento reducido aplican el objetivo inmediatamente.

Una nueva selección toma la posición/target **visibles actuales**, cancela la orden anterior y empieza otro segmento. Gana la última selección; no se publica como asentado un destino obsoleto. No se conserva velocidad de vuelo entre segmentos: se reinicia con suavizado desde el punto visible, sin salto de posición. Una entrada manual cancela el vuelo y utiliza el mismo controlador y target.

La exploración conserva su resorte analítico y límites, pero ya no descarta delta. Su reloj se reinicia al comenzar una entrada tras reposo, evitando consumir el intervalo inactivo. Las etiquetas usan su exponencial temporal completo. No cambia ningún encuadre, dirección, distancia objetivo o reserva aprobada.

Si el hilo/GPU bloquea varios segundos no es posible mostrar frames intermedios: al recuperarse se muestra la posición temporal válida o el destino exacto. Se evita prolongar artificialmente el vuelo y acumular velocidades inestables; **no se promete fluidez visual a 2 FPS**.

## Optimización de sombras

El mapa pasa a ser cacheado. Se solicita actualización al montar, cambiar la dirección de luz durante un tema y ocultar/restaurar cubierta. La cámara, zoom, arrastre y etiquetas no invalidan sombras estáticas. Durante la transición de iluminación el mapa sí se actualiza para seguir la dirección cambiante. El cache se libera y restaura configuración al desmontar.

Los cristales/proxies no proyectan ni reciben sombras; suelo ampliado recibe pero no proyecta. Alta y Equilibrada mantienen los emisores arquitectónicos y vegetación. Baja omite **solo la proyección de los dos nodos de vegetación**, no su visibilidad ni las sombras arquitectónicas. No se retiran sombras interiores por una suposición sin evidencia visual.

Beneficio verificable: se elimina la solicitud de regeneración por vuelo en una escena estática. Las pruebas comprueban las invalidaciones y reposo. **No hay medición nueva de FPS, ms GPU o ahorro de tiempo real**; el muestreo de sombras sobre los materiales permanece y puede seguir siendo costoso.

## Iluminación y calidad

Se conservan las intensidades, posiciones reales, materiales emisivos, hemisferio, relleno y PMREM del perfil. Las 14 luces permanecen para mantener el programa estable al alternar tema. Su coste se investiga con una opción de diagnóstico que pone su intensidad a cero conservando la emisión. Ese cambio no forma parte del comportamiento predeterminado y no garantiza que el compilador elimine su coste.

| Perfil                                    | DPR máximo | Mapa de sombras | Filtro    | Sombras de vegetación |
| ----------------------------------------- | ---------- | --------------- | --------- | --------------------- |
| Alta (predeterminado, también producción) | 1,5        | 2048²           | PCF suave | Sí                    |
| Equilibrada                               | 1,25       | 1024²           | PCF suave | Sí                    |
| Baja                                      | 1          | 512²            | PCF       | No                    |

Todos conservan geometría, materiales PBR, interiores, entorno, temas, cubiertas y selección. El DPR efectivo depende del dispositivo; con DPR nativo 1 la reducción de ese límite no cambia la resolución. Equilibrada reduce un 75 % los texeles del mapa respecto a Alta y Baja un 93,75 %: es comparación de configuración, **no ahorro GPU medido**.

No hay adaptación automática, detección por OS ni menú público. Los perfiles permanecen opt-in de desarrollo. Se aplican al recargar para evitar destruir/recrear mapas y compilar variantes durante una interacción. Una futura adaptación debería usar ventanas de p95 bajo actividad real, calentamiento separado, histéresis y tiempos mínimos de permanencia; no el FPS de una escena demand en reposo.

## Instrumentación de desarrollo

Solo se monta `PerformanceProbe` con `import.meta.env.DEV`. Los indicadores de carga se recogen una vez; las muestras usan una ventana acotada de 120 intervalos. Se publica JSON como máximo cada 500 ms, sin estado React por frame. La UI lee el snapshot al pedirlo. No hay loop permanente añadido: la muestra opt-in solicita frames durante cinco segundos y vuelve a reposo.

| Campo                                                             | Naturaleza                                                                                                                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `measured.frame`                                                  | Intervalos reales entre renders durante actividad/muestra; FPS, media, p50, p95, máximo y número de muestras. No FPS de reposo.                                          |
| `renderCpuWall`                                                   | Tiempo de pared de callbacks/render JS; no ms GPU. Puede incluir bloqueos del driver en software.                                                                        |
| `shadowCpuWall`, `shadowPasses`, `shadowCalls`, `shadowTriangles` | Tiempo CPU y contadores del pase de sombras interceptado. No duración GPU. Las llamadas/triángulos son del último frame; pases desde inicio de muestra.                  |
| `calls`, `triangles`, geometrías/texturas/programas               | Contadores de Three tras render principal, separados de sombras.                                                                                                         |
| `canvas`                                                          | Resolución física efectiva y DPR del renderer.                                                                                                                           |
| `loadTiming`                                                      | Fetch, parse/preparación y total hasta escena lista; no carga total de shaders/texturas a GPU.                                                                           |
| `data-transition`                                                 | Duración configurada y tiempo transcurrido del vuelo.                                                                                                                    |
| `estimated`                                                       | Buffers fuente y texturas bajo supuesto RGBA8/mipmaps; inventario estático. No memoria GPU residente. Excluye mapas de sombras, PMREM, framebuffer, compresión y driver. |
| `unavailable`                                                     | Ms GPU, bytes GPU residentes, coste temporal aislado de transparencia y del compositor/blur.                                                                             |
| `renderer`                                                        | Información expuesta por WebGL; puede no estar disponible. No gobierna calidad automáticamente.                                                                          |
| Posprocesado                                                      | Desactivado, cero pases. Bloom sigue opcional y no implementado.                                                                                                         |

Uso: **Mostrar diagnóstico → Rendimiento (desarrollo)**. Elegir perfil y opciones, aplicar/recargar, esperar escena, pulsar Medir durante 5 segundos y leer después las métricas. Los controles conservan i18n es/en. También es posible abrir:

```text
/campus-3d?quality=balanced
/campus-3d?quality=high&shadows=off
/campus-3d?quality=high&interiorLights=off
/campus-3d?quality=high&transparency=off
/campus-3d?quality=high&blur=off
```

Las opciones `off` son comparaciones aisladas de desarrollo. Cristaleras se ocultan solo en ese experimento; el perfil normal las conserva. El blur se desactiva mediante un atributo que solo se emite en desarrollo. Los parámetros de URL se ignoran en producción. El contenido del probe y sus controles no aparecen en el JS de producción verificado.

Cambiar una variable cada vez, conservar viewport y tema y repetir muestras calentadas. Comparar distribución p50/p95/máximo, no solo FPS medio. Registrar el renderer para distinguir software de GPU real. Cinco segundos aportan pocas muestras a 2 FPS y no bastan para caracterizar todos los dispositivos.

## E2E: estado de las 19 anteriores

Se guardó [la evidencia histórica disponible](e2e-3.4-baseline.json): 28 aprobadas/19 fallidas según 3.4, IDs de `.last-run.json` y nombres de los 19 contextos. Los archivos de contexto contienen snapshots DOM, **no stacks ni cronometrajes**; no permiten confirmar individualmente todas las causas. La atribución histórica a timeouts proviene del informe 3.4.

| Grupo anterior                                 | Fallidas | Estado en 3.5                                             |
| ---------------------------------------------- | -------- | --------------------------------------------------------- |
| Seis vuelos, proxies y selección rápida/reposo | 3        | Corrección temporal cubierta por unitarias; E2E pendiente |
| Exploración y órbita de depuración             | 1        | Gesto ahora empieza en canvas comprobado; E2E pendiente   |
| Encuadres con reserva (390, 768, 1366)         | 3        | Encuadres conservados; E2E pendiente                      |
| Canvas inmersivo 1920                          | 1        | E2E pendiente                                             |
| Panel Atención ahora → Compras                 | 1        | E2E pendiente                                             |
| Etiquetas/teclado (390, 640, 1440)             | 3        | Suavizado temporal corregido; E2E pendiente               |
| Capturas de corrección (1440, 1920)            | 2        | Esperan animación observable; E2E pendiente               |
| Arrastre/zoom y táctil                         | 2        | Controlador conserva pruebas; E2E pendiente               |
| Temas (390, 1440, 1920)                        | 3        | E2E pendiente                                             |

No se declara ninguna de estas 19 aprobada sin ejecución. Hay un fallo real probado en el avance temporal, posibles cuellos de render y posibles problemas de sincronización; pueden coexistir. La saturación CSS/compositor observada en 3.4 también puede demorar acciones sin que la cámara sea la única causa.

Se conservan las 47 pruebas originales y sus plazos. Se sustituyen pausas fijas para animaciones por condiciones observables; queda una ventana fija de 500 ms **para observar ausencia de renders en reposo**, no para esperar un vuelo. La prueba de arrastre comprueba que el punto inicial pertenece al canvas, evitando comenzar sobre una etiqueta HTML. No se finalizan artificialmente las animaciones CSS ni se desactivan pruebas.

Se añaden **13 E2E**: doce combinaciones calidad × oscuro/claro × sombras on/off, muestreando general y Compras, más selección rápida, cubierta, regreso y salida accesible ante evento de pérdida de contexto. Este último simula el evento: no representa un estrés real de GPU. Los informes comparativos se adjuntan como JSON cuando se ejecutan. **60 tests se descubren correctamente mediante `--list`.**

Se intentó Playwright antes y después de la corrección: el entorno devuelve `connect EPERM ::1:5173` y `127.0.0.1:5173` y Vite no puede iniciar. El navegador no llegó a abrirse. No hubo capturas, FPS nuevos, comparaciones software/GPU real ni comprobación visual de los tres perfiles.

```sh
pnpm test:e2e
pnpm exec playwright test e2e/performance-3.5.spec.ts
```

Repetir los recorridos con hardware y software disponibles y conservar los adjuntos. La suite comparativa necesita el servidor de desarrollo, porque la instrumentación no existe en producción.

## Validación y comparación

| Comprobación      | Resultado                                                                        |
| ----------------- | -------------------------------------------------------------------------------- |
| Línea base        | Check y 110 unitarias aprobados                                                  |
| Check final       | Formato, ESLint y TypeScript aprobados                                           |
| Unitarias finales | 118 aprobadas en 16 archivos                                                     |
| Compilación       | Aprobada; integridad 0.3.0 y 0.2.0 verificada                                    |
| E2E               | Intentadas y bloqueadas por entorno; 60 descubiertas, ninguna aprobación nueva   |
| Bundle visor      | Aproximadamente 983,68 kB minificados / 266,78 kB gzip; aviso >500 kB conservado |

| Antes                                     | Después comprobable                                                  |
| ----------------------------------------- | -------------------------------------------------------------------- |
| Cámara avanza como máximo 50 ms por frame | Vuelo de 1.200 ms reales; en prueba 2 FPS termina a 1.500 ms         |
| Sombras solicitadas en cada render        | Mapas cacheados; invalidación por luz/cubierta/montaje               |
| Etiquetas con delta limitado              | Exponencial temporal sin descarte                                    |
| Métricas generales antes del render       | Probe post-render, pase de sombras separado y estimaciones rotuladas |
| ≈2 FPS históricos en software             | FPS posterior **no disponible**, sin afirmar mejora                  |

Las pruebas nuevas verifican cadencias de 2 a 120 FPS e irregulares, interrupción sin salto inicial, pausa/recuperación, tiempo de reposo anterior, retorno exacto, calidad aislada en desarrollo, percentiles y memoria acotada de muestras, cache e invalidación por dirección de luz. Las pruebas existentes de movimiento reducido, selección, pan/zoom, cubierta, límites, temas y accesibilidad permanecen. jsdom sigue simulando la decodificación de PNG y Fiber/Orbit en las pruebas de navegación: no equivale a WebGL real.

## Riesgos y propuesta para Claude Code / Blender 0.4.0

1. Revisar las 19 E2E con el renderer registrado. No aumentar todos los plazos; distinguir carga inicial, vuelo, estabilización de etiquetas y compositor CSS.
2. Validar cache de sombras en oscuro/claro, Compras sin cubierta, árboles y zoom. Cualquier futura animación del mundo debe solicitar actualización de mapa: el cache supone geometría estática.
3. Medir punto por punto sombras, luces interiores, cristaleras y blur. PCF, PBR sobre suelo grande y las 14 luces pueden seguir limitando fragmentos aun con cache.
4. Propuesta para el productor, **sin ejecutar modelado**: evaluar LOD/siluetas de copas con menor triangulación; agrupar espacialmente vegetación si hace falta culling fino. Ya hay solo dos draw calls candidatos para árboles, por lo que no prometer mejoras por instancias sin analizar exportación y extensiones permitidas.
5. Explorar iluminación interior horneada/texturas o mayor uso de emisión si las pruebas aisladas demuestran coste de luces. Comparar visualmente con el perfil nocturno aprobado antes de sustituir PointLights.
6. Preparar presupuestos por material/primitiva, triángulos, texturas residentes, shadow casters y píxeles en GPU objetivo. Mantener identidad, jerarquía y función de los 94 nodos, proxies/anclas/cubierta y revisar contratos antes de cualquier cambio de exportación 0.4.0.
7. No introducir LOD, instancing, HDR, bloom o compresión nueva en el activo actual para resolver una hipótesis. La próxima iteración visual requiere mediciones y revisión humana de los perfiles opt-in.
