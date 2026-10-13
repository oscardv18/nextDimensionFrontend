# Fase 3.7-B — Calibración reversible del renderizador

Fecha: 2026-10-12. Estado: **implementación de comparación en desarrollo; aprobación visual pendiente**. Continúa el [diagnóstico](visual-unity-3.7-b.md). No declara terminada la unificación visual.

## Qué se conserva

GLB 0.4.0 y sus manifiestos intactos, perfil 1.0.0 provisional. No se integra la candidata 0.5.0 ni se acepta 1.1.0 como definitivo. No se modifican Shell, CSS, cámaras, navegación, anclas, selección, algoritmo de etiquetas, cubierta o perfiles gráficos. Sin nuevas dependencias, rutas o bibliotecas de posprocesado.

`CampusTheme` sigue siendo el único adaptador. Se añade un callback posterior a la escritura de sus valores originales para experimentos, sin cambiar los destinos de interpolación. Sin opt-in, el callback no se instala. Producción ignora los parámetros de calibración y conserva la referencia estable. No se escriben presets en localStorage ni se alteran los perfiles del productor.

## Línea base y limitación real de ejecución

Se encontró Brave en `/usr/bin/brave`. Se intentó iniciar Vite en `127.0.0.1:5173`: **`listen EPERM`**. La ejecución Playwright de la referencia con ese Brave falló al iniciar el servidor, antes de cargar el campus. Se probó Brave headless con directorio de usuario en `/tmp`: terminó con exit 133, `crashpad ... setsockopt: Operation not permitted`.

No hay `/dev/dri` visible; eso impide confirmar acceso a GPU física en este contenedor, pero no demuestra qué hardware tiene la máquina del usuario. No se cambian flags para forzar software silenciosamente ni se solicitan permisos que la política del entorno rechaza.

**No se obtuvo línea base visual nueva, capturas 0.4.0 ni mediciones de rendimiento hardware/software.** Las capturas 3.4 siguen siendo históricas, no se renombran como resultados actuales. La prueba real del shader está preparada pero no ejecutada. La aprobación de materiales, iluminación y entorno requiere ejecutar los recorridos siguientes en Brave con acceso normal al servidor y al dispositivo gráfico.

## Experimentos y reversión

La ruta normal `/campus-3d` conserva la referencia. También puede abrirse una referencia instrumentada sin cambiar valores:

```text
/campus-3d?assetVersion=0.4.0&calibration=on
```

Solo con `calibration=on` en desarrollo se reconocen:

| Parámetro               | Valores                                                                     | Qué cambia                                                     |
| ----------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `glassEnvironment`      | `reference` / `absolute` / `relative`                                       | Referencia de escena o PMREM explícito compartido en el vidrio |
| `reflectionEnvironment` | `room` / `architecture`                                                     | RoomEnvironment estable o entorno procedural de evaluación     |
| `lighting`              | `reference` / `ambient-half` / `environment-half` / `key-half` / `fill-off` | Una contribución cada vez, para aislar causas                  |

Valores desconocidos vuelven a referencia. Los controles existentes de tema y calidad siguen disponibles; los presets se seleccionan mediante URL, sin alterar componentes del Shell. Para restaurar, eliminar los parámetros y recargar. Al desmontar se restauran mapas/intensidades y callbacks de diagnóstico; el PMREM se libera por su propietario original.

Ejemplos:

```text
/campus-3d?calibration=on&glassEnvironment=absolute
/campus-3d?calibration=on&glassEnvironment=relative
/campus-3d?calibration=on&lighting=ambient-half
/campus-3d?calibration=on&lighting=environment-half
/campus-3d?calibration=on&lighting=key-half
/campus-3d?calibration=on&lighting=fill-off
/campus-3d?calibration=on&reflectionEnvironment=architecture
```

Los multiplicadores se aplican después de cada escritura de valores originales. No se acumulan al interrumpir o repetir cambios de tema. La interpolación y el movimiento reducido permanecen en `CampusTheme`, sin otro sistema visual paralelo.

