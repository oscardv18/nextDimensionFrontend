import { expect, it } from 'vitest';
import type { WebGLRenderer } from 'three';
import { cacheShadowMaps, requestShadowUpdate } from './shadow-cache';

it('solicita el mapa inicial y reutiliza su estado hasta una invalidación explícita', () => {
    const renderer = {
        shadowMap: { autoUpdate: true, needsUpdate: false },
    } as Pick<WebGLRenderer, 'shadowMap'>;
    const release = cacheShadowMaps(renderer);
    expect(renderer.shadowMap.autoUpdate).toBe(false);
    expect(renderer.shadowMap.needsUpdate).toBe(true);
    // Three limpia este indicador después del pase; la cámara no solicita otro.
    renderer.shadowMap.needsUpdate = false;
    expect(
        renderer.shadowMap.autoUpdate || renderer.shadowMap.needsUpdate,
    ).toBe(false);
    requestShadowUpdate(renderer);
    expect(renderer.shadowMap.needsUpdate).toBe(true);
    release();
    expect(renderer.shadowMap.autoUpdate).toBe(true);
});
