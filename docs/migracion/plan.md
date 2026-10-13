# Plan de migración del frontend de Arxnet (fase 0: inventario)

Estado: **aprobado y ejecutado** (decisiones P1–P7 aceptadas tal como se propusieron). Solo se leyó el origen (`/home/oddv/Devs/Projects/arxnet-project/arxnet`, commit `8ea5fff`).

Desviaciones respecto a lo aprobado, descubiertas al ejecutar:

- **P1:** se conservaron pnpm, TypeScript 6 y Vite 8.3 del destino, pero **ESLint bajó a 9.39** (la versión del origen): `eslint-plugin-react` 7.37 no funciona con ESLint 10 (`getFilename is not a function`). Es el caso previsto en la propuesta.
- **P5:** también se excluyó `hooks/use-flash-toast.ts` (solo lo llamaba `sonner`).
- **Catálogos:** se añadieron tres claves nuevas (`auth.failed`, `auth.resetLinkSent`, `auth.passwordReset`) a es y en para los mensajes simulados de acceso; las 272 originales siguen intactas y la paridad se mantiene.
- **Foco al volver con Esc (R2):** se resolvió con un campo `pendingFocus` en `ui-state` que la página del mapa consume al pintarse.
- **Navegación:** el selector de escenario hace `navigate('/mapa')` y revalida los datos de la raíz.

Abreviaturas: `O` = `resources/js` del origen, `D` = `src` del destino. Acciones: **copiar** (sin cambios, salvo rutas de importación), **adaptar** (misma apariencia, cambia la API o el acoplamiento), **reescribir**, **excluir**.

## 1. Resumen

