/*
 * Contenido de las etiquetas espaciales. Se monta dentro de <Html> de drei, que crea su propia raíz de
 * React: por eso no usa hooks ni contexto y recibe los textos ya traducidos.
 */
import type { LucideIcon } from 'lucide-react';
import type { Tone } from './demo-data';
import { DepartmentIcon } from './icons';

export function SpatialLabel({
    id,
    name,
    status,
    tone,
}: {
    id: string;
    name: string;
    status: string;
    tone: Tone;
}) {
    return (
        <span className="cc-tag">
            <span className="cc-tag-card">
                <span className="cc-tag-icon">
                    <DepartmentIcon id={id} size={17} />
                </span>
                <span className="cc-tag-text">
                    <span className="cc-tag-name">{name}</span>
                    <span className="cc-tag-status">
                        <span className="cc-dot" data-tone={tone} />
                        {status}
                    </span>
                </span>
            </span>
            <span className="cc-tag-stem" aria-hidden="true" />
        </span>
    );
}

/* Punto de interés del interior de Compras (solicitudes, órdenes, recepción). */
export function SpatialHotspot({
    label,
    count,
    icon: Icon,
    active,
}: {
    label: string;
    count: number;
    icon: LucideIcon;
    active: boolean;
}) {
    return (
        <span className="cc-hotspot" data-active={active}>
            <span className="cc-hotspot-card">
                <Icon size={14} strokeWidth={1.7} aria-hidden="true" />
                {label} · <strong>{count}</strong>
            </span>
            <span className="cc-hotspot-pin" aria-hidden="true" />
        </span>
    );
}
