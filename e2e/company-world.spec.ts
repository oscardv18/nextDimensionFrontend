import { expect, test } from '@playwright/test';
const version = '0.2.0';

for (const fov of [20, 15])
    for (const theme of ['dark', 'light'])
        for (const quality of ['high', 'balanced', 'low'])
            for (const viewport of [
                { width: 1440, height: 900 },
                { width: 1920, height: 1080 },
                { width: 390, height: 844 },
            ])
                test(`D.4 ${fov}/${theme}/${quality}/${viewport.width}`, async ({
                    page,
                }, info) => {
                    await page.setViewportSize(viewport);
                    await page.addInitScript(
                        (appearance) =>
                            localStorage.setItem('appearance', appearance),
                        theme,
                    );
                    const errors: string[] = [];
                    page.on('pageerror', (error) => errors.push(error.message));
                    await page.goto(`/campus-3d?fov=${fov}&quality=${quality}`);
                    const container = page.getByTestId('campus-viewport');
                    const canvas = container.locator('canvas');
                    await expect(container).toHaveAttribute(
                        'data-camera',
                        'overview',
                        { timeout: 20000 },
                    );
                    const reports: Record<string, unknown> = {};
                    for (const [view, search] of [
                        ['overview', ''],
                        ['shared.procurement', 'Compras'],
                        ['shared.warehouse', 'Almacén'],
                    ]) {
                        if (search) {
                            await page.getByRole('combobox').fill(search);
                            await page.getByRole('combobox').press('Enter');
                            await expect(container).toHaveAttribute(
                                'data-camera',
                                view,
                            );
                        }
                        await expect(canvas).toHaveAttribute(
                            'data-theme',
                            theme,
                        );
                        await expect(canvas).toHaveAttribute(
                            'data-theme-settled',
                            'true',
                        );
                        await expect(canvas).toHaveAttribute(
                            'data-labels-settled',
                            'true',
                        );
                        const reveal = JSON.parse(
                            (await canvas.getAttribute('data-reveal'))!,
                        );
                        for (const [id, layers] of Object.entries(
                            reveal.layers,
                        ) as [
                            string,
                            {
                                roof: boolean[];
                                facadeFront: boolean[];
                                interior: boolean[];
                                outline: boolean[];
                            },
                        ][]) {
                            const selected = view === `shared.${id}`;
                            expect(layers.roof[0]).toBe(!selected);
                            expect(layers.facadeFront[0]).toBe(!selected);
                            expect(layers.outline[0]).toBe(selected);
                            if (selected) expect(layers.interior[0]).toBe(true);
                        }
                        await expect
                            .poll(() =>
                                page.evaluate(
                                    () =>
                                        document
                                            .getAnimations()
                                            .filter(
                                                (a) =>
                                                    a.playState === 'running' &&
                                                    a.effect?.getComputedTiming()
                                                        .iterations !==
                                                        Infinity,
                                            ).length,
                                ),
                            )
                            .toBe(0);
                        await page.screenshot({
                            path: info.outputPath(`${view}.png`),
                            animations: 'allow',
                        });
                        await page.evaluate(() =>
                            window.dispatchEvent(new Event('campus:benchmark')),
                        );
                        await expect(canvas).toHaveAttribute(
                            'data-benchmark-state',
                            'complete',
                            { timeout: 10000 },
                        );
                        const report = JSON.parse(
                            (await canvas.getAttribute(
                                'data-performance-probe',
                            ))!,
                        );
                        expect(report.assetId).toBe(
                            'arxnet.scene.company-world',
                        );
                        expect(report.assetVersion).toBe(version);
                        expect(report.measured.frame.samples).toBeGreaterThan(
                            0,
                        );
                        reports[view] = report;
                        if (search) {
                            await page
                                .getByRole('button', {
                                    name: 'Ver interior',
                                    exact: true,
                                })
                                .click();
                            const closed = JSON.parse(
                                (await canvas.getAttribute('data-reveal'))!,
                            );
                            expect(
                                closed.layers[view.replace('shared.', '')]
                                    .roof[0],
                            ).toBe(true);
                        }
                    }
                    await page.keyboard.press('Escape');
                    await expect(container).toHaveAttribute(
                        'data-camera',
                        'overview',
                    );
                    const restored = JSON.parse(
                        (await canvas.getAttribute('data-reveal'))!,
                    );
                    expect(
                        Object.values(restored.layers).every(
                            (layer) => (layer as { roof: boolean[] }).roof[0],
                        ),
                    ).toBe(true);
                    await info.attach('performance.json', {
                        body: JSON.stringify(reports, null, 2),
                        contentType: 'application/json',
                    });
                    expect(errors).toEqual([]);
                });

test('D.4 explora, selecciona rápidamente y regresa y recarga el mundo oficial', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/campus-3d?fov=15`);
    const container = page.getByTestId('campus-viewport');
    await expect(container).toHaveAttribute('data-camera', 'overview', {
        timeout: 20000,
    });
    const canvas = container.locator('canvas');
    const point = await page.evaluate(() => {
        for (const y of [0.45, 0.6, 0.75])
            for (const x of [0.4, 0.5, 0.6])
                if (
                    document.elementFromPoint(innerWidth * x, innerHeight * y)
                        ?.tagName === 'CANVAS'
                )
                    return { x: innerWidth * x, y: innerHeight * y };
        return null;
    });
    expect(point).not.toBeNull();
    await page.mouse.move(point!.x, point!.y);
    await page.mouse.down();
    await page.mouse.move(point!.x + 40, point!.y + 10, { steps: 6 });
    await page.mouse.up();
    await expect(container).toHaveAttribute('data-camera', 'manual');
    await page.mouse.wheel(0, -100);
    for (const department of ['Compras', 'Almacén', 'Operaciones']) {
        await page.getByRole('combobox').fill(department);
        await page.getByRole('combobox').press('Enter');
    }
    await expect(container).toHaveAttribute('data-camera', 'shared.operations');
    await expect(canvas).toHaveAttribute('data-theme-settled', 'true');
    await page.keyboard.press('Escape');
    await expect(container).toHaveAttribute('data-camera', 'overview');
    await page.goto('/campus-3d');
    await expect(container).toHaveAttribute('data-camera', 'overview', {
        timeout: 20000,
    });
    await page.evaluate(() =>
        window.dispatchEvent(new Event('campus:benchmark')),
    );
    await expect(canvas).toHaveAttribute('data-benchmark-state', 'complete', {
        timeout: 10000,
    });
    expect(
        JSON.parse((await canvas.getAttribute('data-performance-probe'))!)
            .assetId,
    ).toBe('arxnet.scene.company-world');
});
