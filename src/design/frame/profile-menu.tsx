/* Perfil y apariencia: panel compacto, sin submenús en cascada (portado del prototipo). Sin rol ni
   latencia simulados: el usuario es el autenticado y los permisos llegan con Authorization. */
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { initials } from '@/design/common';
import type { SessionUserData } from '@/data/contracts';
import type { LinkComponent } from '@/design/lib/link';
import { setUi } from '@/design/state/ui-state';
import { Popover, PopoverContent, PopoverTrigger } from '@/design/ui/popover';
import {
    AccentPicker,
    ModeSegment,
    ToggleRow,
    useMotionToggles,
} from './appearance-controls';

export interface ProfileMenuProps {
    user: SessionUserData | null;
    locale: string;
    locales: string[];
    onChangeLocale: (locale: string) => void;
    onLogout: () => void;
    accountHref: string;
    Link: LinkComponent;
}

export function ProfileMenu({
    user,
    locale,
    locales,
    onChangeLocale,
    onLogout,
    accountHref,
    Link,
}: ProfileMenuProps) {
    const { t } = useTranslation();
    const toggles = useMotionToggles();
    const [open, setOpen] = useState(false);

    if (!user) {
        return null;
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                className="perfil"
                aria-label={t('profile.trigger')}
            >
                <span className="avatar">
                    {initials(user.name)}
                    <i />
                </span>
                <ChevronDown className="chev" />
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="menu-vidrio menu-perfil p-0"
            >
                <div className="mp-cab">
                    <span className="avatar">
                        {initials(user.name)}
                        <i />
                    </span>
                    <span>
                        <b>{user.name}</b>
                        <small>{user.email}</small>
                    </span>
                </div>
                <div className="mp-sec">
                    <span className="mp-et">{t('appearance.title')}</span>
                    <ModeSegment />
                    <AccentPicker className="mp-acentos" />
                </div>
                <div className="mp-sec">
                    {toggles.map((toggle) => (
                        <ToggleRow
                            key={toggle.key}
                            label={toggle.label}
                            value={toggle.value}
                            onChange={toggle.set}
                        />
                    ))}
                    <div className="perfil-sw">
                        <span>{t('profile.language')}</span>
                        <div
                            className="seg"
                            role="group"
                            aria-label={t('profile.language')}
                        >
                            {locales.map((code) => (
                                <button
                                    key={code}
                                    lang={code}
                                    aria-pressed={locale === code}
                                    onClick={() => onChangeLocale(code)}
                                >
                                    {t(`language.${code}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mp-sec">
                    <Link
                        className="btn mini"
                        href={accountHref}
                        // El marco persiste entre páginas: al navegar, el menú se cierra.
                        onClick={() => setOpen(false)}
                    >
                        <UserRound />
                        {t('profile.account')}
                    </Link>
                </div>
                <div className="mp-pie">
                    <button
                        className="btn mini"
                        onClick={() => {
                            setOpen(false);
                            setUi({ dialog: 'shortcuts' });
                        }}
                    >
                        {t('shortcuts.title')} <kbd>?</kbd>
                    </button>
                    <button
                        className="btn mini"
                        onClick={() => {
                            setOpen(false);
                            onLogout();
                        }}
                        data-test="logout-button"
                    >
                        <LogOut />
                        {t('profile.logout')}
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
