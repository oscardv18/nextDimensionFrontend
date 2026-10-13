import { Box3, Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';
import type { Campus } from './asset';

export type Insets = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};
export type Viewport = { width: number; height: number };
export type SafeArea = {
    left: number;
    right: number;
    top: number;
    bottom: number;
};

// El Shell podrá pasar sus medidas reales, sin cambiar el contrato del activo ni los perfiles.
export function panelInsets(
    viewport: Viewport,
    reserve: boolean,
    overlays: Insets = { top: 0, right: 0, bottom: 0, left: 0 },
): Insets {
    if (!reserve) return overlays;
    const availableWidth = Math.max(
        0,
        viewport.width - overlays.left - overlays.right,
    );
    const availableHeight = Math.max(
        0,
        viewport.height - overlays.top - overlays.bottom,
    );
    return viewport.width < 760
        ? {
              ...overlays,
              bottom: overlays.bottom + Math.min(160, availableHeight * 0.3),
          }
        : {
              ...overlays,
              right: overlays.right + Math.min(320, availableWidth * 0.28),
          };
}

export function safeArea(
    viewport: Viewport,
    insets: Insets,
    overview = false,
): SafeArea {
    // La vista general protege los bordes, no las tarjetas; su layout es independiente.
    // Los márgenes departamentales se conservan para no alterar los enfoques aprobados.
    const availableWidth = viewport.width - insets.left - insets.right;
    const availableHeight = viewport.height - insets.top - insets.bottom;
    const horizontal = Math.min(
        overview ? 16 : 76,
        Math.max(24, availableWidth * 0.12),
    );
    const vertical = Math.min(
        overview ? 12 : 36,
        Math.max(14, availableHeight * 0.08),
    );
    const left = -1 + (2 * (insets.left + horizontal)) / viewport.width;
    const right = 1 - (2 * (insets.right + horizontal)) / viewport.width;
    const top = 1 - (2 * (insets.top + vertical)) / viewport.height;
    const bottom = -1 + (2 * (insets.bottom + vertical)) / viewport.height;
    if (left >= right || bottom >= top)
        throw new Error('Insufficient camera safe area');
    return { left, right, top, bottom };
}

export function boxCorners(box: Box3): Vector3[] {
    return [box.min.x, box.max.x].flatMap((x) =>
        [box.min.y, box.max.y].flatMap((y) =>
            [box.min.z, box.max.z].map((z) => new Vector3(x, y, z)),
        ),
    );
}

// Resuelve la distancia que mantiene todas las esquinas dentro del rectángulo visible.
// El desplazamiento lateral centra el foco en ese rectángulo sin cambiar su identidad.
export function fitCamera(
    points: Vector3[],
    focus: Vector3,
    direction: Vector3,
    camera: PerspectiveCamera,
    aspect: number,
    area: SafeArea,
    margin: number,
) {
    const backward = direction.clone().normalize();
    const right = new Vector3()
        .crossVectors(new Vector3(0, 1, 0), backward)
        .normalize();
    const up = new Vector3().crossVectors(backward, right).normalize();
    const tanV = Math.tan((camera.fov * Math.PI) / 360) / camera.zoom;
    const tanH = tanV * aspect;
    const centerX = (area.left + area.right) / 2;
    const centerY = (area.bottom + area.top) / 2;
    let distance = camera.near * 2;
    for (const point of points) {
        const relative = point.clone().sub(focus);
        const x = relative.dot(right);
        const y = relative.dot(up);
        const z = relative.dot(backward);
        distance = Math.max(
            distance,
            z + camera.near * 2,
            (x / tanH + area.right * z) / (area.right - centerX),
            (x / tanH + area.left * z) / (area.left - centerX),
            (y / tanV + area.top * z) / (area.top - centerY),
            (y / tanV + area.bottom * z) / (area.bottom - centerY),
        );
    }
    distance *= margin;
    const target = focus
        .clone()
        .addScaledVector(right, -centerX * distance * tanH)
        .addScaledVector(up, -centerY * distance * tanV);
    return {
        focus: focus.clone(),
        target,
        position: target.clone().addScaledVector(backward, distance),
        area,
        points,
    };
}

