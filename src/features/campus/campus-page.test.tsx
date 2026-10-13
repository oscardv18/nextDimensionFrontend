import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { setupI18n } from '@/i18n/setup';
import CampusPage from './campus-page';

beforeAll(async () => {
    await setupI18n('es');
});
afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

it('sin WebGL conserva seis departamentos, selección y regreso con Escape', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(
        <MemoryRouter>
            <CampusPage />
        </MemoryRouter>,
    );
    fireEvent.click(
        screen.getByRole('button', { name: 'Mostrar diagnóstico' }),
    );
    expect(screen.getByTestId('campus-viewport')).toHaveAttribute(
        'data-mode',
        'fallback',
    );
    expect(
        screen.getByRole('checkbox', { name: 'Órbita libre (depuración)' }),
    ).not.toBeChecked();
    expect(
        screen.getByRole('checkbox', { name: 'Órbita libre (depuración)' }),
    ).toBeDisabled();
    expect(
        screen.getByRole('checkbox', { name: 'Reservar espacio para panel' }),
    ).toBeDisabled();
    const departments = [
        'Compras',
        'Almacén',
        'Operaciones',
        'Ventas',
        'Administración',
        'Recursos Humanos',
    ];
    for (const department of departments) {
        const button = screen.getByRole('button', {
            name: department,
        });
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByTestId('campus-selection')).toHaveTextContent(
            department,
        );
    }
    expect(
        screen.getByRole('button', { name: 'Restaurar cubierta de Compras' }),
    ).toBeDisabled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('campus-selection')).toHaveTextContent(
        'Vista general',
    );
});

it('el diagnóstico se puede plegar mientras siguen disponibles el canvas y el regreso general', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(
        <MemoryRouter>
            <CampusPage />
        </MemoryRouter>,
    );
    expect(
        screen.queryByRole('button', { name: 'Compras' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Control' })).toHaveAttribute(
        'aria-pressed',
        'true',
    );
    const viewport = screen.getByTestId('campus-viewport');
    fireEvent.click(
        screen.getByRole('button', { name: 'Mostrar diagnóstico' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Compras' }));
    fireEvent.click(
        screen.getByRole('button', { name: 'Ocultar diagnóstico' }),
    );
    expect(screen.getByTestId('campus-viewport')).toBe(viewport);
    fireEvent.click(
        screen.getByRole('button', { name: 'Volver a vista general' }),
    );
    expect(screen.getByTestId('campus-selection')).toHaveTextContent(
        'Vista general',
    );
});

it('el Shell abre Compras desde «Atención ahora», cambia de pestaña y no simula la revisión', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(
        <MemoryRouter>
            <CampusPage />
        </MemoryRouter>,
    );
    expect(
        screen.getByRole('heading', { name: 'Atención ahora' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Datos de demostración').length).toBeGreaterThan(
        0,
    );
    fireEvent.click(
        screen.getByRole('button', { name: /4 compras por aprobar/ }),
    );
    expect(screen.getByTestId('campus-selection')).toHaveTextContent('Compras');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Compras',
    );
    // El panel cambia tras su transición de salida.
    expect(
        await screen.findByRole('tab', { name: /Solicitudes/ }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
        screen.getByRole('heading', { name: 'Insumos de cocina' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent(
        'Aprobar',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Revisar solicitud' }));
    expect(screen.getByText(/Prototipo:/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Órdenes/ }));
    expect(
        screen.getByRole('heading', { name: 'Empaques' }),
    ).toBeInTheDocument();
    // Los modos sin implementar se anuncian como tales y no navegan.
    expect(
        screen.getByRole('button', { name: 'Flujos · próximamente' }),
    ).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Control' }));
    expect(screen.getByTestId('campus-selection')).toHaveTextContent(
        'Vista general',
    );
});

it('el buscador enfoca departamentos y su Escape no devuelve la cámara', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(
        <MemoryRouter>
            <CampusPage />
        </MemoryRouter>,
    );
    const search = screen.getByRole('combobox', {
        name: 'Buscar o ir a un departamento',
    });
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: 'almacen' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(screen.getByTestId('campus-selection')).toHaveTextContent('Almacén');
    fireEvent.focus(search);
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(screen.getByTestId('campus-selection')).toHaveTextContent('Almacén');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('campus-selection')).toHaveTextContent(
        'Vista general',
    );
});

it('el selector del Shell actualiza la apariencia compartida y sus superficies sin WebGL', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(
        <MemoryRouter>
            <CampusPage />
        </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Apariencia' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Claro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.querySelector('.cc-root')).toHaveAttribute(
        'data-tone',
        'light',
    );
    expect(localStorage.getItem('appearance')).toBe('light');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Oscuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.querySelector('.cc-root')).toHaveAttribute(
        'data-tone',
        'dark',
    );
    expect(localStorage.getItem('appearance')).toBe('dark');
});

it('el menú de apariencia se recorre con el teclado y Escape devuelve el foco sin mover la cámara', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    localStorage.setItem('appearance', 'dark');
    render(
        <MemoryRouter>
            <CampusPage />
        </MemoryRouter>,
    );
    fireEvent.click(
        screen.getByRole('button', { name: 'Mostrar diagnóstico' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Compras' }));
    const trigger = screen.getByRole('button', { name: 'Apariencia' });
    fireEvent.click(trigger);
    // Al abrir se enfoca la opción marcada.
    expect(screen.getByRole('menuitemradio', { name: 'Oscuro' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitemradio', { name: 'Claro' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(
        screen.getByRole('menuitemcheckbox', { name: 'Movimiento reducido' }),
    ).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitemradio', { name: 'Oscuro' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByTestId('campus-selection')).toHaveTextContent('Compras');
});
