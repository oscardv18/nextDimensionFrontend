import { Vector3 } from 'three';
import type { Camera } from 'three';

/** Evita que los rangos de niebla de la referencia C15 oculten el conjunto en viewports estrechos.
 * Mantiene el ancho del intervalo y no cambia cámaras, materiales ni el perfil copiado.
 */
export function architectureFogRange(
    points: Vector3[],
    camera: Camera,
    near: number,
    far: number,
) {
    const direction = camera.getWorldDirection(new Vector3());
    let depth = -Infinity;
    for (const point of points)
        depth = Math.max(
            depth,
            (point.x - camera.position.x) * direction.x +
                (point.y - camera.position.y) * direction.y +
                (point.z - camera.position.z) * direction.z,
        );
    const offset = Math.max(0, depth + (far - near) * 0.05 - near);
    return { near: near + offset, far: far + offset, offset };
}
