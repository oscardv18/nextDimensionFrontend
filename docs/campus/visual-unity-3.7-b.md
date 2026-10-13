# Fase 3.7-B — Diagnóstico de integración visual Shell/Campus

Fecha: 12 de octubre de 2026. Estado: **propuesta, sin cambios del renderizador**. Activo auditado: `arxnet.scene.campus-pilot@0.4.0`, Three.js instalado 0.180.0. La implementación queda pendiente de propuesta del productor y aprobación visual.

Continuación autorizada posteriormente: [calibración reversible de desarrollo](calibracion-renderer-3.7-b.md). Conserva la referencia estable y no declara aprobación de la unificación; el resto de este documento registra el diagnóstico inicial.

## Evidencia y límites

Se revisaron `CLAUDE.md`, las fases [3.3](integracion-3.3.md), [3.4](modo-claro-3.4.md), [3.5](rendimiento-3.5.md) y [3.6](integracion-3.6.md), el consumidor, sus pruebas, los perfiles y el GLB binario. Se consultó también `/home/oddv/Renders/arxnet-3d/docs/themes.md`.

Se inspeccionó visualmente [el mockup aprobado](../../references/arxnet-approved-mockup.png) y las capturas históricas [oscura](capturas-3.4/dark-overview-1440x900.jpg) y [clara](capturas-3.4/light-overview-1440x900.jpg). Estas últimas corresponden a **0.3.0**, con WebGL por software; 3.4 indica que se finalizaron animaciones CSS para capturarlas. No demuestran el aspecto, la fluidez ni los interiores nuevos de 0.4.0.

No se ejecutó un navegador en esta auditoría ni se generaron capturas actuales. Las causas visuales se distinguen entre hechos del código e hipótesis pendientes de comparación WebGL. No hay mediciones nuevas de FPS o GPU. `pnpm assets:verify` sí se ejecutó: integridad 0.4.0, 139 nodos, 99 identidades anteriores, materiales, imágenes, detalle y versiones archivadas aprobados.

## Diagnóstico principal

El mockup combina iluminación cálida localizada, fachadas oscuras con gradaciones, contactos definidos, reflejos del entorno arquitectónico y pavimento con variación especular. El cristal deja leer interiores sin desaparecer como superficie. Los acentos azules son puntuales; el paisaje acompaña la arquitectura. En el enfoque de Compras se representa desenfoque del fondo, que el renderer actual no implementa.

La captura histórica muestra superficies más uniformes, interiores iluminados de forma amplia, vegetación de silueta simplificada y reflejos poco relacionados con el emplazamiento. Parte pertenece al activo anterior y debe reevaluarse con 0.4.0. **No se propone cambiar el encuadre, la escala o la navegación** para corregir esa diferencia.

| Hecho actual                                                                  | Posible contribución a la desconexión                                                                  | Certeza                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| PMREM generado de `RoomEnvironment`, sin entorno exterior ni reflexión local  | Señales especulares de una sala genérica sobre arquitectura exterior                                   | Configuración confirmada; impacto visual pendiente  |
| Vidrio `BLEND` de `MeshStandardMaterial`, opacidad 0,14/0,26                  | Transparencia alfa debilita también su presencia reflectante; no modela transmisión física             | Confirmado; comparar fachadas actuales              |
| Nueve referencias de textura, cuatro imágenes; únicamente mapas de color base | Pavimentos/madera/piedra varían en color, pero no en rugosidad o normal por texel                      | GLB confirmado                                      |
| Sin mapas de oclusión ni AO de pantalla                                       | Falta potencial de contacto en mobiliario, marcos y encuentros                                         | Ausencia confirmada; necesidad visual pendiente     |
| Hemisferio + entorno + relleno sin oclusión física interior                   | Puede aplanar volumen o iluminar superficies que deberían permanecer más oscuras                       | Hipótesis de iluminación                            |
| Catorce luces interiores sin sombras; suelos emisivos de noche                | Puede haber fuga de luz entre plantas/paredes y luminosidad uniforme                                   | Configuración confirmada; artefactos no verificados |
| Bloom declarado pero no renderizado                                           | Emisión visible sin halo; no explica por sí sola una apariencia de maqueta                             | Confirmado                                          |
| Shell HTML con blur, saturación, brillos y viñeta propios                     | El HTML tiene una respuesta visual distinta al 3D; el posprocesado WebGL no lo integra automáticamente | Confirmado                                          |

