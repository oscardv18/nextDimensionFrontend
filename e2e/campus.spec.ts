import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function setInterior(page: Page, open: boolean) {
    const button = page.getByRole('button', {
        name: 'Ver interior',
        exact: true,
    });
    const pressed = await button.getAttribute('aria-pressed');
    if ((pressed === 'true') !== open) await button.click();
    await expect(button).toHaveAttribute('aria-pressed', String(open));
}

async function waitForShell(page: Page) {
    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    document
                        .getAnimations()
                        .filter(
                            (animation) =>
                                animation.playState === 'running' &&
                                animation.effect?.getComputedTiming()
                                    .iterations !== Infinity,
                        ).length,
            ),
        )
        .toBe(0);
}

async function freeCanvasPoint(page: Page) {
    return page.evaluate(() => {
        for (const y of [0.4, 0.5, 0.6, 0.7])
            for (const x of [0.4, 0.5, 0.6]) {
                const px = x * innerWidth,
                    py = y * innerHeight;
                if (document.elementFromPoint(px, py)?.tagName === 'CANVAS')
                    return { x: px, y: py };
            }
        throw new Error('No canvas point');
    });
}

test('carga campus, cambia seis enfoques, cubierta y regreso general', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/campus-3d');
    await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
    const viewport = page.getByTestId('campus-viewport');
    await expect(viewport.locator('canvas')).toBeVisible();
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 20000,
    });
    for (const [name, id] of [
        ['Compras', 'shared.procurement'],
        ['Almacén', 'shared.warehouse'],
        ['Operaciones', 'shared.operations'],
        ['Ventas', 'shared.sales'],
        ['Administración', 'shared.administration'],
        ['Recursos Humanos', 'shared.human-resources'],
    ]) {
        await page.getByRole('button', { name, exact: true }).click();
        await expect(viewport).toHaveAttribute('data-camera', id, {
            timeout: 10000,
        });
    }
    await page.getByRole('button', { name: 'Compras', exact: true }).click();
    await setInterior(page, true);
    await expect(viewport).toHaveAttribute('data-roof', 'hidden');
    await expect(viewport.locator('canvas')).toHaveAttribute(
        'data-roof-visible',
        'false',
    );
    await page
        .getByRole('button', { name: 'Restaurar cubierta de Compras' })
        .click();
    await expect(viewport).toHaveAttribute('data-roof', 'visible');
    await expect(viewport.locator('canvas')).toHaveAttribute(
        'data-roof-visible',
        'true',
    );
    await page.keyboard.press('Escape');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 10000,
    });
    await page.screenshot({ path: 'test-results/campus-overview.png' });
    expect(errors).toEqual([]);
});

test('navegación accesible sin WebGL', async ({ page }) => {
    await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
            this: HTMLCanvasElement,
            ...args: Parameters<typeof original>
        ) {
            if (String(args[0]).includes('webgl')) return null;
            return original.apply(this, args);
        } as typeof original;
    });
    await page.goto('/campus-3d');
    await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
    await expect(page.getByTestId('campus-viewport')).toHaveAttribute(
        'data-mode',
        'fallback',
    );
    await page.getByRole('button', { name: 'Compras', exact: true }).click();
    await expect(page.getByTestId('campus-selection')).toHaveText('Compras');
    await expect(
        page.getByRole('button', { name: 'Restaurar cubierta de Compras' }),
    ).toBeDisabled();
    await page
        .getByRole('button', { name: 'Vista general', exact: true })
        .click();
    await expect(page.getByTestId('campus-selection')).toHaveText(
        'Vista general',
    );
});

test('un GLB corrupto conserva navegación de lista', async ({ page }) => {
    await page.route('**/asset.glb', (route) =>
        route.fulfill({ body: 'invalid glb' }),
    );
    await page.goto('/campus-3d');
    await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
    await expect(page.getByTestId('campus-viewport')).toHaveAttribute(
        'data-mode',
        'fallback',
    );
    await page.getByRole('button', { name: 'Ventas', exact: true }).click();
    await expect(page.getByTestId('campus-selection')).toHaveText('Ventas');
});