export function cameraPose(
    campus: Campus,
    selected: string | null,
    camera: PerspectiveCamera,
    aspect = camera.aspect,
    viewport: Viewport = { width: 1366, height: 768 },
    insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 },
) {
    const department = campus.departments.find(
        (entry) => entry.departmentId === selected,
    );
    const profile = {
        direction: campus.bundle.cameraCandidates.candidates.C20
            .directionTargetToCameraGltf as [number, number, number],
        margin: department ? 1.06 : 1.025,
    };
    // Las terrazas son contexto: pueden prolongarse detrás del Shell sin alejar los edificios.
    const bounds =
        department?.bounds ?? new Box3().setFromPoints(campus.overviewPoints);
    const focus = department
        ? department.focus.getWorldPosition(new Vector3())
        : bounds.getCenter(new Vector3());
    const points = department
        ? boxCorners(bounds)
        : campus.overviewPoints.map((point) => point.clone());
    if (department)
        points.push(department.label.getWorldPosition(new Vector3()));

    const area = safeArea(viewport, insets, !department);
    const direction = new Vector3(...profile.direction).normalize();
    if (!department) {
        // El centro de la caja no coincide con el centro de su silueta en perspectiva.
        // Equilibramos únicamente la silueta arquitectónica, en ambos ejes.
        // Ni anclas de etiquetas ni extremos del terreno condicionan este centro.
        const right = new Vector3()
            .crossVectors(new Vector3(0, 1, 0), direction)
            .normalize();
        const up = new Vector3().crossVectors(direction, right).normalize();
        const tanV = Math.tan((camera.fov * Math.PI) / 360) / camera.zoom;
        const tanH = tanV * aspect;
        for (let pass = 0; pass < 5; pass++) {
            const fitted = fitCamera(
                points,
                focus,
                direction,
                camera,
                aspect,
                area,
                1,
            );
            const distance = fitted.position.distanceTo(fitted.target);
            const projected = points.map((point) => {
                const relative = point.clone().sub(fitted.target);
                const depth = distance - relative.dot(direction);
                return {
                    x: relative.dot(right) / (depth * tanH),
                    y: relative.dot(up) / (depth * tanV),
                };
            });
            const centerX =
                (Math.min(...projected.map((p) => p.x)) +
                    Math.max(...projected.map((p) => p.x))) /
                2;
            const centerY =
                (Math.min(...projected.map((p) => p.y)) +
                    Math.max(...projected.map((p) => p.y))) /
                2;
            focus
                .addScaledVector(
                    right,
                    (centerX - (area.left + area.right) / 2) * distance * tanH,
                )
                .addScaledVector(
                    up,
                    (centerY - (area.top + area.bottom) / 2) * distance * tanV,
                );
        }
    }
    return fitCamera(
        points,
        focus,
        direction,
        camera,
        aspect,
        area,
        profile.margin,
    );
}

// Amortiguación crítica: mantiene posición y velocidad al cambiar de destino durante un vuelo.
export function advanceSpring(
    position: Vector3,
    velocity: Vector3,
    goal: Vector3,
    delta: number,
    frequency = 9,
) {
    // Solución analítica estable incluso con FPS bajos: no descartar tiempo transcurrido.
    const dt = Number.isFinite(delta) ? Math.max(delta, 0) : 0;
    const decay = Math.exp(-frequency * dt);
    for (const axis of ['x', 'y', 'z'] as const) {
        const offset = position[axis] - goal[axis];
        const impulse = velocity[axis] + frequency * offset;
        position[axis] = goal[axis] + (offset + impulse * dt) * decay;
        velocity[axis] = (velocity[axis] - frequency * impulse * dt) * decay;
    }
}
