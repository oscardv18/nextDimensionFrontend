import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { Insets } from './camera-framing';

export type ScreenRect = {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
};
export type OverlaySide = keyof Insets | 'auto' | 'none';
export type Overlay = { side: OverlaySide; rect: ScreenRect };

/*
 * Reservamos la superficie de las capas flotantes del Shell, no un contenedor para el canvas.
 * Cada capa declara el borde que ocupa; «auto» (panel contextual) lo deduce de su forma: columna a un
 * lado en escritorio, franja inferior en móvil. Las capas ocultas (sin tamaño) no reservan nada y los
 * topes evitan que una capa grande deje a la cámara sin área segura.
 */
export function measureOverlayInsets(
    viewport: ScreenRect,
    overlays: Overlay[],
) {
    const gap = 8;
    const insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
    let rightLimit = viewport.width * 0.4;
    for (const { side, rect } of overlays) {
        if (side === 'none' || rect.width <= 0 || rect.height <= 0) continue;
        let edge = side;
        if (edge === 'auto')
            edge =
                rect.width > viewport.width * 0.6
                    ? rect.top + rect.height / 2 >
                      viewport.top + viewport.height / 2
                        ? 'bottom'
                        : 'top'
                    : rect.left + rect.width / 2 >
                        viewport.left + viewport.width / 2
                      ? 'right'
                      : 'left';
        // El panel lateral en móvil horizontal puede ocupar más del 40 %.
        if (side === 'auto' && edge === 'right')
            rightLimit = Math.max(
                rightLimit,
                Math.min(
                    viewport.width * 0.6,
                    viewport.right - rect.left + gap,
                ),
            );
        const reach = {
            top: rect.bottom - viewport.top,
            bottom: viewport.bottom - rect.top,
            left: rect.right - viewport.left,
            right: viewport.right - rect.left,
        }[edge];
        insets[edge] = Math.max(insets[edge], reach + gap);
    }
    return {
        top: clamp(insets.top, viewport.height * 0.25),
        bottom: clamp(insets.bottom, viewport.height * 0.5),
        left: clamp(insets.left, viewport.width * 0.3),
        right: clamp(insets.right, rightLimit),
    };
}

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

/*
 * Una capa puede flotar sin reservar con `--cc-inset: none` en su CSS (p. ej. el aviso de la vista
 * general en escritorio, que cae sobre el cielo de la escena). Así las reglas responsive viven en CSS.
 */
const reserves = (element: HTMLElement) =>
    getComputedStyle(element).getPropertyValue('--cc-inset').trim() !== 'none';

export type OverlayRefs = {
    side: OverlaySide;
    ref: RefObject<HTMLElement | null>;
}[];

/** `revision` vuelve a medir cuando cambia algo que no altera tamaños (p. ej. la selección). */
export function useOverlayInsets(
    viewport: RefObject<HTMLElement | null>,
    overlays: OverlayRefs,
    revision: unknown = null,
) {
    const [insets, setInsets] = useState<Insets & { regions: ScreenRect[] }>({
        regions: [],
        top: 64,
        bottom: 64,
        left: 0,
        right: 0,
    });
    useLayoutEffect(() => {
        const stage = viewport.current;
        if (!stage) return;
        let frame = 0;
        const observed = new Set<Element>();
        const observer =
            typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(() => schedule())
                : undefined;
        const measure = () => {
            frame = 0;
            const rect = stage.getBoundingClientRect();
            if (rect.height <= 0) return;
            const present = new Set<Element>([stage]);
            const entries = overlays.flatMap(({ side, ref }) => {
                const element = ref.current;
                if (!element) return [];
                // Incluye desplegables que sobresalen de su slot; solo el slot reserva cámara.
                const elements = [
                    element,
                    ...element.querySelectorAll<HTMLElement>(
                        '[role="menu"], [role="listbox"], [role="tooltip"], .cc-search-results',
                    ),
                ];
                return elements.map((child) => {
                    present.add(child);
                    if (!observed.has(child)) {
                        observer?.observe(child);
                        observed.add(child);
                    }
                    return {
                        side:
                            child === element && reserves(element)
                                ? side
                                : ('none' as const),
                        rect: child.getBoundingClientRect(),
                    };
                });
            });
            for (const child of observed)
                if (!present.has(child)) {
                    observer?.unobserve(child);
                    observed.delete(child);
                }
            const edges = measureOverlayInsets(rect, entries);
            const regions = entries
                .filter(({ rect: box }) => box.width > 0 && box.height > 0)
                .map(({ rect: box }) => ({
                    left: box.left - rect.left,
                    top: box.top - rect.top,
                    right: box.right - rect.left,
                    bottom: box.bottom - rect.top,
                    width: box.width,
                    height: box.height,
                }));
            setInsets((current) =>
                (Object.keys(edges) as (keyof Insets)[]).every(
                    (key) => Math.abs(current[key] - edges[key]) < 0.5,
                ) && JSON.stringify(current.regions) === JSON.stringify(regions)
                    ? current
                    : { ...edges, regions },
            );
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(measure);
        };
        observer?.observe(stage);
        const mutations = new MutationObserver(schedule);
        for (const { ref } of overlays) {
            if (!ref.current) continue;
            observer?.observe(ref.current);
            mutations.observe(ref.current, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: [
                    'class',
                    'hidden',
                    'data-collapsed',
                    'data-view',
                    'aria-expanded',
                ],
            });
        }
        window.addEventListener('resize', schedule);
        stage.parentElement?.addEventListener('animationend', schedule, true);
        stage.parentElement?.addEventListener('transitionend', schedule, true);
        measure();
        return () => {
            observer?.disconnect();
            mutations.disconnect();
            stage.parentElement?.removeEventListener(
                'animationend',
                schedule,
                true,
            );
            stage.parentElement?.removeEventListener(
                'transitionend',
                schedule,
                true,
            );
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', schedule);
        };
    }, [viewport, overlays, revision]);
    return insets;
}
