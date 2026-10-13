# Fase 3.6 — Activo 0.4.0 y detalle progresivo

## Inspección y alcance

Se revisaron `CLAUDE.md`, integración 3.3, modo claro 3.4, rendimiento 3.5, renderer, cámara temporal, entrada manual, perfiles gráficos, temas, cache de sombras y etiquetas. Se localizó el productor en `/home/oddv/Renders/arxnet-3d` y se inspeccionaron su GLB, manifiesto, perfil, generador y validaciones de Fase 1.3. La [especificación copiada](themes-source-0.4.0.md) conserva literalmente su sección de integración.

No se cambia el diseño, CSS del Shell, cámara, perfiles de encuadre, controles, contrato, Blender ni los GLB originales. No se instalan dependencias ni se modelan otros departamentos.

## Activos coordinados e integridad

La versión activa es `arxnet.scene.campus-pilot@0.4.0`, en `public/assets/arxnet.scene.campus-pilot/0.4.0/asset.glb`. Sus manifiesto, build y temas se copian juntos en `src/features/campus/assets/`. [Procedencia](provenance-0.4.0.json) registra origen, bytes y SHA-256 de las cuatro copias. `pnpm assets:verify` comprueba esos hashes además del binario y su jerarquía.

SHA-256 nuevo: `0350de6f984e8a19a2bc0a9bbca3586314c0c05c961878b7e92f8fda06b279ac`; **3.159.924 bytes**.

Se preservan los **99 registros anteriores**, con ID, nombre, rol, padre y seis interacciones idénticos. Ahora hay 139 nodos, 116 mallas incluidas seis de proxies, 110 primitivas visuales y 26 materiales. Los grupos de detalle no contienen nodos anteriores, focos, anclas, proxies o cubierta. La identidad del contrato sigue en 1.0.0 y la estructura del perfil de temas en 1.0.0, provisional.

Evidencia del productor copiada sin editar: [compatibilidad](source-0.4.0-compatibility.json), [estadísticas](source-0.4.0-stats.json), [GLB](source-0.4.0-glb.json), [temas](source-0.4.0-themes.json) y [reproducibilidad](source-0.4.0-reproducibility.json). Estos informes no equivalen a una validación WebGL del frontend. Se ejecutó además el verificador de temas del productor contra nuestras copias: [resultado aprobado](validation-themes-0.4.0.json).

Se conserva el GLB 0.3.0 junto con su manifiesto/build/perfil en `assets/0.3.0/`; también permanece 0.2.0. El verificador comprueba los hashes de las cuatro copias 0.3.0 contra su procedencia anterior, sin confiar solo en el nuevo manifiesto.

## Reversión y comparación

`asset-bundle.ts` selecciona **un conjunto completo**, compartido por loader, diagnóstico, material/tema y consumidor. No se mezclan versiones. En desarrollo:

```text
/campus-3d?assetVersion=0.4.0&quality=high
/campus-3d?assetVersion=0.3.0&quality=high
```

La selección se realiza al cargar la página; no se cambia un GLB dentro de la escena ya montada. La aplicación de calidad en diagnóstico preserva esa versión. En compilación puede usarse:

```sh
VITE_CAMPUS_ASSET_VERSION=0.3.0 pnpm build
```

El valor por defecto es 0.4.0; producción ignora el parámetro URL de versión y usa el valor compilado. Una prueba carga realmente 0.3.0, verifica su hash, monta el adaptador con sus 23 materiales, alterna tema y verifica que el controlador de detalle vacío no modifica la escena. No hace falta restaurar el consumidor de Fase 3.3 para esta reversión.

## Conservación de encuadres y navegación

Las cajas navegables excluyen los seis `environmentNodeIds` y todos los descendientes de los tres `detailNodeIds`. Por tanto, suelo, árboles/arbustos y vehículos no amplían los límites. Las cajas departamentales excluyen el detalle y se calculan antes de gestionar su visibilidad.

Se detectó un desplazamiento de **0,036 m** en la posición general calculada al añadir ciertos nodos arquitectónicos a la nube de puntos. Las cajas globales iguales por sí solas no garantizan la misma composición: el algoritmo aprobado utiliza cajas de mallas individuales.

