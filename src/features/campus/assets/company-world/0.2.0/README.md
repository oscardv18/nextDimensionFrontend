# company-world 0.2.0 — candidato d2: notas para Codex

Estado: **experimental, no publicado** · 2026-10-13 · contrato GLB **1.0.0** sin cambios · perfil de temas 1.0.0.

Paquete (no se modifica): `validation/reports/phase-4d/handoff-d2/`. Para verificarlo: `cd validation/reports/phase-4d/handoff-d2 && sha256sum -c SHA256SUMS`.

| Archivo | Para qué |
|---|---|
| `asset.glb` | Activo glTF 2.0 núcleo, sin extensiones ni texturas: 1,79 MB (225 KB con gzip) |
| `manifest.json` | Nodos, interacciones y anotaciones. Todo lo de c1 más `zoneAnchors` y `refinedDepartments` |
| `build.json` | `metrics.bytes` / `metrics.sha256` para `verifyAsset` |
| `themes.json` | Perfil de la dirección artística B (oscuro y claro) |
| `camera-candidates.json` | Igual que en c1 (C20 / C15) |
| `validation-summary.json` | Resultado de las comprobaciones |

Renders de referencia para AC4: `validation/reports/phase-4d/candidate-d2/renders/b/`:
- `overview_{dark,light}`;
- `procurement[_open]_{dark,light}`;
- `warehouse[_open]_{dark,light}`;
- `route_{dark,light}`.

Están hechos con el mismo pipeline que three: tono Neutral, niebla después del tono, fondo sólido y sin posprocesado.

## Qué cambia respecto a c1 (0.1.0)

1. **Compatibilidad: se conservan todos los IDs de c1** (199) con el mismo rol, nombre y padre. Cada nodo visual conserva también su material de c1, con el nombre nuevo.
   - Las interacciones, `revealLayers`, `visibilityStates`, `overviewFramingNodeIds`, `defaultHiddenNodeIds`, `signs`, `landmarks` y `environmentNodeIds` son idénticos.
   - Se mantiene **un nodo visual por material**: 178 mallas de una primitiva.
2. **Materiales renombrados.** Los `mat_bo_*` pasan a `mat_ad_*` con correspondencia 1:1:
   - `podium → ad_stone`, `structure → ad_concrete`, `metal → ad_metal`, etc.
   - Hay cuatro nuevos: `mat_ad_fixture` (luminarias, emisivo), `mat_ad_goods`, `mat_ad_marking` y `mat_ad_planting`.
   - `mat_accent_led` y `mat_accent_outline` no cambian (`accentMaterials`).
   - En total son 21 materiales.
3. **Compras y Almacén construidos**; el resto de edificios conserva la geometría del blockout, idéntica a c1 nodo a nodo.
   - Fachadas con montantes de tapeta, puerta de Compras hacia el puente y divisiones horizontales en el Almacén.
   - Albardilla grafito, equipos de cubierta detallados, escotilla, lucernario con junquillos y linterna acristalada.
   - Rótulos enmarcados.
   - Interiores reconocibles con la cubierta retirada:
     - **Compras:** recepción, 24 puestos, mesa de equipo, sala de reuniones acristalada, eje de circulación y almacén auxiliar.
     - **Almacén:** 3 filas dobles de estanterías con palés, pasillos señalizados, recepción con muelles, despacho con mesas de embalaje y transportador, oficina logística y 2 carretillas.
4. **Podio** (en todo el mundo):
   - juntas de pavimento en relieve de 3 cm;
   - banda de recorrido Compras → puente → Almacén;
   - montantes en barandillas y puentes, zancas y pasamanos en las escaleras;
   - arbustos y cinco árboles estilizados.
5. **Nodos nuevos** (47):
   - `<dep>.roof-fixtures`: luminarias, **hijas de `<dep>.roof`**, así que se ocultan con la cubierta;
   - hermanos `-<material>` nuevos en Compras, Almacén y `site.*`;
   - `site.paving` y `site.planting`;
   - **anclas de zona** (rol `label`, bajo `<dep>.zones`): `procurement.office-furniture`, `procurement.storage-racks`, `procurement.dock`, `procurement.reception`, `procurement.meeting-room`, `warehouse.racks`, `warehouse.receiving`, `warehouse.dispatch` y `warehouse.logistics`.
6. **`status: "review"`** (antes `blockout`). `assetVersion` 0.2.0.

## Notas de integración

- **Rutas sugeridas.** Siguen el mismo patrón que 0.1.0 y no reemplazan nada:
  - `public/assets/arxnet.scene.company-world/0.2.0/asset.glb`;
  - `src/features/campus/assets/company-world/0.2.0/{manifest,build,themes,camera-candidates}.json`.

  0.1.0 y campus-pilot 0.4.0 siguen intactos. Se puede seleccionar, por ejemplo, con `?world=company-world&v=0.2.0`.
- **Hotspots de Compras.** Hoy se desactivan cuando el manifiesto tiene `revealLayers`. En d2 existen `procurement.office-furniture`, `procurement.storage-racks` y `procurement.dock` como anclas de zona, en el área de puestos, el almacén auxiliar y la puerta de recepción. Ya pueden reactivarse para este activo.
- **Luces locales.** El perfil declara 4 luces puntuales sin sombra: 2 en Compras y 2 en el Almacén, hijas del grupo del departamento.
  - Son bajas y de alcance corto (`distance` 8–10) para no iluminar parapetos ni cubiertas.
  - El claro no las apaga: usa `localLightIntensityScale` 0,35, para no recompilar.
  - Si el diagnóstico del rig espera un número fijo de luces (F7 en c1), ahora son 4.
