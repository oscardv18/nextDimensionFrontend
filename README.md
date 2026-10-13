# Arxnet · frontend independiente

Interfaz de Arxnet (ERP SaaS multisector) portada a un proyecto React independiente, sin backend. Los datos son de
demostración y pasan por un `DataSource` tipado: cuando exista el backend nuevo, solo cambia la implementación.

Stack: Vite · React 19 · TypeScript estricto · Tailwind 4 · Radix/shadcn (`radix-nova`) · i18next · React Router · lucide.

## Cómo arrancar

Requisitos: Node ≥ 22 y pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

La aplicación entra en `/campus-3d`; el mapa anterior sigue disponible en `/mapa`. Las pantallas de acceso (`/login`, `/register`, `/forgot-password`…) solo son diseño con
envío simulado; el usuario de demostración es `test@example.com` / `password`.

## Comandos

| Comando                       | Qué hace                                                 |
| ----------------------------- | -------------------------------------------------------- |
| `pnpm dev`                    | servidor de desarrollo                                   |
| `pnpm build` / `pnpm preview` | compilación de producción (`dist/`) y vista previa       |
| `pnpm check`                  | formato (Prettier), ESLint (con reglas de capas) y `tsc` |
| `pnpm format`                 | aplica Prettier                                          |
| `pnpm test`                   | Vitest (paridad es/en, apariencia, `ui-state`, mocks)    |
| `pnpm test:e2e`               | Playwright contra Vite; usa Chrome del sistema           |

`PLAYWRIGHT_CHROMIUM_PATH` usa otro navegador y `E2E_BASE_URL` apunta a un servidor ya levantado.

## Qué hay

- **Marco en L, mapa isométrico, selección y atajos** (`1`–`9`, `Enter`, `Esc`, flechas, `C`, `P`, `M`, `?`), cajón de conexión,
  capas, lista en pantallas estrechas y página de departamento.
- **Apariencia completa**: tema (claro, oscuro, sistema), acento, cristal, movimiento reducido y carril ampliado, sin destello
  al recargar.
- **Cuatro escenarios de demostración** (industria, educación, comercio, restaurante) desde el selector de organización.
- **Acceso** y **ajustes** (perfil y apariencia), solo diseño.
- **Idiomas** español e inglés.

## Estructura

```text
src/design/    CSS, tokens, primitivas ui, marco y mapa (no conoce router ni datos)
src/data/      contratos (copia de los DTO PHP) y fuentes de datos (mock)
src/features/  map, departments, auth, settings
src/app/       rutas, layouts, navegación y arranque
src/i18n/      catálogos es/en
e2e/           pruebas de navegador
docs/          plan y mapa de la migración, pendientes de backend y mejoras de interfaz
```

Las reglas de capas las comprueba ESLint (`pnpm lint`). Más detalle en `CLAUDE.md` y `docs/`.

## Campus 3D — Composición inmersiva

El prototipo tiene una ruta `/campus-3d`, destino inicial de `/`, y conserva el mapa en `/mapa`.
Company World `arxnet.scene.company-world@0.2.0` es el único mundo activo y carga directamente, sin parámetros experimentales.
La copia versionada y sus metadatos se comprueban con `pnpm assets:verify` y antes de compilar.
Los selectores anteriores (`world`, `v`, `VITE_CAMPUS_ASSET_VERSION`) ya no cambian el activo.
El campus histórico y Company World 0.1.0 están archivados fuera de producción.
Consulta [consolidación D.4 y restauración](docs/campus/company-world-d4.md).
El canvas cubre todo el viewport. La cámara es guiada y las herramientas están disponibles en
**Mostrar diagnóstico** como una capa flotante plegable. La órbita y la reserva de paneles son opciones de prueba.

Consulta [composición inmersiva y validación actual](docs/campus/composicion-inmersiva.md),
[navegación, calibración y resultados de Fase 2.1](docs/campus/navegacion-2.1.md)
y [trazabilidad de la integración original](docs/campus/integracion.md).
Compilación y pruebas unitarias pasan; Playwright requiere un entorno que permita abrir puertos y Chrome.

La integración del Shell y las etiquetas adaptativas se documenta en
[Fase 3.1: composición, regiones, pruebas y limitaciones](docs/campus/integracion-espacial-3.1.md).

El ajuste general más reciente está en [corrección provisional de composición](docs/campus/correccion-composicion.md), pendiente de aceptación visual en Brave.

[Exploración híbrida 3.2](docs/campus/exploracion-3.2.md): arrastre horizontal, zoom al cursor y gestos táctiles integrados con las cámaras guiadas. La comprobación de navegador de esta fase está pendiente por restricciones del entorno.

[Integración 3.3](docs/campus/integracion-3.3.md): biblioteca PBR, entorno y temas 3D procedentes del manifiesto del productor, sincronizados con la apariencia existente del Shell. Incluye integridad, resultados y revisión visual pendiente.

[Rendimiento 3.5](docs/campus/rendimiento-3.5.md): vuelos de duración temporal definida, cache de sombras y perfiles/mediciones opt-in en el diagnóstico de desarrollo. Incluye evidencia de las 19 E2E anteriores y las limitaciones actuales de ejecución.

[Integración 3.6](docs/campus/integracion-3.6.md): GLB 0.4.0, detalle progresivo conservador, comparación de encuadres y reversión real a 0.3.0. La aprobación visual y las mediciones de navegador siguen pendientes por restricciones de ejecución.
