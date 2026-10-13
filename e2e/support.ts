import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Usuario de demostración (src/data/sources/mock). */
export const USER = { email: 'test@example.com', password: 'password' };

/** Abre el mapa sin la bienvenida, que se prueba aparte. */
export async function login(page: Page): Promise<void> {
    await page
        .context()
        .addInitScript(() => sessionStorage.setItem('arx-intro', '1'));
    await page.goto('/mapa');
    await expect(page.locator('.etq, .fila-dep').first()).toBeVisible();
}

/** Errores de JavaScript y de consola durante la prueba. */
export function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    return errors;
}

type Box = { x: number; y: number; width: number; height: number };
export const overlaps = (a: Box, b: Box, gap = 0) =>
    a.x < b.x + b.width + gap &&
    b.x < a.x + a.width + gap &&
    a.y < b.y + b.height + gap &&
    b.y < a.y + a.height + gap;

/** Guarda una preferencia como lo hace la aplicación (localStorage) para la siguiente carga. */
export async function setPreference(
    page: Page,
    name: string,
    value: string,
): Promise<void> {
    await page.evaluate(([n, v]) => localStorage.setItem(n, v), [name, value]);
}