La prioridad es calibrar luz, materiales y entorno. Bloom o cambiar el tone mapping no sustituyen geometría, microdetalle, contactos ni iluminación localizada.

## Arquitectura y configuración del renderer

| Sistema           | Implementación auditada                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canvas            | `campus-viewer.tsx`, viewport completo, `frameloop="demand"`, carga única y liberación de recursos                                                   |
| WebGL             | Fiber crea renderer con antialias, alfa y preferencia `high-performance`; esta preferencia no garantiza GPU física                                   |
| Color             | `ColorManagement` activo; salida sRGB; GLTFLoader interpreta factores glTF lineales y mapas de color sRGB                                            |
| Tone mapping      | `NeutralToneMapping` explícito, prevalece sobre el valor predeterminado de Fiber; no existe compositor                                               |
| Exposición        | Uniform del renderer, 1,0 oscuro / 0,9 claro                                                                                                         |
| Ambiente/reflejos | Un PMREM de `RoomEnvironment`, sigma 0,04, creado al montar; intensidad de escena 0,2 / 0,7                                                          |
| Fondo/niebla      | Una instancia de `Color` y `Fog`, actualizadas por el adaptador                                                                                      |
| Transición visual | `CampusTheme.applyTheme`, 320 ms, interpolación lineal de colores en espacio de trabajo y curva temporal cúbica; instantánea con movimiento reducido |
| Actualizaciones   | Cámara, detalle y etiquetas fuera de estado React por fotograma; el tema solicita frames mientras interpola                                          |
| Posprocesado      | Ningún pase activo: sin bloom, AO, SSR, grading o profundidad de campo                                                                               |

No se encontró una doble conversión sRGB en esta ruta. No aplicar correcciones gamma manuales a los mapas. Si se aprueba un compositor, debe existir una única conversión de salida y una única transformación tonal. El renderer permite controlar exposición, salida y tone mapping; sus contadores requieren contabilizar correctamente los pases adicionales. [Documentación oficial de WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html).

Neutral no es un fallo. Comparar Neutral con ACES o AgX solo como experimento aprobado, con las mismas cámaras y materiales; fijar el elegido para ambos temas y recalibrar exposición/emisiones. Cambiar de operador al alternar tema contradice la invariante actual del productor.

### Hallazgo: el parámetro individual de reflejo del vidrio no llega al shader

`prepareCampus` y `CampusTheme.write` asignan `material.envMapIntensity`, pero no asignan `material.envMap`. El entorno se asigna a `scene.environment`.

En la versión **instalada** de Three, `src/renderers/WebGLRenderer.js`, línea 2501 aproximadamente, la condición `material.isMeshStandardMaterial && material.envMap === null && scene.environment !== null` fija el uniform a **`scene.environmentIntensity`**. `WebGLMaterials.js` solo aplica la intensidad individual cuando hay `material.envMap` explícito.

Por tanto, el vidrio recibe actualmente intensidad global **0,2/0,7**, no un factor específico **1,0/1,4**; tampoco se multiplican automáticamente ambos. Las pruebas de valores del material no prueban ese resultado del shader. Es una discrepancia técnica entre la intención del perfil y el consumidor, no una conclusión obtenida de píxeles.

Propuesta pendiente: acordar si el valor individual es absoluto o multiplicador global. Si se necesita control separado, evaluar asignar al vidrio el mismo PMREM compartido y escribir una intensidad efectiva explícita. No crear otro entorno ni materiales por cambio de tema. Asignar ese mapa durante el montaje puede introducir una variante de programa inicial; debe verificarse la estabilidad posterior, la rotación y la liberación del PMREM compartido. **No se implementa aquí**.

## Auditoría de iluminación y sombras

| Parámetro           | Oscuro                                           | Claro                                            |
| ------------------- | ------------------------------------------------ | ------------------------------------------------ |
| Hemisferio          | Cielo `#7d8fb3`, suelo `#17140f`, intensidad 0,9 | Cielo `#e3ebf7`, suelo `#b8ab98`, intensidad 1,4 |
| Principal           | `#a9bcff`, 0,6; dirección [0,45; 0,7; −0,55]     | `#fff2df`, 3,2; dirección [−0,67; 0,71; −0,22]   |
| Relleno             | `#ffcf99`, 0,4                                   | `#cddcff`, 0,5                                   |
| Sombras principales | Intensidad 0,6                                   | Intensidad 0,75                                  |
| Luces locales       | Escala 1                                         | Escala 0; las luces permanecen montadas          |
| Fondo               | `#07090d`                                        | `#dfe3ea`                                        |
| Niebla lineal       | 260–620 m, color del fondo                       | 300–760 m, color del fondo                       |

