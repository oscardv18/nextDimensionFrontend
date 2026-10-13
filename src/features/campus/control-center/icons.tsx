/* Iconografía única del centro de control: etiquetas, panel y buscador usan el mismo icono por área. */
import {
    Box,
    ChefHat,
    FileText,
    ShoppingCart,
    Users,
    Warehouse,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DepartmentId } from './demo-data';

export const departmentIcons: Record<DepartmentId, LucideIcon> = {
    'shared.procurement': Box,
    'shared.warehouse': Warehouse,
    'shared.operations': ChefHat,
    'shared.sales': ShoppingCart,
    'shared.administration': FileText,
    'shared.human-resources': Users,
};

export function DepartmentIcon({
    id,
    size = 18,
}: {
    id: string;
    size?: number;
}) {
    const Icon = departmentIcons[id as DepartmentId] ?? Box;
    return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