for (const width of [390, 768, 1366]) {
    test(`encuadres completos con reserva de panel a ${width}px`, async ({
        page,
    }) => {
        // Recorre siete encuadres: con WebGL por software (SwiftShader) y las capas con desenfoque
        // del Shell supera los 30 s por defecto; en GPU real tarda una fracción.
        test.setTimeout(60_000);
        await page.setViewportSize({ width, height: 844 });
        await page.goto('/campus-3d');
        await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
        const viewport = page.getByTestId('campus-viewport');
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 20000,
        });
        await page
            .getByRole('checkbox', { name: 'Reservar espacio para panel' })
            .check();
        const bounds = (await viewport.boundingBox())!;
        const reserve = (await viewport
            .locator('.campus-panel-reserve')
            .boundingBox())!;
        if (bounds.width < 760) {
            expect(Math.abs(reserve.width - bounds.width)).toBeLessThan(3);
            // Fase 3.0: la guía se apila sobre las capas inferiores reales del Shell (dock, panel).
            expect(reserve.y).toBeGreaterThan(bounds.y + bounds.height / 3);
        } else {
            expect(reserve.x).toBeGreaterThan(bounds.x + bounds.width / 2);
            expect(reserve.height).toBeGreaterThan(0);
            expect(reserve.y).toBeGreaterThan(bounds.y);
            expect(reserve.y + reserve.height).toBeLessThan(
                bounds.y + bounds.height,
            );
        }
        for (const [name, id] of [
            ['Vista general', 'overview'],
            ['Compras', 'shared.procurement'],
            ['Almacén', 'shared.warehouse'],
            ['Operaciones', 'shared.operations'],
            ['Ventas', 'shared.sales'],
            ['Administración', 'shared.administration'],
            ['Recursos Humanos', 'shared.human-resources'],
        ]) {
            await page.getByRole('button', { name, exact: true }).click();
            await expect(viewport).toHaveAttribute('data-camera', id, {
                timeout: 10000,
            });
            const fit = await viewport
                .locator('canvas')
                .evaluate((canvas) => JSON.parse(canvas.dataset.fit!));
            expect(fit.minX).toBeGreaterThanOrEqual(fit.area.left - 0.001);
            expect(fit.maxX).toBeLessThanOrEqual(fit.area.right + 0.001);
            expect(fit.minY).toBeGreaterThanOrEqual(fit.area.bottom - 0.001);
            expect(fit.maxY).toBeLessThanOrEqual(fit.area.top + 0.001);
            expect(fit.minZ).toBeGreaterThan(-1);
            expect(fit.maxZ).toBeLessThan(1);
            if (id !== 'overview') {
                const secondary = viewport.locator(
                    '.campus-label[data-secondary="true"]',
                );
                await expect(secondary).toHaveCount(5);
                // Fase 3.0: el resto de etiquetas desaparece al enfocar un departamento.
                await expect(secondary.first()).toHaveCSS('opacity', '0');
                const label = await viewport
                    .locator('.campus-label[data-selected="true"]')
                    .boundingBox();
                const box = await viewport.boundingBox();
                expect(label!.x).toBeGreaterThanOrEqual(box!.x);
                expect(label!.x + label!.width).toBeLessThanOrEqual(
                    box!.x + box!.width,
                );
            }
        }
        const overflow = await page.evaluate(
            () =>
                document.documentElement.scrollWidth >
                document.documentElement.clientWidth,
        );
        expect(overflow).toBe(false);
    });
}