Las dos direccionales apuntan al centro navegable; la principal se coloca a 120 m. El relleno reutiliza esa distancia: la direccional no atenúa por distancia. Hay **17 luces**: hemisferio, dos direccionales y 14 puntuales. Solo la principal proyecta sombras.

| Departamento     | Puntuales | Intensidad base, candela según productor | Alcance        |
| ---------------- | --------- | ---------------------------------------- | -------------- |
| Compras          | 3         | 90 / 70 / 70                             | 22 / 18 / 18 m |
| Almacén          | 3         | 110 / 110 / 50                           | 24 / 24 / 14 m |
| Operaciones      | 2         | 80 / 60                                  | 20 / 16 m      |
| Ventas           | 2         | 90 / 50                                  | 20 / 16 m      |
| Administración   | 2         | 60 / 50                                  | 16 / 14 m      |
| Recursos humanos | 2         | 60 / 60                                  | 16 / 16 m      |

Todas tienen `decay=2`, colores cálidos `#ffc58a` o `#ffd2a0`, posición local y padre reales del perfil. La emisión no ilumina por sí sola objetos vecinos en esta ruta; las puntuales sí lo hacen, sin resolver oclusión de paredes. La intensidad cero en claro preserva programas, pero no demuestra que desaparezca todo el coste del bucle de luces.

El volumen de sombra principal es ortográfico ±70 m, near 1/far 300, bias −0,0004 y normalBias 0,03. Se cachea el mapa; cambia por dirección de luz, cubierta, montaje o visibilidad de detalle, no por paneo. Opacos proyectan/reciben; suelo ampliado solo recibe; proxies y vidrio no proyectan ni reciben. Casi todos los opacos son `DoubleSide` en el GLB, lo que exige revisar culling y sombra antes de proponer cambios de caras.

Resolución sobre 140 m de anchura: aproximadamente **6,8 / 13,7 / 27,3 cm por texel** para mapas 2048/1024/512. Es un cálculo geométrico, no resolución visual medida. Un mapa mayor no añade contactos de las luces interiores. Si se ajusta volumen o bias, conservar cobertura de los seis departamentos y comprobar Compras sin cubierta; no vincular el volumen a la cámara móvil ni perder el cache.

## Auditoría de materiales

GLB: 26 materiales, 116 primitivas incluidas seis de proxies, 110 visuales, 60.398 triángulos visuales. Hay atributos normales en las 116 primitivas y UV0 en 30; no hay colores de vértice. Sin extensiones glTF, mapas normal, AO, emisión o metallic-roughness. Cuatro PNG de 512×512 se reutilizan mediante nueve referencias de textura de color base. Eso es PBR válido, aunque limitado en microdetalle.

| Familia e IDs reales                                                                     | Lectura actual y limitación                                                                                |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `mat_concrete_platform`, `mat_paving_stone`, `mat_paving_light`                          | Color texturado; rugosidad constante 0,9 / 0,85 / 0,8; poca variación especular espacial                   |
| `mat_stone_plinth`, `mat_stone_limestone`                                                | Color texturado, rugosidad 0,8 / 0,75; sin relieve superficial                                             |
| `mat_wood_deck`, `mat_wood_oak`                                                          | Color texturado, rugosidad 0,75 / 0,6; sin respuesta anisotrópica o normal de veta                         |
| `mat_metal_graphite`, `mat_metal_cladding`, `mat_metal_rack`                             | Metalness 0,8 / 0,2 / 0,5; dependen de señales del entorno para leer como metal                            |
| `mat_glass_clear`                                                                        | Una cara, roughness 0,05, alfa; `depthWrite=false`, orden 1; sin transmisión, IOR, espesor o absorción     |
| `mat_interior_white`, `mat_interior_floor`, `mat_interior_stone`, `mat_interior_epoxy`   | Pared difusa; suelo cálido con emisión nocturna 0,14 / 0,14 / 0,1; posible reducción de contraste interior |
| `mat_emissive_warm`, `mat_emissive_blue`, `mat_screen`                                   | Intensidades noche 2,4 / 1,5 / 1,2; día 0 / 0,35 / 0,7. No generan bloom actual ni iluminación indirecta   |
| `mat_safety_yellow`, `mat_cardboard_kraft`, `mat_polymer_charcoal`                       | Colores funcionales, no deben adoptar indiscriminadamente el acento de marca                               |
| `mat_vegetation_leaf`, `mat_vegetation_shrub`, `mat_wood_bark`, `mat_landscape_planting` | Colores compartidos, rugosidad alta; no hay parámetro de tema autorizado para desaturar hojas              |
| `mat_ground_surround`                                                                    | Único color base sustituible por tema: grafito `#0c0e12` / gris vegetal `#a3a89c`                          |

