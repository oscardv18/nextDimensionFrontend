import type {
    DepartmentPageData,
    DepartmentSummaryData,
    MapContextData,
    MapDepartmentData,
    MapLinkData,
    OrganizationMapData,
    Sector,
    ZoneData,
} from '@/data/contracts';
import commerce from './fixtures/commerce.json';
import education from './fixtures/education.json';
import industry from './fixtures/industry.json';
import restaurant from './fixtures/restaurant.json';
import { sectorLayoutFor } from './sector-layouts';

/*
 * Organizaciones ficticias del prototipo aprobado, una por sector. Los fixtures solo traen datos con
 * `publicId` UUIDv7 estables y una clave de departamento que la distribución del sector usa para
 * colocarlo. El escenario no es un cambio de organización ni simula tenancy.
 */
export const SECTORS: Sector[] = [
    'education',
    'industry',
    'commerce',
    'restaurant',
];

type FixtureDepartment = Omit<
    MapDepartmentData,
    'building' | 'gridColumn' | 'gridRow'
> & { key: string };

interface Fixture {
    sector: Sector;
    organizationName: string;
    branchName: string;
    zones: ZoneData[];
    departments: FixtureDepartment[];
    links: MapLinkData[];
}

const FIXTURES: Record<Sector, Fixture> = {
    education: education as Fixture,
    industry: industry as Fixture,
    commerce: commerce as Fixture,
    restaurant: restaurant as Fixture,
};

export type Translate = (key: string) => string;

export function contextFor(sector: Sector): MapContextData {
    const fixture = FIXTURES[sector];

    return {
        organizationName: fixture.organizationName,
        branchName: fixture.branchName,
        sector,
        isDemo: true,
    };
}

export function buildMap(
    sector: Sector,
    translate: Translate,
): OrganizationMapData {
    const fixture = FIXTURES[sector];
    const layout = sectorLayoutFor(sector);
    const places = layout.place(fixture.departments.map((d) => d.key));

    const departments = fixture.departments.map(
        ({ key, ...department }): MapDepartmentData => ({
            ...department,
            ...places[key],
        }),
    );

    return {
        context: contextFor(sector),
        gridColumns: layout.gridColumns,
        zones: fixture.zones,
        departments,
        links: fixture.links,
        landmarks: layout.landmarkList(translate),
    };
}

export function summarize(
    department: MapDepartmentData,
): DepartmentSummaryData {
    return {
        publicId: department.publicId,
        name: department.name,
        zoneKey: department.zoneKey,
        summary: department.summary,
        icon: department.icon,
        hue: department.hue,
        pendingTotal: department.pending.total,
        worstTone: department.pending.worst,
    };
}

/** Busca el departamento en todos los escenarios, como la fuente de demostración original. */
export function buildDepartmentPage(
    publicId: string,
    translate: Translate,
): DepartmentPageData | null {
    for (const sector of SECTORS) {
        const map = buildMap(sector, translate);
        const department = map.departments.find((d) => d.publicId === publicId);

        if (department) {
            return {
                context: map.context,
                department,
                zone:
                    map.zones.find((zone) => zone.key === department.zoneKey) ??
                    null,
                siblings: map.departments.map(summarize),
            };
        }
    }

    return null;
}