Para conservar el resultado, `overviewPoints` usa el conjunto de IDs de encuadre de 0.3.0, derivado de su manifiesto archivado, con **dimensiones y transformaciones del GLB actualmente cargado**. Los añadidos se renderizan, pero no pasan a definir la composición. No se guardan posiciones CSS, coordenadas inventadas ni otra cámara. Los perfiles y el controlador temporal de 1.200 ms no se editan.

La comparación automatizada comprueba vista general y los seis enfoques contra 0.3.0 a **1440×900, 1920×1080 y 390×844**, con tolerancia de 0,0001 m. También compara los límites de exploración. Se conservan las pruebas reales de raycast sobre seis proxies, movimientos rápidos, retorno exacto, movimiento reducido, arrastre/zoom, anclas y cubierta.

## Contenido real de los grupos

Los IDs provienen de `manifest.detailNodeIds` y sus hijos reales. La pertenencia departamental se obtiene por el padre del proxy. No hay una lista paralela de los 22 IDs de malla.

| Grupo                | Contenido inspeccionado                                                                                 | Política                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `site.detail`        | Camión en Almacén y furgoneta en Compras, agrupados por carrocería, chasis, neumáticos y luces          | Se oculta/restaura el grupo completo; no se separan ruedas de carrocerías                                 |
| `procurement.detail` | Sillas, pantallas, equipos, mobiliario interior, mercancía, palets, maquinaria, plantas y señalización  | Se conserva mobiliario/equipos/mercancía; pantallas y plantas son secundarios                             |
| `warehouse.detail`   | Palets, mercancía, embalaje, estanterías, maquinaria, equipo, ruedas/asientos, pantallas y señalización | Se conserva el conjunto operativo, incluidas las piezas mezcladas por material; pantallas son secundarias |

El generador agrupa por **material**, no por objeto funcional. Por ejemplo, `tyres-seats` mezcla neumáticos y asientos y `equipment` contiene distintas piezas metálicas. Retirar estas mallas independientemente puede romper objetos. La clasificación es conservadora: todas las categorías departamentales se consideran esenciales salvo `screens` y `plants`, cuyo contenido secundario independiente se inspeccionó. Las categorías desconocidas se conservan. Los edificios, estanterías estructurales, puertas, muelles y luminarias fuera de estos grupos permanecen siempre.

[Inventario estático de detalle](detail-inventory-0.4.0.json): **22.160 triángulos**, de los cuales 20.592 se conservan como esenciales y 1.568 corresponden a siete primitivas secundarias. Esto implica una reducción geométrica modesta en general, deliberada para evitar interiores vacíos; no se promete resolver el coste de 0.4.0 ocultando todo el mobiliario.

## Detalle por perfil, distancia e histéresis

`DetailController` solo modifica `visible`; no desmonta objetos, cambia materiales ni escribe posiciones de cámara. `CampusDetail` ejecuta la política después de la cámara y antes de las etiquetas. Los cambios invalidan el frame y el mapa de sombras cacheado. Al desmontar se restauran los indicadores originales.

| Perfil      | Elementos esenciales | Elementos secundarios                                                 |
| ----------- | -------------------- | --------------------------------------------------------------------- |
| Alta        | Todos                | Siempre disponibles                                                   |
| Equilibrada | Todos                | En el departamento enfocado o exploración cercana; ocultos en general |
| Baja        | Todos                | En foco propio o exploración más cercana; ocultos en general          |

Los perfiles conservan sus nombres y ajustes previos de DPR/sombras. En Baja se extiende la exclusión de sombras de vegetación a los arbustos nuevos, derivando los nodos desde `environmentNodeIds` y su prefijo real. Se mantienen sombras arquitectónicas. No cambia el menú público: calidad continúa en diagnóstico de desarrollo y Alta es el valor predeterminado de producción.

Referencias espaciales: foco real GLB para grupos departamentales; distancia a la caja mundial de los vehículos para `site.detail`, no al centro del suelo. Esta última referencia es una aproximación de grupo: los dos vehículos están agrupados y no pueden cullearse individualmente sin separar geometría.

Umbrales configurables en `detailThresholds`:

