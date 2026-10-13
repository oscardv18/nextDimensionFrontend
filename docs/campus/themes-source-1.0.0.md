# Perfiles de tema 3D — especificación e integración

Archivo: [`manifests/themes/arxnet.campus-themes.json`](../manifests/themes/arxnet.campus-themes.json), `profileVersion` **1.0.0**, estado `provisional`. Fuente de la apariencia 3D de `arxnet.scene.campus-pilot` **0.3.0**. Versión independiente del contrato GLB (1.0.0, sin cambios). Ningún valor de luz, bloom, transparencia o exposición es definitivo hasta validarlo en React Three Fiber.

## Principio

Un único GLB y una única geometría. Los temas oscuro y claro representan el mismo espacio físico: los colores base de los materiales compartidos no cambian; cambian luz, entorno, fondo, niebla, emisión y unos pocos parámetros. El modo claro no es una inversión de colores.

Un cambio de tema solo modifica **uniforms** (colores, intensidades, opacidades, exposición). No cambia mapas, `transparent`, `side`, tipo de tone mapping, número/tipo de luces ni `castShadow`: así three.js no recompila programas y la escena no se recarga.

## Estructura del archivo

| Clave | Contenido |
|---|---|
| `profileVersion`, `status`, `assetId`, `assetVersion`, `contractVersion` | Identidad y versión del perfil y del activo al que corresponde |
| `conventions` | Colores hex sRGB; coordenadas glTF/three (Y arriba); direcciones de luz desde el objetivo hacia la luz; unidades físicas de three r155+ (point en candela) |
| `renderer` | Ajustes fijos para ambos temas: `toneMapping: Neutral`, `outputColorSpace: srgb`, `shadowMapType: PCFSoft`, `environment: RoomEnvironment` e `invariants` |
| `textures` | Texturas de detalle embebidas en el GLB: archivo, tamaño, espacio de color, patrón, procedencia y licencia |
| `materials` | Biblioteca. Por material: `class`, `use`, valores PBR del GLB (= tema oscuro), `texture`/`tileMeters`, `emissive`/`emissiveIntensity`, `opacity`, `envMapIntensity` y `themeKeys` |
| `themes.dark`, `themes.light` | `background`, `fog`, `exposure`, `environmentIntensity`, `lights` (`hemisphere`, `key`, `fill`), `localLightIntensityScale`, `materials` (solo `themeKeys`) y `effects.bloom` |
| `localLights` | 14 luces puntuales interiores, locales a su grupo departamental (`parentNodeId`); intensidad × `localLightIntensityScale` del tema |
| `environmentNodeIds` | Nodos decorativos del entorno (igual que en el manifiesto) |
| `transition` | 320 ms, `easeInOutCubic`; instantáneo con movimiento reducido |

Clases de material: **compartido** (sin claves de tema), **adaptable** (cambia parámetros numéricos: emisión, opacidad, reflejo), **sustituible** (puede cambiar también el color base; hoy solo `mat_ground_surround`, que se funde con fondo y niebla).

Comprobación: `python3 scripts/check_themes.py --themes … --glb … --manifest …` verifica que materiales y texturas del GLB coinciden con el perfil, que no hay extensiones, que los transparentes son `BLEND` + `doubleSided:false`, que `emissiveFactor = emissive × min(I, 1)`, que los temas fijan las mismas claves, que solo tocan `themeKeys` permitidas, que `castShadow` y el conjunto de luces y efectos no cambian entre temas, que `dark` coincide con el GLB y que `environmentNodeIds` y `localLights` refieren nodos válidos.

## Integración en React Three Fiber (responsable: Codex)

Este repositorio no modifica el frontend. Pasos propuestos para `nextDimmension-dashboard/src/features/campus/`:

1. **Activos.** Publicar `exports/arxnet.scene.campus-pilot/0.3.0/asset.glb` en la ruta de `assetUrl` y reemplazar a la vez `assets/manifest.json` y `assets/build.json` (`resolveCampus` exige el inventario exacto: 99 nodos). Añadir `assets/themes.json` copiado del perfil.
2. **Límites de navegación.** El suelo del entorno es un disco de 420 m de radio. `campus.bounds` no debe salir de `Box3.setFromObject(scene)`: calcularlo con los nodos que **no** estén en `manifest.environmentNodeIds` (o de forma equivalente desde `overviewPoints` y el emplazamiento). Si no se hace, `navigationLimits` amplía el paneo a cientos de metros.
3. **Materiales al cargar** (en `prepareCampus`, después de clonar):
   - Recomendado: un clon por **nombre** de material (23) en vez de uno por malla (79); menos objetos que actualizar.
   - Para cada material del catálogo con `emissive`: `material.emissive.set(spec.emissive)` una vez (el GLB lleva el factor ya multiplicado por la intensidad oscura, limitada a 1). Después `emissiveIntensity` lo fija el tema.
   - `envMapIntensity` desde el catálogo; transparentes con `depthWrite=false` (ya existe) y `castShadow=false`.
   - Mallas visuales opacas: `castShadow=true`, `receiveShadow=true`. `site.environment-ground` solo recibe. Proxies `hit` sin cambios.
   - Eliminar `night-lighting.ts`: sus valores (balizas 2,4; suelos 0,14) están ahora en el tema oscuro por material.
