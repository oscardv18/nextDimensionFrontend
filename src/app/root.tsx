import { useCallback, useMemo } from 'react';
import {
    Outlet,
    useLoaderData,
    useNavigate,
    useRevalidator,
} from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Sector } from '@/data/contracts';
import { changeLanguage } from '@/i18n/setup';
import type { Locale } from '@/i18n/setup';
import { AppShellContext } from './app-shell';
import type { AppShellValue, ShellData } from './app-shell';
import { dataSource } from './data-source';
import { routes } from './routes';

/** Ruta raíz: expone los datos compartidos y las acciones del marco a todas las páginas. */
export function Root() {
    const shell = useLoaderData<ShellData>();
    const { revalidate } = useRevalidator();
    const navigate = useNavigate();
    // Suscribe al cambio de idioma para que el contexto vuelva a calcularse.
    const { i18n } = useTranslation();

    const setLocale = useCallback(
        (locale: Locale) => {
            void changeLanguage(locale).then(() => revalidate());
        },
        [revalidate],
    );
    const selectScenario = useCallback(
        (sector: Sector) => {
            void dataSource
                .setDemoScenario(sector)
                // Como en el producto original: cambiar de escenario lleva al mapa. Se revalida
                // además la raíz, cuyos datos (organización y directorio) dependen del escenario.
                .then(() => navigate(routes.map()))
                .then(() => revalidate());
        },
        [navigate, revalidate],
    );

    const value = useMemo<AppShellValue>(
        () => ({
            ...shell,
            locale: i18n.language as Locale,
            setLocale,
            selectScenario,
        }),
        [shell, i18n.language, setLocale, selectScenario],
    );

    return (
        <AppShellContext value={value}>
            <Outlet />
        </AppShellContext>
    );
}
