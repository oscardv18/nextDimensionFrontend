# Integración del campus — Fase 2.0

Documento histórico de la primera integración. El usuario confirmó después la instalación y selección visual de los seis departamentos. Las dependencias y el lockfile ya están disponibles; consulta [Fase 2.1](navegacion-2.1.md) para la navegación actual y la validación más reciente.

## Acceso y alcance

`pnpm dev`, abrir `/campus-3d` (también es el destino inicial de `/`). El mapa anterior conserva `/mapa`. Ruta independiente del marco empresarial, sin API, Laravel ni datos empresariales. Los textos de los controles están en los catálogos es/en.

El visor permite selección por los seis proxies contractuales, botones accesibles, etiquetas en las anclas originales, enfoque suave hacia los nodos focus, regreso general por botón o Escape y orbitado/zoom manual. Repetir un botón vuelve a encuadrar aunque el departamento no cambie. El control de cubierta se habilita al seleccionar Compras; su estado se conserva al cambiar de departamento. Sin WebGL 2, tras perder el contexto o si falla la descarga/verificación/carga, los botones conservan navegación de lista y la cubierta queda deshabilitada.

## Copia del activo y trazabilidad

Origen de solo lectura: `/home/oddv/Renders/arxnet-3d`.

| Evidencia                                            | Copia en este proyecto                                    |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `exports/arxnet.scene.campus-pilot/0.2.0/asset.glb`  | `public/assets/arxnet.scene.campus-pilot/0.2.0/asset.glb` |
| `exports/arxnet.scene.campus-pilot/0.2.0/build.json` | `src/features/campus/assets/build.json`                   |
| `manifests/assets/arxnet.scene.campus-pilot.json`    | `src/features/campus/assets/manifest.json`                |
| `docs/glb-contract.md`                               | `docs/campus/glb-contract-1.0.0.md` (literal)             |

Activo `arxnet.scene.campus-pilot`, versión 0.2.0, contrato 1.0.0, estado `blockout`. 544 864 bytes, 94 nodos, 74 mallas, 9 492 triángulos incluidos los proxies. SHA-256:

```text
b31cdb3b0b91d46e860125a1870ee3194db7b6d19bb1d5dc01d5161f446f55aa
```

`node scripts/verify-campus.mjs` verifica identidad, SHA-256, tamaño, cabecera GLB, inventario, nombres, roles, padres y referencias. Se ejecuta antes de compilar. El navegador comprueba tamaño y SHA-256 antes de GLTFLoader, y después valida nodos por `userData.arxnet_node_id`. La comprobación criptográfica necesita localhost o HTTPS. No se alteraron los archivos de origen, contratos ni exportaciones.

## Decisiones de consumo

- React 19 requiere Fiber 9; se declararon Fiber `^9.3.0`, Drei `^10.7.0`, Three y tipos `^0.180.0`. Referencia: [instalación oficial de Fiber](https://r3f.docs.pmnd.rs/getting-started/installation).
- No hay cámaras ni luces exportadas. Los focos son objetivos, no posiciones de cámara. El visor calcula la distancia con las cotas de los proxies/campus, FOV y relación de aspecto; aplica una dirección isométrica de consumo. No copia coordenadas de Blender ni inventa posiciones de edificios.
- Los proxies permanecen renderizables con `colorWrite=false` y `depthWrite=false`, para conservar raycasting sin dibujar las cajas. Las mallas visuales no capturan selección.
- El vidrio conserva opacidad, color y caras del GLB. Se aplica `depthWrite=false` y `renderOrder=1`, según `docs/campus-pilot.md` del origen. No se fuerzan caras dobles, transmisión ni nuevos materiales. Materiales clonados y recursos liberados al desmontar.
- El visor se carga bajo demanda. Usa iluminación local, sin HDR, texturas remotas ni decodificadores. DPR limitado a 1–1,5 para esta prueba. No representa un presupuesto de rendimiento aprobado.
- `src/features/campus/asset.ts` concentra contrato y adaptación; `campus-viewer.tsx` carga y valida; `campus-scene.tsx` renderiza y anima; `campus-page.tsx` contiene controles y alternativa de lista.

## Validación histórica de Fase 2.0 y bloqueo del entorno

- Verificador local: **aprobado**, incluidas las seis interacciones y el hash exacto del origen.
- ESLint: **aprobado**.
- Pruebas existentes y navegación sin WebGL: **35 aprobadas**.
- Compilación: **bloqueada** por módulos Three/Fiber/Drei ausentes.
- Pruebas de consumo del GLB y navegador 3D: **pendientes**, no se afirma renderizado ni corrección visual comprobados.

La terminal tiene red deshabilitada (`CODEX_SANDBOX_NETWORK_DISABLED=1`); npm falla con `EAI_AGAIN`. El almacén global de pnpm tampoco permite escritura. Se probó un almacén temporal y se comprobó la caché local: no contiene los paquetes 3D. Se restauró `node_modules` original. `package.json` declara las dependencias necesarias; **pnpm-lock.yaml aún no incorpora esas dependencias** y debe actualizarse mediante instalación real, sin inventar resoluciones ni integridades.

En un entorno con acceso al registro, ejecutar:

```sh
pnpm install
pnpm assets:verify
pnpm check
pnpm test
pnpm build
pnpm test:e2e
```

Las pruebas añadidas en `asset.test.ts` cargan el binario real para verificar hash, contrato, objetivos mundiales, raycast de cada proxy y materiales. `campus.spec.ts` cubre cámara en los seis departamentos, regreso, cubierta, ausencia de WebGL y GLB corrupto. `campus-page.test.tsx` ya verifica la alternativa accesible sin WebGL.

## Antes del refinamiento visual

1. Completar instalación, lockfile, compilación y pruebas reales en navegador. Revisar visualmente vista general, todos los enfoques y Compras con/sin cubierta; comprobar selección por clic y orbitado.
2. Aprobar dirección de cámara, margen de encuadre y duración percibida, especialmente en pantallas estrechas. La dirección actual es una decisión provisional del consumidor.
3. Revisar iluminación y cristal de una cara desde distintos ángulos: ordenar por objeto no resuelve todos los cruces de superficies BLEND. Bloom, ambiente HDR y sombras requieren decisiones posteriores.
4. Definir navegadores/dispositivos objetivo y presupuestos de bytes, triángulos, tiempo de carga y FPS. El contrato de origen deja esos presupuestos sin límite configurado.
5. Definir etiquetas y selección visual finales, y cómo se relacionarán los IDs contractuales con los departamentos del ERP. El prototipo actual usa exclusivamente los seis IDs del activo.
6. El activo sigue `blockout`, con autor/licencia sin completar y validación Khronos pendiente según el origen. Esta integración no cambia su estado ni certifica que esté listo para publicar.
