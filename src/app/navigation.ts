import type { createBrowserRouter } from 'react-router';
import { setUi } from '@/design/state/ui-state';
import { routes } from './routes';

/*
 * Navegación imperativa del marco y del mapa. El enrutador se registra una vez al crearlo
 * (bindRouter), así este módulo no importa las páginas y no hay dependencias circulares.
 */
type Router = ReturnType<typeof createBrowserRouter>;
let router: Router | null = null;

export function bindRouter(instance: Router): void {
    router = instance;
}

/** Abre la página del departamento conservando la selección para volver al mismo punto del mapa. */
export function openDepartment(publicId: string): void {
    setUi({ selection: publicId, link: null });
    void router?.navigate(routes.department(publicId));
}

/** Vuelve al mapa. Con un departamento, queda seleccionado y con el foco en su etiqueta. */
export function backToMap(publicId?: string): void {
    // El mapa aún no existe cuando termina la navegación: el foco lo aplica la página al pintarse.
    setUi({
        selection: publicId ?? null,
        link: null,
        pendingFocus: publicId ?? null,
    });
    void router?.navigate(routes.map());
}
