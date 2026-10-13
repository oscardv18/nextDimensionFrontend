/*
 * Barra superior flotante del centro de control: marca, empresa, buscador, avisos, apariencia y perfil.
 * Tres islas separadas (como en la referencia aprobada) para no ocupar una franja sólida del viewport.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
    Bell,
    Check,
    ChevronDown,
    Moon,
    Search,
    SlidersHorizontal,
    Sun,
} from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { routes } from '@/app/routes';
import { useAppearance } from '@/design/appearance/use-appearance';
import { Logo } from '@/design/common';
import { attention, demoCompany, demoUser } from './demo-data';
import type { DepartmentId } from './demo-data';
import { DepartmentIcon } from './icons';
import { PrototypeControl } from './prototype-control';
import { useDismiss } from './use-dismiss';

type Props = {
    departments: string[];
    onSelect: (id: DepartmentId) => void;
    onOpenDiagnostics: () => void;
};

export function CommandBar({
    departments,
    onSelect,
    onOpenDiagnostics,
}: Props) {
    const { t } = useTranslation();
    return (
        <header className="cc-command" data-enter="top">
            <div className="cc-island cc-brand-island">
                <span className="cc-brand">
                    <Logo className="cc-brand-mark" />
                    <span className="cc-brand-name">ARXNET</span>
                </span>
                <CompanyMenu />
            </div>
            <SearchBox departments={departments} onSelect={onSelect} />
            <div className="cc-island cc-actions">
                <NotificationsMenu onSelect={onSelect} />
                <AppearanceMenu />
                <ProfileMenu onOpenDiagnostics={onOpenDiagnostics} />
            </div>
            <span className="cc-sr-only">{t('cc.demoData')}</span>
        </header>
    );
}

function CompanyMenu() {
    const { t } = useTranslation();
    const menu = useMenu();
    const anchor = useRef<HTMLDivElement>(null);
    useDismiss(anchor, menu.open, menu.close);
    return (
        <div className="cc-menu-anchor" ref={anchor}>
            <button
                type="button"
                className="cc-company"
                aria-expanded={menu.open}
                aria-haspopup="menu"
                aria-label={t('cc.company', { name: demoCompany.name })}
                onClick={menu.toggle}
            >
                <span className="cc-company-name">{demoCompany.name}</span>
                <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menu.open && (
                <div className="cc-menu" role="menu" data-align="start">
                    <p className="cc-menu-label">{t('cc.companies')}</p>
                    <button
                        type="button"
                        role="menuitemradio"
                        aria-checked="true"
                        className="cc-menu-item"
                        onClick={() => menu.close()}
                    >
                        <Check size={14} aria-hidden="true" />
                        {demoCompany.name}
                    </button>
                    <PrototypeControl
                        label={t('cc.addCompany')}
                        className="cc-menu-item"
                        hint="right"
                    >
                        <span className="cc-menu-gap" />
                        {t('cc.addCompany')}
                    </PrototypeControl>
                    <p className="cc-menu-note">{t('cc.demoData')}</p>
                </div>
            )}
        </div>
    );
}

/*
 * Buscador funcional limitado a lo que existe: los seis departamentos del campus. Enter o clic enfoca
 * el departamento con la misma navegación espacial. ⌘K / Ctrl+K lleva el foco al campo.
 */
