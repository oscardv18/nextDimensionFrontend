/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { resolveCampus } from './asset';
import type { Campus } from './asset';
import CampusScene from './campus-scene';
import { cameraPose } from './camera-framing';
const runtime = vi.hoisted(() => ({
    frame: (_: unknown, delta: number) => {
        void delta;
    },
    camera: undefined as PerspectiveCamera | undefined,
    canvas: undefined as HTMLCanvasElement | undefined,
    invalidate: vi.fn(),
}));
vi.mock('@react-three/fiber', () => ({
    useFrame: (callback: typeof runtime.frame) => {
        runtime.frame = callback;
    },
    useThree: () => ({
        camera: runtime.camera,
        size: { width: 1440, height: 900 },
        gl: {
            domElement: runtime.canvas,
            info: { render: { calls: 0, triangles: 0 } },
        },
        invalidate: runtime.invalidate,
    }),
}));
vi.mock('@react-three/drei', async () => {
    const React = await import('react');
    return {
        OrbitControls: React.forwardRef(function Controls(_, ref) {
            const target = React.useRef(new Vector3());
            React.useImperativeHandle(ref, () => ({
                target: target.current,
                update: () => {
                    runtime.camera!.lookAt(target.current);
                },
            }));
            return null;
        }),
    };
});
vi.mock('./campus-theme-rig', () => ({ CampusThemeRig: () => null }));
vi.mock('./adaptive-labels', () => ({ AdaptiveLabels: () => null }));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));
let campus: Campus;
beforeAll(async () => {
    const file = readFileSync(
        'public/assets/arxnet.scene.company-world/0.2.0/asset.glb',
    );
    const bytes = new ArrayBuffer(file.byteLength);
    new Uint8Array(bytes).set(file);
    campus = resolveCampus(
        (await new GLTFLoader().parseAsync(bytes, '')).scene,
    );
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});
function setup() {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    runtime.camera = new PerspectiveCamera(45, 1440 / 900, 0.1, 1500);
    runtime.canvas = document.createElement('canvas');
    vi.spyOn(runtime.canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 1440,
        height: 900,
        right: 1440,
        bottom: 900,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    });
    // DOM de prueba para el controlador; no es un renderer WebGL. React avisa por etiquetas Three.
    const logError = console.error;
    vi.spyOn(console, 'error').mockImplementation((message, ...args) => {
        if (
            typeof message === 'string' &&
            (message.includes('is unrecognized in this browser') ||
                message.includes('is using incorrect casing') ||
                message.includes('React does not recognize'))
        )
            return;
        logError(message, ...args);
    });
    const props = {
        campus,
        theme: 'dark' as const,
        selected: null as string | null,
        roofHidden: false,
        revision: 0,
        reservePanel: false,
        insets: { top: 64, right: 0, bottom: 90, left: 70 },
        regions: [],
        debugOrbit: false,
        reducedMotion: false,
        onSelect: vi.fn(),
        onSettled: vi.fn(),
        onMoving: vi.fn(),
        onContextLost: vi.fn(),
    };
    const view = render(<CampusScene {...props} />);
    const frames = (count = 240, delta = 1 / 60) =>
        act(() => {
            for (let i = 0; i < count; i++) {
                now += delta * 1000;
                runtime.frame({}, delta);
            }
        });
    frames();
    return {
        props,
        view,
        frames,
        camera: runtime.camera,
        canvas: runtime.canvas,
    };
}
it('explora, enfoca desde la posición manual y retorna al encuadre inicial exacto', () => {
    const { props, view, frames, camera, canvas } = setup();
    const initial = camera.position.clone();
    act(() =>
        canvas.dispatchEvent(
            new WheelEvent('wheel', {
                deltaY: -120,
                clientX: 500,
                clientY: 450,
                cancelable: true,
            }),
        ),
    );
    frames();
    expect(props.onMoving).toHaveBeenLastCalledWith(true);
    expect(camera.position.distanceTo(initial)).toBeGreaterThan(1);
    view.rerender(
        <CampusScene {...props} selected="shared.procurement" revision={1} />,
    );
    frames();
    const focus = cameraPose(
        campus,
        'shared.procurement',
        camera,
        camera.aspect,
        { width: 1440, height: 900 },
        props.insets,
    );
    expect(camera.position.distanceTo(focus.position)).toBeLessThan(1e-8);
    view.rerender(<CampusScene {...props} revision={2} />);
    frames();
    expect(camera.position.toArray()).toEqual(initial.toArray());
    expect(props.onSettled).toHaveBeenLastCalledWith(null, 2);
});
it('la última orden rápida gana y el movimiento reducido aplica el objetivo en un fotograma', () => {
    const { props, view, frames, camera, canvas } = setup();
    act(() =>
        canvas.dispatchEvent(
            new WheelEvent('wheel', {
                deltaY: 100,
                clientX: 1000,
                clientY: 600,
                cancelable: true,
            }),
        ),
    );
    frames(2);
    view.rerender(
        <CampusScene {...props} selected="shared.sales" revision={1} />,
    );
    frames(3);
    view.rerender(
        <CampusScene
            {...props}
            selected="shared.procurement"
            revision={2}
            reducedMotion
        />,
    );
    frames(1);
    expect(props.onSettled).toHaveBeenLastCalledWith('shared.procurement', 2);
    const pose = cameraPose(
        campus,
        'shared.procurement',
        camera,
        camera.aspect,
        { width: 1440, height: 900 },
        props.insets,
    );
    expect(camera.position.toArray()).toEqual(pose.position.toArray());
});
it('cambios del panel conservan la exploración; la escena descansa al converger', () => {
    const { props, view, frames, camera, canvas } = setup();
    act(() =>
        canvas.dispatchEvent(
            new WheelEvent('wheel', {
                deltaY: -120,
                clientX: 500,
                clientY: 450,
                cancelable: true,
            }),
        ),
    );
    frames();
    const manual = camera.position.clone();
    view.rerender(
        <CampusScene {...props} insets={{ ...props.insets, right: 440 }} />,
    );
    frames();
    expect(camera.position.toArray()).toEqual(manual.toArray());
    runtime.invalidate.mockClear();
    frames(10);
    expect(runtime.invalidate).not.toHaveBeenCalled();
    expect(canvas.dataset.manualSettled).toBe('true');
});

it('enfoca y retorna a 2 FPS sin multiplicar la duración por el número de frames', () => {
    const { props, view, frames, camera } = setup();
    const initial = camera.position.clone();
    view.rerender(
        <CampusScene {...props} selected="shared.procurement" revision={1} />,
    );
    frames(2, 0.5);
    expect(props.onSettled).not.toHaveBeenLastCalledWith(
        'shared.procurement',
        1,
    );
    frames(1, 0.5);
    expect(props.onSettled).toHaveBeenLastCalledWith('shared.procurement', 1);
    view.rerender(<CampusScene {...props} revision={2} />);
    frames(3, 0.5);
    expect(camera.position.toArray()).toEqual(initial.toArray());
    expect(props.onSettled).toHaveBeenLastCalledWith(null, 2);
});