- El origen tiene 81 archivos TS/TSX propios fuera de `actions/`, `routes/` y `wayfinder/` (generados). Un análisis de importaciones desde `app.tsx`, `i18n.ts` y todas las páginas, **sin** `two-factor-challenge`, `settings/security` ni `delete-user`, alcanza **59** de ellos. Los otros 22 no entran (tabla 2.6).
- 27 archivos importan `@inertiajs/react`, 12 usan `@/routes` y 3 usan `@/actions`. Los puntos de acoplamiento están en la sección 4.
- El CSS (567 líneas en 6 archivos) no depende de Laravel ni de Inertia; se copia tal cual.
- No hay nada en `public/` del origen que pese en la interfaz salvo los iconos (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`).

## 2. Origen → destino → acción

Ruta de alias: `@` pasa a apuntar a `src`. Los archivos de `design/` no importan `app`, `data` (salvo lo discutido en la pregunta P3), `features` ni el router.

### 2.1 CSS

| Origen                                 | Destino                                    | Acción  | Nota                                                                                                                                               |
| -------------------------------------- | ------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resources/css/arxnet/tokens.css`      | `src/design/styles/arxnet/tokens.css`      | copiar  | sin reformatear                                                                                                                                    |
| `resources/css/arxnet/frame-map.css`   | `src/design/styles/arxnet/frame-map.css`   | copiar  | idem                                                                                                                                               |
| `resources/css/arxnet/components.css`  | `src/design/styles/arxnet/components.css`  | copiar  | idem                                                                                                                                               |
| `resources/css/arxnet/integration.css` | `src/design/styles/arxnet/integration.css` | copiar  | idem                                                                                                                                               |
| `resources/css/shadcn-variants.css`    | `src/design/styles/shadcn-variants.css`    | copiar  |                                                                                                                                                    |
| `resources/css/app.css`                | `src/design/styles/app.css`                | adaptar | se quitan los dos `@source` que apuntan a `views/` y a `vendor/laravel`; se conserva `@custom-variant dark`. Tailwind 4 detecta `src/` por sí solo |
| `resources/views/app.blade.php`        | `index.html`                               | adaptar | script anti-destello y fondo inmediato (sección 5)                                                                                                 |

### 2.2 Marco, mapa y diálogos (`O/arxnet/**`)

| Origen                                                                  | Destino                    | Acción     | Nota                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `arxnet/ui-state.ts`                                                    | `design/state/ui-state.ts` | copiar     | solo `localStorage` y DOM. `focusDepartmentLabel` y `openOverlay` se quedan aquí                                                                                                                       |
| `arxnet/common.tsx`                                                     | `design/common.tsx`        | copiar     | importa tipos de `types/generated` (ver P3)                                                                                                                                                            |
| `arxnet/map/iso.ts`, `scene.ts`                                         | `design/map/`              | copiar     | lógica pura                                                                                                                                                                                            |
| `arxnet/map/sparkline.tsx`, `selection-card.tsx`, `department-list.tsx` | `design/map/`              | adaptar    | `openDepartment` entra por prop (`onOpenDepartment`) en vez de llamar a `navigation`                                                                                                                   |
| `arxnet/map/company-map.tsx`                                            | `design/map/`              | adaptar    | ídem. Recibe `map` y `onOpenDepartment`                                                                                                                                                                |
| `arxnet/map/link-sheet.tsx`                                             | `design/map/`              | adaptar    | ídem                                                                                                                                                                                                   |
| `arxnet/frame/soon.tsx`, `appearance-controls.tsx`                      | `design/frame/`            | copiar     | `appearance-controls` usa `use-appearance` (queda en `design/appearance/`)                                                                                                                             |
| `arxnet/frame/rail.tsx`                                                 | `design/frame/`            | adaptar    | usa `usePage().url` y `props.directory` → recibe `currentPath`, `hasDirectory` y `onGoHome` por props                                                                                                  |
| `arxnet/frame/top-bar.tsx`                                              | `design/frame/`            | adaptar    | usa `usePage().props.{context,demo}` y `router.post(demo.url)` → props `context`, `demo`, `onSelectScenario`, `onGoHome`                                                                               |
| `arxnet/frame/layers-menu.tsx`                                          | `design/frame/`            | adaptar    | `usePage().props.context.isDemo` → prop `isDemo`                                                                                                                                                       |
| `arxnet/frame/profile-menu.tsx`                                         | `design/frame/`            | adaptar    | `Link`, `router.post('/idioma')`, `router.on('start')`, `router.flushAll()`, rutas `logout`/`profile` → props (`user`, `locale`, `locales`, `onChangeLocale`, `onLogout`, `profileHref`, `renderLink`) |
| `arxnet/dialogs/dialogs.tsx`                                            | `design/dialogs/`          | adaptar    | `DepartmentsSheet` usa `usePage().props.{directory,context}` y `openDepartment` → props                                                                                                                |
| `arxnet/navigation.ts`                                                  | `app/navigation.ts`        | reescribir | sobre React Router; conserva la selección y el foco (sección 3 y R2)                                                                                                                                   |

### 2.3 Layouts y páginas

| Origen                                                                                         | Destino                                    | Acción  | Nota                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layouts/arxnet-layout.tsx`                                                                    | `app/layouts/frame-layout.tsx`             | adaptar | `usePage().component` → `useMatches()`/`useLocation()`; `<Outlet/>` en vez de `children`. El marco no se remonta                                        |
| `layouts/auth-layout.tsx`                                                                      | `app/layouts/auth-layout.tsx`              | adaptar | `Link` de Inertia → `Link` de React Router; el título/descripción llegan por contexto de ruta o props de la página (hoy son props de layout de Inertia) |
| `layouts/settings/layout.tsx`                                                                  | `app/layouts/settings-layout.tsx`          | adaptar | `Link` + `use-current-url`; se retira el enlace a «Seguridad» (sección 6)                                                                               |
| `pages/map/show.tsx`                                                                           | `features/map/map-page.tsx`                | adaptar | `map` sale de un hook/cargador; `<Head>` → `usePageTitle`                                                                                               |
| `pages/departments/show.tsx`                                                                   | `features/departments/department-page.tsx` | adaptar | ídem; 404 si el `publicId` no existe                                                                                                                    |
| `pages/auth/{login,register,forgot-password,reset-password,verify-email,confirm-password}.tsx` | `features/auth/`                           | adaptar | `<Form>` → formulario local con envío simulado. Se retira el bloque `PasskeyVerify` de `login` y `confirm-password`                                     |
| `pages/settings/appearance.tsx`                                                                | `features/settings/appearance-page.tsx`    | adaptar | solo `Head`                                                                                                                                             |
| `pages/settings/profile.tsx`                                                                   | `features/settings/profile-page.tsx`       | adaptar | `Form`, `usePage().props.auth.user`, `ProfileController`; se retira `DeleteUser`                                                                        |
| `pages/auth/two-factor-challenge.tsx`, `pages/settings/security.tsx`                           | —                                          | excluir | Fortify / 2FA / passkeys → `pendientes-backend.md`                                                                                                      |

### 2.4 Hooks, utilidades y tipos

| Origen                                                                                               | Destino                                | Acción     | Nota                                                                                                                        |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `hooks/use-appearance.tsx`                                                                           | `design/appearance/use-appearance.tsx` | adaptar    | solo cambia el almacenamiento: de cookies a `localStorage` (sección 5)                                                      |
| `hooks/use-current-url.ts`                                                                           | `app/use-current-url.ts`               | reescribir | sobre `useLocation`. Solo se mantiene si lo usa el layout de ajustes (`grep` en la fase 5)                                  |
| `hooks/use-flash-toast.ts`                                                                           | —                                      | excluir    | escucha el evento `flash` de Inertia. Ningún flujo de la fase actual lo dispara. `ui/sonner.tsx` se adapta para no llamarlo |
| `hooks/use-clipboard.ts`, `use-two-factor-auth.ts`                                                   | —                                      | excluir    | solo los usa 2FA                                                                                                            |
| `lib/utils.ts`                                                                                       | `design/lib/utils.ts`                  | adaptar    | `cn` se conserva; `toUrl` depende de `InertiaLinkProps` → se elimina si nadie lo usa tras la migración                      |
| `components/{heading,input-error,password-input}.tsx`                                                | `design/forms/`                        | copiar     | los usan acceso y ajustes                                                                                                   |
| `components/text-link.tsx`                                                                           | `design/forms/text-link.tsx`           | adaptar    | `Link` de Inertia → recibe el componente de enlace por prop o se mueve a `features/auth`                                    |
| `components/alert-error.tsx`, `delete-user.tsx`, `manage-*.tsx`, `passkey-*.tsx`, `two-factor-*.tsx` | —                                      | excluir    | 2FA, passkeys y borrado de cuenta                                                                                           |
| `i18n.ts`                                                                                            | `i18n/setup.ts`                        | adaptar    | se quita `router.on('navigate')`; el idioma lo cambia `AppShell`                                                            |
| `app.tsx`                                                                                            | `app/main.tsx` + `app/providers.tsx`   | reescribir | `createInertiaApp` → `createBrowserRouter`, `TooltipProvider`, `Toaster`, `AppShell`                                        |
| `types/generated/index.ts`                                                                           | `data/contracts/index.ts`              | copiar     | con cabecera (fuente de verdad: DTO PHP; fecha de copia)                                                                    |
| `types/generated/typescript-transformer-manifest.json`                                               | —                                      | excluir    | metadato del generador PHP                                                                                                  |
| `types/{auth,ui,index}.ts`                                                                           | — / `data/contracts/`                  | adaptar    | `User` = `SessionUserData`. `Passkey` y `TwoFactor*` se excluyen. `FlashToast` solo si hace falta                           |
| `types/global.d.ts`                                                                                  | `app/shell-context.tsx` (tipos)        | reescribir | su único contenido útil es la forma de las props compartidas, que pasa a ser el tipo de `AppShell`                          |
| `types/vite-env.d.ts`                                                                                | `src/vite-env.d.ts`                    | adaptar    |                                                                                                                             |

### 2.5 Primitivas `components/ui/*` (estilo radix-nova)

Alcanzables: `button`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `separator`, `sheet`, `sonner`, `spinner`, `switch`, `tooltip` → **copiar** a `src/design/ui/` sin reformatear (`sonner` se adapta: se quita `useFlashToast`).

### 2.6 No alcanzables

`alert`, `avatar`, `badge`, `card`, `icon`, `input-otp`, `select`, `toggle`, `toggle-group` → **excluir** (nadie los importa tras sacar 2FA/passkeys; se anota en `mapa-de-archivos.md`). `components.json` se adapta (alias a `src/design/ui`, css a `src/design/styles/app.css`) para poder añadir primitivas luego con la CLI.

### 2.7 Generados y servidor

| Origen                                                                              | Acción                                | Nota                                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `resources/js/actions/**` (Inertia, Fortify, Horizon, Passkeys, controladores)      | excluir                               | Wayfinder; Horizon e Inertia DevTools no tienen interfaz propia |
| `resources/js/routes/**`                                                            | excluir → `app/routes.ts`             | solo se rehacen las rutas de la sección 4                       |
| `resources/js/wayfinder/index.ts`                                                   | excluir                               |                                                                 |
| `lang/es.json`, `lang/en.json`                                                      | `src/i18n/catalogs/{es,en}.json`      | copiar, claves intactas (272, paridad exacta verificada)        |
| `lang/es/{auth,passwords,pagination,validation}.php`                                | excluir                               | ver R4 (mensaje de credenciales)                                |
| `app/Shell/OrganizationMap/Data/*`, `Enums/*`                                       | ya reflejado en `types/generated`     | referencia                                                      |
| `app/Shell/OrganizationMap/Layouts/{SectorLayout,SectorLayouts}.php`                | `data/sources/mock/sector-layouts.ts` | reescribir (TS)                                                 |
| `app/Demo/OrganizationMap/DemoOrganizationMapSource.php`                            | `data/sources/mock/build-map.ts`      | reescribir (TS)                                                 |
| `app/Demo/OrganizationMap/fixtures/*.json`                                          | `data/sources/mock/fixtures/*.json`   | copiar; ya traen `publicId` UUIDv7 y ningún `id`                |
| `app/Demo/OrganizationMap/DemoScenarioController.php`                               | `data/sources/mock/scenario-store.ts` | reescribir (`localStorage`)                                     |
| `app/Http/Middleware/HandleAppearance.php`                                          | —                                     | referencia (sección 5)                                          |
| `app/Http/Middleware/HandleInertiaRequests.php`, `app/Demo/DemoServiceProvider.php` | `app/app-shell.tsx`                   | referencia (sección 4)                                          |

### 2.8 Pruebas

| Origen                                                    | Destino                           | Acción     | Nota                                                                                                                                                                                       |
| --------------------------------------------------------- | --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/e2e/support.ts`                                    | `e2e/support.ts`                  | adaptar    | sin login ni `pageProps` de Inertia; la comprobación de «sin ids» pasa a Vitest sobre el constructor y a leer el DOM                                                                       |
| `tests/e2e/map.spec.ts`                                   | `e2e/map.spec.ts`                 | adaptar    | viewports 1366×657, 1280×600, 1920×969 (ambos temas), 390 px y 200 % (683×317, densidad 2) sin cambios. «404» y `pageProps` se reescriben                                                  |
| `tests/e2e/appearance.spec.ts`                            | `e2e/appearance.spec.ts`          | adaptar    | se quita la lectura del HTML del servidor (se sustituye por «sin destello»: el atributo está antes del primer pintado); `login`/idioma persistente por usuario se adaptan a `localStorage` |
| `tests/e2e/auth.setup.ts`, `zz-logout.spec.ts`            | —                                 | excluir    | no hay sesión                                                                                                                                                                              |
| `tests/e2e/hmr.spec.ts`                                   | —                                 | excluir    | prueba de HMR de Docker                                                                                                                                                                    |
| `playwright.config.ts`                                    | `playwright.config.ts`            | adaptar    | `webServer` con `vite`, sin `setup`, sin `storageState`                                                                                                                                    |
| `tests/Unit/Shell/SectorLayoutsTest.php`                  | `src/data/sources/mock/*.test.ts` | reescribir | Vitest                                                                                                                                                                                     |
| `tests/Feature/OrganizationMap/*`, `tests/Architecture/*` | —                                 | excluir    | PHP. Las reglas de capas pasan a ESLint                                                                                                                                                    |

## 3. Reglas de navegación (resumen del diseño)

- Rutas con layout: `/` → redirección a `/mapa`; `FrameLayout` envuelve `/mapa`, `/departamentos/:publicId`, `/ajustes/*`; `AuthLayout` envuelve las pantallas de acceso.
- `openDepartment(publicId)`: `setUi({ selection, link: null })` y `navigate('/departamentos/:id')`.
- `backToMap(publicId?)`: `setUi(...)`, `navigate('/mapa')` y, tras la navegación, `focusDepartmentLabel(publicId)`. En Inertia lo hacía `onFinish`; con React Router se resuelve con un efecto en la página del mapa o con `flushSync` + `requestAnimationFrame` (hay que comprobarlo con la prueba de Esc).
- `usePageTitle(title)` → `document.title = title ? \`${title} · Arxnet\` : 'Arxnet'`.

## 4. Puntos de acoplamiento

### 4.1 Inertia (27 archivos)

| Uso                                                 | Archivos                                                                                     | Reemplazo                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `usePage().props`                                   | `top-bar`, `rail`, `layers-menu`, `profile-menu`, `dialogs`, `profile`                       | contexto `AppShell`                                               |
| `usePage().url` / `.component`                      | `rail`, `arxnet-layout`, `use-current-url`                                                   | `useLocation` / `useMatches`                                      |
| `router.visit`                                      | `navigation.ts`                                                                              | módulo `navigation`                                               |
| `router.post`                                       | `profile-menu` (idioma), `top-bar` (escenario)                                               | `AppShell.setLocale`, `DataSource`/`scenario-store`               |
| `router.on(...)`                                    | `i18n.ts` (`navigate`), `profile-menu` (`start`), `use-flash-toast` (`flash`)                | efectos propios; `flash` se descarta                              |
| `router.flushAll`, `router.reload`, `router.delete` | `profile-menu`, `manage-passkeys`                                                            | `flushAll` desaparece (sin caché de Inertia); el resto se excluye |
| `<Link>`                                            | `profile-menu`, `departments/show`, `auth-layout`, `settings/layout`, `text-link`, `profile` | `Link` de React Router (o prop `renderLink` dentro de `design/`)  |
| `<Head>`                                            | todas las páginas                                                                            | `usePageTitle`                                                    |
| `<Form>`                                            | 6 de acceso, `profile`                                                                       | formulario local simulado                                         |
| `setLayoutProps`                                    | `two-factor-challenge`                                                                       | excluido                                                          |
| `useHttp`, `@inertiajs/core`                        | 2FA, `passkey-verify`                                                                        | excluidos                                                         |

### 4.2 Wayfinder → `src/app/routes.ts`

URL conservadas: `/mapa`, `/departamentos/:publicId`, `/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/email/verify`, `/user/confirm-password`, `/settings/profile`, `/settings/appearance`, `/`. Salen: `/settings/security`, `/two-factor-challenge`, `/passkeys/*`, `/user/two-factor-*`, `/storage`, `/.well-known`, `/horizon/*`, `/demo/escenario`, `/idioma`, `/logout` (los tres últimos son acciones, no páginas).

**Pregunta P6:** el origen usa `/settings/...` (en inglés), pero el prompt habla de `/ajustes/...`. El origen manda (regla 5): conservo `/settings/profile` y `/settings/appearance`.

### 4.3 Props compartidas

`name`, `auth.user`, `locale`, `locales`, `context`, `directory` (los seis del prompt) **más `demo`** (`sector`, `scenarios[]`, `url`), que lo comparte `app/Demo/DemoServiceProvider.php` y no aparece en el prompt. `top-bar` lo necesita para el selector de escenarios.

## 5. Apariencia sin servidor

El servidor pinta `<html>` con: `lang`, `data-theme` (`light`|`dark`), `data-appearance` (`light`|`dark`|`system`), `data-accent` (`purple`|`red`|`blue`) y las clases `sin-vidrio`, `reducido`, `carril-amplio`. Un script en línea resuelve `system` con `prefers-color-scheme`, añade `reducido` con `prefers-reduced-motion` y fija `style.colorScheme`. Además hay un `<style>` con el fondo inmediato (`#dde0e9` claro, `#000000` oscuro).

Claves de cookie actuales, que paso a `localStorage` con los **mismos nombres**: `appearance` (`light|dark|system`), `accent`, `glass` (`on|off`), `motion` (`reduced|full`), `rail` (`wide|narrow`). El script de `index.html` replica `HandleAppearance` (valores no válidos → por defecto: `system`, `purple`, cristal activo, movimiento completo, carril estrecho) y el `use-appearance` solo cambia `setCookie` por `localStorage.setItem`.

Detalle que no cambia: `use-appearance.readFromDocument` lee la preferencia de movimiento de `document.cookie` (`motion=reduced`); en el destino lee `localStorage`.

## 6. Dependencias

**Entran** (versión del `package.json` del origen salvo indicación):

| Paquete                                                                                                                                          | Motivo                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`                                                                               | base. Ver P1 sobre versiones                                             |
| `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css`                                                                                             | CSS aprobado (`@import 'tw-animate-css'`)                                |
| `@rolldown/plugin-babel`, `babel-plugin-react-compiler`                                                                                          | React Compiler, afecta al resultado                                      |
| `@fontsource-variable/figtree`                                                                                                                   | tipografía                                                               |
| `@radix-ui/react-{checkbox,dialog,dropdown-menu,label,popover,separator,slot,switch,tooltip}`                                                    | las usan las 13 primitivas alcanzables                                   |
| `class-variance-authority`, `clsx`, `tailwind-merge`                                                                                             | `cn` y variantes                                                         |
| `lucide-react`                                                                                                                                   | iconos (18 archivos)                                                     |
| `i18next`, `react-i18next`                                                                                                                       | textos                                                                   |
| `sonner`                                                                                                                                         | `ui/sonner.tsx` (se mantiene solo si algún flujo muestra avisos; ver P5) |
| `react-router` (nuevo, v7)                                                                                                                       | navegación; el prompt la pide                                            |
| Dev: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `globals`, `@types/{react,react-dom,node}` | calidad                                                                  |
| Dev: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` (nuevos)                            | fase 6                                                                   |
| Dev: `@playwright/test`                                                                                                                          | fase 6                                                                   |
| Dev (a decidir, P2): `prettier` + `prettier-plugin-tailwindcss`                                                                                  | formateo (`vite-plus` queda fuera)                                       |

**No entran:**

| Paquete                                                                                                                                                                               | Motivo                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@inertiajs/react`, `@inertiajs/vite`, `laravel-vite-plugin`, `@laravel/vite-plugin-wayfinder`, `@laravel/passkeys`, `@laravel/multiplex`, `concurrently`                             | fuera de proyecto                                                                                                                                      |
| `@radix-ui/react-{avatar,collapsible,navigation-menu,select,toggle,toggle-group}`, `input-otp`                                                                                        | solo los usan primitivas no alcanzables (o ninguna); `collapsible` y `navigation-menu` no los importa nadie. Se comprobará con `grep` al instalar      |
| `vite-plus`                                                                                                                                                                           | solo aporta `vp` (build/dev/fmt/lint). Nada del resultado lo exige; `vite.config` usa `lazyPlugins`/`defineConfig` de ahí, que se sustituye por `vite` |
| `@rollup/rollup-win32-x64-msvc`, `@tailwindcss/oxide-win32-x64-msvc`, `lightningcss-win32-x64-msvc`, `@rollup/rollup-linux-x64-gnu` (fijado en 4.9.5) y los demás binarios opcionales | los resuelve el gestor por plataforma                                                                                                                  |
| `eslint-plugin-react-refresh` (de la plantilla actual)                                                                                                                                | no está en el origen; se quita salvo que lo pidas                                                                                                      |

`vite.config.ts` del destino: `react()`, `babel({ presets: [reactCompilerPreset()] })` y `tailwindcss()`. Se descartan `laravel`, `inertia`, `wayfinder`, `lazyPlugins`, el bloque Docker y `lint`/`fmt` (que eran de `vite-plus`).

## 7. Qué hay hoy en el destino

El directorio **no está vacío**: es la plantilla `create-vite` (React 19.2, TS `~6.0.2`, ESLint 10, Vite 8.3, `pnpm-lock.yaml`, `src/App.tsx`, `App.css`, `index.css`, `assets/`, `public/favicon.svg`, `icons.svg`, `README.md`, `tsconfig.app.json`, `tsconfig.node.json`). Sin git. La fase 1 lo sustituye: borro `App.*`, `assets/`, `icons.svg` y reescribo `README.md`, `index.html`, `eslint.config.js`, `vite.config.ts` y los tsconfig.

## 8. Contradicciones entre el prompt y el origen

| #   | Prompt                                                           | Origen                                                                                                                                                                          | Qué haré                                                                                                                        |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Seis props compartidas                                           | siete: falta `demo`                                                                                                                                                             | incluirla en `AppShell`                                                                                                         |
| C2  | `src/design` «no importa data»                                   | `common.tsx`, `company-map`, `dialogs`… importan **tipos** de `types/generated`                                                                                                 | P3                                                                                                                              |
| C3  | «Copia las versiones del `package.json` del origen», «ESLint 9»  | el destino ya trae TS 6, ESLint 10, Vite 8.3 (más nuevas)                                                                                                                       | P1                                                                                                                              |
| C4  | `npm run dev/build/check`                                        | el destino usa `pnpm` (hay `pnpm-lock.yaml`)                                                                                                                                    | P1                                                                                                                              |
| C5  | `npm run check` incluye formato                                  | el formateador es `vite-plus` (oxfmt), que se deja fuera                                                                                                                        | P2                                                                                                                              |
| C6  | Páginas de acceso «solo diseño»                                  | `login` y `confirm-password` incluyen `PasskeyVerify` (passkeys está fuera)                                                                                                     | se quita; sin sustituto visual                                                                                                  |
| C7  | `/ajustes/...`                                                   | el origen usa `/settings/...`                                                                                                                                                   | P6                                                                                                                              |
| C8  | `profile` entra, `delete-user` no                                | `profile.tsx` renderiza `DeleteUser`                                                                                                                                            | se quita y se anota                                                                                                             |
| C9  | «Cada archivo del origen figura en `mapa-de-archivos.md`»        | `actions/` y `routes/` son ~120 archivos generados                                                                                                                              | agrupados por carpeta, no uno a uno                                                                                             |
| C10 | `grep -r "inertiajs\|laravel\|wayfinder" src package.json` vacío | los catálogos están limpios, pero varios comentarios del origen citan Laravel/Inertia (`ui-state.ts`, `rail.tsx`, `top-bar.tsx`, `navigation.ts`, `app.css`, páginas de acceso) | reescribo esos comentarios al portar (en español, explicando el porqué sin nombrar el framework) para que el `grep` salga vacío |

## 9. Riesgos

- **R1. Remontaje del marco.** Debe ser una sola ruta padre con `<Outlet/>`. Se vigila con una prueba que comprueba que el nodo `.app` es el mismo tras navegar mapa → departamento.
- **R2. Foco al volver con Esc.** Inertia resolvía `focusDepartmentLabel` en `onFinish`. Con React Router la etiqueta aún no existe cuando `navigate` retorna; riesgo de pérdida de foco. Plan: efecto en `map-page` que consume un «foco pendiente» guardado en `ui-state`.
- **R3. Bienvenida (`arx-intro`).** Hoy depende de `component === 'map/show'`. Pasa a depender de la ruta; `sessionStorage` igual.
- **R4. Textos que hoy pone el servidor:** (a) nombres de puntos de referencia (`map.landmark.*`, ya en el catálogo); (b) el error «Estas credenciales no coinciden…» sale de `lang/es/auth.php`, **no** de `es.json`. Para el envío simulado necesito un texto. Propuesta: añadir una clave nueva a ambos catálogos (`auth.failed`) y mantener la paridad; no toca las existentes.
- **R5. Nombres de departamento/organización/zona en los fixtures están solo en español** (no pasan por i18n) y así se quedan, como hoy; se anota en `mejoras-ui.md`.
- **R6. `ui-state` es un almacén global de módulo.** Persiste entre navegaciones por diseño (selección y capas), pero entre pruebas de Vitest hay que reiniciarlo.
- **R7. React Compiler** con `useSyncExternalStore` y refs: es el mismo conjunto de herramientas del origen; no debería cambiar nada, pero la comparación visual de la fase 7 lo cubre.
- **R8. Comparación píxel a píxel (fase 7).** Docker está instalado pero no hay contenedores en marcha. Levantar el origen exige `docker compose up -d` con `ARXNET_DEMO_DATA=true` y sembrar la base; lo intentaré en la fase 7 y, si falla, lo diré.
- **R9. Reglas de capas en ESLint.** `no-restricted-imports` bloquea patrones por ruta; las importaciones relativas (`../../data`) hay que cubrirlas con patrones además del alias.
- **R10. El 200 % simulado (683×317, densidad 2).** Es la prueba más frágil; no se debería tocar CSS, pero es la primera que se rompe si cambia un contenedor.

## 10. Preguntas (necesito tu decisión antes de la fase 1)

- **P1. Versiones y gestor.** ¿Conservo lo que ya trae el destino (pnpm, TypeScript 6, ESLint 10, Vite 8.3) o fijo las versiones del origen (npm, TS ^5.7, ESLint ^9.39, Vite ^8.0)? **Propongo** quedarme con pnpm y con las versiones del destino, salvo que `typescript-eslint` o algún plugin no soporte ESLint 10 o TS 6 (en ese caso bajo solo eso a ESLint 9 / TS 5.9). Los scripts `npm run …` funcionan igual con pnpm (`pnpm run …`).
- **P2. Formateador.** `npm run check` pide «formato», pero el del origen es `vite-plus`. **Propongo** Prettier con la misma configuración (80 columnas, 4 espacios, comillas simples, `;`) más `prettier-plugin-tailwindcss`, ignorando `src/design/styles/arxnet/**` y `src/design/ui/**`.
- **P3. Tipos en `design`.** Los componentes de `design` necesitan los tipos del contrato (`OrganizationMapData`, `Sector`…). **Propongo** permitir **solo `import type`** desde `src/data/contracts` en `design` y prohibir todo lo demás de `data`. La alternativa es mover `contracts/` dentro de `design`, pero eso rompe tu estructura. ¿Aceptas la excepción?
- **P4. Dónde van `heading`, `input-error`, `password-input` y `text-link`.** Son piezas de formulario de las pantallas de acceso/ajustes. **Propongo** `src/design/forms/` (sin router); el enlace de `text-link` se resuelve inyectando el componente.
- **P5. `sonner`.** Hoy solo lo alimenta `flash` de Inertia, que se descarta. **Propongo** no traer `sonner` ni `ui/sonner.tsx` y anotarlo en `mapa-de-archivos.md`. Si prefieres conservarlo para futuros avisos, lo dejo montado sin usar.
- **P6. Rutas de ajustes.** ¿`/settings/*` (como el origen) o `/ajustes/*` (como dice el prompt)? **Propongo** `/settings/*`.
- **P7. Idioma de entrada de `index.html`.** Hoy `lang` lo decide el servidor. **Propongo** `es` por defecto, guardado en `localStorage` (`locale`), y el script anti-destello lo aplica a `<html lang>`.

## 11. Orden de trabajo tras tu aprobación

1. Andamiaje (fase 1) → `tsc`, ESLint y `vite build` en verde con una página vacía.
2. `design`: CSS y `ui` → verificación visual del fondo y los tokens.
3. Datos y mocks + sus pruebas de Vitest.
4. Apariencia, i18n, navegación.
5. Marco, mapa, departamento; luego acceso y ajustes.
6. Pruebas (Vitest y Playwright).
7. Verificación contra el origen y documentos finales.

## 12. Nota de Fase 3.0 (centro de control espacial)

La regla 1 de `CLAUDE.md` («fidelidad primero, no es un rediseño») se refiere al port de Arxnet. `/campus-3d` no tiene equivalente en el origen y la Fase 3.0 pidió expresamente un Shell nuevo a partir de `references/arxnet-approved-mockup.png`. Por eso su diseño vive aislado en `src/features/campus/control-center/` (tokens `--cc-*` bajo `.cc-root`) y no toca `src/design/styles/arxnet/**`, `src/design/ui/**` ni el marco del mapa. Detalle en `docs/campus/shell-3.0.md`.

## 13. Nota de Fase 3.1 (integración espacial)

La solicitud de Fase 3.1 requiere seleccionar departamentos mediante etiquetas. Sustituye la decisión de Fase 3.0 de mantenerlas informativas y transparentes al clic; las tarjetas utilizan el callback de navegación existente, sin un sistema paralelo. Se mantiene la fidelidad visual y el aislamiento indicado en el §12. Las copias contractuales no se actualizan para reflejar pruebas del consumidor: la evidencia actual se recoge en [integración espacial 3.1](../campus/integracion-espacial-3.1.md).

La corrección puntual posterior de composición, solicitada tras rechazar visualmente Fase 3.1, autoriza encuadrar la arquitectura y dejar el perímetro del terreno como fondo. Sustituye la reserva de incluir todo el zócalo descrita en el informe 3.1; no modifica el activo ni el Shell. Evidencia y revisión visual pendiente en [corrección de composición](../campus/correccion-composicion.md).

La Fase 3.2 autoriza exploración manual integrada con los vuelos. Sustituye el bloqueo de arrastre descrito por las fases anteriores: la órbita queda para depuración, mientras arrastre horizontal y zoom se habilitan normalmente. Conserva el Shell y el encuadre general aceptado provisionalmente. Guía, evidencia y limitaciones en [exploración 3.2](../campus/exploracion-3.2.md).

La Fase 3.3 autoriza activar Claro en el menú de apariencia del campus, antes marcado como prototipo en Fase 3.0. Reutiliza el almacén `useAppearance` y los tokens claros existentes. La biblioteca PBR y las texturas de 0.3.0 sustituyen la iluminación provisional del consumidor 0.2.0; el contrato 1.0.0 se conserva. Las descripciones históricas de activo sin texturas y modo Claro pendiente corresponden a versiones anteriores. Evidencia y limitaciones en [integración 3.3](../campus/integracion-3.3.md).

La Fase 3.5 corrige el descarte de tiempo a pocos FPS documentado en 3.4. Los vuelos usan segmentos temporales en el mismo controlador; el resorte permanece para la exploración y no altera encuadres. Las sombras se cachean en lugar de regenerarse por movimiento de cámara. Los perfiles opt-in de desarrollo pueden reducir DPR/resolución y sombras de vegetación sin editar el manifiesto del productor. La configuración alta conserva los valores visuales anteriores. Diagnóstico, validación y E2E pendientes en [rendimiento 3.5](../campus/rendimiento-3.5.md).

La Fase 3.6 autoriza la copia coordinada de 0.4.0 y detalle progresivo. La propuesta del productor de ocultar grupos departamentales completos en general se adapta al requisito explícito de conservar mobiliario importante: los grupos mezclan piezas por material, por lo que el consumidor mantiene elementos esenciales y solo gestiona secundarios independientes. El encuadre general usa los IDs anteriores con geometría real actual, evitando que añadidos alteren la composición. La nueva reversión por bundle sustituye la limitación histórica de tener que restaurar todo el consumidor. Evidencia y aprobación visual pendiente en [integración 3.6](../campus/integracion-3.6.md).

La Fase 3.7-B es únicamente diagnóstico y propuesta. Se detecta una discrepancia entre el control individual de reflejo previsto por el perfil y Three 0.180: con `scene.environment` y sin mapa explícito en el material, el shader usa `scene.environmentIntensity`, aunque el adaptador actualice `material.envMapIntensity`. Su semántica absoluta o multiplicativa debe acordarse con el productor antes de corregirla. Los documentos históricos de bloom, reversión y vuelos deben interpretarse según la fase; no autorizan un rediseño. [Diagnóstico](../campus/visual-unity-3.7-b.md) y [coordinación propuesta](../campus/coordination-claude-3.7-b.md); producción, activos y cámaras permanecen intactos.

La aprobación condicionada posterior de 3.7-B permite [calibración reversible en desarrollo](../campus/calibracion-renderer-3.7-b.md), mediante opt-in y variantes de vidrio/entorno/iluminación. Sustituye la restricción de solo documentación para ese alcance; no aprueba rediseñar producción, cambiar cámaras/Shell o adoptar GLB 0.5.0 y esquema candidato 1.1.0. La referencia estable se conserva y la validación visual permanece pendiente por restricciones de ejecución.

La Fase C.2 autoriza integrar experimentalmente `company-world@0.1.0` c1/B detrás del flag de desarrollo, manteniendo `campus-pilot@0.4.0` como predeterminado. Las anotaciones del paquete se consumen sin formalizar contrato/perfil 1.1.0. Se adapta encuadre/capas/hotspots solo para el candidato: los nodos antiguos de interior no existen y las capas nuevas tienen grupos reales. La sugerencia `lowQuality` del productor se limita para conservar interior del seleccionado y entorno de soporte; no se activa su propuesta de acento configurable ni zonas vacías. [Integración y pendientes](../campus/company-world-c2.md). La siguiente fase artística y la sustitución definitiva requieren aprobación.

La Fase D.3 incorpora D.2 `company-world@0.2.0` explícitamente por `v`, sin sobrescribir C.1 o el campus. Sus anclas de zona permiten reactivar los hotspots con posición mundial de nodos vacíos, no cajas de mobiliario. Las cuatro luces y patches arquitectónicos proceden del paquete. Se corrige solo en D.2 el rango de niebla que ocultaría toda la arquitectura en móvil, sin cambiar cámaras/perfil copiado. El README del productor menciona tanto refinamiento del podio como identidad geométrica con C.1; el consumidor verifica identidades y encuadres directamente y no presupone ausencia de añadidos. [Resultados, comparación y revisión visual pendiente](../campus/company-world-d3.md).

## Decisión D.4: único mundo activo

La aprobación D.4 sustituye la condición experimental de C.2/D.3: Company World 0.2.0 es el único activo predeterminado de `/campus-3d`, en desarrollo y producción. El campus anterior y C.1 se retiran del código y de `public`, conservando el historial documental y un respaldo verificable fuera del flujo de producción. No se modifica el estado `published: false` del manifiesto externo: indica el estado de publicación del productor, no cuál es el mundo de desarrollo aprobado. Los documentos anteriores describen decisiones históricas; sus instrucciones de flags/reversión ya no son vigentes. [Informe y restauración D.4](../campus/company-world-d4.md).
