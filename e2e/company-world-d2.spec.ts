import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function settled(page: Page) {
    const canvas = page.getByTestId('campus-viewport').locator('canvas');
    await expect(canvas).toHaveAttribute('data-theme-settled', 'true');
    await expect(canvas).toHaveAttribute('data-labels-settled', 'true');
    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    document
                        .getAnimations()
                        .filter(
                            (a) =>
                                a.playState === 'running' &&
                                a.effect?.getComputedTiming().iterations !==
                                    Infinity,
                        ).length,
            ),
        )
        .toBe(0);
}

for (const theme of ['dark', 'light'])
    for (const quality of ['high', 'balanced', 'low'])
        test(`D.4 capas/interiores ${theme}/${quality}`, async ({
            page,
        }, info) => {
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.addInitScript(
                (theme) => localStorage.setItem('appearance', theme),
                theme,
            );
            await page.goto(`/campus-3d?quality=${quality}`);
            const viewport = page.getByTestId('campus-viewport'),
                canvas = viewport.locator('canvas');
            await expect(viewport).toHaveAttribute('data-camera', 'overview', {
                timeout: 20000,
            });
            await settled(page);
            await page.screenshot({ path: info.outputPath('overview.png') });
            for (const [id, name] of [
                ['procurement', 'Compras'],
                ['warehouse', 'Almacén'],
            ]) {
                await page.getByRole('combobox').fill(name);
                await page.getByRole('combobox').press('Enter');
                await expect(viewport).toHaveAttribute(
                    'data-camera',
                    `shared.${id}`,
                );
                await settled(page);
                const open = JSON.parse(
                    (await canvas.getAttribute('data-reveal'))!,
                );
                expect(open.layers[id].roof[0]).toBe(false);
                expect(open.layers[id].facadeFront[0]).toBe(false);
                expect(open.layers[id].interior[0]).toBe(true);
                if (id === 'procurement')
                    expect(
                        await page.locator('.cc-hotspot').count(),
                    ).toBeGreaterThan(0);
                await page.screenshot({
                    path: info.outputPath(`${id}-open.png`),
                });
                await page
                    .getByRole('button', { name: 'Ver interior', exact: true })
                    .click();
                await settled(page);
                const closed = JSON.parse(
                    (await canvas.getAttribute('data-reveal'))!,
                );
                expect(closed.layers[id].roof[0]).toBe(true);
                expect(closed.layers[id].facadeFront[0]).toBe(true);
                await page.screenshot({
                    path: info.outputPath(`${id}-closed.png`),
                });
            }
            await page.keyboard.press('Escape');
            await expect(viewport).toHaveAttribute('data-camera', 'overview');
            const restored = JSON.parse(
                (await canvas.getAttribute('data-reveal'))!,
            );
            expect(
                Object.values(restored.layers).every(
                    (layer) => (layer as { roof: boolean[] }).roof[0],
                ),
            ).toBe(true);
        });
