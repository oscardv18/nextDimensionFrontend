import type { WebGLRenderer } from 'three';

/** Invalida el mapa por cambios del mundo, sin relacionarlo con movimientos de cámara. */
export function requestShadowUpdate(
    renderer: Pick<WebGLRenderer, 'shadowMap'>,
) {
    if (renderer.shadowMap) renderer.shadowMap.needsUpdate = true;
}

export function cacheShadowMaps(renderer: Pick<WebGLRenderer, 'shadowMap'>) {
    const previous = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    requestShadowUpdate(renderer);
    return () => {
        renderer.shadowMap.autoUpdate = previous;
        requestShadowUpdate(renderer);
    };
}
