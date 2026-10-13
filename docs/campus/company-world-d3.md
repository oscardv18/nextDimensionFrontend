# Fase D.3 — Company World 0.2.0, candidato D.2

Fecha: 2026-10-13. Estado: **integrado experimentalmente; aprobación visual y rendimiento WebGL pendientes**. Se conserva el Shell y la composición de C.2. No se modifica Blender ni se detalla ningún otro departamento.

## Activar inmediatamente y volver atrás

Con `pnpm dev`, abrir en Brave:

```text
http://localhost:5173/campus-3d?world=company-world&v=0.2.0
```

La cámara mantiene FOV 20° por defecto. Para comparar con el FOV experimental anterior:

```text
/campus-3d?world=company-world&v=0.2.0&fov=15
```

Reversión a C.1:

```text
/campus-3d?world=company-world&v=0.1.0
```

Reversión al campus predeterminado: **`/campus-3d`**, sin parámetros. La URL anterior `?world=company-world` sigue seleccionando C.1; no se cambia silenciosamente. El selector es exclusivo de desarrollo, no persiste en localStorage y carga un bundle completo por página. El formulario de calidad conserva `v` para evitar volver accidentalmente a C.1.

Añadir `&quality=high`, `&quality=balanced` o `&quality=low` para comparar los perfiles existentes; el selector de apariencia del Shell sigue controlando oscuro/claro. No activar los experimentos de iluminación 3.7-B al tomar la referencia base D.2.

## Paquete e integridad

Productor localizado explícitamente en `/home/oddv/Renders/arxnet-3d`. Se leyeron su `docs/company-world-handoff-d2.md` y `validation/reports/phase-4d/handoff-d2/README.md`. Los siete archivos enumerados en `SHA256SUMS` aprobaron antes de copiar.

Copias sin modificar:

- GLB → `public/assets/arxnet.scene.company-world/0.2.0/asset.glb`.
- Paquete de metadata/README/hashes → `src/features/campus/assets/company-world/0.2.0/`.
- [Registro de procedencia y hashes](provenance-company-world-d2.json).

GLB: **1.792.432 bytes**, SHA-256 `bdbd5e9b2b2a51006d2ea32c64f170dbb2196a19667a616599e53d9ff379d6cc`. Activo 0.2.0, contrato y perfil 1.0.0, candidato d2/B experimental no publicado. No se sobreescriben C.1, campus-pilot, mockups ni archivos del productor.

Se verifican **246 nodos**, 178 mallas de una primitiva y 21 materiales. Las **199 identidades de C.1** conservan nombre, rol y padre; interacciones, capas, estados, encuadre, entorno, rótulos y landmarks coinciden. `camera-candidates.json` es idéntico. Las verificaciones de build incluyen todas las copias y los activos anteriores.

Compartir contrato no equivale a aprobar geometría: las pruebas cargan el GLB D.2 real y comprueban cajas, capas, anclas, proxies y materiales. El README dice tanto que el podio recibe detalle como que permanece idéntico nodo a nodo; se interpreta la conservación como identidad/cajas, no como ausencia de añadidos. No se utiliza esa afirmación para saltar las comprobaciones.

## Materiales, luz e interacciones

Se reutiliza `CampusTheme`; los nuevos nombres salen del catálogo D.2. La lógica no reemplaza materiales por una apariencia genérica ni recolorea albedos arquitectónicos entre temas: solo cambian los patches permitidos. Perfil B y perfilería grafito proceden del activo; el azul permanece como acento declarado. No se añaden bloom, SSAO, transmisión física ni bibliotecas.

Cuatro PointLights experimentales reales, sin sombras, montadas una vez bajo sus grupos:

| ID                            | Intensidad oscura base | Alcance | Posición local   |
| ----------------------------- | ---------------------- | ------- | ---------------- |
| `procurement.light-office`    | 71,6 cd                | 9 m     | [-4,5; 2,6; 1,5] |
| `procurement.light-reception` | 55,7 cd                | 8 m     | [6,5; 2,6; 4,5]  |
| `warehouse.light-racks`       | 103,5 cd               | 10 m    | [-1; 3,2; -2,5]  |
| `warehouse.light-dispatch`    | 71,6 cd                | 9 m     | [-5,5; 2,8; 7,5] |

