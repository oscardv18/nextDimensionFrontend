/* Tarjeta de selección (cristal), portada del prototipo: nombre, resumen, pendientes y acceso al departamento. */
import { ArrowRight, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DepartmentIcon, hueColor } from '@/design/common';
import { setUi } from '@/design/state/ui-state';
import { getAppearance } from '@/design/appearance/use-appearance';
import type { MapDepartmentData, PendingTone } from '@/data/contracts';
import { Sparkline } from './sparkline';

const TONE_COLOR: Record<PendingTone, string> = {
    blocked: 'var(--bloqueo-solido)',
    warning: 'var(--alerta-solido)',
    approval: 'var(--aprob)',
    waiting: 'var(--ok-solido)',
    ok: 'var(--ok-solido)',
};

export function SelectionCard({
    department: d,
    onOpenDepartment,
}: {
    department: MapDepartmentData;
    onOpenDepartment: (publicId: string) => void;
}) {
    const { t } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!getAppearance().reducedMotion) {
            ref.current?.animate(
                [
                    { opacity: 0, transform: 'translateY(10px)' },
                    { opacity: 1, transform: 'none' },
                ],
                { duration: 240, easing: 'cubic-bezier(.22,.8,.24,1)' },
            );
        }
    }, [d.publicId]);

    return (
        <div
            ref={ref}
            className="tarjeta-sel vidrio"
            role="region"
            aria-label={t('map.selected', { name: d.name })}
            style={{ ['--c' as string]: hueColor(d.hue) }}
        >
            <button
                className="icono-btn cerrar"
                aria-label={t('common.closeEsc')}
                onClick={() => setUi({ selection: null })}
            >
                <X />
            </button>
            <h2>
                <DepartmentIcon icon={d.icon} />
                {d.name}
            </h2>
            <p style={{ margin: '4px 0 0', color: 'var(--t3)', fontSize: 13 }}>
                {d.summary}
            </p>
            <div className="fila">
                <button
                    className="chip-p"
                    style={{ ['--c' as string]: TONE_COLOR[d.pending.worst] }}
                    onClick={() => onOpenDepartment(d.publicId)}
                >
                    <span className="pt" />
                    {t('pending.count', { count: d.pending.total })}
                    <ChevronRight size={16} />
                </button>
                {d.trend && d.trend.length > 1 && (
                    <Sparkline
                        values={d.trend}
                        label={t('map.trend', {
                            name: d.name,
                            from: d.trend[0],
                            to: d.trend[d.trend.length - 1],
                        })}
                    />
                )}
            </div>
            <button
                className="btn-prim"
                onClick={() => onOpenDepartment(d.publicId)}
            >
                {t('map.openDepartment')}
                <ArrowRight size={18} />
            </button>
        </div>
    );
}
