import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { Camera } from 'three';
import { recordCameraDiagnostic } from './camera-diagnostics';
import { intersects, layoutLabels, shifted } from './label-layout';
import type { LabelCandidate } from './label-layout';
import type { ScreenRect } from './use-overlay-insets';

export type SpatialEntry = {
    id: string;
    position: [number, number, number];
    proxyPosition?: [number, number, number];
    content: ReactNode;
    label: string;
    onSelect: () => void;
    selected?: boolean;
    secondary?: boolean;
    hovered?: boolean;
    annotation?: boolean;
};
type Metric = {
    width: number;
    height: number;
    x: number;
    y: number;
    rootWidth: number;
    rootHeight: number;
};
type Item = {
    element: HTMLButtonElement;
    metric?: Metric;
    line: SVGLineElement | null;
    x: number;
    y: number;
};

function showLabel(element: HTMLButtonElement, visible: boolean) {
    const hidden = String(!visible);
    if (element.dataset.layoutHidden === hidden) return;
    element.dataset.layoutHidden = hidden;
    element.setAttribute('aria-hidden', hidden);
    element.tabIndex = visible ? 0 : -1;
    if (!visible && document.activeElement === element) element.blur();
}

function updateLabels(
    entries: SpatialEntry[],
    items: Map<string, Item>,
    scratch: Vector3,
    camera: Camera,
    size: { width: number; height: number },
    dirty: boolean,
    regions: ScreenRect[],
    reducedMotion: boolean,
    delta: number,
) {
    camera.updateMatrixWorld();
    const candidates: LabelCandidate[] = [];
    // Protege el centro seleccionable de otros edificios, usando sus proxies reales.
    const proxyCenters = entries.flatMap((entry) => {
        if (!entry.proxyPosition) return [];
        scratch.set(...entry.proxyPosition).project(camera);
        if (scratch.z <= -1 || scratch.z >= 1) return [];
        const left = ((scratch.x + 1) * size.width) / 2 - 4;
        const top = ((1 - scratch.y) * size.height) / 2 - 4;
        return [
            {
                id: entry.id,
                rect: {
                    left,
                    top,
                    right: left + 8,
                    bottom: top + 8,
                    width: 8,
                    height: 8,
                },
            },
        ];
    });
    for (const entry of entries) {
        const item = items.get(entry.id);
        if (!item) continue;
        if (dirty || !item.metric) {
            const card =
                item.element.querySelector<HTMLElement>(
                    '.cc-tag-card, .cc-hotspot',
                ) ?? item.element;
            const tag = item.element.querySelector<HTMLElement>(
                '.cc-tag, .cc-hotspot',
            );
            const translation = tag
                ? getComputedStyle(tag).translate.split(' ')
                : [];
            const y = Number.parseFloat(translation[1] ?? '0') || 0;
            item.metric = {
                width: card.offsetWidth,
                height: card.offsetHeight,
                x: -item.element.offsetWidth / 2 + card.offsetLeft,
                y: -item.element.offsetHeight / 2 + card.offsetTop + y,
                rootWidth: item.element.offsetWidth,
                rootHeight: item.element.offsetHeight,
            };
        }
        const metric = item.metric;
        scratch.set(...entry.position).project(camera);
        const eligible =
            !entry.secondary &&
            scratch.z > -1 &&
            scratch.z < 1 &&
            metric.width > 0;
        if (!eligible) continue;
        const left = ((scratch.x + 1) * size.width) / 2 + metric.x;
        const top = ((1 - scratch.y) * size.height) / 2 + metric.y;
        candidates.push({
            id: entry.id,
            avoid: proxyCenters
                .filter((point) => point.id !== entry.id)
                .map((point) => point.rect),
            rect: {
                left,
                top,
                right: left + metric.width,
                bottom: top + metric.height,
                width: metric.width,
                height: metric.height,
            },
            priority: entry.selected
                ? entry.annotation
                    ? 100
                    : 200
                : entry.annotation
                  ? 50
                  : entry.hovered
                    ? 10
                    : 0,
            maxShift: entry.selected ? 144 : size.width < 760 ? 72 : 96,
            previous: { x: item.x, y: item.y },
        });
    }

    const placed = layoutLabels(candidates, regions, size);
    const occupied = [...regions];
    let moving = false;
    const updated = new Set<string>();
    for (const result of placed) {
        const item = items.get(result.id)!;
        const candidate = candidates.find((entry) => entry.id === result.id)!;
        const alpha = reducedMotion
            ? 1
            : 1 - Math.exp(-18 * Math.max(delta, 0));
        let x = item.x + (result.x - item.x) * alpha;
        let y = item.y + (result.y - item.y) * alpha;
        if (Math.hypot(x - result.x, y - result.y) < 0.3) {
            x = result.x;
            y = result.y;
        } else if (result.visible) moving = true;
        let box = shifted(candidate.rect, x, y);
        let visible =
            result.visible &&
            box.left >= 8 &&
            box.top >= 8 &&
            box.right <= size.width - 8 &&
            box.bottom <= size.height - 8 &&
            !occupied.some((obstacle) => intersects(box, obstacle)) &&
            !(candidate.avoid ?? []).some((obstacle) =>
                intersects(box, obstacle),
            );
        // La prioridad seleccionada no debe quedar oculta durante un cambio de composición.
        if (!visible && result.visible && candidate.priority >= 100) {
            x = result.x;
            y = result.y;
            box = shifted(candidate.rect, x, y);
            visible = true;
        }
        item.x = x;
        item.y = y;
        const transform = `translate(${x}px, ${y}px)`;
        if (item.element.style.transform !== transform)
            item.element.style.transform = transform;
        showLabel(item.element, visible);
        if (visible) occupied.push(box);
        const line = item.line;
        if (line && item.metric) {
            line.setAttribute('x1', String(item.metric.rootWidth / 2 - x));
            line.setAttribute('y1', String(item.metric.rootHeight / 2 - y));
            line.setAttribute('x2', String(item.metric.rootWidth / 2));
            line.setAttribute('y2', String(item.metric.rootHeight / 2));
            line.style.opacity = Math.hypot(x, y) > 8 ? '1' : '0';
        }
        updated.add(result.id);
    }
    for (const [id, { element }] of items)
        if (!updated.has(id)) {
            showLabel(element, false);
        }
    return moving;
}