## Discrepancia del vidrio: corrección experimental y decisión pendiente

La ruta estable usa `scene.environment`: en Three 0.180 el uniform `envMapIntensity` toma la intensidad global, aunque la propiedad del vidrio diga 1,0/1,4. Las variantes corrigen el control efectivo asignando **el mismo PMREM** como `material.envMap` explícito al cargar, antes del primer render. No duplican materiales, texturas de color, GLB o entorno; tampoco convierten vidrio alfa en transmisión física.

| Variante           | Oscuro, entorno 0,2 | Claro, entorno 0,7 | Semántica                                              |
| ------------------ | ------------------- | ------------------ | ------------------------------------------------------ |
| Referencia estable | 0,2                 | 0,7                | Intensidad de escena; propiedad individual no efectiva |
| Absoluta           | 1,0                 | 1,4                | Independiente de la intensidad global                  |
| Relativa           | 0,2                 | 0,98               | Valor del vidrio × intensidad global efectiva          |

Son valores **esperados del shader**, respaldados por lectura del código Three y pruebas de asignación/interpolación; no mediciones GPU de esta ejecución. Si se combina `environment-half` con relativa, también baja el multiplicador global; con absoluta se mantiene independiente. De noche relativa coincide numéricamente con referencia, lo que es útil como control y no debe venderse como mejora visual.

La propuesta disponible de Claude en `arxnet-3d/docs/visual-unity.md` no define semántica absoluta/relativa. Se solicitó aclaración al usuario; ambas permanecen comparables, **sin promover una a producción ni afirmar acuerdo del productor**.

En calibración, un callback `Mesh.onAfterRender` consulta `envMapIntensity` mediante `getUniform` sobre el programa realmente dibujado. Publica `data-glass-environment` junto con propiedad JS, intensidad de escena, modo, mapa explícito e ID de programa. Se consulta al asentarse el tema y cambiar valores, no continuamente por fotograma. Esta consulta es diagnóstico puntual de un uniform, no tiempo GPU ni reflectancia física medida.

El acceso a `gl.properties.currentProgram` es interno a Three y está acotado a desarrollo; su compatibilidad debe revisarse al actualizar Three. E2E comprueba el uniform, mientras unitarias solo comprueban estado del adaptador. Se comprueba también que alternar temas no cree programas/texturas ni remonte canvas en la variante relativa.

## Comparación nocturna y diurna preparada

Se conservan fondo, niebla, exposición, materiales, luces locales y direcciones. Cada ablación modifica una intensidad: hemisferio al 50 %, entorno al 50 %, principal al 50 % o relleno a cero. Sirven para atribuir cambios; **no son valores artísticos finales** ni adopción parcial oculta de la candidata.

En oscuro evaluar volumen de fachadas, fuga entre plantas, lectura de interiores y relación interior/exterior. En claro evaluar pavimentos lavados, separación arquitectura/terreno y lectura de vidrio. No interpretar una escena simplemente más oscura como mejora automática. Referencia y experimento utilizan el mismo tema, perfil, viewport y encuadre; la prueba compara `data-fit`.

## Propuesta de entorno

`architecturalReflectionScene` genera un entorno de prueba independiente: recinto gris frío, panel cenital amplio, horizonte cálido bajo y dos aportes laterales. Se prefiltra una sola vez con PMREM y se descarta su geometría auxiliar. No se añade al campus ni altera sus límites/cámaras. El mismo mapa se usa en ambos temas, con las intensidades existentes, para aislar su distribución respecto a RoomEnvironment.

Esta distribución procede del concepto de paneles descrito por Claude, pero sus dimensiones/radiancias son **parámetros de laboratorio**, no posiciones de edificios o luces contractuales. No representa reflejos locales, entorno exterior físicamente exacto ni un HDR aprobado. No cambia automáticamente el fondo ni la niebla. No se declara que resuelva la apariencia de estudio sin capturas comparativas.

