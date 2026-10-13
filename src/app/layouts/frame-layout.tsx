/* Layout persistente de Arxnet: marco en L (barra + carril), área de trabajo con un único desplazamiento,
   diálogos del marco, atajos globales y bienvenida. */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAppShell } from '@/app/app-shell';
import { backToMap, openDepartment } from '@/app/navigation';
import { routes } from '@/app/routes';
import { getAppearance } from '@/design/appearance/use-appearance';
import { Logo } from '@/design/common';
import {
    DepartmentsSheet,
    SettingsSheet,
    ShortcutsDialog,
} from '@/design/dialogs/dialogs';
import { Rail } from '@/design/frame/rail';
import { TopBar } from '@/design/frame/top-bar';
import { isEditable, openOverlay, setUi, useUi } from '@/design/state/ui-state';
import { RouterLink } from '@/features/shared/router-link';
import type { Locale } from '@/i18n/setup';

export default function FrameLayout() {
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const shell = useAppShell();
    const onMap = pathname === routes.map();
    const intro = useUi((s) => s.intro);

    /* Bienvenida (≈1,4 s, no bloquea): una vez por sesión, al entrar al mapa y sin movimiento reducido */
    useEffect(() => {
        if (!onMap || getAppearance().reducedMotion) {
            return;
        }
        try {
            if (sessionStorage.getItem('arx-intro')) {
                return;
            }
            sessionStorage.setItem('arx-intro', '1');
        } catch {
            return;
        }
        setUi({ intro: true });
    }, [onMap]);
    useEffect(() => {
        if (!intro) {
            return;
        }
        const skip = () => setUi({ intro: false });
        const timer = window.setTimeout(skip, 1500);
        addEventListener('keydown', skip, { once: true });
        addEventListener('pointerdown', skip, { once: true });
        return () => {
            clearTimeout(timer);
            removeEventListener('keydown', skip);
            removeEventListener('pointerdown', skip);
        };
    }, [intro]);

    /* Atajos globales: teclas sueltas solo fuera de campos editables, sin modificadores ni superposiciones.
       Los de cada página (1–9, flechas, Esc) viven en la página. */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (
                e.ctrlKey ||
                e.metaKey ||
                e.altKey ||
                e.defaultPrevented ||
                isEditable(document.activeElement) ||
                openOverlay()
            ) {
                return;
            }
            const key = e.key.toLowerCase();
            if (e.key === '?') {
                e.preventDefault();
                setUi({ dialog: 'shortcuts' });
            } else if (key === 'c') {
                setUi({ layersOpen: true });
            } else if (key === 'p') {
                setUi((s) => ({ paused: !s.paused }));
            } else if (key === 'm') {
                backToMap();
            }
        };
        addEventListener('keydown', onKey);
        return () => removeEventListener('keydown', onKey);
    }, []);

    return (
        <div className={`app ${intro ? 'intro' : ''}`}>
            <a href="#contenido" className="saltar">
                {t('frame.skipToContent')}
            </a>
            <div className="marco-l" aria-hidden />
            <TopBar
                context={shell.context}
                demo={shell.demo}
                onSelectScenario={shell.selectScenario}
                onGoHome={() => backToMap()}
                profile={{
                    user: shell.user,
                    locale: shell.locale,
                    locales: [...shell.locales],
                    onChangeLocale: (code) => shell.setLocale(code as Locale),
                    onLogout: () => void navigate(routes.login()),
                    accountHref: routes.profile(),
                    Link: RouterLink,
                }}
            />
            <Rail
                onMap={onMap}
                hasDirectory={!!shell.directory}
                onGoHome={() => backToMap()}
            />
            <main className="lienzo" id="contenido" tabIndex={-1}>
                <div className="lienzo-in">
                    <Outlet />
                </div>
            </main>
            <ShortcutsDialog />
            <SettingsSheet />
            <DepartmentsSheet
                directory={shell.directory}
                context={shell.context}
                onOpenDepartment={openDepartment}
            />
            {intro && (
                <div className="bienvenida" aria-hidden>
                    <div className="bv-marca">
                        <Logo />
                        <span>arxnet</span>
                    </div>
                    <small className="bv-omitir">{t('frame.introSkip')}</small>
                </div>
            )}
        </div>
    );
}
