import { describe, expect, it } from 'vitest';
import type { Sector } from '@/data/contracts';
import { SECTORS, buildDepartmentPage, buildMap } from './build-map';
import { SectorLayout, sectorLayoutFor } from './sector-layouts';

const translate = (key: string) => `t:${key}`;
const cell = (p: { gridColumn: number; gridRow: number }) =>
    `${p.gridColumn}:${p.gridRow}`;

/** Equivale a SectorLayoutsTest.php del producto original. */
describe('distribuciones por sector', () => {
    it.each(SECTORS)(
        '%s: sin celdas repetidas con todas las claves',
        (sector) => {
            const keys = [
                'production',
                'warehouse',
                'sales',
                'purchasing',
                'administration',
                'human_resources',
                'preschool',
                'primary',
                'secondary',
                'facilities',
                'academic_records',
                'billing',
                'principal',
                'sales_floor',
                'cashier',
                'dispatch',
                'dining_room',
                'kitchen',
            ];
            const cells = Object.values(
                sectorLayoutFor(sector).place(keys),
            ).map(cell);

            expect(new Set(cells).size).toBe(cells.length);
        },
    );

    it('un departamento sin hueco ocupa la siguiente celda libre, sin pisar referencias', () => {
        const layout = new SectorLayout(
            2,
            { a: [0, 0, 'factory'] },
            { plaza: [1, 0] },
        );

        expect(layout.place(['a', 'nuevo'])).toEqual({
            a: { gridColumn: 0, gridRow: 0, building: 'factory' },
            nuevo: { gridColumn: 0, gridRow: 1, building: 'office' },
        });
    });
});

describe('constructor de mocks', () => {
    it.each(SECTORS)(
        '%s: celdas únicas y puntos de referencia fuera de ellas',
        (sector) => {
            const map = buildMap(sector, translate);
            const cells = [...map.departments, ...map.landmarks].map(cell);

            expect(new Set(cells).size).toBe(cells.length);
        },
    );

    it.each(SECTORS)(
        '%s: todos los departamentos tienen posición dentro de la retícula, sin huecos',
        (sector) => {
            const map = buildMap(sector, translate);

            expect(map.departments.length).toBeGreaterThan(0);
            for (const d of map.departments) {
                expect(d.gridColumn).toBeGreaterThanOrEqual(0);
                expect(d.gridColumn).toBeLessThan(map.gridColumns);
                expect(d.gridRow).toBeGreaterThanOrEqual(0);
                expect(d.building).toBeTruthy();
            }
        },
    );

    it.each(SECTORS)(
        '%s: ninguna clave id en la salida, solo publicId',
        (sector) => {
            const walk = (value: unknown, path: string): string[] => {
                if (Array.isArray(value)) {
                    return value.flatMap((v, i) => walk(v, `${path}[${i}]`));
                }
                if (value && typeof value === 'object') {
                    return Object.entries(value).flatMap(([k, v]) => [
                        ...(k === 'id' ||
                        (k === 'key' && path.includes('departments'))
                            ? [`${path}.${k}`]
                            : []),
                        ...walk(v, `${path}.${k}`),
                    ]);
                }
                return [];
            };

            expect(walk(buildMap(sector, translate), 'map')).toEqual([]);
            const first = buildMap(sector, translate).departments[0];
            expect(
                buildDepartmentPage(first.publicId, translate),
            ).not.toBeNull();
            expect(
                JSON.stringify(buildDepartmentPage(first.publicId, translate)),
            ).not.toMatch(/"id":/);
        },
    );

    it('conserva los publicId UUIDv7 de los fixtures y no los repite', () => {
        const ids = SECTORS.flatMap((s) =>
            buildMap(s, translate).departments.map((d) => d.publicId),
        );

        expect(new Set(ids).size).toBe(ids.length);
        for (const id of ids) {
            expect(id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
            );
        }
    });

    it('las conexiones apuntan a departamentos del mismo escenario', () => {
        for (const sector of SECTORS) {
            const map = buildMap(sector, translate);
            const ids = new Set(map.departments.map((d) => d.publicId));
            for (const link of map.links) {
                expect(ids.has(link.from)).toBe(true);
                expect(ids.has(link.to)).toBe(true);
            }
        }
    });

    it('los escenarios coinciden con el contexto y se marcan como demostración', () => {
        const expected: Record<Sector, number> = {
            education: 7,
            industry: 6,
            commerce: 5,
            restaurant: 5,
        };

        for (const sector of SECTORS) {
            const map = buildMap(sector, translate);
            expect(map.context.sector).toBe(sector);
            expect(map.context.isDemo).toBe(true);
            expect(map.departments).toHaveLength(expected[sector]);
        }
    });

    it('localiza los puntos de referencia con la función recibida', () => {
        const map = buildMap('education', translate);

        expect(map.landmarks.map((l) => l.name)).toEqual([
            't:map.landmark.courts',
        ]);
    });

    it('un departamento inexistente devuelve null', () => {
        expect(
            buildDepartmentPage(
                '01a0f755-f200-7000-8000-000000000000',
                translate,
            ),
        ).toBeNull();
    });
});
