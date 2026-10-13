import { Link } from 'react-router';
import type { LinkComponent } from '@/design/lib/link';

/** Adaptador del `Link` del enrutador al contrato `LinkComponent` de `design`. */
export const RouterLink: LinkComponent = ({ href, ...props }) => (
    <Link to={href} {...props} />
);
