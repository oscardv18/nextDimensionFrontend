# D.4 — Company World como único mundo activo

## Resultado

`pnpm dev` y `/campus-3d` cargan directamente `arxnet.scene.company-world@0.2.0` (D.2). No se necesitan flags. El activo es el mismo GLB validado en D.3: 1.792.432 bytes, SHA-256 `bdbd5e9b2b2a51006d2ea32c64f170dbb2196a19667a616599e53d9ff379d6cc`, 246 nodos, seis departamentos, 21 materiales y cuatro luces interiores. No se modifican los archivos originales, contratos ni metadatos copiados del productor.

`world`, `v`, `assetVersion` y `VITE_CAMPUS_ASSET_VERSION` dejan de seleccionar versiones. La configuración activa es explícita en `asset-bundle.ts`: manifiesto, build, temas y candidatos de cámara del mismo directorio versionado. Para futuras actualizaciones se incorporará un nuevo directorio y se cambiarán juntos esos cuatro imports, verificando nuevamente GLB y procedencia.

El FOV aceptado sigue siendo 20°. `?fov=15` permanece como herramienta de desarrollo; producción conserva 20°. Se mantienen los perfiles `high`, `balanced` y `low`, su resolución, sombras e iluminación, y el diagnóstico plegable. No hay selector de activos históricos en la interfaz ni en el formulario de diagnóstico. No hay cambios de estado persistente asociados a la migración.

## Inspección y simplificación

D.2 se cargó con GLTFLoader y superó sus siete pruebas reales antes de retirar los activos anteriores. Los límites siguen procediendo exclusivamente de `overviewFramingNodeIds` y los proxies: ni entorno, mobiliario ni suelo amplían el encuadre. La comparación con la referencia analítica C.2 conserva los 42 encuadres de los seis departamentos y vista general, con FOV 20/15 a 1440×900, 1920×1080 y 390×844.

Se conserva la organización existente, sin una segunda cámara ni un nuevo sistema de temas:

| Responsabilidad                           | Archivos conservados                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| Bundle versionado y validación/carga      | `asset-bundle.ts`, `asset.ts`, `campus-viewer.tsx`, `scripts/verify-campus.mjs` |
| Escena, proxies y coordinación de entrada | `campus-scene.tsx`, `campus-navigation.test.tsx`                                |
| Composición y navegación                  | `camera-framing.ts`, `camera-flight.ts`, `manual-navigation.ts`                 |
| Cubiertas, fachadas e interiores          | `reveal-layers.ts` y metadatos D.2                                              |
| Materiales, iluminación y niebla          | `campus-theme.ts`, `campus-theme-rig.tsx`, `fog-safety.ts`, `shadow-cache.ts`   |
| Calidad e instrumentación                 | `graphics-quality.ts`, `performance-tools.tsx`, `performance-probe.tsx`         |
| Shell, paneles y etiquetas                | Componentes existentes y sus algoritmos compartidos                             |

Los nombres públicos `Campus*`, el directorio `features/campus`, los atributos de diagnóstico y `/campus-3d` permanecen para evitar una migración nominal sin beneficio funcional.

Se eliminan las ramas del campus anterior: selección por versión/env, perfiles de cámara históricos, referencia única a `campus.roof`, detalle progresivo específico de los grupos del campus y calibración comparativa experimental de su renderizador. El diagnóstico de cubierta ahora consulta la capa del departamento seleccionado; en general comprueba todas las cubiertas. Las capas inválidas generan un error explícito. Se conserva el comportamiento D.2 de abrir cubierta y fachada al seleccionar, cerrar/restaurar desde «Ver interior», y restaurar todos los edificios al volver a general. Las etiquetas interiores siguen usando las anclas reales del manifiesto.

La iluminación estable sigue empleando RoomEnvironment, NeutralToneMapping, PBR y el adaptador existente. No se aplica una nueva dirección artística. Se retira únicamente el campo sin consumidor `vegetationShadows`, específico del campus anterior. Las sombras arquitectónicas de Company World conservan su política existente. No se han instalado ni retirado paquetes: no se identificaron dependencias exclusivas del código retirado; Three.js, Fiber y Drei siguen siendo necesarias.

## Archivos retirados y conservados

Se retiraron **28 archivos originales, 5.793.393 bytes**, después de comprobar individualmente sus hashes contra el respaldo:

- GLB históricos de `public/assets/arxnet.scene.campus-pilot/{0.2.0,0.3.0,0.4.0}` y `public/assets/arxnet.scene.company-world/0.1.0`.
- Metadatos históricos de `src/features/campus/assets/{manifest,build,themes}.json`, `assets/{0.2.0,0.3.0}` y `assets/company-world/0.1.0`.
- `campus-detail.tsx`, `detail-controller.ts` y sus pruebas, exclusivos del campus.
- `renderer-calibration.ts` y sus pruebas unitarias/E2E, exclusivos de la comparación del renderizador histórico.
- `company-world.test.ts` de C.1 y `e2e/integration-3.6.spec.ts` del campus 0.4.0. Las comprobaciones compartidas se migran al GLB activo; las E2E de navegación, temas, capas y calidad continúan disponibles.

