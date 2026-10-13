/* Modo, acento, cristal y movimiento: controles compartidos por el menú de perfil y la configuración. */
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setUi, useUi } from '@/design/state/ui-state';
import { Switch } from '@/design/ui/switch';
import { ACCENTS, useAppearance } from '@/design/appearance/use-appearance';
import type { Accent, Appearance } from '@/design/appearance/use-appearance';

const ACCENT_SWATCH: Record<Accent, string> = {
    purple: '#7c3aed',
    red: '#dc2f57',
    blue: '#2f6cf0',
};
const MODES: [Appearance, typeof Sun][] = [
    ['light', Sun],
    ['dark', Moon],
    ['system', Monitor],
];

export function ModeSegment({ size = 14 }: { size?: number }) {
    const { t } = useTranslation();
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div
            className="seg ancho"
            role="group"
            aria-label={t('appearance.mode')}
        >
            {MODES.map(([mode, Icon]) => (
                <button
                    key={mode}
                    aria-pressed={appearance === mode}
                    onClick={() => updateAppearance(mode)}
                >
                    <Icon size={size} />
                    {t(`appearance.${mode}`)}
                </button>
            ))}
        </div>
    );
}

export function AccentPicker({
    className,
}: {
    className: 'mp-acentos' | 'acentos';
}) {
    const { t } = useTranslation();
    const { accent, updateAccent } = useAppearance();

    return (
        <div
            className={className}
            role="radiogroup"
            aria-label={t('appearance.accent')}
        >
            {ACCENTS.map((key) => (
                <button
                    key={key}
                    role="radio"
                    aria-checked={accent === key}
                    onClick={() => updateAccent(key)}
                    style={{ ['--m' as string]: ACCENT_SWATCH[key] }}
                >
                    <i />
                    {t(`appearance.accent.${key}`)}
                </button>
            ))}
        </div>
    );
}

/** Interruptores de cristal, movimiento reducido y pausa del mapa. */
export function useMotionToggles() {
    const { t } = useTranslation();
    const { glass, reducedMotionPreference, updateGlass, updateReducedMotion } =
        useAppearance();
    const paused = useUi((s) => s.paused);

    return [
        {
            key: 'glass',
            label: t('appearance.glass'),
            help: t('appearance.glassHelp'),
            value: glass,
            set: updateGlass,
        },
        {
            key: 'motion',
            label: t('motion.reduced'),
            help: t('motion.reducedHelp'),
            value: reducedMotionPreference,
            set: updateReducedMotion,
        },
        {
            key: 'pause',
            label: t('motion.pauseMap'),
            help: t('motion.pauseAmbientHelp'),
            value: paused,
            set: (v: boolean) => setUi({ paused: v }),
        },
    ] as const;
}

export function ToggleRow({
    label,
    value,
    onChange,
}: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <label className="perfil-sw">
            <span>{label}</span>
            <Switch
                checked={value}
                onCheckedChange={onChange}
                aria-label={label}
            />
        </label>
    );
}
