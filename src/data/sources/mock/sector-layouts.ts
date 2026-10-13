import type { BuildingType, MapLandmarkData, Sector } from '@/data/contracts';

/*
 * Distribuciones predefinidas por sector. Reproducen las del prototipo aprobado, con claves de
 * departamento estables en inglés. La posición y el edificio no vienen en los fixtures.
 */
type Slot = [column: number, row: number, building: BuildingType];
type Cell = [column: number, row: number];

export interface Placement {
    gridColumn: number;
    gridRow: number;
    building: BuildingType;
}

export class SectorLayout {
    readonly gridColumns: number;
    private readonly slots: Record<string, Slot>;
    private readonly landmarks: Record<string, Cell>;

    constructor(
        gridColumns: number,
        slots: Record<string, Slot>,
        landmarks: Record<string, Cell> = {},
    ) {
        this.gridColumns = gridColumns;
        this.slots = slots;
        this.landmarks = landmarks;
    }

    /**
     * Posición de cada departamento. Los que no tienen hueco en la distribución ocupan, en orden, la
     * siguiente celda libre (fila por fila) con un edificio de oficina, para que nunca se pierdan del mapa.
     */
    place(departmentKeys: string[]): Record<string, Placement> {
        const placed: Record<string, Placement> = {};
        const taken = new Set<string>();

        for (const key of departmentKeys) {
            const slot = this.slots[key];
            if (slot) {
                const [column, row, building] = slot;
                placed[key] = {
                    gridColumn: column,
                    gridRow: row,
                    building,
                };
                taken.add(`${column}:${row}`);
            }
        }

        for (const [column, row] of Object.values(this.landmarks)) {
            taken.add(`${column}:${row}`);
        }

        let cell = 0;
        for (const key of departmentKeys) {
            if (placed[key]) {
                continue;
            }
            const at = () =>
                `${cell % this.gridColumns}:${Math.floor(cell / this.gridColumns)}`;
            while (taken.has(at())) {
                cell++;
            }
            placed[key] = {
                gridColumn: cell % this.gridColumns,
                gridRow: Math.floor(cell / this.gridColumns),
                building: 'office',
            };
            taken.add(at());
        }

        return placed;
    }

    /** `translate` resuelve el nombre localizado de cada punto de referencia. */
    landmarkList(translate: (key: string) => string): MapLandmarkData[] {
        return Object.entries(this.landmarks).map(([key, [column, row]]) => ({
            key,
            name: translate(`map.landmark.${key}`),
            gridColumn: column,
            gridRow: row,
        }));
    }
}

export function sectorLayoutFor(sector: Sector): SectorLayout {
    switch (sector) {
        case 'industry':
            return new SectorLayout(3, {
                production: [0, 0, 'factory'],
                warehouse: [1, 0, 'warehouse'],
                sales: [2, 0, 'office'],
                purchasing: [0, 1, 'purchasing'],
                administration: [1, 1, 'headquarters'],
                human_resources: [2, 1, 'people'],
            });
        case 'education':
            return new SectorLayout(
                4,
                {
                    preschool: [0, 0, 'preschool'],
                    primary: [1, 0, 'school'],
                    secondary: [2, 0, 'school'],
                    facilities: [3, 0, 'classrooms'],
                    academic_records: [1, 1, 'office'],
                    billing: [2, 1, 'purchasing'],
                    principal: [3, 1, 'headquarters'],
                },
                { courts: [0, 1] },
            );
        case 'commerce':
            return new SectorLayout(
                3,
                {
                    sales_floor: [0, 0, 'store'],
                    cashier: [1, 0, 'kiosk'],
                    purchasing: [0, 1, 'purchasing'],
                    warehouse: [1, 1, 'warehouse'],
                    dispatch: [2, 1, 'warehouse'],
                },
                { customer_entrance: [2, 0] },
            );
        case 'restaurant':
            return new SectorLayout(
                3,
                {
                    dining_room: [0, 0, 'dining'],
                    cashier: [1, 0, 'kiosk'],
                    administration: [2, 0, 'office'],
                    kitchen: [0, 1, 'kitchen'],
                    warehouse: [1, 1, 'warehouse'],
                },
                { supplier_access: [2, 1] },
            );
    }
}