- Equilibrada: mostrar al entrar a 90 m; mantener hasta salir de 110 m.
- Baja: mostrar al entrar a 45 m; mantener hasta salir de 65 m.
- Desde un departamento enfocado a exploración manual: el umbral de salida es al menos 1,25 veces la distancia del encuadre enfocado observado. Evita retirar detalle al primer pequeño gesto en pantallas estrechas, donde la cámara queda más lejos.
- Evaluación como máximo cada 100 ms durante desplazamiento de al menos 0,5 m; una orden/cambio de estado se atiende inmediatamente.

Durante un vuelo se precarga el detalle secundario del foco de destino y se difieren retiradas de lo que ya estaba visible. Al asentarse o entrar en exploración se aplica distancia/perfil. La cubierta es independiente de esta lógica.

No hay fades de material: serían problemáticos con materiales compartidos y transparencias. La visibilidad es discreta; la histéresis y las retiradas lejanas reducen alternancias, pero **su percepción visual requiere revisión humana**. Los umbrales no se consideran calibrados definitivamente.

## Temas y rendimiento

Se usa el mismo `CampusTheme` y almacén de apariencia del Shell. El adaptador toma el perfil del bundle cargado. Los tres materiales nuevos compartidos (`mat_cardboard_kraft`, `mat_polymer_charcoal`, `mat_vegetation_shrub`) se cubren mediante el catálogo, sin una ruta de tema paralela. No hay GLB duplicado por apariencia. Las pruebas de alternancia preservan identidad/versiones de materiales y mapas, luces y limpieza.

Las cristaleras nuevas pertenecen a materiales existentes: BLEND, una cara, `depthWrite=false` y orden de render 1. Las luces siguen siendo 14 puntuales sin sombras, hemisferio y dos direccionales, una con sombras cacheadas. Se conservan exposición, niebla, entorno PMREM, emisiones, metales y vegetación según los perfiles. Bloom permanece desactivado como en 3.5.

| Comparación estática del productor          | 0.3.0     | 0.4.0                             |
| ------------------------------------------- | --------- | --------------------------------- |
| Bytes GLB                                   | 1.113.320 | 3.159.924                         |
| Bytes gzip del activo, según informe fuente | 471.791   | 864.941                           |
| Triángulos visuales                         | 19.382    | 60.398                            |
| Primitivas visuales                         | 73        | 110                               |
| Materiales                                  | 23        | 26                                |
| PNG incrustados                             | 4         | 4                                 |
| Detalle progresivo                          | 0         | 22 primitivas / 22.160 triángulos |

Estos datos **no son métricas de GPU o FPS**. La instrumentación 3.5 sigue separando intervalo de frame, CPU, pase de sombras, contadores Three y estimaciones de buffers/texturas. Ahora incluye `assetVersion` y el snapshot de detalle. `data-detail` solo se publica al iniciar o cambiar visibilidad: no crea estado React por fotograma.

El bundle del visor ronda **976,32 kB / 264,74 kB gzip** y el chunk compartido de metadatos/calidad **74,17 kB / 10,07 kB gzip**. La partición ha cambiado al conservar ambos conjuntos de metadatos: que el archivo del visor sea menor no demuestra mejora de rendimiento ni menor carga total. Se conserva el aviso >500 kB y el visor sigue cargándose aparte. No se ha medido consumo GPU, FPS, blur ni tiempos de shader de 0.4.0.

## Validación real y limitaciones

| Comprobación                       | Resultado                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| TypeScript, ESLint, Prettier       | Aprobados                                                                            |
| Unitarias                          | 125 aprobadas en 17 archivos; se conservan las 118 previas                           |
| Integridad                         | Hashes 0.4.0 y copias 0.3.0/0.2.0 aprobados, 99 identidades y relaciones verificadas |
| Verificador de temas del productor | Aprobado contra las copias frontend                                                  |
| `pnpm build`                       | Aprobada en el reintento ordinario; aviso de tamaño conservado                       |
| Build Vite con reversión 0.3.0     | Aprobado en reintento, salida aislada en `/tmp/arxnet-rollback-check-0.3.0`          |
| E2E                                | 82 descubiertas: 60 anteriores y 22 nuevas; ejecución bloqueada por entorno          |
| Navegador/capturas/FPS             | No disponibles en esta ejecución; aprobación visual pendiente                        |

