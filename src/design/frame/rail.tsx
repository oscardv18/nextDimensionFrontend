/* Carril lateral: colapsado por defecto, con etiquetas en tooltip y opción de expandir. En móvil pasa a
   barra inferior (portado del prototipo). Los destinos aún no integrados se ven, pero anuncian su estado. */
import {
    ChartColumn,
    CircleHelp,
    FileText,
    House,
    LayoutGrid,
    PanelLeftClose,
    PanelLeftOpen,
    Route,
    Settings,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { setUi, useUi } from '@/design/state/ui-state';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/design/ui/tooltip';
import { useAppearance } from '@/design/appearance/use-appearance';

function Item({
    icon,
    text,
    shortcut,
    current,
    onClick,
    extra,
    soon,
}: {
    icon: ReactNode;
    text: string;
    shortcut?: string;
    current?: boolean;
    onClick?: () => void;
    extra?: string;
    soon?: boolean;
}) {
    const { t } = useTranslation();
    const { railWide } = useAppearance();
    const label = soon
        ? `${text} · ${t('soon.short')}`
        : shortcut
          ? `${text} (${shortcut})`
          : text;
    const button = (
        <button
            className={`item ${extra ?? ''}`}
            aria-current={current ? 'page' : undefined}
            aria-disabled={soon || undefined}
            onClick={soon ? (e) => e.preventDefault() : onClick}
            aria-label={label}
        >
            {icon}
            <span className="txt">{text}</span>
        </button>
    );

    if (railWide && !soon) {
        return button;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
                {soon ? t('soon.tooltip', { label: text }) : text}
                {shortcut && !soon && (
                    <kbd style={{ marginLeft: 8 }}>{shortcut}</kbd>
                )}
            </TooltipContent>
        </Tooltip>
    );
}

export function Rail({
    onMap,
    hasDirectory,
    onGoHome,
}: {
    onMap: boolean;
    hasDirectory: boolean;
    onGoHome: () => void;
}) {
    const { t } = useTranslation();
    const dialog = useUi((s) => s.dialog);
    const { railWide, updateRailWide } = useAppearance();

    return (
        <nav className="carril" aria-label={t('frame.mainNavigation')}>
            <div className="carril-panel">
                <Item
                    icon={<House />}
                    text={t('nav.map')}
                    shortcut="M"
                    current={onMap && !dialog}
                    onClick={onGoHome}
                />
                <Item
                    icon={<LayoutGrid />}
                    text={t('nav.departments')}
                    current={dialog === 'departments'}
                    soon={!hasDirectory}
                    onClick={() => setUi({ dialog: 'departments' })}
                />
                <Item icon={<FileText />} text={t('nav.approvals')} soon />
                <Item icon={<Route />} text={t('nav.processes')} soon />
                <Item icon={<ChartColumn />} text={t('nav.statistics')} soon />
                <Item
                    icon={<Settings />}
                    text={t('nav.settings')}
                    current={dialog === 'settings'}
                    onClick={() => setUi({ dialog: 'settings' })}
                    extra="oculto-movil"
                />
                <div className="abajo">
                    <div className="sep-h" />
                    <Item
                        icon={<CircleHelp />}
                        text={t('nav.help')}
                        shortcut="?"
                        current={dialog === 'shortcuts'}
                        onClick={() => setUi({ dialog: 'shortcuts' })}
                    />
                    <Item
                        icon={railWide ? <PanelLeftClose /> : <PanelLeftOpen />}
                        text={railWide ? t('nav.collapse') : t('nav.expand')}
                        onClick={() => updateRailWide(!railWide)}
                    />
                </div>
            </div>
        </nav>
    );
}
