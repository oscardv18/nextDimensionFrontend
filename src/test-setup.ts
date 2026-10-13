import '@testing-library/jest-dom/vitest';

// jsdom no implementa matchMedia; el módulo de apariencia lo consulta al importarse.
if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
        ({
            matches: false,
            media: query,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
        }) as unknown as MediaQueryList;
}

// jsdom no decodifica PNG del GLB. Solo se simula la carga de imagen:
// GLTFLoader sigue interpretando geometría, jerarquía, materiales y atributos reales.
import { Texture, TextureLoader } from 'three';
if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:test-texture';
if (!URL.revokeObjectURL) URL.revokeObjectURL = () => undefined;
TextureLoader.prototype.load = function (_url, onLoad) {
    const texture = new Texture();
    queueMicrotask(() => onLoad?.(texture));
    return texture;
};
