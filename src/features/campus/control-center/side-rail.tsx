/*
 * Carril lateral compacto. Centro de control, organización (mapa existente) y configuración son
 * destinos reales; aplicaciones y documentos se muestran como próxima entrega.
 */
import {
    Building2,
    FileText,
    LayoutGrid,
    Network,
    Settings,
} from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routes } from '@/app/routes';
import { PrototypeControl } from './prototype-control';

export function SideRail({ onOverview }: { onOverview: () => void }) {
    const { t } = useTranslation();
    return (
        <nav
            className="cc-rail cc-island"
            aria-label={t('cc.mainNavigation')}
            data-enter="left"
        >
            <button
                type="button"
                className="cc-rail-item"
                aria-current="page"
                aria-label={t('cc.controlCenter')}
                data-hint={t('cc.controlCenter')}
                data-hint-side="right"
                onClick={onOverview}
            >
                <Building2 size={19} strokeWidth={1.6} aria-hidden="true" />
            </button>
            <PrototypeControl
                label={t('cc.applications')}
                className="cc-rail-item"
                hint="right"
            >
                <LayoutGrid size={19} strokeWidth={1.6} aria-hidden="true" />
            </PrototypeControl>
            <PrototypeControl
                label={t('cc.documents')}
                className="cc-rail-item"
                hint="right"
            >
                <FileText size={19} strokeWidth={1.6} aria-hidden="true" />
            </PrototypeControl>
            <Link
                className="cc-rail-item"
                to={routes.map()}
                aria-label={t('cc.organization')}
                data-hint={t('cc.organization')}
                data-hint-side="right"
            >
                <Network size={19} strokeWidth={1.6} aria-hidden="true" />
            </Link>
            <Link
                className="cc-rail-item"
                to={routes.appearance()}
                aria-label={t('cc.settings')}
                data-hint={t('cc.settings')}
                data-hint-side="right"
            >
                <Settings size={19} strokeWidth={1.6} aria-hidden="true" />
            </Link>
        </nav>
    );
}
