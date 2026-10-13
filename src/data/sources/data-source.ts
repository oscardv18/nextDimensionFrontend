import type {
    DepartmentDirectoryData,
    DepartmentPageData,
    MapContextData,
    OrganizationMapData,
    Sector,
    SessionUserData,
} from '@/data/contracts';

/** Escenarios de demostración disponibles. Solo existe con datos de demostración. */
export interface DemoScenarios {
    sector: Sector;
    scenarios: { sector: Sector; organizationName: string }[];
}

/**
 * Origen de los datos de la interfaz. Hoy hay una implementación `mock`; cuando exista el backend,
 * lo único que cambia es una implementación `http` con esta misma forma.
 */
export interface DataSource {
    getUser(): Promise<SessionUserData | null>;
    getContext(): Promise<MapContextData | null>;
    getDirectory(): Promise<DepartmentDirectoryData | null>;
    getMap(): Promise<OrganizationMapData | null>;
    /** `null` si el departamento no existe. */
    getDepartment(publicId: string): Promise<DepartmentPageData | null>;
    /** `null` cuando no hay datos de demostración. */
    getDemo(): Promise<DemoScenarios | null>;
    setDemoScenario(sector: Sector): Promise<void>;
}