Escala oscura 1 / clara 0,35; decay 2. No se desmontan al cambiar tema. El hemisferio usa 1,382 / 4,084 y relleno 0, conforme al perfil. La emisión cálida y las diferencias de metal, vidrio, suelo y mobiliario permanecen en los materiales. El diagnóstico cuenta las cuatro luces automáticamente.

**Las fugas de luz no se han validado visualmente.** Puntuales sin sombras pueden iluminar a través de paredes; alcance corto no garantiza oclusión. No se reducen intensidades arbitrariamente sin capturas. El diagnóstico existente permite `&interiorLights=off` para una comparación aislada con mismos tema/FOV/calidad. Revisar cubiertas y plataformas con cada estado antes de retocar parámetros.

Selección y mobiliario: todas las mallas visuales mantienen raycast desactivado; seis proxies siguen recibiendo selección, comprobado con raycasts sobre la escena detallada. El mobiliario no se convierte en una capa interactiva que capture clics.

Capas: el seleccionado abre cubierta/fachada e interior; «Ver interior» restaura cubierta/fachada y permite volver a abrir. Las luminarias `*.roof-fixtures` son hijas reales de cubierta y desaparecen con ella. Escape restaura todos los vecinos y general. Baja conserva el interior del seleccionado; no se adopta una reducción que lo vacíe. Las transformaciones y las cajas de enfoque permanecen constantes durante cambios rápidos.

Se reactivan los tres hotspots existentes de Compras solo cuando sus IDs figuran en `zoneAnchors`. En D.2 son nodos de rol `label`, no mallas de mobiliario: ahora se usa su posición mundial real. Se corrige el caso de caja vacía que habría dado altura `-Infinity`. En C.1 siguen desactivados; campus-pilot conserva su anclaje superior por caja. No se inventan posiciones, zonas adicionales o lógica empresarial.

## Cámara conservada y corrección demostrada de niebla

Los 42 enfoques (C20/C15 × 1440×900, 1920×1080, 390×844 × general/seis departamentos) coinciden con C.1 con tolerancia de 0,0001 m. No se cambian perfiles, FOV predeterminado, dirección, márgenes, vuelos, paneo, zoom al cursor, tacto ni límites.

Se detectó un problema de parámetros de niebla: D.2 declara 340–520 m oscuro / 360–560 m claro para su referencia C15. En general móvil C15, **todos los puntos de encuadre están más allá de `fog.far`**. La niebla lineal los mezclaría completamente hacia el fondo; es una consecuencia comprobada de profundidad y shader, no una captura visual.

Corrección exclusiva de D.2: después de avanzar la cámara, desplazar ambos extremos del rango solo cuando la profundidad máxima de la arquitectura lo necesita, dejando un margen del 5 % del intervalo. Conservar el ancho del intervalo y el color. Los valores base permanecen en el perfil y se recuperan cuando vuelve a caber la arquitectura; en general escritorio C20 se comprueba offset 0. Se publica `data-fog-offset` en desarrollo.

No es una cámara nueva ni un esquema de niebla 1.1.0. C.1 y campus-pilot permanecen iguales. Esta protección conservadora evita ocultar el modelo para poder evaluarlo; la graduación atmosférica final, especialmente en foco y exploración distante, sigue pendiente de aprobación visual.

## Comparación de rendimiento disponible

[Estadísticas calculadas de geometría visible](company-world-d2-static.json), usando la política real de capas del frontend, sin render GPU:

| Estado                | C.1 primitivas / triángulos | D.2 primitivas / triángulos |
| --------------------- | --------------------------- | --------------------------- |
| Alta, general         | 128 / 10.728                | 166 / 30.656                |
| Alta, Compras abierta | 121 / 10.386                | 155 / 29.796                |
| Alta, Almacén abierto | 120 / 10.344                | 154 / 29.572                |
| Baja, general         | 110 / 9.996                 | 126 / 20.100                |
| Baja, Compras abierta | 106 / 9.774                 | 127 / 22.432                |
| Baja, Almacén abierto | 105 / 9.684                 | 130 / 25.840                |