- **Iluminación.** Los valores salen de la previsualización: key ≈ π × sol de Blender y hemisferio ≈ π × mundo. Por eso el hemisferio es más intenso que en c1 (1,38 en oscuro y 4,08 en claro) y el relleno vale 0. Las intensidades de las puntuales (cd ≈ W/4π) están por calibrar en el navegador; comparar con los renders.
- **Temas.** Por tema solo cambian:
  - `emissiveIntensity` de `ad_floor`, `ad_interior`, `ad_fixture` y `mat_accent_*`;
  - el color de `ad_ground` y `ad_context`;
  - luces, niebla y fondo.

  La arquitectura tiene el mismo albedo en ambos temas.
- **Niebla.** Valores absolutos pensados para la vista general con C15 (≈ 320 m): 340/520 en oscuro y 360/560 en claro. Con C20 empieza más lejos. La niebla relativa a la distancia de la cámara (F9) sigue pendiente.
- **Precisión de profundidad.** Las juntas del pavimento y las marcas de suelo están separadas 2–3 cm de la superficie: no hay caras coplanares. En la vista general (a unos 300 m) conviene `camera.near` ≥ 0,5, o ajustado a la distancia, para que no parpadeen.
- **Perfil Bajo.** `visibilityStates.lowQuality` oculta los interiores y el entorno: quedan 124 primitivas y 20 mil triángulos.

## Rendimiento (del GLB; la medición real es AC13)

| Estado | c1 primitivas / triángulos | d2 primitivas / triángulos |
|---|---|---|
| Vista general | 128 / 10,7 mil | **166 / 30,7 mil** |
| Compras enfocada (cubierta y fachada ocultas) | 121 / 10,4 mil | 155 / 29,8 mil |
| Almacén enfocado | 120 / 10,3 mil | 154 / 29,6 mil |
| Perfil Bajo | 108 / 9,9 mil | 124 / 20,0 mil |

- Por departamento (d2 frente a c1): Almacén 9,2 mil triángulos y 39 primitivas (1,7 mil / 21), Compras 4,9 mil y 34 (1,2 mil / 20), podio 11,6 mil y 25 (2,8 mil / 19). Los otros cuatro edificios no cambian. Desglose en `candidate-d2/validation/d2-checks.json`.
- Las primitivas suben +38 (Compras +14, Almacén +18, podio +6) por los materiales nuevos. Si la medición lo pide, se pueden reducir así:
  - unir `fit-out-sign` con `fit-out-metal`;
  - quitar `ad_planting` del interior;
  - fusionar `partitions-*`.

  Ninguna de estas opciones cambia los IDs de c1.
- El GLB crece hasta 1,79 MB porque las caras planas parten vértices; con gzip queda en 225 KB.

## Validación

| Comprobación | Resultado |
|---|---|
| `validate.py --glb --manifest` (contrato 1.0.0) | ✅ |
| `check_themes.py` (perfil ↔ GLB ↔ manifiesto) | ✅ 21 materiales, 4 luces locales |
| `three_load_check.mjs` con el three 0.180 del frontend (`resolveCampus`, `validateThemeManifest`) | ✅ |
| Invariantes del generador: geometría dentro del hit, grupos = plano maestro, capas como grupos hijos, hits sin solapes | ✅ 25/25 |
| IDs de c1 conservados (rol, nombre, padre y material) e interacciones y anotaciones idénticas | ✅ |
| Operaciones, RR. HH., Administración, Ventas, pabellón, podio y entorno idénticos a c1 nodo a nodo | ✅ |
| c1 intacto: GLB y paquete; su `.blend` reexporta un GLB byte a byte idéntico | ✅ (ver la nota de abajo) |
| campus-pilot 0.4.0: exportaciones intactas | ✅ |
| `validate.py` del repositorio y `unittest` de `validation/` | ✅ |

**Nota de integridad.** El hash de dos `.blend` ya no coincide con su referencia.
- `candidate-c1/company_world_b.blend` cambió el 2026-10-13 a las 11:02. Reexportado, produce el mismo GLB que c1 (`validation/c1-reexport.json`): el contenido está intacto.
- `sources/scenes/campus_pilot.blend` está abierto en la sesión interactiva de Blender y se guardó a las 00:28.

Ninguno de los dos lo escribieron los scripts de esta fase.

## Regenerar y revertir

```sh
python3 scripts/blender/generate_company_world.py --manifest b
blender -b --factory-startup --python scripts/blender/generate_company_world.py -- --build b
blender -b validation/reports/phase-4d/candidate-d2/company_world_b.blend --python scripts/blender/generate_company_world.py -- --export b
blender -b validation/reports/phase-4d/candidate-d2/company_world_b.blend --python scripts/blender/generate_company_world.py -- --render b overview   # buildings | route
python3 scripts/analysis/d2_package.py
```

Para revertir, basta con quitar el bundle 0.2.0 del frontend: 0.1.0 y 0.4.0 no se han tocado. El generador de c1 está archivado en `validation/reports/phase-4c/candidate-c1/source/`.