test('selección por proxies en vista general y retorno', async ({ page }) => {
    // Recorre seis vuelos de ida y vuelta: con WebGL por software (SwiftShader) y las capas con desenfoque
    // del Shell supera los 30 s por defecto; en GPU real tarda una fracción.
    test.setTimeout(60_000);
    await page.goto('/campus-3d');
    await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
    const viewport = page.getByTestId('campus-viewport');
    for (const id of [
        'shared.procurement',
        'shared.warehouse',
        'shared.operations',
        'shared.sales',
        'shared.administration',
        'shared.human-resources',
    ]) {
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 20000,
        });
        const point: number[] = await viewport
            .locator('canvas')
            .evaluate(
                (canvas, id) =>
                    JSON.parse(canvas.dataset.fit!).hits.find(
                        (entry: { id: string }) => entry.id === id,
                    ).point,
                id,
            );
        const box = (await viewport.locator('canvas').boundingBox())!;
        await page.mouse.click(
            box.x + ((point[0] + 1) / 2) * box.width,
            box.y + ((1 - point[1]) / 2) * box.height,
        );
        await expect(viewport).toHaveAttribute('data-camera', id, {
            timeout: 10000,
        });
        await page
            .getByRole('button', { name: 'Vista general', exact: true })
            .click();
    }
});

test('última selección gana durante cambios rápidos y la escena descansa al terminar', async ({
    page,
}) => {
    await page.goto('/campus-3d');
    await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
    const viewport = page.getByTestId('campus-viewport');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 20000,
    });
    for (const name of [
        'Compras',
        'Ventas',
        'Almacén',
        'Recursos Humanos',
        'Operaciones',
        'Administración',
        'Compras',
    ]) {
        await page.getByRole('button', { name, exact: true }).click();
    }
    await setInterior(page, true);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Ventas', exact: true }).click();
    await expect(viewport).toHaveAttribute('data-camera', 'shared.sales', {
        timeout: 10000,
    });
    await page.keyboard.press('Escape');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 10000,
    });
    // Dos fotogramas residuales son admisibles; no se acepta un bucle continuo en reposo.
    await expect(viewport.locator('canvas')).toHaveAttribute(
        'data-labels-settled',
        'true',
    );
    const before = Number(
        await viewport.locator('canvas').getAttribute('data-frames'),
    );
    await page.waitForTimeout(500);
    const after = Number(
        await viewport.locator('canvas').getAttribute('data-frames'),
    );
    expect(after - before).toBeLessThanOrEqual(2);
    await page.getByRole('button', { name: 'Compras', exact: true }).click();
    await page
        .getByRole('button', { name: 'Restaurar cubierta de Compras' })
        .click();
    await expect(viewport.locator('canvas')).toHaveAttribute(
        'data-roof-visible',
        'true',
    );
});

test('exploración desplaza sin rotar; la órbita solo se activa en depuración', async ({
    page,
}) => {
    await page.goto('/campus-3d');
    await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
    const viewport = page.getByTestId('campus-viewport');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 20000,
    });
    await expect(
        page.getByRole('checkbox', { name: 'Órbita libre (depuración)' }),
    ).not.toBeChecked();
    const canvas = viewport.locator('canvas');
    await expect(canvas).toHaveCSS('touch-action', 'none');
    const initial = JSON.parse((await canvas.getAttribute('data-fit'))!);
    const point = await freeCanvasPoint(page);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 100, point.y, {
        steps: 5,
    });
    await page.mouse.up();
    await expect(viewport).toHaveAttribute('data-camera', 'manual');
    await expect(canvas).toHaveAttribute('data-manual-settled', 'true');
    const manual = JSON.parse((await canvas.getAttribute('data-manual-pose'))!);
    expect(manual.position).not.toEqual(initial.position);
    const direction = (pose: { position: number[]; target: number[] }) =>
        pose.position.map((p, index) => p - pose.target[index]);
    direction(manual).forEach((value, index) =>
        expect(value).toBeCloseTo(direction(initial)[index], 5),
    );
    await page
        .getByRole('checkbox', { name: 'Órbita libre (depuración)' })
        .check();
    await expect(canvas).toHaveCSS('touch-action', 'none');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 10000,
    });
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 100, point.y, {
        steps: 5,
    });
    await page.mouse.up();
    await expect(viewport).toHaveAttribute('data-camera', 'manual');
    await page
        .getByRole('checkbox', { name: 'Órbita libre (depuración)' })
        .uncheck();
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 10000,
    });
});