Las cifras Baja difieren del productor porque aquí se conserva el entorno de soporte y el interior seleccionado. **Primitivas visibles no equivalen a draw calls medidos**, y triángulos de geometría no incluyen automáticamente pasadas de sombra. No se afirma que D.2 sea fluido por reducir geometría en Baja.

Ambos activos no tienen texturas GLB; D.2 añade cuatro luces y 38 primitivas visuales. El coste puede venir de llamadas, PBR, transparencias, sombras o píxeles. Se conserva el probe 3.5 con tiempos por frame, percentiles, CPU wall, contadores y estimaciones parciales de recursos. GPU ms/bytes residentes continúan no disponibles; no se midieron FPS ni memoria GPU real en esta ejecución.

Build: visor **982,24 kB / 266,61 kB gzip**; metadata/calidad **195,41 / 25,84 kB**, frente a **129,21 / 17,20 kB** en C.2. Las versiones preservadas añaden metadata al bundle. Son tamaños de transferencia, no coste GPU; mantener pendiente carga diferida de candidatos si se acumulan más. No se eleva el aviso >500 kB.

## Validación y capturas

| Comprobación                              | Resultado real                                               |
| ----------------------------------------- | ------------------------------------------------------------ |
| Hashes paquete/copia y activos anteriores | Aprobados                                                    |
| TypeScript / ESLint / Prettier            | Aprobados                                                    |
| Unitarias                                 | **146 aprobadas en 20 archivos**, 139 anteriores + 7 nuevas  |
| Compilación                               | Aprobada, exit 0, aviso de tamaño conservado                 |
| E2E D.3                                   | 10 casos descubiertos; intento bloqueado al iniciar servidor |
| Capturas frontend / GPU física            | No disponibles; aprobación pendiente                         |

Se intentó Brave mediante Playwright y Vite directo. El servidor local devuelve **`listen EPERM 127.0.0.1:5173`**; no se cargó el modelo en navegador. No se aumentan timeouts ni se desactivan pruebas. Las nuevas unitarias prueban selector/reversión, compatibilidad, cámaras, selección pese a muebles, capas/luminarias, nueve anclas, albedos/luces/identidades estables, niebla móvil y estadísticas. No equivalen a píxeles WebGL.

También se ejecutó `scripts/check_themes.py` del productor contra las copias frontend, sin modificar ese repositorio: **passed**, cero errores, 21 materiales, ambos temas, cuatro luces y cero texturas. Comprueba la correspondencia PBR del perfil con el GLB, no el resultado visual de esos materiales.

Se inspeccionaron las imágenes del productor `overview_dark.png` y `procurement_open_dark.png`: evidencian el detalle y la intención de luminarias/mobiliario, pero **son renders Blender**, no capturas del frontend ni aprobación de fugas/reflejos dentro del Shell.

Recorridos preparados para ejecución fuera de este entorno:

```sh
PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/brave pnpm exec playwright test e2e/company-world-d2.spec.ts
COMPANY_WORLD_VERSION=0.2.0 PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/brave pnpm exec playwright test e2e/company-world.spec.ts
```

Los diez casos D.3 generan general, Compras/Almacén abiertos y cerrados en ambos temas y tres perfiles; comparan C.1/D.2 con mismo FOV 20, tema, calidad Alta, viewport y encuadre, adjuntando capturas y muestras activas de cinco segundos. La suite C.2 parametrizada mantiene 37 recorridos para FOV, responsive, navegación y reversión, ahora seleccionable también con D.2.

Registrar renderer y comprobar `brave://gpu` antes de llamar a una muestra GPU física. Si es SwiftShader/llvmpipe, separar software; si no se identifica, marcar desconocido. Comparar p50/p95/máximo y resolución efectiva, no solo FPS promedio. Revisar al menos general oscuro/claro, ambos departamentos con cubierta y sin ella, Baja con interior completo y ausencia de geometría residual al regresar.

## Pendientes concretos

Validar fugas de las cuatro puntuales y emisión en paredes/plataformas; brillo diurno con hemisferio 4,084; orden del vidrio; precisión de juntas a distancia; hotspots sobre interiores; transiciones/cierre con interacciones rápidas; atmósfera con protección de niebla; FPS y recursos con GPU física y software separados. No alterar geometría para resolver una hipótesis ni comenzar los cuatro departamentos restantes.