Las siete pruebas nuevas cubren compatibilidad, rechazo de mezcla de versiones, reversión real, comparación de cámaras/límites, Alta/Equilibrada/Baja, conservación de contenido esencial, histéresis, muestreo limitado, restauración, vuelos y exploración desde un foco lejano. Las pruebas existentes cargan ahora el GLB 0.4.0 y conservan recorridos de selección, cubierta, materiales y navegación. En jsdom se simulan decodificación PNG y Fiber/Orbit en la prueba de navegación: no equivale a render WebGL real.

Se intentó Playwright sobre recorridos anteriores y nuevos. Falló antes de abrir navegador por `connect EPERM ::1:5173` y `127.0.0.1:5173`; Vite no pudo iniciar. No se aumentan timeouts, desactivan tests o finalizan artificialmente animaciones para ocultarlo. Las 19 fallidas históricas de 3.4 siguen sin una reevaluación real.

También se observaron fallos **nativos intermitentes del proceso de build**: un intento terminó con exit 139 y otro build de reversión generó archivos pero abortó al cerrar con `double free or corruption`/SIGABRT. No fueron errores TypeScript o de transformación. Los reintentos ordinarios de build normal y Vite con reversión pasaron con exit 0; se conserva esta incidencia para repetir en CI y no tratar la emisión de archivos del intento abortado como compilación aprobada. No se cambian dependencias ni se oculta el fallo.

## Recorridos preparados y aprobación pendiente

```sh
pnpm test:e2e
pnpm exec playwright test e2e/integration-3.6.spec.ts
pnpm exec playwright test e2e/performance-3.5.spec.ts
```

Se preparan 18 combinaciones Alta/Equilibrada/Baja × oscuro/claro × general/Compras/Almacén a 1440×900. Compras añade interior sin cubierta, arrastre/zoom cercano y restauración; los screenshots se guardarán en el directorio de cada test (`scene.png`, `interior.png`, `manual-close.png`). Se esperan estados finales y animaciones observables, sin forzarlas. Cuatro recorridos adicionales comparan ambos activos y ambos temas con muestras post-render de cinco segundos y adjuntos JSON. Los recorridos responsive anteriores siguen comprobando 1920×1080 y móvil con el activo nuevo.

**No se han generado esas capturas.** Las imágenes Blender del productor y las capturas históricas 3.4 no validan esta integración en navegador. No se declara 0.4.0 optimizado ni aprobado visualmente por pasar unitarias.

Revisar en Brave con GPU real y registrar renderer cuando se compare software: cristales de acceso/despacho, legibilidad de mobiliario entre plantas, metal y emisión, mercancía de Almacén, sombras al retirar cubierta, contraste de vegetación y vehículos. Comprobar las bandas 90/110 y 45/65 m en zoom lento, vuelos interrumpidos y manual desde móvil. Medir p50/p95/máximo y draw calls con cada perfil antes de ampliar reducciones.

## Recomendaciones

1. Aprobar visualmente los tres perfiles, especialmente Baja sin retirar mobiliario o partes de maquinaria. Ajustar umbrales con capturas y medidas, conservando los encuadres actuales.
2. Solicitar al productor futura metadata semántica de prioridad y agrupación de objetos completos. La agrupación por material limita cuánto se puede ocultar con seguridad; no separar piezas de vehículos o muebles desde este consumidor.
3. Investigar con las muestras si predominan luces, fragmentos, transparencias, sombras o primitivas. La política conservadora solo puede retirar 1.568 triángulos secundarios; no justificar reducciones adicionales únicamente por 60.398 triángulos.
4. Repetir build de reversión y normal en CI si reaparece el fallo nativo, guardando log y versiones de Node/Vite/Rolldown. No considerar una carpeta `dist` emitida como prueba de éxito si el proceso aborta.
5. Mantener la versión 0.3.0 verificable hasta cerrar aprobación visual y rendimiento. No avanzar a modelar otros departamentos desde esta fase.