/** Html mueve el ancla; este controlador compone las tarjetas sin renders de React por fotograma. */
export function AdaptiveLabels({
    entries,
    regions,
    reducedMotion,
}: {
    entries: SpatialEntry[];
    regions: ScreenRect[];
    reducedMotion: boolean;
}) {
    const { camera, size, invalidate, gl } = useThree();
    const items = useRef(new Map<string, Item>());
    const scratch = useMemo(() => new Vector3(), []);
    const dirty = useRef(true);
    const observer = useRef<ResizeObserver | null>(null);
    useEffect(() => {
        const refresh = () => {
            dirty.current = true;
            invalidate();
        };
        observer.current =
            typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(refresh)
                : null;
        for (const { element } of items.current.values())
            observer.current?.observe(element);
        window.addEventListener('resize', refresh);
        document.fonts?.addEventListener('loadingdone', refresh);
        refresh();
        return () => {
            observer.current?.disconnect();
            observer.current = null;
            window.removeEventListener('resize', refresh);
            document.fonts?.removeEventListener('loadingdone', refresh);
        };
    }, [entries, invalidate]);
    useFrame((_, delta) => {
        const moving = updateLabels(
            entries,
            items.current,
            scratch,
            camera,
            size,
            dirty.current,
            regions,
            reducedMotion,
            delta,
        );
        dirty.current = false;
        recordCameraDiagnostic(gl.domElement, 'labelsSettled', String(!moving));
        if (moving) invalidate();
    });
    return entries.map((entry) => (
        <Html
            key={entry.id}
            position={entry.position}
            center
            zIndexRange={entry.annotation ? [6, 0] : [5, 0]}
            style={{ pointerEvents: 'none' }}
        >
            <SpatialButton
                entry={entry}
                itemsRef={items}
                observerRef={observer}
                dirtyRef={dirty}
                invalidate={invalidate}
            />
        </Html>
    ));
}

function SpatialButton({
    entry,
    itemsRef,
    observerRef,
    dirtyRef,
    invalidate,
}: {
    entry: SpatialEntry;
    itemsRef: RefObject<Map<string, Item>>;
    observerRef: RefObject<ResizeObserver | null>;
    dirtyRef: RefObject<boolean>;
    invalidate: () => void;
}) {
    const id = entry.id;
    const attach = useCallback(
        (element: HTMLButtonElement | null) => {
            if (element) {
                showLabel(element, false);
                itemsRef.current.set(id, {
                    element,
                    x: 0,
                    y: 0,
                    line: element.querySelector('line'),
                });
                observerRef.current?.observe(element);
                dirtyRef.current = true;
                invalidate();
            } else {
                const item = itemsRef.current.get(id);
                if (item) observerRef.current?.unobserve(item.element);
                itemsRef.current.delete(id);
            }
        },
        [id, itemsRef, observerRef, dirtyRef, invalidate],
    );
    return (
        <button
            type="button"
            ref={attach}
            className={
                entry.annotation
                    ? 'campus-annotation campus-spatial-button'
                    : 'campus-label campus-spatial-button'
            }
            data-department={entry.annotation ? undefined : entry.id}
            data-annotation={entry.annotation ? entry.id : undefined}
            data-selected={entry.selected}
            data-secondary={entry.secondary}
            data-hovered={entry.hovered}
            aria-label={entry.label}
            aria-pressed={entry.selected}
            onClick={(event) => {
                event.stopPropagation();
                entry.onSelect();
            }}
        >
            <svg className="campus-label-connector" aria-hidden="true">
                <line />
            </svg>
            {entry.content}
        </button>
    );
}
