import type { SessionUserData } from '@/data/contracts';
import type { DataSource } from '../data-source';
import {
    SECTORS,
    buildDepartmentPage,
    buildMap,
    contextFor,
    summarize,
} from './build-map';
import type { Translate } from './build-map';
import { readScenario, writeScenario } from './scenario-store';

/** Usuario de desarrollo del origen (database/seeders), con un `publicId` fijo. */
const DEMO_USER: SessionUserData = {
    publicId: '01a0f755-f200-7000-8000-000000000001',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    twoFactorEnabled: false,
    locale: null,
};

/**
 * Implementación con datos de demostración. `translate` resuelve los textos que el backend
 * localiza (los puntos de referencia del mapa).
 */
export function createMockDataSource(translate: Translate): DataSource {
    return {
        getUser: async () => DEMO_USER,
        getContext: async () => contextFor(readScenario()),
        getDirectory: async () => {
            const map = buildMap(readScenario(), translate);

            return {
                zones: map.zones,
                departments: map.departments.map(summarize),
            };
        },
        getMap: async () => buildMap(readScenario(), translate),
        getDepartment: async (publicId) =>
            buildDepartmentPage(publicId, translate),
        getDemo: async () => ({
            sector: readScenario(),
            scenarios: SECTORS.map((sector) => ({
                sector,
                organizationName: contextFor(sector).organizationName,
            })),
        }),
        setDemoScenario: async (sector) => writeScenario(sector),
    };
}
