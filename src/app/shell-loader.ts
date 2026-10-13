import { dataSource } from './data-source';
import type { ShellData } from './app-shell';
import { LOCALES, storedLocale } from '@/i18n/setup';

/** Carga lo que el marco comparte en todas las páginas (las props compartidas del producto original). */
export async function loadShell(): Promise<ShellData> {
    const [user, context, directory, demo] = await Promise.all([
        dataSource.getUser(),
        dataSource.getContext(),
        dataSource.getDirectory(),
        dataSource.getDemo(),
    ]);

    return {
        name: 'Arxnet',
        user,
        locale: storedLocale(),
        locales: LOCALES,
        context,
        directory,
        demo,
    };
}
