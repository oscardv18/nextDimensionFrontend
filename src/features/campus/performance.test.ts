import { expect, it } from 'vitest';
import { FrameSamples } from './performance-probe';
import { graphicsOptions } from './graphics-quality';

it('calcula cadencia real y percentiles sin inventar una GPU ni FPS de reposo', () => {
    const samples = new FrameSamples();
    expect(samples.summary().fps).toBeNull();
    for (const value of [500, 500, 1000, NaN, 0]) samples.add(value);
    expect(samples.summary()).toEqual({
        samples: 3,
        fps: 1.5,
        meanMs: 2000 / 3,
        p50Ms: 500,
        p95Ms: 1000,
        maxMs: 1000,
    });
    for (let i = 0; i < 200; i++) samples.add(10);
    expect(samples.summary().samples).toBe(120);
    expect(samples.summary().fps).toBe(100);
});
it('los perfiles son opt-in de desarrollo y conservan la configuración alta en producción', () => {
    const search =
        '?quality=low&shadows=off&interiorLights=off&transparency=off&blur=off';
    const production = graphicsOptions(search, false);
    expect(production.name).toBe('high');
    expect(production.shadowSize).toBe(2048);
    expect(
        production.shadows &&
            production.interiorLights &&
            production.transparency &&
            production.blur,
    ).toBe(true);
    const low = graphicsOptions(search, true);
    expect(low.shadowSize).toBe(512);
    expect(low.maxDpr).toBe(1);
    expect(
        low.shadows || low.interiorLights || low.transparency || low.blur,
    ).toBe(false);
    expect(graphicsOptions('?quality=balanced', true).shadowSize).toBe(1024);
    expect(graphicsOptions('?quality=invalid', true).name).toBe('high');
});
