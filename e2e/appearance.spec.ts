import { expect, test } from '@playwright/test';
import { USER, collectErrors, login } from './support';

test.describe('tema, acento y preferencias', () => {
    test('el tema y el acento se guardan y llegan pintados antes de cargar la aplicación (sin destello)', async ({
        page,
    }) => {
        const errors = collectErrors(page);
        await login(page);

        await page.locator('.perfil').click();
        const menu = page.locator('.menu-perfil');
        await menu.getByRole('button', { name: 'Oscuro' }).click();
        await menu.getByRole('radio', { name: 'Rojo' }).click();
        await expect(page.locator('html')).toHaveAttribute(
            'data-theme',
            'dark',
        );
        await expect(page.locator('html')).toHaveAttribute(
            'data-accent',
            'red',
        );

        // Sin el código de la aplicación, el script de index.html ya pinta el tema y el acento elegidos
        await page.route('**/src/app/main.tsx', (route) => route.abort());
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute(
            'data-theme',
            'dark',
        );
        await expect(page.locator('html')).toHaveAttribute(
            'data-accent',
            'red',
        );
        await page.unroute('**/src/app/main.tsx');

        // Persisten tras recargar y en otras páginas
        await page.reload();
        await expect(page.locator('html')).toHaveAttribute(
            'data-theme',
            'dark',
        );
        await page.goto('/settings/appearance');
        await expect(page.locator('html')).toHaveAttribute(
            'data-accent',
            'red',
        );

        // Volver a los valores por defecto
        await page.getByRole('button', { name: 'Sistema' }).click();
        await page.getByRole('radio', { name: 'Púrpura' }).click();
        await expect(page.locator('html')).toHaveAttribute(
            'data-appearance',
            'system',
        );
        // La ruta abortada deja un error de red esperado
        expect(errors.filter((e) => !e.includes('ERR_FAILED'))).toEqual([]);
    });

    test('modo sistema sigue la preferencia del sistema operativo', async ({
        browser,
    }) => {
        const context = await browser.newContext({
            colorScheme: 'dark',
            viewport: { width: 1366, height: 657 },
        });
        const page = await context.newPage();
        await login(page);
        await expect(page.locator('html')).toHaveAttribute(
            'data-appearance',
            'system',
        );
        await expect(page.locator('html')).toHaveAttribute(
            'data-theme',
            'dark',
        );
        await context.close();
    });

    test('movimiento reducido del sistema: sin pulsos ni bienvenida', async ({
        browser,
    }) => {
        const context = await browser.newContext({
            reducedMotion: 'reduce',
            viewport: { width: 1366, height: 657 },
        });
        const page = await context.newPage();
        await login(page);
        await expect(page.locator('html')).toHaveClass(/reducido/);
        await page.waitForTimeout(3500);
        await expect(page.locator('.pulso-cabeza')).toHaveCount(0);
        await expect(page.locator('.bienvenida')).toHaveCount(0);
        await context.close();
    });

    test('los pulsos de demostración se generan y se detienen al pausar (P)', async ({
        page,
    }) => {
        await login(page);
        await expect(page.locator('.pulso-cabeza').first()).toBeAttached({
            timeout: 6000,
        });
        await page.keyboard.press('p');
        await expect(page.locator('.pulso-cabeza')).toHaveCount(0);
        await page.keyboard.press('p');
    });

    test('cristal desactivado: superficies sólidas', async ({ page }) => {
        await login(page);
        await page.locator('.perfil').click();
        await page
            .locator('.menu-perfil')
            .getByRole('switch', { name: 'Efecto cristal' })
            .click();
        await expect(page.locator('html')).toHaveClass(/sin-vidrio/);
        await page.reload();
        await expect(page.locator('html')).toHaveClass(/sin-vidrio/);
        await page.locator('.perfil').click();
        await page
            .locator('.menu-perfil')
            .getByRole('switch', { name: 'Efecto cristal' })
            .click();
        await expect(page.locator('html')).not.toHaveClass(/sin-vidrio/);
    });
});

test.describe('idioma', () => {
    test('cambiar a inglés y volver a español (persistente en el navegador)', async ({
        page,
    }) => {
        await login(page);
        await page.locator('.perfil').click();
        await page
            .locator('.menu-perfil')
            .getByRole('button', { name: 'English' })
            .click();
        await expect(page.locator('.mapa-cab h1')).toHaveText('Company map');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await page.reload();
        await expect(page.locator('.mapa-cab h1')).toHaveText('Company map');
        await page.locator('.perfil').click();
        await page
            .locator('.menu-perfil')
            .getByRole('button', { name: 'Español' })
            .click();
        await expect(page.locator('.mapa-cab h1')).toHaveText(
            'Mapa de la empresa',
        );
    });
});

test.describe('pantallas de acceso (envío simulado)', () => {
    test('credenciales incorrectas muestran el error traducido', async ({
        page,
    }) => {
        await page.goto('/login');
        await expect(
            page.getByRole('heading', { name: 'Inicia sesión en tu cuenta' }),
        ).toBeVisible();
        await page.fill('#email', USER.email);
        await page.fill('#password', 'incorrecta');
        await page.click('[data-test=login-button]');
        await expect(
            page.getByText(
                'Estas credenciales no coinciden con nuestros registros.',
            ),
        ).toBeVisible();
    });

    test('las credenciales de demostración llevan al mapa', async ({
        page,
    }) => {
        await page.goto('/login');
        await page.fill('#email', USER.email);
        await page.fill('#password', USER.password);
        await page.click('[data-test=login-button]');
        await page.waitForURL('**/mapa');
    });
});

test.describe('autenticación y navegación', () => {
    test('los ajustes se muestran dentro del marco', async ({ page }) => {
        const errors = collectErrors(page);
        await login(page);
        await page.locator('.perfil').click();
        await page
            .locator('.menu-perfil')
            .getByRole('link', { name: 'Cuenta y seguridad' })
            .click();
        await page.waitForURL('**/settings/profile');
        await expect(page.locator('.barra')).toBeVisible();
        await expect(page.locator('.carril')).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Cuenta', exact: true }),
        ).toBeVisible();
        await expect(page.locator('#email')).toHaveValue('test@example.com');
        await page.keyboard.press('m');
        await page.waitForURL('**/mapa');
        expect(errors).toEqual([]);
    });

    test('controles no integrados: anuncian su estado y no navegan', async ({
        page,
    }) => {
        await login(page);
        const search = page.locator('.buscar');
        await expect(search).toHaveAttribute('aria-disabled', 'true');
        await search.click({ force: true });
        await expect(page).toHaveURL(/\/mapa$/);
        await search.hover();
        await expect(page.getByRole('tooltip')).toContainText(
            'próxima entrega',
        );
        await expect(
            page.locator('.carril .item[aria-disabled="true"]'),
        ).toHaveCount(3);
    });

    test('saltar al contenido y atajos (?)', async ({ page }) => {
        await login(page);
        await page.keyboard.press('Tab');
        await expect(page.locator('.saltar')).toBeFocused();
        await page.keyboard.press('?');
        await expect(
            page.getByRole('dialog', { name: 'Atajos de teclado' }),
        ).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
    });
});