El vidrio alfa pierde presencia cuando baja su opacidad; transmisión física es una alternativa más costosa por píxel, con requisitos de entorno. No basta subir opacidad para reproducir vidrio arquitectónico. [Documentación oficial de MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html).

La ordenación actual no garantiza resolver paneles transparentes intersecados o múltiples plantas. Revisar accesos y despacho de Compras desde exploración cercana. No cambiar todos los vidrios a doble cara ni añadir sombras a todas las puntuales como solución general.

## Dirección propuesta por tema

### Oscuro

Conservar grafito profundo y pareja fondo/niebla; evitar levantar todos los negros mediante exposición. Calibrar primero la proporción hemisferio/entorno/principal para que fachadas mantengan volumen. Comparar con y sin relleno cálido amplio: la calidez debería proceder principalmente de interiores y luminarias locales.

Acordar reflejos exteriores suaves antes de aumentar brillo de cristaleras o metal. Resolver el control individual de entorno descrito arriba. Reducir emisión difusa de suelos solo si las capturas confirman interiores planos y las puntuales conservan legibilidad. Mantener azul moderado, sin transformar marcos completos en neón. Bloom posterior, restringido a fuentes justificadas.

Niebla 260–620 m podría integrar principalmente el terreno lejano y apenas separar edificios en escritorio. Es una hipótesis: `Fog` utiliza profundidad en cámara (`-mvPosition.z`), no distancia al centro global. Medir profundidades de arquitectura en los encuadres existentes y exploración permitida antes de ajustar; en móvil la cámara puede estar más lejos. No adaptar la cámara a la niebla.

### Claro

La combinación principal 3,2, hemisferio 1,4, entorno 0,7 y relleno puede producir luminosidad amplia; no demuestra sobreexposición sin píxeles actuales. Comparar por separado hemisferio y entorno, manteniendo una principal suave que modele volumen. No resolver pavimentos lavados oscureciendo indiscriminadamente todo el perfil.

Mantener cielo gris azulado y entorno continuo, evitando blanco puro. Solicitar microvariación de rugosidad en pavimentos antes de simular humedad global. Con luz local y emisión cálida a cero, comprobar si aún se leen interiores: una contribución cálida tenue de día requiere decisión del productor. Vegetación compartida no se puede recolorear desde el adaptador actual sin ampliar permisos del perfil o revisar el material fuente.

El mockup solo proporciona referencia oscura. El modo claro necesita aprobación propia: materiales naturales, volumen, contraste del vidrio y jerarquía de superficies, conservando la arquitectura del Shell.

## Evaluación de técnicas y degradación

Los costes siguientes son **estimaciones cualitativas**, no FPS, milisegundos ni memoria GPU medidos.