test('respeta movimiento reducido y mantiene un encuadre completo', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/campus-3d');
    await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
    const viewport = page.getByTestId('campus-viewport');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 20000,
    });
    await page.getByRole('button', { name: 'Compras', exact: true }).click();
    await expect(viewport).toHaveAttribute('data-camera', 'shared.procurement');
});

for (const size of [
    { width: 320, height: 568 },
    { width: 640, height: 360 },
    { width: 1920, height: 1080 },
]) {
    test(`canvas inmersivo ${size.width}×${size.height}: diagnóstico y panel flotan sin reducirlo`, async ({
        page,
    }) => {
        await page.setViewportSize(size);
        await page.goto('/campus-3d');
        const viewport = page.getByTestId('campus-viewport');
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 20000,
        });
        const canvas = viewport.locator('canvas');
        const handle = await canvas.elementHandle();
        const original = (await canvas.boundingBox())!;
        expect(original.x).toBe(0);
        expect(original.y).toBe(0);
        expect(original.width).toBe(size.width);
        expect(original.height).toBe(size.height);
        await expect(
            page.getByRole('button', { name: 'Compras', exact: true }),
        ).not.toBeVisible();
        await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
        await page
            .getByRole('checkbox', { name: 'Reservar espacio para panel' })
            .check();
        await page
            .getByRole('button', { name: 'Vista general', exact: true })
            .click();
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 10000,
        });
        expect(await canvas.boundingBox()).toEqual(original);
        await page.getByRole('button', { name: 'Ocultar diagnóstico' }).click();
        // Con el diagnóstico plegado, el regreso general es «Control» en el dock.
        await page
            .getByRole('button', { name: 'Control', exact: true })
            .click();
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 10000,
        });
        expect(await canvas.boundingBox()).toEqual(original);
        expect(await handle!.evaluate((element) => element.isConnected)).toBe(
            true,
        );
        const doc = await page.evaluate(() => ({
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
        }));
        expect(doc.width).toBeLessThanOrEqual(size.width);
        expect(doc.height).toBeLessThanOrEqual(size.height);
    });
}

test('Shell: «Atención ahora» abre Compras con su panel y la vista general lo cierra', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/campus-3d');
    const viewport = page.getByTestId('campus-viewport');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 20000,
    });
    // Las seis etiquetas tienen contenido (incluida Compras, la primera en montarse).
    await expect(viewport.locator('.campus-label .cc-tag')).toHaveCount(6);
    await page.screenshot({ path: 'test-results/shell-overview.png' });
    await page.getByRole('button', { name: /4 compras por aprobar/ }).click();
    await expect(viewport).toHaveAttribute(
        'data-camera',
        'shared.procurement',
        {
            timeout: 10000,
        },
    );
    await expect(page.getByRole('tab', { name: /Solicitudes/ })).toBeVisible();
    // La cámara reserva el panel: el encuadre termina antes de su borde izquierdo.
    const panel = (await page.locator('.cc-slot-panel').boundingBox())!;
    const fit = await viewport
        .locator('canvas')
        .evaluate((canvas) => JSON.parse(canvas.dataset.fit!));
    expect(((fit.maxX + 1) / 2) * 1440).toBeLessThan(panel.x);
    await setInterior(page, true);
    await expect(viewport).toHaveAttribute('data-roof', 'hidden');
    await expect(
        page.getByRole('button', { name: 'Órdenes: 8' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Órdenes: 8' }).click();
    await expect(page.getByRole('tab', { name: /Órdenes/ })).toHaveAttribute(
        'aria-selected',
        'true',
    );
    await page.getByRole('tab', { name: /Solicitudes/ }).click();
    await waitForShell(page);
    await page.screenshot({ path: 'test-results/shell-procurement.png' });
    await page.getByRole('button', { name: 'Volver a vista general' }).click();
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 10000,
    });
    await expect(
        page.getByRole('heading', { name: 'Atención ahora' }),
    ).toBeVisible();
    expect(errors).toEqual([]);
});

