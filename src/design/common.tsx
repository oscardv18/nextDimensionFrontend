/* Piezas comunes portadas del prototipo (src/comun.tsx): identidad de cada departamento (icono y color
   funcional), estado semántico y marca neutra. El contrato llega en inglés; el CSS aprobado conserva sus
   clases en español, de ahí las tablas de correspondencia. */
import {
    BadgeCheck,
    Ban,
    Blocks,
    BookOpen,
    ChartColumnIncreasing,
    ChefHat,
    CircleCheck,
    ClipboardList,
    Clock,
    DoorOpen,
    Factory,
    GraduationCap,
    Landmark,
    Package,
    Receipt,
    ShieldCheck,
    ShoppingCart,
    TriangleAlert,
    Truck,
    Users,
    UtensilsCrossed,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
    DepartmentHue,
    DepartmentIcon as DepartmentIconName,
    PendingTone,
} from '@/data/contracts';

const ICONS: Record<DepartmentIconName, LucideIcon> = {
    factory: Factory,
    package: Package,
    sales: ChartColumnIncreasing,
    cart: ShoppingCart,
    landmark: Landmark,
    people: Users,
    blocks: Blocks,
    book: BookOpen,
    graduation: GraduationCap,
    door: DoorOpen,
    clipboard: ClipboardList,
    wallet: Wallet,
    shield: ShieldCheck,
    receipt: Receipt,
    truck: Truck,
    dining: UtensilsCrossed,
    chef: ChefHat,
};

export function DepartmentIcon({
    icon,
    className,
}: {
    icon: DepartmentIconName;
    className?: string;
}) {
    const Icon = ICONS[icon] ?? Package;

    return <Icon aria-hidden className={className} />;
}

const HUE_TOKEN: Record<DepartmentHue, string> = {
    violet: 'violeta',
    yellow: 'amarillo',
    green: 'verde',
    teal: 'turquesa',
    blue: 'azul',
    pink: 'rosa',
    indigo: 'indigo',
    orange: 'naranja',
};
export const hueColor = (hue: DepartmentHue) => `var(--${HUE_TOKEN[hue]})`;

/** Clase CSS aprobada para cada estado (e-*, insignia-n.*). */
export const TONE_CLASS: Record<PendingTone, string> = {
    blocked: 'bloqueo',
    warning: 'alerta',
    approval: 'aprobacion',
    waiting: 'espera',
    ok: 'ok',
};
export const LINK_CLASS = {
    accent: 'c-acento',
    orange: 'c-naranja',
    teal: 'c-turquesa',
    slate: 'c-pizarra',
} as const;

const TONE_ICON: Record<PendingTone, LucideIcon> = {
    blocked: Ban,
    warning: TriangleAlert,
    waiting: Clock,
    approval: BadgeCheck,
    ok: CircleCheck,
};

/** Estado: siempre icono + texto; el color nunca va solo. */
export function StatusChip({
    tone,
    text,
}: {
    tone: PendingTone;
    text?: string;
}) {
    const { t } = useTranslation();
    const Icon = TONE_ICON[tone];

    return (
        <span className={`estado e-${TONE_CLASS[tone]}`}>
            <Icon aria-hidden />
            {text ?? t(`tone.${tone}`)}
        </span>
    );
}

/** Marca: hexágono con cubo, en tinta neutra (negro en claro, blanco en oscuro). */
export const Logo = (props: { className?: string }) => (
    <svg viewBox="0 0 32 32" aria-hidden {...props}>
        <path
            d="M16 2.6 27.6 9.3v13.4L16 29.4 4.4 22.7V9.3Z"
            fill="currentColor"
        />
        <path
            d="M16 9.4 21.8 12.7v6.6L16 22.6l-5.8-3.3v-6.6Z"
            fill="var(--fondo)"
            opacity=".92"
        />
        <path
            d="M16 9.4v6.6l5.8-3.3M16 16l-5.8-3.3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            opacity=".55"
        />
    </svg>
);

export const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter((word) => word.length > 2 || /^[A-ZÁÉÍÓÚ]/.test(word))
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');

/** Rótulo de procedencia para todo lo que viene del proveedor de demostración. */
export function DemoBadge() {
    const { t } = useTranslation();

    return <span className="demo">{t('demo.badge')}</span>;
}