function SearchBox({
    departments,
    onSelect,
}: {
    departments: string[];
    onSelect: (id: DepartmentId) => void;
}) {
    const { t } = useTranslation();
    const listId = useId();
    const input = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const normalize = (text: string) =>
        text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const matches = departments.filter((id) =>
        normalize(t(`campus.${id}`)).includes(normalize(query.trim())),
    );
    useEffect(() => {
        const shortcut = (event: globalThis.KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                input.current?.focus();
                setOpen(true);
            }
        };
        window.addEventListener('keydown', shortcut);
        return () => window.removeEventListener('keydown', shortcut);
    }, []);
    const choose = (id: string) => {
        onSelect(id as DepartmentId);
        setQuery('');
        setOpen(false);
        input.current?.blur();
    };
    const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            setActive((value) => Math.min(value + 1, matches.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((value) => Math.max(value - 1, 0));
        } else if (event.key === 'Enter' && matches[active]) {
            event.preventDefault();
            choose(matches[active]);
        } else if (event.key === 'Escape') {
            // No devuelve la cámara: solo cierra la búsqueda.
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            input.current?.blur();
        }
    };
    const expanded = open && matches.length > 0;
    return (
        <div className="cc-island cc-search" role="search">
            <Search size={16} aria-hidden="true" className="cc-search-icon" />
            <input
                ref={input}
                type="search"
                role="combobox"
                aria-label={t('cc.search')}
                aria-expanded={expanded}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                    expanded ? `${listId}-${active}` : undefined
                }
                placeholder={t('cc.searchPlaceholder')}
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(0);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={keyDown}
            />
            <kbd className="cc-kbd" aria-hidden="true">
                ⌘ K
            </kbd>
            {expanded && (
                <ul className="cc-search-results" id={listId} role="listbox">
                    <li className="cc-menu-label" role="presentation">
                        {t('cc.searchGroup')}
                    </li>
                    {matches.map((id, index) => (
                        <li
                            key={id}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={index === active}
                            className="cc-menu-item"
                            // mousedown: elige antes de que el blur cierre la lista.
                            onMouseDown={(event) => {
                                event.preventDefault();
                                choose(id);
                            }}
                            onMouseEnter={() => setActive(index)}
                        >
                            <DepartmentIcon id={id} size={15} />
                            {t(`campus.${id}`)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function NotificationsMenu({
    onSelect,
}: {
    onSelect: (id: DepartmentId) => void;
}) {
    const { t } = useTranslation();
    const menu = useMenu();
    const anchor = useRef<HTMLDivElement>(null);
    useDismiss(anchor, menu.open, menu.close);
    return (
        <div className="cc-menu-anchor" ref={anchor}>
            <button
                type="button"
                className="cc-icon-button"
                aria-label={t('cc.notifications', { count: attention.length })}
                aria-expanded={menu.open}
                aria-haspopup="menu"
                onClick={menu.toggle}
            >
                <Bell size={17} strokeWidth={1.7} aria-hidden="true" />
                <span className="cc-badge-dot" aria-hidden="true" />
            </button>
            {menu.open && (
                <div className="cc-menu" role="menu" data-align="end">
                    <p className="cc-menu-label">
                        {t('cc.notificationsTitle')}
                    </p>
                    {attention.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            role="menuitem"
                            className="cc-menu-item"
                            onClick={() => {
                                menu.close();
                                onSelect(item.departmentId);
                            }}
                        >
                            <span className="cc-dot" data-tone="attention" />
                            {t(item.labelKey, { count: item.count })}
                        </button>
                    ))}
                    <p className="cc-menu-note">{t('cc.demoData')}</p>
                </div>
            )}
        </div>
    );
}

/*
 * Los modos oscuro/claro usan el almacén de apariencia existente, compartido con la escena.
 * Los acentos siguen como próxima entrega; movimiento reducido conserva su preferencia real.
 */
function AppearanceMenu() {
    const { t } = useTranslation();
    const {
        resolvedAppearance,
        updateAppearance,
        reducedMotion,
        reducedMotionPreference,
        updateReducedMotion,
    } = useAppearance();
    const menu = useMenu();
    const anchor = useRef<HTMLDivElement>(null);
    useDismiss(anchor, menu.open, menu.close);
    return (
        <div className="cc-menu-anchor" ref={anchor}>
            <button
                type="button"
                className="cc-icon-button"
                aria-label={t('cc.appearance')}
                aria-expanded={menu.open}
                aria-haspopup="menu"
                onClick={menu.toggle}
            >
                <Sun size={17} strokeWidth={1.7} aria-hidden="true" />
            </button>
            {menu.open && (
                <div className="cc-menu" role="menu" data-align="end">
                    <p className="cc-menu-label">{t('cc.mode')}</p>
                    <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={resolvedAppearance === 'dark'}
                        onClick={() => updateAppearance('dark')}
                        className="cc-menu-item"
                    >
                        <Moon size={14} aria-hidden="true" />
                        {t('cc.modeDark')}
                        {resolvedAppearance === 'dark' && (
                            <Check
                                size={14}
                                aria-hidden="true"
                                className="cc-end"
                            />
                        )}
                    </button>
                    <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={resolvedAppearance === 'light'}
                        onClick={() => updateAppearance('light')}
                        className="cc-menu-item"
                    >
                        <Sun size={14} aria-hidden="true" />
                        {t('cc.modeLight')}
                        {resolvedAppearance === 'light' && (
                            <Check
                                size={14}
                                aria-hidden="true"
                                className="cc-end"
                            />
                        )}
                    </button>
                    <PrototypeControl
                        label={t('cc.accent')}
                        className="cc-menu-item"
                        hint="right"
                    >
                        <SlidersHorizontal size={14} aria-hidden="true" />
                        {t('cc.accent')}
                    </PrototypeControl>
                    <span className="cc-menu-sep" />
                    <button
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={reducedMotion}
                        className="cc-menu-item"
                        // La preferencia del sistema manda: no se puede desactivar desde aquí.
                        disabled={reducedMotion && !reducedMotionPreference}
                        onClick={() =>
                            updateReducedMotion(!reducedMotionPreference)
                        }
                    >
                        <span className="cc-switch" aria-hidden="true" />
                        {t('cc.reducedMotion')}
                    </button>
                </div>
            )}
        </div>
    );
}

function ProfileMenu({ onOpenDiagnostics }: { onOpenDiagnostics: () => void }) {
    const { t } = useTranslation();
    const menu = useMenu();
    const anchor = useRef<HTMLDivElement>(null);
    useDismiss(anchor, menu.open, menu.close);
    return (
        <div className="cc-menu-anchor" ref={anchor}>
            <button
                type="button"
                className="cc-profile"
                aria-label={t('cc.profile', { name: demoUser.name })}
                aria-expanded={menu.open}
                aria-haspopup="menu"
                onClick={menu.toggle}
            >
                <span className="cc-avatar" aria-hidden="true">
                    {demoUser.initials}
                </span>
                <ChevronDown size={14} aria-hidden="true" />
            </button>
            {menu.open && (
                <div className="cc-menu" role="menu" data-align="end">
                    <div className="cc-menu-user">
                        <strong>{demoUser.name}</strong>
                        <span>{demoUser.email}</span>
                    </div>
                    <span className="cc-menu-sep" />
                    <Link
                        role="menuitem"
                        className="cc-menu-item"
                        to={routes.profile()}
                    >
                        {t('cc.profileSettings')}
                    </Link>
                    <Link
                        role="menuitem"
                        className="cc-menu-item"
                        to={routes.map()}
                    >
                        {t('cc.organization')}
                    </Link>
                    <button
                        type="button"
                        role="menuitem"
                        className="cc-menu-item"
                        onClick={() => {
                            menu.close();
                            onOpenDiagnostics();
                        }}
                    >
                        {t('cc.sceneDiagnostics')}
                    </button>
                </div>
            )}
        </div>
    );
}

function useMenu() {
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    return { open, close, toggle: () => setOpen((value) => !value) };
}
