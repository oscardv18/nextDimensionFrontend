import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PerspectiveCamera } from 'three';
import type { ReactNode } from 'react';
import { AdaptiveLabels } from './adaptive-labels';
import type { SpatialEntry } from './adaptive-labels';

const runtime = vi.hoisted(() => ({
    frame: (_: unknown, delta: number) => {
        void delta;
    },
    invalidate: vi.fn(),
    canvas: undefined as HTMLCanvasElement | undefined,
    camera: undefined as PerspectiveCamera | undefined,
}));
vi.mock('@react-three/fiber', () => ({
    useThree: () => ({
        camera: runtime.camera,
        size: { width: 400, height: 400 },
        invalidate: runtime.invalidate,
        gl: { domElement: runtime.canvas },
    }),
    useFrame: (callback: typeof runtime.frame) => {
        runtime.frame = callback;
    },
}));
vi.mock('@react-three/drei', () => ({
    Html: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
beforeEach(() => {
    vi.stubGlobal(
        'ResizeObserver',
        class {
            observe() {}
            unobserve() {}
            disconnect() {}
        },
    );
    runtime.camera = new PerspectiveCamera(45, 1, 0.1, 100);
    runtime.camera.position.z = 10;
    runtime.camera.updateMatrixWorld();
    runtime.canvas = document.createElement('canvas');
    runtime.invalidate.mockClear();
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(120);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
        function (this: HTMLElement) {
            return this.classList.contains('cc-tag-card') ? 46 : 64;
        },
    );
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
const entry = (id: string, onSelect = vi.fn()): SpatialEntry => ({
    id,
    position: [0, 0, 0],
    content: (
        <span className="cc-tag">
            <span className="cc-tag-card">{id}</span>
        </span>
    ),
    label: `Enfocar ${id}`,
    onSelect,
});
it('prioriza Compras, excluye las etiquetas secundarias del teclado y conserva selección con Enter', async () => {
    const select = vi.fn();
    render(
        <AdaptiveLabels
            entries={[
                { ...entry('Compras', select), selected: true },
                { ...entry('Ventas'), secondary: true },
            ]}
            regions={[]}
            reducedMotion
        />,
    );
    runtime.frame({}, 1 / 60);
    const button = screen.getByRole('button', { name: 'Enfocar Compras' });
    expect(button.tabIndex).toBe(0);
    expect(screen.queryByRole('button', { name: 'Enfocar Ventas' })).toBeNull();
    const hidden = document.querySelector<HTMLButtonElement>(
        '[data-department="Ventas"]',
    )!;
    expect(hidden.tabIndex).toBe(-1);
    button.focus();
    await userEvent.setup().keyboard('{Enter}');
    expect(select).toHaveBeenCalledOnce();
});
it('desplaza la tarjeta fuera del panel, dibuja conexión y no sigue invalidando en reposo', () => {
    render(
        <AdaptiveLabels
            entries={[{ ...entry('Compras'), selected: true }]}
            regions={[
                {
                    left: 210,
                    top: 100,
                    right: 400,
                    bottom: 300,
                    width: 190,
                    height: 200,
                },
            ]}
            reducedMotion={false}
        />,
    );
    for (let frame = 0; frame < 100; frame++) runtime.frame({}, 1 / 60);
    const button = screen.getByRole('button', { name: 'Enfocar Compras' });
    expect(button.style.transform).not.toBe('translate(0px, 0px)');
    expect(button.querySelector('line')).toHaveStyle({ opacity: '1' });
    expect(runtime.canvas?.dataset.labelsSettled).toBe('true');
    runtime.invalidate.mockClear();
    for (let frame = 0; frame < 10; frame++) runtime.frame({}, 1 / 60);
    expect(runtime.invalidate).not.toHaveBeenCalled();
});
it('oculta una tarjeta bloqueada y la restaura al cerrar el panel', () => {
    const entries = [entry('Compras')];
    const { rerender } = render(
        <AdaptiveLabels
            entries={entries}
            regions={[
                {
                    left: 0,
                    top: 0,
                    right: 400,
                    bottom: 400,
                    width: 400,
                    height: 400,
                },
            ]}
            reducedMotion
        />,
    );
    runtime.frame({}, 1 / 60);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<AdaptiveLabels entries={entries} regions={[]} reducedMotion />);
    runtime.frame({}, 1 / 60);
    expect(screen.getByRole('button')).toHaveAttribute('aria-hidden', 'false');
});
