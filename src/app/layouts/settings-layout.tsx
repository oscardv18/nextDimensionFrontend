/* Ajustes de la cuenta dentro del marco de Arxnet (área de trabajo con desplazamiento propio). */
import { Link, Outlet, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routes } from '@/app/routes';

export default function SettingsLayout() {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    // «Seguridad» (contraseña, 2FA, passkeys) llega con el backend: ver docs/pendientes-backend.md.
    const items = [
        { title: t('settings.profile'), href: routes.profile() },
        { title: t('settings.appearance'), href: routes.appearance() },
    ];

    return (
        <div className="ajustes">
            <div className="ajustes-cab">
                <h1>{t('settings.accountTitle')}</h1>
                <p>{t('settings.accountDescription')}</p>
            </div>
            <div className="ajustes-cuerpo">
                <nav
                    className="ajustes-nav"
                    aria-label={t('settings.accountTitle')}
                >
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            aria-current={
                                pathname.startsWith(item.href)
                                    ? 'page'
                                    : undefined
                            }
                        >
                            {item.title}
                        </Link>
                    ))}
                </nav>
                <section className="ajustes-panel">
                    <Outlet />
                </section>
            </div>
        </div>
    );
}
