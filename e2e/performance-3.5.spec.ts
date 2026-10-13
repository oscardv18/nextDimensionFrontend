import { expect, test } from '@playwright/test';

// Comparaciones opt-in: no sustituyen ni relajan los plazos de la suite funcional.
for (const quality of ['high', 'balanced', 'low'])
    for (const theme of ['dark', 'light'])
        for (const shadows of ['on', 'off']) {
            test(`Fase 3.5: ${quality}, ${theme}, sombras ${shadows}`, async ({
                page,
            }, testInfo) => {
                await page.setViewportSize({ width: 1440, height: 900 });
                await page.addInitScript(
                    (appearance) =>
                        localStorage.setItem('appearance', appearance),
                    theme,
                );
                const errors: string[] = [];
                page.on('pageerror', (error) => errors.push(error.message));
                await page.goto(
                    `/campus-3d?quality=${quality}&shadows=${shadows}`,
                );
                const viewport = page.getByTestId('campus-viewport'),
                    canvas = viewport.locator('canvas');
                await expect(viewport).toHaveAttribute(
                    'data-camera',
                    'overview',
                    { timeout: 20000 },
                );
                const results: Record<string, unknown> = {};
                for (const view of ['overview', 'shared.procurement']) {
                    if (view !== 'overview') {
                        const search = page.getByRole('combobox');
                        await search.fill('Compras');
                        await search.press('Enter');
                        await expect(viewport).toHaveAttribute(
                            'data-camera',
                            view,
                            { timeout: 10000 },
                        );
                    }
                    await page.evaluate(() =>
                        window.dispatchEvent(new Event('campus:benchmark')),
                    );
                    await expect(canvas).toHaveAttribute(
                        'data-benchmark-state',
                        'complete',
                        { timeout: 10000 },
                    );
                    const report = JSON.parse(
                        (await canvas.getAttribute('data-performance-probe'))!,
                    );
                    expect(report.measured.frame.samples).toBeGreaterThan(0);
                    expect(report.quality.name).toBe(quality);
                    expect(report.measured.shadowPasses).toBe(0);
                    results[view] = report;
                }
                await testInfo.attach('measured-performance.json', {
                    body: JSON.stringify(results, null, 2),
                    contentType: 'application/json',
                });
                expect(errors).toEqual([]);
            });
        }

test('Fase 3.5: interrupción rápida, cubierta y contexto perdido conservan una salida accesible', async ({
    page,
}) => {
    await page.goto('/campus-3d');
    const viewport = page.getByTestId('campus-viewport'),
        canvas = viewport.locator('canvas');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 20000,
    });
    const search = page.getByRole('combobox');
    for (const name of ['Ventas', 'Almacén', 'Compras']) {
        await search.fill(name);
        await search.press('Enter');
    }
    await expect(viewport).toHaveAttribute(
        'data-camera',
        'shared.procurement',
        { timeout: 10000 },
    );
    await page.getByRole('button', { name: 'Ver interior' }).click();
    await expect(canvas).toHaveAttribute('data-roof-visible', 'false');
    await page.getByRole('button', { name: 'Ver interior' }).click();
    await expect(canvas).toHaveAttribute('data-roof-visible', 'true');
    await page.keyboard.press('Escape');
    await expect(viewport).toHaveAttribute('data-camera', 'overview', {
        timeout: 10000,
    });
    await canvas.evaluate((element) =>
        element.dispatchEvent(
            new Event('webglcontextlost', { cancelable: true }),
        ),
    );
    await expect(viewport).toHaveAttribute('data-mode', 'fallback');
    await search.fill('Compras');
    await search.press('Enter');
    await expect(page.getByTestId('campus-selection')).toHaveText('Compras');
});
