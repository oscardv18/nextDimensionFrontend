/* Los títulos de las páginas de acceso son claves del catálogo (texto en inglés, convención del kit de arranque original).
   Acceso (inicio de sesión, registro, recuperación, verificación): tarjeta de cristal sobre el fondo de
   Arxnet, con la misma marca, tokens y temas que el marco. */
import { Link, Outlet, useMatches } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/design/common';
import { routes } from '@/app/routes';

/** Título y descripción de cada pantalla: la ruta los declara en `handle` (antes, props de layout). */
export interface AuthHandle {
    title?: string;
    description?: string;
}

export default function AuthLayout() {
    const { t } = useTranslation();
    const { title = '', description = '' } =
        (useMatches().at(-1)?.handle as AuthHandle | undefined) ?? {};

    return (
        <div className="acceso">
            <main className="acceso-tarjeta">
                <Link
                    to={routes.map()}
                    className="acceso-marca"
                    aria-label={t('frame.home')}
                >
                    <Logo />
                    <span>arxnet</span>
                </Link>
                <div className="acceso-cab">
                    <h1>{t(title)}</h1>
                    {description && <p>{t(description)}</p>}
                </div>
                <Outlet />
            </main>
        </div>
    );
}
