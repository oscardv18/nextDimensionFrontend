import { MathUtils, Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { Box3, PerspectiveCamera } from 'three';

export const manualNavigationConfig = {
    dragThreshold: 6,
    panAllowance: 0.25,
    minDistanceRatio: 0.12,
    maxDistanceRatio: 6,
    clearanceRatio: 0.012,
    wheelSensitivity: 0.0015,
};
export type ManualPose = { position: Vector3; target: Vector3 };
export function navigationLimits(
    bounds: Box3,
    config = manualNavigationConfig,
) {
    const size = bounds.getSize(new Vector3());
    const diagonal = size.length();
    return {
        minX: bounds.min.x - size.x * config.panAllowance,
        maxX: bounds.max.x + size.x * config.panAllowance,
        minZ: bounds.min.z - size.z * config.panAllowance,
        maxZ: bounds.max.z + size.z * config.panAllowance,
        floor: bounds.min.y,
        minHeight: bounds.max.y + diagonal * config.clearanceRatio,
        minDistance: diagonal * config.minDistanceRatio,
        maxDistance: diagonal * config.maxDistanceRatio,
    };
}
export type NavigationLimits = ReturnType<typeof navigationLimits>;
export function translateGround(
    pose: ManualPose,
    offset: Vector3,
    limits: NavigationLimits,
) {
    const x =
        MathUtils.clamp(pose.target.x + offset.x, limits.minX, limits.maxX) -
        pose.target.x;
    const z =
        MathUtils.clamp(pose.target.z + offset.z, limits.minZ, limits.maxZ) -
        pose.target.z;
    pose.position.x += x;
    pose.target.x += x;
    pose.position.z += z;
    pose.target.z += z;
}
export function constrainManualPose(
    pose: ManualPose,
    limits: NavigationLimits,
    near: number,
) {
    const previous = pose.position.clone();
    translateGround(pose, new Vector3(), limits);
    const backward = pose.position.clone().sub(pose.target);
    const distance = backward.length();
    backward.normalize();
    const minimum = Math.max(
        limits.minDistance,
        (limits.minHeight + near - pose.target.y) / Math.max(0.01, backward.y),
    );
    const next = MathUtils.clamp(
        distance,
        minimum,
        Math.max(minimum, limits.maxDistance),
    );
    if (next !== distance)
        pose.position.copy(pose.target).addScaledVector(backward, next);
    return pose.position.distanceToSquared(previous) > 1e-12;
}

export function groundPoint(
    camera: PerspectiveCamera,
    point: Vector2,
    floor: number,
) {
    camera.updateMatrixWorld();
    const ray = new Raycaster();
    ray.setFromCamera(point, camera);
    if (ray.ray.direction.y >= -1e-5) return null;
    return ray.ray.intersectPlane(
        new Plane(new Vector3(0, 1, 0), -floor),
        new Vector3(),
    );
}
export function zoomGround(
    pose: ManualPose,
    camera: PerspectiveCamera,
    cursor: Vector2,
    factor: number,
    limits: NavigationLimits,
) {
    // Cámara de cálculo solamente: la única cámara renderizada sigue siendo la de Fiber.
    const projection = camera.clone();
    projection.position.copy(pose.position);
    projection.lookAt(pose.target);
    const anchor = groundPoint(projection, cursor, limits.floor);
    const backward = pose.position.clone().sub(pose.target);
    const distance = backward.length();
    backward.normalize();
    const minimum = Math.max(
        limits.minDistance,
        (limits.minHeight + camera.near - pose.target.y) /
            Math.max(0.01, backward.y),
    );
    const next = MathUtils.clamp(
        distance * factor,
        minimum,
        Math.max(minimum, limits.maxDistance),
    );
    pose.position.copy(pose.target).addScaledVector(backward, next);
    projection.position.copy(pose.position);
    projection.lookAt(pose.target);
    const after = groundPoint(projection, cursor, limits.floor);
    if (anchor && after) translateGround(pose, anchor.sub(after), limits);
}
export function wheelFactor(delta: number, mode: number, height: number) {
    const pixels = delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
    return Math.exp(
        MathUtils.clamp(pixels, -160, 160) *
            manualNavigationConfig.wheelSensitivity,
    );
}

type Pointer = { x: number; y: number; startX: number; startY: number };
/** Adapta entradas del canvas a objetivos del controlador existente; no renderiza ni anima cámaras. */
export class ManualNavigation {
    private pointers = new Map<number, Pointer>();
    private dragging = false;
    private suppress = false;
    private started = false;
    private limits: NavigationLimits;
    private canvas: HTMLCanvasElement;
    private camera: PerspectiveCamera;
    private begin: () => ManualPose | null;
    private change: () => void;
    constructor(
        canvas: HTMLCanvasElement,
        camera: PerspectiveCamera,
        bounds: Box3,
        begin: () => ManualPose | null,
        change: () => void,
    ) {
        this.canvas = canvas;
        this.camera = camera;
        this.begin = begin;
        this.change = change;
        this.limits = navigationLimits(bounds);
        canvas.addEventListener('pointerdown', this.down, true);
        canvas.addEventListener('pointermove', this.move, true);
        canvas.addEventListener('pointerup', this.up, true);
        canvas.addEventListener('pointercancel', this.cancel, true);
        canvas.addEventListener('lostpointercapture', this.cancel, true);
        canvas.addEventListener('click', this.click, true);
        canvas.addEventListener('wheel', this.wheel, {
            passive: false,
            capture: true,
        });
        window.addEventListener('blur', this.cancelAll);
    }
    isClickSuppressed = () => this.suppress;
    private ndc(x: number, y: number) {
        const rect = this.canvas.getBoundingClientRect();
        return new Vector2(
            ((x - rect.left) / rect.width) * 2 - 1,
            1 - ((y - rect.top) / rect.height) * 2,
        );
    }
    private takeOver() {
        this.started = true;
        this.suppress = true;
        this.dragging = true;
        return this.begin();
    }
    private down = (event: PointerEvent) => {
        if (event.pointerType !== 'touch' && event.button !== 0) return;
        if (!this.pointers.size) {
            this.suppress = false;
            this.started = false;
        }
        this.pointers.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
            startX: event.clientX,
            startY: event.clientY,
        });
        this.canvas.setPointerCapture?.(event.pointerId);
        if (this.pointers.size > 1) this.takeOver();
    };
    private move = (event: PointerEvent) => {
        const pointer = this.pointers.get(event.pointerId);
        if (!pointer) return;
        const before = [...this.pointers.values()]
            .slice(0, 2)
            .map((p) => ({ ...p }));
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        const moved = Math.hypot(
            pointer.x - pointer.startX,
            pointer.y - pointer.startY,
        );
        if (!this.dragging && moved <= manualNavigationConfig.dragThreshold)
            return;
        const pose = this.started ? this.begin() : this.takeOver();
        if (!pose) return;
        event.preventDefault();
        const after = [...this.pointers.values()].slice(0, 2);
        const midpoint = (points: Pointer[]) => ({
            x: points.reduce((s, p) => s + p.x, 0) / points.length,
            y: points.reduce((s, p) => s + p.y, 0) / points.length,
        });
        const old = midpoint(before),
            next = midpoint(after);
        // Usa el último fotograma visible: el plano permanece horizontal y no cambia la orientación.
        const from = groundPoint(
            this.camera,
            this.ndc(old.x, old.y),
            this.limits.floor,
        );
        const to = groundPoint(
            this.camera,
            this.ndc(next.x, next.y),
            this.limits.floor,
        );
        if (from && to) translateGround(pose, from.sub(to), this.limits);
        if (after.length === 2) {
            const distance = (points: Pointer[]) =>
                Math.hypot(
                    points[0].x - points[1].x,
                    points[0].y - points[1].y,
                );
            const a = distance(before),
                b = distance(after);
            if (a > 2 && b > 2)
                zoomGround(
                    pose,
                    this.camera,
                    this.ndc(next.x, next.y),
                    MathUtils.clamp(a / b, 0.8, 1.25),
                    this.limits,
                );
        }
        this.change();
    };
    private up = (event: PointerEvent) => {
        this.pointers.delete(event.pointerId);
        if (this.canvas.hasPointerCapture?.(event.pointerId))
            this.canvas.releasePointerCapture(event.pointerId);
        if (!this.pointers.size) this.dragging = false;
    };
    private cancel = (event: PointerEvent) => {
        if (this.pointers.has(event.pointerId)) this.cancelAll();
    };
    private click = (event: MouseEvent) => {
        if (!this.suppress || event.detail === 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    };
    private wheel = (event: WheelEvent) => {
        event.preventDefault();
        if (!event.deltaY) return;
        const pose = this.begin();
        if (!pose) return;
        zoomGround(
            pose,
            this.camera,
            this.ndc(event.clientX, event.clientY),
            wheelFactor(
                event.deltaY,
                event.deltaMode,
                this.canvas.clientHeight,
            ),
            this.limits,
        );
        this.change();
    };
    cancelAll = () => {
        const ids = [...this.pointers.keys()];
        if (ids.length) this.suppress = true;
        this.pointers.clear();
        this.dragging = false;
        this.started = false;
        for (const id of ids)
            if (this.canvas.hasPointerCapture?.(id))
                this.canvas.releasePointerCapture(id);
    };
    dispose() {
        this.cancelAll();
        this.canvas.removeEventListener('pointerdown', this.down, true);
        this.canvas.removeEventListener('pointermove', this.move, true);
        this.canvas.removeEventListener('pointerup', this.up, true);
        this.canvas.removeEventListener('pointercancel', this.cancel, true);
        this.canvas.removeEventListener(
            'lostpointercapture',
            this.cancel,
            true,
        );
        this.canvas.removeEventListener('click', this.click, true);
        this.canvas.removeEventListener('wheel', this.wheel, true);
        window.removeEventListener('blur', this.cancelAll);
    }
}
