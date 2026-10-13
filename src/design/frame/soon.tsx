/* Control visible pero todavía no integrado: anuncia su estado y no ejecuta ninguna acción ficticia. */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/design/ui/tooltip';

export function Soon({
    label,
    className,
    children,
    side = 'bottom',
}: {
    label: string;
    className: string;
    children: ReactNode;
    side?: 'bottom' | 'right' | 'top';
}) {
    const { t } = useTranslation();
    const text = `${label} · ${t('soon.short')}`;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className={className}
                    aria-disabled="true"
                    aria-label={text}
                    onClick={(event) => event.preventDefault()}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent side={side} sideOffset={10}>
                {t('soon.tooltip', { label })}
            </TooltipContent>
        </Tooltip>
    );
}
