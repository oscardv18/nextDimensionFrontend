import type { ScreenRect } from './use-overlay-insets';

export type LabelCandidate = {
    id: string;
    rect: ScreenRect;
    priority: number;
    maxShift: number;
    previous?: { x: number; y: number };
    avoid?: ScreenRect[];
};
export type Placement = { id: string; x: number; y: number; visible: boolean };
export function shifted(rect: ScreenRect, x: number, y: number): ScreenRect {
    return {
        ...rect,
        left: rect.left + x,
        right: rect.right + x,
        top: rect.top + y,
        bottom: rect.bottom + y,
    };
}
export function intersects(a: ScreenRect, b: ScreenRect, gap = 8) {
    return (
        a.left < b.right + gap &&
        a.right > b.left - gap &&
        a.top < b.bottom + gap &&
        a.bottom > b.top - gap
    );
}
/** Desplazamientos solo en pantalla: nunca altera el ancla ni la geometría del GLB. */
export function layoutLabels(
    candidates: LabelCandidate[],
    obstacles: ScreenRect[],
    viewport: { width: number; height: number },
): Placement[] {
    const occupied = [...obstacles];
    return [...candidates]
        .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
        .map((entry) => {
            const { rect, maxShift, previous } = entry;
            const offsets = [{ x: 0, y: 0 }, ...(previous ? [previous] : [])];
            const xs = [0, 8 - rect.left, viewport.width - 8 - rect.right];
            const ys = [0, 8 - rect.top, viewport.height - 8 - rect.bottom];
            const blockers = [...occupied, ...(entry.avoid ?? [])];
            for (const box of blockers) {
                xs.push(box.left - 8 - rect.right, box.right + 8 - rect.left);
                ys.push(box.top - 8 - rect.bottom, box.bottom + 8 - rect.top);
            }
            for (const x of new Set(xs))
                for (const y of new Set(ys))
                    if (Math.hypot(x, y) <= maxShift) offsets.push({ x, y });
            offsets.sort((a, b) => {
                const score = (p: { x: number; y: number }) =>
                    Math.hypot(p.x, p.y) +
                    (previous
                        ? Math.hypot(p.x - previous.x, p.y - previous.y) * 0.15
                        : 0);
                return score(a) - score(b);
            });
            const offset = offsets.find(({ x, y }) => {
                if (Math.hypot(x, y) > maxShift) return false;
                const box = shifted(rect, x, y);
                return (
                    box.left >= 8 &&
                    box.top >= 8 &&
                    box.right <= viewport.width - 8 &&
                    box.bottom <= viewport.height - 8 &&
                    !blockers.some((other) => intersects(box, other))
                );
            });
            if (!offset) return { id: entry.id, x: 0, y: 0, visible: false };
            occupied.push(shifted(rect, offset.x, offset.y));
            return { id: entry.id, ...offset, visible: true };
        });
}
