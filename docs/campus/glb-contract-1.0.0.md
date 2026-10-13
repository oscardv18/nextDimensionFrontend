# Contrato de entrega GLB — v1.0.0

## Paquete y versiones

Un paquete es `exports/<assetId>/<assetVersion>/asset.glb` y `build.json`, junto con `manifests/assets/<assetId>.json`. El JSON activo registra una versión actual; el historial de versiones vive en Git/almacén de artefactos. No sobrescribir una versión publicada. Separar `contractVersion` (semántica del formato Arxnet) de `assetVersion` (contenido) y `asset.version="2.0"` (glTF).

Contrato incompatible: incremento mayor; campos opcionales nuevos: menor; correcciones sin cambio de semántica: parche. Cambios en IDs, jerarquía contractual, escala o referencias de interacción requieren versión mayor del activo. Mejoras visuales compatibles: menor; correcciones: parche. El validador actual acepta **exactamente 1.0.0**; no afirma compatibilidad futura. Blender comprobado: 5.2.2 LTS, exportador `io_scene_gltf2` incluido. Three.js y R3F aún no tienen versión fijada ni prueba de consumo.

## Manifiesto externo

[Ejemplo completo](asset-manifest.example.json): plantilla `planned`, excluida del inventario, sin `.blend` ni `.glb` correspondientes. Nunca copiarla al registro como activo existente sin crear el fuente. Las reglas ejecutables son `manifest_check()` en `scripts/validate.py`; no se instala un motor JSON Schema.

| Campo | Contrato |
|---|---|
| `contractVersion`, `assetId`, `assetVersion` | Versión del contrato, ID estable y versión semántica del contenido |
| `status` | `planned`, `blockout`, `review`, `ready` |
| `source`, `export` | Rutas relativas confinadas a `sources/` y `exports/`; sin `..` |
| `rootNode` | Nombre único de la raíz GLB |
| `departmentIds` | Referencias al catálogo, recíprocas con `areas[].assetIds` |
| `nodes[]` | Inventario exacto: `id`, `name`, `role`, `parent` (ID o null) |
| `interactions[]` | ID estable, referencias `hitNodeId`, `focusNodeId`, `labelNodeId`, `departmentId`, `intent` |
| `provenance` | Autor/licencia de fuentes; obligatorios no vacíos antes de `ready` |
| `build` | Reservado para referencia al reporte; null mientras no haya build |

Los campos desconocidos se permiten para anotaciones; no adquieren semántica automáticamente. Los IDs locales se resuelven usando `extras.arxnet_node_id`, con el nombre como verificación secundaria. `name` por sí solo no es identidad. No usar índices GLB, nombres de colecciones ni IDs internos de Blender como API.

## Perfil inicial

- GLB 2.0 autocontenido; una escena y una raíz Empty. Árbol exacto del manifiesto, extras exportados y verificados. Nodos vacíos de focus/label/grupo preservados; hit/visual deben tener malla.
- Metros, Y arriba en destino, TRS finitas, quaternions unitarios y escala identidad. Raíz TRS identidad; no matrices, shear, cámaras, luces, animación, skins ni morph targets en v1. Las colecciones no son parte del contrato.
- Mallas triangulares, POSITION VEC3 float y, cuando existan, índices escalares enteros. Normales y UV deben revisarse en la etapa de modelos. El recuento usa los accessors de cada primitiva; informar por malla única y por nodo que referencia malla, incluyendo proxies hit.
- Materiales PBR metallic-roughness del núcleo glTF. Autoría mediante Principled BSDF y canales exportables; hornear procedimientos incompatibles. Sin shaders Blender arbitrarios, transmisión avanzada ni extensiones en el perfil inicial (`allowedExtensions=[]`). Se validan referencias de materiales y ausencia de extensiones; aspecto y valores PBR requieren el validador Khronos y revisión visual.
- PNG/JPEG embebidos en bufferView. Sin URI externa/data URI, Draco, Meshopt, KTX2 ni dependencia de decodificadores. Base color y emisión en sRGB; normal, metallic, roughness y occlusion como datos lineales. Empaquetado ORM según glTF: R occlusion, G roughness, B metallic. Normales tangentes de convención glTF; comprobar orientación visual.
- No fijar todavía resolución máxima ni presupuestos de triángulos/bytes. Los valores null significan **sin límite configurado**, no aprobación de rendimiento. Registrar dimensiones, mapas utilizados, procedencia y licencia de cada textura al incorporarla. Ninguna textura descargada en Fase 0.

## Comprobación del resultado, no del supuesto

El exportador excluye cámaras y luces: la aplicación crea iluminación, entorno y cámara. Las emisiones sí viajan con materiales; bloom, sombras y apariencia cinematográfica no se transfieren desde Blender. Colecciones y selección de Blender no demuestran qué llegó al GLB.

Después de exportar, abrir el contenedor e inspeccionar escena, raíz, todos los nombres/IDs/roles, padres, referencias de interacción, TRS, buffers e imágenes embebidas, extensiones, referencias de malla y material, cantidades de triángulos, bytes y SHA-256. El script usa staging; solo mueve a `asset.glb` después de pasar el contrato local. Un staging fallido queda para diagnóstico y bloquea reintentos hasta revisarlo.

Antes de declarar `ready`: validar además con Khronos glTF Validator (no instalado), probar GLTFLoader en las versiones fijadas de Three.js/R3F y revisar imagen, raycast, anclas, enfoque y transformaciones de instancia. El validador local **no** sustituye toda la especificación: no verifica todo el contenido binario de accessors, índices fuera de rango, tangentes, UV, resolución de imágenes ni validez completa PBR. `ready` expresa una revisión humana; la comprobación local por sí sola no certifica publicación.

Referencias técnicas primarias: [glTF 2.0 de Khronos](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) (coordenadas, jerarquía, GLB, extras y PBR), [GLTFLoader de Three.js](https://threejs.org/docs/#GLTFLoader). La conversión de ejes y conservación de extras también se comprobaron con la fixture local; aún no se probó un modelo arquitectónico ni el navegador.
