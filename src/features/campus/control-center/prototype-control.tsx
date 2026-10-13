/*
 * Control visible pero sin integrar («próxima entrega»): se ve atenuado, anuncia su estado y no
 * ejecuta ninguna acción ficticia. Equivale a design/frame/soon.tsx, pero su aviso es CSS sobre la
 * superficie oscura del centro de control en lugar de un tooltip de Radix con el tema global.
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export function PrototypeControl({
    label,
    className,
    children,
    hint = 'top',
}: {
    label: string;
    className: string;
    children: ReactNode;
    hint?: 'top' | 'right' | 'bottom';
}) {
    const { t } = useTranslation();
    return (
        <button
            type="button"
            className={className}
            aria-disabled="true"
            aria-label={`${label} · ${t('soon.short')}`}
            data-prototype="true"
            data-hint={t('soon.tooltip', { label })}
            data-hint-side={hint}
            onClick={(event) => event.preventDefault()}
        >
            {children}
        </button>
    );
}
