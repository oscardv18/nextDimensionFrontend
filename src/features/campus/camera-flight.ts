import { Vector3 } from 'three';

/** Segmento temporal del controlador existente; no posee cámara ni loop de render. */
export class CameraFlight {
    readonly durationMs = 1200;
    private started = 0;
    private fromPosition = new Vector3();
    private fromTarget = new Vector3();
    private toPosition = new Vector3();
    private toTarget = new Vector3();
    elapsedMs = 0;

    begin(
        position: Vector3,
        target: Vector3,
        goal: { position: Vector3; target: Vector3 },
        now: number,
    ) {
        this.started = now;
        this.elapsedMs = 0;
        this.fromPosition.copy(position);
        this.fromTarget.copy(target);
        this.toPosition.copy(goal.position);
        this.toTarget.copy(goal.target);
    }

    sample(position: Vector3, target: Vector3, now: number) {
        this.elapsedMs = Math.max(0, now - this.started);
        const t = Math.min(1, this.elapsedMs / this.durationMs);
        const eased = t * t * t * (t * (t * 6 - 15) + 10);
        position.lerpVectors(this.fromPosition, this.toPosition, eased);
        target.lerpVectors(this.fromTarget, this.toTarget, eased);
        return t === 1;
    }
}
