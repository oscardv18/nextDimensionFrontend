# Arxnet frontend (React independiente)

Port fiel de la interfaz de Arxnet, sin backend. Datos simulados y tipados detrás de un `DataSource`.
Origen de referencia: `../arxnet` (Laravel + Inertia); no se modifica desde aquí.

## Comandos (pnpm)

- `pnpm dev` servidor (puerto 5173) · `pnpm build` · `pnpm preview`
- `pnpm check` = Prettier + ESLint + `tsc -b` (debe quedar en verde antes de cerrar una tarea)
- `pnpm test` Vitest · `pnpm test:e2e` Playwright (usa Chrome del sistema y arranca Vite solo)

## Reglas

1. **Fidelidad primero.** No es un rediseño: lo mejorable se anota en `docs/mejoras-ui.md` y se deja igual.
2. **No inventes funciones.** Los controles atenuados («próxima entrega») siguen así. Los datos simulados
   se rotulan «Datos de demostración».
3. **Nada entra sin uso** (verifícalo con `grep`). Lo que se deja fuera consta en `docs/migracion/mapa-de-archivos.md`.
4. **Idioma.** Identificadores y claves técnicas en inglés; textos visibles por i18n (es/en, claves intactas,
   paridad exacta); comentarios y documentación en español, y explican el porqué.
5. Si el origen contradice un documento, anótalo en `docs/migracion/plan.md`; no lo resuelvas en silencio.

## Capas (las hace cumplir ESLint, `eslint.config.js`)

```text
src/design/    CSS, tokens, ui, marco, mapa. NO importa router, features, app ni data (salvo `import type` de contracts).
src/data/      contracts/ (copia de los DTO PHP, no se edita), sources/ (DataSource + mock). No importa React ni la UI.
src/features/  map, departments, auth, settings, shared
src/app/       router, layouts, providers, routes.ts, navigation, AppShell
src/i18n/      catálogos y setup
```

- Un componente de `design` que necesite navegar o leer datos recibe callbacks y datos por props
  (`onOpenDepartment`, `Link: LinkComponent`…). Es el único refactor permitido y no cambia lo visible.
- `src/design/styles/arxnet/**` y `src/design/ui/**` no se reformatean (se comparan línea a línea con el origen).

## Convenciones

- URL del producto original: `/mapa`, `/departamentos/:publicId`, `/settings/*`, `/login`… (`src/app/routes.ts`).
- Los datos solo exponen `publicId`, nunca `id`.
- Apariencia: `localStorage` (`appearance`, `accent`, `glass`, `motion`, `rail`, `locale`) + script en `index.html`
  que pinta `<html>` antes del primer fotograma. Si cambias un nombre, cámbialo en ambos sitios.
- El marco (`FrameLayout`) es una sola ruta padre con `<Outlet/>`: no debe remontarse al navegar.
- Escenario de demostración y capas se recuerdan en `localStorage` (`arx-*`).
- Usuario simulado: `test@example.com` / `password`.

## Documentación

`docs/migracion/{plan,mapa-de-archivos}.md`, `docs/pendientes-backend.md`, `docs/mejoras-ui.md`.
