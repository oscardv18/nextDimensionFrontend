import { Link } from 'react-router';
import { routes } from './routes';

/** Ruta inexistente o departamento que no existe (el servidor original respondía 404). */
export function NotFound() {
    return (
        <div className="vacio grande" role="alert">
            <h1 style={{ margin: '0 0 6px', fontSize: 21 }}>404</h1>
            <Link to={routes.map()}>Arxnet</Link>
        </div>
    );
}
