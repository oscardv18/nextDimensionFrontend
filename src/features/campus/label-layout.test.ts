import { describe, expect, it } from 'vitest';
import { intersects, layoutLabels, shifted } from './label-layout';
import type { LabelCandidate } from './label-layout';
const rect = (left: number, top: number, width = 120, height = 46) => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
});
const candidate = (
    id: string,
    left: number,
    top: number,
    priority = 0,
): LabelCandidate => ({ id, rect: rect(left, top), priority, maxShift: 96 });

describe('etiquetas espaciales adaptativas', () => {
    it('prioriza la selección y mantiene las tarjetas separadas sin cambiar el ancla', () => {
        const entries = [
            candidate('secondary', 160, 180),
            candidate('selected', 160, 180, 200),
        ];
        const before = structuredClone(entries);
        const result = layoutLabels(entries, [], { width: 600, height: 400 });
        expect(result[0]).toEqual({
            id: 'selected',
            x: 0,
            y: 0,
            visible: true,
        });
        expect(result[1].visible).toBe(true);
        expect(
            intersects(
                shifted(entries[1].rect, result[0].x, result[0].y),
                shifted(entries[0].rect, result[1].x, result[1].y),
            ),
        ).toBe(false);
        expect(entries).toEqual(before);
    });
    it('evita paneles y controles flotantes con desplazamiento limitado', () => {
        const entry = candidate('procurement', 250, 170, 200);
        const panel = rect(360, 100, 220, 250);
        const [result] = layoutLabels([entry], [panel], {
            width: 600,
            height: 400,
        });
        expect(result.visible).toBe(true);
        expect(Math.hypot(result.x, result.y)).toBeLessThanOrEqual(
            entry.maxShift,
        );
        expect(intersects(shifted(entry.rect, result.x, result.y), panel)).toBe(
            false,
        );
    });
    it('deja libre el centro del proxy de otro edificio', () => {
        const entry = {
            ...candidate('procurement', 150, 170),
            avoid: [rect(190, 190, 8, 8)],
        };
        const [result] = layoutLabels([entry], [], { width: 600, height: 400 });
        expect(result.visible).toBe(true);
        expect(
            intersects(shifted(entry.rect, result.x, result.y), entry.avoid[0]),
        ).toBe(false);
    });
    it('oculta una tarjeta cuando no existe espacio sin desplazarla lejos del edificio', () => {
        const [result] = layoutLabels(
            [candidate('hidden', 100, 100)],
            [rect(0, 0, 390, 400)],
            { width: 390, height: 400 },
        );
        expect(result.visible).toBe(false);
    });
    for (const viewport of [
        { width: 320, height: 568 },
        { width: 640, height: 360 },
        { width: 768, height: 844 },
        { width: 1920, height: 1080 },
    ]) {
        it(`mantiene márgenes y evita superposiciones a ${viewport.width}×${viewport.height}`, () => {
            const entries = Array.from({ length: 6 }, (_, index) =>
                candidate(
                    String(index),
                    viewport.width / 2 + index * 8,
                    viewport.height / 2 + index * 4,
                ),
            );
            const obstacles = [
                rect(0, 0, viewport.width, 50),
                rect(viewport.width - 90, 80, 90, 100),
            ];
            const results = layoutLabels(entries, obstacles, viewport);
            const occupied = [...obstacles];
            for (const result of results) {
                if (!result.visible) continue;
                const box = shifted(
                    entries.find((e) => e.id === result.id)!.rect,
                    result.x,
                    result.y,
                );
                expect(box.left).toBeGreaterThanOrEqual(8);
                expect(box.top).toBeGreaterThanOrEqual(8);
                expect(box.right).toBeLessThanOrEqual(viewport.width - 8);
                expect(box.bottom).toBeLessThanOrEqual(viewport.height - 8);
                expect(occupied.some((other) => intersects(box, other))).toBe(
                    false,
                );
                occupied.push(box);
            }
            expect(results.some((entry) => entry.visible)).toBe(true);
            expect(
                layoutLabels([...entries].reverse(), obstacles, viewport),
            ).toEqual(results);
        });
    }
});