| Técnica                              | Problema que aborda                            | Coste probable / temas                                                              | Activos o Blender                                                             | Alta / Equilibrada / Baja propuestas                        |
| ------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Luz, exposición y Neutral calibrados | Volumen, rango tonal y lectura material        | Bajo coste incremental con rig fijo; ambos                                          | Valores acordados del perfil; no modelado                                     | Mismos principios en los tres                               |
| PMREM exterior coherente             | Reflejos/iluminación ambiental de arquitectura | Prefiltrado al cargar y memoria; ambos                                              | No necesita editar GLB; entorno externo exige procedencia y acuerdo de perfil | Entorno compartido; resolución menor según medición         |
| Niebla lineal                        | Continuidad del terreno y profundidad          | Bajo; ambos                                                                         | Parámetros existentes                                                         | Conservar en los tres; no sustituye oclusión                |
| Sombras cacheadas                    | Anclaje al suelo y volumen exterior            | Mapa inicial/invalidados + muestreo por píxel; ambos                                | No                                                                            | Mantener 2048 / 1024 / 512 iniciales; verificar legibilidad |
| Bloom selectivo                      | Halo discreto de luminarias/acento             | Medio, umbral/desenfoques y posiblemente selección adicional; principalmente oscuro | No necesariamente; máscara semántica puede requerir metadata                  | Opcional moderado / reducido / desactivado                  |
| AO de pantalla                       | Contactos y rincones de opacos                 | Medio–alto: profundidad/normales/muestreo; ambos                                    | No para prueba; AO horneada requiere activo nuevo                             | Opcional / baja resolución / desactivado                    |
| Viñeta                               | Marco periférico para barras                   | Ya existe CSS por tema; no añadir segundo pase                                      | Solo Shell si se revisa                                                       | Conservar actual; evitar acumulación                        |
| Vidrio físico                        | Reflexión y transmisión más independientes     | Alto en superficies grandes; ambos                                                  | Material/exportación futuros y compatibilidad de extensiones                  | Prueba acotada / aproximación alfa / alfa coherente         |
| SSR o reflejo planar dinámico        | Reflejo del campus en pavimento/vidrio         | Alto, artefactos de pantalla o render adicional; ambos                              | No necesariamente, pero no es primera prioridad                               | Posponer en todos inicialmente                              |
| Grading o DOF                        | Paleta o separación focal                      | Grading bajo–medio; DOF medio–alto y riesgo para etiquetas; ambos                   | No                                                                            | Posponer; DOF no necesario para identidad básica            |

AO no aporta luz indirecta y no debería ennegrecer los vidrios. Bloom por umbral no es selección semántica: reflejos brillantes también pueden entrar; un material emisivo compartido puede mezclar bordes y luminarias. Usar la propuesta de Claude para decidir máscara, umbral y presupuesto. La biblioteca PMNDRS permite configurar bloom, pero no está instalada aquí; evaluar primero las alternativas de Three ya disponibles, integración y mantenimiento. [Documentación primaria de BloomEffect](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/BloomEffect.js~BloomEffect.html).

Si posteriormente se justifica un compositor, integrarlo con la misma escena/cámara y demanda de frames; no crear otro controlador. Intensidad cero no garantiza coste cero de un pase montado: acordar desactivación por perfil al iniciar sin alternar estructuras/programas con el tema. Probar efectos en espacio lineal/HDR antes de comprimir luces y convertir salida.

## Integración con Shell y etiquetas

El mismo `useAppearance` ya controla `data-tone` y `CampusTheme`; fondos CSS/3D coinciden nominalmente (`#07090d` / `#dfe3ea`). La desconexión no se explica por ausencia de selector compartido.

HTML utiliza superficies grafito translúcidas o blancas, blur 18 px y saturación 1,2/1,5; las etiquetas tienen superficies propias. La viñeta oscura ya atenúa bordes y franjas superior/inferior; la clara aclara esas franjas. El título contextual, barra superior/lateral, panel, etiquetas, dock y estado ocupan capas por encima del canvas. Las etiquetas se proyectan desde anclas reales, priorizan selección y evitan regiones HTML; no participan en profundidad, fog o tone mapping WebGL.

Preservar posición y algoritmo. Evaluar contraste con general, foco y panel abierto: aumentar contraste de toda la escena podría competir con el panel, mientras oscurecerla demasiado dejaría las etiquetas como protagonistas. No intentar iluminar tarjetas HTML con PointLights ni aplicar un filtro CSS global al canvas para compensar materiales.

Sincronización propuesta: modo compartido, intención de fondo, acento y estado; colores físicos independientes. Los presets azul/púrpura/rojo existen en CSS, pero `data-accent` todavía no se activa y `mat_emissive_blue` solo permite cambiar intensidad. Activar acentos 3D requiere mapa semántico y aprobación; no recolorear metal de estanterías, seguridad o luces interiores como acento. No introducir otro almacén de temas.

## Rendimiento y plan de medición

| Perfil actual | DPR máximo | Sombras       | Vegetación y detalle                                                             |
| ------------- | ---------- | ------------- | -------------------------------------------------------------------------------- |
| Alta          | 1,5        | 2048, PCFSoft | Vegetación proyecta; detalle completo                                            |
| Equilibrada   | 1,25       | 1024, PCFSoft | Esenciales conservados; secundarios por foco/distancia                           |
| Baja          | 1          | 512, PCF      | Vegetación sin proyección; arquitectura conservada; secundarios más restringidos |

