import { useEffect } from 'react';

const APP_NAME = 'Arxnet';

/** Título de la pestaña con el formato «Título · Arxnet». */
export function usePageTitle(title?: string): void {
    useEffect(() => {
        document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
    }, [title]);
}

/** Versión en JSX, para mantener la estructura de las páginas. */
export function PageTitle({ title }: { title?: string }) {
    usePageTitle(title);

    return null;
}
