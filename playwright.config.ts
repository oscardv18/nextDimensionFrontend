import { defineConfig, devices } from '@playwright/test';

/*
 * Pruebas de navegador contra el servidor de desarrollo de Vite (sin backend). Usan Chrome del sistema
 * (`channel: 'chrome'`) para no descargar un navegador; con PLAYWRIGHT_CHROMIUM_PATH se usa otro.
 */
export default defineConfig({
    testDir: 'e2e',
    fullyParallel: false,
    workers: 1,
    reporter: [['list']],
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
        locale: 'es-VE',
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
            : {},
    },
    webServer: process.env.E2E_BASE_URL
        ? undefined
        : {
              command: 'pnpm exec vite --port 5173 --strictPort',
              url: 'http://localhost:5173',
              reuseExistingServer: true,
          },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                channel: process.env.PLAYWRIGHT_CHROMIUM_PATH
                    ? undefined
                    : 'chrome',
                viewport: { width: 1366, height: 657 },
            },
        },
    ],
});