Son opciones de desarrollo; producción usa Alta. No hay adaptación automática. Reducir detalle no cambia la biblioteca de iluminación; no atribuir todo el coste a los 60.398 triángulos. El PMREM se genera una vez y los materiales se clonan una vez, no al alternar.

Instrumentación 3.5: intervalos/FPS en actividad, p50/p95/máximo, CPU wall del render y sombras, llamadas/triángulos separados del pase de sombra, geometrías/texturas/programas, resolución efectiva y tiempos de carga. Buffers/texturas son estimaciones parciales que excluyen PMREM, framebuffer, sombras y driver. No mide tiempo GPU, bytes residentes, coste aislado de transparencia o blur. En reposo `demand` no tiene un FPS de animación significativo; usar la muestra activa de cinco segundos.

Preparar matriz oscuro/claro × general/Compras/Almacén × tres perfiles a 1440×900; comprobar además 1920×1080 y 390×844, panel abierto y Compras sin cubierta. Guardar captura, renderer, DPR, estado final, JSON de cinco segundos, p95/máximo y duración real del vuelo. Repetir con GPU física y software separados, con calentamiento y misma interacción; comparar una variable cada vez usando diagnóstico `shadows=off`, `interiorLights=off`, `transparency=off`, `blur=off`. Ocultar vidrio es solo una ablación diagnóstica, no una mejora artística.

Si hay compositor futuro, ampliar probe para sumar pases: los contadores actuales pueden reflejar únicamente el último render y no describir el frame completo. La comparación de blur incluye compositor del navegador y no aparece íntegra en CPU wall de Three. Fijar presupuestos con esas muestras; no inventar porcentajes de mejora ahora.

## Riesgos, documentación e implementación incremental

1. **Antes de cambios:** recibir propuesta de Claude y acordar semántica del entorno/vidrio, luces, materiales y campos autorizados. Capturar línea base 0.4.0 real; la imagen histórica no sustituye esta etapa.
2. **Base sin efectos:** tras aprobación, calibrar parámetros existentes con el mismo adaptador y operadores fijos. Resolver la intensidad individual de entorno con prueba del resultado del shader. Mantener encuadres y límites intactos.
3. **Material/entorno coordinado:** adoptar únicamente propuesta versionada y compatible; preservar 99 identidades, anclas, proxies, cubierta y reversión. Las copias actuales permanecen verificables.
4. **Efectos opcionales:** probar primero AO de contacto o bloom justificado, uno por vez, con degradación por perfil. Mantener una identidad aceptable sin compositor en Baja.
5. **Aceptación:** comparar imágenes actuales con mockup oscuro y aprobar referencia clara; revisar cristales/interiores/cubierta, paneles/etiquetas, navegación rápida, movimiento reducido, estabilidad de programas/texturas y percentiles.

Riesgos concretos: reflejos por material no efectivos, fuga interior sin sombras, pérdida de contraste por emisión/ambiente, sorting del vidrio, acumulación de viñeta, AO sobre transparencias, bloom sobre superficies no deseadas, doble transformación de salida, recompilaciones por cambio de estructura y contadores incompletos con múltiples pases. El efecto de cámara temporal permanece en el controlador existente; esta fase no lo modifica.

Aclaraciones documentales: 3.3 dice que la reversión exige restaurar consumidor; 3.6 introduce bundles completos y sustituye esa limitación. El productor propone ocultar grupos completos; 3.6 conserva esenciales por mezclas de material. 3.4 describe vuelos lentos a pocos FPS; 3.5 corrige tiempo descartado, pero las 19 E2E históricas siguen sin reevaluación real posterior. El perfil admite bloom, pero implementarlo nunca fue requisito cumplido. Estos estados históricos deben leerse con su versión, no como contradicciones que autoricen reemplazar arquitectura. La intención de `envMapIntensity` sí necesita aclaración conjunta por el hallazgo de Three 0.180.

Documento operativo para el productor: [coordinación con Claude](coordination-claude-3.7-b.md). No se envió a terceros ni se modificó el repositorio Blender. Solo se generan documentos; la unificación visual queda pendiente de aprobación.
