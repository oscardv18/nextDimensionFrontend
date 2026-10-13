import { createElement } from 'react';
import type { ComponentProps, ElementType } from 'react';
import { cn } from '@/design/lib/utils';

/** `as` recibe el enlace del enrutador (la capa `design` no lo conoce); por defecto, un ancla. */
type Props = ComponentProps<'a'> & { as?: ElementType; to?: string };

export default function TextLink({
    as: Component = 'a',
    className = '',
    children,
    ...props
}: Props) {
    // createElement evita la intersección de atributos DOM y Three.js en un componente polimórfico.
    return createElement(
        Component,
        {
            ...props,
            className: cn(
                'text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500',
                className,
            ),
        },
        children,
    );
}
