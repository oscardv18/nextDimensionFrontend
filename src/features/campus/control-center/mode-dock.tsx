/*
 * Dock inferior de modos. «Control» devuelve la vista general y «Espacios» es el modo espacial actual
 * (el campus 3D); Aplicaciones, Actividad, Líneas y Flujos todavía no existen y se marcan así.
 */
import {
    Bell,
    Gauge,
    Layers,
    LayoutGrid,
    Share2,
    Workflow,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PrototypeControl } from './prototype-control';

export function ModeDock({
    overview,
    onOverview,
}: {
    overview: boolean;
    onOverview: () => void;
}) {
    const { t } = useTranslation();
    return (
        <nav
            className="cc-dock cc-island"
            aria-label={t('cc.modes')}
            data-enter="bottom"
        >
            <button
                type="button"
                className="cc-dock-item"
                aria-pressed={overview}
                onClick={onOverview}
            >
                <Gauge size={19} strokeWidth={1.6} aria-hidden="true" />
                <span>{t('cc.control')}</span>
            </button>
            <PrototypeControl
                label={t('cc.applications')}
                className="cc-dock-item"
            >
                <LayoutGrid size={19} strokeWidth={1.6} aria-hidden="true" />
                <span>{t('cc.applications')}</span>
            </PrototypeControl>
            <PrototypeControl label={t('cc.activity')} className="cc-dock-item">
                <Bell size={19} strokeWidth={1.6} aria-hidden="true" />
                <span>{t('cc.activity')}</span>
            </PrototypeControl>
            <span className="cc-dock-sep" aria-hidden="true" />
            <button
                type="button"
                className="cc-dock-item"
                aria-current="true"
                data-active="true"
                aria-label={t('cc.spacesCurrent')}
            >
                <Layers size={19} strokeWidth={1.6} aria-hidden="true" />
                <span>{t('cc.spaces')}</span>
            </button>
            <PrototypeControl label={t('cc.lines')} className="cc-dock-item">
                <Share2 size={19} strokeWidth={1.6} aria-hidden="true" />
                <span>{t('cc.lines')}</span>
            </PrototypeControl>
            <PrototypeControl label={t('cc.flows')} className="cc-dock-item">
                <Workflow size={19} strokeWidth={1.6} aria-hidden="true" />
                <span>{t('cc.flows')}</span>
            </PrototypeControl>
        </nav>
    );
}