for (const size of [
    { width: 390, height: 844 },
    { width: 640, height: 360 },
    { width: 1440, height: 900 },
]) {
    test(`Fase 3.1: etiquetas evitan el Shell y selección por teclado a ${size.width}×${size.height}`, async ({
        page,
    }) => {
        await page.setViewportSize(size);
        await page.goto('/campus-3d');
        const viewport = page.getByTestId('campus-viewport');
        const canvas = viewport.locator('canvas');
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 20000,
        });
        await expect(canvas).toHaveAttribute('data-labels-settled', 'true');
        const before = await canvas.getAttribute('data-fit');
        const validate = async () => {
            const violations = await page.evaluate(() => {
                const boxes = Array.from(
                    document.querySelectorAll<HTMLElement>(
                        '.campus-spatial-button[data-layout-hidden="false"] .cc-tag-card, .campus-spatial-button[data-layout-hidden="false"] .cc-hotspot',
                    ),
                ).map((element) => element.getBoundingClientRect());
                const obstacles = Array.from(
                    document.querySelectorAll<HTMLElement>(
                        '.cc-slot-top, .cc-slot-rail, .cc-slot-heading, .cc-slot-panel, .cc-slot-dock, .cc-slot-status, [role="menu"], [role="listbox"]',
                    ),
                )
                    .map((element) => element.getBoundingClientRect())
                    .filter((box) => box.width > 0 && box.height > 0);
                const overlaps = (a: DOMRect, b: DOMRect) =>
                    a.left < b.right &&
                    a.right > b.left &&
                    a.top < b.bottom &&
                    a.bottom > b.top;
                return boxes.filter(
                    (box, index) =>
                        box.left < 7 ||
                        box.top < 7 ||
                        box.right > innerWidth - 7 ||
                        box.bottom > innerHeight - 7 ||
                        obstacles.some((other) => overlaps(box, other)) ||
                        boxes
                            .slice(index + 1)
                            .some((other) => overlaps(box, other)),
                ).length;
            });
            expect(violations).toBe(0);
        };
        await validate();
        // Algunas tarjetas pueden ocultarse en pantallas pequeñas; la navegación del Shell continúa disponible.
        const label = page.getByRole('button', {
            name: 'Enfocar Compras',
            exact: true,
        });
        if (await label.isVisible()) {
            await label.focus();
            await page.keyboard.press('Enter');
        } else {
            await page.getByRole('combobox').fill('Compras');
            await page.getByRole('combobox').press('Enter');
        }
        await expect(viewport).toHaveAttribute(
            'data-camera',
            'shared.procurement',
            { timeout: 10000 },
        );
        await expect(canvas).toHaveAttribute('data-labels-settled', 'true');
        await validate();
        await setInterior(page, true);
        await expect(canvas).toHaveAttribute('data-roof-visible', 'false');
        await expect(canvas).toHaveAttribute('data-labels-settled', 'true');
        await validate();
        await setInterior(page, false);
        await expect(canvas).toHaveAttribute('data-roof-visible', 'true');
        await page.keyboard.press('Escape');
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 10000,
        });
        // Compara posición y objetivo; las métricas de draw calls pueden variar al restaurar la cubierta.
        const original = JSON.parse(before!);
        await expect
            .poll(async () => {
                const fit = JSON.parse(
                    (await canvas.getAttribute('data-fit'))!,
                );
                return JSON.stringify([fit.position, fit.target]);
            })
            .toBe(JSON.stringify([original.position, original.target]));
        await expect(canvas).toHaveAttribute('data-labels-settled', 'true');
        await validate();
        await page.screenshot({
            path: `test-results/composition-3.1-${size.width}.png`,
        });
    });
}