Ventajas previstas: señales amplias para cristal y metal, sin descarga ni licencia externa, un PMREM como referencia. Coste esperado: prefiltrado inicial y textura ambiental; no otro pase continuo del campus. No hay medición que demuestre menos memoria, mejor FPS o mejor estética. Si Claude propone mapas distintos por tema, acordar resolución común, orientación y presupuesto; precomputar y compartir recursos, evitando generarlos en cada alternancia.

## Capturas, comparación lado a lado y métricas

Suite nueva: `e2e/renderer-calibration.spec.ts`, **33 casos descubiertos**. Prepara referencia oscura/clara a 1440×900 y 1920×1080; siete experimentos por tema en general y Compras; y alternancia de apariencia. Cada comparación genera:

- `reference.png` y `experiment.png`, cada una con canvas y Shell completos.
- `comparison.html` con ambas capturas lado a lado, sin reducir el canvas de la aplicación.
- JSON por captura con calibración, uniform leído, encuadre y probe 3.5.

Se esperan cámara, tema, etiquetas y animaciones CSS asentadas; no se fuerzan animaciones ni se ocultan tests. El benchmark activo de cinco segundos recoge frames renderizados. No se amplían los timeouts existentes ni se afirma que estas pruebas hayan pasado.

Ejecutar primero línea base en entorno habilitado:

```sh
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/brave pnpm exec playwright test e2e/renderer-calibration.spec.ts --grep 'referencia real'
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/brave pnpm exec playwright test e2e/renderer-calibration.spec.ts
CALIBRATION_QUALITY=balanced PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/brave pnpm exec playwright test e2e/renderer-calibration.spec.ts
CALIBRATION_QUALITY=low PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/brave pnpm exec playwright test e2e/renderer-calibration.spec.ts
```

Primero confirmar renderer del probe y `brave://gpu`; headless no garantiza GPU física. Si indica SwiftShader/llvmpipe, rotular software. Si no identifica el renderer, marcar desconocido. Registrar sistema, Brave, GPU/driver y flags; no mezclar cifras de GPU real y software en un promedio. Puede usarse Brave con ventana para confirmar el resultado humano.

No ejecutar las dos variantes dentro de dos canvas simultáneos como benchmark: compartirían recursos de GPU y distorsionarían la comparación. Las capturas se producen secuencialmente. Comparar resolución efectiva, FPS activo, p50/p95/máximo, CPU wall, pase de sombra, draw calls, triángulos, programas/texturas y carga; usar las mismas condiciones de calentamiento y varias muestras. GPU ms/bytes residentes y coste aislado de blur/transparencia continúan no disponibles en el probe. El lector de uniform puede introducir sincronización puntual; la muestra de cinco segundos se realiza después de obtenerlo.

Responsive, cubierta y navegación siguen cubiertos por suites existentes, especialmente `integration-3.6.spec.ts`. Tras elegir una variante, repetir también allí y revisar manual cercano; la igualdad de encuadres no prueba compatibilidad visual de todos los recorridos.

## Coordinación y compatibilidad de la futura candidata

Se leyó la propuesta artística real de Claude, sin copiar activos. Su fragmento JSONC contiene campos propuestos y elipsis; no es un manifiesto candidato válido verificable automáticamente. Resultado de compatibilidad **estructural**:

