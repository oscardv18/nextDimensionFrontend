import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import BaseTextLink from '@/design/forms/text-link';

/** Enlace de texto de la aplicación: el estilo es de `design`, la navegación es del enrutador. */
export default function TextLink({
    href,
    ...props
}: Omit<ComponentProps<typeof BaseTextLink>, 'as' | 'to'> & { href: string }) {
    return <BaseTextLink as={Link} to={href} {...props} />;
}