for (const size of [
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
]) {
    test(`revisión visual provisional del encuadre ${size.width}×${size.height}`, async ({
        page,
    }) => {
        test.setTimeout(60_000);
        await page.setViewportSize(size);
        await page.goto('/campus-3d');
        const viewport = page.getByTestId('campus-viewport');
        const canvas = viewport.locator('canvas');
        const ready = async (id: string) => {
            await expect(viewport).toHaveAttribute('data-camera', id, {
                timeout: 20000,
            });
            await expect(canvas).toHaveAttribute('data-labels-settled', 'true');
            // El Shell mantiene sus animaciones CSS, independientes del reposo del canvas.
            await waitForShell(page);
        };
        await ready('overview');
        await expect(
            page.getByRole('heading', { name: 'Atención ahora' }),
        ).toBeVisible();
        await page.screenshot({
            path: `test-results/camera-correction-${size.width}-overview.png`,
        });
        await page
            .getByRole('button', { name: /4 compras por aprobar/ })
            .click();
        await ready('shared.procurement');
        await setInterior(page, true);
        await expect(canvas).toHaveAttribute('data-roof-visible', 'false');
        await ready('shared.procurement');
        await page.screenshot({
            path: `test-results/camera-correction-${size.width}-procurement.png`,
        });
        await setInterior(page, false);
        await page
            .getByRole('button', { name: 'Volver a vista general' })
            .click();
        await ready('overview');
        await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
        await page
            .getByRole('checkbox', { name: 'Reservar espacio para panel' })
            .check();
        await page.getByRole('button', { name: 'Ocultar diagnóstico' }).click();
        await ready('overview');
        await expect(
            page.getByRole('heading', { name: 'Atención ahora' }),
        ).toBeVisible();
        await page.screenshot({
            path: `test-results/camera-correction-${size.width}-overview-panel.png`,
        });
        const box = (await canvas.boundingBox())!;
        expect([box.width, box.height]).toEqual([size.width, size.height]);
    });
}

test('Fase 3.2: arrastre, zoom, panel y retorno desde exploración', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/campus-3d');
    const viewport = page.getByTestId('campus-viewport'),
        canvas = viewport.locator('canvas');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 20000,
    });
    const initial = JSON.parse((await canvas.getAttribute('data-fit'))!);
    const point = await page.evaluate(() => {
        for (const y of [0.4, 0.5, 0.6, 0.7])
            for (const x of [0.4, 0.5, 0.6]) {
                const px = x * innerWidth,
                    py = y * innerHeight;
                if (document.elementFromPoint(px, py)?.tagName === 'CANVAS')
                    return { x: px, y: py };
            }
        throw new Error('No canvas point');
    });
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x + 80, point.y + 20, { steps: 8 });
    await page.mouse.move(point.x, point.y, { steps: 8 });
    await page.mouse.up();
    await expect(viewport).toHaveAttribute('data-navigation', 'manual');
    await expect(page.getByTestId('campus-selection')).toHaveText(
        'Vista general',
    );
    await page.mouse.wheel(0, -120);
    await expect(canvas).toHaveAttribute('data-manual-settled', 'true');
    const beforePanel = await canvas.getAttribute('data-manual-pose');
    await page.getByRole('button', { name: 'Mostrar diagnóstico' }).click();
    await page
        .getByRole('checkbox', { name: 'Reservar espacio para panel' })
        .check();
    await expect(viewport).toHaveAttribute('data-navigation', 'manual');
    expect(await canvas.getAttribute('data-manual-pose')).toBe(beforePanel);
    for (const name of ['Ventas', 'Almacén', 'Compras'])
        await page.getByRole('button', { name, exact: true }).click();
    await expect(viewport).toHaveAttribute(
        'data-camera',
        'shared.procurement',
        { timeout: 10000 },
    );
    await setInterior(page, true);
    await expect(canvas).toHaveAttribute('data-roof-visible', 'false');
    await page
        .getByRole('checkbox', { name: 'Reservar espacio para panel' })
        .uncheck();
    await page.getByRole('button', { name: 'Ocultar diagnóstico' }).click();
    await page.keyboard.press('Escape');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 10000,
    });
    await expect
        .poll(async () => {
            const fit = JSON.parse((await canvas.getAttribute('data-fit'))!);
            return JSON.stringify([fit.position, fit.target]);
        })
        .toBe(JSON.stringify([initial.position, initial.target]));
});

