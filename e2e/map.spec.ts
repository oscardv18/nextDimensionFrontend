import { expect, test } from '@playwright/test';
import { collectErrors, login, overlaps, setPreference } from './support';

const VIEWPORTS = [
    { width: 1366, height: 657, label: '1366×768 al 100 %' },
    { width: 1280, height: 600, label: '1280×720' },
    { width: 1920, height: 969, label: '1920×1080' },
];

test.describe('mapa de la empresa', () => {
    for (const vp of VIEWPORTS) {
        test(`composición en ${vp.label}, ambos temas`, async ({ page }) => {
            const errors = collectErrors(page);
            await page.setViewportSize(vp);
            await login(page);

            for (const theme of ['light', 'dark']) {
                await setPreference(page, 'appearance', theme);
                await page.reload();
                await expect(page.locator('html')).toHaveAttribute(
                    'data-theme',
                    theme,
                );
                await page.waitForTimeout(300);

                // Un único desplazamiento: el documento no se desplaza ni desborda en horizontal
                const doc = await page.evaluate(() => ({
                    sw: document.documentElement.scrollWidth,
                    cw: document.documentElement.clientWidth,
                    sh: document.documentElement.scrollHeight,
                    ch: document.documentElement.clientHeight,
                }));
                expect(doc.sw).toBeLessThanOrEqual(doc.cw);
                expect(doc.sh).toBeLessThanOrEqual(doc.ch);

                // Las etiquetas de departamento no se solapan y quedan dentro del área de trabajo, bajo el encabezado
                const canvas = (await page
                    .locator('.lienzo-in')
                    .boundingBox())!;
                const header = (await page.locator('.mapa-cab').boundingBox())!;
                const labels = await page
                    .locator('.etq')
                    .evaluateAll((els) =>
                        els.map((e) => e.getBoundingClientRect().toJSON()),
                    );
                expect(labels.length).toBe(6);
                for (const [i, a] of labels.entries()) {
                    expect(a.x).toBeGreaterThanOrEqual(canvas.x - 1);
                    expect(a.x + a.width).toBeLessThanOrEqual(
                        canvas.x + canvas.width + 1,
                    );
                    expect(a.y).toBeGreaterThanOrEqual(
                        header.y + header.height - 2,
                    );
                    for (const b of labels.slice(i + 1)) {
                        expect(overlaps(a, b)).toBe(false);
                    }
                }
                // Los contadores de las conexiones no tapan las etiquetas
                const nodes = await page
                    .locator('.nodo')
                    .evaluateAll((els) =>
                        els.map((e) => e.getBoundingClientRect().toJSON()),
                    );
                expect(nodes.length).toBeGreaterThan(0);
                for (const n of nodes) {
                    for (const l of labels) {
                        expect(overlaps(n, l)).toBe(false);
                    }
                }
            }
            expect(errors).toEqual([]);
        });
    }

    test('rotula los datos de demostración y solo usa public_id', async ({
        page,
    }) => {
        await login(page);
        await expect(page.locator('.mapa-cab .demo')).toBeVisible();
        const ids = await page
            .locator('[data-dep]')
            .evaluateAll((els) => els.map((e) => e.getAttribute('data-dep')));
        expect(ids.length).toBeGreaterThan(0);
        for (const id of ids) {
            expect(id).toMatch(/^[0-9a-f-]{36}$/);
        }
    });

    test('selección, apertura del departamento y retorno con teclado', async ({
        page,
    }) => {
        const errors = collectErrors(page);
        await login(page);

        // 1 selecciona el primer departamento y enfoca su etiqueta
        await page.keyboard.press('1');
        const first = page.locator('.etq').first();
        await expect(page.locator('.tarjeta-sel')).toBeVisible();
        await expect(page.locator('.etq.sel')).toHaveCount(1);
        const selected = await page
            .locator('.etq.sel')
            .getAttribute('data-dep');
        await expect(page.locator(`[data-dep="${selected}"]`)).toBeFocused();

        // Flechas: el foco pasa a otro departamento
        await page.keyboard.press('ArrowRight');
        await expect(
            page.locator(`[data-dep="${selected}"]`),
        ).not.toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(`[data-dep="${selected}"]`)).toBeFocused();

        // Enter sobre la etiqueta seleccionada abre su página por public_id
        await page.keyboard.press('Enter');
        await page.waitForURL(/\/departamentos\/[0-9a-f-]{36}$/);
        expect(page.url()).toContain(selected!);
        await expect(page.locator('.depto h1')).toBeFocused();

        // Esc vuelve al mapa con el departamento seleccionado y su etiqueta enfocada
        await page.keyboard.press('Escape');
        await page.waitForURL('**/mapa');
        await expect(page.locator(`[data-dep="${selected}"]`)).toBeFocused();
        await expect(page.locator('.etq.sel')).toHaveCount(1);

        // Esc de nuevo: vista general
        await page.keyboard.press('Escape');
        await expect(page.locator('.etq.sel')).toHaveCount(0);
        await expect(page.locator('.tarjeta-sel')).toHaveCount(0);
        await expect(first).toBeVisible();
        expect(errors).toEqual([]);
    });

    test('departamento inexistente muestra la página 404', async ({ page }) => {
        await login(page);
        await page.goto('/departamentos/01a0f755-f200-7000-8000-000000000000');
        await expect(page.getByRole('alert')).toContainText('404');
    });

    test('el marco no se remonta al pasar del mapa al departamento', async ({
        page,
    }) => {
        await login(page);
        await page.locator('.app').evaluate((el) => {
            (el as HTMLElement & { __marca?: boolean }).__marca = true;
        });
        await page.keyboard.press('1');
        await expect(page.locator('.etq.sel')).toBeFocused();
        await page.keyboard.press('Enter');
        await page.waitForURL(/\/departamentos\//);
        const sigue = await page
            .locator('.app')
            .evaluate(
                (el) => !!(el as HTMLElement & { __marca?: boolean }).__marca,
            );
        expect(sigue).toBe(true);
    });

    test('conexión: el nodo abre su cajón con origen y destino', async ({
        page,
    }) => {
        await login(page);
        await page.locator('.nodo').first().click();
        const sheet = page.locator('[data-slot="sheet-content"]');
        await expect(sheet).toBeVisible();
        await expect(sheet.locator('.vin-dep')).toHaveCount(2);
        await page.keyboard.press('Escape');
        await expect(sheet).toHaveCount(0);
    });

    test('capas: ocultar conexiones y recordar la preferencia', async ({
        page,
    }) => {
        await login(page);
        await page.keyboard.press('c');
        const menu = page.locator('[data-slot="popover-content"]');
        await expect(menu).toBeVisible();
        await menu
            .getByRole('switch', { name: 'Conexiones de procesos' })
            .click();
        await page.keyboard.press('Escape');
        await expect(page.locator('.ruta-g')).toHaveCount(0);
        await page.reload();
        await expect(page.locator('.ruta-g')).toHaveCount(0);
        await page.keyboard.press('c');
        await page
            .locator('[data-slot="popover-content"]')
            .getByRole('button', { name: 'Restablecer' })
            .click();
        await page.keyboard.press('Escape');
        await expect(page.locator('.ruta-g').first()).toBeVisible();
    });

    test('escenarios de demostración: los cuatro sectores dibujan su mapa', async ({
        page,
    }) => {
        const errors = collectErrors(page);
        await login(page);
        const expected = {
            'U.E. Los Samanes': 7,
            'Ferretería El Tornillo': 5,
            'Fogón Siete': 5,
            'Metalúrgica Andina': 6,
        };
        for (const [name, count] of Object.entries(expected)) {
            await page.locator('.barra .miga').first().click();
            await page
                .getByRole('menuitemradio', { name: new RegExp(name) })
                .click();
            await expect(page.locator('.etq')).toHaveCount(count);
            await expect(page.locator('.lbl-org')).toContainText(name);
        }
        expect(errors).toEqual([]);
    });
});

