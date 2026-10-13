import { createContext, use } from 'react';
import type {
    DepartmentDirectoryData,
    MapContextData,
    Sector,
    SessionUserData,
} from '@/data/contracts';
import type { DemoScenarios } from '@/data/sources/data-source';
import type { Locale } from '@/i18n/setup';

/**
 * Datos que el marco necesita en todas las páginas: lo que antes llegaba como props compartidas.
 * Lo alimenta el `DataSource` desde el cargador de la ruta raíz.
 */
export interface ShellData {
    name: string;
    user: SessionUserData | null;
    locale: Locale;
    locales: readonly Locale[];
    context: MapContextData | null;
    directory: DepartmentDirectoryData | null;
    /** `null` cuando no hay datos de demostración. */
    demo: DemoScenarios | null;
}

export interface AppShellValue extends ShellData {
    setLocale: (locale: Locale) => void;
    selectScenario: (sector: Sector) => void;
}

export const AppShellContext = createContext<AppShellValue | null>(null);

export function useAppShell(): AppShellValue {
    const value = use(AppShellContext);
    if (!value) {
        throw new Error('useAppShell requiere <AppShellProvider>');
    }

    return value;
}