test('Fase 3.2: táctil desplaza y hace pinch en pantalla pequeña', async ({
    browser,
}) => {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        baseURL: test.info().project.use.baseURL,
        locale: 'es-VE',
    });
    try {
        const page = await context.newPage();
        await page.goto('/campus-3d');
        const viewport = page.getByTestId('campus-viewport'),
            canvas = viewport.locator('canvas');
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 20000,
        });
        const point = await page.evaluate(() => {
            for (const y of [0.35, 0.4, 0.45, 0.5, 0.55])
                for (const x of [0.3, 0.4, 0.5, 0.6]) {
                    const px = x * innerWidth,
                        py = y * innerHeight;
                    if (
                        [-30, 0, 30].every(
                            (dx) =>
                                document.elementFromPoint(px + dx, py)
                                    ?.tagName === 'CANVAS',
                        )
                    )
                        return { x: px, y: py };
                }
            throw new Error('No touch canvas point');
        });
        const session = await context.newCDPSession(page);
        await session.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: point.x, y: point.y, id: 1 }],
        });
        await session.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: point.x + 30, y: point.y + 20, id: 1 }],
        });
        await session.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
        });
        await expect(viewport).toHaveAttribute('data-navigation', 'manual');
        await expect(canvas).toHaveAttribute('data-manual-settled', 'true');
        const previous = JSON.parse(
            (await canvas.getAttribute('data-manual-pose'))!,
        );
        await session.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [
                { x: point.x - 30, y: point.y, id: 1 },
                { x: point.x + 30, y: point.y, id: 2 },
            ],
        });
        await session.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [
                { x: point.x - 45, y: point.y, id: 1 },
                { x: point.x + 45, y: point.y, id: 2 },
            ],
        });
        await session.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
        });
        await expect(canvas).toHaveAttribute('data-manual-settled', 'true');
        const next = JSON.parse(
            (await canvas.getAttribute('data-manual-pose'))!,
        );
        const distance = (p: { position: number[]; target: number[] }) =>
            Math.hypot(...p.position.map((v, i) => v - p.target[i]));
        expect(distance(next)).toBeLessThan(distance(previous));
        await page
            .getByRole('button', { name: 'Control', exact: true })
            .click();
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 10000,
        });
    } finally {
        await context.close();
    }
});