4. **Renderer.** `<Canvas shadows="soft" gl={{ toneMapping: NeutralToneMapping, outputColorSpace: SRGBColorSpace }}>`. La exposición del tema va a `gl.toneMappingExposure`.
5. **Entorno.** `scene.environment = new PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture` una sola vez; `scene.environmentIntensity` según el tema. No hace falta HDR externo.
6. **Rig fijo** (se monta igual en ambos temas):
   - `hemisphereLight(skyColor, groundColor, intensity)`.
   - `directionalLight` `key`: `position = centro + normalize(direction) × distance`, `target` en el centro del emplazamiento (centro de los límites sin entorno). `castShadow`, `shadow.mapSize = 2048`, cámara ortográfica `±cameraHalfExtent` con `near`/`far`, `bias`, `normalBias` y `shadow.intensity` (three ≥ r167).
   - `directionalLight` `fill` sin sombras.
   - 14 `pointLight` hijos de `campus.nodes.get(parentNodeId)` en `position` local, `distance`, `decay`, `castShadow=false`. Con intensidad 0 de día; **no** desmontarlas (cambiaría el número de luces y recompilaría). Si el rendimiento lo exige, retirarlas en ambos temas por igual y subir la emisión interior del tema oscuro.
7. **Fondo y niebla.** Una sola instancia de `Color` en `scene.background` y una de `Fog` en `scene.fog`, actualizadas por el tema (sustituye el `#07090d` fijo de `campus-scene.tsx`).
8. **`applyTheme(campus, profile, name, { reducedMotion })`.** Interpola durante `transition.durationMs` todos los valores del tema de destino: colores con `Color.lerpColors` (lineal), números linealmente; luces, fondo, niebla, exposición, entorno, `localLightIntensityScale` y `themes[name].materials[*]`. Con `frameloop="demand"`, llamar a `invalidate()` en cada paso. Con movimiento reducido, aplicar al instante. Enlazarlo con `useAppearance()` (`ResolvedAppearance` `'light' | 'dark'`), en sincronía con la clase `transicion-tema` del Shell.
9. **Bloom (opcional).** Requiere añadir `@react-three/postprocessing` (decisión de Codex). Montarlo siempre; `intensity` 0 en claro; umbral de luminancia 1,0 para que solo florezcan emisivos con intensidad > 1. Sin bloom, el resto del perfil funciona igual.

### Pruebas de aceptación en el navegador

1. Alternar oscuro → claro → oscuro no vuelve a descargar el GLB (pestaña Red) y deja todos los valores idénticos al estado inicial.
2. `gl.info.programs.length` no cambia tras alternar tema (sin recompilación).
3. Selección por proxies, foco, etiquetas y ocultación de `procurement.roof` funcionan igual que con 0.2.0.
4. Los límites de navegación coinciden con los de 0.2.0 (el entorno queda excluido).
5. Capturas de vista general, Compras y Almacén en ambos temas; comparar con los renders de evaluación de `validation/reports/phase-1.2/`.
6. Medir `gl.info.render.calls`, triángulos, programas, texturas y FPS en ambos temas, con y sin las 14 luces locales.
7. Sin artefactos de orden de transparencias al acercarse a Compras; el azul de bordes y señalización mantiene contraste en el modo claro.

## Previsualización en Blender (no es el resultado web)

`render_themes()` del generador aproxima cada perfil en EEVEE: el hemisférico se convierte en un mundo de intensidad I/π, las point lights en potencia 4π × cd, el entorno en un término gris uniforme, `Khronos PBR Neutral` como transformada de vista y la exposición en paradas (`log2`). No reproduce niebla, bloom ni RoomEnvironment. Los transparentes no proyectan sombra. Sirve para evaluar la dirección artística, no para aprobar valores. Se ejecuta en un proceso Blender aparte que no guarda el fuente, porque eleva la emisión por encima del límite del GLB.
