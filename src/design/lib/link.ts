import type { AnchorHTMLAttributes, ComponentType } from 'react';

/**
 * Enlace que inyecta la aplicación. `design` no conoce el enrutador: recibe el componente
 * (por ejemplo, un envoltorio del `Link` del router) y solo exige `href`.
 */
export type LinkComponent = ComponentType<
    AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
>;