| Propuesta                           | Compatibilidad actual / acción antes de integrar                                                                                                                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORM                                 | GLTFLoader soporta mapas del núcleo; comprobar UV/canales/espacio de datos, memoria, intensidad de AO y hashing del bundle candidato                                                                           |
| COLOR_0                             | Loader puede crear variantes por atributos; consumidor conserva variantes por identidad del material original, no agrupa exclusivamente por nombre. `CampusTheme` actualiza todas las variantes de cada nombre |
| Tres materiales nuevos              | No presentes ni autorizados en 0.4.0; exigir catálogo y patches válidos del candidato, sin hardcodear sus nombres en la calibración actual                                                                     |
| `profileVersion: 1.1.0`             | Validador actual rechaza versiones distintas de 1.0.0; no relajar hasta disponer de esquema y semántica acordados                                                                                              |
| `environment.kind/preset/intensity` | Definir fuente reproducible, resolución, orientación y prioridad respecto a `environmentIntensity` existente; aclarar absoluto/relativo por vidrio                                                             |
| Niebla `cameraRelative`             | Faltan unidades, definición de distancia y relación con offsets; no está soportada ni implementada aquí                                                                                                        |
| `groundFade`                        | Shader nuevo, precisión espacial, cache/programas y calidad por acordar; fuera de esta calibración                                                                                                             |
| `accentBinding` y estados           | El Shell espacial usa `--cc-accent`; `--acento` global puede diferir. Sus presets aún no se activan. No enlazar silenciosamente ni clonar por departamento ahora                                               |
| `qualityProfiles`, AO/bloom/DOF     | No reemplazar perfiles existentes ni instalar bibliotecas. Intensidad cero no garantiza pase gratuito; la viñeta ya existe en CSS                                                                              |

La propuesta dice que `prepareCampus` agrupa por nombre: el código actual agrupa clones por **identidad de material original**, preservando variantes de GLTFLoader. Debe corregirse esa descripción del productor; no cambiar el consumidor para que encaje con ella. Se conserva recomendación de atributos coherentes y pruebas con geometría candidata real.

También usa tokens globales para diagnosticar el fondo, mientras el Shell espacial aprobado tiene `--cc-*` y fondo nominal coincidente con el perfil actual. Compartir roles semánticos, no asumir igualdad de todos los tokens físicos. Los criterios de luminancia deben definir máscara de interior/exterior y usar luminancia lineal para ratios; un ratio de L* no equivale a ratio de luminancia física.

Solicitudes concretas al productor: semántica de intensidad por material; definición de entornos/presets y orientación; lista de patches autorizados y unidades; esquema máquina sin elipsis; reglas ORM/UV/COLOR_0; compatibilidad de nodos/cajas por primitiva; manifiesto/build/perfil/hashes del candidato y evaluación en ambos temas. Ninguno se considera definitivo por estar escrito en la propuesta.

## Estado de validación

| Comprobación             | Resultado real                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `pnpm check`             | Prettier, ESLint y TypeScript aprobados                                                             |
| `pnpm test`              | 133 aprobadas en 18 archivos: 125 anteriores y 8 nuevas                                             |
| `pnpm build`             | Aprobada, exit 0; verificación de activos aprobada                                                  |
| Playwright               | 33 casos descubiertos; intento de referencia bloqueado antes de navegador por servidor sin permisos |
| Brave directo            | Intentado; bloqueo de socket/crashpad, sin campus renderizado                                       |
| Capturas/uniform GPU/FPS | Pendientes; no se presentan resultados simulados                                                    |

Unitarias prueban referencia, absoluto/relativo, interpolación/interrupciones, restauración, ablaciones, opt-in exclusivo de desarrollo y rechazo del esquema candidato. No equivalen a píxeles WebGL ni aprobación de material. El primer check detectó un tipo desconocido en la lectura interna de Three; se corrigió con una descripción acotada de esa propiedad y el check/build posteriores aprobaron.

Bundle del visor: **978,63 kB / 265,54 kB gzip**, frente a los 976,32 / 264,74 reportados en 3.6. Incremento aproximado de 2,31 / 0,80 kB; no es una métrica de render. Se conserva el aviso >500 kB sin elevar el límite. La ruta estable no monta entorno alternativo ni callbacks de lectura GPU, y no se instala posprocesado.

La limitación de navegador deja pendientes todos los entregables visuales y de rendimiento observado. La infraestructura de calibración puede revisarse y ejecutarse fuera del contenedor; no se promueve ningún experimento a producción ni se declara terminada la unificación.