test.describe('pantallas pequeñas', () => {
    test('390 px: lista equivalente sin desbordamiento horizontal', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await login(page);
        await expect(page.locator('.lista-dep')).toBeVisible();
        await expect(page.locator('.fila-dep')).toHaveCount(6);
        const doc = await page.evaluate(() => [
            document.documentElement.scrollWidth,
            document.documentElement.clientWidth,
        ]);
        expect(doc[0]).toBeLessThanOrEqual(doc[1]);
        const overflow = await page.evaluate(() =>
            [
                ...document.querySelectorAll<HTMLElement>(
                    '.barra *, .carril *, .lista-dep *',
                ),
            ]
                .filter(
                    (e) =>
                        e.getBoundingClientRect().right > window.innerWidth + 1,
                )
                .map((e) => e.className),
        );
        expect(overflow).toEqual([]);
        await page.locator('.fila-dep').first().click();
        await page.waitForURL(/\/departamentos\//);
        const dep = await page.evaluate(() => [
            document.documentElement.scrollWidth,
            document.documentElement.clientWidth,
        ]);
        expect(dep[0]).toBeLessThanOrEqual(dep[1]);
    });
});

test.describe('zoom del navegador al 200 % (1366×768 → 683×317 CSS, densidad 2)', () => {
    test.use({ viewport: { width: 683, height: 317 }, deviceScaleFactor: 2 });

    test('sin pérdida de función: marco, carril, mapa y menús dentro de la ventana', async ({
        page,
    }) => {
        const errors = collectErrors(page);
        await login(page);
        const doc = await page.evaluate(() => [
            document.documentElement.scrollWidth,
            document.documentElement.clientWidth,
        ]);
        expect(doc[0]).toBeLessThanOrEqual(doc[1]);

        // El carril se compacta y, si no cabe, se desplaza por dentro: el último botón sigue alcanzable
        const lastRailItem = page.locator('.carril .abajo .item').last();
        await lastRailItem.scrollIntoViewIfNeeded();
        await expect(lastRailItem).toBeInViewport();

        // Como en el prototipo aprobado, el área de trabajo (< 640 px) muestra la lista equivalente al mapa
        const row = page.locator('.fila-dep').first();
        await expect(row).toBeVisible();
        await row.focus();
        await page.keyboard.press('Enter');
        await page.waitForURL(/\/departamentos\//);
        await page.keyboard.press('Escape');
        await page.waitForURL('**/mapa');

        // El menú de perfil cabe en la ventana
        await page.locator('.perfil').click();
        const menu = (await page.locator('.menu-perfil').boundingBox())!;
        expect(menu.x).toBeGreaterThanOrEqual(0);
        expect(menu.x + menu.width).toBeLessThanOrEqual(683 + 1);
        expect(menu.y + Math.min(menu.height, 317)).toBeLessThanOrEqual(
            317 + 1,
        );
        await page.keyboard.press('Escape');
        expect(errors).toEqual([]);
    });
});
