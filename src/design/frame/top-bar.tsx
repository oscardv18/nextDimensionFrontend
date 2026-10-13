/* Barra superior: contexto (organización y sede), búsqueda, capas, actividad, notificaciones, tema y perfil.
   Forma una L con el carril: mismo material de cristal, sin borde entre ambos (portado del prototipo). */
import {
    Activity,
    Bell,
    Check,
    ChevronDown,
    MapPin,
    Moon,
    Search,
    Sun,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/design/common';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/design/ui/dropdown-menu';
import { useAppearance } from '@/design/appearance/use-appearance';
import type { MapContextData, Sector } from '@/data/contracts';
import { LayersMenu } from './layers-menu';
import { ProfileMenu } from './profile-menu';
import type { ProfileMenuProps } from './profile-menu';
import { Soon } from './soon';

const SECTOR_COLOR: Record<Sector, string> = {
    industry: 'var(--violeta)',
    education: 'var(--verde)',
    commerce: 'var(--amarillo)',
    restaurant: 'var(--naranja)',
};
const orgInitials = (name: string) =>
    name.replace(/[^A-ZÁÉÍÓÚ]/g, '').slice(0, 2);

export interface DemoScenarios {
    sector: Sector;
    scenarios: { sector: Sector; organizationName: string }[];
}

export function TopBar({
    context,
    demo,
    onSelectScenario,
    onGoHome,
    profile,
}: {
    context: MapContextData | null;
    demo: DemoScenarios | null;
    onSelectScenario: (sector: Sector) => void;
    onGoHome: () => void;
    profile: ProfileMenuProps;
}) {
    const { t } = useTranslation();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const dark = resolvedAppearance === 'dark';

    return (
        <header className="barra" aria-label={t('frame.topBar')}>
            <button
                className="logo"
                onClick={onGoHome}
                aria-label={t('frame.home')}
            >
                <Logo />
            </button>
            <span className="marca" aria-hidden>
                arxnet
            </span>
            <DropdownMenu>
                <DropdownMenuTrigger
                    className="miga"
                    aria-label={t('frame.organization', {
                        name:
                            context?.organizationName ??
                            t('frame.noOrganization'),
                    })}
                >
                    {context && (
                        <span
                            className="org-ico"
                            style={{
                                ['--c' as string]: SECTOR_COLOR[context.sector],
                            }}
                        >
                            {orgInitials(context.organizationName)}
                        </span>
                    )}
                    <span className="lbl-org">
                        {context?.organizationName ?? t('frame.noOrganization')}
                    </span>
                    <ChevronDown className="chev" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="menu-vidrio w-72">
                    {demo ? (
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>
                                {t('demo.scenarios')}
                            </DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={demo.sector}
                                onValueChange={(sector) =>
                                    onSelectScenario(sector as Sector)
                                }
                            >
                                {demo.scenarios.map(
                                    ({ sector, organizationName }) => (
                                        <DropdownMenuRadioItem
                                            key={sector}
                                            value={sector}
                                        >
                                            <span
                                                className="org-ico"
                                                style={{
                                                    ['--c' as string]:
                                                        SECTOR_COLOR[sector],
                                                }}
                                            >
                                                {orgInitials(organizationName)}
                                            </span>
                                            <span>
                                                <b>{organizationName}</b>
                                                <small className="sub">
                                                    {t(`sector.${sector}`)}
                                                </small>
                                            </span>
                                        </DropdownMenuRadioItem>
                                    ),
                                )}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                    ) : (
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>
                                {t('frame.organizations')}
                            </DropdownMenuLabel>
                            <DropdownMenuItem disabled>
                                {t('frame.organizationsSoon')}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    )}
                    <DropdownMenuSeparator />
                    <p className="menu-nota">
                        {demo
                            ? t('demo.scenariosNote')
                            : t('frame.organizationsNote')}
                    </p>
                </DropdownMenuContent>
            </DropdownMenu>
            {context && (
                <>
                    <span className="sep-v oculto-tablet" />
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className="miga oculto-movil"
                            aria-label={t('frame.branch', {
                                name: context.branchName,
                            })}
                        >
                            <MapPin
                                className="chev"
                                style={{ color: 'var(--t2)' }}
                            />
                            <span className="lbl-sede">
                                {context.branchName}
                            </span>
                            <ChevronDown className="chev" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="menu-vidrio w-64">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                    {t('frame.activeBranch')}
                                </DropdownMenuLabel>
                                <DropdownMenuItem>
                                    <MapPin />
                                    {context.branchName}
                                    <Check className="ml-auto" />
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled>
                                    <MapPin />
                                    {t('frame.otherBranchesSoon')}
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <p className="menu-nota">
                                {t('frame.branchesNote')}
                            </p>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
            <Soon label={t('search.label')} className="buscar">
                <Search />
                <span>{t('search.placeholder')}</span>
                <kbd>/</kbd>
            </Soon>
            <LayersMenu demo={context?.isDemo ?? false} />
            <Soon label={t('activity.label')} className="boton-b">
                <Activity />
                <span className="lbl">{t('activity.label')}</span>
                <kbd>A</kbd>
            </Soon>
            <Soon
                label={t('notifications.label')}
                className="boton-b icono oculto-movil"
            >
                <Bell />
            </Soon>
            <button
                className="boton-b icono oculto-movil"
                aria-label={
                    dark ? t('appearance.toLight') : t('appearance.toDark')
                }
                onClick={() => updateAppearance(dark ? 'light' : 'dark')}
            >
                {dark ? <Sun /> : <Moon />}
            </button>
            <ProfileMenu {...profile} />
        </header>
    );
}