El inventario exacto, con SHA-256 original por archivo, está en `archives/d4-restore/retired-files.json`. El respaldo completo incluye las fuentes retiradas, los activos y la configuración previa. Está fuera de `public`, `src` y `dist`.

Se conservan documentación histórica, informes de procedencia, capturas previas, mockups y el paquete literal D.2. El repositorio productor `/home/oddv/Renders/arxnet-3d` no se modifica. Sus exportaciones y fuentes Blender siguen disponibles allí.

Los documentos C.2/D.3 y el README literal del productor contienen instrucciones experimentales anteriores. Son evidencia histórica, no instrucciones actuales de activación. D.4 sustituye esa decisión; se registra también en `docs/migracion/plan.md`. El estado `published: false` del paquete no se altera: la aprobación del mundo de desarrollo no publica el activo del productor.

## Validación y límites

- **TypeScript, ESLint, Prettier:** comprobados con `pnpm check`.
- **Unitarias:** 123 pruebas en 17 archivos. Cubren hash corrupto, identidad contractual, versión incompatible de temas, capas ajenas, seis proxies seleccionables con mobiliario, restauración sin mover geometría, sombras cacheadas, ambos temas sin recrear materiales, interrupciones/movimiento reducido, arrastre/zoom/táctil, composición responsive y retorno exacto.
- **Integridad:** `pnpm assets:verify` valida todas las copias D.2 con su procedencia, cabecera GLB, inventario, nombres/roles/padres, seis interacciones, capas, anclas, materiales, luces y compatibilidad de temas. También impide reintroducir activos históricos en `public`.
- **Producción:** `pnpm build` aprobado. Solo se publica el GLB 0.2.0. Chunk de metadatos/calidad: 66,68 kB / 9,23 kB gzip frente a 195,41 / 25,84 del cierre D.3; visor: 974,91 / 264,15 frente a 982,24 / 266,61. Son tamaños del compilador, no medidas de GPU ni mejoras de FPS. La advertencia del chunk 3D mayor de 500 kB permanece visible.
- **E2E/visual:** se intentó ejecutar `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/brave pnpm exec playwright test e2e/company-world-d2.spec.ts`. El servidor no pudo arrancar. La reproducción directa con Vite confirmó `listen EPERM 127.0.0.1:5173`. Ninguna prueba de navegador se presenta como aprobada; no se generaron capturas D.4 ni se midieron FPS/GPU. Las pruebas siguen habilitadas y no se aumentaron timeouts. Playwright descubre correctamente 103 pruebas E2E en seis archivos; descubrirlas no equivale a ejecutarlas.

Pendiente en un entorno que permita servidor/navegador: abrir `/campus-3d` sin parámetros, revisar ambos temas, seis selecciones, interiores de Compras/Almacén, cerrar/reabrir cubiertas y fachadas, explorar con mouse/táctil, Escape y los tres perfiles. Ejecutar la suite E2E completa allí. La evidencia analítica y de GLTFLoader no sustituye esa revisión visual.

## Restauración verificable

No existe un repositorio Git operativo en este workspace; se recomienda inicializarlo para los siguientes cambios. Antes de modificar o retirar archivos se creó `archives/d4-restore/before-d4.tar.gz`: **266 archivos**, todos verificados byte a byte mediante SHA-256 al leer nuevamente el archivo tar. El archivo comprimido tiene 9.153.695 bytes y su hash está en `archive.sha256`. `files.sha256.json` contiene el inventario completo previo a D.4.

Para recuperar el frontend anterior sin mezclarlo con archivos nuevos, restaurar en otro directorio vacío:

```bash
# Ejecutar desde la raíz del frontend actual.
ARXNET_BACKUP="$PWD/archives/d4-restore"
(cd "$ARXNET_BACKUP" && sha256sum -c archive.sha256)
ARXNET_RESTORE="$(mktemp -d /tmp/arxnet-before-d4.XXXXXX)"
tar -xzf "$ARXNET_BACKUP/before-d4.tar.gz" -C "$ARXNET_RESTORE"
python3 - "$ARXNET_BACKUP/files.sha256.json" "$ARXNET_RESTORE" <<'PY'
import hashlib, json, pathlib, sys
inventory = json.loads(pathlib.Path(sys.argv[1]).read_text())
root = pathlib.Path(sys.argv[2])
for name, expected in inventory.items():
    assert hashlib.sha256((root / name).read_bytes()).hexdigest() == expected, name
print(f"Restauración verificada: {len(inventory)} archivos")
PY
cd "$ARXNET_RESTORE"
pnpm install --frozen-lockfile
pnpm assets:verify
pnpm dev
```

El respaldo excluye dependencias instaladas, `dist`, Git y configuración de agentes. Restaurar solo un GLB histórico no recupera su consumidor: para revertir se restaura el frontend completo anterior. D.4 no conserva un selector de reversión en ejecución. Los activos del productor no necesitan restauración porque nunca se modificaron.