for (const size of [
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 390, height: 844 },
]) {
    test(`Fase 3.3: GLB único y temas coherentes a ${size.width}×${size.height}`, async ({
        page,
    }) => {
        test.setTimeout(90_000);
        await page.setViewportSize(size);
        await page.addInitScript(() =>
            localStorage.setItem('appearance', 'dark'),
        );
        let downloads = 0;
        page.on('response', (response) => {
            if (
                response
                    .url()
                    .endsWith('/arxnet.scene.company-world/0.2.0/asset.glb')
            )
                downloads++;
        });
        await page.goto('/campus-3d');
        const viewport = page.getByTestId('campus-viewport'),
            canvas = viewport.locator('canvas');
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 30000,
        });
        await expect(canvas).toHaveAttribute('data-theme-settled', 'true');
        const initialDownloads = downloads;
        await expect(canvas).toHaveAttribute('data-performance-ready', 'true');
        const originalCanvas = await canvas.elementHandle();
        const originalFit = JSON.parse(
            (await canvas.getAttribute('data-fit'))!,
        );
        const initialPerformance = JSON.parse(
            (await canvas.getAttribute('data-performance'))!,
        );
        for (const [mode, button] of [
            ['dark', 'Oscuro'],
            ['light', 'Claro'],
        ] as const) {
            await page.getByRole('button', { name: 'Apariencia' }).click();
            await page
                .getByRole('menuitemradio', { name: button, exact: true })
                .click();
            await page.getByRole('button', { name: 'Apariencia' }).click();
            await expect(page.locator('.cc-root')).toHaveAttribute(
                'data-tone',
                mode,
            );
            await expect(canvas).toHaveAttribute('data-theme', mode);
            await expect(canvas).toHaveAttribute('data-theme-settled', 'true');
            await page
                .getByRole('button', { name: 'Control', exact: true })
                .click();
            await expect(viewport).toHaveAttribute('data-camera', 'overview');
            const point = await page.evaluate(() => {
                for (const y of [0.4, 0.5, 0.6, 0.7])
                    for (const x of [0.4, 0.5, 0.6]) {
                        const px = x * innerWidth,
                            py = y * innerHeight;
                        if (
                            document.elementFromPoint(px, py)?.tagName ===
                            'CANVAS'
                        )
                            return { x: px, y: py };
                    }
                throw new Error('No canvas point');
            });
            await page.mouse.move(point.x, point.y);
            await page.mouse.down();
            await page.mouse.move(point.x + 35, point.y + 15, { steps: 6 });
            await page.mouse.up();
            await expect(viewport).toHaveAttribute('data-navigation', 'manual');
            await page.mouse.wheel(0, -100);
            await expect(canvas).toHaveAttribute('data-manual-settled', 'true');
            for (const [id, search] of [
                ['overview', null],
                ['shared.procurement', 'Compras'],
                ['shared.warehouse', 'Almacén'],
            ] as const) {
                if (search) {
                    const field = page.getByRole('combobox');
                    await field.fill(search);
                    await field.press('Enter');
                } else
                    await page
                        .getByRole('button', { name: 'Control', exact: true })
                        .click();
                await expect(viewport).toHaveAttribute('data-camera', id, {
                    timeout: 20000,
                });
                await expect(canvas).toHaveAttribute(
                    'data-labels-settled',
                    'true',
                );
                if (id === 'shared.procurement') {
                    await setInterior(page, true);
                    await expect(canvas).toHaveAttribute(
                        'data-roof-visible',
                        'false',
                    );
                }
                await page.screenshot({
                    path: `test-results/company-world-0.2-${size.width}-${mode}-${id.replace('shared.', '')}.png`,
                });
                if (id === 'shared.procurement') {
                    await setInterior(page, false);
                    await expect(canvas).toHaveAttribute(
                        'data-roof-visible',
                        'true',
                    );
                }
            }
        }
        await page.keyboard.press('Escape');
        await expect(viewport).toHaveAttribute('data-camera', 'overview', {
            timeout: 20000,
        });
        await page.getByRole('button', { name: 'Apariencia' }).click();
        await page
            .getByRole('menuitemradio', { name: 'Oscuro', exact: true })
            .click();
        await page.getByRole('button', { name: 'Apariencia' }).click();
        await expect(canvas).toHaveAttribute('data-theme-settled', 'true');
        expect(downloads).toBe(initialDownloads);
        expect(
            await originalCanvas!.evaluate((element) => element.isConnected),
        ).toBe(true);
        const fit = JSON.parse((await canvas.getAttribute('data-fit'))!);
        expect([fit.position, fit.target]).toEqual([
            originalFit.position,
            originalFit.target,
        ]);
        const performance = JSON.parse(
            (await canvas.getAttribute('data-performance'))!,
        );
        expect(performance.programs).toBe(initialPerformance.programs);
        expect(performance.textures).toBe(initialPerformance.textures);
    });
}
