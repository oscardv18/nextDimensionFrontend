import { afterEach, describe, expect, it, vi } from 'vitest';
import { Box3, PerspectiveCamera, Vector2, Vector3 } from 'three';
import {
    ManualNavigation,
    constrainManualPose,
    groundPoint,
    navigationLimits,
    translateGround,
    wheelFactor,
    zoomGround,
} from './manual-navigation';

const bounds = new Box3(new Vector3(-50, 0, -40), new Vector3(50, 11, 40));
const limits = navigationLimits(bounds);
function setup() {
    const camera = new PerspectiveCamera(45, 1.6, 0.1, 1500);
    const pose = {
        position: new Vector3(-80, 65, 80),
        target: new Vector3(0, 0, 0),
    };
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld();
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 500,
        right: 800,
        bottom: 500,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    });
    const begin = vi.fn(() => pose),
        change = vi.fn();
    const input = new ManualNavigation(canvas, camera, bounds, begin, change);
    return { camera, pose, canvas, begin, change, input };
}
function pointer(
    canvas: HTMLCanvasElement,
    type: string,
    x: number,
    y: number,
    id = 1,
    touch = false,
) {
    const event = new MouseEvent(type, {
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        button: 0,
    });
    Object.defineProperties(event, {
        pointerId: { value: id },
        pointerType: { value: touch ? 'touch' : 'mouse' },
    });
    canvas.dispatchEvent(event);
}
afterEach(() => vi.restoreAllMocks());
describe('matemática de exploración', () => {
    it('desplaza sobre XZ, conserva orientación y aplica límites derivados de la geometría', () => {
        const { input, pose } = setup();
        const direction = pose.position.clone().sub(pose.target);
        translateGround(pose, new Vector3(10000, 10000, -10000), limits);
        expect(pose.target.x).toBe(limits.maxX);
        expect(pose.target.z).toBe(limits.minZ);
        expect(pose.target.y).toBe(0);
        expect(pose.position.y).toBe(65);
        expect(pose.position.clone().sub(pose.target).toArray()).toEqual(
            direction.toArray(),
        );
        input.dispose();
    });
    for (const point of [
        new Vector2(0, 0),
        new Vector2(-0.7, 0.3),
        new Vector2(0.7, -0.3),
    ]) {
        it(`zoom mantiene bajo el cursor el punto del plano ${point.toArray()}`, () => {
            const { camera, pose, input } = setup();
            const anchor = groundPoint(camera, point, limits.floor)!;
            const direction = pose.position
                .clone()
                .sub(pose.target)
                .normalize();
            zoomGround(pose, camera, point, 0.85, limits);
            camera.position.copy(pose.position);
            camera.lookAt(pose.target);
            expect(
                groundPoint(camera, point, limits.floor)!.distanceTo(anchor),
            ).toBeLessThan(1e-8);
            expect(
                pose.position
                    .clone()
                    .sub(pose.target)
                    .normalize()
                    .distanceTo(direction),
            ).toBeLessThan(1e-10);
            input.dispose();
        });
    }
    it('limita acercamiento, alejamiento y altura segura, incluso tras velocidad residual', () => {
        const { camera, pose, input } = setup();
        zoomGround(pose, camera, new Vector2(), 0.00001, limits);
        expect(pose.position.y).toBeGreaterThanOrEqual(limits.minHeight);
        pose.position.y = limits.minHeight - 1;
        constrainManualPose(pose, limits, camera.near);
        expect(pose.position.y).toBeGreaterThanOrEqual(limits.minHeight);
        zoomGround(pose, camera, new Vector2(), 100000, limits);
        expect(pose.position.distanceTo(pose.target)).toBeLessThanOrEqual(
            limits.maxDistance + 1e-8,
        );
        input.dispose();
    });
    it('normaliza rueda en píxeles/líneas/páginas y acota eventos extremos', () => {
        expect(wheelFactor(16, 0, 500)).toBe(wheelFactor(1, 1, 500));
        expect(wheelFactor(500, 0, 500)).toBe(wheelFactor(1, 2, 500));
        expect(wheelFactor(1e9, 0, 500)).toBeLessThan(1.3);
    });
    it('resuelve horizonte sin desplazamientos no finitos', () => {
        const { camera, pose, input } = setup();
        camera.lookAt(new Vector3(0, 200, 0));
        expect(groundPoint(camera, new Vector2(), 0)).toBeNull();
        zoomGround(pose, camera, new Vector2(), 0.8, limits);
        expect(pose.position.toArray().every(Number.isFinite)).toBe(true);
        input.dispose();
    });
});
describe('entradas y arbitraje de selección', () => {
    it('un clic y movimientos menores que 6 px no desplazan ni bloquean selección', () => {
        const { canvas, input, begin } = setup();
        const click = vi.fn();
        canvas.addEventListener('click', click);
        pointer(canvas, 'pointerdown', 300, 250);
        pointer(canvas, 'pointermove', 303, 252);
        pointer(canvas, 'pointerup', 303, 252);
        canvas.dispatchEvent(
            new MouseEvent('click', { detail: 1, bubbles: true }),
        );
        expect(begin).not.toHaveBeenCalled();
        expect(click).toHaveBeenCalledOnce();
        input.dispose();
    });
    it('un arrastre de ida y vuelta no se convierte en clic, aunque termine en el punto inicial', () => {
        const { canvas, input, begin } = setup();
        const click = vi.fn();
        canvas.addEventListener('click', click);
        pointer(canvas, 'pointerdown', 300, 250);
        pointer(canvas, 'pointermove', 400, 250);
        pointer(canvas, 'pointermove', 300, 250);
        pointer(canvas, 'pointerup', 300, 250);
        canvas.dispatchEvent(
            new MouseEvent('click', {
                detail: 1,
                bubbles: true,
                cancelable: true,
            }),
        );
        expect(begin).toHaveBeenCalled();
        expect(click).not.toHaveBeenCalled();
        pointer(canvas, 'pointerdown', 300, 250);
        pointer(canvas, 'pointerup', 300, 250);
        canvas.dispatchEvent(
            new MouseEvent('click', { detail: 1, bubbles: true }),
        );
        expect(click).toHaveBeenCalledOnce();
        input.dispose();
    });
    it('dos dedos desplazan y hacen pinch sin seleccionar; cancelar corta la entrada pendiente', () => {
        const { canvas, input, pose, change } = setup();
        const distance = pose.position.distanceTo(pose.target);
        pointer(canvas, 'pointerdown', 300, 250, 1, true);
        pointer(canvas, 'pointerdown', 500, 250, 2, true);
        pointer(canvas, 'pointermove', 550, 250, 2, true);
        expect(pose.position.distanceTo(pose.target)).toBeLessThan(distance);
        expect(change).toHaveBeenCalled();
        input.cancelAll();
        change.mockClear();
        pointer(canvas, 'pointermove', 600, 250, 2, true);
        expect(change).not.toHaveBeenCalled();
        expect(input.isClickSuppressed()).toBe(true);
        input.dispose();
    });
    it('rueda cancela scroll solo sobre canvas y dispose retira eventos', () => {
        const { canvas, input, change } = setup();
        const html = document.createElement('div');
        const wheel = new WheelEvent('wheel', {
            deltaY: -120,
            clientX: 400,
            clientY: 250,
            cancelable: true,
        });
        canvas.dispatchEvent(wheel);
        expect(wheel.defaultPrevented).toBe(true);
        expect(change).toHaveBeenCalledOnce();
        const other = new WheelEvent('wheel', {
            deltaY: 120,
            cancelable: true,
        });
        html.dispatchEvent(other);
        expect(other.defaultPrevented).toBe(false);
        input.dispose();
        change.mockClear();
        canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }));
        expect(change).not.toHaveBeenCalled();
    });
});
